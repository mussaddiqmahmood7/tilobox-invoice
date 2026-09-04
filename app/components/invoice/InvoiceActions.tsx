"use client";

import { useState } from "react";

// ShadCn
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

// Components
import {
    PdfViewer,
    BaseButton,
    NewInvoiceAlert,
    InvoiceLoaderModal,
    InvoiceExportModal,
    TemplateGallery,
} from "@/app/components";

// Contexts
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

// Hooks
import { useIsDesktop } from "@/hooks/useMediaQuery";

// Icons
import {
    FileInput,
    FolderUp,
    Import,
    Maximize2,
    Minimize2,
    MoreHorizontal,
    Plus,
    RotateCcw,
} from "lucide-react";

const InvoiceActions = () => {
    const { invoicePdfLoading, newInvoice } = useInvoiceContext();

    const { _t } = useTranslationContext();

    /*
     * The preview is heavy (it renders the whole invoice template). Below xl it
     * lives in MobilePreviewSheet instead, so only mount it here once we know
     * we are actually on a desktop viewport — `hidden xl:block` alone would
     * still mount and re-render it on phones.
     */
    const isDesktop = useIsDesktop();

    /*
     * Fit the whole invoice into the pane, or show it at full size and scroll.
     *
     * Fit is the default because seeing the entire document at a glance is the
     * point of a preview — but an A4 page in a ~672px pane is about 60% scale,
     * which is fine for judging layout and too small for reading. Hence a
     * toggle rather than a single mode.
     */
    const [fitToPane, setFitToPane] = useState(true);

    /*
     * Direction A + B: on desktop this column is the invoice, not a control
     * panel. The five equal-weight buttons that used to sit on top are now one
     * primary action plus an overflow menu, so the preview is the thing your
     * eye lands on.
     */
    const secondaryActions = (
        <div className="flex flex-col gap-1">
            <InvoiceLoaderModal>
                <BaseButton
                    variant="ghost"
                    className="w-full justify-start"
                    disabled={invoicePdfLoading}
                >
                    <FolderUp className="h-4 w-4" />
                    {_t("actions.loadInvoice")}
                </BaseButton>
            </InvoiceLoaderModal>

            <InvoiceExportModal>
                <BaseButton
                    variant="ghost"
                    className="w-full justify-start"
                    disabled={invoicePdfLoading}
                >
                    <Import className="h-4 w-4" />
                    {_t("actions.exportInvoice")}
                </BaseButton>
            </InvoiceExportModal>

            <NewInvoiceAlert>
                <BaseButton
                    variant="ghost"
                    className="w-full justify-start"
                    disabled={invoicePdfLoading}
                >
                    <Plus className="h-4 w-4" />
                    {_t("actions.newInvoice")}
                </BaseButton>
            </NewInvoiceAlert>

            <NewInvoiceAlert
                title={_t("actions.resetFormTitle")}
                description={_t("actions.resetFormDescription")}
                confirmLabel={_t("actions.resetFormConfirm")}
                onConfirm={newInvoice}
            >
                <BaseButton
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={invoicePdfLoading}
                >
                    <RotateCcw className="h-4 w-4" />
                    {_t("actions.resetForm")}
                </BaseButton>
            </NewInvoiceAlert>
        </div>
    );

    return (
        // The preview pane sits on the tinted ground, so the invoice reads as a
        // sheet of paper on a desk rather than as another panel.
        <div className="min-w-0 shell:flex shell:min-h-0 shell:flex-col shell:bg-ground">
            {/*
             * Sticky is the fallback for tall-enough-but-short viewports; in
             * the shell the column is a flex child that fills the pinned
             * region instead.
             */}
            <div className="xl:sticky xl:top-24 shell:static shell:flex shell:min-h-0 shell:flex-1 shell:flex-col">
                {/*
                 * Toolbar above the preview — desktop only.
                 *
                 * Document controls on the left, actions on the right, as in
                 * option B. The heading this used to carry said "Invoice
                 * preview" above an invoice preview; the chips use that space
                 * to say something the user can act on.
                 */}
                <div className="mb-3 hidden items-center justify-between gap-3 xl:flex shell:px-5 shell:pt-5">
                    {isDesktop ? (
                        <TemplateGallery variant="chips" />
                    ) : (
                        <h2 className="text-sm font-medium text-muted-foreground">
                            {_t("actions.previewTitle")}
                        </h2>
                    )}

                    <div className="flex shrink-0 items-center gap-2">
                        {/* Fit / actual size — shell only, where the pane has a
                            fixed height to fit against. */}
                        <BaseButton
                            variant="ghost"
                            size="icon"
                            className="hidden shell:inline-flex"
                            aria-pressed={fitToPane}
                            tooltipLabel={
                                fitToPane
                                    ? _t("actions.actualSize")
                                    : _t("actions.fitToScreen")
                            }
                            aria-label={
                                fitToPane
                                    ? _t("actions.actualSize")
                                    : _t("actions.fitToScreen")
                            }
                            onClick={() => setFitToPane((value) => !value)}
                        >
                            {fitToPane ? (
                                <Maximize2 className="h-4 w-4" />
                            ) : (
                                <Minimize2 className="h-4 w-4" />
                            )}
                        </BaseButton>

                        <Popover>
                            <PopoverTrigger asChild>
                                <BaseButton
                                    variant="ghost"
                                    size="icon"
                                    aria-label={_t("actions.moreActions")}
                                    disabled={invoicePdfLoading}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </BaseButton>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-56 p-1.5">
                                {secondaryActions}
                            </PopoverContent>
                        </Popover>

                        <BaseButton
                            type="submit"
                            tooltipLabel={_t("actions.generatePdfTooltip")}
                            loading={invoicePdfLoading}
                            loadingText={_t("actions.generatePdfLoading")}
                        >
                            <FileInput className="h-4 w-4" />
                            {_t("actions.generatePdf")}
                        </BaseButton>
                    </div>
                </div>

                {/*
                 * Live preview / final PDF — desktop only.
                 *
                 * In the shell this pane owns its own scrollbar. A long invoice
                 * is scrolled here rather than by moving the whole page, which
                 * is what keeps the form and the toolbar in place while you
                 * read down the document.
                 */}
                <div className="hidden xl:block shell:min-h-0 shell:flex-1 shell:overflow-y-auto shell:overscroll-contain shell:px-8 shell:pb-8">
                    {isDesktop ? (
                        <PdfViewer fit={fitToPane} />
                    ) : (
                        <Skeleton className="min-h-[30rem] w-full rounded-xl" />
                    )}
                </div>

                {/*
                 * Below xl the preview moves into a sheet, so this column only
                 * carries the secondary actions. Generate and Preview live in
                 * the sticky MobileActionBar.
                 */}
                <div className="xl:hidden">
                    <div className="border-t border-border pt-5">
                        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {_t("actions.title")}
                        </h2>
                        {secondaryActions}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceActions;
