"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
    /** Completion percentage, 0-100. Values outside the range are clamped. */
    value?: number;
    indicatorClassName?: string;
};

/**
 * Minimal determinate progress bar.
 *
 * Deliberately not built on @radix-ui/react-progress — the primitive adds a
 * dependency for behaviour this doesn't need. The ARIA attributes below are
 * what Radix would provide.
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value = 0, indicatorClassName, ...props }, ref) => {
        const clamped = Math.min(100, Math.max(0, value));

        return (
            <div
                ref={ref}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={clamped}
                className={cn(
                    "relative h-1.5 w-full overflow-hidden rounded-full bg-muted",
                    className
                )}
                {...props}
            >
                <div
                    className={cn(
                        "h-full rounded-full bg-primary transition-all duration-300 ease-out",
                        indicatorClassName
                    )}
                    style={{ width: `${clamped}%` }}
                />
            </div>
        );
    }
);
Progress.displayName = "Progress";

export { Progress };
