/**
 * @layer L3 — Constitutional AI Critique
 * [Last Updated: 2026-06-24T18:41:02+05:30]
 * @description Implements Constitutional AI self-critique methodology
 * for financial advisory compliance. The LLM critiques its own draft response
 * against 9 inviolable financial advice principles before the customer sees it.
 *
 * LATENCY CONTROL — CRITICAL:
 * This layer makes a SECOND LLM call. It MUST only fire when
 * requiresConstitutionalReview() returns true. Do NOT call runConstitutionalCritique
 * on every message. The gate conditions cover approximately 40% of real interactions.
 *
 * Implementation: stream: false, temperature: 0.05, max_tokens: 400
 * On any failure (network, parse, timeout): passes original draft through.
 * Never blocks the response pipeline.
 */

import OpenAI from 'openai';
import { ClassificationResult } from './domainClassifier';
import { PreflightBlock } from './financialTwinValidator';

export interface ConstitutionalReviewResult {
  violations: string[];
  requiresRevision: boolean;
  revisedResponse: string | null;
  confidenceInCompliance: number;
  originalDraft: string;
  finalResponse: string;
  reviewRan: boolean;
}

/**
 * The 9-principle financial advice constitution.
 * Adapted from SEBI IA Regulations + AMFI investor protection guidelines.
 */
export const WEALTH_ADVISORY_CONSTITUTION = `
You are a Constitutional AI Reviewer for a SEBI-aware Indian bank wealth management system.
Evaluate the DRAFT RESPONSE below against these 9 inviolable principles.

FINANCIAL ADVICE CONSTITUTION:

PRINCIPLE 1 — NO GUARANTEES (Absolute)
The response must not contain guaranteed, assured, risk-free, certain, or definite 
return expectations — including IMPLIED certainty through phrases like "this fund will",
"you will definitely", "you are sure to", "cannot fail".

PRINCIPLE 2 — SUITABILITY SUPREMACY  
Every recommendation must connect explicitly to the customer's stated risk profile.
A Conservative customer must never receive an equity-heavy recommendation without a 
prominent suitability caveat. Silence on suitability = violation.

PRINCIPLE 3 — DISCLOSURE COMPLETENESS
Any reference to past performance, projected returns, or investment outcomes must 
include "based on historical data", "subject to market risk", or equivalent.
Omitting risk disclosure when projections are mentioned = violation.

PRINCIPLE 4 — NO SPECIFIC SECURITIES ENDORSEMENT
The response must not name specific mutual fund schemes, stocks, or securities as 
"best", "top", "recommended", or "number one" without explicit suitability grounding.

PRINCIPLE 5 — ASSUMPTION TRANSPARENCY
If the response contains a financial projection (corpus, SIP amount, goal probability),
it must state the assumptions underlying that calculation.
Hidden assumptions in projections = violation.

PRINCIPLE 6 — EMOTIONAL NEUTRALITY UNDER STRESS
If the customer appears to be in a fear or panic state, the response must NOT use
terms that amplify stress: "crash", "collapse", "danger", "emergency", "disaster".
Reframe as: "correction", "volatility", "balancing", "optimisation opportunity".

PRINCIPLE 7 — RM ESCALATION AVAILABILITY
For complex, multi-goal, or emotionally charged queries, the response should include 
a pathway to a human Relationship Manager. The AI must not present itself as the 
sole and final advisory resource.

PRINCIPLE 8 — HONEST CAPABILITY CLAIMS
The response must not claim access to real-time market data, live NAV prices, 
live portfolio valuations, or SEBI regulatory approvals the system does not hold.

PRINCIPLE 9 — ACCESSIBLE LANGUAGE & NO INTERNAL JARGON
The response must use simple, accessible language to explain market risks and investment concepts.
It must NEVER use the internal system term "Financial Twin"; use "financial profile" or "financial situation" instead.
Avoid complex financial jargon to ensure the advice is easily understandable for all retail investors.

EVALUATION TASK:
Review the DRAFT RESPONSE against all 9 principles.
Output ONLY valid JSON — no explanation, no preamble, no markdown:
{
  "violations": ["PRINCIPLE N: brief explanation"] or [],
  "requires_revision": true or false,
  "revised_response": "corrected response text" or null,
  "confidence_in_compliance": 0.0 to 1.0
}
`;

/**
 * Gate condition — determines if constitutional review should run for this interaction.
 * Returns false for low-risk intents (CLARIFICATION, OFF_TOPIC, low-entity GENERAL)
 * to avoid unnecessary latency. Approximately 40% of interactions will pass this gate.
 */
export function requiresConstitutionalReview(
  classification: ClassificationResult,
  preflightBlocks: PreflightBlock[]
): boolean {
  // Always review if a HARD_STOP block is present — highest governance risk
  if (preflightBlocks.some(b => b.severity === 'HARD_STOP')) return true;

  // Always review high-stakes advisory intents
  if (['SUITABILITY_CHECK', 'GOAL_PLANNING', 'ACCELERATION'].includes(classification.intent)) {
    return true;
  }

  // Always review when behavioral bias is detected — emotional resonance risk
  if (classification.bias !== 'NONE') return true;

  // Skip for low-risk intents with no financial entities
  if (
    ['CLARIFICATION', 'OFF_TOPIC'].includes(classification.intent) ||
    (classification.intent === 'GENERAL' && classification.financialEntities.length === 0)
  ) {
    return false;
  }

  return false;
}

/**
 * Runs Constitutional AI critique on a draft response.
 * IMPORTANT: Only call this after requiresConstitutionalReview() returns true.
 * On any error or JSON parse failure, returns the original draft unchanged.
 * Never throws. Never blocks.
 */
export async function runConstitutionalCritique(
  draftResponse: string,
  nvidiaNimClient: OpenAI
): Promise<ConstitutionalReviewResult> {
  const reviewPrompt =
    WEALTH_ADVISORY_CONSTITUTION +
    `\n\nDRAFT RESPONSE TO EVALUATE:\n"${draftResponse}"\n\nOutput your JSON review:`;

  try {
    // 20-second timeout for constitutional review — must not block streaming
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Constitutional review timeout')), 20000)
    );

    const reviewPromise = nvidiaNimClient.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: reviewPrompt }],
      max_tokens: 400,
      temperature: 0.05, // Near-zero for deterministic critique
      stream: false,     // MUST be false — we need the complete critique before responding
    });

    const result = await Promise.race([reviewPromise, timeoutPromise]);
    if (!result) throw new Error('Constitutional review timed out');

    const raw = (result as OpenAI.Chat.Completions.ChatCompletion)
      .choices[0]?.message?.content ?? '{}';

    let parsed: {
      violations?: string[];
      requires_revision?: boolean;
      revised_response?: string | null;
      confidence_in_compliance?: number;
    };

    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // JSON parse failure — treat as compliant, pass draft through
      console.warn('[L3-CONSTITUTION] JSON parse failed — passing draft through');
      return buildPassthrough(draftResponse);
    }

    const requiresRevision = !!parsed.requires_revision && !!parsed.revised_response;
    const finalResponse =
      requiresRevision && parsed.revised_response
        ? parsed.revised_response
        : draftResponse;

    if (parsed.violations && parsed.violations.length > 0) {
      console.warn(`[L3-CONSTITUTION] Violations detected: ${parsed.violations.join(' | ')}`);
    } else {
      console.log(`[L3-CONSTITUTION] Compliant | confidence: ${(parsed.confidence_in_compliance ?? 0.8).toFixed(2)}`);
    }

    return {
      violations: parsed.violations ?? [],
      requiresRevision,
      revisedResponse: parsed.revised_response ?? null,
      confidenceInCompliance: parsed.confidence_in_compliance ?? 0.8,
      originalDraft: draftResponse,
      finalResponse,
      reviewRan: true,
    };
  } catch (error) {
    // Network error, timeout, or any unexpected failure — never block
    console.warn('[L3-CONSTITUTION] Review failed, passing draft through:', error);
    return buildPassthrough(draftResponse);
  }
}

function buildPassthrough(draft: string, reviewRan: boolean = true): ConstitutionalReviewResult {
  return {
    violations: [],
    requiresRevision: false,
    revisedResponse: null,
    confidenceInCompliance: 0.70,
    originalDraft: draft,
    finalResponse: draft,
    reviewRan,
  };
}
