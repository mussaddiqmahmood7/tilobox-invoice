import TemplateFrame, {
    templateCtx,
    type TemplateProps,
} from "../TemplateFrame";
import {
    ContactFooter,
    DocumentMeta,
    ItemsTable,
    Logo,
    NotesBlock,
    PartyBlock,
    PaymentBlock,
    SignatureBlock,
    TotalsBlock,
} from "../parts";
import { readableOn } from "../invoiceTheme";

/**
 * Bold Header — a full-bleed accent band across the top carrying the word
 * INVOICE and the total, so the amount due is the first thing read.
 */
export default function BoldHeader(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;
    const onAccent = readableOn(theme.accentColor);

    return (
        <TemplateFrame ctx={ctx} bare>
            <header
                className="px-6 py-7 sm:px-10 sm:py-9"
                style={{ backgroundColor: theme.accentColor, color: onAccent }}
            >
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div data-edit-field="sender.name">
                        {/* Plate on a dark accent — see Logo in parts/index.tsx */}
                        <Logo {...ctx} plate={onAccent === "#ffffff"} />
                        <p className={`${scale.name} mt-2 font-semibold`}>
                            {data.sender.name}
                        </p>
                    </div>
                    <div className="text-end">
                        <p
                            className="text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl"
                            style={{ opacity: 0.9 }}
                        >
                            {labels.invoiceNumber}
                        </p>
                        <p className={`${scale.body} mt-1`} style={{ opacity: 0.85 }}>
                            {data.details.invoiceNumber}
                        </p>
                    </div>
                </div>
            </header>

            <div className={`flex flex-1 flex-col ${scale.page}`}>
                <div className="grid gap-6 sm:grid-cols-2">
                    <PartyBlock
                        ctx={ctx}
                        field="receiver"
                        party={data.receiver}
                        heading={labels.billTo}
                    />
                    <DocumentMeta ctx={ctx} />
                </div>

                <div className={scale.sectionGap}>
                    <ItemsTable ctx={ctx} variant="filled" />
                </div>

                <div className={`${scale.sectionGap} flex justify-end`}>
                    <div className="w-full sm:w-1/2">
                        <TotalsBlock ctx={ctx} emphasis="fill" />
                    </div>
                </div>

                <div className={`${scale.sectionGap} grid gap-6 sm:grid-cols-2`}>
                    <NotesBlock ctx={ctx} />
                    <PaymentBlock ctx={ctx} />
                </div>

                <div className={`${scale.sectionGap} flex items-end justify-between gap-6`}>
                    <ContactFooter ctx={ctx} />
                    <SignatureBlock ctx={ctx} />
                </div>
            </div>
        </TemplateFrame>
    );
}
