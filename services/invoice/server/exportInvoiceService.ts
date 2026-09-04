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
                const jsonData = JSON.stringify(body);
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
                //? Can pass specific fields to async parser. Empty = All
                const parser = new AsyncParser();
                const csv = await parser.parse(body).promise();
                return new NextResponse(csv, {
                    headers: {
                        "Content-Type": "text/csv",
                        "Content-Disposition":
                            "attachment; filename=invoice.csv",
                    },
                });
            }
            case ExportTypes.XML: {
                // Convert JSON to XML
                const builder = new Builder();
                const xml = builder.buildObject(body);
                return new NextResponse(xml, {
                    headers: {
                        "Content-Type": "application/xml",
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
