import TemplateFrame, {
    templateCtx,
    type TemplateProps,
} from "../TemplateFrame";
import {
    ItemsTable,
    Logo,
    NotesBlock,
    PartyBlock,
    PaymentBlock,
    SignatureBlock,
    TotalsBlock,
} from "../parts";
import { formatDate } from "@/lib/helpers";

/**
 * Compact — a tight, receipt-like sheet. Meta runs as a single strip under the
 * title rather than a block, and everything is pulled in close. Suited to
 * short invoices where a full page of air looks empty.
 */
export default function Compact(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale, locale } = ctx;

    const strip = [
        [labels.invoiceNumber, data.details.invoiceNumber],
        [labels.invoiceDate, formatDate(data.details.invoiceDate, locale)],
        [labels.dueDate, formatDate(data.details.dueDate, locale)],
    ];

    return (
        <TemplateFrame ctx={ctx}>
            <header
                className="flex flex-wrap items-baseline justify-between gap-3 border-b pb-2"
                style={{ borderColor: theme.accentColor }}
            >
                <div
                    className="text-sm font-bold uppercase tracking-[0.2em]"
                    style={{ color: theme.accentColor }}
                >
                    {labels.invoiceNumber}
                </div>
                {/*
                  * The logo was missing from this layout entirely — an
                  * oversight, not a design choice, so an uploaded logo simply
                  * vanished when the user picked Compact.
                  */}
                <div className="flex items-center gap-2" data-edit-field="sender.name">
                    <Logo {...ctx} />
                    <p className={`${scale.name} font-semibold text-gray-900`}>
                        {data.sender.name}
                    </p>
                </div>
            </header>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                {strip.map(([label, value]) => (
                    <p key={label} className={`${scale.label} text-gray-500`}>
                        {label}:{" "}
                        <span className="font-medium tabular-nums text-gray-900">
                            {value}
                        </span>
                    </p>
                ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <PartyBlock ctx={ctx} field="sender" party={data.sender} heading={labels.from} />
                <PartyBlock
                    ctx={ctx}
                    field="receiver"
                    party={data.receiver}
                    heading={labels.billTo}
                />
            </div>

            <div className="mt-4">
                <ItemsTable ctx={ctx} />
            </div>

            <div className="mt-3 flex justify-end">
                <div className="w-full sm:w-1/2">
                    <TotalsBlock ctx={ctx} />
                </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <NotesBlock ctx={ctx} />
                <PaymentBlock ctx={ctx} />
                <SignatureBlock ctx={ctx} />
            </div>
        </TemplateFrame>
    );
}
