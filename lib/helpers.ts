// Next
import { NextResponse } from "next/server";

// Utils
import numberToWords from "number-to-words";

// Currencies
import currenciesDetails from "@/public/assets/data/currencies.json";
import { CurrencyDetails } from "@/types";

// Variables
import { DATE_OPTIONS } from "@/lib/variables";

/**
 * Formats a number with commas and decimal places
 *
 * @param {number} number - Number to format
 * @returns {string} A styled number to be displayed on the invoice
 */
const formatNumberWithCommas = (number: number) => {
    return number.toLocaleString("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

/**
 * @param {string} currency - The currency that is currently selected 
 * @returns {Object} - An object containing the currency details as
 * ```
 * {
    "currency": "United Arab Emirates Dirham",
    "decimals": 2,
    "beforeDecimal": "Dirham",
    "afterDecimal": "Fils"
 }
 */
 const fetchCurrencyDetails = (currency: string): CurrencyDetails | null => {
    const data = currenciesDetails as Record<string, CurrencyDetails>;
    const currencyDetails = data[currency];
    return currencyDetails || null;
};


/**
 * Turns a number into words for invoices
 *
 * @param {number} price - Number to format
 * @returns {string} Number in words
 */
const formatPriceToString = (price: number, currency: string): string => {
    // Initialize variables
    let decimals : number;
    let beforeDecimal: string | null = null;
    let afterDecimal: string | null = null;
    
    const currencyDetails = fetchCurrencyDetails(currency);

    // If currencyDetails is available, use its values, else dynamically set decimals
    if (currencyDetails) {
        decimals = currencyDetails.decimals;
        beforeDecimal = currencyDetails.beforeDecimal;
        afterDecimal = currencyDetails.afterDecimal;
    } else {
        // Dynamically get decimals from the price if currencyDetails is null
        const priceString = price.toString();
        const decimalIndex = priceString.indexOf('.');
        decimals = decimalIndex !== -1 ? priceString.split('.')[1].length : 0;
    }

    // Ensure the price is rounded to the appropriate decimal places
    const roundedPrice = parseFloat(price.toFixed(decimals));

    // Split the price into integer and fractional parts
    const integerPart = Math.floor(roundedPrice);
    
    const fractionalMultiplier = Math.pow(10, decimals);
    const fractionalPart = Math.round((roundedPrice - integerPart) * fractionalMultiplier);

    // Convert the integer part to words with a capitalized first letter
    const integerPartInWords = numberToWords
        .toWords(integerPart)
        .replace(/^\w/, (c) => c.toUpperCase());

    // Convert fractional part to words
    const fractionalPartInWords =
        fractionalPart > 0
            ? numberToWords.toWords(fractionalPart)
            : null;

    // Handle zero values for both parts
    if (integerPart === 0 && fractionalPart === 0) {
        return "Zero";
    }

    // Combine the parts into the final string
    let result = integerPartInWords;

    // Check if beforeDecimal is not null 
    if (beforeDecimal !== null) {
        result += ` ${beforeDecimal}`;
    }

    if (fractionalPartInWords) {
        // Check if afterDecimal is not null
        if (afterDecimal !== null) {
            // Concatenate the after decimal and fractional part
            result += ` and ${fractionalPartInWords} ${afterDecimal}`;
        } else {
            // If afterDecimal is null, concatenate the fractional part
            result += ` point ${fractionalPartInWords}`;
        }
    }

    return result;
};

/**
 * This method flattens a nested object. It is used for xlsx export
 *
 * @param {Record<string, T>} obj - A nested object to flatten
 * @param {string} parentKey - The parent key
 * @returns {Record<string, T>} A flattened object
 */
const flattenObject = <T>(
    obj: Record<string, T>,
    parentKey = ""
): Record<string, T> => {
    const result: Record<string, T> = {};

    for (const key in obj) {
        if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
            const flattened = flattenObject(
                obj[key] as Record<string, T>,
                parentKey + key + "_"
            );
            for (const subKey in flattened) {
                result[parentKey + subKey] = flattened[subKey];
            }
        } else {
            result[parentKey + key] = obj[key];
        }
    }

    return result;
};

/**
 * A method to validate an email address
 *
 * @param {string} email - Email to validate
 * @returns {boolean} A boolean indicating if the email is valid
 */
const isValidEmail = (email: string) => {
    // Regular expression for a simple email pattern
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
};

/**
 * A method to check if a string is a data URL
 *
 * @param {string} str - String to check
 * @returns {boolean} Boolean indicating if the string is a data URL
 */
const isDataUrl = (str: string) => str.startsWith("data:");

/**
 * Retrieves an invoice template component by id.
 *
 * Reads the registry rather than interpolating the id into a module path. The
 * old `import(`...InvoiceTemplate${id}`)` form failed at import time for an
 * unknown id and silently returned null, and offered no way to enumerate the
 * templates for a picker.
 *
 * @param {number} templateId - The ID of the invoice template.
 * @returns A promise resolving to the template component, or null if unknown.
 */
const getInvoiceTemplate = async (templateId: number) => {
    const { getTemplateEntry } = await import(
        "@/app/components/templates/invoice-pdf/registry"
    );

    const entry = getTemplateEntry(templateId);
    if (!entry) {
        console.error(`Unknown invoice template id: ${templateId}`);
        return null;
    }

    try {
        const templateModule = await entry.load();
        return templateModule.default;
    } catch (err) {
        console.error(`Error importing template ${entry.name}: ${err}`);
        return null;
    }
};

/**
 * Convert a file to a buffer. Used for sending invoice as email attachment.
 * @param {File} file - The file to convert to a buffer.
 * @returns {Promise<Buffer>} A promise that resolves to a buffer.
 */
const fileToBuffer = async (file: File) => {
    // Convert Blob to ArrayBuffer
    const arrayBuffer = await new NextResponse(file).arrayBuffer();

    // Convert ArrayBuffer to Buffer
    const pdfBuffer = Buffer.from(arrayBuffer);

    return pdfBuffer;
};

/**
 * Formats a date for display, tolerating the empty/invalid values the form
 * starts with.
 *
 * FORM_DEFAULT_VALUES seeds invoiceDate/dueDate as "", and the templates called
 * `new Date(details.invoiceDate).toLocaleDateString(...)` directly, so a blank
 * form rendered the literal text "Invalid Date" in the live preview.
 *
 * @param {string | Date | undefined} value - The date to format
 * @param {string} fallback - Shown when the value is missing or unparseable
 * @returns {string} The formatted date, or the fallback
 */
/**
 * Azerbaijani month names, written out.
 *
 * Chromium's bundled ICU has no date data for `az`: Intl there returns
 * "2026 M01 15" rather than "15 yanvar 2026". That matters more than it
 * sounds, because Chromium is what renders the PDF — so an Azerbaijani invoice
 * would have carried a placeholder where its date should be. Node has full ICU
 * and formats it correctly, which is exactly why this only shows up in the
 * output and not in any server-side check.
 *
 * Twelve strings is a smaller price than either shipping that or making the
 * PDF depend on a particular ICU build.
 */
const AZ_MONTHS = [
    "yanvar",
    "fevral",
    "mart",
    "aprel",
    "may",
    "iyun",
    "iyul",
    "avqust",
    "sentyabr",
    "oktyabr",
    "noyabr",
    "dekabr",
];

const formatAzerbaijaniDate = (date: Date): string =>
    `${date.getDate()} ${AZ_MONTHS[date.getMonth()]} ${date.getFullYear()}`;

const formatDate = (
    value: string | Date | undefined | null,
    locale = "en-US",
    fallback = "—"
): string => {
    if (!value) return fallback;

    /*
     * The value arriving here is normally the en-US string the schema
     * transform produces, which is why it is re-parsed rather than used as-is:
     * a German invoice showed "January 15, 2026" because the date had already
     * been rendered in English before the template ever saw it.
     *
     * Keeping the stored form en-US is deliberate — it is the wire format, and
     * it is the one string Date can be relied on to parse back. Only the
     * display is localised.
     */
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;

    if (locale.startsWith("az")) return formatAzerbaijaniDate(date);

    try {
        return date.toLocaleDateString(locale, DATE_OPTIONS);
    } catch {
        return date.toLocaleDateString("en-US", DATE_OPTIONS);
    }
};


export {
    formatNumberWithCommas,
    formatDate,
    formatPriceToString,
    flattenObject,
    isValidEmail,
    isDataUrl,
    getInvoiceTemplate,
    fileToBuffer,
};
