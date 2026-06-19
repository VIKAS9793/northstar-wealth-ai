/**
 * @layer L1 — Domain Classification
 * @description Confidence-scored intent and bias classifier.
 * Replaces the 8-rule keyword heuristic with a scored ruleset that:
 * - Extracts financial entities to boost confidence
 * - Returns a confidence score (0.0–1.0) for OOD threshold gating
 * - Flags when probing is required before engine routing
 * No LLM call. Pure deterministic logic. < 2ms.
 */

export type IntentType =
  | 'GOAL_PLANNING'
  | 'RESILIENCE'
  | 'EDUCATION'
  | 'ACCELERATION'
  | 'SUITABILITY_CHECK'
  | 'CLARIFICATION'
  | 'OFF_TOPIC'
  | 'GENERAL';

export type BiasType =
  | 'LOSS_AVERSION'
  | 'FOMO'
  | 'HERD_MENTALITY'
  | 'RECENCY_BIAS'
  | 'OVERCONFIDENCE'
  | 'NONE';

export interface ClassificationResult {
  intent: IntentType;
  bias: BiasType;
  confidence: number;
  financialEntities: string[];
  requiresProbing: boolean;
}

// Financial entity vocabulary — presence in message boosts classification confidence
const FINANCIAL_ENTITIES: string[] = [
  'sip', 'mutual fund', 'portfolio', 'goal', 'corpus', 'return',
  'equity', 'debt', 'elss', 'nfo', 'nav', 'aum', 'lumpsum', 'step-up',
  'rebalance', 'allocation', 'fd', 'ppf', 'nps', 'insurance', 'term plan',
  'emergency fund', 'home loan', 'emi', 'income', 'salary', 'bonus',
  'tax', '80c', 'ltcg', 'stcg',
];

// Maximum confidence boost from financial entity presence
const MAX_ENTITY_BOOST = 0.12;
const ENTITY_BOOST_PER_MATCH = 0.04;

// OOD rejection threshold — below this confidence, the intent is ambiguous
export const OOD_CONFIDENCE_THRESHOLD = 0.65;

interface PatternRule {
  pattern: RegExp;
  intent: IntentType;
  bias: BiasType;
  baseConfidence: number;
}

const CLASSIFICATION_RULES: PatternRule[] = [
  // RESILIENCE — panic/fear/withdrawal signals
  {
    pattern: /crash|stop sip|stop my sip|pause sip|panic|withdraw|redeem|scared|worried|market (gir|fell|down|bad|crash)|bechna|nikalna|all time low|correction/i,
    intent: 'RESILIENCE',
    bias: 'LOSS_AVERSION',
    baseConfidence: 0.92,
  },
  // ACCELERATION — windfall/extra capital signals
  {
    pattern: /bonus|extra cash|windfall|paisa invest karna|salary credit(ed)?|lump.?sum|incentive|increment|got paid|received money/i,
    intent: 'ACCELERATION',
    bias: 'NONE',
    baseConfidence: 0.88,
  },
  // EDUCATION — FOMO patterns
  {
    pattern: /best fund|mere? friend|my friend|everyone is (buying|investing|doing)|crypto (ban|kar)|sabne kiya|neighbour|colleague made|heard about/i,
    intent: 'EDUCATION',
    bias: 'FOMO',
    baseConfidence: 0.90,
  },
  // EDUCATION — Herd mentality
  {
    pattern: /sablog (kar rahe|invest kar)|everyone has|herd|trending fund|popular fund|all my friends|all (are|were) investing/i,
    intent: 'EDUCATION',
    bias: 'HERD_MENTALITY',
    baseConfidence: 0.87,
  },
  // EDUCATION — Recency bias
  {
    pattern: /last year|past (year|month|quarter|6 months)|recent (rally|return|performance|gain)|pichle (saal|mahine)|kal ka return/i,
    intent: 'EDUCATION',
    bias: 'RECENCY_BIAS',
    baseConfidence: 0.85,
  },
  // SUITABILITY CHECK — high-risk instrument requests
  {
    pattern: /small.?cap|mid.?cap|f&o|futures|options|direct equity|penny stock|derivatives|sectoral fund|thematic fund/i,
    intent: 'SUITABILITY_CHECK',
    bias: 'OVERCONFIDENCE',
    baseConfidence: 0.90,
  },
  // GOAL PLANNING — life goal signals
  {
    pattern: /home|house|retire(ment)?|education|child|children|corpus|marriage|emergency fund|passive income|car|vehicle|vacation|travel|goal/i,
    intent: 'GOAL_PLANNING',
    bias: 'NONE',
    baseConfidence: 0.85,
  },
  // OFF TOPIC — confirmed out-of-domain
  {
    pattern: /\b(cricket (match|score|team)|bollywood|recipe|cook|weather|today'?s news|politics|vote|political)\b|\b(write|create|generate|debug|solve).*?(python|javascript|code|script|app|homework|math)\b/i,
    intent: 'OFF_TOPIC',
    bias: 'NONE',
    baseConfidence: 0.97,
  },
];

function extractFinancialEntities(message: string): string[] {
  const lower = message.toLowerCase();
  return FINANCIAL_ENTITIES.filter(entity => lower.includes(entity));
}

/**
 * Classifies user message with confidence scoring and entity extraction.
 * Use confidence < OOD_CONFIDENCE_THRESHOLD to trigger probing or rejection.
 */
export function classifyWithConfidence(message: string): ClassificationResult {
  const entities = extractFinancialEntities(message);
  const entityBoost = Math.min(entities.length * ENTITY_BOOST_PER_MATCH, MAX_ENTITY_BOOST);
  const wordCount = message.trim().split(/\s+/).length;

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.pattern.test(message)) {
      const confidence = Math.min(rule.baseConfidence + entityBoost, 0.99);

      // Entity-Override mechanism for Out-of-Domain queries
      if (rule.intent === 'OFF_TOPIC' && entities.length > 0) {
        return {
          intent: 'CLARIFICATION',
          bias: 'NONE',
          confidence: 0.85,
          financialEntities: entities,
          requiresProbing: true,
        };
      }

      const requiresProbing =
        confidence < 0.75 ||
        wordCount < 4;

      console.log(
        `[L1-CLASSIFIER] intent: ${rule.intent} | bias: ${rule.bias} | conf: ${confidence.toFixed(2)} | entities: [${entities.join(', ')}]`
      );

      return {
        intent: rule.intent,
        bias: rule.bias,
        confidence,
        financialEntities: entities,
        requiresProbing,
      };
    }
  }

  // No rule matched — check for OOD vs ambiguous GENERAL
  if (entities.length === 0 && wordCount <= 3) {
    console.log(`[L1-CLASSIFIER] intent: CLARIFICATION | conf: 0.50 | short query with no entities`);
    return {
      intent: 'CLARIFICATION',
      bias: 'NONE',
      confidence: 0.50,
      financialEntities: [],
      requiresProbing: true,
    };
  }

  const generalConfidence = Math.min(0.60 + entityBoost, 0.80);
  console.log(`[L1-CLASSIFIER] intent: GENERAL | conf: ${generalConfidence.toFixed(2)} | entities: [${entities.join(', ')}]`);

  return {
    intent: 'GENERAL',
    bias: 'NONE',
    confidence: generalConfidence,
    financialEntities: entities,
    requiresProbing: entities.length === 0,
  };
}
