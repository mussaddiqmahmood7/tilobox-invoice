import { z } from "zod";

// Variables
import { DATE_OPTIONS, SIGNATURE_FONTS } from "@/lib/variables";

/**
 * Roughly 2MB of binary once base64-decoded — generous for a logo, but bounded.
 */
const MAX_LOGO_CHARS = 3_000_000;

/**
 * The logo is rendered as `<img src>` inside the HTML handed to Puppeteer, so
 * an arbitrary URL here means the server fetches it — a straightforward SSRF
 * into cloud metadata endpoints or internal services. The app only ever
 * produces base64 data URLs (see FormFile), so anything else is rejected.
 */
const imageDataUrl = z
    .string()
    .max(MAX_LOGO_CHARS, { message: "Logo is too large" })
    .refine((value) => value === "" || /^data:image\/[a-z0-9.+-]+;base64,/i.test(value), {
        message: "Logo must be an embedded image",
    });

// TODO: Refactor some of the validators. Ex: name and zipCode or address and country have same rules
// Field Validators
const fieldValidators = {
    name: z
        .string()
        .min(2, { message: "Must be at least 2 characters" })
        .max(50, { message: "Must be at most 50 characters" }),
    address: z
        .string()
        .min(2, { message: "Must be at least 2 characters" })
        .max(70, { message: "Must be between 2 and 70 characters" }),
    zipCode: z
        .string()
        .min(2, { message: "Must be between 2 and 20 characters" })
        .max(20, { message: "Must be between 2 and 20 characters" }),
    city: z
        .string()
        .min(1, { message: "Must be between 1 and 50 characters" })
        .max(50, { message: "Must be between 1 and 50 characters" }),
    country: z
        .string()
        .min(1, { message: "Must be between 1 and 70 characters" })
        .max(70, { message: "Must be between 1 and 70 characters" }),
    email: z
        .string()
        .email({ message: "Email must be a valid email" })
        .min(5, { message: "Must be between 5 and 30 characters" })
        .max(30, { message: "Must be between 5 and 30 characters" }),
    phone: z
        .string()
        .min(1, { message: "Must be between 1 and 50 characters" })
        .max(50, {
            message: "Must be between 1 and 50 characters",
        }),

    /*
     * Dates.
     *
     * On the client react-hook-form holds real Date objects, but JSON has no
     * date type — over the wire these arrive as ISO strings. A bare `z.date()`
     * therefore passes in the browser and fails on the server, so accept both
     * and normalise. The `.pipe` keeps the existing display-string transform.
     */
    date: z
        .union([z.date(), z.string(), z.number()])
        .pipe(z.coerce.date())
        .transform((date) =>
            new Date(date).toLocaleDateString("en-US", DATE_OPTIONS)
        ),

    // Items
    quantity: z.coerce
        .number()
        .gt(0, { message: "Must be a number greater than 0" }),
    unitPrice: z.coerce
        .number()
        .gt(0, { message: "Must be a number greater than 0" })
        .lte(Number.MAX_SAFE_INTEGER, { message: `Must be ≤ ${Number.MAX_SAFE_INTEGER}` }),

    // Strings
    string: z.string(),
    stringMin1: z.string().min(1, { message: "Must be at least 1 character" }),
    stringToNumber: z.coerce.number(),

    // Charges
    stringToNumberWithMax: z.coerce.number().max(1000000),

    stringOptional: z.string().optional(),

    nonNegativeNumber: z.coerce.number().nonnegative({
        message: "Must be a positive number",
    }),
};

const CustomInputSchema = z.object({
    key: z.string(),
    value: z.string(),
});

const InvoiceSenderSchema = z.object({
    name: fieldValidators.name,
    address: fieldValidators.address,
    zipCode: fieldValidators.zipCode,
    city: fieldValidators.city,
    country: fieldValidators.country,
    email: fieldValidators.email,
    phone: fieldValidators.phone,
    customInputs: z.array(CustomInputSchema).optional(),
});

const InvoiceReceiverSchema = z.object({
    name: fieldValidators.name,
    address: fieldValidators.address,
    zipCode: fieldValidators.zipCode,
    city: fieldValidators.city,
    country: fieldValidators.country,
    email: fieldValidators.email,
    phone: fieldValidators.phone,
    customInputs: z.array(CustomInputSchema).optional(),
});

const ItemSchema = z.object({
    name: fieldValidators.stringMin1,
    description: fieldValidators.stringOptional,
    quantity: fieldValidators.quantity,
    unitPrice: fieldValidators.unitPrice,
    total: fieldValidators.stringToNumber,
});

const PaymentInformationSchema = z.object({
    bankName: fieldValidators.stringMin1,
    accountName: fieldValidators.stringMin1,
    accountNumber: fieldValidators.stringMin1,
});

const DiscountDetailsSchema = z.object({
    amount: fieldValidators.stringToNumberWithMax,
    amountType: fieldValidators.string,
});

const TaxDetailsSchema = z.object({
    amount: fieldValidators.stringToNumberWithMax,
    taxID: fieldValidators.string,
    amountType: fieldValidators.string,
});

const ShippingDetailsSchema = z.object({
    cost: fieldValidators.stringToNumberWithMax,
    costType: fieldValidators.string,
});

const SignatureSchema = z.object({
    data: fieldValidators.string,
    // Interpolated into a Google Fonts URL during PDF generation, so it is
    // restricted to the fonts the UI actually offers.
    fontFamily: z
        .enum(SIGNATURE_FONTS.map((font) => font.name) as [string, ...string[]])
        .optional(),
});

/**
 * Presentation options. Every field optional with a default so existing saved
 * invoices keep validating.
 */
const ThemeSchema = z.object({
    // Restricted to a hex literal: the value is interpolated into inline
    // styles in the templates, including in the PDF.
    accentColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, { message: "Must be a hex colour" })
        .optional(),
    fontId: z
        .enum(["outfit", "plexSans", "sourceSerif", "plexMono"])
        .optional(),
    // "spacious" is new; the two older values still validate, so invoices
    // saved before it existed keep loading.
    density: z.enum(["compact", "comfortable", "spacious"]).optional(),
});

const InvoiceDetailsSchema = z.object({
    theme: ThemeSchema.optional(),
    invoiceLogo: imageDataUrl.optional(),
    invoiceNumber: fieldValidators.stringMin1,
    invoiceDate: fieldValidators.date,
    dueDate: fieldValidators.date,
    purchaseOrderNumber: fieldValidators.stringOptional,
    currency: fieldValidators.string,
    language: fieldValidators.string,
    items: z.array(ItemSchema),
    paymentInformation: PaymentInformationSchema.optional(),
    taxDetails: TaxDetailsSchema.optional(),
    discountDetails: DiscountDetailsSchema.optional(),
    shippingDetails: ShippingDetailsSchema.optional(),
    subTotal: fieldValidators.nonNegativeNumber,
    totalAmount: fieldValidators.nonNegativeNumber,
    totalAmountInWords: fieldValidators.string,
    additionalNotes: fieldValidators.stringOptional,
    paymentTerms: fieldValidators.stringMin1,
    signature: SignatureSchema.optional(),
    updatedAt: fieldValidators.stringOptional,
    pdfTemplate: z.number(),
});

const InvoiceSchema = z.object({
    sender: InvoiceSenderSchema,
    receiver: InvoiceReceiverSchema,
    details: InvoiceDetailsSchema,
});

export { InvoiceSchema, ItemSchema };
