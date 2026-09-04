"use client";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Utils
import { cn } from "@/lib/utils";

// Types
import type { InvoiceType } from "@/types";

/**
 * The four terms almost every invoice uses.
 *
 * The field stays free text underneath — plenty of businesses have their own
 * wording, and a fixed list would be worse than no list. These just fill it in.
 *
 * The labels come from the message files rather than being hardcoded English,
 * which is the whole reason presets are an improvement here: "Net 30" typed by
 * hand stays "Net 30" on a German invoice, whereas a preset can say
 * "Zahlbar innerhalb von 30 Tagen".
 */
const PRESET_KEYS = ["dueOnReceipt", "net15", "net30", "net60"] as const;

const PaymentTermPresets = () => {
    const { control, setValue } = useFormContext<InvoiceType>();
    const { _t } = useTranslationContext();

    const current = useWatch({ control, name: "details.paymentTerms" });

    const apply = (value: string) => {
        setValue("details.paymentTerms", value, {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_KEYS.map((key) => {
                const label = _t(`form.steps.summary.terms.${key}`);
                const isActive = current?.trim() === label;

                return (
                    <button
                        key={key}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => apply(label)}
                        className={cn(
                            "rounded-full border px-2.5 py-1 text-xs transition-colors",
                            isActive
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
};

export default PaymentTermPresets;
