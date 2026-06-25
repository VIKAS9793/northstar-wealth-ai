import { describe, it, expect, vi } from 'vitest';
import { generateAIResponse } from '@/services/ai/orchestrator';
import { getSessionAuditLog } from '@/features/governance/auditTrail';
import type { FinancialTwinProfile } from '@/features/financial-twin/types';

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
  id: 'audit-conservative-001',
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
  id: 'audit-aggressive-001',
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

describe('Orchestrator Audit Trail - Consent Flow', () => {
  it('Audit trail override turn test', async () => {
    const sessionId = 'session-audit-01';
    await generateAIResponse(OVERRIDE_TOKEN, conservativeProfile, [], sessionId);
    
    const logs = getSessionAuditLog(sessionId);
    expect(logs.length).toBeGreaterThan(0);
    const entry = logs[logs.length - 1];
    
    expect(entry.clientOverrideAcknowledged).toBe(true);
    expect(entry.preflightBlocks).toContain('SUITABILITY_OVERRIDE_LOGGED');
    expect(entry.enginesFired).toContain('PREFLIGHT');
    expect(entry.classificationResult.intent).toBe('SUITABILITY_CHECK');
    expect(entry.wasBlocked).toBe(false);
  });

  it('Audit trail first-time suitability turn test (regression)', async () => {
    const sessionId = 'session-audit-02';
    await generateAIResponse('I want to invest in small cap funds', conservativeProfile, [], sessionId);
    
    const logs = getSessionAuditLog(sessionId);
    expect(logs.length).toBeGreaterThan(0);
    const entry = logs[logs.length - 1];
    
    expect(entry.clientOverrideAcknowledged).toBe(false);
    expect(entry.preflightBlocks).toContain('SUITABILITY_HARD_STOP');
    expect(entry.classificationResult.intent).toBe('SUITABILITY_CHECK');
  });

  it('Audit trail non-Conservative override token test', async () => {
    const sessionId = 'session-audit-03';
    await generateAIResponse(OVERRIDE_TOKEN, aggressiveProfile, [], sessionId);
    
    const logs = getSessionAuditLog(sessionId);
    expect(logs.length).toBeGreaterThan(0);
    const entry = logs[logs.length - 1];
    
    expect(entry.preflightBlocks).not.toContain('SUITABILITY_OVERRIDE_LOGGED');
  });
});
