/**
 * The wizard's steps, in one place.
 *
 * There used to be two sources of truth: the order lived in the JSX child order
 * of InvoiceForm's <Wizard>, and the labels and per-step validation lived in a
 * hand-written array inside WizardProgress whose `id` had to be kept in sync by
 * hand. Adding or reordering a step meant editing both and hoping.
 *
 * This module is deliberately free of React and of next-intl, so it can be read
 * by the URL sync, the progress UI, the navigation and the preview's
 * click-to-edit mapping without any of them importing each other.
 */

export type WizardStepDef = {
    /** Index into the rendered step list. */
    id: number;
    /**
     * URL segment for `?step=`. Not localised: a shared link should survive
     * being opened in a different language, and localised slugs would need a
     * pathnames map across every locale.
     */
    slug: string;
    /** Key under `form.wizard` in the message files. */
    labelKey: string;
    /**
     * Leaf field paths that must all hold a value for the step to read as
     * complete. The line-items step is not expressible this way and is handled
     * separately — see `isItemsStep`.
     */
    requiredFields: string[];
    /** Error paths that mark the step invalid. */
    errorPaths: string[];
};

const partyFields = (party: "sender" | "receiver") => [
    `${party}.name`,
    `${party}.address`,
    `${party}.zipCode`,
    `${party}.city`,
    `${party}.country`,
    `${party}.email`,
    `${party}.phone`,
];

export const WIZARD_STEPS: WizardStepDef[] = [
    {
        id: 0,
        slug: "from-and-to",
        labelKey: "fromAndTo",
        requiredFields: [...partyFields("sender"), ...partyFields("receiver")],
        errorPaths: ["sender", "receiver"],
    },
    {
        id: 1,
        slug: "details",
        labelKey: "invoiceDetails",
        requiredFields: [
            "details.invoiceNumber",
            "details.invoiceDate",
            "details.dueDate",
            "details.currency",
        ],
        errorPaths: [
            "details.invoiceNumber",
            "details.invoiceDate",
            "details.dueDate",
            "details.currency",
        ],
    },
    {
        id: 2,
        slug: "items",
        labelKey: "lineItems",
        // Completeness depends on every row having a name, a quantity and a
        // price, which no flat list of paths can express.
        requiredFields: [],
        errorPaths: ["details.items"],
    },
    {
        id: 3,
        slug: "payment",
        labelKey: "paymentInfo",
        requiredFields: [
            "details.paymentInformation.bankName",
            "details.paymentInformation.accountName",
            "details.paymentInformation.accountNumber",
        ],
        errorPaths: ["details.paymentInformation"],
    },
    {
        id: 4,
        slug: "summary",
        labelKey: "summary",
        requiredFields: ["details.paymentTerms"],
        errorPaths: [
            "details.paymentTerms",
            "details.subTotal",
            "details.totalAmount",
            "details.discountDetails.amount",
            "details.taxDetails.amount",
            "details.shippingDetails.cost",
        ],
    },
];

export const WIZARD_STEP_COUNT = WIZARD_STEPS.length;

/** The line-items step needs bespoke completeness logic. */
export const ITEMS_STEP_ID = 2;
export const isItemsStep = (id: number) => id === ITEMS_STEP_ID;

/** Every field path any step watches, for a single narrow useWatch. */
export const WIZARD_WATCHED_FIELDS = Array.from(
    new Set([
        ...WIZARD_STEPS.flatMap((step) => step.requiredFields),
        "details.items",
    ])
);

export function stepIdFromSlug(slug: string | null | undefined): number | null {
    if (!slug) return null;
    const step = WIZARD_STEPS.find((s) => s.slug === slug);
    return step ? step.id : null;
}

export function slugFromStepId(id: number): string {
    return (WIZARD_STEPS[id] ?? WIZARD_STEPS[0]).slug;
}

/**
 * Which step owns a given form field.
 *
 * Used by the preview's click-to-edit: clicking a region on the invoice has to
 * resolve to the step that contains the field before it can focus it.
 */
export function stepIdForField(path: string): number {
    const exact = WIZARD_STEPS.find((step) =>
        step.requiredFields.some((field) => path === field || path.startsWith(`${field}.`))
    );
    if (exact) return exact.id;

    const byPrefix = WIZARD_STEPS.find((step) =>
        step.errorPaths.some((prefix) => path === prefix || path.startsWith(`${prefix}.`))
    );
    return byPrefix ? byPrefix.id : 0;
}
