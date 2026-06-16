import { describe, it, expect } from 'vitest';
import { runGoalIntelligenceEngine } from '../../src/services/ai/orchestrator';

describe('Mathematical Limits (Goal Engine Edge Cases)', () => {
  it('should deterministically reject goals if free cash flow is too low', () => {
    const mockProfile: any = {
      telemetry: {
        monthly_inflow: 50000,
        monthly_outflow: 40000,
        total_emis: 9500 // FCF = 500
      },
      goals: [
        { name: 'Retirement', target: 20000000, progress: 2 } // Shortfall is huge
      ]
    };

    const result = runGoalIntelligenceEngine(mockProfile);
    expect(result).toContain("gap and recommend debt consolidation");
    expect(result).toContain("free cash flow is ₹500");
  });

  it('should allow goals if free cash flow is healthy', () => {
    const mockProfile: any = {
      telemetry: {
        monthly_inflow: 200000,
        monthly_outflow: 100000,
        total_emis: 10000 // FCF = 90000
      },
      goals: [
        { name: 'Car', target: 1000000, progress: 50 }
      ]
    };

    const result = runGoalIntelligenceEngine(mockProfile);
    expect(result).not.toContain("gap and recommend debt consolidation");
    expect(result).toContain("Priority goal is 'Car'");
  });
});
