/**
 * @layer L4 — Engine Director
 * @description Deterministic conflict resolution for competing engine directives.
 * Replaces naive string concatenation with a priority matrix that suppresses
 * lower-priority engines when higher-priority engines fire.
 * No LLM call. Pure priority logic. < 1ms.
 */

export type EngineKey =
  | 'SUITABILITY'
  | 'RESILIENCE'
  | 'PREFLIGHT'
  | 'GOAL_PLANNING'
  | 'ACCELERATION'
  | 'EDUCATION'
  | 'PROBING';

export type EngineDirectiveMap = Record<EngineKey, string>;

// Priority order — index 0 is highest priority
// SUITABILITY always wins: regulatory constraint
// RESILIENCE beats ACCELERATION: never push investment during panic
// PREFLIGHT beats ACCELERATION: financial health first
export const ENGINE_PRIORITY_ORDER: EngineKey[] = [
  'SUITABILITY',
  'RESILIENCE',
  'PREFLIGHT',
  'GOAL_PLANNING',
  'ACCELERATION',
  'EDUCATION',
  'PROBING',
];

// When the key engine fires, the listed engines are suppressed
const ENGINE_CONFLICT_RULES: Partial<Record<EngineKey, EngineKey[]>> = {
  SUITABILITY:  ['ACCELERATION', 'GOAL_PLANNING', 'EDUCATION'],
  RESILIENCE:   ['ACCELERATION'],
  PREFLIGHT:    ['ACCELERATION'],
  GOAL_PLANNING:['PROBING'],
  EDUCATION:    ['PROBING'],
  ACCELERATION: ['PROBING'],
};

/**
 * Resolves competing engine directives into a single ordered directive string.
 * Higher-priority engines suppress lower-priority engines per conflict rules.
 * Returns a clean directive set the LLM receives — never a concatenated conflict.
 */
export function resolveEngineDirectives(rawDirectives: EngineDirectiveMap): string {
  // Collect active engines (non-empty directive)
  const activeEngines: EngineKey[] = ENGINE_PRIORITY_ORDER.filter(
    key => rawDirectives[key] && rawDirectives[key].trim() !== ''
  );

  if (activeEngines.length === 0) return '';

  // Build suppression set from active high-priority engines
  const suppressedEngines = new Set<EngineKey>();
  for (const engine of activeEngines) {
    const overrides = ENGINE_CONFLICT_RULES[engine] ?? [];
    overrides.forEach(o => suppressedEngines.add(o));
  }

  // Apply suppression and format
  const resolvedEngines = activeEngines.filter(e => !suppressedEngines.has(e));

  const formatted = resolvedEngines.map((engine) => {
    const priority = ENGINE_PRIORITY_ORDER.indexOf(engine) + 1;
    return `[${engine} ENGINE — PRIORITY ${priority}]\n${rawDirectives[engine].trim()}`;
  });

  const suppressed = activeEngines.filter(e => suppressedEngines.has(e));
  if (suppressed.length > 0) {
    console.log(`[L4-DIRECTOR] Active: [${resolvedEngines.join(', ')}] | Suppressed: [${suppressed.join(', ')}]`);
  } else {
    console.log(`[L4-DIRECTOR] Active: [${resolvedEngines.join(', ')}]`);
  }

  return formatted.join('\n\n');
}
