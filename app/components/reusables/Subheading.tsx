import React from "react";

// Utils
import { cn } from "@/lib/utils";

type SubheadingProps = {
    children: React.ReactNode;
    className?: string;
};

/**
 * Section heading inside the form.
 *
 * Deliberately small and quiet: with the surrounding cards removed, these
 * headings plus the hairline rules are what give the form its structure, so
 * they need to read as labels rather than compete as titles.
 */
export default function Subheading({ children, className }: SubheadingProps) {
    return (
        <h2
            className={cn(
                "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                className
            )}
        >
            {children}
        </h2>
    );
}
