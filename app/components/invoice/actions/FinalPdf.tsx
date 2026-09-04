"use client";

// ShadCn
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Components
import { BaseButton, SendPdfToEmailModal, Subheading } from "@/app/components";

// Contexts
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import {
    BookmarkIcon,
    DownloadCloudIcon,
    Eye,
    FileText,
    Mail,
    MoveLeft,
    Printer,
} from "lucide-react";

export default function FinalPdf() {
    const {
        pdfUrl,
        removeFinalPdf,
        previewPdfInTab,
        downloadPdf,
        printPdf,
        saveInvoice,
        sendPdfToMail,
    } = useInvoiceContext();

    const { _t } = useTranslationContext();

    return (
        <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Subheading>{_t("actions.finalPdf")}:</Subheading>
                <BaseButton variant="ghost" size="sm" onClick={removeFinalPdf}>
                    <MoveLeft className="h-4 w-4" />
                    {_t("actions.backToLivePreview")}
                </BaseButton>
            </div>

            {/* Buttons */}
            <div className="my-1 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <BaseButton
                    tooltipLabel={_t("actions.previewInTabTooltip")}
                    onClick={previewPdfInTab}
                    size="sm"
                    variant={"outline"}
                    className="w-full sm:w-auto"
                >
                    <Eye className="h-4 w-4" />
                    {_t("actions.previewInTab")}
                </BaseButton>
                <BaseButton
                    tooltipLabel={_t("actions.downloadTooltip")}
                    onClick={downloadPdf}
                    size="sm"
                    variant={"outline"}
                    className="w-full sm:w-auto"
                >
                    <DownloadCloudIcon className="h-4 w-4" />
                    {_t("actions.download")}
                </BaseButton>

                <BaseButton
                    tooltipLabel={_t("actions.printTooltip")}
                    onClick={printPdf}
                    size="sm"
                    variant={"outline"}
                    className="w-full sm:w-auto"
                >
                    <Printer className="h-4 w-4" />
                    {_t("actions.print")}
                </BaseButton>

                <BaseButton
                    tooltipLabel={_t("actions.saveTooltip")}
                    onClick={saveInvoice}
                    size="sm"
                    variant={"outline"}
                    className="w-full sm:w-auto"
                >
                    <BookmarkIcon className="h-4 w-4" />
                    {_t("actions.save")}
                </BaseButton>

                <SendPdfToEmailModal sendPdfToMail={sendPdfToMail}>
                    <BaseButton
                        tooltipLabel={_t("actions.sendToMailTooltip")}
                        size="sm"
                        variant={"outline"}
                        className="col-span-2 w-full sm:w-auto"
                    >
                        <Mail className="h-4 w-4" />
                        {_t("actions.sendToMail")}
                    </BaseButton>
                </SendPdfToEmailModal>
            </div>

            {/*
             * Mobile browsers (Safari in particular) routinely refuse to render
             * a PDF inside an iframe, and a fixed 1:1.4 aspect ratio at full
             * width is very tall on a phone. Below md, offer an explicit
             * "Open PDF" affordance instead of an iframe that may render blank.
             */}
            <div className="mt-3 md:hidden">
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        {_t("actions.pdfReady")}
                    </p>
                    <BaseButton onClick={previewPdfInTab}>
                        <Eye className="h-4 w-4" />
                        {_t("actions.openPdf")}
                    </BaseButton>
                </div>
            </div>

            <div className="mt-3 hidden md:block">
                <AspectRatio ratio={1 / 1.4}>
                    <iframe
                        title={_t("actions.finalPdf")}
                        className="h-full w-full rounded-xl border border-border"
                        src={`${pdfUrl}#toolbar=0`}
                    />
                </AspectRatio>
            </div>
        </>
    );
}
