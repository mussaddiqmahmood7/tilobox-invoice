"use client";

import { useState, useTransition } from "react";
import { useParams } from "next/navigation";

// Next Intl
// This useRouter/usePathname pair is wrapped with next-intl's locale handling
import { usePathname, useRouter } from "@/i18n/navigation";

// ShadCn
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { Check, Globe, Loader2 } from "lucide-react";

// Variables
import { LOCALES } from "@/lib/variables";

type LanguageSelectorProps = {
    /**
     * `pill` is the compact navbar trigger: a globe and the locale code.
     * `block` is the full-width row used inside the mobile settings sheet,
     * where there is room for the language's own name.
     */
    variant?: "pill" | "block";
};

/**
 * Language switcher.
 *
 * Was a 10rem-wide `Select` with a BETA badge absolutely positioned so that it
 * hung outside the trigger's own bounds. It is now a pill sized to its content
 * — a globe and the two-letter code — which is what the navbar mockup calls
 * for and what leaves the invoice the widest thing on the page. The BETA badge
 * moved into the popover header, where it labels the whole translation set
 * rather than overlapping a control.
 */
const LanguageSelector = ({ variant = "pill" }: LanguageSelectorProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();

    const [open, setOpen] = useState(false);

    /*
     * Changing language is a server navigation: the whole tree is refetched
     * with a new message bundle. Without a transition there is no signal at
     * all that anything is happening — you click Deutsch on a half-filled
     * invoice and the page simply sits there until the payload lands.
     *
     * `pendingLocale` is tracked separately from `isPending` so the spinner
     * can appear on the row you actually chose, not merely somewhere.
     */
    const [isPending, startTransition] = useTransition();
    const [pendingLocale, setPendingLocale] = useState<string | null>(null);

    const current = String(params.locale ?? "");
    const active = LOCALES.find((locale) => locale.code === current);

    const handleLanguageChange = (lang: string) => {
        if (lang === current) {
            setOpen(false);
            return;
        }

        setPendingLocale(lang);
        startTransition(() => {
            /*
             * Switching language keeps you on the page you were on. The
             * previous version always pushed "/", so changing language from
             * anywhere threw away where you were.
             */
            router.replace(pathname, { locale: lang });
        });
    };

    // Close only once the navigation has landed, so the popover keeps showing
    // which language is loading instead of vanishing into a frozen page.
    if (!isPending && pendingLocale && pendingLocale === current) {
        setPendingLocale(null);
        setOpen(false);
    }

    return (
        <>
            {/*
             * A bar under the navbar for the whole duration. The spinner in the
             * trigger is easy to miss when your eye is on the invoice; a rule
             * across the top of the window is not.
             */}
            {isPending && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-x-0 top-16 z-[60] h-0.5 overflow-hidden bg-primary/15"
                >
                    <span className="block h-full w-1/4 animate-indeterminate bg-primary motion-reduce:w-full motion-reduce:animate-none" />
                </span>
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        aria-label="Languages"
                        aria-busy={isPending}
                        disabled={isPending}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground",
                            "disabled:opacity-70",
                            variant === "pill"
                                ? "h-9 px-3"
                                : "h-10 w-full justify-between px-3"
                        )}
                    >
                        <span className="flex items-center gap-1.5">
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Globe className="h-4 w-4" />
                            )}
                            {variant === "pill" ? (
                                <span className="font-medium uppercase">
                                    {pendingLocale ?? current}
                                </span>
                            ) : (
                                <span className="font-medium">
                                    {active?.name ?? current}
                                </span>
                            )}
                        </span>
                    </button>
                </PopoverTrigger>

                <PopoverContent align="end" className="w-56 p-1.5">
                    <div className="mb-1 flex items-center justify-between px-2 py-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Languages
                        </span>
                        <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[10px] font-normal leading-none"
                        >
                            BETA
                        </Badge>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {LOCALES.map((locale) => {
                            const isActive = locale.code === current;
                            const isLoading = locale.code === pendingLocale;

                            return (
                                <button
                                    key={locale.code}
                                    type="button"
                                    disabled={isPending}
                                    onClick={() =>
                                        handleLanguageChange(locale.code)
                                    }
                                    className={cn(
                                        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                                        isActive
                                            ? "bg-primary/10 font-medium text-primary"
                                            : "hover:bg-muted",
                                        isPending &&
                                            !isLoading &&
                                            "opacity-50"
                                    )}
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span className="w-7 shrink-0 text-[11px] font-semibold uppercase text-muted-foreground">
                                            {locale.code}
                                        </span>
                                        <span className="truncate">
                                            {locale.name}
                                        </span>
                                    </span>
                                    {isLoading ? (
                                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                                    ) : (
                                        isActive && (
                                            <Check className="h-3.5 w-3.5 shrink-0" />
                                        )
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        </>
    );
};

export default LanguageSelector;
