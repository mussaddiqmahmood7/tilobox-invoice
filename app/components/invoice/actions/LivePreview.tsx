"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

// Next Intl
import { useLocale, useMessages } from "next-intl";

// RHF
import { useFormContext } from "react-hook-form";

// Components
import { DynamicInvoiceTemplate, Subheading } from "@/app/components";

// Labels
import { buildInvoiceLabels } from "@/app/components/templates/invoice-pdf/invoiceLabels";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";
import { useWizard } from "@/contexts/WizardContext";

// Hooks
import { useIsShell } from "@/hooks/useMediaQuery";
import { useFitScale } from "@/hooks/useFitScale";

// Steps
import { stepIdForField } from "@/lib/wizardSteps";

// Types
import { InvoiceType } from "@/types";

type LivePreviewProps = {
    data: InvoiceType;
    /** Scale the sheet down so the whole page fits the pane. */
    fit?: boolean;
};

function LivePreview({ data, fit = true }: LivePreviewProps) {
    const { _t } = useTranslationContext();
    const { activeStep, goToStep } = useWizard();
    const { setFocus } = useFormContext<InvoiceType>();

    /*
     * Labels are passed down as a prop rather than read from next-intl inside
     * the template, because the same component is rendered server-side through
     * renderToStaticMarkup for the PDF, where next-intl's hooks are not
     * available. See invoiceLabels.ts
     */
    const locale = useLocale();
    const messages = useMessages();
    const labels = useMemo(
        () => buildInvoiceLabels(messages as Record<string, unknown>),
        [messages]
    );

    /*
     * Click-to-edit.
     *
     * One delegated listener over the whole document rather than a callback
     * threaded through every template part. The parts emit a `data-edit-field`
     * attribute naming the field that produced them (see parts/index.tsx);
     * this finds the nearest one and navigates to it.
     *
     * Keeping it on the DOM side means the PDF render path is completely
     * untouched — renderToStaticMarkup emits the attributes and nothing reads
     * them.
     */
    const [pendingFocus, setPendingFocus] = useState<string | null>(null);

    /*
     * Fit-to-pane, and only inside the shell — below it the preview is a
     * normal block in a scrolling document, where shrinking it would just make
     * it hard to read for no gain.
     */
    const isShell = useIsShell();
    const { paneRef, contentRef, scale, scaledHeight } = useFitScale<
        HTMLDivElement,
        HTMLDivElement
    >({ enabled: isShell && fit });

    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
                "[data-edit-field]"
            );
            const field = target?.dataset.editField;
            if (!field) return;

            const step = stepIdForField(field);
            if (step !== activeStep) goToStep(step);

            // Focus after the step has rendered — the field may not exist yet.
            setPendingFocus(field);
        },
        [activeStep, goToStep]
    );

    useEffect(() => {
        if (!pendingFocus) return;

        // One frame, so the step that owns the field has committed.
        const id = window.requestAnimationFrame(() => {
            try {
                setFocus(pendingFocus as never, { shouldSelect: true });
            } catch {
                // The field may not be focusable (a date picker, a select).
                // Navigating to the right step is still the useful half.
            }
            setPendingFocus(null);
        });

        return () => window.cancelAnimationFrame(id);
    }, [pendingFocus, setFocus]);

    return (
        <>
            {/*
             * The label is redundant once the invoice is a sheet of paper on a
             * tinted ground — the shape says what it is. Kept below `shell`,
             * where the preview shares a plain background with the form.
             */}
            <div className="shell:hidden">
                <Subheading>{_t("actions.livePreview")}:</Subheading>
            </div>

            {/*
             * Three nested boxes, each doing one job:
             *   pane      — fills the scroll container, so the hook has a
             *               height to fit against
             *   reserve   — takes the *scaled* height, so the pane does not
             *               keep a scrollbar for space the transform gave back
             *   content   — the sheet itself, scaled from its top edge
             */}
            <div ref={paneRef} className="shell:h-full">
                <div
                    style={
                        isShell && scaledHeight
                            ? { height: scaledHeight }
                            : undefined
                    }
                >
                    <div
                        ref={contentRef}
                        onClick={handleClick}
                        style={
                            isShell
                                ? {
                                      transform: `scale(${scale})`,
                                      transformOrigin: "top center",
                                  }
                                : undefined
                        }
                        /*
                         * The hover affordance is scoped to this container, so
                         * the same markup rendered into the PDF or into a
                         * gallery miniature shows no interactive styling.
                         *
                         * In the shell this is the "paper": bounded width,
                         * centred on the ground, with a shadow so it lifts.
                         */
                        className="invoice-live-preview my-1 overflow-hidden rounded-xl border border-border shell:mx-auto shell:my-0 shell:w-[46rem] shell:border-black/5 shell:shadow-elevated"
                    >
                        <DynamicInvoiceTemplate
                            {...data}
                            labels={labels}
                            locale={locale}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

/*
 * Memoised on `data` identity. PdfViewer re-renders on every keystroke because
 * it subscribes to the form, but the debounced value it passes down only gets
 * a new identity every 400ms — so the invoice template re-renders then, rather
 * than on each character typed.
 */
export default memo(LivePreview);
