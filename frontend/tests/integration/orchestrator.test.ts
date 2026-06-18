import { describe, it, expect } from 'vitest';
import { runSuitabilityEngine } from '../../src/services/ai/orchestrator';

describe('Orchestrator Integration - Suitability Engine', () => {
  it('should enforce hard rejection for conservative profiles asking for crypto', () => {
    const profile = { risk_profile: 'Conservative' as const, age: 35 };
    const result = runSuitabilityEngine('should I buy crypto and small caps?', profile);
    
    expect(result).toContain('SUITABILITY ENGINE HARD REJECTION');
    expect(result).toContain('DO NOT GENERATE NORMAL ADVICE');
    expect(result).toContain('SEBI guidelines prevent me from recommending high-volatility instruments');
  });

  it('should enforce senior citizen debt priority', () => {
    const profile = { risk_profile: 'Aggressive' as const, age: 65 };
    const result = runSuitabilityEngine('I want long term growth in equity', profile);
    
    expect(result).toContain('Senior Citizen');
    expect(result).toContain('Prioritize Debt Mutual Funds or FDs');
  });

  it('should allow aggressive profiles to inquire about equity', () => {
    const profile = { risk_profile: 'Aggressive' as const, age: 30 };
    const result = runSuitabilityEngine('Should I buy small caps?', profile);
    
    expect(result).toBe(''); // No override generated
  });
});
