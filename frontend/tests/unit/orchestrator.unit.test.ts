/**
 * @file orchestrator.unit.test.ts
 * [Last Updated: 2026-06-24T18:41:02+05:30]
 * @description Unit tests for the 7-Layer pipeline and Financial Twin validations.
 * Includes coverage for the 2-Strike Consent flow:
 * - 1st Strike: requiresExplicitConsent is false (deferral)
 * - 2nd Strike: requiresExplicitConsent is true (widget trigger)
 */
import { describe, it, expect } from 'vitest';
import { validateFinancialTwin } from '@/features/governance/financialTwinValidator';
import { classifyWithConfidence } from '@/features/governance/domainClassifier';
import type { FinancialTwinProfile } from '@/features/financial-twin/types';

const conservativeProfile: FinancialTwinProfile = {
  id: 'unit-conservative-001',
  name: 'Priya Conservative',
  age: 35,
  income: 1200000,
  emergency_fund_months: 6,
  risk_profile: 'Conservative',
  goals: [],
  persona_type: 'Family Planner',
  sip_amount: 10000,
  total_invested: 500000,
  current_value: 600000,
  telemetry: { monthly_inflow: 100000, monthly_outflow: 80000, total_emis: 10000, discretionary_spend: 20000, sip_health_status: 'Consistent', cashflow_profile: 'Comfortable' }
};

const aggressiveProfile: FinancialTwinProfile = {
  id: 'unit-aggressive-001',
  name: 'Rahul Aggressive',
  age: 30,
  income: 1500000,
  emergency_fund_months: 8,
  risk_profile: 'Aggressive',
  goals: [],
  persona_type: 'Young Professional',
  sip_amount: 20000,
  total_invested: 800000,
  current_value: 1000000,
  telemetry: { monthly_inflow: 150000, monthly_outflow: 100000, total_emis: 20000, discretionary_spend: 30000, sip_health_status: 'Consistent', cashflow_profile: 'Comfortable' }
};

const OVERRIDE_TOKEN = '[SYSTEM_INTENT: OVERRIDE_CONSENT_GRANTED]';

describe('Orchestrator Unit Tests - Bugfix task list', () => {
  it('L1 limitation documented: classifyWithConfidence returns intent !== SUITABILITY_CHECK for override token', () => {
    const result = classifyWithConfidence(OVERRIDE_TOKEN);
    expect(result.intent).not.toBe('SUITABILITY_CHECK');
  });

  it('Rule 3 SUITABILITY_OVERRIDE_LOGGED with synthetic intent', () => {
    const syntheticClassification = { intent: 'SUITABILITY_CHECK' as const, bias: 'NONE' as const, confidence: 1.0, financialEntities: [], requiresProbing: false };
    const result = validateFinancialTwin(conservativeProfile, syntheticClassification, OVERRIDE_TOKEN);
    
    expect(result.preflightBlocks).toHaveLength(1);
    expect(result.preflightBlocks[0].rule).toBe('SUITABILITY_OVERRIDE_LOGGED');
    expect(result.preflightBlocks[0].severity).toBe('SOFT_WARN');
    expect(result.requiresExplicitConsent).toBe(false);
    expect(result.clientOverrideAcknowledged).toBe(true);
  });

  it('Rule 3 SUITABILITY_HARD_STOP with synthetic intent and no consent (1st Strike)', () => {
    const syntheticClassification = { intent: 'SUITABILITY_CHECK' as const, bias: 'NONE' as const, confidence: 1.0, financialEntities: [], requiresProbing: false };
    const result = validateFinancialTwin(conservativeProfile, syntheticClassification, 'tell me about small cap funds', { hasBeenDeferred: false, hasConsented: false });
    
    expect(result.preflightBlocks).toHaveLength(1);
    expect(result.preflightBlocks[0].rule).toBe('SUITABILITY_HARD_STOP');
    expect(result.preflightBlocks[0].severity).toBe('HARD_STOP');
    expect(result.requiresExplicitConsent).toBe(false);
    expect(result.clientOverrideAcknowledged).toBe(false);
  });

  it('Rule 3 SUITABILITY_HARD_STOP with synthetic intent and no consent (2nd Strike)', () => {
    const syntheticClassification = { intent: 'SUITABILITY_CHECK' as const, bias: 'NONE' as const, confidence: 1.0, financialEntities: [], requiresProbing: false };
    const result = validateFinancialTwin(conservativeProfile, syntheticClassification, 'tell me about small cap funds', { hasBeenDeferred: true, hasConsented: false });
    
    expect(result.preflightBlocks).toHaveLength(1);
    expect(result.preflightBlocks[0].rule).toBe('SUITABILITY_HARD_STOP');
    expect(result.preflightBlocks[0].severity).toBe('HARD_STOP');
    expect(result.requiresExplicitConsent).toBe(true);
    expect(result.clientOverrideAcknowledged).toBe(false);
  });

  it('Override token with Aggressive profile (fixed code)', () => {
    const syntheticClassification = { intent: 'SUITABILITY_CHECK' as const, bias: 'NONE' as const, confidence: 1.0, financialEntities: [], requiresProbing: false };
    const result = validateFinancialTwin(aggressiveProfile, syntheticClassification, OVERRIDE_TOKEN);
    
    const hasRule3 = result.preflightBlocks.some(b => b.rule === 'SUITABILITY_HARD_STOP' || b.rule === 'SUITABILITY_OVERRIDE_LOGGED');
    expect(hasRule3).toBe(false);
  });
});
