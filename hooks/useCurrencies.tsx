import { useCallback, useEffect, useState } from "react";

// Variables
import { CURRENCIES_API } from "@/lib/variables";

// Type
import { CurrencyType } from "@/types";

const CURRENCIES_STORAGE_KEY = "tilobox_cached_currencies";

/** Standard top currencies for instant offline availability before first network sync */
const FALLBACK_OFFLINE_CURRENCIES: CurrencyType[] = [
    { code: "USD", name: "United States Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British Pound Sterling" },
    { code: "CAD", name: "Canadian Dollar" },
    { code: "AUD", name: "Australian Dollar" },
    { code: "JPY", name: "Japanese Yen" },
    { code: "CNY", name: "Chinese Yuan" },
    { code: "INR", name: "Indian Rupee" },
    { code: "PKR", name: "Pakistani Rupee" },
    { code: "AED", name: "United Arab Emirates Dirham" },
    { code: "SAR", name: "Saudi Riyal" },
    { code: "SGD", name: "Singapore Dollar" },
    { code: "CHF", name: "Swiss Franc" },
    { code: "NZD", name: "New Zealand Dollar" },
    { code: "BRL", name: "Brazilian Real" },
    { code: "ZAR", name: "South African Rand" },
];

/** In-memory cache across mounts */
let currenciesCache: CurrencyType[] | null = null;

function loadStoredCurrencies(): CurrencyType[] | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(CURRENCIES_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {}
    return null;
}

const useCurrencies = () => {
    const [currencies, setCurrencies] = useState<CurrencyType[]>(() => {
        if (currenciesCache) return currenciesCache;
        const stored = loadStoredCurrencies();
        if (stored) {
            currenciesCache = stored;
            return stored;
        }
        return FALLBACK_OFFLINE_CURRENCIES;
    });

    const [currenciesLoading, setCurrenciesLoading] = useState<boolean>(false);
    const [currenciesError, setCurrenciesError] = useState<boolean>(false);

    /**
     * Fetches all the currencies asynchronously from remote and updates local cache.
     */
    const fetchCurrencies = useCallback(async () => {
        setCurrenciesLoading(true);
        setCurrenciesError(false);

        try {
            const response = await fetch(`${CURRENCIES_API}`);

            if (!response.ok) {
                throw new Error(`Failed to load currencies (${response.status})`);
            }

            const data = await response.json();

            const currencyOptions: CurrencyType[] = Object.keys(data).map((currencyCode) => ({
                code: currencyCode,
                name: data[currencyCode],
            }));

            if (currencyOptions.length > 0) {
                currenciesCache = currencyOptions;
                setCurrencies(currencyOptions);

                if (typeof window !== "undefined") {
                    try {
                        localStorage.setItem(CURRENCIES_STORAGE_KEY, JSON.stringify(currencyOptions));
                    } catch {}
                }
            }
        } catch (err) {
            console.warn("[Currencies] Offline or failed to fetch remote currencies, using local cache:", err);
            // If we already have stored or fallback currencies, do not show fatal error to user
            const stored = loadStoredCurrencies();
            if (stored && stored.length > 0) {
                setCurrencies(stored);
            } else {
                setCurrencies(FALLBACK_OFFLINE_CURRENCIES);
            }
        } finally {
            setCurrenciesLoading(false);
        }
    }, []);

    useEffect(() => {
        // Fetch latest currencies if we don't have fresh memory cache or if online
        if (!currenciesCache || currenciesCache === FALLBACK_OFFLINE_CURRENCIES) {
            fetchCurrencies();
        }

        // Auto re-sync latest currencies when internet gets back
        const handleOnline = () => {
            fetchCurrencies();
        };

        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("online", handleOnline);
        };
    }, [fetchCurrencies]);

    return {
        currencies,
        currenciesLoading,
        currenciesError,
        retryFetchCurrencies: fetchCurrencies,
    };
};

export default useCurrencies;
