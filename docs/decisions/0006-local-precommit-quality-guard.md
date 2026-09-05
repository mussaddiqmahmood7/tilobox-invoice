# ADR-0006: Local Pre-Commit Quality Guard & CI Streamlining

- **Date**: 2026-09-05
- **Status**: Approved
- **Author**: Antigravity / mussaddiqmahmood7
- **User Approved**: Yes

## Context & Problem Statement

1. The repository transitioned to `pnpm`, but `.github/workflows/ci.yml` was still hardcoded to `npm ci`, causing constant red failure badges on GitHub.
2. Vercel already executes full production builds (`vercel build`), TypeScript checks, and asset generation on every push and PR. Running a duplicate, failing workflow on GitHub Actions was redundant and generated unnecessary noise.
3. Developers and AI agents could commit code with unformatted files or undetected TypeScript errors without catching them locally prior to pushing.

## Considered Options

1. **Maintain both GitHub Actions and Vercel**: High maintenance overhead, requires keeping GitHub Actions runners in sync with pnpm versions.
2. **Remove Redundant GitHub Actions + Enforce Local Pre-Commit Hook**:
   - Vercel acts as the single remote gatekeeper.
   - Local Git `pre-commit` hook provides instant 2-second feedback on `git commit`, running full TypeScript checks and auto-formatting staged files before code can ever leave the developer's computer.

## Decision Taken

1. **Removed `.github/workflows/ci.yml`**: Eliminated redundant GitHub Actions runs.
2. **Added Quality Check Scripts in `package.json`**:
   - `"typecheck": "tsc --noEmit"`
   - `"check": "pnpm build:pdf-css && pnpm typecheck"`
3. **Installed Local Git `pre-commit` Hook (`.git/hooks/pre-commit`)**:
   - Runs `pnpm check`. If TypeScript errors exist, the commit aborts with line numbers.
   - Automatically filters staged code files (`.ts`, `.tsx`, `.js`, `.json`, `.css`, `.md`) and formats them with Prettier, re-staging them into the commit.

## Consequences & Invariants (DO NOT BREAK)

- Before creating commits, verify that `pnpm check` passes.
- Do NOT bypass the pre-commit hook with `--no-verify` unless strictly necessary and intentional.
- If re-introducing remote GitHub Actions in the future, it must use `pnpm/action-setup@v4` with `pnpm install --frozen-lockfile`, not `npm ci`.
