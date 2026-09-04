"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export type FaqItem = {
    q: string;
    a: string;
};

interface FaqAccordionProps {
    items: FaqItem[];
    className?: string;
}

export function FaqAccordion({ items, className }: FaqAccordionProps) {
    const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set([0]));

    const toggle = (index: number) => {
        setOpenIndexes((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {items.map((item, idx) => {
                const isOpen = openIndexes.has(idx);

                return (
                    <div
                        key={idx}
                        className={cn(
                            "rounded-2xl border transition-all duration-200",
                            isOpen
                                ? "border-primary/40 bg-card shadow-xs"
                                : "border-border bg-card/60 hover:border-border/80 hover:bg-card"
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => toggle(idx)}
                            aria-expanded={isOpen}
                            className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left transition-colors"
                        >
                            <span className="text-base font-semibold tracking-tight text-foreground">
                                {item.q}
                            </span>
                            <span
                                className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground transition-transform duration-300",
                                    isOpen && "rotate-180 border-primary/30 bg-primary/10 text-primary"
                                )}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </span>
                        </button>

                        <div
                            className={cn(
                                "grid transition-all duration-300 ease-in-out",
                                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                            )}
                        >
                            <div className="overflow-hidden">
                                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                                    {item.a}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
