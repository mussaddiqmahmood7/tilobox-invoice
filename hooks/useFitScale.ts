"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Below this, stop shrinking and let the pane scroll instead.
 *
 * A thirty-item invoice is roughly three pages; fitting all of it into one
 * pane works out at about 0.33, where 12px body text renders at 4px. That is
 * not a preview of anything. Past the floor, fit means "fit what fits" and the
 * rest is scrolled — which is what a PDF viewer does with a long document.
 */
const MIN_SCALE = 0.6;

/**
 * Scales an element down so it fits the height of its pane.
 *
 * The invoice is an A4 page — 1123px tall at 96dpi — and the preview pane on a
 * 1440x900 screen is about 672px, so "show me the whole invoice" necessarily
 * means about 60% scale. That is why this is paired with a Fit/100% toggle
 * rather than being the only mode: at 60% you can see the layout but not
 * comfortably read 12px body text.
 *
 * Never scales *up*. A short invoice on a tall screen stays at 100% rather
 * than being blown up to fill the pane.
 */
export function useFitScale<
    Pane extends HTMLElement,
    Content extends HTMLElement,
>({ enabled }: { enabled: boolean }) {
    const paneRef = useRef<Pane>(null);
    const contentRef = useRef<Content>(null);

    const [scale, setScale] = useState(1);
    /** Natural height of the content, so the wrapper can reserve scaled space. */
    const [naturalHeight, setNaturalHeight] = useState(0);

    const measure = useCallback(() => {
        const pane = paneRef.current;
        const content = contentRef.current;
        if (!pane || !content) return;

        /*
         * offsetHeight, not getBoundingClientRect: the rect reports the
         * *scaled* box, so reading it here would feed this measurement back
         * into itself and settle on the wrong number.
         */
        const contentHeight = content.offsetHeight;
        const paneHeight = pane.clientHeight;

        if (!contentHeight || !paneHeight) return;

        setNaturalHeight(contentHeight);
        setScale(
            enabled
                ? Math.max(MIN_SCALE, Math.min(1, paneHeight / contentHeight))
                : 1
        );
    }, [enabled]);

    useEffect(() => {
        measure();

        const pane = paneRef.current;
        const content = contentRef.current;
        if (!pane || !content) return;

        // Both matter: the pane changes with the window, the content changes
        // as the user types and as the invoice grows past a page.
        const observer = new ResizeObserver(measure);
        observer.observe(pane);
        observer.observe(content);

        return () => observer.disconnect();
    }, [measure]);

    return {
        paneRef,
        contentRef,
        scale,
        /**
         * Height the scaled content actually occupies. Applied to the wrapper
         * so the pane does not keep a scrollbar for space the transform has
         * already given back.
         */
        scaledHeight: naturalHeight ? naturalHeight * scale : undefined,
        remeasure: measure,
    };
}

export default useFitScale;
