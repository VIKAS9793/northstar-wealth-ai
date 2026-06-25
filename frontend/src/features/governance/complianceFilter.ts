/**
 * @layer L6 — Post-Generation Compliance Filter
 * [Last Updated: 2026-06-24T18:41:02+05:30]
 * @description Intent-aware compliance check and SEBI disclosure injection.
 * Upgrades the 2-pattern regex with 10 prohibited term patterns, a whitelist
 * for protective phrasing, and mandatory disclosure templates per intent type.
 * Runs AFTER LLM generation. No LLM call.
 */

import { IntentType } from './domainClassifier';
import { FinancialMetrics } from './outputSchema';
import { TAX_ESCALATION_RESPONSE } from './taxRules';

export interface ComplianceResult {
  passed: boolean;
  violations: string[];
  finalResponse: string;
  disclosures: string[];
  wasReplaced: boolean;
}

// Absolute prohibited terms — any match (not whitelisted) triggers violation
const PROHIBITED_PATTERNS: RegExp[] = [
  /\bguaranteed?\b/i,
  /\bassured?\b/i,
  /\bpromise(s|d)?\b/i,
  /\brisk.?free\b/i,
  /\b100%.?safe\b/i,
  /\bsure.?shot\b/i,
  /\bcannot? lose\b/i,
  /\bno risk\b/i,
  /\bwill definitely (earn|get|make|grow|return|give)\b/i,
  /\byou (will|are going to) (definitely|certainly|surely) (earn|profit|gain|get)\b/i,
];

// Protective phrasing — these whitelist a phrase from the prohibited check
const WHITELIST_PATTERNS: RegExp[] = [
  /cannot guarantee/i,
  /no guarantee/i,
  /not guaranteed/i,
  /not assured/i,
  /subject to market risk/i,
  /past performance/i,
  /based on historical/i,
];

// Prohibited advisory overreach — specific fund endorsement without grounding
const ADVISORY_OVERREACH_PATTERNS: RegExp[] = [
  /\bbest fund\b/i,
  /\btop fund\b/i,
  /\bnumber.?one fund\b/i,
  /\bno\.?\s?1 fund\b/i,
  /\bbest performing fund\b/i,
  /\bbuy (this|that|the) fund\b/i,
];

// Prohibited tax advisory — scanning LLM output for tax calculation phrases
const ADVISORY_TAX_OVERREACH_PATTERNS: RegExp[] = [
  /\byour tax liability is\b/i,
  /\byour taxable amount is\b/i,
  /\byou (will|need to) pay .* in taxes\b/i,
  /\btax you owe is\b/i,
  /\byou should claim under section\b/i,
  /\byour total tax outgo\b/i,
  /\btax calculation.*\₹\b/i,
];

// Mandatory disclosures per intent — injected below every response
const MANDATORY_DISCLOSURES: Partial<Record<IntentType, string>> = {
  GOAL_PLANNING:
    'Projections are illustrative, based on assumed rates of return, and are not guaranteed. ' +
    'Mutual fund investments are subject to market risk. Please read all scheme-related documents before investing.',

  RESILIENCE:
    'Past market performance is not indicative of future results. ' +
    'SIP continuity decisions should align with your long-term financial plan, not short-term market movements.',

  ACCELERATION:
    'Step-up SIP recommendations are based on your current financial profile. ' +
    'Actual returns may vary. Please consult your dedicated Relationship Manager for personalised guidance.',

  SUITABILITY_CHECK:
    'This guidance reflects your registered risk profile. ' +
    'To revise your risk profile, please contact your Relationship Manager.',

  EDUCATION:
    'This content is for educational and informational purposes only and does not constitute investment advice.',
};

// Fallback response when a compliance violation is detected — safe and helpful
const COMPLIANCE_FALLBACK_RESPONSE =
  "I want to make sure I'm giving you balanced and accurate guidance. " +
  "Based on your financial profile, I recommend reviewing your options with your " +
  "Relationship Manager who can provide personalised advice aligned with your goals. " +
  "Would you like me to help you prepare for that conversation?";

/**
 * Runs post-generation compliance validation on the LLM output.
 * Injects mandatory disclosures and replaces non-compliant responses.
 */
export function runComplianceFilter(
  response: string,
  intent: string,
  metrics?: FinancialMetrics
): ComplianceResult {
  const violations: string[] = [];
  const disclosures: string[] = [];

  // Check assumption transparency — projection mentioned but no assumption framing
  const hasProjection = metrics?.goalProbability !== undefined || metrics?.requiredMonthlySIP !== undefined;
  const hasAssumptionFraming = /based on|assuming|projection assumes|subject to|illustrative/i.test(response);
  if (hasProjection && !hasAssumptionFraming) {
    violations.push(
      'ASSUMPTION_TRANSPARENCY: financial projection referenced without assumption statement'
    );
  }

  // Check prohibited terms (with whitelist protection)
  const isWhitelisted = WHITELIST_PATTERNS.some(w => w.test(response));
  if (!isWhitelisted) {
    for (const pattern of PROHIBITED_PATTERNS) {
      if (pattern.test(response)) {
        violations.push(`PROHIBITED_TERM: ${pattern.source}`);
        break; // one violation sufficient to trigger fallback
      }
    }
  }

  // Check advisory overreach
  for (const pattern of ADVISORY_OVERREACH_PATTERNS) {
    if (pattern.test(response)) {
      violations.push(`ADVISORY_OVERREACH: ${pattern.source}`);
      break;
    }
  }

  // Check tax advisory overreach
  let isTaxViolation = false;
  for (const pattern of ADVISORY_TAX_OVERREACH_PATTERNS) {
    if (pattern.test(response)) {
      violations.push(`ADVISORY_TAX_OVERREACH: ${pattern.source}`);
      isTaxViolation = true;
      break;
    }
  }

  // Inject mandatory disclosures for this intent
  const intentKey = intent as IntentType;
  const mandatoryDisclosure = MANDATORY_DISCLOSURES[intentKey];
  if (mandatoryDisclosure) {
    disclosures.push(mandatoryDisclosure);
  }

  // Build final response
  const wasReplaced = violations.length > 0;
  let baseResponse = response;
  if (wasReplaced) {
    baseResponse = isTaxViolation ? TAX_ESCALATION_RESPONSE : COMPLIANCE_FALLBACK_RESPONSE;
  }

  const fullResponse =
    disclosures.length > 0
      ? `${baseResponse}\n\n_${disclosures.join(' ')}_`
      : baseResponse;

  if (violations.length > 0) {
    console.warn(`[L6-COMPLIANCE] BLOCKED | violations: ${violations.join(' | ')}`);
  } else {
    console.log(`[L6-COMPLIANCE] PASSED | intent: ${intent} | disclosures: ${disclosures.length}`);
  }

  return {
    passed: violations.length === 0,
    violations,
    finalResponse: fullResponse,
    disclosures,
    wasReplaced,
  };
}
