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
  | 'TAX_PLANNING'
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
  // Core Mutual Fund & Regulatory
  'mutual fund', 'amc', 'amfi', 'sebi', 'nav', 'aum', 'nfo', 'folio', 'kyc', 'ckyc', 'rta', 'cams', 'kfintech', 'ter', 'expense ratio', 'exit load', 'entry load',
  
  // Investment Modes
  'sip', 'swp', 'stp', 'lumpsum', 'step-up', 'top-up', 'systematic investment plan', 'systematic transfer plan', 'systematic withdrawal plan',
  
  // Equity Fund Categories (SEBI defined)
  'large cap', 'mid cap', 'small cap', 'multi cap', 'flexi cap', 'focused fund', 'value fund', 'contra fund', 'dividend yield', 'elss', 'index fund', 'etf', 'fund of funds', 'fof', 'sectoral', 'thematic',
  
  // Debt Fund Categories
  'liquid fund', 'overnight fund', 'ultra short duration', 'low duration', 'money market', 'short duration', 'medium duration', 'long duration', 'dynamic bond', 'corporate bond', 'credit risk', 'banking and psu', 'gilt fund', 'floater fund',
  
  // Hybrid & Solution Oriented
  'conservative hybrid', 'balanced hybrid', 'aggressive hybrid', 'dynamic asset allocation', 'baf', 'multi asset allocation', 'arbitrage', 'equity savings', 'retirement fund', "children's fund",
  
  // Performance & Portfolio Metrics
  'alpha', 'beta', 'standard deviation', 'sharpe ratio', 'sortino ratio', 'treynor ratio', 'tracking error', 'xirr', 'cagr', 'absolute return', 'benchmark', 'tri', 'total return index', 'yield to maturity', 'ytm', 'macaulay duration', 'modified duration',
  
  // Tax & Plan Types
  'ltcg', 'stcg', '80c', 'indexation', 'grandfathering', 'capital gains', 'idcw', 'growth option', 'direct plan', 'regular plan', 'dividend',
  
  // General Personal Finance & Other Assets
  'portfolio', 'goal', 'corpus', 'return', 'equity', 'debt', 'rebalance', 'allocation', 'fd', 'fixed deposit', 'ppf', 'nps', 'insurance', 'term plan', 'emergency fund', 'home loan', 'emi', 'income', 'salary', 'bonus', 'tax', 'epf', 'vpf', 'sukanya samriddhi', 'ssy', 'sovereign gold bond', 'sgb', 'nsc',

  // Indian colloquial high-risk investment signals
  // These terms are used by retail investors in Hinglish/Hindi context when requesting
  // high-risk instruments. Presence boosts confidence and triggers SUITABILITY_CHECK routing.
  'multibagger', 'intraday', 'momentum fund', 'momentum invest', 'high yield fund',
  'leveraged fund', 'leverage fund', 'speculative fund', 'speculative invest',
  'high beta', 'concentrated fund', 'high return fund',
  // Hinglish risk phrases
  'zyada return', 'jyada return', 'zyada munafa', 'paisa double', 'double karo',
  'risky bet', 'high risk bet', 'mota munafa', 'mota return',
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
  // TAX_PLANNING — personalised tax calculation / ITR / advisory (HIGHEST PRIORITY)
  // Must be first rule: orchestrator short-circuits to RM escalation on this intent
  // without invoking the LLM. Pattern mirrors isTaxPlanningQuery() in taxRules.ts.
  // If you update the pattern here, update taxRules.ts#isTaxPlanningQuery in the same commit.
  {
    pattern: /\b(calculat|comput|minimis|minimiz|optimis|optimiz|tax harvest|save tax|tax saving|tax plan|plan.*tax|my tax|tax.*my|my gain.*tax|tax.*my gain|itr|income tax return|file.*return|return.*filing|advance tax|form 16|ais statement|tax audit|ca advice|chartered accountant|tax consultant|tax advisor|how much tax|what tax|exact tax|tax liabilit|tax outgo|tax position|declare.*itr|what to declare|pay to govt|pay to government|tax bachana|tax bacha|tax kam|pay less tax|reduce tax|tax implication|tax calculation|tax impact|tax exposure|deduction.*my)/i,
    intent: 'TAX_PLANNING',
    bias: 'NONE',
    baseConfidence: 0.97,
  },
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
  // SUITABILITY CHECK — high-risk instrument requests (SEBI taxonomy + colloquial + Indian context)
  // Colloquial terms added (2026-06-26): retail investors rarely use SEBI vocabulary.
  // Indian colloquial terms added (2026-06-26): covers Hinglish phrases used by retail investors
  // to express high-risk intent (multibagger, intraday, paisa double, zyada return, etc.).
  // Without these, all colloquial high-risk requests fall through to GENERAL and bypass
  // the Progressive Escalation Interceptor in orchestrator.ts.
  {
    pattern: /small.?cap|mid.?cap|f&o|futures|options|direct equity|penny stock|derivatives|sectoral fund|thematic fund|risky fund|high.?risk (fund|invest|portfolio)|very risky|aggressive (fund|invest)|riskiest|high.?risk\b|multibagger|intraday (trad|invest)|momentum (fund|invest)|leveraged? (fund|etf)|speculative (fund|invest)|high yield fund|high beta|concentrated fund|high return fund|zyada return|jyada return|zyada munafa|paisa double|double (karo|my money|kar)|mota (munafa|return)|risky bet/i,
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
    // Clause A: Clear non-financial lifestyle/entertainment domains
    // Clause B: Tech action verb + tech keyword (covers write/debug/solve patterns)
    // Clause C: Standalone tech-stack keywords with no financial interpretation
    //   INCLUDED:  python, javascript, typescript, programming, coding,
    //              software development, web development, html, css
    //   EXCLUDED:  machine learning, AI, data science, deep learning
    //   Reason: "how does your AI work?" and "what ML model does Dhan use?" are
    //   product-relevant queries that must reach the LLM, not trigger a refusal.
    //   Blocking them standalone is a demo-killing false positive.
    // Clause D: learn/teach/tutorial + tech — catches "learn python" without an
    //   action verb, which the original 2-clause pattern missed entirely
    pattern: /\b(cricket( (match|score|team))?|bollywood|recipe|cook(ing)?|weather( (today|tomorrow|forecast))?|today'?s news|politics|vote|political( party)?)\b|\b(write|create|generate|debug|solve|build|compile|run)[\w\s]{0,20}(python|javascript|typescript|code|script|program|algorithm|software)\b|\b(python|javascript|typescript|programming|coding|software development|web development|html|css)\b|\b(learn|teach|help with|tutorial for|resources for|course on|guide to)[\w\s]{0,15}(python|javascript|typescript|programming|coding|software|scripting)\b/i,
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
      // Guard: TAX_PLANNING rule must never fire on tech-domain queries.
      // "Write me a python script to calculate LTCG" is a tech request.
      // Allow it to fall through to the OFF_TOPIC rule instead.
      if (rule.intent === 'TAX_PLANNING') {
        const isTechDomainQuery = /\b(python|javascript|typescript|code|script|program|software|coding|write a|build a|create a|debug|compile|html|css|sql query)\b/i.test(message);
        if (isTechDomainQuery) continue;
      }
      const confidence = Math.min(rule.baseConfidence + entityBoost, 0.99);

      // Entity-Override mechanism for Out-of-Domain queries
      if (rule.intent === 'OFF_TOPIC' && entities.length > 0) {
        // Tech-stack queries stay OFF_TOPIC even when they mention a finance term.
        // "python for portfolio management" is a tech request, not a financial planning
        // request — the finance word doesn't change its domain.
        // SEBI IA Reg 2(1)(l): investment advice means advice relating to investing,
        // not providing technology education because a user mentioned a portfolio.
        const isTechQuery = /\b(python|javascript|typescript|programming|coding|software|web development|html|css|scripting)\b/i.test(message);
        if (isTechQuery) {
          return {
            intent: 'OFF_TOPIC',
            bias: 'NONE',
            confidence: 0.94,
            financialEntities: entities,
            requiresProbing: false,
          };
        }
        // Non-tech off-topic with financial entities: downgrade to CLARIFICATION.
        // e.g. "cricket match bet on IPL teams" — has sports + possible financial angle.
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
