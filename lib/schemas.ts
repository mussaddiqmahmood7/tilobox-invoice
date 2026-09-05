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
        .max(120, { message: "Must be between 2 and 120 characters" }),
    address: z
        .string()
        .min(2, { message: "Must be at least 2 characters" })
        .max(250, { message: "Must be between 2 and 250 characters" }),
    zipCode: z
        .string()
        .min(2, { message: "Must be between 2 and 20 characters" })
        .max(20, { message: "Must be between 2 and 20 characters" }),
    city: z
        .string()
        .min(1, { message: "Must be between 1 and 100 characters" })
        .max(100, { message: "Must be between 1 and 100 characters" }),
    country: z
        .string()
        .min(1, { message: "Must be between 1 and 100 characters" })
        .max(100, { message: "Must be between 1 and 100 characters" }),
    email: z
        .string()
        .email({ message: "Email must be a valid email" })
        .min(5, { message: "Must be between 5 and 254 characters" })
        .max(254, { message: "Must be between 5 and 254 characters" }),
    phone: z
        .string()
        .min(1, { message: "Must be between 1 and 50 characters" })
        .max(50, {
            message: "Must be between 1 and 50 characters",
        }),

    /*
     * Dates.
     *
     * Handles Date instances, ISO strings, timestamps, or empty string/null
     * gracefully without throwing invalid_date on drafts or exported files.
     */
    date: z
        .union([z.date(), z.string(), z.number()])
        .optional()
        .nullable()
        .transform((val) => {
            if (!val || (typeof val === "string" && val.trim() === "")) return "";
            const d = new Date(val);
            if (isNaN(d.getTime())) return "";
            return d.toLocaleDateString("en-US", DATE_OPTIONS);
        }),

    // Items
    quantity: z.coerce
        .number()
        .gte(0, { message: "Must be a non-negative number" }),
    unitPrice: z.coerce
        .number()
        .gte(0, { message: "Must be a non-negative number" })
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

const PaymentQrSchema = z.object({
    enabled: z.boolean().optional(),
    type: z.enum(["upi", "paypal", "stripe", "iban", "custom"]).or(z.literal("")).optional(),
    value: fieldValidators.stringOptional,
    title: fieldValidators.stringOptional,
});

const PaymentInformationSchema = z.object({
    bankName: fieldValidators.stringOptional,
    accountName: fieldValidators.stringOptional,
    accountNumber: fieldValidators.stringOptional,
    paymentQr: PaymentQrSchema.optional(),
});

const DiscountDetailsSchema = z.object({
    amount: fieldValidators.stringToNumberWithMax,
    amountType: fieldValidators.stringOptional,
});

const TaxDetailsSchema = z.object({
    amount: fieldValidators.stringToNumberWithMax,
    taxID: fieldValidators.stringOptional,
    amountType: fieldValidators.stringOptional,
});

const ShippingDetailsSchema = z.object({
    cost: fieldValidators.stringToNumberWithMax,
    costType: fieldValidators.stringOptional,
});

const SignatureSchema = z.object({
    data: fieldValidators.string,
    // Interpolated into a Google Fonts URL during PDF generation, so it is
    // restricted to the fonts the UI actually offers.
    fontFamily: z
        .enum(SIGNATURE_FONTS.map((font) => font.name) as [string, ...string[]])
        .or(z.literal(""))
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
    documentFormat: z.enum(["a4", "receipt"]).optional(),
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
    totalAmountInWords: fieldValidators.stringOptional,
    additionalNotes: fieldValidators.stringOptional,
    paymentTerms: fieldValidators.stringOptional,
    signature: SignatureSchema.optional(),
    updatedAt: fieldValidators.stringOptional,
    pdfTemplate: z.coerce.number(),
});

const InvoiceSchema = z.object({
    sender: InvoiceSenderSchema,
    receiver: InvoiceReceiverSchema,
    details: InvoiceDetailsSchema,
});

export { InvoiceSchema, ItemSchema };
