"use client";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input, InputProps } from "@/components/ui/input";

// Utils
import { cn } from "@/lib/utils";

// Styles
import { fieldControl, fieldLabel, fieldRow } from "./fieldStyles";


type FormInputProps = {
    name: string;
    label?: string;
    labelHelper?: string;
    placeholder?: string;
    vertical?: boolean;
} & InputProps;

const FormInput = ({
    name,
    label,
    labelHelper,
    placeholder,
    vertical = false,
    className,
    ...props
}: FormInputProps) => {
    const { control } = useFormContext();

    const verticalInput = (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                // Fills its container; the parent grid/flex cell owns the
                // width rather than a hardcoded one here.
                <FormItem className="w-full min-w-0">
                    {label && <FormLabel>{`${label}:`}</FormLabel>}

                    {labelHelper && (
                        <span className="text-xs"> {labelHelper}</span>
                    )}

                    <FormControl>
                        <Input
                            {...field}
                            placeholder={placeholder}
                            className={cn("w-full", className)}
                            {...props}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );

    const horizontalInput = (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <div className={fieldRow}>
                        {label && (
                            <FormLabel
                                className={fieldLabel}
                            >{`${label}:`}</FormLabel>
                        )}
                        {labelHelper && (
                            <span className="text-xs"> {labelHelper}</span>
                        )}

                        <div className={fieldControl}>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder={placeholder}
                                    className={cn("w-full", className)}
                                    {...props}
                                />
                            </FormControl>
                            <FormMessage />
                        </div>
                    </div>
                </FormItem>
            )}
        />
    );
    return vertical ? verticalInput : horizontalInput;
};

export default FormInput;
