import { NextRequest, NextResponse } from "next/server";
import type { z, ZodTypeAny } from "zod";

/**
 * Default cap on a JSON request body.
 *
 * Next route handlers put no limit on `req.json()`, so an unbounded body was a
 * straightforward memory/CPU denial-of-service — particularly against the
 * export endpoint, which hands arbitrary parsed JSON to xml2js/json2csv.
 * Generous enough for an invoice carrying an embedded base64 logo.
 */
export const MAX_JSON_BODY_BYTES = 4 * 1024 * 1024; // 4MB

export type ValidationFailure = { ok: false; response: NextResponse };
export type ValidationSuccess<T> = { ok: true; data: T };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function badRequest(message: string, status = 400): ValidationFailure {
    return {
        ok: false,
        response: NextResponse.json({ error: message }, { status }),
    };
}

/**
 * Reads a JSON body with a size cap and validates it against `schema`.
 *
 * The route handlers previously did `const body: InvoiceType = await
 * req.json()` — a TypeScript annotation that is erased at runtime, so
 * `InvoiceSchema` only ever ran in the browser and was bypassed by any direct
 * request to the API.
 */
export async function parseJsonBody<S extends ZodTypeAny>(
    req: NextRequest,
    schema: S,
    maxBytes: number = MAX_JSON_BODY_BYTES
): Promise<ValidationResult<z.infer<S>>> {
    // Trust the declared length only to reject early; the real check is below.
    const declaredLength = Number(req.headers.get("content-length") ?? "0");
    if (declaredLength > maxBytes) {
        return badRequest("Request body is too large", 413);
    }

    let raw: string;
    try {
        raw = await req.text();
    } catch {
        return badRequest("Could not read request body");
    }

    if (Buffer.byteLength(raw, "utf8") > maxBytes) {
        return badRequest("Request body is too large", 413);
    }

    let json: unknown;
    try {
        json = JSON.parse(raw);
    } catch {
        return badRequest("Request body is not valid JSON");
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
        // Field-level detail in development only — in production it would leak
        // the shape of the schema to anyone probing the endpoint.
        if (process.env.NODE_ENV !== "production") {
            return {
                ok: false,
                response: NextResponse.json(
                    {
                        error: "Invalid invoice data",
                        issues: parsed.error.issues.map((issue) => ({
                            path: issue.path.join("."),
                            message: issue.message,
                        })),
                    },
                    { status: 400 }
                ),
            };
        }
        return badRequest("Invalid invoice data");
    }

    return { ok: true, data: parsed.data };
}
