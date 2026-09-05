import React from "react";
import { QRCodeSVG } from "qrcode.react";

export type PaymentQrType = "upi" | "paypal" | "stripe" | "iban" | "custom";

export type PaymentQrCodeProps = {
    type?: PaymentQrType | "";
    value?: string;
    title?: string;
    amount?: number | string;
    currency?: string;
    receiverName?: string;
    size?: number;
    className?: string;
    showLabel?: boolean;
};

export function formatPaymentQrValue({
    type = "custom",
    value = "",
    amount,
    currency = "USD",
    receiverName = "",
}: {
    type?: PaymentQrType | "";
    value?: string;
    amount?: number | string;
    currency?: string;
    receiverName?: string;
}): string {
    const cleanValue = (value || "").trim();
    if (!cleanValue) return "";
    const activeType = type || "custom";

    if (activeType === "upi") {
        if (cleanValue.startsWith("upi://")) return cleanValue;
        const params = new URLSearchParams();
        params.set("pa", cleanValue);
        if (receiverName) params.set("pn", receiverName);
        if (amount && Number(amount) > 0) params.set("am", String(amount));
        if (currency) params.set("cu", currency);
        return `upi://pay?${params.toString()}`;
    }

    if (activeType === "paypal") {
        if (cleanValue.startsWith("http://") || cleanValue.startsWith("https://")) {
            return cleanValue;
        }
        const username = cleanValue.replace(/^@/, "");
        const amt = amount && Number(amount) > 0 ? `/${amount}` : "";
        return `https://paypal.me/${username}${amt}`;
    }

    if (activeType === "stripe") {
        if (cleanValue.startsWith("http://") || cleanValue.startsWith("https://")) {
            return cleanValue;
        }
        return `https://${cleanValue}`;
    }

    if (activeType === "iban") {
        if (cleanValue.startsWith("iban:") || cleanValue.startsWith("http")) {
            return cleanValue;
        }
        return `iban:${cleanValue.replace(/\s+/g, "")}`;
    }

    return cleanValue;
}

export const PAYMENT_TYPE_LABELS: Record<PaymentQrType, string> = {
    upi: "UPI Pay",
    paypal: "PayPal",
    stripe: "Stripe",
    iban: "Bank Transfer",
    custom: "Scan to Pay",
};

export default function PaymentQrCode({
    type,
    value = "",
    title,
    amount,
    currency,
    receiverName,
    size = 110,
    className = "",
    showLabel = true,
}: PaymentQrCodeProps) {
    const activeType: PaymentQrType = type ? type : "custom";
    const qrString = formatPaymentQrValue({
        type: activeType,
        value,
        amount,
        currency,
        receiverName,
    });

    if (!qrString) return null;

    const displayTitle = title?.trim() || PAYMENT_TYPE_LABELS[activeType] || "Scan to Pay";

    return (
        <div
            className={`inline-flex flex-col items-center rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm print:border-gray-300 print:shadow-none ${className}`}
            style={{ maxWidth: size + 24 }}
        >
            <div className="overflow-hidden rounded bg-white p-1">
                <QRCodeSVG
                    value={qrString}
                    size={size}
                    level="M"
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                />
            </div>
            {showLabel && (
                <div className="mt-1.5 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                        {displayTitle}
                    </p>
                    <p className="text-[9px] text-gray-400">Scan with camera / app</p>
                </div>
            )}
        </div>
    );
}
