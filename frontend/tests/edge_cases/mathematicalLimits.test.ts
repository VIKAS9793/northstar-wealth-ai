import { describe, it, expect } from 'vitest';
import { runGoalIntelligenceEngine } from '../../src/services/ai/orchestrator';

describe('Mathematical Limits (Goal Engine Edge Cases)', () => {
  it('should deterministically reject goals if free cash flow is too low', () => {
    const mockProfile = {
      age: 35,
      sip_amount: 5000,
      telemetry: {
        monthly_inflow: 50000,
        monthly_outflow: 40000,
        total_emis: 9500, // FCF = 500
        discretionary_spend: 5000,
        sip_health_status: "Consistent" as const,
        cashflow_profile: "Comfortable" as const
      },
      goals: [
        { name: 'Retirement', target: 20000000, progressPercent: 2 } // Shortfall is huge
      ]
    };

    // Excess property check bypass: TS only checks literal objects; variable references are fine.
    const cls = { intent: 'GOAL_PLANNING', bias: 'NONE' };
    const result = runGoalIntelligenceEngine(mockProfile, cls);
    expect(result).toContain("gap and recommend debt consolidation");
    expect(result).toContain("free cash flow is ₹500");
  });

  it('should allow goals if free cash flow is healthy', () => {
    const mockProfile = {
      age: 35,
      sip_amount: 25000,
      telemetry: {
        monthly_inflow: 200000,
        monthly_outflow: 100000,
        total_emis: 10000, // FCF = 90000
        discretionary_spend: 25000,
        sip_health_status: "Consistent" as const,
        cashflow_profile: "Comfortable" as const
      },
      goals: [
        { name: 'Car', target: 1000000, progressPercent: 50 }
      ]
    };

    // Excess property check bypass: TS only checks literal objects; variable references are fine.
    const cls = { intent: 'GOAL_PLANNING', bias: 'NONE' };
    const result = runGoalIntelligenceEngine(mockProfile, cls);
    expect(result).not.toContain("gap and recommend debt consolidation");
    expect(result).toContain("Priority goal is 'Car'");
  });
});
