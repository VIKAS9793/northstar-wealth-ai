# Initial Insights & Engineering Breakdown
**Date:** June 14, 2026
**Project:** NorthStar Wealth Companion
**Challenge:** IDBI Innovate 2026 - Wealth Advisory Track

## 1. Requirement Decomposition

### Functional Requirements
*   **Conversational Interface:** An AI Wealth Companion Avatar that acts as the primary interface for users.
*   **Goal Mapping & Planning:** Engine to capture user goals (retirement, house, etc.) and calculate target corpus, time horizon, and monthly requirements.
*   **Contextual Education:** Delivery of specific mental models (e.g., "Mango Tree" for compounding) triggered by user queries or behaviors.
*   **Behavioral Bias Detection & Coaching:** Identifying FOMO, Recency Bias, etc. from chat history/intent and offering coaching nudges.
*   **Financial Resilience Engine:** Calculating an Emergency Readiness Score and suggesting SIP continuity strategies before processing redemptions.

### Non-Functional & Security Requirements
*   **AI Governance (SEBI-aware):** Strict output filtering to prevent guaranteed returns or uncompliant language. This is non-negotiable.
*   **Explainability:** Every recommendation must be accompanied by rationale, assumptions, risks, and alternatives.
*   **Scalability:** Needs to process continuous behavioral scoring without dragging UI thread performance.

---

## 2. Architecture Constraints & Considerations

### The "Single Source of Truth" Contract
For this application, the UI must merely reflect the state of the backend's "Financial Twin" and the active AI Conversation state.
If this is built as an Android application:
*   `Room` should store the local cache of user financial state and offline-ready coaching snippets.
*   The `ViewModel` will govern the UI state (e.g., Chat, Dashboard, Education).

If built as a Web Application:
*   `Redux`/`Context` or `Zustand` will hold the Financial Twin state.
*   The Governance Engine must sit on the backend (or a mocked serverless function) to ensure client-side tampering doesn't bypass SEBI compliance rules.

### AI Governance Layer
*   *Implementation thought:* We need an interception layer (Middleware or Interceptor pattern). Before any generated text reaches the UI, it passes through a validation engine that checks against regex/NLP rules for prohibited terms (e.g., "definitely", "guaranteed").

### Event-Driven Triggers
*   Pillar 7 (Goal Accelerator) mentions triggers like "Salary Hike" or "Bonus". We need an event bus or reactive streams (`SharedFlow` in Android, or `Observables` in web) to dispatch these life-events and immediately update the Financial Discipline Score and trigger a nudge.

---

## 3. Threat Modeling & Risks

*   **Prompt Injection:** A user might try to force the AI to guarantee a return to hold the bank liable. The AI Governance Engine is our primary mitigation.
*   **Data Privacy:** Financial data (goals, income, liabilities) is highly sensitive. No PII should leak in logs or be sent to non-secure third-party LLMs without anonymization.

---

## 4. Next Steps to Unblock Development

To begin writing code, I need the user to clarify the technical scope:
1.  **Platform:** Android (Kotlin/Compose) or Web (React/Next.js)?
2.  **Prototype Scope:** Are we building the Chat Interface first, the Onboarding/Goal Mapping, or a Landing Page to pitch the idea?
