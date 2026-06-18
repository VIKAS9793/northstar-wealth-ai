# SEBI-Aware RM/VOC Product Plan

## Purpose

NorthStar Wealth Companion should not behave like a generic robo-advisor or a free-form investment chatbot.

The product direction is a compliance-aware Digital Relationship Manager built from live RM experience and daily investor voice-of-customer patterns: fear during market falls, FOMO after hearing peer returns, confusion around SIPs and goals, low understanding of compounding, cash-flow stress, and emotional decisions that can damage long-term outcomes.

The core promise:

> Help customers understand, protect, and progress toward their financial goals through explainable, suitability-aware, SEBI-aware guidance that educates before it recommends.

This document is a product and engineering plan, not legal advice. All production claims must be reviewed by qualified compliance/legal owners before launch. For the hackathon prototype, we should use the language "SEBI-aware" and "compliance-aware", not "SEBI-certified" or "SEBI-approved".

## Track Fit

The hackathon track asks for:

- Wealth advisory.
- Conversational AI.
- Mobile banking integration.
- Avatar-based digital wealth management.
- Personalized, scalable advisory using customer investment behavior and spending habits.

Our differentiated answer:

- Use RM-derived investor behavior intelligence as the product core.
- Convert customer confusion into guided, compliant financial education.
- Convert fear/FOMO into resilience and suitability checks.
- Convert spending and cash-flow patterns into goal-progress nudges.
- Keep the AI inside governance boundaries instead of allowing open-ended advice.

## Regulatory And Governance Anchors

Use these as design anchors for the prototype and future compliance review:

1. Investor protection is the primary regulatory posture. SEBI states its mandate as protecting investor interests, developing the securities market, and regulating it.
2. Investment-advice experiences must be suitability-aware, risk-aware, and transparent about assumptions, limitations, conflicts, and disclosures.
3. Investor-charter and complaint-disclosure expectations mean advisory interfaces should make escalation and grievance pathways visible where appropriate.
4. AI claims must be truthful. Do not claim autonomous intelligence, regulatory approval, superior returns, or model capability that the system cannot prove.
5. Mutual-fund and securities guidance must not imply guaranteed, assured, risk-free, or best-return outcomes.

## Product North Star

> A Digital RM that helps Indian investors make disciplined decisions by translating complex wealth decisions into simple, everyday explanations while staying inside suitability, disclosure, and governance boundaries.

The app should feel like:

- A patient RM, not a trading-tip engine.
- A financial educator, not a product seller.
- A behavior coach, not a generic chatbot.
- A goal companion, not a return predictor.
- A bank-integrated advisory layer, not an isolated robo-advisor.

## Customer VOC Taxonomy

These are the primary real-world investor patterns the product should understand.

| Investor VOC Pattern | Example Customer Language | Underlying Risk | Product Response |
|---|---|---|---|
| Market fear | "Market gir raha hai, SIP stop kar du?" | Loss aversion, panic redemption | Check emergency fund, explain SIP continuity, disclose market risk, avoid forced action |
| FOMO | "Mere friend ne smallcap/crypto se paisa banaya." | Suitability mismatch, herd behavior | Explain diversification, risk profile, time horizon, no "best fund" claim |
| Goal confusion | "Home lena hai, kitna SIP karna hai?" | Underfunded goals, wrong timeline | Calculate target gap, horizon, required monthly amount, assumptions |
| Cash-flow stress | "Income hai but saving nahi ho rahi." | EMI pressure, discretionary leakage | Inflow/outflow/EMI analysis, budget nudge, emergency reserve plan |
| Low literacy | "SIP ka benefit samajh nahi aata." | Misunderstanding compounding/volatility | Explain with analogy: mango tree, sale season, cricket team |
| Recency bias | "Last year ka best fund batao." | Performance chasing | Explain recent performance is not future suitability |
| High-risk request | "All money smallcap/F&O me daal do." | Unsuitable risk concentration | Hard suitability block and safer alternative framing |
| Complex or emotional case | "I am angry, I lost money, call someone." | Customer harm, trust loss | Escalate to RM with context summary |

## Compliance-Aware Decision Policy

Every customer action, nudge, and AI response must pass this decision policy.

### 1. Intent Gate

Classify the request before generation:

- Goal planning.
- SIP continuity.
- Education.
- Suitability check.
- Cash-flow resilience.
- FOMO/herd behavior.
- Market fear/loss aversion.
- Product-specific recommendation request.
- Off-topic request.
- Human escalation.

### 2. Suitability Gate

Before suggesting any investment direction, check:

- Risk profile.
- Age/life stage.
- Goal horizon.
- Emergency reserve.
- EMI burden.
- Existing SIP amount.
- Cash-flow surplus.
- Existing portfolio concentration, where available.
- Whether the user is asking for a high-risk instrument.

If suitability data is missing, ask one clarifying question instead of guessing.

### 3. Advice Boundary Gate

Allowed:

- Educational explanation.
- Goal-gap calculation with assumptions.
- SIP discipline coaching.
- Risk-profile-aligned guidance.
- Financial resilience nudges.
- "May be suitable" language with assumptions.
- RM escalation.

Blocked:

- Guaranteed returns.
- "Best fund" or "No. 1 fund" claims.
- Assured performance.
- Risk-free language.
- Exact buy/sell/switch commands without suitability and authorization boundary.
- Predictions framed as certainty.
- Unsupported product performance claims.
- Unverified tax, legal, or regulatory conclusions.

### 4. Disclosure Gate

Every recommendation-like response must include the minimum required context:

- Reason: why this response was generated.
- Suitability: why it fits or does not fit this customer.
- Risk: what can go wrong.
- Assumption: what data was used or assumed.
- Next step: one safe action or one clarifying question.

### 5. Human Escalation Gate

Escalate to RM when:

- The customer asks for a human.
- The customer is angry, panicked, or distressed.
- The query involves large-value or irreversible action.
- Risk profile conflicts with requested action.
- Data is insufficient for a safe answer.
- Compliance filters block the response more than once.
- The request involves tax/legal/estate planning beyond the app boundary.

## Analogy Library

Use analogies to educate, not to oversimplify risk.

| Concept | Analogy | Use Case | Guardrail |
|---|---|---|---|
| SIP during market fall | Sale season | Market correction and rupee-cost averaging | Do not say buying more always wins |
| Compounding | Mango tree | Long-term wealth creation | Explain time and discipline matter |
| Diversification | Cricket team | Avoid single-star fund chasing | Do not imply diversification removes risk |
| Emergency fund | Shock absorber | SIP continuity during life events | Avoid product push without suitability |
| Step-up SIP | Escalator | Salary increment or bonus | Check cash-flow surplus first |
| Asset allocation | Balanced meal | Risk-balanced portfolio | Do not recommend allocation without profile |
| Goal planning | Train timetable | Time horizon and required monthly effort | Make assumptions explicit |

## Robo-Advisory Landscape Signal

Current market signal: pure robo-advice is not the winning story by itself. The stronger direction is hybrid, governed, personalized, and human-escalation ready.

Observed trends:

- Robo-advisors remain useful for low-cost automated allocation and rebalancing, but customer needs often expand into planning, behavior coaching, tax, life goals, and human support.
- Recent industry coverage points to hybrid adviser models combining digital automation with access to qualified human advisers.
- Some digital-only robo offerings have shut down or been folded into broader wealth services, suggesting weak differentiation when the product is only allocation automation.
- AI-driven advisory claims are under regulatory scrutiny. The product must avoid AI-washing and must be able to prove what the AI does.
- India-specific direction should be conservative: treat AI as an assisted reasoning and education layer inside governance, not as an autonomous registered adviser.

NorthStar implication:

> Do not pitch this as "another robo-advisor." Pitch it as a bank-integrated Digital RM that combines investor behavior intelligence, financial education, resilience planning, and governed conversational guidance.

## Product Architecture Plan

### Layer 0: Input Security And Domain Boundary

Responsibilities:

- Block prompt injection and jailbreaks.
- Reject non-wealth, coding, political, medical, or unrelated queries.
- Separate user input from system instructions.
- Route crypto/trading-tip questions into either education or rejection, depending on policy.

Required evidence:

- Unit tests for prompt injection.
- Unit tests for off-topic blocking.
- Unit tests for crypto/trading policy.

### Layer 1: Investor Behavior Classifier

Responsibilities:

- Detect fear, FOMO, recency bias, herd behavior, goal confusion, low literacy, and cash-flow stress.
- Use deterministic rules first for demo stability.
- Use LLM only as language generation or secondary enrichment, not as sole compliance control.

Required evidence:

- VOC fixture file with real anonymized RM-style phrases.
- Intent tests for each VOC pattern.
- False-positive tests for normal wealth queries.

### Layer 2: Suitability And Resilience Engine

Responsibilities:

- Compute emergency reserve status.
- Compute monthly surplus after outflow and EMI.
- Identify SIP discontinuation risk.
- Check risk profile before high-risk guidance.
- Ask for missing data instead of hallucinating.

Required evidence:

- Tests for conservative profile rejecting high-risk prompts.
- Tests for low emergency reserve before increasing SIP.
- Tests for negative free cash flow.

### Layer 3: Goal Planning Engine

Responsibilities:

- Convert goal amount, progress, and horizon into required monthly effort.
- Show assumptions clearly.
- Prefer goal achievement and discipline over product recommendation.

Required evidence:

- Goal horizon must be stored explicitly or computed by a reviewed policy.
- Goal progress must have one schema: percent or amount, not both.
- Tests for home, child education, emergency fund, and retirement goals.

### Layer 4: Education And Analogy Engine

Responsibilities:

- Translate complex market concepts into day-to-day analogies.
- Use one analogy at a time.
- Tie analogy back to consequence of investor decision.

Required evidence:

- Golden responses for SIP correction, compounding, diversification, and emergency reserve.
- Compliance check that analogies do not imply certainty.

### Layer 5: Output Compliance Gate

Responsibilities:

- Block guarantee language.
- Block unsupported product ranking.
- Block certainty claims.
- Ensure risk disclosure is present when response includes investment direction.
- Log compliance outcome for audit.

Required evidence:

- Unit tests for prohibited terms.
- Integration tests proving model output passes through the gate.
- User-visible fallback that educates rather than simply refusing.

### Layer 6: Audit Trail And RM Handoff

Responsibilities:

- Record intent, suitability inputs, engine directives, compliance result, and escalation reason.
- Generate RM handoff summary.
- Keep customer data minimal and protected.

Required evidence:

- Structured audit event schema.
- No sensitive data in console logs.
- RM escalation tests.

## Customer Experience Plan

### Replace Generic Quick Actions

Avoid generic chips:

- Goals
- Learn
- Emergency Plan

Use VOC-led chips:

- "Should I stop my SIP?"
- "Can I afford my home goal?"
- "What should I do with bonus money?"
- "My friend made high returns"
- "Why is my SIP not growing?"
- "Is my emergency fund enough?"

### Replace Internal Language

Avoid customer-facing terms:

- Financial Twin
- Behavioral Engine
- CNS
- Goal Probability
- Compliance Layer

Use customer language:

- Money readiness
- Goal progress
- Safety net
- SIP discipline
- Spending pressure
- Risk fit

### Response Template

Every advisory-style response should follow:

1. Empathy: acknowledge the customer's concern.
2. Observation: show the relevant customer data.
3. Explanation: use simple analogy if useful.
4. Suitability: connect to risk profile and goal horizon.
5. Risk disclosure: no guarantees, market risk exists.
6. Action: one safe next step or one clarifying question.

Example structure:

```text
I understand why this feels worrying. When markets fall, stopping SIPs can feel safe, but it may interrupt your long-term goal discipline.

Your current safety net is about 2 months, so the first priority is resilience. Think of it like a shock absorber: if it is weak, every bump on the road can disturb the journey.

Before increasing or stopping SIPs, we should first protect 6 months of essential expenses. Mutual fund investments carry market risk, so this is not a guaranteed outcome. It is a discipline-first plan based on your current cash-flow and goal profile.

Would you like me to calculate how much monthly amount is needed to build that safety net?
```

## Implementation Roadmap

### Phase 1: Submission Readiness

- Create VOC prompt taxonomy and map it to classifier intents.
- Fix off-topic/crypto governance policy and tests.
- Fix goal progress schema.
- Replace customer-facing "Financial Twin" language.
- Add VOC-led quick action chips.
- Add response contract into orchestrator prompt and compliance tests.

### Phase 2: Compliance Evidence

- Add decision audit event shape.
- Add suitability explanation to every recommendation-like response.
- Add automated check for missing risk disclosure.
- Add RM escalation summary object.
- Add "not investment advice / educational prototype" wording where required.

### Phase 3: Robo-Advisory Differentiation

- Position NorthStar as "Digital RM + governed AI", not "robo-advisor".
- Add hybrid model story: AI handles education, triage, and calculations; RM handles complex and high-risk cases.
- Add conflict-of-interest and product-neutrality policy.
- Add model-capability disclosure: what the AI can and cannot do.

### Phase 4: Bank Integration Readiness

- Replace mock cash-flow with sandbox account data.
- Replace mock SIP status with SIP transaction history.
- Replace mock product suggestions with approved product catalog metadata.
- Send audit trail to bank compliance systems.
- Add customer consent boundaries for data use.

## Acceptance Criteria

The plan is implemented only when:

- Every VOC category has a deterministic route.
- Every route has a compliance policy.
- Every recommendation-like response explains assumptions, suitability, and risk.
- No response promises guaranteed or assured returns.
- No UI uses internal architecture terms for customers.
- Every high-risk request can be rejected or escalated safely.
- Every demo flow shows customer goal progress, education, and discipline.
- Tests prove governance is active before and after generation.

## Source Notes

- SEBI homepage states SEBI's investor-protection and market-regulation mandate: https://www.sebi.gov.in/
- SEBI Investment Advisers listing includes the Feb 06, 2026 Master Circular for Investment Advisers: https://www.sebi.gov.in/legal/master-circulars/feb-2026/master-circular-for-investment-advisers_99569.html
- SEBI circular on publishing Investor Charter and investor complaints by Investment Advisers: https://www.sebi.gov.in/legal/circulars/dec-2021/publishing-of-investor-charter-and-disclosure-of-investor-complaints-by-investment-advisers-on-their-websites-mobile-applications_54585.html
- SEBI FAQ page for SEBI Registered Investment Advisers: https://www.sebi.gov.in/otherentry/aug-2023/frequently-asked-questions-faqs-on-sebi-registered-investment-advisers_75022.html
- SEBI Investment Advisers listing showing current IA circular/master circular entries: https://www.sebi.gov.in/sebiweb/home/HomeAction.do?cid=26&doListingAll=yes
- SEC AI-washing enforcement action used as global robo/AI advisory caution: https://www.sec.gov/newsroom/press-releases/2024-36
- Recent robo-advisory market signal on hybrid adviser services: https://www.kiplinger.com/investing/hybrid-adviser-services-reviewed
- Recent report that SEBI is working on responsible AI guidelines for capital markets; monitor official SEBI circulars before turning this into production policy: https://m.economictimes.com/industry/banking/finance/banking/sebi-to-issue-guidelines-on-responsible-use-of-ai-in-capital-markets-chief-pandey-says/articleshow/131710055.cms
