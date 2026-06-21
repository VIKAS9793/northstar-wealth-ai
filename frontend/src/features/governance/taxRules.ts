/**
 * @file taxRules.ts
 * @description Deterministic Indian Mutual Fund Tax Rules Engine.
 *
 * Source Authority:
 *   - Finance (No. 2) Act, 2024 — effective 23 July 2024 (Union Budget 2024-25)
 *   - Income Tax Act, 1961 — Sections 10(38), 112A, 111A, 50AA
 *   - SEBI Circular on Fund Categorization (Oct 2017, amended 2023)
 *   - Income Tax Department: https://incometax.gov.in
 *
 * RULE: The AI MUST use these constants verbatim. It MUST NOT invent, estimate, or
 * extrapolate any tax rate or threshold. If a case is not covered here, it must
 * say: "For your specific tax situation, please consult a qualified CA or tax advisor."
 *
 * FY APPLICABILITY: 2025-26 (AY 2026-27) — rules effective from 23 July 2024.
 */

// ── HOLDING PERIODS ───────────────────────────────────────────────────────────

export const HOLDING_PERIODS = {
  EQUITY_LT_MONTHS: 12,   // > 12 months = Long-Term for equity-oriented funds
  DEBT_LT_MONTHS: 24,     // > 24 months = Long-Term for non-equity, non-specified funds
} as const;

// ── LTCG / STCG RATES ─────────────────────────────────────────────────────────

/**
 * Equity-Oriented Funds
 * Definition: Funds with ≥ 65% allocation to domestic equity shares.
 * Includes: Large Cap, Mid Cap, Small Cap, Flexi Cap, Multi Cap, ELSS,
 *           Aggressive Hybrid (65–80% equity), Arbitrage Funds.
 * Source: Section 112A, Finance (No.2) Act 2024
 */
export const EQUITY_FUND_TAX = {
  STCG_RATE_PCT: 20,            // Increased from 15% on 23 Jul 2024 (held ≤ 12 months)
  LTCG_RATE_PCT: 12.5,          // Increased from 10% on 23 Jul 2024 (held > 12 months)
  LTCG_EXEMPTION_INR: 125000,   // ₹1.25L per FY (increased from ₹1L on 23 Jul 2024)
  STCG_SURCHARGE_CAP_PCT: 15,   // Section 112A — surcharge on LTCG capped at 15%
  GRANDFATHERING_DATE: '2018-01-31', // FMV as on this date is alternate cost basis for pre-2018 units
  GRANDFATHERING_NOTE: 'For units purchased on or before Jan 31 2018, cost of acquisition is the higher of actual purchase price or NAV on Jan 31 2018 (subject to actual sale price cap).',
} as const;

/**
 * ELSS — Equity Linked Savings Scheme
 * Treated as equity-oriented for taxation.
 * Additional 80C benefit only under Old Tax Regime.
 * Source: Section 80C, Finance Act
 */
export const ELSS_TAX = {
  LOCK_IN_YEARS: 3,
  ALWAYS_LTCG: true, // Lock-in > 12 months, so redemption is always Long-Term
  LTCG_RATE_PCT: EQUITY_FUND_TAX.LTCG_RATE_PCT,
  LTCG_EXEMPTION_INR: EQUITY_FUND_TAX.LTCG_EXEMPTION_INR,
  SECTION_80C_MAX_DEDUCTION_INR: 150000, // ₹1.5L cap (shared across all 80C instruments)
  SECTION_80C_REGIME: 'OLD_TAX_REGIME_ONLY',
} as const;

/**
 * Specified Mutual Funds (Section 50AA)
 * Definition: Funds where ≤ 35% is in domestic equity (i.e., debt-heavy funds).
 * Includes: All Debt Funds, Liquid Funds, Overnight Funds, Money Market,
 *           Short/Medium/Long Duration, Corporate Bond, Credit Risk, Gilt,
 *           Gold FOFs, International FOFs, Conservative Hybrid (< 25% equity).
 * Rule applies to: Units ACQUIRED ON OR AFTER 1 April 2023.
 * Source: Section 50AA, Finance Act 2023
 */
export const DEBT_FUND_TAX = {
  APPLICABLE_FROM: '2023-04-01',
  STCG_RATE: 'SLAB_RATE', // 100% of gains added to income, taxed at investor's IT slab
  LTCG_RATE: 'SLAB_RATE', // No LTCG / STCG distinction — ALL gains taxed at slab rate
  INDEXATION_BENEFIT: false,
  NOTE: 'For units purchased on or after 1 Apr 2023, all gains (regardless of holding period) are treated as STCG and taxed at the investor\'s income tax slab rate. No indexation benefit is available.',
  LEGACY_NOTE: 'For units purchased before 1 Apr 2023 and redeemed after 2 years, gains were taxed at 20% with indexation. If redeemed before 2 years, gains were at slab rate.',
} as const;

/**
 * Gold ETFs (listed on NSE/BSE)
 * Holding period for LTCG: > 12 months (Finance Act 2024 change from 36 months)
 * Source: Finance (No.2) Act 2024
 */
export const GOLD_ETF_TAX = {
  LT_HOLDING_MONTHS: 12,      // Changed from 36 to 12 months — effective 23 Jul 2024
  LTCG_RATE_PCT: 12.5,        // No indexation
  STCG_RATE: 'SLAB_RATE',     // Held ≤ 12 months
  INDEXATION_BENEFIT: false,
} as const;

/**
 * International / Overseas FOFs
 * Treated as Specified Mutual Funds if > 65% in foreign assets.
 * For units acquired on or after 1 Apr 2023: all gains at slab rate.
 * Source: Section 50AA
 */
export const INTERNATIONAL_FOF_TAX = DEBT_FUND_TAX; // Same rule applies

/**
 * Hybrid Funds — Taxation by Equity Exposure
 * Aggressive Hybrid (65–80% equity): Equity rules apply
 * Balanced Hybrid (40–60% equity): Non-equity rules apply (slab rate for specified)
 * Conservative Hybrid (< 25% equity): Debt/Specified MF rules apply
 * Dynamic Asset Allocation (BAF): Depends on actual equity exposure at time of redemption
 */
export const HYBRID_FUND_TAX_GUIDE = {
  EQUITY_ORIENTED_THRESHOLD_PCT: 65, // ≥ 65% equity → equity tax rules
  DEBT_ORIENTED_THRESHOLD_PCT: 35,   // ≤ 35% equity → Section 50AA slab rate rules
  UNCERTAIN_BAND: '35\u201365% equity \u2014 refer to fund\'s actual equity exposure for classification',
} as const;

/**
 * NPS — National Pension System
 * Additional deduction over and above 80C limit.
 */
export const NPS_TAX = {
  SECTION: '80CCD(1B)',
  ADDITIONAL_DEDUCTION_INR: 50000, // ₹50,000 over and above ₹1.5L of 80C
  EMPLOYER_CONTRIBUTION_SECTION: '80CCD(2)',
  EMPLOYER_CONTRIBUTION_LIMIT_PCT: 10, // 10% of salary — no monetary cap
  MATURITY_TAXABILITY: '60% of corpus is tax-free at retirement; 40% must be used for annuity (taxable as income)',
} as const;

/**
 * PPF — Public Provident Fund
 * EEE instrument — Exempt at all 3 stages.
 */
export const PPF_TAX = {
  EEE: true, // Exempt-Exempt-Exempt: Contribution, Interest, Maturity all tax-free
  SECTION: '80C',
  ANNUAL_DEPOSIT_LIMIT_INR: 150000, // ₹1.5L per FY
  LOCK_IN_YEARS: 15,
} as const;

/**
 * STT — Securities Transaction Tax
 * Must be paid on equity MF redemptions for STCG/LTCG rates to apply.
 * All equity MF redemptions via AMC/exchanges have STT paid by AMC.
 */
export const STT_NOTE = 'STT is automatically deducted by the AMC on equity fund redemptions. Investors do not pay STT separately.';

// ── SYSTEM PROMPT BLOCK (deterministic, verbatim for LLM injection) ────────────

/**
 * Plain-text block injected into the AI system prompt when the query is tax-related.
 * The LLM must ONLY use these figures. It may not estimate, extrapolate, or source
 * tax rates from its training data (which may be stale).
 *
 * NOTE TO MAINTAINER: If the Finance Act is amended, update BOTH this block AND
 * the constant values above in the SAME commit. Do not update one without the other.
 */
export const TAX_RULES_SYSTEM_BLOCK = `
INDIAN MUTUAL FUND TAX RULES — DETERMINISTIC REFERENCE (Finance (No.2) Act 2024, effective 23 Jul 2024)

You are NOT a tax advisor. You CANNOT provide personalised tax calculations or advice.
However, you MUST use these exact, verified tax rules when the topic arises. Never guess or invent any rate.

EQUITY-ORIENTED FUNDS (≥ 65% domestic equity — includes ELSS, Aggressive Hybrid, Arbitrage):
• Holding ≤ 12 months → STCG taxed at 20% (flat, regardless of income tax slab)
• Holding > 12 months → LTCG taxed at 12.5% on gains exceeding ₹1.25 lakh per financial year
• ELSS: 3-year lock-in ensures all redemptions qualify as LTCG at 12.5% (above ₹1.25L)
• ELSS 80C deduction: Up to ₹1.5 lakh per FY under OLD tax regime only
• Grandfathering: For units bought on or before 31 Jan 2018, the cost of acquisition is the higher of the actual purchase price or the NAV on 31 Jan 2018

DEBT / SPECIFIED MUTUAL FUNDS (≤ 35% domestic equity — Section 50AA):
• For units acquired ON OR AFTER 1 April 2023: ALL gains are taxed at your applicable income tax slab rate — regardless of holding period. No STCG/LTCG distinction. No indexation.
• This covers: All debt funds, liquid funds, money market, gilt, credit risk, corporate bond, overnight, floater, Gold FOF, International FOF, Conservative Hybrid

GOLD ETFs (listed):
• Holding ≤ 12 months → Slab rate
• Holding > 12 months → LTCG at 12.5%, no indexation

HYBRID FUNDS:
• Aggressive Hybrid (65–80% equity): Equity rules apply
• Conservative Hybrid (< 25% equity): Debt/Slab rules apply
• Balanced Hybrid & BAF: Depends on actual equity exposure at redemption — inform customer to check the fund's equity allocation

NPS ADDITIONAL BENEFIT:
• Extra ₹50,000 deduction under Section 80CCD(1B) — this is OVER AND ABOVE the ₹1.5L limit of 80C
• 60% of NPS corpus at retirement is tax-free; 40% must be used for annuity (taxable)

MANDATORY DISCLAIMER: Always end any tax-related response with:
"These are the current rules as per Finance (No.2) Act 2024 (effective 23 Jul 2024). Tax laws may change. For your specific tax computation, gains calculation, or ITR filing, please consult a qualified Chartered Accountant or tax advisor."

HARD PROHIBITION: Do NOT calculate the customer's exact tax amount, do NOT file taxes, do NOT recommend tax-evasion strategies. Only explain the rules.
`.trim();

/**
 * TAX PLANNING ESCALATION — deterministic response, never modified by LLM.
 * Triggered when a customer asks for personalised tax calculations, planning,
 * ITR advice, or tax optimisation specific to their portfolio.
 *
 * The RM details here must match the HUMAN_ESCALATION block in orchestrator.ts.
 */
export const TAX_ESCALATION_RESPONSE =
  "Tax calculations, ITR filing, and personalised tax planning require a qualified Chartered Accountant and cannot be handled by an AI advisor under SEBI guidelines. " +
  "Shall I connect you to your Relationship Manager? Here are their details; they will guide you on your detailed tax related queries. " +
  "rm@northstarwealth.com | +91 800 555 0199";

/**
 * Returns true if the query requires PERSONALISED tax advice, calculation, or planning.
 * These queries are escalated to RM immediately — the LLM is NOT invoked.
 *
 * Pattern logic:
 * - Action verbs (calculate, compute, save, minimise, plan, file, harvest)
 *   paired with tax context = advisory intent
 * - Direct requests for ITR guidance, tax optimisation, or exact amounts
 * - "My tax", "my gains", "my portfolio tax" = personalised = RM only
 */
export function isTaxPlanningQuery(message: string): boolean {
  return /\b(calculat|calculer|comput|minimis|minimiz|optimis|optimiz|harvest|save tax|tax saving strateg|tax plan|plan my tax|my tax|tax on my|tax implication.*my|my gain.*tax|tax.*my gain|itr|income tax return|file.*return|return.*filing|advance tax|form 16|ais.*statement|tax audit|ca advice|chartered accountant|tax consultant|tax advisor|how much tax (will|do|should) i|what tax (will|do|should) i|tell me my tax|exact tax|tax liabilit|tax outgo|tax position|tax on my portfolio|tax on my sip|tax on my mutual|declare.*itr|what to declare)\b/i.test(message);
}

/**
 * Returns true if the query is INFORMATIONAL about tax rules (not personalised planning).
 * These queries are handled by the AI using TAX_RULES_SYSTEM_BLOCK constants.
 * e.g. "What is LTCG rate?" / "Is ELSS tax free?" / "What is 80C limit?"
 */
export function isTaxQuery(message: string): boolean {
  if (isTaxPlanningQuery(message)) return false; // Planning queries go to RM, not AI
  return /\b(tax|ltcg|stcg|capital gain|80c|elss tax|indexation|slab rate|grandfathering|tax benefit|after.?tax|tax.?free|exempt|section 112a|section 50aa|deduction|tax.?rate|dividend tax|idcw tax|tax on sip|tax on mutual|tax on fund|what is.*tax|how.*taxed|tax rules|finance act)\b/i.test(message);
}
