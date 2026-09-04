import React from "react";

// Helpers
import { formatDate, formatNumberWithCommas, isDataUrl } from "@/lib/helpers";

// Labels & theme
import type { InvoiceLabels } from "../invoiceLabels";
import { type InvoiceScale, type InvoiceTheme } from "../invoiceTheme";

// Types
import type { InvoiceType } from "@/types";

/**
 * Shared building blocks for the invoice layouts.
 *
 * Every layout composes these rather than repeating the markup — the two
 * original templates were near-identical 240-line files, so a fix to (say) the
 * conditional discount row had to be made twice. With ten layouts that would
 * have been ten times.
 *
 * These are plain functions of their props: no hooks, no context, because the
 * same components render server-side through renderToStaticMarkup for the PDF.
 *
 * The layouts render the invoice title as a styled <div>, never an <h1>. An
 * invoice is a document *inside* the page, not the page's own outline — and
 * because the same components render into the live preview, an <h1> here put
 * several competing top-level headings made of the user's own data into the
 * app's HTML. The page's real <h1> lives in LandingContent.
 *
 * Several parts carry a `data-edit-field` attribute naming the form field that
 * produced them. The live preview delegates a single click handler over the
 * whole document and uses it to jump to that field, which is how clicking the
 * invoice edits it. Plain data attributes rather than callbacks threaded
 * through PartCtx, so the PDF render path is untouched — it simply emits a few
 * inert attributes it never reads.
 */
export type PartCtx = {
    data: InvoiceType;
    labels: InvoiceLabels;
    theme: InvoiceTheme;
    scale: InvoiceScale;
    /** BCP-47 tag used for number and currency formatting. */
    locale: string;
    /**
     * Writing direction. The layouts use logical properties (text-start,
     * ms-, pe-…), which resolve against this — so the sided templates mirror
     * without needing an RTL variant of each.
     */
    dir: "ltr" | "rtl";
};

/**
 * Formats an amount in the document's locale.
 *
 * This used to be `${grouped} ${code}` with hardcoded English grouping, so a
 * German invoice showed "1,234.50 EUR" where it should read "1.234,50 EUR".
 * Intl gets the separators, the grouping and the placement right per locale.
 *
 * `currencyDisplay: "code"` is deliberate, for two reasons.
 *
 * The PDF embeds its fonts and makes no network requests, so a currency symbol
 * with no glyph in the embedded set has nowhere to go and Chromium substitutes
 * whatever the render machine has — which on Vercel's Lambda is nothing.
 * Auditing all 170 offered currencies across every locale turns up real
 * casualties: the manat sign for az/AZN, the baht sign, the fullwidth yen and
 * won. ISO codes are ASCII and always render.
 *
 * It is also the better choice on an invoice regardless: "$" is ambiguous
 * across USD, CAD, AUD, and half a dozen others, while "USD" is not. This is
 * also what the app displayed before, so it is not a surprising change — only
 * the number formatting around it is now correct.
 *
 * Falls back to the old format if `currency` is not a valid ISO 4217 code — it
 * is a free string on the invoice and Intl throws rather than degrading.
 */
const money = (value: unknown, currency: string, locale: string) => {
    const amount = Number(value ?? 0);
    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            currencyDisplay: "code",
        }).format(amount);
    } catch {
        return `${formatNumberWithCommas(amount)} ${currency}`;
    }
};

/* ------------------------------------------------------------------ */

/**
 * The sender's logo.
 *
 * `plate` sits it on a small white card. Layouts that paint the logo onto a
 * dark accent panel pass it, because a user's logo is an arbitrary image and
 * there is no way to make an arbitrary image legible on an arbitrary dark
 * colour by manipulating it.
 *
 * Sidebar and BoldHeader previously wrapped this in
 * `filter: brightness(0) invert(1)`, on the assumption that every logo is a
 * monochrome dark glyph that just needs flipping white. It is not a
 * contrast fix, it is destructive: brightness(0) multiplies every colour
 * channel by zero, so red, blue and white all become the same black, and
 * invert(1) then raises every one of them to pure white. Alpha is untouched —
 * so a logo exported on an opaque canvas, which is the common case, became a
 * solid white rectangle, and a transparent one became a featureless white
 * silhouette. A plate leaves the image alone.
 */
export function Logo({ data, labels, plate = false }: PartCtx & { plate?: boolean }) {
    const { details, sender } = data;
    if (!details.invoiceLogo) return null;

    const img = (
        <img
            src={details.invoiceLogo}
            width={140}
            height={100}
            alt={labels.logoAlt.replace("{name}", sender.name)}
            style={{ maxHeight: 64, width: "auto", objectFit: "contain" }}
        />
    );

    if (!plate) return img;

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: 6,
                padding: "6px 8px",
            }}
        >
            {img}
        </span>
    );
}

/** Sender or receiver address block. */
export function PartyBlock({
    ctx,
    party,
    heading,
    align = "left",
    field,
}: {
    ctx: PartCtx;
    party: InvoiceType["sender"] | InvoiceType["receiver"];
    heading?: string;
    align?: "left" | "right";
    /** Which party this is, for click-to-edit. */
    field?: "sender" | "receiver";
}) {
    const { scale, locale } = ctx;
    return (
        <div
            className={align === "right" ? "text-end" : ""}
            data-edit-field={field ? `${field}.name` : undefined}
        >
            {heading && (
                <p
                    className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
                >
                    {heading}
                </p>
            )}
            <p className={`${scale.name} mt-1 font-semibold text-gray-900`}>
                {party.name}
            </p>
            <address
                className={`${scale.body} mt-1 not-italic leading-relaxed text-gray-600`}
            >
                {party.address}
                {party.address && <br />}
                {[party.zipCode, party.city].filter(Boolean).join(", ")}
                <br />
                {party.country}
                {party.email && (
                    <>
                        <br />
                        {party.email}
                    </>
                )}
                {party.phone && (
                    <>
                        <br />
                        {party.phone}
                    </>
                )}
            </address>

            {party.customInputs?.map((input, i) => (
                <p key={i} className={`${scale.body} text-gray-600`}>
                    <span className="font-medium">{input.key}:</span>{" "}
                    {input.value}
                </p>
            ))}
        </div>
    );
}

/** Invoice number and the two dates, as label/value rows. */
export function DocumentMeta({
    ctx,
    align = "right",
}: {
    ctx: PartCtx;
    align?: "left" | "right";
}) {
    const { data, labels, scale, locale } = ctx;
    const { details } = data;

    const rows: [string, string, string][] = [
        [labels.invoiceNumber, details.invoiceNumber, "details.invoiceNumber"],
        [labels.invoiceDate, formatDate(details.invoiceDate, locale), "details.invoiceDate"],
        [labels.dueDate, formatDate(details.dueDate, locale), "details.dueDate"],
    ];

    return (
        <div className={align === "right" ? "text-end" : ""}>
            {rows.map(([label, value, field]) => (
                <div
                    key={label}
                    data-edit-field={field}
                    className={`${scale.body} flex gap-3 ${
                        align === "right" ? "justify-end" : ""
                    }`}
                >
                    <span className="font-medium text-gray-500">{label}:</span>
                    <span className="tabular-nums text-gray-900">{value}</span>
                </div>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */

export type ItemsTableProps = {
    ctx: PartCtx;
    /** Fills the header row with the accent instead of a hairline rule. */
    variant?: "rule" | "filled" | "plain";
};

export function ItemsTable({ ctx, variant = "rule" }: ItemsTableProps) {
    const { data, labels, theme, scale, locale } = ctx;
    const { details } = data;

    const headFilled = variant === "filled";

    return (
        <table className="w-full border-collapse">
            <thead>
                <tr
                    style={
                        headFilled
                            ? { backgroundColor: theme.accentColor }
                            : undefined
                    }
                >
                    {[labels.item, labels.qty, labels.rate, labels.amount].map(
                        (h, i) => (
                            <th
                                key={h}
                                className={[
                                    scale.label,
                                    "font-semibold uppercase tracking-wider",
                                    headFilled ? "px-2 py-2" : "pb-2",
                                    i === 0 ? "text-start" : "text-end",
                                    variant === "rule"
                                        ? "border-b-2 border-gray-300"
                                        : "",
                                ].join(" ")}
                                style={
                                    headFilled
                                        ? { color: "#ffffff" }
                                        : { color: theme.accentColor }
                                }
                            >
                                {h}
                            </th>
                        )
                    )}
                </tr>
            </thead>
            <tbody>
                {details.items.map((item, index) => (
                    <tr
                        key={index}
                        // Row-level, so clicking a line in the preview lands on
                        // that line's name field rather than the first one.
                        data-edit-field={`details.items.${index}.name`}
                        className={
                            variant === "plain"
                                ? ""
                                : "border-b border-gray-200"
                        }
                    >
                        <td className={`${scale.rowY} ${headFilled ? "px-2" : ""} align-top`}>
                            <p
                                className={`${scale.body} font-medium text-gray-900`}
                            >
                                {item.name}
                            </p>
                            {item.description && (
                                <p
                                    className={`${scale.label} whitespace-pre-line text-gray-500`}
                                >
                                    {item.description}
                                </p>
                            )}
                        </td>
                        <td
                            className={`${scale.rowY} ${scale.body} whitespace-nowrap text-end align-top tabular-nums text-gray-700`}
                        >
                            {item.quantity}
                        </td>
                        <td
                            className={`${scale.rowY} ${scale.body} whitespace-nowrap text-end align-top tabular-nums text-gray-700`}
                        >
                            {money(item.unitPrice, details.currency, locale)}
                        </td>
                        <td
                            className={`${scale.rowY} ${headFilled ? "px-2" : ""} ${scale.body} whitespace-nowrap text-end align-top font-medium tabular-nums text-gray-900`}
                        >
                            {money(item.total, details.currency, locale)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/* ------------------------------------------------------------------ */

export function TotalsBlock({
    ctx,
    emphasis = "rule",
}: {
    ctx: PartCtx;
    /** `fill` paints the grand total row with a tint of the accent. */
    emphasis?: "rule" | "fill";
}) {
    const { data, labels, theme, scale, locale } = ctx;
    const { details } = data;

    const rows: [string, string][] = [
        [labels.subtotal, money(details.subTotal, details.currency, locale)],
    ];

    if (details.discountDetails?.amount) {
        rows.push([
            labels.discount,
            details.discountDetails.amountType === "amount"
                ? `- ${money(details.discountDetails.amount, details.currency, locale)}`
                : `- ${details.discountDetails.amount}%`,
        ]);
    }
    if (details.taxDetails?.amount) {
        rows.push([
            labels.tax,
            details.taxDetails.amountType === "amount"
                ? `+ ${money(details.taxDetails.amount, details.currency, locale)}`
                : `+ ${details.taxDetails.amount}%`,
        ]);
    }
    if (details.shippingDetails?.cost) {
        rows.push([
            labels.shipping,
            details.shippingDetails.costType === "amount"
                ? `+ ${money(details.shippingDetails.cost, details.currency, locale)}`
                : `+ ${details.shippingDetails.cost}%`,
        ]);
    }

    return (
        <div className="w-full">
            {rows.map(([label, value]) => (
                <div
                    key={label}
                    className={`${scale.body} flex justify-between gap-6 py-1 text-gray-600`}
                >
                    <span>{label}</span>
                    <span className="tabular-nums">{value}</span>
                </div>
            ))}

            <div
                className={`mt-1 flex items-baseline justify-between gap-6 ${
                    emphasis === "fill"
                        ? "rounded px-3 py-2"
                        : "border-t-2 pt-2"
                }`}
                style={
                    emphasis === "fill"
                        ? { backgroundColor: theme.accentColor, color: "#fff" }
                        : { borderColor: theme.accentColor }
                }
            >
                <span className={`${scale.body} font-semibold uppercase tracking-wide`}>
                    {labels.total}
                </span>
                <span className={`${scale.total} font-bold tabular-nums`}>
                    {money(details.totalAmount, details.currency, locale)}
                </span>
            </div>

            {details.totalAmountInWords && (
                <p className={`${scale.label} mt-1.5 italic text-gray-500`}>
                    {labels.totalInWords}: {details.totalAmountInWords}{" "}
                    {details.currency}
                </p>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */

export function PaymentBlock({ ctx }: { ctx: PartCtx }) {
    const { data, labels, scale, locale } = ctx;
    const pay = data.details.paymentInformation;
    if (!pay?.bankName && !pay?.accountName && !pay?.accountNumber) return null;

    return (
        <div data-edit-field="details.paymentInformation.bankName">
            <p
                className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
            >
                {labels.paymentInfoHeading}
            </p>
            <div className={`${scale.body} mt-1 text-gray-700`}>
                {pay?.bankName && (
                    <p>
                        {labels.bankName}: {pay.bankName}
                    </p>
                )}
                {pay?.accountName && (
                    <p>
                        {labels.accountName}: {pay.accountName}
                    </p>
                )}
                {pay?.accountNumber && (
                    <p className="tabular-nums">
                        {labels.accountNumber}: {pay.accountNumber}
                    </p>
                )}
            </div>
        </div>
    );
}

export function NotesBlock({ ctx }: { ctx: PartCtx }) {
    const { data, labels, scale, locale } = ctx;
    const { details } = data;
    if (!details.additionalNotes && !details.paymentTerms) return null;

    return (
        <div className="space-y-2">
            {details.paymentTerms && (
                <div data-edit-field="details.paymentTerms">
                    <p
                        className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
                    >
                        {labels.paymentTerms}
                    </p>
                    <p className={`${scale.body} text-gray-700`}>
                        {details.paymentTerms}
                    </p>
                </div>
            )}
            {details.additionalNotes && (
                <div data-edit-field="details.additionalNotes">
                    <p
                        className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
                    >
                        {labels.additionalNotes}
                    </p>
                    <p
                        className={`${scale.body} whitespace-pre-line text-gray-700`}
                    >
                        {details.additionalNotes}
                    </p>
                </div>
            )}
        </div>
    );
}

export function SignatureBlock({ ctx }: { ctx: PartCtx }) {
    const { data, labels, scale, locale } = ctx;
    const { details, sender } = data;
    const signature = details.signature?.data;
    if (!signature) return null;

    return (
        <div>
            <p
                className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
            >
                {labels.signature}
            </p>
            {isDataUrl(signature) ? (
                <img
                    src={signature}
                    width={120}
                    height={60}
                    alt={labels.signatureAlt.replace("{name}", sender.name)}
                    style={{ maxHeight: 56, width: "auto" }}
                />
            ) : (
                <p
                    style={{
                        fontSize: 26,
                        fontFamily: `${details.signature?.fontFamily ?? "cursive"}, cursive`,
                        color: "#111827",
                        lineHeight: 1.2,
                    }}
                >
                    {signature}
                </p>
            )}
        </div>
    );
}

export function ContactFooter({ ctx }: { ctx: PartCtx }) {
    const { data, labels, scale, locale } = ctx;
    const { sender } = data;
    return (
        <div className={`${scale.label} text-gray-500`}>
            <p>{labels.contactHeading}</p>
            <p className="mt-0.5 font-medium text-gray-700">
                {[sender.email, sender.phone].filter(Boolean).join(" · ")}
            </p>
        </div>
    );
}
