"use client";

import { useState } from "react";

// Next
import dynamic from "next/dynamic";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// ShadCn
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

// Components
import { TypeSignature, UploadSignature } from "@/app/components";

/*
 * Imported from its own path rather than the component barrel, and lazily, so
 * react-signature-canvas + signature_pad load with the modal instead of sitting
 * in the initial bundle. ssr:false because the canvas has no server rendering
 * to do — it measures a live DOM node.
 */
const DrawSignature = dynamic(
    () => import("./tabs/DrawSignature"),
    {
        ssr: false,
        loading: () => (
            <div className="mx-auto h-[12rem] w-full max-w-[600px] animate-pulse rounded-[10px] bg-muted sm:h-[15rem]" />
        ),
    }
);

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";
import { useSignatureContext } from "@/contexts/SignatureContext";

// Icons
import { FileSignature } from "lucide-react";

// Helpers
import { isDataUrl } from "@/lib/helpers";

// Types
import { SignatureTabs } from "@/types";

const SignatureModal = () => {
    const { setValue } = useFormContext();

    const {
        handleCanvasEnd,
        signatureData,
        typedSignature,
        selectedFont,
        uploadSignatureImg,
    } = useSignatureContext();

    const { _t } = useTranslationContext();

    // Modal state
    const [open, setOpen] = useState(false);

    // Modal tabs
    const [tab, setTab] = useState<string>(SignatureTabs.DRAW);

    const onTabChange = (value: string) => {
        setTab(value as string);
    };

    const signature = useWatch({
        name: "details.signature.data",
    });

    /**
     * Function that handles signature save logic for all tabs (draw, type, upload)
     */
    const handleSaveSignature = () => {
        if (tab == SignatureTabs.DRAW) {
            handleCanvasEnd();

            // This setValue was removed from handleCanvasEnd and put here to prevent
            // the signature from showing updated drawing every time drawing stops
            setValue("details.signature.data", signatureData, {
                shouldDirty: true,
            });

            setOpen(false);
        }

        if (tab == SignatureTabs.TYPE) {
            setValue(
                "details.signature",
                {
                    data: typedSignature,
                    fontFamily: selectedFont.name,
                },
                {
                    shouldDirty: true,
                }
            );

            setOpen(false);
        }

        if (tab == SignatureTabs.UPLOAD) {
            setValue("details.signature.data", uploadSignatureImg, {
                shouldDirty: true,
            });
            setOpen(false);
        }
    };

    /*
     * Restoring the existing signature onto the canvas used to live here, as a
     * `setTimeout(…, 50)` — i.e. a base64 PNG decode landing 50ms into the
     * dialog's 200ms open animation, every time the modal opened or a tab was
     * switched. DrawSignature now does it itself, once, at the point the canvas
     * has been sized. See the comment there.
     */

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger className="flex w-full justify-start">
                    {/* max-w rather than a fixed 300px, so the preview cannot
                        overflow its column on a narrow screen */}
                    <div className="w-full max-w-[300px] min-w-0">
                        <Label>
                            {_t("form.steps.summary.signature.heading")}
                        </Label>

                        {signature && isDataUrl(signature) ? (
                            <img
                                className="w-full rounded-md border border-border bg-white transition-colors hover:border-primary"
                                src={signature}
                                alt={_t("form.steps.summary.signature.heading")}
                            />
                        ) : signature && typedSignature ? (
                            <div className="flex h-[155px] w-full items-center justify-center overflow-hidden">
                                <p
                                    className="truncate"
                                    style={{
                                        fontFamily: selectedFont.variable,
                                        fontSize: 55,
                                    }}
                                >
                                    {signature}
                                </p>
                            </div>
                        ) : (
                            <div className="flex h-[155px] w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/50 text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                                <FileSignature className="h-5 w-5" />
                                <Label className="cursor-pointer text-xs">
                                    {_t(
                                        "form.steps.summary.signature.placeholder"
                                    )}
                                </Label>
                            </div>
                        )}
                    </div>
                </DialogTrigger>

                <DialogContent className="select-none">
                    <DialogTitle>
                        {_t("form.steps.summary.signature.heading")}
                    </DialogTitle>
                    <DialogDescription>
                        {_t("form.steps.summary.signature.description")}
                    </DialogDescription>

                    <Tabs value={tab} onValueChange={onTabChange}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value={SignatureTabs.DRAW}>
                                {_t("form.steps.summary.signature.draw")}
                            </TabsTrigger>
                            <TabsTrigger value={SignatureTabs.TYPE}>
                                {_t("form.steps.summary.signature.type")}
                            </TabsTrigger>
                            <TabsTrigger value={SignatureTabs.UPLOAD}>
                                {_t("form.steps.summary.signature.upload")}
                            </TabsTrigger>
                        </TabsList>

                        {/*
                          * Only the active tab is rendered. Radix already keeps
                          * inactive TabsContent out of the DOM, but the tab
                          * components themselves still ran — mounting effects,
                          * subscribing to context and, for the draw tab,
                          * requesting its chunk — for panels the user may never
                          * open.
                          */}
                        {tab === SignatureTabs.DRAW && (
                            <DrawSignature
                                handleSaveSignature={handleSaveSignature}
                            />
                        )}

                        {tab === SignatureTabs.TYPE && (
                            <TypeSignature
                                handleSaveSignature={handleSaveSignature}
                            />
                        )}

                        {tab === SignatureTabs.UPLOAD && (
                            <UploadSignature
                                handleSaveSignature={handleSaveSignature}
                            />
                        )}
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SignatureModal;
