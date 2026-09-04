import { readSecure, writeSecure } from "@/lib/secureStore";

import type { InvoiceType } from "@/types";

/**
 * Saved parties — the people at each end of an invoice — kept in the browser.
 *
 * This started as a receiver-only address book ("clients"). It is now keyed by
 * which end of the invoice the entry belongs to, because "Bill From" needs the
 * same thing: anyone invoicing from more than one entity, or simply on a second
 * device, retypes seven fields to identify themselves.
 *
 * Same place and same shape of storage as the saved invoices this app already
 * keeps — nothing is sent to a server, because there is no account to send it
 * to. Isolated here as plain functions so both pickers read one
 * implementation, and so the parsing stays defensive: this is user data that
 * may have been written by an older version of the app, or edited by hand in
 * devtools.
 *
 * Encrypted at rest through lib/secureStore, which is why every function here
 * is async. An address book is names, postal addresses, emails and phone
 * numbers; see that module for exactly what the encryption does and does not
 * protect.
 */

/** Which end of the invoice an entry belongs to. */
export type PartyKind = "sender" | "receiver";

/**
 * The receiver key is unchanged from when this was clients-only, so address
 * books saved by an earlier version are still found.
 */
const STORAGE_KEYS: Record<PartyKind, string> = {
    receiver: "invoify:clients",
    sender: "invoify:senders",
};

export const partyStorageKey = (kind: PartyKind) => STORAGE_KEYS[kind];

/** Sender and receiver carry the same fields; one shape serves both. */
export type SavedParty = InvoiceType["receiver"] & {
    /** Stable id, so renaming a party does not orphan it. */
    id: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

/** Accepts only entries that have the shape we can actually render. */
function normalise(entry: unknown): SavedParty | null {
    if (!isRecord(entry)) return null;
    const name = entry.name;
    if (typeof name !== "string" || name.trim().length === 0) return null;

    const str = (key: string) =>
        typeof entry[key] === "string" ? (entry[key] as string) : "";

    return {
        id:
            typeof entry.id === "string" && entry.id
                ? entry.id
                : crypto.randomUUID(),
        name,
        address: str("address"),
        zipCode: str("zipCode"),
        city: str("city"),
        country: str("country"),
        email: str("email"),
        phone: str("phone"),
        customInputs: Array.isArray(entry.customInputs)
            ? (entry.customInputs as SavedParty["customInputs"])
            : [],
    };
}

export async function readParties(kind: PartyKind): Promise<SavedParty[]> {
    const parsed = await readSecure<unknown>(STORAGE_KEYS[kind]);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalise).filter((p): p is SavedParty => p !== null);
}

async function writeParties(
    kind: PartyKind,
    parties: SavedParty[]
): Promise<SavedParty[]> {
    // A false result means quota, disabled storage, or no usable key. The
    // address book is a convenience; losing a write must not interrupt the
    // invoice being worked on, so the caller gets the list either way.
    await writeSecure(STORAGE_KEYS[kind], parties);
    return parties;
}

/**
 * Saves a party, replacing any existing entry with the same name.
 *
 * Matching on name rather than always appending, because the realistic mistake
 * is invoicing the same client twice and ending up with two near-identical
 * rows in the picker.
 */
export async function saveParty(
    kind: PartyKind,
    party: InvoiceType["receiver"] | InvoiceType["sender"]
): Promise<SavedParty[]> {
    const candidate = normalise({ ...party, id: undefined });
    if (!candidate) return readParties(kind);

    const existing = await readParties(kind);
    const index = existing.findIndex(
        (entry) =>
            entry.name.trim().toLowerCase() ===
            candidate.name.trim().toLowerCase()
    );

    if (index === -1) {
        return writeParties(kind, [...existing, candidate]);
    }

    const merged = [...existing];
    merged[index] = { ...candidate, id: existing[index].id };
    return writeParties(kind, merged);
}

export async function deleteParty(
    kind: PartyKind,
    id: string
): Promise<SavedParty[]> {
    const remaining = (await readParties(kind)).filter(
        (entry) => entry.id !== id
    );
    return writeParties(kind, remaining);
}
