"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Components
import { BaseButton } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";
import useToasts from "@/hooks/useToasts";

// Store
import {
    deleteParty,
    readParties,
    saveParty,
    type PartyKind,
    type SavedParty,
} from "@/lib/partyStore";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { Building2, Check, Contact, Trash2, UserPlus } from "lucide-react";

// Types
import type { InvoiceType } from "@/types";

/**
 * Save and reuse either party on the invoice.
 *
 * The single biggest time-saver for anyone who invoices the same people:
 * without it, every repeat invoice means retyping seven address fields
 * verbatim. That applies just as much to the "Bill From" side — your own
 * details are the ones you retype on *every* invoice, not just repeat ones —
 * which is why this is no longer receiver-only.
 *
 * It also squares the two columns up. With a picker on one side only, Bill To's
 * fields started ~84px below Bill From's, and the two halves of a side-by-side
 * step read as misaligned.
 *
 * Stored in the browser alongside the saved invoices — see lib/partyStore.ts
 */
const PartyPicker = ({ kind }: { kind: PartyKind }) => {
    const { getValues, setValue, watch } = useFormContext<InvoiceType>();
    const { _t } = useTranslationContext();
    const { partySaved, partyRemoved } = useToasts();

    const [parties, setParties] = useState<SavedParty[]>([]);
    const [open, setOpen] = useState(false);

    /*
     * Read on mount rather than during render: storage is not available on the
     * server, and reading it while rendering would make the first client render
     * disagree with the prerendered HTML. It is also async now — the entries
     * are encrypted at rest — so the guard stops a late resolve writing into an
     * unmounted component.
     */
    useEffect(() => {
        let active = true;
        readParties(kind).then((saved) => {
            if (active) setParties(saved);
        });
        return () => {
            active = false;
        };
    }, [kind]);

    /*
     * One message namespace per side, so "Save client" and "Save sender" are
     * separately translatable rather than one string doing double duty and
     * reading wrong on at least one of them.
     */
    const ns = kind === "sender" ? "senders" : "clients";
    const label = useCallback(
        (key: string) => _t(`${ns}.${key}`),
        [_t, ns]
    );

    const currentName = watch(`${kind}.name` as "receiver.name");
    const canSave = Boolean(currentName?.trim());

    const isSaved = useMemo(
        () =>
            parties.some(
                (party) =>
                    party.name.trim().toLowerCase() ===
                    currentName?.trim().toLowerCase()
            ),
        [parties, currentName]
    );

    const handleSave = useCallback(async () => {
        const party = getValues(kind);
        setParties(await saveParty(kind, party));
        partySaved(kind, party.name);
    }, [getValues, kind, partySaved]);

    const handlePick = useCallback(
        (party: SavedParty) => {
            setOpen(false);
            /*
             * `id` is ours, not a form field — spreading it into the form would
             * put an unknown key into the invoice and fail schema validation on
             * the way to the PDF.
             */
            const { id: _id, ...fields } = party;
            setValue(kind, fields, {
                shouldDirty: true,
                shouldValidate: true,
            });
        },
        [setValue, kind]
    );

    const handleDelete = useCallback(
        async (event: React.MouseEvent, party: SavedParty) => {
            // The row itself selects the party; the bin must not do both.
            event.stopPropagation();
            setParties(await deleteParty(kind, party.id));
            partyRemoved(kind, party.name);
        },
        [kind, partyRemoved]
    );

    // A building for "who is billing", a contact card for "who is billed".
    const PickIcon = kind === "sender" ? Building2 : Contact;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <BaseButton
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={parties.length === 0}
                        tooltipLabel={
                            parties.length === 0
                                ? label("emptyTooltip")
                                : label("pickTooltip")
                        }
                    >
                        <PickIcon className="h-4 w-4" />
                        {label("pick")}
                        {parties.length > 0 && (
                            <span className="text-muted-foreground">
                                ({parties.length})
                            </span>
                        )}
                    </BaseButton>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-72 p-1.5">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {label("heading")}
                    </p>

                    <div className="max-h-[50vh] overflow-y-auto">
                        {parties.map((party) => (
                            <div
                                key={party.id}
                                className="group flex items-center gap-1 rounded-md hover:bg-muted"
                            >
                                <button
                                    type="button"
                                    onClick={() => handlePick(party)}
                                    className="min-w-0 flex-1 px-2 py-1.5 text-start"
                                >
                                    <span className="block truncate text-sm font-medium">
                                        {party.name}
                                    </span>
                                    {(party.city || party.country) && (
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {[party.city, party.country]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </span>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={(event) =>
                                        void handleDelete(event, party)
                                    }
                                    aria-label={`${label("remove")} ${party.name}`}
                                    className={cn(
                                        "me-1 rounded p-1.5 text-muted-foreground transition-colors",
                                        "hover:bg-destructive/10 hover:text-destructive"
                                    )}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <BaseButton
                variant="ghost"
                size="sm"
                className="h-8"
                disabled={!canSave}
                onClick={() => void handleSave()}
                tooltipLabel={label("saveTooltip")}
            >
                <UserPlus className="h-4 w-4" />
                {label("save")}
            </BaseButton>

            {isSaved && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-success" />
                    {label("saved")}
                </span>
            )}
        </div>
    );
};

export default PartyPicker;
