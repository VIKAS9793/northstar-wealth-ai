import { describe, it, expect, vi } from 'vitest';
import {
  WEALTH_ADVISORY_CONSTITUTION,
  requiresConstitutionalReview,
  runConstitutionalCritique,
} from '../../src/features/governance/constitution';
import { ClassificationResult } from '../../src/features/governance/domainClassifier';
import { PreflightBlock } from '../../src/features/governance/financialTwinValidator';

// Mock OpenAI client — constitution.ts accepts it as a parameter
const makeMockClient = (responseText: string) => ({
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [{ message: { content: responseText } }],
      }),
    },
  },
});

const cleanClassification = (intent: ClassificationResult['intent']): ClassificationResult => ({
  intent,
  bias: 'NONE',
  confidence: 0.88,
  financialEntities: [],
  requiresProbing: false,
});

const hardStopBlock: PreflightBlock = {
  rule: 'FCF_ZERO_INVESTMENT_BLOCK',
  severity: 'HARD_STOP',
  directive: 'test directive',
};

const softWarnBlock: PreflightBlock = {
  rule: 'EMERGENCY_FUND_PREFLIGHT',
  severity: 'SOFT_WARN',
  directive: 'test warning',
};

describe('Constitutional AI — WEALTH_ADVISORY_CONSTITUTION', () => {
  it('contains all 8 principles', () => {
    for (let i = 1; i <= 8; i++) {
      expect(WEALTH_ADVISORY_CONSTITUTION).toContain(`PRINCIPLE ${i}`);
    }
  });

  it('constitution includes SEBI reference', () => {
    expect(WEALTH_ADVISORY_CONSTITUTION).toContain('SEBI');
  });
});

describe('requiresConstitutionalReview — gate conditions', () => {
  it('returns true when HARD_STOP preflight block is present', () => {
    expect(requiresConstitutionalReview(cleanClassification('GENERAL'), [hardStopBlock])).toBe(true);
  });

  it('returns false for SOFT_WARN only with low-risk intent', () => {
    expect(requiresConstitutionalReview(cleanClassification('GENERAL'), [softWarnBlock])).toBe(false);
  });

  it('returns true for GOAL_PLANNING intent', () => {
    expect(requiresConstitutionalReview(cleanClassification('GOAL_PLANNING'), [])).toBe(true);
  });

  it('returns true for SUITABILITY_CHECK intent', () => {
    expect(requiresConstitutionalReview(cleanClassification('SUITABILITY_CHECK'), [])).toBe(true);
  });

  it('returns true for ACCELERATION intent', () => {
    expect(requiresConstitutionalReview(cleanClassification('ACCELERATION'), [])).toBe(true);
  });

  it('returns true when bias is FOMO (behavioral risk)', () => {
    const cls: ClassificationResult = { ...cleanClassification('EDUCATION'), bias: 'FOMO' };
    expect(requiresConstitutionalReview(cls, [])).toBe(true);
  });

  it('returns true when bias is LOSS_AVERSION', () => {
    const cls: ClassificationResult = { ...cleanClassification('RESILIENCE'), bias: 'LOSS_AVERSION' };
    expect(requiresConstitutionalReview(cls, [])).toBe(true);
  });

  it('returns false for CLARIFICATION intent with no blocks', () => {
    expect(requiresConstitutionalReview(cleanClassification('CLARIFICATION'), [])).toBe(false);
  });

  it('returns false for OFF_TOPIC intent', () => {
    expect(requiresConstitutionalReview(cleanClassification('OFF_TOPIC'), [])).toBe(false);
  });

  it('returns false for GENERAL with no entities and no blocks', () => {
    expect(requiresConstitutionalReview(cleanClassification('GENERAL'), [])).toBe(false);
  });
});

describe('runConstitutionalCritique — LLM interaction', () => {
  it('returns original draft when no violations found', async () => {
    const mockClient = makeMockClient(JSON.stringify({
      violations: [],
      requires_revision: false,
      revised_response: null,
      confidence_in_compliance: 0.95,
    }));

    const draft = 'Based on your goal to buy a home, your required SIP is subject to market conditions.';
    const result = await runConstitutionalCritique(draft, mockClient as never);

    expect(result.finalResponse).toBe(draft);
    expect(result.violations).toHaveLength(0);
    expect(result.requiresRevision).toBe(false);
    expect(result.reviewRan).toBe(true);
  });

  it('returns revised response when violation detected', async () => {
    const revisedText = 'Revised safe response without guaranteed returns.';
    const mockClient = makeMockClient(JSON.stringify({
      violations: ['PRINCIPLE 1: guaranteed return language detected'],
      requires_revision: true,
      revised_response: revisedText,
      confidence_in_compliance: 0.92,
    }));

    const draft = 'This fund guarantees 12% annual returns.';
    const result = await runConstitutionalCritique(draft, mockClient as never);

    expect(result.finalResponse).toBe(revisedText);
    expect(result.violations).toHaveLength(1);
    expect(result.requiresRevision).toBe(true);
    expect(result.reviewRan).toBe(true);
  });

  it('passes draft through on JSON parse failure — never blocks', async () => {
    const mockClient = makeMockClient('this is not valid json at all {{{');
    const draft = 'Original draft response.';
    const result = await runConstitutionalCritique(draft, mockClient as never);

    expect(result.finalResponse).toBe(draft);
    expect(result.violations).toHaveLength(0);
    expect(result.reviewRan).toBe(true);
  });

  it('passes draft through on network error — never blocks', async () => {
    const errorClient = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('Network timeout')),
        },
      },
    };

    const draft = 'Original draft that should pass through.';
    const result = await runConstitutionalCritique(draft, errorClient as never);

    expect(result.finalResponse).toBe(draft);
    expect(result.reviewRan).toBe(true);
  });
});
