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
 * Column — a narrow left column of metadata runs the full height beside the
 * items, with hairline rules instead of fills. Reads like a spec sheet, and
 * copes well with long item lists because the meta never pushes them down.
 */
export default function Column(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;

    return (
        <TemplateFrame ctx={ctx}>
            <header
                className="flex flex-wrap items-baseline justify-between gap-3 border-b pb-4"
                style={{ borderColor: theme.accentColor }}
            >
                <div className="text-2xl font-semibold tracking-tight text-gray-900">
                    {labels.invoiceNumber}{" "}
                    <span
                        className="tabular-nums"
                        style={{ color: theme.accentColor }}
                    >
                        {data.details.invoiceNumber}
                    </span>
                </div>
                <Logo {...ctx} />
            </header>

            <div className={`${scale.sectionGap} grid flex-1 gap-8 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]`}>
                <aside className="space-y-5 border-gray-200 sm:border-e sm:pe-6">
                    <PartyBlock ctx={ctx} field="sender" party={data.sender} heading={labels.from} />
                    <PartyBlock
                        ctx={ctx}
                        field="receiver"
                        party={data.receiver}
                        heading={labels.billTo}
                    />
                    <DocumentMeta ctx={ctx} align="left" />
                    <PaymentBlock ctx={ctx} />
                </aside>

                <div className="flex min-w-0 flex-col">
                    <ItemsTable ctx={ctx} />

                    <div className="mt-6 flex justify-end">
                        <div className="w-full sm:w-3/5">
                            <TotalsBlock ctx={ctx} />
                        </div>
                    </div>

                    <div className="mt-6">
                        <NotesBlock ctx={ctx} />
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-6 pt-8">
                        <ContactFooter ctx={ctx} />
                        <SignatureBlock ctx={ctx} />
                    </div>
                </div>
            </div>
        </TemplateFrame>
    );
}
