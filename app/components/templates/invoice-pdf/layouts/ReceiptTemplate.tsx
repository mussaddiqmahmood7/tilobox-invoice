import React from "react";

// Helpers
import { formatDate, formatNumberWithCommas } from "@/lib/helpers";
import PaymentQrCode from "@/app/components/reusables/PaymentQrCode";

// Labels & theme
import { DEFAULT_INVOICE_LABELS, type InvoiceTemplateExtras } from "../invoiceLabels";
import { fontStack, resolveTheme } from "../invoiceTheme";

// Types
import type { InvoiceType } from "@/types";

export type ReceiptProps = InvoiceType & InvoiceTemplateExtras;

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

export default function ReceiptTemplate(props: ReceiptProps) {
    const { sender, receiver, details } = props;
    const theme = resolveTheme(details.theme);
    const labels = props.labels ?? DEFAULT_INVOICE_LABELS;
    const locale = props.locale ?? "en-US";
    const pay = details.paymentInformation;
    const qr = pay?.paymentQr;

    const formattedDate = formatDate(details.invoiceDate, locale);

    return (
        <section
            dir={props.locale && ["ar", "he"].includes(props.locale) ? "rtl" : "ltr"}
            style={{ fontFamily: fontStack(theme.fontId) }}
            className="flex justify-center bg-muted/40 p-2 sm:p-4 print:bg-white print:p-0"
        >
            <style dangerouslySetInnerHTML={{
                __html: `
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    @media print {
                        body, html {
                            width: 80mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #ffffff !important;
                        }
                        .receipt-sheet {
                            width: 80mm !important;
                            max-width: 80mm !important;
                            box-shadow: none !important;
                            border: none !important;
                            border-radius: 0 !important;
                            padding: 4mm !important;
                            margin: 0 auto !important;
                        }
                    }
                `
            }} />

            <div
                className="receipt-sheet w-full max-w-[340px] rounded-lg border border-border bg-white p-5 text-gray-900 shadow-md font-mono text-xs print:max-w-none print:border-none print:p-2 print:shadow-none"
                style={{
                    backgroundColor: "#FFFFFF",
                    color: "#111827",
                }}
            >
                {/* Store Header */}
                <div className="text-center">
                    {details.invoiceLogo && (
                        <div className="mb-2 flex justify-center">
                            <img
                                src={details.invoiceLogo}
                                alt="Store Logo"
                                className="max-h-12 w-auto object-contain"
                            />
                        </div>
                    )}

                    <h1 className="text-base font-bold uppercase tracking-wider text-gray-900">
                        {sender.name || "TiloBox Store"}
                    </h1>

                    <div className="mt-1 space-y-0.5 text-[11px] text-gray-600 leading-tight">
                        {sender.address && <p>{sender.address}</p>}
                        {(sender.city || sender.zipCode || sender.country) && (
                            <p>
                                {[sender.zipCode, sender.city, sender.country]
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>
                        )}
                        {sender.phone && <p>Tel: {sender.phone}</p>}
                        {sender.email && <p>{sender.email}</p>}
                    </div>
                </div>

                {/* Dashed divider */}
                <div className="my-3 border-t border-dashed border-gray-400" />

                {/* Receipt Metadata */}
                <div className="space-y-1 text-[11px] text-gray-700">
                    <div className="flex justify-between">
                        <span className="font-semibold">RECEIPT #:</span>
                        <span className="font-bold">{details.invoiceNumber || "POS-001"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>DATE:</span>
                        <span>{formattedDate}</span>
                    </div>
                    {receiver.name && (
                        <div className="flex justify-between">
                            <span>CUSTOMER:</span>
                            <span className="font-medium truncate max-w-[170px]">{receiver.name}</span>
                        </div>
                    )}
                    {receiver.phone && (
                        <div className="flex justify-between">
                            <span>PHONE:</span>
                            <span>{receiver.phone}</span>
                        </div>
                    )}
                </div>

                {/* Dashed divider */}
                <div className="my-3 border-t border-dashed border-gray-400" />

                {/* Items Table */}
                <div>
                    <div className="flex justify-between pb-1 text-[10px] font-bold uppercase text-gray-500 border-b border-gray-200">
                        <span className="w-1/2">{labels.item || "ITEM"}</span>
                        <span className="w-1/4 text-center">{labels.qty || "QTY"}</span>
                        <span className="w-1/4 text-end">{labels.total || "TOTAL"}</span>
                    </div>

                    <div className="divide-y divide-gray-100 py-1">
                        {details.items.map((item, index) => (
                            <div key={index} className="py-1 text-[11px]">
                                <div className="flex justify-between items-start">
                                    <span className="w-1/2 font-medium leading-tight text-gray-900">
                                        {item.name || "Item"}
                                    </span>
                                    <span className="w-1/4 text-center tabular-nums text-gray-600">
                                        {item.quantity}
                                    </span>
                                    <span className="w-1/4 text-end tabular-nums font-semibold text-gray-900">
                                        {money(item.total, details.currency, locale)}
                                    </span>
                                </div>
                                {item.unitPrice > 0 && item.quantity > 1 && (
                                    <div className="text-[10px] text-gray-500">
                                        @ {money(item.unitPrice, details.currency, locale)} each
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dashed divider */}
                <div className="my-3 border-t border-dashed border-gray-400" />

                {/* Totals Section */}
                <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-gray-600">
                        <span>{labels.subtotal || "Subtotal"}:</span>
                        <span className="tabular-nums font-medium">
                            {money(details.subTotal, details.currency, locale)}
                        </span>
                    </div>

                    {details.discountDetails?.amount ? (
                        <div className="flex justify-between text-emerald-700">
                            <span>{labels.discount || "Discount"}:</span>
                            <span className="tabular-nums">
                                - {details.discountDetails.amountType === "amount"
                                    ? money(details.discountDetails.amount, details.currency, locale)
                                    : `${details.discountDetails.amount}%`}
                            </span>
                        </div>
                    ) : null}

                    {details.taxDetails?.amount ? (
                        <div className="flex justify-between text-gray-600">
                            <span>
                                {labels.tax || "Tax"} {details.taxDetails.taxID ? `(${details.taxDetails.taxID})` : ""}:
                            </span>
                            <span className="tabular-nums">
                                + {details.taxDetails.amountType === "amount"
                                    ? money(details.taxDetails.amount, details.currency, locale)
                                    : `${details.taxDetails.amount}%`}
                            </span>
                        </div>
                    ) : null}

                    {details.shippingDetails?.cost ? (
                        <div className="flex justify-between text-gray-600">
                            <span>{labels.shipping || "Service / Delivery"}:</span>
                            <span className="tabular-nums">
                                + {details.shippingDetails.costType === "amount"
                                    ? money(details.shippingDetails.cost, details.currency, locale)
                                    : `${details.shippingDetails.cost}%`}
                            </span>
                        </div>
                    ) : null}

                    {/* Double dashed border before Total */}
                    <div className="my-2 border-t-2 border-dashed border-gray-900 pt-2">
                        <div className="flex items-baseline justify-between text-sm font-black text-gray-900">
                            <span>{labels.total || "TOTAL"}:</span>
                            <span className="text-base font-bold tabular-nums">
                                {money(details.totalAmount, details.currency, locale)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment Information / Bank */}
                {(pay?.bankName || pay?.accountNumber) && (
                    <div className="mt-3 rounded border border-gray-200 p-2 text-[10px] text-gray-700">
                        <p className="font-bold uppercase text-gray-600">Payment Details</p>
                        {pay.bankName && <p>{pay.bankName}</p>}
                        {pay.accountName && <p>Acc: {pay.accountName}</p>}
                        {pay.accountNumber && <p className="tabular-nums">No: {pay.accountNumber}</p>}
                    </div>
                )}

                {/* Payment QR Code */}
                {qr?.enabled && qr?.value && (
                    <div className="mt-4 flex flex-col items-center justify-center border-t border-dashed border-gray-300 pt-3">
                        <PaymentQrCode
                            type={qr.type}
                            value={qr.value}
                            title={qr.title || "Scan to Pay"}
                            amount={details.totalAmount}
                            currency={details.currency}
                            receiverName={pay?.accountName || sender.name}
                            size={92}
                        />
                    </div>
                )}

                {/* Receipt Footer */}
                <div className="mt-4 text-center text-[10px] text-gray-500 space-y-1 border-t border-dashed border-gray-400 pt-3">
                    {details.additionalNotes ? (
                        <p className="font-medium text-gray-800 whitespace-pre-line">
                            {details.additionalNotes}
                        </p>
                    ) : (
                        <p className="font-medium text-gray-700">*** THANK YOU FOR YOUR BUSINESS ***</p>
                    )}
                    <p className="text-[9px] text-gray-400">
                        Generated by TiloBox Invoice • tilobox.com
                    </p>
                </div>
            </div>
        </section>
    );
}
