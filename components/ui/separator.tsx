import * as React from "react";

import { cn } from "@/lib/utils";

type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
    /** Purely visual separators should stay hidden from assistive tech. */
    decorative?: boolean;
};

/**
 * Minimal separator. Not built on @radix-ui/react-separator — the primitive
 * only sets the role/aria-orientation handled inline below.
 */
const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
    (
        { className, orientation = "horizontal", decorative = true, ...props },
        ref
    ) => (
        <div
            ref={ref}
            role={decorative ? "none" : "separator"}
            aria-orientation={
                decorative || orientation === "horizontal"
                    ? undefined
                    : "vertical"
            }
            className={cn(
                "shrink-0 bg-border",
                orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
                className
            )}
            {...props}
        />
    )
);
Separator.displayName = "Separator";

export { Separator };
