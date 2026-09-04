"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe media query hook.
 *
 * Uses `useSyncExternalStore` so the server snapshot is always `false` and the
 * first client render matches it, then corrects on the effect tick. Reading
 * `window.matchMedia` directly during render would produce a hydration
 * mismatch instead.
 *
 * Because the initial value is always `false`, prefer CSS breakpoints for
 * anything that must be correct on the very first paint, and use this hook
 * only where the branch is genuinely behavioural (e.g. rendering the preview
 * inline vs. inside a Sheet).
 *
 * @param query A media query string, e.g. "(min-width: 1280px)"
 */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            if (typeof window === "undefined") {
                return () => {};
            }

            const mql = window.matchMedia(query);
            mql.addEventListener("change", onStoreChange);
            return () => mql.removeEventListener("change", onStoreChange);
        },
        [query]
    );

    const getSnapshot = useCallback(() => {
        if (typeof window === "undefined") {
            return false;
        }
        return window.matchMedia(query).matches;
    }, [query]);

    const getServerSnapshot = useCallback(() => false, []);

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Matches Tailwind's `xl` breakpoint — the form/preview two-column split. */
export function useIsDesktop(): boolean {
    return useMediaQuery("(min-width: 1280px)");
}

/**
 * Matches the `shell` screen in tailwind.config.js — the pinned two-pane
 * layout. Keep the two in step; a mismatch shows up as markup that disagrees
 * with its own styling.
 */
export function useIsShell(): boolean {
    return useMediaQuery("(min-width: 1280px) and (min-height: 800px)");
}

export default useMediaQuery;
