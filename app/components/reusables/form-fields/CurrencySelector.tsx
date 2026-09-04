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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Hooks
import useCurrencies from "@/hooks/useCurrencies";

// Styles
import { fieldControl, fieldLabel, fieldRow } from "./fieldStyles";

// Types
import { CurrencyType, NameType } from "@/types";

type CurrencySelectorProps = {
    name: NameType;
    label?: string;
    placeholder?: string;
};

const CurrencySelector = ({
    name,
    label,
    placeholder,
}: CurrencySelectorProps) => {
    const { control } = useFormContext();

    const {
        currencies,
        currenciesLoading,
        currenciesError,
        retryFetchCurrencies,
    } = useCurrencies();

    return (
        <div>
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
                                <Select
                                    {...field}
                                    defaultValue={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue
                                                placeholder={placeholder}
                                            />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent
                                        style={{
                                            overflowY: "hidden",
                                            height: "200px",
                                        }}
                                    >
                                        <SelectGroup>
                                            <SelectLabel>
                                                Currencies
                                            </SelectLabel>

                                            {currenciesLoading && (
                                                <p className="px-2 py-3 text-sm text-muted-foreground">
                                                    Loading currencies…
                                                </p>
                                            )}

                                            {/* Previously a silent empty list */}
                                            {currenciesError &&
                                                !currenciesLoading && (
                                                    <div className="px-2 py-3">
                                                        <p className="mb-2 text-sm text-muted-foreground">
                                                            Could not load
                                                            currencies.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                retryFetchCurrencies
                                                            }
                                                            className="text-sm font-medium text-primary underline underline-offset-4"
                                                        >
                                                            Retry
                                                        </button>
                                                    </div>
                                                )}

                                            {!currenciesLoading &&
                                                currencies.map(
                                                    (
                                                        currency: CurrencyType,
                                                        idx: number
                                                    ) => (
                                                        <SelectItem
                                                            key={idx}
                                                            value={
                                                                currency.code
                                                            }
                                                        >
                                                            {currency.name}{" "}
                                                            {`(${currency.code})`}
                                                        </SelectItem>
                                                    )
                                                )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </div>
                        </div>
                    </FormItem>
                )}
            />
        </div>
    );
};

export default CurrencySelector;
