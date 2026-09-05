# ADR-0001: PDF Generation & Print Decoupling

- **Date**: 2026-09-05
- **Status**: Approved
- **Author**: Antigravity / mussaddiqmahmood7
- **User Approved**: Yes

## Context & Problem Statement

In earlier versions, when clicking "Generate PDF", the application frequently popped open the browser's raw `window.print()` dialog instead of downloading a downloadable vector PDF. Furthermore, on Vercel, serverless PDF generation threw 500 errors (`Cannot find module '@sparticuz/chromium'`), and running locally on Windows/WSL threw `PUPPETEER LAUNCH ERROR: Error: spawn UNKNOWN, errno: -4094` across 9P network shares.

## Considered Options

1. **Fallback to `window.print()` on failure**: Poor user experience; prints the whole webpage and confuses users expecting a PDF download.
2. **Client-side HTML2Canvas / jsPDF**: Renders rasterized, blurry images with bad text selection and poor page-break support.
3. **Decoupled Serverless Vector PDF with Dual Chromium Strategy**:
   - Production (Vercel): `@sparticuz/chromium` in `dependencies`.
   - Local Dev (Windows/WSL/macOS): Auto-detect local host Google Chrome or Microsoft Edge installations in `services/invoice/server/browser.ts`.
   - Dedicated error handling without silent fallback to `window.print()`.

## Decision Taken

1. **Moved `@sparticuz/chromium` to `dependencies`** in `package.json` so Vercel includes the binary in serverless functions.
2. **Implemented Local Browser Auto-Detection** in `services/invoice/server/browser.ts`:
   - Checks default paths for Chrome and Edge on Windows (`C:\Program Files\Google\Chrome\...`, `%LOCALAPPDATA%\...`), Linux (`/usr/bin/google-chrome`, `/usr/bin/chromium`), and macOS.
   - Eliminates `-4094 spawn UNKNOWN` network share errors on WSL/Windows.
3. **Decoupled `generatePdf` from `window.print()`**:
   - Removed automatic fallback calls to `window.print()` in `contexts/InvoiceContext.tsx`.
   - If an error or offline state occurs, descriptive toast notifications are shown to the user while keeping their form data safe.
4. **Added Iframe PDF Printing**:
   - In `app/components/invoice/actions/FinalPdf.tsx`, clicking "Print" inside the PDF preview prints the rendered vector PDF directly via an iframe, avoiding popup blockers.

## Consequences & Invariants (DO NOT BREAK)

- **DO NOT** re-introduce `window.print()` inside `generatePdf()` or error catch blocks.
- **DO NOT** move `@sparticuz/chromium` back to `devDependencies`.
- **DO NOT** remove the local Chrome/Edge executable path resolver in `browser.ts`.
