# Git Workflow

*Document last updated: 2026-06-24*

This document outlines the strict version control, branch management, and CI/CD procedures for the IDBI Wealth Companion project. All engineers must adhere to these policies.

## 1. Branching Strategy

Our branching model is a hardened hybrid of Trunk-Based Development and GitFlow.

- **`main`**: The primary branch. Code here must ALWAYS be deployable and pass all 270+ governance and compliance tests. Direct pushes are blocked by branch protection.
- **`develop`**: The primary integration branch. All features and bug fixes target this branch first.
- **`release/vX.X.X`**: Cut from `develop` for final UAT testing before merging into `main`. Only bugfixes are allowed here.
- **`feature/<issue-id>-<short-desc>`**: Temporary branches for new development. Must branch off `develop`.
- **`bugfix/<issue-id>-<short-desc>`**: For fixing non-critical bugs.
- **`hotfix/<issue-id>-<short-desc>`**: For emergency fixes. Branches off `main` and merges back into both `main` and `develop`.
- **`sec/<issue-id>-<short-desc>`**: Reserved for security patches.

## 2. Commit Standards (Husky & Commitlint)

We use **Conventional Commits** to auto-generate changelogs and maintain auditability.
Local commits will fail if the message does not follow the format: `<type>(<scope>): <subject>`

**Allowed Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Formatting, missing semi-colons, etc
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding or correcting tests
- `build`: Changes to build systems or external dependencies
- `ci`: Changes to CI configuration
- `chore`: Other changes
- `sec`: Security and compliance patches

## 3. Pre-Commit Hooks

Before a commit is created, Husky will execute:
1. `npm run lint` (ESLint analysis)
2. `npm run test` (Vitest - all 270 tests must pass)

If any test fails, the commit is aborted. This ensures broken code never reaches the remote repository.

## 4. Pull Request Requirements

All changes must go through a Pull Request.
1. Use the official PR template.
2. Ensure no PII or secrets are included.
3. CI/CD GitHub Actions (`ci.yml`, `security.yml`) must pass successfully.
4. **CODEOWNERS**: Any changes to `frontend/src/features/governance/*`, `SECURITY.md`, or workflows require explicit approval from `@VIKAS9793`.

## 5. Rebasing vs Merging
- Always **Rebase** your feature branch against `develop` before opening a PR to maintain a linear history.
- Pull Requests to `develop` and `main` are typically **Squash Merged** to keep the primary history clean.
