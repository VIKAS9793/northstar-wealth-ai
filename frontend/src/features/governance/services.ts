/**
 * @file services.ts
 * @description Governance service entry point — upgraded to delegate to
 * the 7-layer deterministic pipeline while preserving existing function
 * signatures for backward compatibility with orchestrator.ts and tests.
 *
 * MOD-1: validateInputSecurity now delegates to L0 threatIsolation.
 * MOD-1: validateOutputCompliance now delegates to L6 complianceFilter.
 * All existing call sites continue to work without modification.
 */

import { Result } from '@/shared/types/Result';
import { assessThreatLevel, HARD_BLOCK_RESPONSE } from './threatIsolation';
import { runComplianceFilter } from './complianceFilter';

/**
 * Validates raw user input against the L0 Threat Isolation layer.
 * Delegates to assessThreatLevel() — expanded from 3 patterns to semantic WAF.
 * Preserves original Result<string, string> return signature.
 */
export function validateInputSecurity(message: string): Result<string, string> {
  if (!message || message.trim().length === 0) {
    return { success: false, error: 'Please enter a valid message.' };
  }

  const assessment = assessThreatLevel(message);

  if (assessment.threatLevel === 'HARD_BLOCK') {
    return { success: false, error: HARD_BLOCK_RESPONSE };
  }

  // SUSPICIOUS inputs pass through with a warning — they reach the LLM
  // but are flagged in the audit trail for review
  if (assessment.threatLevel === 'SUSPICIOUS') {
    console.warn(`[GOVERNANCE] SUSPICIOUS input passed to LLM | reason: ${assessment.reason}`);
  }

  return { success: true, data: message };
}

/**
 * Evaluates AI response against L6 compliance filter.
 * Delegates to runComplianceFilter() — expanded from 2 patterns to 10 + intent-aware disclosures.
 * Preserves original Result<string, string> return signature.
 */
export function validateOutputCompliance(response: string): Result<string, string> {
  // Services.ts does not have intent context — uses GENERAL intent for baseline check
  const result = runComplianceFilter(response, 'GENERAL');

  if (!result.passed) {
    return { success: false, error: result.finalResponse };
  }

  return { success: true, data: result.finalResponse };
}

// Re-export all governance layers for unified import path
export * from './threatIsolation';
export * from './domainClassifier';
export * from './financialTwinValidator';
export * from './constitution';
export * from './engineDirector';
export * from './outputSchema';
export * from './complianceFilter';
export * from './auditTrail';
