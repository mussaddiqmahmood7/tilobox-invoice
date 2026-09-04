"use client";

// Components
import { BaseButton, MobilePreviewSheet } from "@/app/components";

// Contexts
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { Eye, FileInput } from "lucide-react";

/**
 * Sticky bottom bar shown below xl, holding the two actions that matter on a
 * phone: open the preview, and generate the PDF.
 *
 * Rendered inside the <form> so the submit button drives it natively. It is
 * `fixed`, so its position in the DOM has no bearing on layout.
 */
const MobileActionBar = () => {
    const { invoicePdfLoading } = useInvoiceContext();

    const { _t } = useTranslationContext();

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 xl:hidden">
            <div className="pb-safe flex items-center gap-3 px-4 py-3">
                <MobilePreviewSheet>
                    <BaseButton
                        variant="outline"
                        // whitespace-nowrap: at 375px the two buttons split the
                        // row and the labels wrapped inside a fixed-height
                        // button, so the second line was clipped.
                        className="flex-1 whitespace-nowrap"
                        size="lg"
                        disabled={invoicePdfLoading}
                    >
                        <Eye className="h-5 w-5" />
                        {_t("actions.preview")}
                    </BaseButton>
                </MobilePreviewSheet>

                <BaseButton
                    type="submit"
                    className="flex-1 whitespace-nowrap"
                    size="lg"
                    loading={invoicePdfLoading}
                    loadingText={_t("actions.generatePdfLoading")}
                >
                    <FileInput className="h-5 w-5" />
                    {_t("actions.generatePdf")}
                </BaseButton>
            </div>
        </div>
    );
};

export default MobileActionBar;
