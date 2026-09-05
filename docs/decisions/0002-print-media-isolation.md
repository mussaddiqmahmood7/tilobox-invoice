# ADR-0002: Print Media CSS Isolation

- **Date**: 2026-09-05
- **Status**: Approved
- **Author**: Antigravity / mussaddiqmahmood7
- **User Approved**: Yes

## Context & Problem Statement

When users clicked the browser "Print" option or pressed `Ctrl+P`, the print preview displayed the entire website layout: header navbar, form inputs rail, action toolbars, landing showcase, FAQ accordions, mobile drawers, toasts, and footers. The invoice preview was also constrained by `hidden xl:block`, meaning on smaller viewports it didn't render in print media at all.

## Considered Options

1. **Rely on generic browser printing**: Captures website chrome, unusable as an official paper invoice.
2. **Open a separate print pop-up window with raw HTML**: Vulnerable to popup blockers, loses styled fonts and Tailwind assets.
3. **Comprehensive CSS `@media print` rules**: Cleanly hides all UI chrome in the existing document and isolates the invoice at 100% width with perfect CSS page-break properties.

## Decision Taken

1. **Added `@media print` Isolation Rules in `app/globals.css`**:
   - Explicitly hides: `header`, `footer`, `nav`, `aside`, `.no-print`, `.invoice-form-rail`, `.invoice-actions-toolbar`, `.mobile-action-bar`, `.landing-content`, `.toaster`, Radix dialogs and overlays.
   - Forces `@page` margin to `10mm` (or clean printable margins).
   - Isolates `#invoice-preview` and `.invoice-sheet-container` to `100%` width, unscaled (`transform: none !important`), borderless, and without box shadows.
2. **Universal Print Viewport in `InvoiceActions.tsx`**:
   - Replaced restrictive `hidden xl:block` constraints with `print:block print:w-full`, ensuring that print media renders the invoice regardless of screen width (desktop, tablet, or mobile).

## Consequences & Invariants (DO NOT BREAK)

- When adding new interactive elements, banners, floating buttons, or modals, always ensure they include the `no-print` class or are encapsulated within standard UI containers that are hidden in `@media print`.
- Do NOT add `transform: scale(...)` inside `@media print` as it causes rasterization blurring on physical paper.
