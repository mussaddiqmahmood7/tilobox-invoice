"use client";

import { useRef } from "react";
import { BaseButton } from "@/app/components";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { useTranslationContext } from "@/contexts/TranslationContext";
import useToasts from "@/hooks/useToasts";
import { Import } from "lucide-react";

type ImportJsonButtonType = {
    setOpen: (open: boolean) => void;
};

const ImportJsonButton = ({ setOpen }: ImportJsonButtonType) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { importInvoice, invoicePdfLoading } = useInvoiceContext();

    const { _t } = useTranslationContext();
    const { importInvoiceError } = useToasts();

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            /*
             * Some browsers report an empty or non-standard type for .json, so
             * fall back to the extension rather than silently doing nothing —
             * previously a mismatch here dismissed the picker with no feedback.
             */
            const looksLikeJson =
                file.type === "application/json" ||
                file.type === "text/json" ||
                file.name.toLowerCase().endsWith(".json");

            if (looksLikeJson) {
                importInvoice(file);
                setOpen(false);
            } else {
                importInvoiceError();
            }
        }

        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/json,.json"
                className="hidden"
            />
            <BaseButton
                variant="outline"
                tooltipLabel={_t("actions.importJsonTooltip")}
                disabled={invoicePdfLoading}
                onClick={handleClick}
                className="w-full sm:w-auto"
            >
                <Import />
                {_t("actions.importJson")}
            </BaseButton>
        </>
    );
};

export default ImportJsonButton;
