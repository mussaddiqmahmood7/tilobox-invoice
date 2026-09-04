import type { InvoiceType } from "@/types";

/**
 * Works out the next invoice number from the ones already saved.
 *
 * Deliberately pattern-preserving rather than opinionated: it finds the last
 * run of digits in the most recent number and increments it, keeping the
 * prefix, the suffix and the zero padding. So `INV0007` becomes `INV0008`,
 * `2026-14` becomes `2026-15`, and `7` becomes `8`. If there is nothing to go
 * on, it starts at `INV0001`.
 *
 * The result is only ever a *suggestion*. The field stays a normal editable
 * input — an invoice number is a legal identifier and people have their own
 * schemes, so guessing and then locking the field would be worse than not
 * guessing at all.
 */
const TRAILING_DIGITS = /^(.*?)(\d+)(\D*)$/;

export const FALLBACK_INVOICE_NUMBER = "INV0001";

export function incrementInvoiceNumber(previous: string): string {
    const match = previous.trim().match(TRAILING_DIGITS);
    if (!match) {
        // No digits anywhere — appending one is more useful than replacing
        // whatever scheme the user has.
        return previous.trim() ? `${previous.trim()}-2` : FALLBACK_INVOICE_NUMBER;
    }

    const [, prefix, digits, suffix] = match;
    const next = String(Number(digits) + 1);
    // Preserve zero padding, but let the number outgrow it.
    const padded = next.padStart(digits.length, "0");
    return `${prefix}${padded}${suffix}`;
}

/**
 * The number to suggest for a new invoice, given everything saved so far.
 *
 * "Most recent" is the last entry in the saved list, which is the order this
 * app appends in — not a sort of the numbers themselves, since they are free
 * text and may not be comparable.
 */
export function nextInvoiceNumber(saved: InvoiceType[]): string {
    for (let i = saved.length - 1; i >= 0; i--) {
        const number = saved[i]?.details?.invoiceNumber;
        if (typeof number === "string" && number.trim()) {
            return incrementInvoiceNumber(number);
        }
    }
    return FALLBACK_INVOICE_NUMBER;
}
