"use client";

// ShadCn
import { Skeleton } from "@/components/ui/skeleton";
// Types
import { InvoiceType } from "@/types";
import dynamic from "next/dynamic";

// Labels
import { InvoiceTemplateExtras } from "./invoiceLabels";

// Registry
import { DEFAULT_TEMPLATE_ID, getTemplateEntry } from "./registry";
import React, { useMemo } from "react";

const DynamicInvoiceTemplateSkeleton = () => {
    // 60rem of forced height pushed the whole page down on mobile before the
    // template had even loaded.
    return <Skeleton className="min-h-[30rem] w-full lg:min-h-[60rem]" />;
};

type DynamicInvoiceTemplateProps = InvoiceType & InvoiceTemplateExtras;

const DynamicInvoiceTemplate = (props: DynamicInvoiceTemplateProps) => {
    /*
     * Resolved through the registry rather than by interpolating the id into a
     * module path, so an unknown id falls back to the default template instead
     * of failing the import.
     */
    const templateId = props.details.pdfTemplate ?? DEFAULT_TEMPLATE_ID;

    const DynamicInvoice = useMemo(() => {
        const entry =
            getTemplateEntry(templateId) ??
            getTemplateEntry(DEFAULT_TEMPLATE_ID)!;

        return dynamic<DynamicInvoiceTemplateProps>(entry.load, {
            loading: () => <DynamicInvoiceTemplateSkeleton />,
            ssr: false,
        });
    }, [templateId]);

    return <DynamicInvoice {...props} />;
};

export default React.memo(DynamicInvoiceTemplate);
