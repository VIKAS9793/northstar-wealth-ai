/**
 * @file orchestrator.integration.test.ts
 * [Last Updated: 2026-06-24T18:41:02+05:30]
 * @description Integration tests for the full orchestrator AI response flow.
 * Tests the end-to-end 3-step 2-Strike Consent Flow:
 * 1. Initial request (1st Strike) -> AI defers, no widget.
 * 2. Second request (2nd Strike) -> Widget appears.
 * 3. Override response (User accepts liability) -> AI answers.
 */
import { describe, it, expect, vi } from 'vitest';
import { generateAIResponse } from '@/services/ai/orchestrator';
import type { FinancialTwinProfile } from '@/features/financial-twin/types';

// Mocking the OpenAI SDK call within generateAIResponse if necessary, 
// though we can also just let it hit the network if that's expected, 
// but the prompt says: "Mock `nvidiaNim.chat.completions.create` to return a canned response."
vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mocked AI Response' } }]
          })
        }
      };
    }
  };
});

const conservativeProfile: FinancialTwinProfile = {
  id: 'integ-conservative-001',
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

const moderateProfile: FinancialTwinProfile = {
  id: 'integ-moderate-001',
  name: 'Rahul Moderate',
  age: 30,
  income: 1500000,
  emergency_fund_months: 8,
  risk_profile: 'Moderate',
  goals: [],
  persona_type: 'Young Professional',
  sip_amount: 20000,
  total_invested: 800000,
  current_value: 1000000,
  telemetry: { monthly_inflow: 150000, monthly_outflow: 100000, total_emis: 20000, discretionary_spend: 30000, sip_health_status: 'Consistent', cashflow_profile: 'Comfortable' }
};

const OVERRIDE_TOKEN = '[SYSTEM_INTENT: OVERRIDE_CONSENT_GRANTED]';

describe('Orchestrator Integration - Consent Flow', () => {
  it('Full 2-Strike Consent Flow integration test', async () => {
    // 1. Initial request (1st Strike) -> AI defers, no widget
    const res1 = await generateAIResponse('I want to invest in small cap funds', conservativeProfile, [], 'session-integ-01');
    expect(res1.requiresExplicitConsent).toBe(false);
    expect(res1.intent).toBe('SUITABILITY_CHECK');
    
    // 2. Second request (2nd Strike) -> Widget appears
    const res2 = await generateAIResponse('But I really want to invest in small cap funds', conservativeProfile, [{ role: 'user', content: 'I want to invest in small cap funds' }, { role: 'ai', content: res1.data as string }], 'session-integ-01');
    expect(res2.requiresExplicitConsent).toBe(true);
    expect(res2.intent).toBe('SUITABILITY_CHECK');

    // 3. Override response (User accepts liability)
    const res3 = await generateAIResponse(OVERRIDE_TOKEN, conservativeProfile, [{ role: 'user', content: 'But I really want to invest in small cap funds' }], 'session-integ-01');
    expect(res3.requiresExplicitConsent).toBe(false);
    expect(res3.intent).toBe('SUITABILITY_CHECK');
    expect(res3.wasComplianceBlocked).toBe(false);
  });

  it('Regression - Moderate customer, same instrument, no consent flow', async () => {
    const res = await generateAIResponse('I want to invest in small cap funds', moderateProfile, [], 'session-integ-02');
    expect(res.requiresExplicitConsent).toBeFalsy();
  });

  it('Regression - Conservative customer, general query, L1 fires normally', async () => {
    const res = await generateAIResponse('How are my SIPs performing?', conservativeProfile, [], 'session-integ-03');
    expect(res.intent).not.toBe('SUITABILITY_CHECK');
    // Preflight blocks won't include Rule 3 because intent is not SUITABILITY_CHECK
  });
});
