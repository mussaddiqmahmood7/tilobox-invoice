"use client";

import { useState } from "react";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Utils
import { cn } from "@/lib/utils";

// Styles
import { fieldControl, fieldLabel, fieldRow } from "./fieldStyles";

// Variables
import { DATE_OPTIONS } from "@/lib/variables";

// Icons
import { CalendarIcon } from "lucide-react";

// Types
import { NameType } from "@/types";

type DatePickerFormFieldProps = {
    name: NameType;
    label?: string;
};

const DatePickerFormField = ({ name, label }: DatePickerFormFieldProps) => {
    const { control } = useFormContext();

    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    return (
        <>
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                    <FormItem>
                        <div className={fieldRow}>
                            <FormLabel className={fieldLabel}>
                                {label}:
                            </FormLabel>
                            <div className={fieldControl}>
                                <Popover
                                    open={isPopoverOpen}
                                    onOpenChange={setIsPopoverOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start font-normal",
                                                    !field.value &&
                                                        "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="me-2 h-4 w-4" />
                                                {field.value ? (
                                                    new Date(
                                                        field.value
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        DATE_OPTIONS
                                                    )
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    {/* `align="start"` keeps the calendar from
                                        clipping off a narrow viewport */}
                                    <PopoverContent
                                        className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            captionLayout="dropdown-buttons"
                                            defaultMonth={field.value}
                                            selected={new Date(field.value)}
                                            onSelect={(e) => {
                                                field.onChange(e);
                                                setIsPopoverOpen(false);
                                            }}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            fromYear={1960}
                                            toYear={
                                                new Date().getFullYear() + 30
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </div>
                        </div>
                    </FormItem>
                )}
            />
        </>
    );
};

export default DatePickerFormField;
