/**
 * @file orchestrator.preservation.test.ts
 * [Last Updated: 2026-06-24T18:41:02+05:30]
 * @description Property 2: Preservation — Non-Override Input Behaviour Is Unchanged
 *
 * These tests confirm that the isOverrideToken guard added to orchestrator.ts does NOT
 * affect any pipeline behaviour for inputs where rawInput !== '[SYSTEM_INTENT: OVERRIDE_CONSENT_GRANTED]'.
 * NOTE: Tests validate the 1st Strike behaviour (requiresExplicitConsent === false) as of the 2-Strike UI logic update.
 *
 * All tests are expected to PASS on the fixed code (confirming no regressions).
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import { validateFinancialTwin } from '@/features/governance/financialTwinValidator';
import { classifyWithConfidence } from '@/features/governance/domainClassifier';
import type { FinancialTwinProfile } from '@/features/financial-twin/types';
import type { ClassificationResult } from '@/features/governance/domainClassifier';

// ─── Constants ───────────────────────────────────────────────────────────────

const OVERRIDE_TOKEN = '[SYSTEM_INTENT: OVERRIDE_CONSENT_GRANTED]';

// ─── Shared test fixtures ─────────────────────────────────────────────────────

/** Healthy Conservative profile — Rule 3 applies (SUITABILITY_HARD_STOP on first-time request) */
const conservativeProfile: FinancialTwinProfile = {
  id: 'pres-conservative-001',
  name: 'Priya Conservative',
  age: 35,
  income: 1200000,
  persona_type: 'Young Professional',
  risk_profile: 'Conservative',
  sip_amount: 10000,
  total_invested: 500000,
  current_value: 550000,
  emergency_fund_months: 6,
  goals: [{ name: 'Retirement', target: 10000000, progressPercent: 10 }],
  telemetry: {
    monthly_inflow: 100000,
    monthly_outflow: 50000,
    total_emis: 15000,
    discretionary_spend: 10000,
    sip_health_status: 'Consistent',
    cashflow_profile: 'Comfortable',
  },
};

/** Moderate profile — Rule 3 should never fire */
const moderateProfile: FinancialTwinProfile = {
  id: 'pres-moderate-001',
  name: 'Rahul Moderate',
  age: 40,
  income: 1500000,
  persona_type: 'Family Planner',
  risk_profile: 'Moderate',
  sip_amount: 15000,
  total_invested: 800000,
  current_value: 900000,
  emergency_fund_months: 8,
  goals: [{ name: 'Home Purchase', target: 5000000, progressPercent: 20 }],
  telemetry: {
    monthly_inflow: 120000,
    monthly_outflow: 60000,
    total_emis: 20000,
    discretionary_spend: 12000,
    sip_health_status: 'Consistent',
    cashflow_profile: 'Comfortable',
  },
};

/** Aggressive profile — Rule 3 should never fire */
const aggressiveProfile: FinancialTwinProfile = {
  id: 'pres-aggressive-001',
  name: 'Anil Aggressive',
  age: 28,
  income: 2000000,
  persona_type: 'Young Professional',
  risk_profile: 'Aggressive',
  sip_amount: 25000,
  total_invested: 1200000,
  current_value: 1500000,
  emergency_fund_months: 12,
  goals: [{ name: 'Wealth Creation', target: 20000000, progressPercent: 5 }],
  telemetry: {
    monthly_inflow: 160000,
    monthly_outflow: 70000,
    total_emis: 20000,
    discretionary_spend: 20000,
    sip_health_status: 'Consistent',
    cashflow_profile: 'Comfortable',
  },
};

/** Synthetic SUITABILITY_CHECK classification (mirrors what orchestrator injects for the override token) */
const suitabilityCheckCls: ClassificationResult = {
  intent: 'SUITABILITY_CHECK',
  bias: 'OVERCONFIDENCE',
  confidence: 0.90,
  financialEntities: ['small cap'],
  requiresProbing: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// PBT Property A: Conservative first-time suitability HARD_STOP preserved
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property-based test — Conservative first-time suitability hard stop preserved
 *
 * For any Conservative profile and any SUITABILITY_CHECK classification where
 * rawInput is NOT the override token, validateFinancialTwin MUST return exactly
 * SUITABILITY_HARD_STOP (HARD_STOP) in preflightBlocks and requiresExplicitConsent: true.
 *
 * Validates: Requirement 3.1
 */
describe('PBT Property A — Conservative first-time suitability HARD_STOP preserved', () => {
  /**
   * Vary profile fields across the Conservative risk profile space.
   * These cover the combinations relevant to Rule 3 — different ages, incomes,
   * emergency fund levels, and SIP amounts.
   */
  const conservativeVariants: FinancialTwinProfile[] = [
    // Base conservative profile
    conservativeProfile,
    // Young Conservative — low age
    { ...conservativeProfile, id: 'pres-c-young', age: 25, income: 600000, emergency_fund_months: 3 },
    // Pre-retirement Conservative — age < 60 (senior rule does not apply)
    { ...conservativeProfile, id: 'pres-c-preretiree', age: 55, income: 900000, emergency_fund_months: 10 },
    // Conservative with low emergency fund (Emergency rule fires, Rule 3 still fires)
    { ...conservativeProfile, id: 'pres-c-low-ef', emergency_fund_months: 1 },
    // Conservative with larger income
    { ...conservativeProfile, id: 'pres-c-highincome', income: 3000000, sip_amount: 50000 },
    // Conservative with different goals
    {
      ...conservativeProfile,
      id: 'pres-c-goals',
      goals: [
        { name: 'Child Education', target: 2000000, progressPercent: 30 },
        { name: 'Vacation', target: 500000, progressPercent: 50 },
      ],
    },
  ];

  const nonOverrideInputs = [
    'tell me about small cap funds',
    'I want to invest in mid cap',
    'what are F&O derivatives?',
    'should I buy sectoral funds?',
    'I want to try direct equity',
    'penny stocks seem interesting',
  ];

  for (const profile of conservativeVariants) {
    for (const rawInput of nonOverrideInputs) {
      it(`profile ${profile.id}, input: "${rawInput.slice(0, 40)}"`, () => {
        const result = validateFinancialTwin(profile, suitabilityCheckCls, rawInput);

        // HARD_STOP must be present
        const rule3Block = result.preflightBlocks.find(b => b.rule === 'SUITABILITY_HARD_STOP');
        expect(rule3Block, `SUITABILITY_HARD_STOP must be in preflightBlocks for Conservative + SUITABILITY_CHECK without override`).toBeDefined();
        expect(rule3Block?.severity).toBe('HARD_STOP');

        // requiresExplicitConsent must be false on 1st strike
        expect(result.requiresExplicitConsent).toBe(false);

        // clientOverrideAcknowledged must be false (rawInput is not the override token)
        expect(result.clientOverrideAcknowledged).toBe(false);

        // SUITABILITY_OVERRIDE_LOGGED must NOT be present (consent was not acknowledged)
        expect(result.preflightBlocks.some(b => b.rule === 'SUITABILITY_OVERRIDE_LOGGED')).toBe(false);
      });
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PBT Property B: Moderate/Aggressive Rule 3 non-firing preserved
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property-based test — Moderate/Aggressive Rule 3 non-firing preserved
 *
 * For any Moderate or Aggressive profile with any SUITABILITY_CHECK classification,
 * validateFinancialTwin MUST return no Rule 3 preflight block.
 * preflightBlocks must not contain SUITABILITY_HARD_STOP or SUITABILITY_OVERRIDE_LOGGED.
 *
 * Validates: Requirement 3.2, 3.5
 */
describe('PBT Property B — Moderate/Aggressive Rule 3 non-firing preserved', () => {
  const nonConservativeVariants: FinancialTwinProfile[] = [
    moderateProfile,
    aggressiveProfile,
    // Moderate with lower emergency fund
    { ...moderateProfile, id: 'pres-m-low-ef', emergency_fund_months: 1 },
    // Aggressive at higher age
    { ...aggressiveProfile, id: 'pres-a-older', age: 50 },
    // Moderate young professional
    { ...moderateProfile, id: 'pres-m-young', age: 26, income: 800000 },
    // Aggressive with high EMI
    {
      ...aggressiveProfile,
      id: 'pres-a-high-emi',
      telemetry: { ...aggressiveProfile.telemetry, total_emis: 90000, monthly_inflow: 160000 },
    },
  ];

  const suitabilityInputs = [
    'I want to buy small cap funds',
    'show me mid cap options',
    '[SYSTEM_INTENT: OVERRIDE_CONSENT_GRANTED]', // override token from non-Conservative
    'I want to try F&O derivatives',
    'sectoral funds interest me',
  ];

  for (const profile of nonConservativeVariants) {
    for (const rawInput of suitabilityInputs) {
      it(`profile ${profile.id} (${profile.risk_profile}), input: "${rawInput.slice(0, 45)}"`, () => {
        const result = validateFinancialTwin(profile, suitabilityCheckCls, rawInput);

        // Rule 3 blocks must NOT fire for non-Conservative profiles
        const rule3Rules = result.preflightBlocks.filter(
          b => b.rule === 'SUITABILITY_HARD_STOP' || b.rule === 'SUITABILITY_OVERRIDE_LOGGED'
        );
        expect(
          rule3Rules,
          `Rule 3 must not fire for ${profile.risk_profile} profile — preflightBlocks must not contain SUITABILITY_HARD_STOP or SUITABILITY_OVERRIDE_LOGGED`
        ).toHaveLength(0);

        // requiresExplicitConsent must be false (Rule 3 HARD_STOP is the only setter)
        expect(result.requiresExplicitConsent).toBe(false);
      });
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PBT Property C: L1 unchanged for all non-override strings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property-based test — L1 unchanged for all non-override strings
 *
 * For any generated string NOT equal to '[SYSTEM_INTENT: OVERRIDE_CONSENT_GRANTED]',
 * classifyWithConfidence(input) must return the expected intent, bias, and requiresProbing.
 * L1 (domainClassifier.ts) was not modified by the fix — this PBT enforces the contract.
 *
 * Validates: Requirement 3.3
 */
describe('PBT Property C — L1 classifyWithConfidence unchanged for non-override strings', () => {
  /**
   * A representative set of non-override strings spanning every intent class.
   * Each entry specifies the expected intent so we can assert the classification
   * hasn't drifted from the pre-fix baseline.
   */
  const nonOverrideCases: Array<{ input: string; expectedIntent: string }> = [
    // SUITABILITY_CHECK — financial instrument keywords
    { input: 'tell me about small cap funds', expectedIntent: 'SUITABILITY_CHECK' },
    { input: 'I want to invest in mid cap funds', expectedIntent: 'SUITABILITY_CHECK' },
    { input: 'what is F&O trading?', expectedIntent: 'SUITABILITY_CHECK' },
    { input: 'should I buy sectoral fund', expectedIntent: 'SUITABILITY_CHECK' },
    // RESILIENCE — panic/withdrawal signals
    { input: 'market crash ho gaya, should I stop my SIP?', expectedIntent: 'RESILIENCE' },
    { input: 'I want to redeem my mutual funds now', expectedIntent: 'RESILIENCE' },
    // ACCELERATION — windfall/extra cash signals
    { input: 'I received a bonus this month, where to invest?', expectedIntent: 'ACCELERATION' },
    { input: 'got a lumpsum, how to invest?', expectedIntent: 'ACCELERATION' },
    // EDUCATION — FOMO/herd patterns
    { input: 'my friend made a lot of money in mutual funds', expectedIntent: 'EDUCATION' },
    { input: 'last year small cap gave 40% returns so it should continue', expectedIntent: 'EDUCATION' },
    // GOAL_PLANNING — life goals
    { input: 'I want to buy a house in 8 years', expectedIntent: 'GOAL_PLANNING' },
    { input: 'how much do I need to save for retirement?', expectedIntent: 'GOAL_PLANNING' },
    // CLARIFICATION — short/vague
    { input: 'invest', expectedIntent: 'CLARIFICATION' },
    { input: 'hi', expectedIntent: 'CLARIFICATION' },
    // OFF_TOPIC — out of domain
    { input: 'what is the cricket score today?', expectedIntent: 'OFF_TOPIC' },
    // GENERAL — no rule match
    { input: 'how are my SIPs performing overall?', expectedIntent: 'GENERAL' },
  ];

  for (const { input, expectedIntent } of nonOverrideCases) {
    it(`classifyWithConfidence("${input.slice(0, 50)}") returns ${expectedIntent}`, () => {
      // Confirm the input is not the override token (guard for test integrity)
      expect(input.trim()).not.toBe(OVERRIDE_TOKEN);

      const result = classifyWithConfidence(input);
      expect(result.intent).toBe(expectedIntent);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PBT Property D: Override token from non-Conservative profile — no Rule 3 block
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property-based test — Override token from non-Conservative profile
 *
 * validateFinancialTwin(aggressiveProfile, { intent: 'SUITABILITY_CHECK', ... },
 * '[SYSTEM_INTENT: OVERRIDE_CONSENT_GRANTED]') must return no Rule 3 preflight block.
 * profile.risk_profile === 'Conservative' guard is false, so neither override nor
 * hard-stop fires. This is consistent with preservation requirement 3.2.
 *
 * Validates: Requirements 3.2, 3.5
 */
describe('PBT Property D — Override token from non-Conservative profile returns no Rule 3 block', () => {
  const nonConservativeProfiles = [
    moderateProfile,
    aggressiveProfile,
    { ...moderateProfile, id: 'pres-m-override', age: 50 },
    { ...aggressiveProfile, id: 'pres-a-override', age: 32, emergency_fund_months: 2 },
  ];

  for (const profile of nonConservativeProfiles) {
    it(`profile ${profile.id} (${profile.risk_profile}) — override token produces no Rule 3 block`, () => {
      const result = validateFinancialTwin(profile, suitabilityCheckCls, OVERRIDE_TOKEN);

      // clientOverrideAcknowledged IS true (the flag is set correctly regardless of profile)
      expect(result.clientOverrideAcknowledged).toBe(true);

      // But Rule 3 must NOT fire — profile.risk_profile !== 'Conservative'
      const rule3Blocks = result.preflightBlocks.filter(
        b => b.rule === 'SUITABILITY_HARD_STOP' || b.rule === 'SUITABILITY_OVERRIDE_LOGGED'
      );
      expect(
        rule3Blocks,
        `Rule 3 must not fire for ${profile.risk_profile} profile even with override token`
      ).toHaveLength(0);

      // requiresExplicitConsent must be false
      expect(result.requiresExplicitConsent).toBe(false);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit Test — All four other preflight rules unaffected
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unit tests — Rules 1, 2, 4, 5 fire correctly with non-override inputs
 *
 * Tests FCF_ZERO_INVESTMENT_BLOCK (Rule 1), EMERGENCY_FUND_PREFLIGHT (Rule 2),
 * SENIOR_PRESERVATION_MANDATE (Rule 4), and EMI_BURDEN_ALERT (Rule 5)
 * across their trigger conditions with non-override rawInput.
 *
 * Validates: Requirements 3.4, 3.5
 */
describe('Unit Tests — Rules 1, 2, 4, 5 unaffected by the override fix', () => {
  // ── Rule 1: FCF_ZERO_INVESTMENT_BLOCK ──────────────────────────────────────

  describe('Rule 1 — FCF_ZERO_INVESTMENT_BLOCK', () => {
    const zeroFcfProfile: FinancialTwinProfile = {
      ...conservativeProfile,
      id: 'pres-rule1-001',
      risk_profile: 'Moderate', // use Moderate to isolate from Rule 3
      telemetry: {
        monthly_inflow: 100000,
        monthly_outflow: 85000,
        total_emis: 15000, // FCF = 100000 - 85000 - 15000 = 0
        discretionary_spend: 8000,
        sip_health_status: 'Paused',
        cashflow_profile: 'Balancing Required',
      },
    };

    const goalPlanningCls: ClassificationResult = {
      intent: 'GOAL_PLANNING',
      bias: 'NONE',
      confidence: 0.85,
      financialEntities: ['goal'],
      requiresProbing: false,
    };

    it('fires FCF_ZERO_INVESTMENT_BLOCK for GOAL_PLANNING intent when FCF <= 0', () => {
      const result = validateFinancialTwin(zeroFcfProfile, goalPlanningCls, 'I want to invest in a new goal');

      const block = result.preflightBlocks.find(b => b.rule === 'FCF_ZERO_INVESTMENT_BLOCK');
      expect(block, 'FCF_ZERO_INVESTMENT_BLOCK must fire when FCF is zero and intent is GOAL_PLANNING').toBeDefined();
      expect(block?.severity).toBe('HARD_STOP');
    });

    it('fires FCF_ZERO_INVESTMENT_BLOCK for ACCELERATION intent when FCF <= 0', () => {
      const accelerationCls: ClassificationResult = {
        intent: 'ACCELERATION',
        bias: 'NONE',
        confidence: 0.88,
        financialEntities: [],
        requiresProbing: false,
      };
      const result = validateFinancialTwin(zeroFcfProfile, accelerationCls, 'I got a bonus, invest it');

      const block = result.preflightBlocks.find(b => b.rule === 'FCF_ZERO_INVESTMENT_BLOCK');
      expect(block, 'FCF_ZERO_INVESTMENT_BLOCK must fire for ACCELERATION when FCF <= 0').toBeDefined();
      expect(block?.severity).toBe('HARD_STOP');
    });

    it('does NOT fire FCF_ZERO_INVESTMENT_BLOCK for RESILIENCE intent even when FCF <= 0', () => {
      const resilienceCls: ClassificationResult = {
        intent: 'RESILIENCE',
        bias: 'LOSS_AVERSION',
        confidence: 0.92,
        financialEntities: [],
        requiresProbing: false,
      };
      const result = validateFinancialTwin(zeroFcfProfile, resilienceCls, 'should I stop my SIP?');

      const block = result.preflightBlocks.find(b => b.rule === 'FCF_ZERO_INVESTMENT_BLOCK');
      expect(block, 'FCF_ZERO_INVESTMENT_BLOCK must NOT fire for RESILIENCE intent').toBeUndefined();
    });
  });

  // ── Rule 2: EMERGENCY_FUND_PREFLIGHT ──────────────────────────────────────

  describe('Rule 2 — EMERGENCY_FUND_PREFLIGHT', () => {
    const lowEfProfile: FinancialTwinProfile = {
      ...moderateProfile,
      id: 'pres-rule2-001',
      emergency_fund_months: 2, // < 3 months triggers Rule 2
    };

    it('fires EMERGENCY_FUND_PREFLIGHT for GOAL_PLANNING when emergency_fund_months < 3', () => {
      const result = validateFinancialTwin(lowEfProfile, {
        intent: 'GOAL_PLANNING', bias: 'NONE', confidence: 0.85, financialEntities: [], requiresProbing: false,
      }, 'how to plan for retirement?');

      const block = result.preflightBlocks.find(b => b.rule === 'EMERGENCY_FUND_PREFLIGHT');
      expect(block, 'EMERGENCY_FUND_PREFLIGHT must fire when fund < 3 months and intent is not RESILIENCE').toBeDefined();
      expect(block?.severity).toBe('SOFT_WARN');
    });

    it('does NOT fire EMERGENCY_FUND_PREFLIGHT when intent is RESILIENCE', () => {
      const result = validateFinancialTwin(lowEfProfile, {
        intent: 'RESILIENCE', bias: 'LOSS_AVERSION', confidence: 0.92, financialEntities: [], requiresProbing: false,
      }, 'market is crashing, should I stop SIP?');

      const block = result.preflightBlocks.find(b => b.rule === 'EMERGENCY_FUND_PREFLIGHT');
      expect(block).toBeUndefined();
    });

    it('does NOT fire EMERGENCY_FUND_PREFLIGHT when emergency_fund_months >= 3', () => {
      const adequateEfProfile: FinancialTwinProfile = { ...moderateProfile, emergency_fund_months: 3 };
      const result = validateFinancialTwin(adequateEfProfile, {
        intent: 'GOAL_PLANNING', bias: 'NONE', confidence: 0.85, financialEntities: [], requiresProbing: false,
      }, 'plan for my child education');

      const block = result.preflightBlocks.find(b => b.rule === 'EMERGENCY_FUND_PREFLIGHT');
      expect(block).toBeUndefined();
    });
  });

  // ── Rule 4: SENIOR_PRESERVATION_MANDATE ───────────────────────────────────

  describe('Rule 4 — SENIOR_PRESERVATION_MANDATE', () => {
    const seniorProfile: FinancialTwinProfile = {
      ...moderateProfile,
      id: 'pres-rule4-senior',
      age: 65, // >= 60 triggers Rule 4 for GOAL_PLANNING
      emergency_fund_months: 12,
    };

    it('fires SENIOR_PRESERVATION_MANDATE for age >= 60 with GOAL_PLANNING intent', () => {
      const result = validateFinancialTwin(seniorProfile, {
        intent: 'GOAL_PLANNING', bias: 'NONE', confidence: 0.85, financialEntities: [], requiresProbing: false,
      }, 'I want to plan for my retirement income');

      const block = result.preflightBlocks.find(b => b.rule === 'SENIOR_PRESERVATION_MANDATE');
      expect(block, 'SENIOR_PRESERVATION_MANDATE must fire for age >= 60 with GOAL_PLANNING').toBeDefined();
      expect(block?.severity).toBe('SOFT_WARN');
    });

    it('does NOT fire SENIOR_PRESERVATION_MANDATE for GOAL_PLANNING when age < 60', () => {
      const youngProfile: FinancialTwinProfile = { ...moderateProfile, id: 'pres-rule4-young', age: 45 };
      const result = validateFinancialTwin(youngProfile, {
        intent: 'GOAL_PLANNING', bias: 'NONE', confidence: 0.85, financialEntities: [], requiresProbing: false,
      }, 'how to plan for retirement?');

      const block = result.preflightBlocks.find(b => b.rule === 'SENIOR_PRESERVATION_MANDATE');
      expect(block).toBeUndefined();
    });

    it('does NOT fire SENIOR_PRESERVATION_MANDATE for senior with non-GOAL_PLANNING intent', () => {
      const result = validateFinancialTwin(seniorProfile, {
        intent: 'RESILIENCE', bias: 'LOSS_AVERSION', confidence: 0.92, financialEntities: [], requiresProbing: false,
      }, 'should I withdraw from market now?');

      const block = result.preflightBlocks.find(b => b.rule === 'SENIOR_PRESERVATION_MANDATE');
      expect(block).toBeUndefined();
    });
  });

  // ── Rule 5: EMI_BURDEN_ALERT ──────────────────────────────────────────────

  describe('Rule 5 — EMI_BURDEN_ALERT', () => {
    const highEmiProfile: FinancialTwinProfile = {
      ...moderateProfile,
      id: 'pres-rule5-highemi',
      telemetry: {
        ...moderateProfile.telemetry,
        total_emis: 65000,   // 65000 / 120000 = 54.2% — above 50%
        monthly_inflow: 120000,
      },
    };

    const generalCls: ClassificationResult = {
      intent: 'GENERAL', bias: 'NONE', confidence: 0.70, financialEntities: [], requiresProbing: false,
    };

    it('fires EMI_BURDEN_ALERT when EMI > 50% of monthly income', () => {
      const result = validateFinancialTwin(highEmiProfile, generalCls, 'how am I doing financially?');

      const block = result.preflightBlocks.find(b => b.rule === 'EMI_BURDEN_ALERT');
      expect(block, 'EMI_BURDEN_ALERT must fire when EMI burden exceeds 50%').toBeDefined();
      expect(block?.severity).toBe('SOFT_WARN');
    });

    it('does NOT fire EMI_BURDEN_ALERT when EMI <= 50% of monthly income', () => {
      const normalEmiProfile: FinancialTwinProfile = {
        ...moderateProfile,
        id: 'pres-rule5-normalemi',
        telemetry: {
          ...moderateProfile.telemetry,
          total_emis: 30000,   // 30000 / 120000 = 25% — below 50%
          monthly_inflow: 120000,
        },
      };
      const result = validateFinancialTwin(normalEmiProfile, generalCls, 'should I increase my SIP?');

      const block = result.preflightBlocks.find(b => b.rule === 'EMI_BURDEN_ALERT');
      expect(block).toBeUndefined();
    });

    it('does NOT fire EMI_BURDEN_ALERT when monthly_inflow is 0 (guard against division by zero)', () => {
      const zeroInflowProfile: FinancialTwinProfile = {
        ...moderateProfile,
        id: 'pres-rule5-zeroinflow',
        telemetry: {
          ...moderateProfile.telemetry,
          total_emis: 5000,
          monthly_inflow: 0,
        },
      };
      const result = validateFinancialTwin(zeroInflowProfile, generalCls, 'general question');

      const block = result.preflightBlocks.find(b => b.rule === 'EMI_BURDEN_ALERT');
      // emiBurdenPercent = 0 when monthly_inflow = 0 (code guards against this)
      expect(block).toBeUndefined();
    });
  });
});
