import type { ComponentType } from "react";

import type { TemplateProps } from "./TemplateFrame";

/**
 * The single source of truth for which invoice templates exist.
 *
 * Replaces `import(\`.../InvoiceTemplate${templateId}\`)` — interpolating an id
 * into a module path meant an unknown id failed at import time and silently
 * returned null, and it gave no way to list the templates for a picker.
 *
 * Ids 1 and 2 keep their original layouts so invoices saved before this change
 * still render the way their author left them.
 */
export type TemplateEntry = {
    id: number;
    name: string;
    description: string;
    load: () => Promise<{ default: ComponentType<TemplateProps> }>;
};

export const TEMPLATES: TemplateEntry[] = [
    {
        id: 1,
        name: "Classic",
        description: "Logo left, large invoice title right",
        load: () => import("./layouts/Classic"),
    },
    {
        id: 2,
        name: "Modern",
        description: "Stacked header over a full-width accent rule",
        load: () => import("./layouts/Modern"),
    },
    {
        id: 3,
        name: "Sidebar",
        description: "Full-height accent rail carries the details",
        load: () => import("./layouts/Sidebar"),
    },
    {
        id: 4,
        name: "Bold Header",
        description: "Full-bleed colour band across the top",
        load: () => import("./layouts/BoldHeader"),
    },
    {
        id: 5,
        name: "Minimal",
        description: "No rules, fills or logo — whitespace does the work",
        load: () => import("./layouts/Minimal"),
    },
    {
        id: 6,
        name: "Letterhead",
        description: "Centred masthead, formal and symmetrical",
        load: () => import("./layouts/Letterhead"),
    },
    {
        id: 7,
        name: "Compact",
        description: "Tight receipt-style sheet for short invoices",
        load: () => import("./layouts/Compact"),
    },
    {
        id: 8,
        name: "Two-Tone",
        description: "Soft tinted bands behind header and totals",
        load: () => import("./layouts/TwoTone"),
    },
    {
        id: 9,
        name: "Bordered",
        description: "Ruled frame throughout, official-form feel",
        load: () => import("./layouts/Bordered"),
    },
    {
        id: 10,
        name: "Left Rail",
        description: "Thin accent stripe, editorial spacing",
        load: () => import("./layouts/LeftRail"),
    },
    {
        id: 11,
        name: "Statement",
        description: "Summary strip of key figures up front",
        load: () => import("./layouts/Statement"),
    },
    {
        id: 12,
        name: "Corner",
        description: "Amount due stamped in the top corner",
        load: () => import("./layouts/Corner"),
    },
    {
        id: 13,
        name: "Column",
        description: "Metadata column beside the items, spec-sheet style",
        load: () => import("./layouts/Column"),
    },
];

export const DEFAULT_TEMPLATE_ID = 1;

export function getTemplateEntry(id: number): TemplateEntry | undefined {
    return TEMPLATES.find((t) => t.id === id);
}
