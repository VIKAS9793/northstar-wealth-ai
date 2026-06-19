/**
 * @layer L2 — Financial Twin Validation
 * @description Pre-flight suitability and profile checks that fire BEFORE the LLM.
 * Five deterministic rules prevent unsuitable guidance from reaching the model.
 * No LLM call. Pure Financial Twin mathematics.
 */

import { FinancialTwinProfile } from '@/features/financial-twin/types';
import { ClassificationResult } from './domainClassifier';

export interface PreflightBlock {
  rule: string;
  severity: 'HARD_STOP' | 'SOFT_WARN';
  directive: string;
}

export interface TwinValidationResult {
  profileCompleteness: number;
  preflightBlocks: PreflightBlock[];
  enrichedContext: string;
  requiresEscalation: boolean;
}

/**
 * Validates the Financial Twin profile and classification before any LLM call.
 * Returns preflight blocks and an enriched context string for directive injection.
 */
export function validateFinancialTwin(
  profile: FinancialTwinProfile,
  classification: ClassificationResult
): TwinValidationResult {
  const preflightBlocks: PreflightBlock[] = [];

  const freeCashFlow =
    profile.telemetry.monthly_inflow -
    profile.telemetry.monthly_outflow -
    profile.telemetry.total_emis;

  const emiBurdenPercent =
    profile.telemetry.monthly_inflow > 0
      ? (profile.telemetry.total_emis / profile.telemetry.monthly_inflow) * 100
      : 0;

  // ── Rule 1: Zero or Negative Free Cash Flow + Investment Intent ────────────
  if (
    freeCashFlow <= 0 &&
    ['GOAL_PLANNING', 'ACCELERATION'].includes(classification.intent)
  ) {
    preflightBlocks.push({
      rule: 'FCF_ZERO_INVESTMENT_BLOCK',
      severity: 'HARD_STOP',
      directive:
        `[PRE-FLIGHT BLOCK — FCF_ZERO]: Customer's free cash flow is ₹${freeCashFlow.toLocaleString('en-IN')}/month. ` +
        `DO NOT recommend any new investment or SIP increase. ` +
        `Acknowledge the cash-flow stress with empathy and redirect to expense optimisation ` +
        `and emergency fund review first. Frame as "balancing" not "crisis".`,
    });
    console.warn('[L2-TWIN] HARD_STOP | rule: FCF_ZERO_INVESTMENT_BLOCK | FCF: ₹' + freeCashFlow);
  }

  // ── Rule 2: Low Emergency Fund + Non-Resilience Intent ────────────────────
  if (profile.emergency_fund_months < 3 && classification.intent !== 'RESILIENCE') {
    preflightBlocks.push({
      rule: 'EMERGENCY_FUND_PREFLIGHT',
      severity: 'SOFT_WARN',
      directive:
        `[PRE-FLIGHT WARNING — EMERGENCY_FUND]: Emergency fund is only ${profile.emergency_fund_months} months. ` +
        `Before completing any investment recommendation, surface this risk once: ` +
        `"Before we grow your investments, let's also ensure your safety net is strong. ` +
        `A 6-month emergency fund protects your SIPs from being interrupted by life events." ` +
        `Do not alarm the customer — frame as proactive financial planning.`,
    });
    console.warn(`[L2-TWIN] SOFT_WARN | rule: EMERGENCY_FUND_PREFLIGHT | months: ${profile.emergency_fund_months}`);
  }

  // ── Rule 3: Conservative Profile + High-Risk Suitability Request ──────────
  if (
    profile.risk_profile === 'Conservative' &&
    classification.intent === 'SUITABILITY_CHECK'
  ) {
    preflightBlocks.push({
      rule: 'SUITABILITY_HARD_STOP',
      severity: 'HARD_STOP',
      directive:
        `[PRE-FLIGHT BLOCK — SUITABILITY]: Conservative risk profile detected with high-risk instrument request. ` +
        `Output MUST begin with a suitability refusal, then offer a safer alternative. ` +
        `SEBI-aware framing: "Based on your Conservative risk profile, high-volatility instruments ` +
        `may not align with your financial goals. I recommend Large Cap or Balanced Advantage Funds ` +
        `as a more suitable alternative." No exceptions to this directive.`,
    });
    console.warn('[L2-TWIN] HARD_STOP | rule: SUITABILITY_HARD_STOP | profile: Conservative');
  }

  // ── Rule 4: Senior Citizen + Growth-Oriented Goal Planning ────────────────
  if (profile.age >= 60 && classification.intent === 'GOAL_PLANNING') {
    preflightBlocks.push({
      rule: 'SENIOR_PRESERVATION_MANDATE',
      severity: 'SOFT_WARN',
      directive:
        `[PRE-FLIGHT WARNING — SENIOR_CITIZEN]: Customer is ${profile.age} years old. ` +
        `Capital preservation and regular income take absolute priority over long-term growth. ` +
        `Recommend Debt Mutual Funds, Senior Citizen FDs, or Dividend Yield instruments. ` +
        `Avoid equity-heavy allocations. Corpus safety > corpus growth.`,
    });
    console.warn(`[L2-TWIN] SOFT_WARN | rule: SENIOR_PRESERVATION_MANDATE | age: ${profile.age}`);
  }

  // ── Rule 5: High EMI Burden ────────────────────────────────────────────────
  if (emiBurdenPercent > 50) {
    preflightBlocks.push({
      rule: 'EMI_BURDEN_ALERT',
      severity: 'SOFT_WARN',
      directive:
        `[PRE-FLIGHT WARNING — EMI_BURDEN]: EMI burden is ${emiBurdenPercent.toFixed(0)}% of monthly income. ` +
        `Flag this as a resilience risk once before any investment recommendation: ` +
        `"Your EMI commitments are currently a significant portion of your income. ` +
        `Reducing this burden before increasing SIPs will strengthen your financial foundation."`,
    });
    console.warn(`[L2-TWIN] SOFT_WARN | rule: EMI_BURDEN_ALERT | burden: ${emiBurdenPercent.toFixed(0)}%`);
  }

  // ── Profile Completeness Scoring ──────────────────────────────────────────
  const completenessChecks: boolean[] = [
    !!profile.name && profile.name.length > 0,
    profile.age > 0 && profile.age < 120,
    profile.income > 0,
    !!profile.risk_profile,
    !!profile.goals && profile.goals.length > 0,
    profile.telemetry.monthly_inflow > 0,
    profile.emergency_fund_months >= 0,
  ];
  const profileCompleteness = completenessChecks.filter(Boolean).length / completenessChecks.length;

  // Escalate if a HARD_STOP fires AND the profile is incomplete
  const requiresEscalation =
    preflightBlocks.some(b => b.severity === 'HARD_STOP') &&
    profileCompleteness < 0.6;

  const enrichedContext = preflightBlocks.map(b => b.directive).join('\n\n');

  return {
    profileCompleteness,
    preflightBlocks,
    enrichedContext,
    requiresEscalation,
  };
}
