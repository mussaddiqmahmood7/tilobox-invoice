# Claude Code Instructions

Please refer to the master agent handbook and architectural decision log for all project instructions, conventions, and invariants:

- **Master Agent Rules**: [`AGENTS.md`](./AGENTS.md)
- **Architectural Decisions (ADRs)**: [`docs/decisions/README.md`](./docs/decisions/README.md)

### Quick Commands

- `pnpm dev`: Start development server
- `pnpm check`: Typecheck and verify generated CSS
- `pnpm build`: Next.js production build
- `pnpm format`: Format with Prettier

### Critical Rules

- Never fall back to `window.print()` inside PDF generation.
- Never add `public/favicon.ico`.
- Check `docs/decisions/` before altering core architectural patterns.
- Whenever making critical decisions or refactors, log them in `docs/decisions/`.
