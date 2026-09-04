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
import { Textarea, TextareaProps } from "@/components/ui/textarea";

// Utils
import { cn } from "@/lib/utils";

type FormTextareaProps = {
    name: string;
    label?: string;
    labelHelper?: string;
    placeholder?: string;
} & TextareaProps;

const FormTextarea = ({
    name,
    label,
    labelHelper,
    placeholder,
    className,
    ...props
}: FormTextareaProps) => {
    const { control } = useFormContext();
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="w-full min-w-0">
                    {label && <FormLabel>{`${label}:`}</FormLabel>}
                    {labelHelper && (
                        <span className="text-xs"> {labelHelper}</span>
                    )}
                    <FormControl>
                        {/* `h-0` was collapsing the field; height now comes
                            from `rows` and the min-height below. */}
                        <Textarea
                            {...field}
                            rows={4}
                            placeholder={placeholder}
                            className={cn(
                                "min-h-[6rem] w-full resize-y @xl:max-w-[20rem]",
                                className
                            )}
                            {...props}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

export default FormTextarea;
