# ADR-0003: pnpm Package Manager & Symlink Resolution

- **Date**: 2026-09-05
- **Status**: Approved
- **Author**: Antigravity / mussaddiqmahmood7
- **User Approved**: Yes

## Context & Problem Statement

1. Running `pnpm dev` locally in WSL threw:
   ```
   Attempted import error: 'useDismissableLayerSurface' is not exported from '@radix-ui/react-dismissable-layer'
   ```
2. Webpack failed to resolve internal Radix dependencies (`@radix-ui/react-context`, `@radix-ui/primitive`) under `pnpm`.
3. Vercel deployment failed during `pnpm install` with:
   ```
   ERR_PNPM_LOCKFILE_CONFIG_MISMATCH Cannot proceed with the frozen installation.
   The current "overrides" configuration doesn't match the value found in the lockfile.
   ```
4. On Windows network shares (WSL 9P mapped to `Z:\`), libuv `readlink` returns `EISDIR` instead of `EINVAL` on non-symlink paths, which breaks Webpack's `enhanced-resolve`.

## Considered Options

1. **Force npm**: Slow installations, larger disk footprint, user explicitly works with `pnpm`.
2. **Disable symlink resolution in Next.js (`config.resolve.symlinks = false`)**: Breaks pnpm completely because pnpm depends on symlinks into `.pnpm/` to resolve transitive dependencies.
3. **Correct pnpm Configuration + Symlink Preservation + libuv normalization**:
   - Explicitly add `@radix-ui/react-dismissable-layer` (v1.1.19) and `@radix-ui/react-direction` to `package.json`.
   - Remove `config.resolve.symlinks = false` so Webpack can follow pnpm's virtual store links.
   - Use `scripts/patch-fs.js` to normalize `EISDIR` to `EINVAL` for Windows shares.
   - Configure `.npmrc` with `shamefully-hoist=true`, `auto-install-peers=true`, and `confirm-modules-purge=false`.
   - Lock `"packageManager": "pnpm@10.34.5"` to prevent version mismatches on Vercel.

## Decision Taken

1. Added `"packageManager": "pnpm@10.34.5"` to `package.json`.
2. Created `.npmrc` with:
   ```ini
   shamefully-hoist=true
   auto-install-peers=true
   confirm-modules-purge=false
   ```
3. Removed `config.resolve.symlinks = false` from `next.config.js`.
4. Kept `scripts/patch-fs.js` loaded via `scripts/run-next.js` to handle any Windows network drive libuv edge-cases safely.
5. Removed redundant `"overrides"` block from `package.json` to keep `pnpm-lock.yaml` 100% frozen-lockfile compatible on CI/Vercel.
6. Removed duplicate `public/favicon.ico` to eliminate route collision with Next.js App Router's `app/favicon.ico`.

## Consequences & Invariants (DO NOT BREAK)

- **DO NOT** add `config.resolve.symlinks = false` in `next.config.js`.
- **DO NOT** add manual `overrides` in `package.json` without re-generating `pnpm-lock.yaml` with `--no-frozen-lockfile`.
- **DO NOT** re-create `public/favicon.ico`. Next.js App Router route `app/favicon.ico` is the sole provider.
