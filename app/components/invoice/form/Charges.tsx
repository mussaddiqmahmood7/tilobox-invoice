"use client";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import { Switch } from "@/components/ui/switch";

// Components
import { BaseButton, ChargeInput } from "@/app/components";

// Contexts
import { useChargesContext } from "@/contexts/ChargesContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

// Helpers
import { formatNumberWithCommas } from "@/lib/helpers";

// Icons
import { Plus, X } from "lucide-react";

// Types
import { InvoiceType } from "@/types";

const Charges = () => {
    const {
        formState: { errors },
    } = useFormContext<InvoiceType>();

    const { _t } = useTranslationContext();

    const {
        discountSwitch,
        setDiscountSwitch,
        taxSwitch,
        setTaxSwitch,
        shippingSwitch,
        setShippingSwitch,
        discountType,
        setDiscountType,
        taxType,
        setTaxType,
        shippingType,
        setShippingType,
        totalInWordsSwitch,
        setTotalInWordsSwitch,
        currency,
        subTotal,
        totalAmount,
    } = useChargesContext();

    const switchAmountType = (type: string, setType: (type: string) => void) => {
        if (type == "amount") {
            setType("percentage");
        } else {
            setType("amount");
        }
    };

    /*
     * Progressive disclosure.
     *
     * Discount, tax and shipping used to be three always-visible switches
     * sitting above the totals, so every invoice paid the visual cost of three
     * options most invoices never use. They are now "+ Add …" actions that
     * reveal the input, and each revealed row can be removed again.
     */
    const optional = [
        {
            key: "discount",
            label: _t("form.steps.summary.discount"),
            on: discountSwitch,
            setOn: setDiscountSwitch,
            name: "details.discountDetails.amount",
            type: discountType,
            setType: setDiscountType,
        },
        {
            key: "tax",
            label: _t("form.steps.summary.tax"),
            on: taxSwitch,
            setOn: setTaxSwitch,
            name: "details.taxDetails.amount",
            type: taxType,
            setType: setTaxType,
        },
        {
            key: "shipping",
            label: _t("form.steps.summary.shipping"),
            on: shippingSwitch,
            setOn: setShippingSwitch,
            name: "details.shippingDetails.cost",
            type: shippingType,
            setType: setShippingType,
        },
    ] as const;

    const hidden = optional.filter((o) => !o.on);

    return (
        <div className="flex w-full min-w-0 flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    {_t("form.steps.summary.subTotal")}
                </span>
                <span className="tabular-nums">
                    {formatNumberWithCommas(subTotal)} {currency}
                </span>
            </div>

            {optional
                .filter((o) => o.on)
                .map((o) => (
                    <div key={o.key} className="flex items-center gap-1">
                        <div className="min-w-0 flex-1">
                            <ChargeInput
                                label={o.label}
                                name={o.name}
                                switchAmountType={switchAmountType}
                                type={o.type}
                                setType={o.setType}
                                currency={currency}
                            />
                        </div>
                        <BaseButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            aria-label={`${_t("form.steps.summary.remove")} ${o.label}`}
                            onClick={() => o.setOn(false)}
                        >
                            <X className="h-3.5 w-3.5" />
                        </BaseButton>
                    </div>
                ))}

            {hidden.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 py-1">
                    {hidden.map((o) => (
                        <button
                            key={o.key}
                            type="button"
                            onClick={() => o.setOn(true)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-80"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {o.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-baseline justify-between border-t border-border pt-3">
                <span className="font-medium">
                    {_t("form.steps.summary.totalAmount")}
                </span>
                <div className="text-end">
                    <p className="text-lg font-semibold tabular-nums">
                        {formatNumberWithCommas(totalAmount)} {currency}
                    </p>
                    {errors.details?.totalAmount?.message && (
                        <small className="text-sm font-medium text-destructive">
                            {errors.details.totalAmount.message}
                        </small>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-sm text-muted-foreground">
                    {_t("form.steps.summary.includeTotalInWords")}
                </span>
                <Switch
                    checked={totalInWordsSwitch}
                    onCheckedChange={setTotalInWordsSwitch}
                    aria-label={_t("form.steps.summary.includeTotalInWords")}
                />
            </div>
        </div>
    );
};

export default Charges;
