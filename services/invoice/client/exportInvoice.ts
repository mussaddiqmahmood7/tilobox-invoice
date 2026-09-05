// Variables
import { EXPORT_INVOICE_API } from "@/lib/variables";

// Types
import { ExportTypes, InvoiceType } from "@/types";

/**
 * Trigger file download for a generated Blob in the browser.
 */
function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    try {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } finally {
        window.URL.revokeObjectURL(url);
    }
}

/**
 * Generate CSV string client-side with proper RFC 4180 tabular rows.
 */
export function generateInvoiceCsv(formValues: InvoiceType): string {
    const items = formValues.details?.items && formValues.details.items.length > 0
        ? formValues.details.items
        : [{ name: "", description: "", quantity: 0, unitPrice: 0, total: 0 }];

    const headers = [
        "Invoice Number", "Invoice Date", "Due Date", "Currency",
        "From Name", "From Email", "From Phone", "From Address",
        "To Name", "To Email", "To Phone", "To Address",
        "Item #", "Item Name", "Item Description", "Quantity", "Unit Price", "Item Total",
        "Sub Total", "Discount", "Tax", "Shipping", "Total Amount",
        "Payment Terms", "Bank Name", "Account Number", "Notes",
    ];

    const escapeCsv = (val: unknown) => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const rows = items.map((item, idx) => [
        formValues.details?.invoiceNumber || "",
        formValues.details?.invoiceDate || "",
        formValues.details?.dueDate || "",
        formValues.details?.currency || "USD",
        formValues.sender?.name || "",
        formValues.sender?.email || "",
        formValues.sender?.phone || "",
        formValues.sender?.address || "",
        formValues.receiver?.name || "",
        formValues.receiver?.email || "",
        formValues.receiver?.phone || "",
        formValues.receiver?.address || "",
        idx + 1,
        item.name || "",
        item.description || "",
        item.quantity ?? 0,
        item.unitPrice ?? 0,
        item.total ?? 0,
        formValues.details?.subTotal ?? 0,
        formValues.details?.discountDetails?.amount ?? 0,
        formValues.details?.taxDetails?.amount ?? 0,
        formValues.details?.shippingDetails?.cost ?? 0,
        formValues.details?.totalAmount ?? 0,
        formValues.details?.paymentTerms || "",
        formValues.details?.paymentInformation?.bankName || "",
        formValues.details?.paymentInformation?.accountNumber || "",
        formValues.details?.additionalNotes || "",
    ].map(escapeCsv).join(","));

    return [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
}

/**
 * Generate XML string client-side without server roundtrip.
 */
export function generateInvoiceXml(formValues: InvoiceType): string {
    const escapeXml = (val: unknown) => {
        return String(val ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    };

    const itemsXml = (formValues.details?.items || []).map((item, idx) => `
    <item>
      <index>${idx + 1}</index>
      <name>${escapeXml(item.name)}</name>
      <description>${escapeXml(item.description)}</description>
      <quantity>${item.quantity ?? 0}</quantity>
      <unitPrice>${item.unitPrice ?? 0}</unitPrice>
      <total>${item.total ?? 0}</total>
    </item>`).join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<invoice>
  <sender>
    <name>${escapeXml(formValues.sender?.name)}</name>
    <address>${escapeXml(formValues.sender?.address)}</address>
    <zipCode>${escapeXml(formValues.sender?.zipCode)}</zipCode>
    <city>${escapeXml(formValues.sender?.city)}</city>
    <country>${escapeXml(formValues.sender?.country)}</country>
    <email>${escapeXml(formValues.sender?.email)}</email>
    <phone>${escapeXml(formValues.sender?.phone)}</phone>
  </sender>
  <receiver>
    <name>${escapeXml(formValues.receiver?.name)}</name>
    <address>${escapeXml(formValues.receiver?.address)}</address>
    <zipCode>${escapeXml(formValues.receiver?.zipCode)}</zipCode>
    <city>${escapeXml(formValues.receiver?.city)}</city>
    <country>${escapeXml(formValues.receiver?.country)}</country>
    <email>${escapeXml(formValues.receiver?.email)}</email>
    <phone>${escapeXml(formValues.receiver?.phone)}</phone>
  </receiver>
  <details>
    <invoiceNumber>${escapeXml(formValues.details?.invoiceNumber)}</invoiceNumber>
    <invoiceDate>${escapeXml(formValues.details?.invoiceDate)}</invoiceDate>
    <dueDate>${escapeXml(formValues.details?.dueDate)}</dueDate>
    <currency>${escapeXml(formValues.details?.currency)}</currency>
    <subTotal>${formValues.details?.subTotal ?? 0}</subTotal>
    <totalAmount>${formValues.details?.totalAmount ?? 0}</totalAmount>
    <totalAmountInWords>${escapeXml(formValues.details?.totalAmountInWords)}</totalAmountInWords>
    <paymentTerms>${escapeXml(formValues.details?.paymentTerms)}</paymentTerms>
    <additionalNotes>${escapeXml(formValues.details?.additionalNotes)}</additionalNotes>
    <items>${itemsXml}
    </items>
  </details>
</invoice>`;
}

/**
 * Generate client-side offline export for JSON, CSV, and XML.
 */
export function exportInvoiceClient(exportAs: ExportTypes, formValues: InvoiceType) {
    const filename = `invoice-${formValues.details?.invoiceNumber || "draft"}.${exportAs.toLowerCase()}`;

    switch (exportAs) {
        case ExportTypes.JSON: {
            const json = JSON.stringify(formValues, null, 2);
            downloadBlob(new Blob([json], { type: "application/json" }), filename);
            break;
        }
        case ExportTypes.CSV: {
            const csv = generateInvoiceCsv(formValues);
            downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
            break;
        }
        case ExportTypes.XML: {
            const xml = generateInvoiceXml(formValues);
            downloadBlob(new Blob([xml], { type: "application/xml;charset=utf-8;" }), filename);
            break;
        }
        default: {
            throw new Error(`Unsupported export format: ${exportAs}`);
        }
    }
}

/**
 * Export an invoice by sending a POST request to the server and initiating the download.
 * If the server request fails, gracefully falls back to client-side generation.
 */
export const exportInvoice = async (
    exportAs: ExportTypes,
    formValues: InvoiceType
) => {
    try {
        const response = await fetch(`${EXPORT_INVOICE_API}?format=${exportAs}`, {
            method: "POST",
            body: JSON.stringify(formValues),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => "");
            console.warn(`Server export returned status ${response.status}: ${errText}. Falling back to client-side export.`);
            exportInvoiceClient(exportAs, formValues);
            return;
        }

        const blob = await response.blob();
        const filename = `invoice-${formValues.details?.invoiceNumber || "export"}.${exportAs.toLowerCase()}`;
        downloadBlob(blob, filename);
    } catch (networkError) {
        console.warn("Server export network failed. Falling back to client-side export.", networkError);
        exportInvoiceClient(exportAs, formValues);
    }
};

