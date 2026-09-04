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
import { tint } from "../invoiceTheme";

/**
 * Two-Tone — a soft tint of the accent backs the summary panel and the header,
 * so the sheet reads as two bands of colour rather than one solid block. The
 * gentlest of the coloured layouts.
 */
export default function TwoTone(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;
    const soft = tint(theme.accentColor, 0.9);

    return (
        <TemplateFrame ctx={ctx} bare>
            <header
                className="px-6 py-6 sm:px-10 sm:py-8"
                style={{ backgroundColor: soft }}
            >
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div data-edit-field="sender.name">
                        <Logo {...ctx} />
                        <p className={`${scale.name} mt-2 font-semibold text-gray-900`}>
                            {data.sender.name}
                        </p>
                    </div>
                    <div className="text-end">
                        <div
                            className={`${scale.heading} font-bold uppercase tracking-tight`}
                            style={{ color: theme.accentColor }}
                        >
                            {labels.invoiceNumber}
                        </div>
                        <DocumentMeta ctx={ctx} />
                    </div>
                </div>
            </header>

            <div className={`flex flex-1 flex-col ${scale.page}`}>
                <PartyBlock
                    ctx={ctx}
                    field="receiver"
                    party={data.receiver}
                    heading={labels.billTo}
                />

                <div className={scale.sectionGap}>
                    <ItemsTable ctx={ctx} />
                </div>

                <div className={`${scale.sectionGap} flex justify-end`}>
                    <div
                        className="w-full rounded-lg p-4 sm:w-1/2"
                        style={{ backgroundColor: soft }}
                    >
                        <TotalsBlock ctx={ctx} />
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
