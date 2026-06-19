# Security Policy

**Project:** NorthStar Wealth Companion — IDBI Innovate 2026  
**Maintainer:** Vikas Sahani  
**Classification:** Public Prototype / Proof of Concept  
**Effective Date:** June 2026

---

## Scope

This security policy covers the NorthStar Wealth Companion codebase hosted at  
`github.com/VIKAS9793/northstar-wealth-ai`.

It applies to:
- The Next.js frontend application (`/frontend`)
- The API route layer (`/frontend/src/app/api`)
- The 7-layer AI governance pipeline (`/frontend/src/features/governance`)
- The AI orchestrator (`/frontend/src/services/ai/orchestrator.ts`)
- All documentation in `/docs`

It does **not** apply to third-party services (NVIDIA NIM, Netlify), which operate under their own security policies.

---

## Supported Versions

This is a hackathon Proof of Concept. Only the current `main` branch receives security attention.

| Version | Supported |
|---|---|
| `main` (latest) | Yes |
| Any tagged release | No — prototype only |

---

## Reporting a Vulnerability

If you discover a security vulnerability, **do not open a public GitHub issue.**

Report privately via:
- **LinkedIn:** [Vikas Sahani](https://www.linkedin.com/in/vikas-sahani-727420358)
- **GitHub:** Direct message via [@VIKAS9793](https://github.com/VIKAS9793)

Include in your report:
1. A clear description of the vulnerability
2. The affected file(s) and line numbers if applicable
3. Steps to reproduce
4. Your assessment of the potential impact

Expected response time: within 72 hours for acknowledgement.

> [!IMPORTANT]
> This is a sandbox prototype. No real customer data, banking credentials, or IDBI systems are connected. The impact surface of any vulnerability is limited to the demonstration environment.

---

## AI-Specific Security Architecture

The primary security surface in this project is the AI input/output boundary. The following controls are implemented in code and verified by automated tests.

### L0 — Threat Isolation (Input WAF)

**File:** `frontend/src/features/governance/threatIsolation.ts`

All user input passes through a deterministic Semantic WAF before reaching the LLM. The WAF operates in under 1ms with no external dependency.

Controls implemented:
- 4 regex attack categories: `INSTRUCTION_OVERRIDE`, `PERSONA_SWITCH`, `SCOPE_EXFILTRATION`, `ADVERSARIAL_FRAMING`
- Jaccard semantic similarity against 5 known jailbreak fingerprints (threshold: 0.45)
- Input length anomaly detection (inputs over 800 characters flagged as `SUSPICIOUS`)

Outputs: `CLEAN` | `SUSPICIOUS` | `HARD_BLOCK`

HARD_BLOCK inputs never reach the LLM. They receive a fixed, sanitised refusal response.

### L1 — Domain Classification (Scope Enforcement)

**File:** `frontend/src/features/governance/domainClassifier.ts`

The classifier enforces topic boundary before routing. Off-topic queries are redirected without LLM engagement. Low-confidence inputs (below 0.65) are escalated to a probing engine rather than forwarded to the generative layer.

### L3 — Constitutional AI Critique (Output Self-Review)

**File:** `frontend/src/features/governance/constitution.ts`

For high-risk advisory intents (GOAL_PLANNING, SUITABILITY_CHECK, ACCELERATION, any detected behavioral bias), the LLM evaluates its own draft response against an 8-principle Financial Advice Constitution before the customer sees it. The critique call uses `temperature: 0.05` for near-deterministic review.

On any failure (network, timeout, JSON parse error), the original draft passes through — the critique layer never blocks the response pipeline.

### L6 — Post-Generation Compliance Filter (Output WAF)

**File:** `frontend/src/features/governance/complianceFilter.ts`

Every LLM-generated response is scanned post-generation for:
- 10 prohibited term patterns (guaranteed returns, risk-free, sure shot, etc.)
- 6 advisory overreach patterns (best fund, number one fund, etc.)
- Assumption transparency violations (financial projections without disclosure framing)

Violations trigger a hardcoded safe fallback response. The LLM output is never returned to the user if it contains prohibited content.

### L7 — Audit Trail

**File:** `frontend/src/features/governance/auditTrail.ts`

Every interaction produces an immutable `AuditEntry` recording the full governance decision chain: threat level, classification, preflight blocks, constitutional violations, compliance outcome, and the final response delivered.

Storage: In-memory session map for prototype. Production target: `POST /api/idbi/audit/wealth-ai` with bearer token auth.

---

## Credential and Secret Handling

### What this project uses

The only external secret this project requires is an NVIDIA NIM API key for LLM inference.

| Secret | Location | Handling |
|---|---|---|
| `NVIDIA_NIM_API_KEY` | `.env.local` (never committed) | Read server-side only via `process.env` in Next.js API routes |
| No other secrets | — | This project uses no database, no auth service, no payment processor |

### What is explicitly prohibited

- API keys are never logged at any log level
- API keys are never included in client-side bundles (the NVIDIA NIM call is server-side only in `route.ts`)
- No secrets are hardcoded anywhere in the codebase
- `.env.local` is listed in `.gitignore` and has never been committed

### Verification

```bash
# Verify no secrets are committed
git log --all --full-history -- "*.env*"
# Should return empty

# Verify no API key patterns in source
grep -r "nvapi-" frontend/src/
# Should return empty
```

---

## Data Handling

### Customer Data

This prototype uses entirely synthetic, mocked Financial Twin data generated at runtime (`frontend/src/features/financial-twin/mockData.ts`). No real customer data is collected, stored, or transmitted.

The mock data includes:
- Synthetic names, ages, and income figures
- Mocked portfolio values and goal progress
- No PII that could identify a real person

### Session Data

Session interaction data (chat messages, audit entries) is held in-memory for the duration of a browser session. It is not persisted to any database, file system, or third-party service. On page reload, all session data is lost.

### Data transmitted to NVIDIA NIM

The following is sent to the NVIDIA NIM inference endpoint on each chat interaction:
- The constructed system prompt (contains synthetic Financial Twin data only)
- The last 6 turns of chat history
- The current user message (post threat-isolation, post classification)

What is never sent:
- Raw unfiltered user input that triggers a HARD_BLOCK (blocked at L0 before the API call)
- Any real banking credentials or account numbers

---

## Dependency Security

### Current dependency posture

```bash
# Run audit from the frontend directory
cd frontend
npm audit
```

All production dependencies should resolve with zero high or critical vulnerabilities. The project uses a minimal dependency surface:
- Next.js 15 (framework)
- React 19 (UI)
- OpenAI SDK (NVIDIA NIM-compatible client)
- Tailwind CSS v4 (styling)
- Vitest (testing, devDependency only)

### Policy

- No new production dependencies are added without explicit justification
- Dependencies are pinned to exact versions in `package.json` for reproducible builds
- `npm audit` is run before any push to `main`

---

## Infrastructure Security

### Deployment

The prototype is deployed to Netlify. The following configuration is applied:

- All traffic served over HTTPS (enforced by Netlify)
- No server-side database or persistent storage
- Environment variables set via Netlify environment configuration (never in source)
- `netlify.toml` enforces no client-side caching of API responses

### API Route Security

The `/api/chat` route (`frontend/src/app/api/chat/route.ts`) implements:
- Input validation: rejects requests missing `message` or `customerProfile` fields with HTTP 400
- No authentication in prototype (public hackathon demo)
- Session correlation via `x-session-id` header for audit trail grouping
- SSE keep-alive to prevent connection timeout exploits

### Production Hardening Required Before Real Deployment

> [!WARNING]
> The following controls are NOT present in this prototype and MUST be implemented before any production or banking integration:

| Control | Current State | Production Requirement |
|---|---|---|
| Authentication | None | OAuth 2.0 / IDBI SSO integration |
| Rate limiting | None | Per-IP and per-session rate limiting on `/api/chat` |
| Input size cap | 800-char soft warn | Hard HTTP 413 at API route layer |
| Audit persistence | In-memory | POST to IDBI-controlled audit infrastructure |
| NVIDIA NIM key | Shared API key | Per-environment rotated key with secret manager |
| HTTPS enforcement | Netlify default | Bank-grade TLS 1.3 + HSTS |
| CSP headers | None | Strict Content-Security-Policy |
| CORS policy | Next.js default | Restricted to IDBI-controlled origins |

---

## Responsible AI Security

### Adversarial Input Handling

The system is designed to fail safely. If any governance layer encounters an unexpected error:
- L0 failure: input is treated as `SUSPICIOUS` and forwarded with a warning flag
- L3 failure: the original draft passes through unchanged (never blocks)
- L6 failure: the hardcoded fallback response is returned
- LLM generation failure: a hardcoded safe error response is returned

No failure mode results in an unfiltered LLM response reaching the user.

### Known Limitations (Prototype Scope)

| Limitation | Risk | Mitigation |
|---|---|---|
| Jaccard similarity is shallow | Sophisticated semantic attacks may evade L0 | Production: replace with embedding-based similarity or a fine-tuned classifier |
| Constitutional critique makes a second LLM call | The LLM could be prompted to produce a compliant-looking but misleading revision | Production: use a separate, smaller reviewer model fine-tuned on financial compliance |
| Compliance filter is regex-based | Context-dependent violations (implied guarantees) may pass | L3 constitutional critique provides secondary coverage for contextual violations |
| Audit log is in-memory | Audit trail lost on server restart | Production: persistent write to IDBI audit infrastructure before response is returned |

---

## Security Testing

The governance pipeline has automated test coverage for all security-relevant layers:

```bash
cd frontend
npm test
```

| Test Suite | Tests | Security Coverage |
|---|---|---|
| `governance.test.ts` | 42 | L0 threat blocking, L1 OOD rejection, L2 preflight hard stops, L6 prohibited term detection |
| `constitution.test.ts` | 16 | L3 constitutional principle enforcement, JSON parse failure safety |
| `orchestrator.test.ts` | 3 | End-to-end suitability hard rejection, off-topic routing |

All 68 tests must pass before any commit reaches `main`.

---

## Compliance Context

This prototype is architecturally aligned with the following frameworks. It does not claim formal certification against any of them.

| Framework | Relevance | Implementation |
|---|---|---|
| SEBI IA Regulations 2013 (amended 2020) | Robo-advisory suitability and disclosure | L2 preflight rules, L6 mandatory disclosures |
| AMFI Investor Protection Guidelines | Prohibited advisory language | L6 prohibited term patterns |
| Anthropic Constitutional AI (2022) | Self-critique methodology | L3 constitutional review loop |
| OWASP LLM Top 10 | LLM-specific attack surface | L0 threat isolation covers LLM01 (prompt injection) |

---

## Change Log

| Date | Change |
|---|---|
| June 2026 | Initial security policy — aligned to 7-layer governance pipeline |

---

*This security policy is a living document and will be updated as the architecture evolves.*
