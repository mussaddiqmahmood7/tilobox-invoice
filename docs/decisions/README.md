# Architecture Decision Records (ADRs)

This directory serves as the **permanent historical memory and architectural log** for TiloBox Invoice.

Every architectural decision, deliberate convention, bug mitigation, and performance choice that was made intentionally is documented here.

---

## 🤖 Mandatory Protocol for Future AI Agents

If you are an AI assistant (Claude Code, Cursor, GitHub Copilot, Antigravity, Devin, Codex, etc.) working on this repository, you **MUST** follow these rules:

1. **Read Before Changing**: Before refactoring, modifying, or "simplifying" any core system (PDF generation, printing, schema validation, package manager setup, next config, or exports), check this directory. **Do NOT revert any decision marked as `Approved` or `Active`.**
2. **Log New Critical Decisions**: Whenever you make a significant technical decision, architectural change, or fix a tricky edge-case with user approval:
   - Create a new file in this directory following the naming format: `XXXX-short-decision-title.md` (e.g., `0007-new-feature-architecture.md`).
   - Fill out the template below with the current date, status, context, decision, and consequences.
   - Add the new record to the Index table below.
3. **Updating or Superseding Decisions**: If user requirements change and an older decision is modified or replaced:
   - Update the older ADR's `Status` to `Superseded by ADR-XXXX`.
   - In the new ADR, reference the superseded ADR.
   - Record the date, rationale, and user confirmation for the update.

---

## ADR Template

```markdown
# ADR-XXXX: [Title of Decision]

- **Date**: YYYY-MM-DD
- **Status**: [Proposed | Approved | Superseded by ADR-YYYY | Deprecated]
- **Author**: [AI Agent Name / User]
- **User Approved**: [Yes / No]

## Context & Problem Statement

What problem were we trying to solve? What was broken, missing, or underspecified?

## Considered Options

1. Option 1 ...
2. Option 2 ...

## Decision Taken

What did we implement? Exactly which files were changed or created?

## Consequences & Invariants (DO NOT BREAK)

What must future developers and AI agents keep in mind? What assumptions rely on this decision?
```

---

## Index of Decisions

| ID                                                         | Title                                            | Date       | Status     | Summary                                                                                                                      |
| :--------------------------------------------------------- | :----------------------------------------------- | :--------- | :--------- | :--------------------------------------------------------------------------------------------------------------------------- |
| [ADR-0001](./0001-pdf-generation-and-print-decoupling.md)  | PDF Generation & Print Decoupling                | 2026-09-05 | `Approved` | Decouple PDF from `window.print()`, use Puppeteer + Sparticuz on Vercel, native Chrome auto-detection for WSL/Windows.       |
| [ADR-0002](./0002-print-media-isolation.md)                | Print Media CSS Isolation                        | 2026-09-05 | `Approved` | Strict `@media print` rules hiding all UI chrome and isolating invoice at 100% scale.                                        |
| [ADR-0003](./0003-pnpm-package-manager-and-symlinks.md)    | pnpm Package Manager & Symlink Resolution        | 2026-09-05 | `Approved` | Lock `pnpm@10`, use `shamefully-hoist=true`, normalize `EISDIR` with `patch-fs.js`, avoid `resolve.symlinks = false`.        |
| [ADR-0004](./0004-schema-validation-and-math-hardening.md) | Schema Validation & Financial Math Hardening     | 2026-09-05 | `Approved` | Loosen Zod limits for real-world emails/addresses/free items; clamp totals to non-negative 0; safe null discounts.           |
| [ADR-0005](./0005-offline-tabular-exports.md)              | Zero-Network Offline & Tabular Exports           | 2026-09-05 | `Approved` | 100% client-side zero-network fallback for JSON, XML, and clean multi-row tabular CSV (excluding heavy base64 strings).      |
| [ADR-0006](./0006-local-precommit-quality-guard.md)        | Local Pre-Commit Quality Guard & CI Streamlining | 2026-09-05 | `Approved` | Replace redundant GitHub Actions CI with fast local git `pre-commit` hook (typecheck + Prettier); Vercel guards deployments. |
