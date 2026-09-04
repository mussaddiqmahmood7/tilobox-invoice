import TemplateFrame, {
    templateCtx,
    type TemplateProps,
} from "../TemplateFrame";
import {
    ContactFooter,
    Logo,
    ItemsTable,
    NotesBlock,
    PartyBlock,
    PaymentBlock,
    SignatureBlock,
    TotalsBlock,
} from "../parts";
import { formatNumberWithCommas, formatDate } from "@/lib/helpers";
import { tint } from "../invoiceTheme";

/**
 * Statement — modelled on a bank statement: a summary strip of key figures
 * across the top, then the detail beneath. Answers "how much, by when" before
 * asking the reader to look at anything else.
 */
export default function Statement(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale, locale } = ctx;
    const soft = tint(theme.accentColor, 0.92);

    const summary = [
        [labels.invoiceNumber, data.details.invoiceNumber],
        [labels.dueDate, formatDate(data.details.dueDate, locale)],
        [
            labels.total,
            `${formatNumberWithCommas(Number(data.details.totalAmount ?? 0))} ${data.details.currency}`,
        ],
    ];

    return (
        <TemplateFrame ctx={ctx}>
            <header className="flex flex-wrap items-center justify-between gap-3">
                {/* Logo was missing from this layout too — see Compact. */}
                <div className="flex items-center gap-2.5" data-edit-field="sender.name">
                    <Logo {...ctx} />
                    <p className={`${scale.name} font-semibold text-gray-900`}>
                        {data.sender.name}
                    </p>
                </div>
                <div
                    className="text-xs font-semibold uppercase tracking-[0.3em]"
                    style={{ color: theme.accentColor }}
                >
                    {labels.invoiceNumber}
                </div>
            </header>

            <div
                className="mt-4 grid gap-px overflow-hidden rounded-lg sm:grid-cols-3"
                style={{ backgroundColor: theme.accentColor }}
            >
                {summary.map(([label, value], i) => (
                    <div
                        key={label}
                        className="p-4"
                        style={{ backgroundColor: soft }}
                    >
                        <p
                            className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
                        >
                            {label}
                        </p>
                        <p
                            className={`mt-0.5 font-bold tabular-nums text-gray-900 ${
                                i === 2 ? "text-lg" : scale.name
                            }`}
                        >
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            <div className={`${scale.sectionGap} grid gap-6 sm:grid-cols-2`}>
                <PartyBlock ctx={ctx} field="sender" party={data.sender} heading={labels.from} />
                <PartyBlock
                    ctx={ctx}
                    field="receiver"
                    party={data.receiver}
                    heading={labels.billTo}
                />
            </div>

            <div className={scale.sectionGap}>
                <ItemsTable ctx={ctx} />
            </div>

            <div className={`${scale.sectionGap} flex justify-end`}>
                <div className="w-full sm:w-2/5">
                    <TotalsBlock ctx={ctx} />
                </div>
            </div>

            <div className={`${scale.sectionGap} grid gap-6 sm:grid-cols-3`}>
                <NotesBlock ctx={ctx} />
                <PaymentBlock ctx={ctx} />
                <SignatureBlock ctx={ctx} />
            </div>

            <div className="mt-auto pt-8">
                <ContactFooter ctx={ctx} />
            </div>
        </TemplateFrame>
    );
}
