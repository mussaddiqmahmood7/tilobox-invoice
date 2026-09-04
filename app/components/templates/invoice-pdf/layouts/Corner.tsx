import TemplateFrame, {
    templateCtx,
    type TemplateProps,
} from "../TemplateFrame";
import {
    ContactFooter,
    ItemsTable,
    Logo,
    NotesBlock,
    PartyBlock,
    PaymentBlock,
    SignatureBlock,
    TotalsBlock,
} from "../parts";
import { formatNumberWithCommas, formatDate } from "@/lib/helpers";
import { readableOn } from "../invoiceTheme";

/**
 * Corner — an accent block in the top-right holds the amount due and the due
 * date, like a stamp on the page. Everything else stays plain, so the eye is
 * pulled to the one figure that matters.
 */
export default function Corner(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale, locale } = ctx;
    const onAccent = readableOn(theme.accentColor);

    return (
        <TemplateFrame ctx={ctx} bare>
            <div className="flex items-start justify-between gap-4">
                <div className={`flex-1 ${scale.page} pb-0`}>
                    <Logo {...ctx} />
                    <p className={`${scale.name} mt-2 font-semibold text-gray-900`}>
                        {data.sender.name}
                    </p>
                    <div className="mt-4 text-2xl font-light uppercase tracking-[0.2em] text-gray-900">
                        {labels.invoiceNumber}
                    </div>
                    <p className={`${scale.body} tabular-nums text-gray-500`}>
                        {data.details.invoiceNumber}
                    </p>
                </div>

                <div
                    className="shrink-0 rounded-es-2xl px-6 py-5 text-end sm:px-8 sm:py-6"
                    style={{ backgroundColor: theme.accentColor, color: onAccent }}
                >
                    <p
                        className={`${scale.label} font-semibold uppercase tracking-wider`}
                        style={{ opacity: 0.8 }}
                    >
                        {labels.total}
                    </p>
                    <p className="text-xl font-bold tabular-nums sm:text-2xl">
                        {formatNumberWithCommas(Number(data.details.totalAmount ?? 0))}{" "}
                        {data.details.currency}
                    </p>
                    <p className={`${scale.label} mt-1`} style={{ opacity: 0.8 }}>
                        {labels.dueDate}: {formatDate(data.details.dueDate, locale)}
                    </p>
                </div>
            </div>

            <div className={`flex flex-1 flex-col ${scale.page} pt-6`}>
                <div className="grid gap-6 sm:grid-cols-2">
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

                <div className={`${scale.sectionGap} grid gap-6 sm:grid-cols-2`}>
                    <NotesBlock ctx={ctx} />
                    <PaymentBlock ctx={ctx} />
                </div>

                <div className="mt-auto flex items-end justify-between gap-6 pt-8">
                    <ContactFooter ctx={ctx} />
                    <SignatureBlock ctx={ctx} />
                </div>
            </div>
        </TemplateFrame>
    );
}
