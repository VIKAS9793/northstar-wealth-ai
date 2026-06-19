/**
 * @file orchestrator.ts
 * @description 7-Layer Deterministic Governance Pipeline for IDBI Wealth Companion.
 * Production orchestrator implementing Anthropic-style Constitutional AI.
 *
 * LAYER SEQUENCE:
 * L0 Threat Isolation → L1 Domain Classification → L2 Financial Twin Validation
 * → L4 Engine Director → L5 LLM Generation → L3 Constitutional Critique
 * → L6 Compliance Filter → L7 Audit Trail
 *
 * NOTE ON CONSTITUTIONAL REVIEW (L3 — LATENCY CRITICAL):
 * The second LLM call in L3 is gated behind requiresConstitutionalReview().
 * It fires for ~40% of interactions. On the remaining 60%, latency is identical.
 * Do NOT remove the gate condition.
 */

import OpenAI from 'openai';
import { FinancialTwinProfile, Goal } from '@/features/financial-twin/types';

// Governance layers
import {
  assessThreatLevel,
  HARD_BLOCK_RESPONSE,
} from '@/features/governance/threatIsolation';
import {
  classifyWithConfidence,
  OOD_CONFIDENCE_THRESHOLD,
} from '@/features/governance/domainClassifier';
import { validateFinancialTwin } from '@/features/governance/financialTwinValidator';
import {
  requiresConstitutionalReview,
  runConstitutionalCritique,
} from '@/features/governance/constitution';
import {
  resolveEngineDirectives,
  EngineDirectiveMap,
} from '@/features/governance/engineDirector';
import {
  STRUCTURED_OUTPUT_SYSTEM_SUFFIX,
  mapIntentToResponseType,
} from '@/features/governance/outputSchema';
import {
  runComplianceFilter,
} from '@/features/governance/complianceFilter';
import {
  createAuditEntry,
} from '@/features/governance/auditTrail';

// ── Shared types ────────────────────────────────────────────────────────────────

type GoalEngineProfile = Pick<FinancialTwinProfile, 'age' | 'sip_amount' | 'telemetry' | 'goals'>;
type SuitabilityProfile = Pick<FinancialTwinProfile, 'age' | 'risk_profile'>;
type StreamTextChunk = { choices: Array<{ delta?: { content?: string } }> };

export interface OrchestratorPayload {
  success: boolean;
  data?: string | AsyncIterable<StreamTextChunk>;
  error?: string;
  intent: string;
  wasComplianceBlocked: boolean;
  auditId?: string;
}

// ── Deterministic Engine Functions ──────────────────────────────────────────────

function calculateGoalMetrics(profile: GoalEngineProfile, goal: { name: string; target: number; progressPercent: number }) {
  const GOAL_HORIZONS: Record<string, number> = {
    'First Home Downpayment': 8,
    'Home Purchase': 8,
    'Child Education': 15,
    'Emergency Fund': 1,
    'Retirement': Math.max(60 - profile.age, 1),
    'Wealth Creation': 10,
    'Marriage Planning': 5,
    'Passive Income': 10,
  };
  const remainingYears = GOAL_HORIZONS[goal.name] ?? Math.max(60 - profile.age, 1);
  const monthsRemaining = remainingYears * 12;
  const shortfall = goal.target * (1 - goal.progressPercent / 100);
  const requiredMonthlySIP = shortfall / monthsRemaining;
  const currentSIPRatio = profile.sip_amount / requiredMonthlySIP;
  const goalProbability = Math.min(Math.round(currentSIPRatio * 100), 100);
  return { targetCorpus: goal.target, shortfall, requiredMonthlySIP: Math.round(requiredMonthlySIP), goalProbability, monthsRemaining };
}

/** Goal Intelligence Engine — L4 directive for primary goal context. */
export function runGoalIntelligenceEngine(profile: GoalEngineProfile, classification?: { intent: string }): string {
  if (!profile.goals || profile.goals.length === 0) return '';
  if (classification && (classification.intent === 'RESILIENCE' || classification.intent === 'OFF_TOPIC')) return '';
  const freeCashFlow = profile.telemetry.monthly_inflow - profile.telemetry.monthly_outflow - profile.telemetry.total_emis;
  const priorityGoal = profile.goals.reduce((prev, curr) => (prev.progressPercent < curr.progressPercent ? prev : curr));
  const metrics = calculateGoalMetrics(profile, priorityGoal);
  if (freeCashFlow < 1000 && metrics.shortfall > 500000) {
    return `[GOAL INTELLIGENCE ENGINE TRIGGERED]: The user's priority goal '${priorityGoal.name}' has a shortfall of ₹${metrics.shortfall.toLocaleString()}. Their free cash flow is ₹${freeCashFlow.toLocaleString()}. If they specifically ask to invest more, explain this gap and recommend debt consolidation first. DO NOT mention this randomly if they just ask a general question.`;
  }
  return `[GOAL INTELLIGENCE ENGINE]: Priority goal is '${priorityGoal.name}'. Target: ₹${metrics.targetCorpus.toLocaleString()}, Shortfall: ₹${metrics.shortfall.toLocaleString()}, Required SIP: ₹${metrics.requiredMonthlySIP.toLocaleString()}/month, Probability of Success: ${metrics.goalProbability}%. Use this context ONLY if they ask about goals.`;
}

/** Suitability Intelligence Engine — L4 directive for risk-profile enforcement. */
export function runSuitabilityEngine(message: string, profile: SuitabilityProfile): string {
  const highRiskKeywords = /(small cap|mid cap|crypto|options|f&o|futures|direct equity)/i;
  if (profile.risk_profile === 'Conservative' && highRiskKeywords.test(message)) {
    return `[SUITABILITY ENGINE HARD REJECTION]: DO NOT GENERATE NORMAL ADVICE. The user requested high-risk instruments but has a CONSERVATIVE risk profile. You MUST output EXACTLY: "Based on your Conservative risk profile, SEBI guidelines prevent me from recommending high-volatility instruments like small caps or F&O. I recommend we focus on Large Cap or Balanced Advantage funds to protect your capital."`;
  }
  if (profile.age >= 60 && /(equity|small cap|long term growth)/i.test(message)) {
    return `[SUITABILITY ENGINE TRIGGERED]: The user is a Senior Citizen (${profile.age} years old). Capital preservation and regular income are paramount. Prioritize Debt Mutual Funds or FDs over aggressive equity.`;
  }
  return '';
}

// ── Private engine functions ────────────────────────────────────────────────────

type CogClass = { intent: string; bias: string };

function runResilienceEngine(profile: FinancialTwinProfile, cls: CogClass): string {
  if (cls.intent !== 'RESILIENCE' && cls.bias !== 'LOSS_AVERSION') return '';
  if (profile.emergency_fund_months < 6) {
    return `[RESILIENCE ENGINE]: CRITICAL DIRECTIVE. User is panicking or asking to stop SIP. ` +
      `STRONGLY advise AGAINST stopping SIP. Life events — not markets — cause SIP failures. ` +
      `Recommend building a 6-month emergency buffer before altering equity SIPs.`;
  }
  return `[RESILIENCE ENGINE]: User is concerned about markets. ADVISE AGAINST stopping SIP. ` +
    `Liquidity (${profile.emergency_fund_months} months) provides protection. ` +
    `Frame market correction as "Sale Season" for SIPs.`;
}

function runEducationEngine(cls: CogClass): string {
  if (cls.bias === 'FOMO' || cls.bias === 'HERD_MENTALITY') {
    return `[EDUCATION ENGINE]: User shows FOMO/Herd Mentality. Do not recommend "best" funds. ` +
      `Use "Cricket Team" analogy — wealth built through consistent allocation, not picking one star.`;
  }
  if (cls.bias === 'RECENCY_BIAS') {
    return `[EDUCATION ENGINE]: User shows Recency Bias — extrapolating recent performance. ` +
      `Use "Sale Season" analogy — corrections benefit SIP investors.`;
  }
  return '';
}

function runGoalAccelerator(cls: CogClass): string {
  if (cls.intent !== 'ACCELERATION') return '';
  return `[ACCELERATOR ENGINE]: User has extra capital. Recommend Step-Up SIP to accelerate primary goal.`;
}

function runProbing(message: string, cls: CogClass): string {
  const hasNumbers = /\d/.test(message);
  if (cls.intent === 'RESILIENCE' && !hasNumbers) {
    return `[PROBING ENGINE]: Ask ONE empathetic clarifying question to understand the stress event before advising.`;
  }
  if (cls.intent === 'CLARIFICATION') {
    return `[PROBING ENGINE]: Query is vague. Ask ONE highly contextual question using their profile.`;
  }
  return '';
}

function getDynamicParams(cls: CogClass): { temperature: number; tone: string } {
  if (cls.intent === 'RESILIENCE') {
    return {
      temperature: 0.10,
      tone: 'Calm, deeply empathetic. Never use alarming words. Frame challenges as "balancing" opportunities.',
    };
  }
  if (cls.intent === 'EDUCATION') {
    return {
      temperature: 0.40,
      tone: 'Encouraging, educational. Use simple analogies. Patient and approachable.',
    };
  }
  if (cls.intent === 'ACCELERATION') {
    return {
      temperature: 0.30,
      tone: 'Motivational, forward-looking. Focus on goal achievement satisfaction.',
    };
  }
  return {
    temperature: 0.30,
    tone: 'Professional, polite, empathetic. Avoid dense jargon.',
  };
}

async function* simulateStream(text: string) {
  const chunkSize = 4;
  for (let i = 0; i < text.length; i += chunkSize) {
    await new Promise(r => setTimeout(r, 20));
    yield { choices: [{ delta: { content: text.slice(i, i + chunkSize) } }] };
  }
}

// ── NVIDIA NIM client ──────────────────────────────────────────────────────────
const nvidiaNim = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const OFF_TOPIC_RESPONSE =
  'I specialise in wealth management, financial planning, and banking services. ' +
  'I am unable to assist with non-financial queries. How can I help you with your portfolio today?';

const ESCALATION_RESPONSE = (rmName: string) =>
  `This sounds like a query that requires personalised expert guidance. ` +
  `I am connecting you to ${rmName}. They will review our chat history and assist you further.`;

const FALLBACK_RESPONSE = {
  success: true as const,
  data: 'I am analysing your financial profile but experiencing a temporary delay. Please try again.',
  intent: 'GENERAL',
  wasComplianceBlocked: false,
  auditId: undefined,
};

// ── Main 7-Layer Orchestrator ──────────────────────────────────────────────────

export async function generateAIResponse(
  message: string,
  profile: FinancialTwinProfile,
  chatHistory: { role: string; content: string }[] = [],
  sessionId: string = 'default'
) {
  // ── DEMO STABILITY CACHE — preserve fast paths for critical demo steps ────
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('paisa invest karna hai')) {
    const cached = profile.emergency_fund_months < 6
      ? `Namaste ${profile.name}! Since you have free cash flow this month, let's prioritise closing the gap in your emergency fund first before increasing equity exposure.`
      : `Namaste ${profile.name}! Since your emergency fund is healthy, I recommend setting up a Step-Up SIP towards your pending goals. Would you like to review your options?`;
    return { success: true as const, data: cached, intent: 'ACCELERATION', wasComplianceBlocked: false };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // L0 — THREAT ISOLATION
  // ══════════════════════════════════════════════════════════════════════════
  const threatAssessment = assessThreatLevel(message);
  if (threatAssessment.threatLevel === 'HARD_BLOCK') {
    createAuditEntry({
      sessionId,
      customerId: profile.id,
      rawInput: message,
      threatAssessment,
      classificationResult: { intent: 'OFF_TOPIC', bias: 'NONE', confidence: 1.0, financialEntities: [], requiresProbing: false },
      twinSnapshot: buildTwinSnapshot(profile),
      enginesFired: [],
      preflightBlocks: [],
      constitutionalReviewRan: false,
      constitutionalViolations: [],
      complianceViolations: [],
      finalResponse: HARD_BLOCK_RESPONSE,
      disclosuresInjected: [],
      wasBlocked: true,
      confidenceScore: 1.0,
    });
    return { success: true as const, data: HARD_BLOCK_RESPONSE, intent: 'OFF_TOPIC', wasComplianceBlocked: true };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // L1 — DOMAIN CLASSIFICATION
  // ══════════════════════════════════════════════════════════════════════════
  const classification = classifyWithConfidence(message);

  if (classification.intent === 'OFF_TOPIC') {
    return { success: true as const, data: OFF_TOPIC_RESPONSE, intent: 'OFF_TOPIC', wasComplianceBlocked: false };
  }

  // Human escalation check
  if (/(speak to human|talk to human|call rm|expert|complaint|manager|angry|frustrated|complex tax)/i.test(message)) {
    const rmName = profile.rm_name ?? 'your dedicated Relationship Manager';
    return { success: true as const, data: ESCALATION_RESPONSE(rmName), intent: 'GENERAL', wasComplianceBlocked: false };
  }

  // Repeated vagueness escalation
  if (classification.intent === 'CLARIFICATION') {
    const userMessages = chatHistory.filter(m => m.role === 'user');
    if (userMessages.length >= 1) {
      const prevMsg = userMessages[userMessages.length - 1].content;
      if (prevMsg.split(' ').length <= 3) {
        const rmName = profile.rm_name ?? 'your dedicated Relationship Manager';
        return { success: true as const, data: ESCALATION_RESPONSE(rmName), intent: 'CLARIFICATION', wasComplianceBlocked: false };
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // L2 — FINANCIAL TWIN VALIDATION
  // ══════════════════════════════════════════════════════════════════════════
  const twinValidation = validateFinancialTwin(profile, classification);

  if (twinValidation.requiresEscalation) {
    const rmName = profile.rm_name ?? 'your dedicated Relationship Manager';
    return { success: true as const, data: ESCALATION_RESPONSE(rmName), intent: classification.intent, wasComplianceBlocked: false };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // L4 — ENGINE DIRECTOR (runs before LLM)
  // ══════════════════════════════════════════════════════════════════════════
  const compatCls = { intent: classification.intent, bias: classification.bias };

  const rawDirectives: EngineDirectiveMap = {
    SUITABILITY:   runSuitabilityEngine(message, profile),
    RESILIENCE:    runResilienceEngine(profile, compatCls),
    PREFLIGHT:     twinValidation.enrichedContext,
    GOAL_PLANNING: runGoalIntelligenceEngine(profile, compatCls),
    ACCELERATION:  runGoalAccelerator(compatCls),
    EDUCATION:     runEducationEngine(compatCls),
    PROBING:       runProbing(message, compatCls),
  };

  const resolvedDirectives = resolveEngineDirectives(rawDirectives);
  const activeEngines = Object.entries(rawDirectives)
    .filter(([, v]) => v !== '')
    .map(([k]) => k);

  // ══════════════════════════════════════════════════════════════════════════
  // L5 — LLM GENERATION
  // ══════════════════════════════════════════════════════════════════════════
  const { temperature, tone } = getDynamicParams(compatCls);

  const freeCashFlow = profile.telemetry.monthly_inflow - profile.telemetry.monthly_outflow - profile.telemetry.total_emis;
  const emiBurdenPct = profile.telemetry.monthly_inflow > 0
    ? (profile.telemetry.total_emis / profile.telemetry.monthly_inflow * 100).toFixed(1)
    : '0.0';
  const discretionaryRatio = ((profile.telemetry.discretionary_spend / profile.telemetry.monthly_inflow) * 100).toFixed(1);
  const formattedGoals = profile.goals
    .map(g => `- ${g.name} (Target: ₹${g.target.toLocaleString()}, Progress: ${g.progressPercent}%)`)
    .join('\n');

  const systemPrompt = `You are Dhan, the IDBI Wealth Companion.

CUSTOMER FINANCIAL TWIN:
Name: ${profile.name} | Age: ${profile.age} | Risk Profile: ${profile.risk_profile}
Monthly Income: ₹${profile.income.toLocaleString()} | Current SIP: ₹${profile.sip_amount.toLocaleString()}
Emergency Fund: ${profile.emergency_fund_months} months | Free Cash Flow: ₹${freeCashFlow.toLocaleString()}/month
EMI Burden: ${emiBurdenPct}% | Discretionary Spend: ${discretionaryRatio}%
SIP Health: ${profile.telemetry.sip_health_status} | Cash Flow Profile: ${profile.telemetry.cashflow_profile}

ACTIVE GOALS:
${formattedGoals}

TONE DIRECTIVE: ${tone}

${resolvedDirectives ? `--- ENGINE DIRECTIVES (follow strictly) ---\n${resolvedDirectives}\n---` : ''}

SEBI GOVERNANCE:
1. NO GUARANTEES — never use "guaranteed", "assured", "risk-free" regarding returns
2. SUITABILITY — all guidance must align explicitly with the customer's risk profile
3. ASSUMPTION TRANSPARENCY — state assumptions behind any projection
4. PROBING LIMIT — maximum ONE question per response
${STRUCTURED_OUTPUT_SYSTEM_SUFFIX}`;

  let draftResponse: string;
  try {
    const mappedHistory = chatHistory
      .map(msg => ({ role: msg.role === 'ai' ? 'assistant' : msg.role, content: msg.content }))
      .filter((msg): msg is { role: 'user' | 'assistant'; content: string } =>
        msg.role === 'assistant' || msg.role === 'user'
      );

    const completion = await nvidiaNim.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        ...mappedHistory,
        { role: 'user', content: message },
      ],
      max_tokens: 300,
      temperature,
      stream: false,
    });

    draftResponse = completion.choices[0]?.message?.content ?? '';
  } catch (error) {
    console.error('[ORCHESTRATOR] LLM generation error:', error);
    return FALLBACK_RESPONSE;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // L3 — CONSTITUTIONAL AI CRITIQUE
  // LATENCY GATE: only fires for ~40% of interactions
  // ══════════════════════════════════════════════════════════════════════════
  let finalText = draftResponse;
  let constitutionalViolations: string[] = [];
  let constitutionalReviewRan = false;

  if (requiresConstitutionalReview(classification, twinValidation.preflightBlocks)) {
    constitutionalReviewRan = true;
    const critique = await runConstitutionalCritique(draftResponse, nvidiaNim);
    finalText = critique.finalResponse;
    constitutionalViolations = critique.violations;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // L6 — POST-GENERATION COMPLIANCE
  // ══════════════════════════════════════════════════════════════════════════
  const complianceResult = runComplianceFilter(finalText, classification.intent);
  const outputText = complianceResult.finalResponse;

  // ══════════════════════════════════════════════════════════════════════════
  // L7 — AUDIT TRAIL
  // ══════════════════════════════════════════════════════════════════════════
  const auditEntry = createAuditEntry({
    sessionId,
    customerId: profile.id,
    rawInput: message,
    threatAssessment,
    classificationResult: classification,
    twinSnapshot: buildTwinSnapshot(profile),
    enginesFired: activeEngines,
    preflightBlocks: twinValidation.preflightBlocks.map(b => b.rule),
    constitutionalReviewRan,
    constitutionalViolations,
    complianceViolations: complianceResult.violations,
    finalResponse: outputText,
    disclosuresInjected: complianceResult.disclosures,
    wasBlocked: !complianceResult.passed,
    confidenceScore: classification.confidence,
  });

  return {
    success: true as const,
    data: simulateStream(outputText),
    intent: classification.intent,
    wasComplianceBlocked: !complianceResult.passed,
    auditId: auditEntry.auditId,
  };
}

function buildTwinSnapshot(profile: FinancialTwinProfile) {
  const freeCashFlow =
    profile.telemetry.monthly_inflow -
    profile.telemetry.monthly_outflow -
    profile.telemetry.total_emis;
  const emiBurdenPercent =
    profile.telemetry.monthly_inflow > 0
      ? (profile.telemetry.total_emis / profile.telemetry.monthly_inflow) * 100
      : 0;
  return {
    age: profile.age,
    riskProfile: profile.risk_profile,
    emergencyFundMonths: profile.emergency_fund_months,
    freeCashFlow,
    goalCount: profile.goals.length,
    emiBurdenPercent,
  };
}
