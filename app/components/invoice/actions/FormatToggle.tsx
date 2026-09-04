"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { InvoiceType } from "@/types";
import { FileText, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormatToggleProps = {
    className?: string;
    variant?: "default" | "compact";
};

export default function FormatToggle({ className = "", variant: _variant = "default" }: FormatToggleProps) {
    const { control, setValue } = useFormContext<InvoiceType>();

    const format = useWatch({
        control,
        name: "details.documentFormat",
    }) || "a4";

    const isReceipt = format === "receipt";

    const setFormat = (target: "a4" | "receipt") => {
        setValue("details.documentFormat", target, { shouldDirty: true });
    };

    return (
        <div
            role="group"
            aria-label="Document format mode selector"
            className={cn(
                "inline-flex items-center rounded-lg border border-border bg-muted/60 p-1 text-xs shadow-sm",
                className
            )}
        >
            <button
                type="button"
                aria-pressed={!isReceipt}
                onClick={() => setFormat("a4")}
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all",
                    !isReceipt
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/50 font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                )}
                title="Standard A4 invoice layout for consulting, freelancers, and B2B billing"
            >
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Standard A4 Invoice</span>
            </button>

            <button
                type="button"
                aria-pressed={isReceipt}
                onClick={() => setFormat("receipt")}
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all",
                    isReceipt
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/50 font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                )}
                title="Compact 80mm thermal receipt format for retail, cafes, POS, and thermal printers"
            >
                <Receipt className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>80mm POS Receipt</span>
            </button>
        </div>
    );
}
