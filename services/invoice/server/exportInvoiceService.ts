import { NextRequest, NextResponse } from "next/server";

// JSON2CSV
import { AsyncParser } from "@json2csv/node";

// XML2JS
import { Builder } from "xml2js";

// Validation
import { InvoiceSchema } from "@/lib/schemas";
import { parseJsonBody } from "@/lib/server/validateRequest";

// Types
import { ExportTypes } from "@/types";

/**
 * Export an invoice in selected format.
 *
 * @param {NextRequest} req - The Next.js request object.
 * @returns {NextResponse} A response object containing the exported data in the requested format.
 */
export async function exportInvoiceService(req: NextRequest) {
    const format = req.nextUrl.searchParams.get("format");

    /*
     * The parsed body is handed to xml2js and json2csv, both of which walk the
     * whole structure. Validating first means they only ever see an
     * invoice-shaped object, rather than arbitrary deeply-nested JSON.
     */
    const parsed = await parseJsonBody(req, InvoiceSchema);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;

    try {
        switch (format) {
            case ExportTypes.JSON: {
                const jsonData = JSON.stringify(body, null, 2);
                return new NextResponse(jsonData, {
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Disposition":
                            "attachment; filename=invoice.json",
                    },
                    status: 200,
                });
            }
            case ExportTypes.CSV: {
                const items = body.details.items && body.details.items.length > 0
                    ? body.details.items
                    : [{ name: "", description: "", quantity: 0, unitPrice: 0, total: 0 }];

                const tabularRows = items.map((item, idx) => ({
                    "Invoice Number": body.details.invoiceNumber || "",
                    "Invoice Date": body.details.invoiceDate || "",
                    "Due Date": body.details.dueDate || "",
                    "Currency": body.details.currency || "USD",
                    "From Name": body.sender.name || "",
                    "From Email": body.sender.email || "",
                    "From Phone": body.sender.phone || "",
                    "From Address": body.sender.address || "",
                    "From City": body.sender.city || "",
                    "From Country": body.sender.country || "",
                    "To Name": body.receiver.name || "",
                    "To Email": body.receiver.email || "",
                    "To Phone": body.receiver.phone || "",
                    "To Address": body.receiver.address || "",
                    "To City": body.receiver.city || "",
                    "To Country": body.receiver.country || "",
                    "Item #": idx + 1,
                    "Item Name": item.name || "",
                    "Item Description": item.description || "",
                    "Quantity": item.quantity ?? 0,
                    "Unit Price": item.unitPrice ?? 0,
                    "Item Total": item.total ?? 0,
                    "Sub Total": body.details.subTotal ?? 0,
                    "Discount": body.details.discountDetails?.amount ?? 0,
                    "Tax": body.details.taxDetails?.amount ?? 0,
                    "Shipping": body.details.shippingDetails?.cost ?? 0,
                    "Total Amount": body.details.totalAmount ?? 0,
                    "Payment Terms": body.details.paymentTerms || "",
                    "Bank Name": body.details.paymentInformation?.bankName || "",
                    "Account Number": body.details.paymentInformation?.accountNumber || "",
                    "Notes": body.details.additionalNotes || "",
                }));

                const parser = new AsyncParser();
                const csv = await parser.parse(tabularRows).promise();
                return new NextResponse(csv, {
                    headers: {
                        "Content-Type": "text/csv; charset=utf-8",
                        "Content-Disposition":
                            "attachment; filename=invoice.csv",
                    },
                });
            }
            case ExportTypes.XML: {
                // Strip massive base64 image strings so the XML document is clean, readable and fast
                const sanitizedBody = {
                    ...body,
                    details: {
                        ...body.details,
                        invoiceLogo: body.details.invoiceLogo ? "[Embedded Image]" : undefined,
                        signature: body.details.signature
                            ? { ...body.details.signature, data: "[Embedded Signature]" }
                            : undefined,
                    },
                };
                const builder = new Builder({ rootName: "invoice", headless: false });
                const xml = builder.buildObject(sanitizedBody);
                return new NextResponse(xml, {
                    headers: {
                        "Content-Type": "application/xml; charset=utf-8",
                        "Content-Disposition":
                            "attachment; filename=invoice.xml",
                    },
                });
            }
            /*
             * ExportTypes.XLSX is intentionally unimplemented. The original
             * case was commented out, so the UI's "Export as XLSX" button only
             * ever errored; that button has been removed rather than left
             * broken. Restoring it needs a spreadsheet library — note the
             * `xlsx` package was dropped here because the 0.18.5 line on npm
             * carries unpatched advisories and SheetJS now publishes from its
             * own registry.
             */
            default:
                /*
                 * Previously absent: an unknown format fell out of the switch
                 * and returned undefined, which Next surfaces as an opaque
                 * "no response returned" 500 rather than a usable error.
                 */
                return NextResponse.json(
                    { error: `Unsupported export format: ${format ?? "none"}` },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("Export error:", error);

        return NextResponse.json(
            { error: "Failed to export invoice" },
            { status: 500 }
        );
    }
}
