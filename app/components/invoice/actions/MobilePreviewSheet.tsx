"use client";

import { ReactNode, useState } from "react";

// ShadCn
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

// Components
import { PdfViewer } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

type MobilePreviewSheetProps = {
    children: ReactNode;
};

/**
 * Full-height bottom sheet holding the live preview / generated PDF.
 *
 * Used below xl, where there is no room for the preview column. The viewer is
 * only mounted while the sheet is open so the invoice template is not being
 * re-rendered off-screen on every keystroke.
 */
const MobilePreviewSheet = ({ children }: MobilePreviewSheetProps) => {
    const [open, setOpen] = useState(false);

    const { _t } = useTranslationContext();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent
                side="bottom"
                className="flex h-[92dvh] flex-col rounded-t-xl p-0"
            >
                <SheetHeader className="shrink-0 border-b px-4 py-3 text-start">
                    <SheetTitle>{_t("actions.previewTitle")}</SheetTitle>
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
                    {open && <PdfViewer />}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default MobilePreviewSheet;
