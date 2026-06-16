# Governance Feature Domain

## Purpose
Enforces the strict SEBI regulatory guardrails and system-level security protections. This layer sits as a strict interceptor before and after the AI Orchestrator executes.

## Inputs
- Raw user text (for Input Security checks).
- Generated LLM output text (for Compliance validation).

## Outputs
- `Result<string, string>` indicating whether the message passed governance or was blocked with a fallback safe response.

## Dependencies
- `@/shared/types/Result`: For strict error handling boundaries.
