/**
 * @layer L5 — Output Schema
 * @description Structured output contract for all financial responses.
 * Separates LLM-generated prose from deterministically computed financial metrics.
 * The LLM generates ONLY the `message` field. All numbers come from calculateGoalMetrics.
 * STRUCTURED_OUTPUT_SYSTEM_SUFFIX is appended to every system prompt.
 */

export type FinancialResponseType =
  | 'GOAL_ADVISORY'
  | 'RESILIENCE_COACHING'
  | 'EDUCATION'
  | 'SUITABILITY_BLOCK'
  | 'GOAL_ACCELERATION'
  | 'ESCALATION'
  | 'GENERAL';

export interface FinancialMetrics {
  goalName?: string;
  targetCorpus?: number;
  shortfall?: number;
  requiredMonthlySIP?: number;
  currentMonthlySIP?: number;
  goalProbability?: number;
  freeCashFlow?: number;
  emergencyFundMonths?: number;
  emiBurdenPercent?: number;
}

export interface ComplianceFields {
  sebiDisclaimer: boolean;
  riskDisclosure: boolean;
  assumptionStatement: boolean;
  rmEscalationOffered: boolean;
  disclosureText?: string;
}

export interface GovernanceMetadata {
  enginesFired: string[];
  constitutionalReviewRan: boolean;
  violationsDetected: number;
  confidenceScore: number;
  auditId: string;
}

export interface FinancialResponseSchema {
  responseType: FinancialResponseType;
  // LLM generates this field ONLY — never any number inside this string
  message: string;
  // Pre-computed by calculateGoalMetrics — never LLM-generated
  financialMetrics?: FinancialMetrics;
  // Injected by L6 complianceFilter
  compliance: ComplianceFields;
  // Populated by the pipeline
  governance: GovernanceMetadata;
}

/**
 * Appended to every system prompt.
 * Instructs the LLM that financial numbers are pre-computed and must not be invented.
 * Enforces 150-word plain prose limit for mobile display.
 */
export const STRUCTURED_OUTPUT_SYSTEM_SUFFIX = `

[OUTPUT CONTRACT — READ CAREFULLY]
Your ONLY task is to write the conversational message field.
All financial figures (corpus, SIP amounts, goal probability, returns) have been 
pre-computed by the Financial Twin engine and provided to you in the context above.
You MUST reference those exact figures — do not invent, estimate, or modify any number.
If no figure is provided for a metric, do not mention that metric.

FORMAT RULES:
- Maximum 150 words
- Plain conversational prose — no bullet points, no markdown, no numbered lists
- Address the customer by name if available
- Warm, professional tone — NorthStar Wealth Companion personality
- End with one clear next step or question

PROHIBITED IN YOUR RESPONSE:
- Any number not provided in your context
- Guaranteed, assured, certain, risk-free
- "Best fund", "top fund", "number one fund"
- Specific scheme names without suitability grounding

DOMAIN FAILURE PROTOCOL (highest priority — overrides all other instructions):
If the query is about technology, programming, coding, lifestyle, sports, health,
food, politics, general knowledge, or any topic outside wealth management:
Return only: "I'm Dhan, your NorthStar Wealth Companion — an AI-powered digital wealth advisor designed for SEBI-regulated financial guidance. My expertise covers mutual funds, SIPs, financial planning, investment education, and goal-based wealth management. I'm unable to assist with this query. What would you like to explore about your financial goals today?"
Do not add any other text. Do not offer resources or alternatives.
This is a regulatory boundary, not a technical limitation.

NOTE TO MAINTAINER: The string above must be kept identical to DOMAIN_REFUSAL_RESPONSE
in threatIsolation.ts. outputSchema.ts does not import from governance modules
to avoid circular dependency risk (outputSchema ↔ threatIsolation).
If DOMAIN_REFUSAL_RESPONSE changes, update this string in the same commit.`;

/**
 * Maps intent types to FinancialResponseType for schema population.
 */
export function mapIntentToResponseType(intent: string): FinancialResponseType {
  const mapping: Record<string, FinancialResponseType> = {
    GOAL_PLANNING:    'GOAL_ADVISORY',
    RESILIENCE:       'RESILIENCE_COACHING',
    EDUCATION:        'EDUCATION',
    SUITABILITY_CHECK:'SUITABILITY_BLOCK',
    ACCELERATION:     'GOAL_ACCELERATION',
    CLARIFICATION:    'GENERAL',
    OFF_TOPIC:        'GENERAL',
    GENERAL:          'GENERAL',
  };
  return mapping[intent] ?? 'GENERAL';
}
