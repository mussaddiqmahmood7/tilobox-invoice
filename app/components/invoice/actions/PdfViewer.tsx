"use client";

// Debounce
import { useDebounce } from "use-debounce";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// Components
import { FinalPdf, LivePreview } from "@/app/components";

// Contexts
import { useInvoiceContext } from "@/contexts/InvoiceContext";

// Types
import { InvoiceType } from "@/types";

/**
 * Owns the full-form subscription.
 *
 * Split out of PdfViewer so the watch only exists while the live preview is on
 * screen. Previously PdfViewer itself subscribed to every field, so while the
 * generated PDF was showing, each keystroke still re-rendered this subtree —
 * including the <iframe> in FinalPdf, which has no business re-rendering
 * because someone edited a field.
 */
const LivePreviewWatcher = ({ fit }: { fit: boolean }) => {
    const { control } = useFormContext<InvoiceType>();

    /*
     * `useDebounce` debounces a value, but `watch` is a stable function
     * reference that never changes — so the previous
     * `useDebounce(watch, 1000)` was inert, and calling `watch()` bare during
     * render subscribed to every field. The result was a full re-render of the
     * invoice template on every keystroke.
     *
     * Debouncing the values instead means `debouncedValues` keeps a stable
     * identity between ticks, so the memoised LivePreview below can bail out.
     */
    const formValues = useWatch({ control }) as InvoiceType;
    const [debouncedValues] = useDebounce(formValues, 400);

    return <LivePreview data={debouncedValues} fit={fit} />;
};

type PdfViewerProps = {
    /** Scale the live preview so the whole page fits the pane. */
    fit?: boolean;
};

const PdfViewer = ({ fit = true }: PdfViewerProps) => {
    const { invoicePdf } = useInvoiceContext();

    return (
        // No vertical margin in the shell: the pane owns its own padding, and
        // a margin here would be counted against the height the fit measures.
        <div className="my-3 shell:my-0 shell:h-full">
            {invoicePdf.size == 0 ? (
                <LivePreviewWatcher fit={fit} />
            ) : (
                <FinalPdf />
            )}
        </div>
    );
};

export default PdfViewer;
