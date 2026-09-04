"use client";

import React, { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

// Components
import { FormInput, Subheading } from "@/app/components";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import PaymentQrCode, { type PaymentQrType } from "@/app/components/reusables/PaymentQrCode";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";
import type { InvoiceType } from "@/types";

// Icons
import { QrCode, Landmark } from "lucide-react";

const QR_TYPE_OPTIONS: { id: PaymentQrType; label: string; placeholder: string; hint: string }[] = [
    {
        id: "upi",
        label: "UPI ID",
        placeholder: "merchant@okhdfcbank or 9876543210@paytm",
        hint: "Generates an Indian Unified Payments Interface QR code",
    },
    {
        id: "paypal",
        label: "PayPal",
        placeholder: "https://paypal.me/yourusername or username",
        hint: "Generates a direct PayPal.me link",
    },
    {
        id: "stripe",
        label: "Stripe",
        placeholder: "https://buy.stripe.com/your_payment_link",
        hint: "Generates a link to your Stripe Payment Link",
    },
    {
        id: "iban",
        label: "Bank IBAN",
        placeholder: "e.g. GB29NWBK60161331926819",
        hint: "Generates a standard bank payment QR code",
    },
    {
        id: "custom",
        label: "Custom Link",
        placeholder: "https://yourwebsite.com/pay or any payment URL",
        hint: "Generates a QR code for any payment URL or text",
    },
];

const PaymentInformation = () => {
    const { _t } = useTranslationContext();
    const { control, setValue } = useFormContext<InvoiceType>();

    const qrEnabled = useWatch({
        control,
        name: "details.paymentInformation.paymentQr.enabled",
    });

    const qrType = (useWatch({
        control,
        name: "details.paymentInformation.paymentQr.type",
    }) || "upi") as PaymentQrType;

    const qrValue = useWatch({
        control,
        name: "details.paymentInformation.paymentQr.value",
    });

    const qrTitle = useWatch({
        control,
        name: "details.paymentInformation.paymentQr.title",
    });

    const totalAmount = useWatch({
        control,
        name: "details.totalAmount",
    });

    const currency = useWatch({
        control,
        name: "details.currency",
    });

    const accountName = useWatch({
        control,
        name: "details.paymentInformation.accountName",
    });

    const currentOption = useMemo(
        () => QR_TYPE_OPTIONS.find((o) => o.id === qrType) || QR_TYPE_OPTIONS[0],
        [qrType]
    );

    return (
        <section className="space-y-6">
            <div>
                <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    <Subheading>{_t("form.steps.paymentInfo.heading")}:</Subheading>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 @xl:grid-cols-2">
                    <FormInput
                        name="details.paymentInformation.bankName"
                        label={_t("form.steps.paymentInfo.bankName")}
                        placeholder="e.g. Chase Bank, Barclays, HDFC"
                        vertical
                    />
                    <FormInput
                        name="details.paymentInformation.accountName"
                        label={_t("form.steps.paymentInfo.accountName")}
                        placeholder="e.g. Acme Corp LLC"
                        vertical
                    />
                    <FormInput
                        name="details.paymentInformation.accountNumber"
                        label={_t("form.steps.paymentInfo.accountNumber")}
                        placeholder="e.g. IBAN, Routing / Account #"
                        vertical
                    />
                </div>
            </div>

            {/* Payment QR Code Generator Section */}
            <div className="rounded-xl border border-border bg-card/60 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <QrCode className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <Label
                                    htmlFor="enable-qr"
                                    className="cursor-pointer text-sm font-semibold text-foreground"
                                >
                                    Payment QR Code
                                </Label>
                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    Instant Scan
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Render a scannable payment QR code on the invoice and exported PDF.
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="enable-qr"
                        checked={Boolean(qrEnabled)}
                        onCheckedChange={(checked) => {
                            setValue(
                                "details.paymentInformation.paymentQr.enabled",
                                checked,
                                { shouldDirty: true }
                            );
                            if (checked && !qrType) {
                                setValue("details.paymentInformation.paymentQr.type", "upi", {
                                    shouldDirty: true,
                                });
                            }
                        }}
                    />
                </div>

                {qrEnabled && (
                    <div className="mt-5 space-y-4 border-t border-border pt-4">
                        {/* Type Selector Pills */}
                        <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                                Payment Method Type
                            </Label>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {QR_TYPE_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() =>
                                            setValue(
                                                "details.paymentInformation.paymentQr.type",
                                                option.id,
                                                { shouldDirty: true }
                                            )
                                        }
                                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                            qrType === option.id
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "border border-border bg-background text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                {currentOption.hint}
                            </p>
                        </div>

                        {/* Value Input */}
                        <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
                            <FormInput
                                name="details.paymentInformation.paymentQr.value"
                                label={`${currentOption.label} Details`}
                                placeholder={currentOption.placeholder}
                                vertical
                            />

                            <FormInput
                                name="details.paymentInformation.paymentQr.title"
                                label="QR Code Title (optional)"
                                placeholder={`Scan to Pay via ${currentOption.label}`}
                                vertical
                            />
                        </div>

                        {/* Live Form Preview of QR */}
                        {qrValue && (
                            <div className="flex items-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-3">
                                <PaymentQrCode
                                    type={qrType}
                                    value={qrValue}
                                    title={qrTitle}
                                    amount={totalAmount}
                                    currency={currency}
                                    receiverName={accountName}
                                    size={76}
                                />
                                <div className="space-y-0.5 text-xs text-muted-foreground">
                                    <p className="font-semibold text-foreground">
                                        QR Code Preview Ready
                                    </p>
                                    <p className="text-[11px]">
                                        This QR code will be cleanly embedded directly onto your invoice and thermal receipt.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default PaymentInformation;
