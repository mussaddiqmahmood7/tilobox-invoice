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

/**
 * Modern — the second original Invoify template, kept so invoices saved
 * against template 2 still render as their author left them. Stacked header
 * with the sender above a wide rule.
 */
export default function Modern(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;

    return (
        <TemplateFrame ctx={ctx}>
            <header>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Logo {...ctx} />
                    <div
                        className={`${scale.heading} font-semibold uppercase tracking-tight text-gray-900`}
                    >
                        {labels.invoiceNumber}
                    </div>
                </div>
                <div
                    className="mt-3 h-1 w-full rounded"
                    style={{ backgroundColor: theme.accentColor }}
                    aria-hidden="true"
                />
            </header>

            <div className={`${scale.sectionGap} grid gap-6 sm:grid-cols-2`}>
                <PartyBlock ctx={ctx} field="sender" party={data.sender} heading={labels.from} />
                <PartyBlock
                    ctx={ctx}
                    field="receiver"
                    party={data.receiver}
                    heading={labels.billTo}
                    align="right"
                />
            </div>

            <div className={`${scale.sectionGap} flex justify-end`}>
                <DocumentMeta ctx={ctx} />
            </div>

            <div className={scale.sectionGap}>
                <ItemsTable ctx={ctx} />
            </div>

            <div className={`${scale.sectionGap} flex justify-end`}>
                <div className="w-full sm:w-1/2">
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
        </TemplateFrame>
    );
}
