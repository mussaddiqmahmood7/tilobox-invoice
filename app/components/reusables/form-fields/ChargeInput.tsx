"use client";

import React from "react";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Components
import { BaseButton } from "@/app/components";

// Icons
import { Percent, RefreshCw } from "lucide-react";

// Types
import { NameType } from "@/types";

type ChargeInputProps = {
    label: string;
    name: NameType;
    switchAmountType: (
        type: string,
        setType: React.Dispatch<React.SetStateAction<string>>
    ) => void;
    type: string;
    setType: React.Dispatch<React.SetStateAction<string>>;
    currency: string;
};

const ChargeInput = ({
    label,
    name,
    switchAmountType,
    type,
    setType,
    currency,
}: ChargeInputProps) => {
    const { control } = useFormContext();

    return (
        <>
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 text-sm">{label}</div>

                <div className="flex shrink-0 items-center gap-1">
                    <BaseButton
                        variant="ghost"
                        size="icon"
                        aria-label="Switch between percentage and fixed amount"
                        onClick={() => switchAmountType(type, setType)}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </BaseButton>

                    <FormField
                        control={control}
                        name={name}
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between items-center text-sm">
                                    <FormControl>
                                        <Input
                                            {...field}
                                            className="w-[5.5rem] @xl:w-[7rem]"
                                            placeholder={label}
                                            type="number"
                                            min="0"
                                            max="1000000"
                                            step="0.01"
                                        />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {type == "percentage" ? <Percent /> : <div>{currency}</div>}
                </div>
            </div>
        </>
    );
};

export default ChargeInput;
