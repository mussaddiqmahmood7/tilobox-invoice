"use client";

import React from "react";

// ShadCn
import { Button, ButtonProps } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { Loader2 } from "lucide-react";

type BaseButtonProps = {
    tooltipLabel?: string;
    type?: "button" | "submit" | "reset";
    loading?: boolean;
    loadingText?: string;
    children?: React.ReactNode;
} & ButtonProps;

const BaseButton = ({
    tooltipLabel,
    type = "button",
    loading,
    loadingText = "Loading",
    children,
    className,
    disabled,
    ...props
}: BaseButtonProps) => {
    /*
     * `className` is merged rather than spread over the base classes — with a
     * plain `{...props}` spread a caller-supplied className replaced
     * "flex gap-2" outright and collapsed the icon spacing.
     */
    const button = (
        <Button
            type={type}
            className={cn("flex items-center gap-2", className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </Button>
    );

    if (!tooltipLabel) return button;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipLabel}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default BaseButton;
