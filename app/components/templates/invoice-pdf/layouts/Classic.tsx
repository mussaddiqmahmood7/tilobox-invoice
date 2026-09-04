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
 * Classic — the original Invoify look, preserved so invoices saved against
 * template 1 keep rendering the way their author expects. Logo and sender on
 * the left, a large "Invoice" title and meta on the right.
 */
export default function Classic(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;

    return (
        <TemplateFrame ctx={ctx}>
            <header className="flex items-start justify-between gap-6">
                <div>
                    <Logo {...ctx} />
                    <p
                        className="mt-2 text-lg font-semibold"
                        style={{ color: theme.accentColor }}
                    >
                        {data.sender.name}
                    </p>
                </div>
                <div className="text-end">
                    <div
                        className={`${scale.heading} font-semibold uppercase tracking-tight text-gray-900`}
                    >
                        {labels.invoiceNumber}
                    </div>
                    <p className={`${scale.body} mt-0.5 text-gray-500`}>
                        {data.details.invoiceNumber}
                    </p>
                </div>
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

            <div className={scale.sectionGap}>
                <DocumentMeta ctx={ctx} align="left" />
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
