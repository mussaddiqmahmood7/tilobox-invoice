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
 * Left Rail — a thin accent stripe down the left edge and a hanging-indent
 * column of labels. Editorial rather than corporate; the stripe is the only
 * colour on the page.
 */
export default function LeftRail(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;

    return (
        <TemplateFrame ctx={ctx} bare>
            <div className="flex min-h-full flex-1">
                <div
                    className="w-2 shrink-0"
                    style={{ backgroundColor: theme.accentColor }}
                    aria-hidden="true"
                />

                <div className={`flex min-w-0 flex-1 flex-col ${scale.page}`}>
                    <header className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="text-3xl font-light uppercase tracking-[0.25em] text-gray-900">
                                {labels.invoiceNumber}
                            </div>
                            <p
                                className={`${scale.body} mt-1 tabular-nums`}
                                style={{ color: theme.accentColor }}
                            >
                                {data.details.invoiceNumber}
                            </p>
                        </div>
                        <Logo {...ctx} />
                    </header>

                    <div className={`${scale.sectionGap} grid gap-6 sm:grid-cols-[1fr_1fr_auto]`}>
                        <PartyBlock ctx={ctx} field="sender" party={data.sender} heading={labels.from} />
                        <PartyBlock
                            ctx={ctx}
                            field="receiver"
                            party={data.receiver}
                            heading={labels.billTo}
                        />
                        <DocumentMeta ctx={ctx} align="left" />
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
            </div>
        </TemplateFrame>
    );
}
