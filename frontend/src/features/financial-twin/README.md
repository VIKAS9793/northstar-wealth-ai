# Financial Twin Feature Domain

## Purpose
Maintains the strictly typed domain models, interfaces, and mock data for the customer's financial profile. Ensures that all downstream services and UI components interact with a mathematically sound and type-safe representation of the user.

## Inputs
- Persona IDs (for mock data generation).

## Outputs
- `FinancialTwinProfile` objects.
- Strict Domain Types (`SIPAmount`, `InvestorAge`, `RiskProfile`).

## Dependencies
- None (Core Domain Layer).
