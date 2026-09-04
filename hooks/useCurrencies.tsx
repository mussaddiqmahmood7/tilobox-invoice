import { useCallback, useEffect, useState } from "react";

// Variables
import { CURRENCIES_API } from "@/lib/variables";

// Type
import { CurrencyType } from "@/types";

/** Cached across mounts — the currency list does not change within a session. */
let currenciesCache: CurrencyType[] | null = null;

const useCurrencies = () => {
    const [currencies, setCurrencies] = useState<CurrencyType[]>(
        currenciesCache ?? []
    );
    const [currenciesLoading, setCurrenciesLoading] = useState<boolean>(false);
    const [currenciesError, setCurrenciesError] = useState<boolean>(false);

    /**
     * Fetches all the currencies asynchronously.
     *
     * @return {Promise<void>} Promise that resolves when the currencies are fetched.
     */
    const fetchCurrencies = useCallback(async () => {
        setCurrenciesLoading(true);
        setCurrenciesError(false);

        try {
            const response = await fetch(`${CURRENCIES_API}`);

            if (!response.ok) {
                throw new Error(
                    `Failed to load currencies (${response.status})`
                );
            }

            const data = await response.json();

            const currencyOptions = Object.keys(data).map((currencyCode) => {
                const currencyName = data[currencyCode];
                return { code: currencyCode, name: currencyName };
            });

            currenciesCache = currencyOptions;
            setCurrencies(currencyOptions);
        } catch (err) {
            /*
             * Previously only console.log'd, leaving the dropdown silently
             * empty with no indication anything had gone wrong.
             */
            console.error("Error fetching currencies:", err);
            setCurrenciesError(true);
        } finally {
            setCurrenciesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (currenciesCache) return;
        fetchCurrencies();
    }, [fetchCurrencies]);

    return {
        currencies,
        currenciesLoading,
        currenciesError,
        retryFetchCurrencies: fetchCurrencies,
    };
};

export default useCurrencies;
