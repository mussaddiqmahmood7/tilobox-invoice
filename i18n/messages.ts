import type { AbstractIntlMessages } from "next-intl";

import enMessages from "@/i18n/locales/en.json";
import { DEFAULT_LOCALE } from "@/lib/variables";

/**
 * Deep-merges `override` onto `base`, returning a new object.
 *
 * Only plain objects recurse; every other value (including arrays) is replaced
 * wholesale. Empty strings in a translation are treated as "not translated" so
 * they fall through to the base rather than rendering as blank UI.
 */
function deepMerge(
    base: AbstractIntlMessages,
    override: AbstractIntlMessages
): AbstractIntlMessages {
    const result: AbstractIntlMessages = { ...base };

    for (const key of Object.keys(override)) {
        const overrideValue = override[key];
        const baseValue = result[key];

        if (
            typeof overrideValue === "object" &&
            overrideValue !== null &&
            typeof baseValue === "object" &&
            baseValue !== null
        ) {
            result[key] = deepMerge(baseValue, overrideValue);
        } else if (overrideValue !== undefined && overrideValue !== "") {
            result[key] = overrideValue;
        }
    }

    return result;
}

/**
 * Loads a locale's messages layered over English.
 *
 * The 16 translation files drift from `en.json` as strings are added, and
 * next-intl renders an error for a missing key rather than falling back. This
 * keeps an untranslated key rendering readable English instead of breaking the
 * page, so new copy can ship before every locale is caught up.
 */
export async function getMessages(
    locale: string
): Promise<AbstractIntlMessages> {
    const base = enMessages as AbstractIntlMessages;

    if (locale === DEFAULT_LOCALE) {
        return base;
    }

    const localeMessages = (await import(`@/i18n/locales/${locale}.json`))
        .default as AbstractIntlMessages;

    return deepMerge(base, localeMessages);
}
