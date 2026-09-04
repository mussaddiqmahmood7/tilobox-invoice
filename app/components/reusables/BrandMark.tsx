import React from "react";
import { cn } from "@/lib/utils";

export type BrandMarkProps = {
    className?: string;
};

export default function BrandMark({ className }: BrandMarkProps) {
    return (
        <svg
            viewBox="0 0 512 512"
            aria-hidden="true"
            className={cn("shrink-0", className)}
        >
            <rect
                width="512"
                height="512"
                rx="112"
                fill="var(--brand-mark-background, #0b5fa5)"
            />
            <rect
                x="24"
                y="24"
                width="464"
                height="464"
                rx="88"
                fill="none"
                stroke="var(--brand-mark-border, #9fb2c5)"
                strokeWidth="12"
            />
            <rect
                x="40"
                y="40"
                width="432"
                height="432"
                rx="72"
                fill="none"
                stroke="var(--brand-mark-border, #9fb2c5)"
                strokeWidth="4"
                strokeOpacity="0.5"
            />
            <g fill="var(--brand-mark-accent, #ffffff)">
                <path d="M 168 152 L 376 152 L 376 184 L 344 216 L 136 216 L 136 184 Z" />
                <path d="M 224 232 L 288 232 L 288 328 L 256 360 L 224 328 Z" />
            </g>
        </svg>
    );
}

export { BrandMark };
