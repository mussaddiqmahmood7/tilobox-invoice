"use client";

// Components
import {
    CurrencySelector,
    DatePickerFormField,
    FormInput,
    FormFile,
    Subheading,
    TemplateGallery,
} from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Hooks
import { useIsDesktop } from "@/hooks/useMediaQuery";

const InvoiceDetails = () => {
    const { _t } = useTranslationContext();

    /*
     * Above xl the template, accent and density controls live in the preview
     * toolbar beside the invoice, which is where option B puts them and where
     * they belong — they change the document, not the data. Below xl there is
     * no toolbar, so they stay here.
     *
     * Gated on the hook rather than a CSS `xl:hidden` so only one of the two
     * mounts: two TemplateGallery instances would mean two dialogs.
     */
    const isDesktop = useIsDesktop();

    return (
        <section className="flex flex-col flex-wrap gap-5">
            <Subheading>{_t("form.steps.invoiceDetails.heading")}:</Subheading>

            <div className="grid grid-cols-1 gap-8">
                <div className="flex min-w-0 flex-col gap-3">
                    <FormFile
                        name="details.invoiceLogo"
                        label={_t(
                            "form.steps.invoiceDetails.invoiceLogo.label"
                        )}
                        placeholder={_t(
                            "form.steps.invoiceDetails.invoiceLogo.placeholder"
                        )}
                    />

                    <FormInput
                        name="details.invoiceNumber"
                        label={_t("form.steps.invoiceDetails.invoiceNumber")}
                        placeholder="Invoice number"
                    />

                    <DatePickerFormField
                        name="details.invoiceDate"
                        label={_t("form.steps.invoiceDetails.issuedDate")}
                    />

                    <DatePickerFormField
                        name="details.dueDate"
                        label={_t("form.steps.invoiceDetails.dueDate")}
                    />

                    <CurrencySelector
                        name="details.currency"
                        label={_t("form.steps.invoiceDetails.currency")}
                        placeholder="Select Currency"
                    />
                </div>

                {!isDesktop && (
                    <div className="flex min-w-0 flex-col gap-2">
                        <TemplateGallery />
                    </div>
                )}
            </div>
        </section>
    );
};

export default InvoiceDetails;
