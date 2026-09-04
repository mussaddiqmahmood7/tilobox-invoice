import { NextRequest } from "next/server";

// Nodemailer
import nodemailer, { SendMailOptions } from "nodemailer";

// React-email
import { render } from "@react-email/render";

// Components
import { SendPdfEmail } from "@/app/components";

// Helpers
import { fileToBuffer, isValidEmail } from "@/lib/helpers";

// Rate limiting
import { getClientKey, rateLimit } from "@/lib/server/rateLimit";

// Variables
import { NODEMAILER_EMAIL, NODEMAILER_PW } from "@/lib/variables";

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: NODEMAILER_EMAIL,
        pass: NODEMAILER_PW,
    },
});

// Check if email credentials are configured
const isEmailConfigured = () => {
    return !!(NODEMAILER_EMAIL && NODEMAILER_PW);
};

/** Comfortably above a real invoice PDF, well below anything worth relaying. */
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB

const MAX_INVOICE_NUMBER_LENGTH = 50;

/** Sends per client, per hour. */
const SEND_LIMIT = 5;
const SEND_WINDOW_MS = 60 * 60 * 1000;

/** Thrown for conditions the caller should surface as a 4xx. */
export class SendPdfRequestError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "SendPdfRequestError";
        this.status = status;
    }
}

/**
 * Send a PDF as an email attachment.
 *
 * This endpoint sends mail from the site's own account to an address supplied
 * in the request, with an attachment supplied in the request. Without the
 * checks below that is an open relay: anyone could have the site email
 * arbitrary attachments to arbitrary recipients, which is both a spam/phishing
 * vector and a fast route to the sending account being blocked.
 *
 * @param {NextRequest} req - The Next.js request object.
 * @returns {Promise<boolean>} A Promise that resolves to a boolean, indicating whether the email was sent successfully.
 * @throws {Error} Throws an error if there is an issue with sending the email.
 */
export async function sendPdfToEmailService(
    req: NextRequest
): Promise<boolean> {
    // Check if email service is configured
    if (!isEmailConfigured()) {
        console.error(
            "Email service not configured. Please set NODEMAILER_EMAIL and NODEMAILER_PW environment variables."
        );
        throw new Error(
            "Email service not configured. Please contact the administrator."
        );
    }

    const limit = rateLimit(
        `send-pdf:${getClientKey(req)}`,
        SEND_LIMIT,
        SEND_WINDOW_MS
    );
    if (!limit.allowed) {
        throw new SendPdfRequestError(
            `Too many emails sent. Try again in ${limit.retryAfterSeconds} seconds.`,
            429
        );
    }

    const fd = await req.formData();

    // Get form data values
    const email = fd.get("email");
    const invoicePdf = fd.get("invoicePdf");
    const invoiceNumber = fd.get("invoiceNumber");

    /*
     * `isValidEmail` already existed but was only ever called in the browser,
     * so the address reached nodemailer's `to` completely unchecked.
     */
    if (typeof email !== "string" || !isValidEmail(email)) {
        throw new SendPdfRequestError("A valid email address is required");
    }

    if (
        typeof invoiceNumber !== "string" ||
        invoiceNumber.length === 0 ||
        invoiceNumber.length > MAX_INVOICE_NUMBER_LENGTH
    ) {
        throw new SendPdfRequestError("A valid invoice number is required");
    }

    if (!(invoicePdf instanceof File) || invoicePdf.size === 0) {
        throw new SendPdfRequestError("An invoice PDF is required");
    }

    if (invoicePdf.size > MAX_ATTACHMENT_BYTES) {
        throw new SendPdfRequestError("The attached PDF is too large", 413);
    }

    if (invoicePdf.type && invoicePdf.type !== "application/pdf") {
        throw new SendPdfRequestError("The attachment must be a PDF");
    }

    // Convert file to buffer
    const invoiceBuffer = await fileToBuffer(invoicePdf);

    // Reject anything that isn't actually a PDF, regardless of declared type
    if (invoiceBuffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
        throw new SendPdfRequestError("The attachment must be a PDF");
    }

    // Get email html content
    const emailHTML = render(SendPdfEmail({ invoiceNumber }));

    try {
        const mailOptions: SendMailOptions = {
            // A bare display name with no address can be rewritten or flagged
            // by receiving providers.
            from: `"Invoify" <${NODEMAILER_EMAIL}>`,
            to: email,
            subject: `Invoice Ready: #${invoiceNumber}`,
            html: emailHTML,
            attachments: [
                {
                    filename: "invoice.pdf",
                    content: invoiceBuffer,
                    contentType: "application/pdf",
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}
