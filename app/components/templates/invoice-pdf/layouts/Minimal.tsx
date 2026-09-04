import TemplateFrame, {
    templateCtx,
    type TemplateProps,
} from "../TemplateFrame";
import {
    ContactFooter,
    DocumentMeta,
    ItemsTable,
    NotesBlock,
    PartyBlock,
    PaymentBlock,
    SignatureBlock,
    TotalsBlock,
} from "../parts";

/**
 * Minimal — no rules, no fills, no logo. Whitespace and a single hairline do
 * all the separating. The accent appears exactly once, on the total.
 */
export default function Minimal(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;

    return (
        <TemplateFrame ctx={ctx}>
            <header className="mb-10">
                <p
                    className="text-[10px] font-semibold uppercase tracking-[0.35em]"
                    style={{ color: theme.accentColor }}
                >
                    {labels.invoiceNumber}
                </p>
                <p className="mt-2 text-3xl font-light tabular-nums tracking-tight text-gray-900">
                    {data.details.invoiceNumber}
                </p>
            </header>

            <div className="grid gap-8 sm:grid-cols-3">
                <PartyBlock ctx={ctx} field="sender" party={data.sender} heading={labels.from} />
                <PartyBlock
                    ctx={ctx}
                    field="receiver"
                    party={data.receiver}
                    heading={labels.billTo}
                />
                <DocumentMeta ctx={ctx} align="left" />
            </div>

            <div className="mt-12">
                <ItemsTable ctx={ctx} variant="plain" />
            </div>

            <div className="mt-8 flex justify-end">
                <div className="w-full sm:w-2/5">
                    <TotalsBlock ctx={ctx} />
                </div>
            </div>

            <div className="mt-auto pt-12">
                <div className="border-t border-gray-200 pt-6">
                    <div className="grid gap-8 sm:grid-cols-3">
                        <NotesBlock ctx={ctx} />
                        <PaymentBlock ctx={ctx} />
                        <div className="space-y-4">
                            <SignatureBlock ctx={ctx} />
                            <ContactFooter ctx={ctx} />
                        </div>
                    </div>
                </div>
            </div>
        </TemplateFrame>
    );
}
