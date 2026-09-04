"use client";

import { useEffect, useRef } from "react";

// React Signature Canvas
import SignatureCanvas from "react-signature-canvas";

// ShadCn
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

// Components
import { BaseButton, SignatureColorSelector } from "@/app/components";

// Contexts
import { useSignatureContext } from "@/contexts/SignatureContext";

// Icons
import { Check, Eraser } from "lucide-react";

// Types
import { SignatureTabs } from "@/types";

type DrawSignatureProps = {
    handleSaveSignature: () => void;
};

const DrawSignature = ({ handleSaveSignature }: DrawSignatureProps) => {
    // Guards the resize handler against firing mid-stroke
    const isDrawingRef = useRef(false);

    const {
        signatureData,
        signatureRef,
        colors,
        selectedColor,
        handleColorButtonClick,
        clearSignature,
        handleCanvasEnd,
    } = useSignatureContext();

    /*
     * A <canvas> has two sizes: its CSS box and its bitmap (width/height
     * attributes, default 300x150). Only the CSS box was being set, so strokes
     * were drawn at a different scale than the pointer. Keep the bitmap in
     * sync with the rendered box, accounting for devicePixelRatio.
     *
     * This is kept deliberately cheap: an earlier version re-read
     * getBoundingClientRect and re-encoded the drawing through
     * toDataURL/fromDataURL on every observer callback, which fires repeatedly
     * while the dialog animates open — i.e. exactly when the user starts
     * drawing, which is what made it feel laggy.
     */
    useEffect(() => {
        // The context types signatureRef itself as nullable, not just .current
        const pad = signatureRef?.current;
        const canvas = pad?.getCanvas();
        if (!pad || !canvas) return;

        // Last CSS size we actually applied, so repeat callbacks are free
        let appliedWidth = 0;
        let appliedHeight = 0;

        const applySize = (width: number, height: number) => {
            if (!width || !height) return;
            if (width === appliedWidth && height === appliedHeight) return;

            // A stroke in progress must not be interrupted — resizing clears
            // the bitmap, and re-encoding mid-gesture is what caused the lag.
            if (isDrawingRef.current) return;

            /*
             * Capped at 2. On a 3x display an uncapped ratio makes the bitmap
             * 9x the pixels, and signature_pad redraws per pointer event.
             */
            const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);

            const previous = pad.isEmpty() ? null : pad.toDataURL();

            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            canvas.getContext("2d")?.scale(ratio, ratio);

            appliedWidth = width;
            appliedHeight = height;

            if (previous) {
                pad.fromDataURL(previous, { width, height });
            } else {
                pad.clear();
            }
        };

        /*
         * clientWidth/clientHeight, not getBoundingClientRect().
         *
         * The dialog opens with a `zoom-95` transform, and getBoundingClientRect
         * reports the *transformed* box — so the first measurement came in at
         * 95% and the observer immediately corrected it, sizing the bitmap
         * twice and re-encoding the drawing in between. The layout properties
         * ignore transforms, matching what the observer's contentRect reports,
         * so the size settles on the first call.
         */
        applySize(canvas.clientWidth, canvas.clientHeight);

        /*
         * Restore an existing signature here rather than from a timer in
         * SignatureModal. That version fired 50ms after open — inside the 200ms
         * animation — so a base64 PNG decode landed on the main thread while
         * the dialog was still animating. Doing it at this point means the
         * canvas is already correctly sized, so the decode happens once.
         */
        if (signatureData && pad.isEmpty()) {
            pad.fromDataURL(signatureData);
        }

        const observer = new ResizeObserver((entries) => {
            const box = entries[0]?.contentRect;
            if (box) applySize(box.width, box.height);
        });
        observer.observe(canvas);
        return () => observer.disconnect();
        // signatureData is read once on mount to seed the canvas; it must not
        // re-run the effect, or every stroke would reset the pad mid-drawing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signatureRef]);

    return (
        <TabsContent value={SignatureTabs.DRAW}>
            <Card className="border-none shadow-none">
                <CardContent className="space-y-2 p-0">
                    <div className="mx-auto w-full max-w-[600px] touch-none">
                        {/* Signature Canvas to draw signature */}
                        <SignatureCanvas
                            velocityFilterWeight={0.7}
                            minWidth={1.4} // Adjust the minWidth for a finer line
                            maxWidth={1.4} // Adjust the maxWidth for a finer line
                            // 0 disabled throttling entirely, so every
                            // pointermove was processed. 16 = ~1 frame.
                            throttle={16}
                            ref={signatureRef}
                            penColor={selectedColor}
                            canvasProps={{
                                className:
                                    "w-full h-[12rem] sm:h-[15rem] rounded-[10px] touch-none",
                                style: { background: "#efefef" },
                            }}
                            onBegin={() => {
                                isDrawingRef.current = true;
                            }}
                            onEnd={() => {
                                isDrawingRef.current = false;
                                handleCanvasEnd();
                            }}
                        />
                    </div>
                </CardContent>
                <div className="flex justify-between gap-2 pt-2">
                    {/* Color selector */}
                    <SignatureColorSelector
                        colors={colors}
                        selectedColor={selectedColor}
                        handleColorButtonClick={handleColorButtonClick}
                    />

                    {signatureData && (
                        <BaseButton
                            tooltipLabel="Clear the signature board"
                            variant="outline"
                            className="w-fit gap-2"
                            onClick={clearSignature}
                        >
                            Erase
                            <Eraser />
                        </BaseButton>
                    )}
                    <BaseButton
                        tooltipLabel="Save changes"
                        disabled={!signatureData}
                        onClick={handleSaveSignature}
                    >
                        Done
                        <Check />
                    </BaseButton>
                </div>
            </Card>
        </TabsContent>
    );
};

export default DrawSignature;
