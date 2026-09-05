# ADR-0004: Schema Validation & Financial Math Hardening

- **Date**: 2026-09-05
- **Status**: Approved
- **Author**: Antigravity / mussaddiqmahmood7
- **User Approved**: Yes

## Context & Problem Statement

1. **Overly Restrictive Validation**: In `lib/schemas.ts`, field length constraints rejected valid real-world business inputs (e.g., email had `.max(30)`, rejecting corporate emails like `accounting@international-corporation.com`; addresses had `.max(70)`, rejecting multi-line addresses).
2. **Draft Rejection on Empty Dates**: Empty date strings `""` threw `invalid_date` errors, blocking users from saving or previewing drafts.
3. **Zero-Cost Items Rejected**: `quantity` and `unitPrice` enforced `.gt(0)`, preventing legitimate complimentary/promotional services or zero-cost warranty items.
4. **Calculations Crashes & Negative Totals**:
   - `TypeError: Cannot read properties of undefined` occurred if discount was not provided.
   - Heavy discounts caused invoices to compute negative totals (e.g. `-$25.00`).
   - `formatPriceToString` threw unhandled exceptions on `NaN` or `Infinity`.

## Considered Options

1. **Strict validation**: Reject any incomplete or unusual invoice data (hurts usability and conversion).
2. **Loosened Schemas + Hardened Math Calculations**: Adapt schema constraints to RFC standards and real business workflows, while hardening calculation functions against edge cases (`null`, `undefined`, `NaN`, negatives).

## Decision Taken

1. **Updated Field Length Constraints in `lib/schemas.ts`**:
   - `email`: Expanded to RFC standard `.max(254)`.
   - `name`: Expanded to `.max(120)`.
   - `address`: Expanded to `.max(250)`.
   - `city` and `country`: Expanded to `.max(100)`.
   - `date`: Coerced to safely accept `""`, `null`, and `undefined` without throwing.
   - `quantity` & `unitPrice`: Relaxed to `.gte(0)`.
2. **Hardened Calculations in `contexts/ChargesContext.tsx` & `lib/helpers.ts`**:
   - Added null guards across discount, tax, and shipping calculations.
   - Guarded `(itemsArray || []).reduce(...)`.
   - Clamped subtotal and total to non-negative 0 via `Math.max(0, ...)`.
   - Guarded `formatPriceToString` against `NaN` and `Infinity`.

## Consequences & Invariants (DO NOT BREAK)

- Never assume discounts or taxes are always defined objects; always provide default fallbacks (`discount?.amount ?? 0`).
- Never restrict emails below 254 characters or addresses below 200 characters.
- Invoices must never show negative balances or NaN in rendered templates.
