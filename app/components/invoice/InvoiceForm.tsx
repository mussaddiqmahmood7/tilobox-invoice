"use client";

import { useMemo } from "react";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// Components
import {
    AutosaveIndicator,
    WizardStep,
    BillFromSection,
    BillToSection,
    InvoiceDetails,
    Items,
    PaymentInformation,
    InvoiceSummary,
} from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

const InvoiceForm = () => {
    const { _t } = useTranslationContext();

    const { control } = useFormContext();

    // Get invoice number variable
    const invoiceNumber = useWatch({
        name: "details.invoiceNumber",
        control,
    });

    const invoiceNumberLabel = useMemo(() => {
        if (invoiceNumber) {
            return `#${invoiceNumber}`;
        } else {
            return _t("form.newInvBadge");
        }
    }, [invoiceNumber]);

    /*
     * No Card here any more.
     *
     * Every field used to sit inside a card, inside a card, inside a bordered
     * step — three nested borders before you reached an input, which is most of
     * why the form read as busy. The form is now a plain column separated by
     * hairlines, and the only boxed surface left on the page is the invoice
     * preview itself.
     */
    return (
        // `min-h-0` is what actually lets a grid child shrink and scroll; without
        // it the pane grows to its content and the page scrolls instead.
        // `@container` scopes every responsive rule inside the form to the width
        // of this column rather than the viewport. Without it, a `sm:` class
        // fires on a 1440px desktop even though the form itself is a ~420px
        // rail, which is how a 12-column line-item grid ends up in 420px.
        <div className="@container min-w-0 shell:flex shell:min-h-0 shell:flex-col shell:border-e shell:border-border shell:bg-card">
            <div className="mx-auto max-w-2xl shell:min-h-0 shell:overflow-y-auto shell:p-5 xl:mx-0">
                {/*
                  * A meta row, not a heading.
                  *
                  * This used to be "Invoice" over "Generate Invoice" — a title
                  * and a subtitle labelling a form that is plainly visible,
                  * costing ~64px of a rail whose whole problem is height. What
                  * is left is the two things here a user acts on: whether the
                  * draft is saved, and which invoice this is.
                  *
                  * Still not an <h1>: every invoice template renders headings
                  * inside the live preview, so the document already carries
                  * headings made of the user's own data. The real h1 is in
                  * LandingContent.
                  */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 shell:mb-3">
                    <AutosaveIndicator />
                    <span className="text-sm font-medium text-muted-foreground">
                        {invoiceNumberLabel}
                    </span>
                </div>

                {/*
                 * react-use-wizard is gone; the active step lives in
                 * WizardContext. `step` indexes into WIZARD_STEPS, which is
                 * now the single source of order and labels.
                 */}
                <WizardStep step={0}>
                    {/*
                     * Two columns when the form column is wide enough to hold
                     * them, one when it is not. This used to be `md:` plus an
                     * `xl:` override undoing it, because the viewport said
                     * "wide" while the form column was actually the narrow half
                     * of a split layout. A container query states the real rule
                     * once: split at 672px of column, stack below.
                     */}
                    {/*
                     * `shell:` as well as `@2xl:`, because in the desktop rail
                     * the two sections side by side are *shorter* than the two
                     * stacked: ~560px against ~790px. Each half is only ~190px
                     * though, far too narrow for a 7rem label beside its
                     * input, so each is its own `@container` and the rows
                     * inside fall back to stacked — see fieldStyles.ts.
                     *
                     * Not width-gated below shell: a 430px phone's form column
                     * is the same width as the 1280px rail, and phones must
                     * keep the single stacked column that is signed off.
                     */}
                    <div className="grid grid-cols-1 divide-y divide-border shell:grid-cols-2 shell:gap-5 shell:divide-y-0 @2xl:grid-cols-2 @2xl:gap-8 @2xl:divide-y-0">
                        <div className="@container pb-8 shell:pb-0 @2xl:pb-0">
                            <BillFromSection />
                        </div>

                        <div className="@container pt-8 shell:pt-0 @2xl:pt-0">
                            <BillToSection />
                        </div>
                    </div>
                </WizardStep>

                <WizardStep step={1}>
                    <InvoiceDetails />
                </WizardStep>

                <WizardStep step={2}>
                    <Items />
                </WizardStep>

                <WizardStep step={3}>
                    <PaymentInformation />
                </WizardStep>

                <WizardStep step={4}>
                    <InvoiceSummary />
                </WizardStep>
            </div>
        </div>
    );
};

export default InvoiceForm;
