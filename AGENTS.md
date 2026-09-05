# 🤖 AI Agent Guidelines & Project Knowledge Base

Welcome! This document provides critical architectural context, operating rules, and non-negotiable guidelines for any AI coding assistant (Claude Code, Cursor, GitHub Copilot, Antigravity, Devin, Codex, etc.) working on **TiloBox Invoice**.

Even if the user provides a brief prompt without full context, you **MUST** read and adhere to the decisions and invariants documented here.

---

## 1. Project Overview & Philosophy

- **Application**: **TiloBox Invoice** ([tilobox.com](https://tilobox.com))
- **Heritage**: Forked and evolved from _Invoify_, re-architected for Next.js 15 App Router.
- **Core Value Proposition**: A free, private, in-browser invoice and retail receipt generator for freelancers, contractors, and small businesses worldwide.
- **Zero-Database / Privacy-First**:
  - 100% client-side state with local storage persistence.
  - No user data, customer records, or financial numbers are stored in any database or external cloud storage.
  - Serverless functions are strictly stateless utilities (headless Chromium PDF rendering, email dispatch via SMTP).

---

## 2. 🏛️ Architecture Decisions Log (`docs/decisions/`)

All intentional architectural decisions, bug fixes, and system choices are formally recorded as **Architecture Decision Records (ADRs)** under [`docs/decisions/`](./docs/decisions/README.md).

### 🚨 Mandatory Directives for AI Agents:

1. **Consult Before Modifying**: Before refactoring or changing any system, read the corresponding ADR in `docs/decisions/`. **DO NOT undo or break decisions marked as `Approved`.**
2. **Log New Critical Decisions**: When you make an architectural choice, refactor a module, solve an edge-case bug, or implement an approved user plan:
   - Create a new date-stamped file in `docs/decisions/XXXX-short-title.md`.
   - Update the index table in `docs/decisions/README.md`.
3. **Updating Past Decisions**: If user requirements change and an older decision is modified, mark the older ADR as `Superseded by ADR-XXXX`, document the rationale, and link to the new record.

---

## 3. ⚠️ Critical Invariants (The "DO NOT BREAK" List)

| Area                   | Invariant Rule                                                                                                | Rationale / ADR Reference                                                                                                                                                                                   |
| :--------------------- | :------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PDF Generation**     | **NEVER** fall back to `window.print()` inside `generatePdf()`.                                               | Users expect an actual downloadable vector PDF. Silent fallback causes confusion. ([ADR-0001](./docs/decisions/0001-pdf-generation-and-print-decoupling.md))                                                |
| **Chromium Binary**    | Keep `@sparticuz/chromium` in `"dependencies"` (not `devDependencies`).                                       | Required by Vercel serverless functions at runtime. ([ADR-0001](./docs/decisions/0001-pdf-generation-and-print-decoupling.md))                                                                              |
| **Local PDF Testing**  | Preserve native Chrome/Edge auto-detection in `browser.ts`.                                                   | Avoids `-4094 spawn UNKNOWN` network share errors on Windows/WSL setups. ([ADR-0001](./docs/decisions/0001-pdf-generation-and-print-decoupling.md))                                                         |
| **Print Media**        | Maintain `@media print` isolation in `app/globals.css`.                                                       | Print must cleanly output ONLY the invoice, hiding navbars, forms, footers, and drawers. ([ADR-0002](./docs/decisions/0002-print-media-isolation.md))                                                       |
| **Favicon Route**      | **NEVER** create `public/favicon.ico`.                                                                        | Next.js App Router route `app/favicon.ico` is the sole provider. Duplicates cause HTTP 500 route collisions. ([ADR-0003](./docs/decisions/0003-pnpm-package-manager-and-symlinks.md))                       |
| **Webpack Symlinks**   | **NEVER** set `config.resolve.symlinks = false` in `next.config.js`.                                          | Breaks pnpm virtual store resolution (`@radix-ui/react-context`, etc.). `scripts/patch-fs.js` already normalizes Windows `EISDIR`. ([ADR-0003](./docs/decisions/0003-pnpm-package-manager-and-symlinks.md)) |
| **Schema Limits**      | Keep relaxed Zod limits in `lib/schemas.ts` (email: 254, name: 120, address: 250, zero-cost items: `gte(0)`). | Supports real-world corporate emails, multi-line addresses, and free promotional items. ([ADR-0004](./docs/decisions/0004-schema-validation-and-math-hardening.md))                                         |
| **Financial Math**     | Always clamp invoice total to `Math.max(0, ...)` and guard against `null`/`NaN`.                              | Prevents rendering negative balances (`-$25.00`) or UI crashes on unentered discounts. ([ADR-0004](./docs/decisions/0004-schema-validation-and-math-hardening.md))                                          |
| **CSV Exports**        | Output clean multi-row tabular accounting data without heavy base64 strings.                                  | Compatible with Excel, Google Sheets, and Numbers without cell corruption. ([ADR-0005](./docs/decisions/0005-offline-tabular-exports.md))                                                                   |
| **Offline Resilience** | Maintain 100% client-side zero-network export fallback for JSON, XML, and CSV.                                | Guarantees users can export invoices even during internet interruptions. ([ADR-0005](./docs/decisions/0005-offline-tabular-exports.md))                                                                     |
| **Pre-Commit Hook**    | Rely on local `.git/hooks/pre-commit` (`pnpm check` + auto-formatting).                                       | Remote CI was removed in favor of Vercel's automated deployment validation. ([ADR-0006](./docs/decisions/0006-local-precommit-quality-guard.md))                                                            |

---

## 4. Tech Stack & Environment

- **Framework**: Next.js 15.3.8 (App Router)
- **Language**: TypeScript 5.2.2 (strict mode)
- **Styling**: Tailwind CSS 3.3.5, `shadcn/ui` (Radix UI primitives)
- **Package Manager**: **`pnpm@10.34.5`** (Do NOT use `npm` or `yarn`)
- **Hosting**: Vercel
- **Local Dev Environment**: Windows 11 with WSL2 (`Ubuntu-20.04`) on 9P network drive (`Z:\...`)

---

## 5. Developer & Agent Commands

```bash
# Start local development server
pnpm dev

# Fast typecheck and generated CSS build
pnpm check

# Full production build (Next.js static optimization + serverless tracing)
pnpm build

# Format codebase with Prettier
pnpm format

# Run Playwright end-to-end tests
pnpm test:e2e
```

---

## 6. Git & Commit Guidelines

- **Commit Format**: Follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `fix(...)`: Bug fixes and edge-case hardening
  - `feat(...)`: New user-facing features
  - `chore(...)`: Tooling, dependencies, or configuration updates
  - `docs(...)`: Documentation and ADR updates
  - `refactor(...)`: Code refactoring without behavioral change
- **Verification Gate**: Ensure `pnpm check` passes before committing. The local `.git/hooks/pre-commit` hook will automatically enforce type safety and format staged files.
