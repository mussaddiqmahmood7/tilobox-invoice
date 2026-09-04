"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// ShadCn
import { Skeleton } from "@/components/ui/skeleton";

// Types
import { InvoiceType } from "@/types";

// Labels
import { InvoiceTemplateExtras } from "./invoiceLabels";

// Registry
import { DEFAULT_TEMPLATE_ID, getTemplateEntry } from "./registry";

const DynamicInvoiceTemplateSkeleton = () => {
    return <Skeleton className="min-h-[30rem] w-full lg:min-h-[60rem]" />;
};

type DynamicInvoiceTemplateProps = InvoiceType & InvoiceTemplateExtras;

const DynamicReceipt = dynamic<DynamicInvoiceTemplateProps>(
    () => import("./layouts/ReceiptTemplate"),
    {
        loading: () => <DynamicInvoiceTemplateSkeleton />,
        ssr: false,
    }
);

const DynamicInvoiceTemplate = (props: DynamicInvoiceTemplateProps) => {
    const isReceipt = props.details.documentFormat === "receipt";
    const templateId = props.details.pdfTemplate ?? DEFAULT_TEMPLATE_ID;

    const DynamicInvoice = useMemo(() => {
        if (isReceipt) return DynamicReceipt;

        const entry =
            getTemplateEntry(templateId) ??
            getTemplateEntry(DEFAULT_TEMPLATE_ID)!;

        return dynamic<DynamicInvoiceTemplateProps>(entry.load, {
            loading: () => <DynamicInvoiceTemplateSkeleton />,
            ssr: false,
        });
    }, [templateId, isReceipt]);

    return <DynamicInvoice {...props} />;
};

export default React.memo(DynamicInvoiceTemplate);
