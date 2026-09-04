"use client";

import { useEffect, useState } from "react";

// Contexts
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { Check, Loader2 } from "lucide-react";

/**
 * Says whether your work is safe.
 *
 * Drafts have always been written to localStorage, silently — so a user had no
 * way to know their invoice would survive a closed tab, and no reason to trust
 * that it would. R3-1 turned that write into an explicit, debounced flush with
 * observable state; this surfaces it.
 */
const AutosaveIndicator = () => {
    const { draftSavedAt, draftPending } = useInvoiceContext();
    const { _t } = useTranslationContext();

    /*
     * Re-render on a slow tick so "just now" becomes "2 minutes ago" without a
     * render on every keystroke. Only runs while there is something to show.
     */
    const [, setNow] = useState(0);
    useEffect(() => {
        if (!draftSavedAt) return;
        const id = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(id);
    }, [draftSavedAt]);

    if (draftPending) {
        return (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {_t("form.autosave.saving")}
            </span>
        );
    }

    if (!draftSavedAt) return null;

    const secondsAgo = Math.max(0, Math.round((Date.now() - draftSavedAt) / 1000));
    const when =
        secondsAgo < 60
            ? _t("form.autosave.justNow")
            : `${Math.floor(secondsAgo / 60)}m`;

    return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="h-3 w-3 text-success" />
            {_t("form.autosave.saved")} · {when}
        </span>
    );
};

export default AutosaveIndicator;
