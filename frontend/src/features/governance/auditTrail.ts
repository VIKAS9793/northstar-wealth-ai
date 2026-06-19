/**
 * @layer L7 — Audit Trail Engine
 * @description Immutable per-session interaction log for bank auditability.
 * Records every governance decision: threat level, classification, preflight blocks,
 * constitutional violations, compliance outcome, and Financial Twin snapshot.
 * In-memory store for prototype. Production: POST to IDBI audit infrastructure.
 * No LLM call.
 */

import { ThreatAssessment } from './threatIsolation';
import { ClassificationResult } from './domainClassifier';

export interface TwinSnapshot {
  age: number;
  riskProfile: string;
  emergencyFundMonths: number;
  freeCashFlow: number;
  goalCount: number;
  emiBurdenPercent: number;
}

export interface AuditEntry {
  // Identity
  auditId: string;
  sessionId: string;
  timestamp: string;
  customerId: string;

  // Input record
  rawInput: string;
  threatAssessment: ThreatAssessment;
  classificationResult: ClassificationResult;

  // Financial Twin snapshot at time of request
  twinSnapshot: TwinSnapshot;

  // Governance decisions
  enginesFired: string[];
  preflightBlocks: string[];
  constitutionalReviewRan: boolean;
  constitutionalViolations: string[];
  complianceViolations: string[];

  // Output record
  finalResponse: string;
  disclosuresInjected: string[];
  wasBlocked: boolean;
  confidenceScore: number;
}

// In-memory store keyed by sessionId
// Production replacement: POST /api/idbi/audit/wealth-ai
const auditStore = new Map<string, AuditEntry[]>();

function generateId(): string {
  // crypto.randomUUID() is available in Node 18+ and modern browsers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates and stores an immutable audit entry for a single interaction.
 * Fire-and-forget safe — does not throw. Returns the created entry.
 */
export function createAuditEntry(
  data: Omit<AuditEntry, 'auditId' | 'timestamp'>
): AuditEntry {
  const entry: AuditEntry = {
    ...data,
    auditId: generateId(),
    timestamp: new Date().toISOString(),
  };

  const existing = auditStore.get(data.sessionId) ?? [];
  existing.push(entry);
  auditStore.set(data.sessionId, existing);

  // Structured console log — visible in demo and browser devtools
  console.log(
    `[L7-AUDIT] id: ${entry.auditId} | intent: ${entry.classificationResult.intent} | ` +
    `conf: ${entry.confidenceScore.toFixed(2)} | engines: [${entry.enginesFired.join(',')}] | ` +
    `constitutional: ${entry.constitutionalReviewRan} | blocked: ${entry.wasBlocked}`
  );

  // Production hook — uncomment and configure for IDBI sandbox integration
  // fetch('https://api.idbi.internal/audit/wealth-ai/v1/entries', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.IDBI_AUDIT_TOKEN}` },
  //   body: JSON.stringify(entry),
  // }).catch(err => console.error('[L7-AUDIT] Production write failed:', err));

  return entry;
}

/**
 * Returns all audit entries for a session in chronological order.
 * Used by the session summary and post-shortlist review endpoints.
 */
export function getSessionAuditLog(sessionId: string): AuditEntry[] {
  return auditStore.get(sessionId) ?? [];
}

/**
 * Returns aggregate statistics for a session — for demo dashboard display.
 */
export function getSessionStats(sessionId: string): {
  totalInteractions: number;
  blockedInteractions: number;
  constitutionalReviewsRan: number;
  uniqueEnginesFired: string[];
  averageConfidence: number;
} {
  const entries = getSessionAuditLog(sessionId);
  if (entries.length === 0) {
    return {
      totalInteractions: 0,
      blockedInteractions: 0,
      constitutionalReviewsRan: 0,
      uniqueEnginesFired: [],
      averageConfidence: 0,
    };
  }

  const uniqueEngines = new Set<string>();
  entries.forEach(e => e.enginesFired.forEach(eng => uniqueEngines.add(eng)));

  return {
    totalInteractions: entries.length,
    blockedInteractions: entries.filter(e => e.wasBlocked).length,
    constitutionalReviewsRan: entries.filter(e => e.constitutionalReviewRan).length,
    uniqueEnginesFired: [...uniqueEngines],
    averageConfidence:
      entries.reduce((sum, e) => sum + e.confidenceScore, 0) / entries.length,
  };
}
