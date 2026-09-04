"use client";

import React, {
    MutableRefObject,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

/*
 * Type-only. This was a value import, which pulled react-signature-canvas and
 * its signature_pad dependency into the initial client bundle — this context is
 * mounted by InvoiceSummary, which is always in the form tree. The canvas is
 * only ever *rendered* inside the signature modal, so the implementation now
 * loads with that modal's chunk (see DrawSignature).
 */
import type SignatureCanvas from "react-signature-canvas";

// Variables
import { SIGNATURE_COLORS, SIGNATURE_FONTS } from "@/lib/variables";

// Types
import { SignatureColor, SignatureFont } from "@/types";

const defaultSignatureContext = {
    signatureData: "",
    signatureRef: null as MutableRefObject<SignatureCanvas | null> | null,
    colors: [] as SignatureColor[],
    selectedColor: "",
    handleColorButtonClick: (color: string) => {},
    clearSignature: () => {},
    handleCanvasEnd: () => {},
    typedSignature: "",
    setTypedSignature: (value: string) => {},
    typedSignatureRef: null as MutableRefObject<HTMLInputElement | null> | null,
    typedSignatureFonts: [] as SignatureFont[],
    selectedFont: {} as SignatureFont,
    setSelectedFont: (value: SignatureFont) => {},
    typedSignatureFontSize: 0 as number,
    clearTypedSignature: () => {},
    uploadSignatureRef:
        null as MutableRefObject<HTMLInputElement | null> | null,
    uploadSignatureImg: "",
    handleUploadSignatureChange: (e: React.ChangeEvent<HTMLInputElement>) => {},
    handleRemoveUploadedSignature: () => {},
};

export const SignatureContext = createContext(defaultSignatureContext);

export const useSignatureContext = () => {
    return useContext(SignatureContext);
};

type SignatureContextProviderProps = {
    children: React.ReactNode;
};

export const SignatureContextProvider = ({
    children,
}: SignatureContextProviderProps) => {
    // Form context
    const { setValue } = useFormContext();

    const signature = useWatch({
        name: "details.signature.data",
    });

    /**
     * * DRAWING SIGNATURE
     */

    // Signature in base64 or as string
    const [signatureData, setSignatureData] = useState(signature ?? "");

    // Signature
    const signatureRef = useRef<SignatureCanvas | null>(null);

    // Colors
    const colors: SignatureColor[] = SIGNATURE_COLORS;
    const [selectedColor, setSelectedColor] = useState<string>(colors[0].color);

    /**
     * Sets selected signature color
     *
     * @param {string} color - Color to be selected as string. Ex: "red"
     */
    const handleColorButtonClick = useCallback((color: string) => {
        setSelectedColor(color);
    }, []);

    /**
     * Clears drawn signature canvas.
     *
     * Note the field path: this used to write `setValue("details.signature", "")`,
     * replacing the whole `{ data, fontFamily }` object with a bare string and
     * putting form state into a shape the schema rejects. Only `data` is cleared.
     */
    const clearSignature = useCallback(() => {
        if (signatureRef.current) {
            signatureRef.current.clear();
            setSignatureData("");
            setValue("details.signature.data", "");
        }
    }, [setValue]);

    /**
     * Fires every time canvas drawing stops
     */
    const handleCanvasEnd = useCallback(() => {
        if (signatureRef.current) {
            // Previously base64 was sent in parameter
            const dataUrl = signatureRef.current.toDataURL("image/png");
            setSignatureData(dataUrl);
        }
    }, []);

    /**
     * * TYPED SIGNATURE
     */

    // Value in typed input
    const [typedSignature, setTypedSignature] = useState<string>(
        signature ?? ""
    );

    // Typed signature input ref
    const typedSignatureRef = useRef<HTMLInputElement | null>(null);

    // All available fonts for typed signature input
    const typedSignatureFonts: SignatureFont[] = SIGNATURE_FONTS;

    const [selectedFont, setSelectedFont] = useState<SignatureFont>(
        typedSignatureFonts[0]
    );

    /**
     * Font size calculator for typed signature
     *
     * @param {string} text - Text in signature input
     * @returns {number} Font size that should be used
     */
    const calculateFontSize = (text: string) => {
        const initialFontSize = 100;
        const canvasWidth = 300;
        let fontSize = initialFontSize;
        const textWidth = text.length * (initialFontSize / 2); // Adjust as needed for font width

        if (textWidth > canvasWidth - 20) {
            // Gradually decrease font size as text approaches canvas width
            fontSize = (canvasWidth - 20) / text.length / 0.4; // You can adjust the decrease rate
        }

        return fontSize;
    };

    /**
     * Memoized typed signature font size
     */
    const typedSignatureFontSize = useMemo(
        () => calculateFontSize(typedSignature),
        [typedSignature]
    );

    /**
     * Clears typed signature
     */
    const clearTypedSignature = useCallback(() => {
        setTypedSignature("");
        setValue("details.signature.data", "");
    }, [setValue]);

    /**
     * * UPLOAD SIGNATURE
     */
    const uploadSignatureRef = useRef<HTMLInputElement | null>(null);
    const [uploadSignatureImg, setUploadSignatureImg] = useState<string>("");

    /**
     * Function that fires every time signature file input changes
     * @param e - Event object from file input
     */
    const handleUploadSignatureChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files![0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64String = event.target!.result as string;
                    setUploadSignatureImg(base64String);
                };
                reader.readAsDataURL(file);
            }
        },
        []
    );

    /**
     * Function that removes uploaded signature
     */
    const handleRemoveUploadedSignature = useCallback(() => {
        setUploadSignatureImg("");

        if (uploadSignatureRef.current) {
            uploadSignatureRef.current.value = "";
        }
    }, []);

    /*
     * The value was a fresh object literal on every render, so typing a single
     * character into the typed-signature input invalidated every consumer —
     * all three tabs, the trigger thumbnail and the colour and font pickers.
     * With the handlers memoised above, this only changes when something a
     * consumer actually reads changes.
     */
    const value = useMemo(
        () => ({
            signatureData,
            signatureRef,
            colors,
            selectedColor,
            handleColorButtonClick,
            clearSignature,
            handleCanvasEnd,
            typedSignature,
            setTypedSignature,
            typedSignatureRef,
            typedSignatureFonts,
            selectedFont,
            setSelectedFont,
            typedSignatureFontSize,
            clearTypedSignature,
            uploadSignatureRef,
            uploadSignatureImg,
            handleUploadSignatureChange,
            handleRemoveUploadedSignature,
        }),
        [
            signatureData,
            colors,
            selectedColor,
            handleColorButtonClick,
            clearSignature,
            handleCanvasEnd,
            typedSignature,
            typedSignatureFonts,
            selectedFont,
            typedSignatureFontSize,
            clearTypedSignature,
            uploadSignatureImg,
            handleUploadSignatureChange,
            handleRemoveUploadedSignature,
        ]
    );

    return (
        <SignatureContext.Provider value={value}>
            {children}
        </SignatureContext.Provider>
    );
};
