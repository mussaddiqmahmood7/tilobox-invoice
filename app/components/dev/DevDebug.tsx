"use client";

// Next

// RHF
import { useFormContext } from "react-hook-form";

// Component
import { BaseButton } from "@/app/components";

// Variables
import { FORM_FILL_VALUES } from "@/lib/variables";

/**
 * Development-only scratch panel, mounted in the navbar's middle slot.
 *
 * It used to link to `/template/1` and `/template/2`. Those routes rendered
 * `InvoiceTemplate{id}`, files deleted in round 2 when the thirteen composable
 * layouts replaced them — so both links threw. They are gone, and so is the
 * route they pointed at.
 *
 * Laid out in a row rather than two stacked columns, which is what made it
 * overflow the navbar.
 */
const DevDebug = () => {
    const { reset, formState } = useFormContext();

    return (
        <div className="flex items-center gap-3 rounded-md border border-dashed border-destructive/60 px-3 py-1.5 text-xs">
            <span className="font-semibold uppercase tracking-wider text-destructive">
                Dev
            </span>

            <span className="whitespace-nowrap text-muted-foreground">
                Form:{" "}
                <span className="font-medium text-foreground">
                    {formState.isDirty ? "Dirty" : "Clean"}
                </span>
            </span>

            <BaseButton
                tooltipLabel="Form Test Fill"
                variant="outline"
                size="sm"
                className="h-7 whitespace-nowrap"
                onClick={() => reset(FORM_FILL_VALUES)}
            >
                Fill in the form
            </BaseButton>
        </div>
    );
};

export default DevDebug;
