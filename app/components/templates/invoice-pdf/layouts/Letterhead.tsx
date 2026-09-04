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
 * Letterhead — centred masthead with double rules, the way a printed company
 * letterhead is set. Formal, symmetrical, and the only centred layout here.
 */
export default function Letterhead(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;

    return (
        <TemplateFrame ctx={ctx}>
            <header className="text-center">
                <div className="flex justify-center">
                    <Logo {...ctx} />
                </div>
                <p
                    data-edit-field="sender.name"
                    className={`${scale.name} mt-2 font-semibold tracking-wide text-gray-900`}
                >
                    {data.sender.name}
                </p>
                <p data-edit-field="sender.address" className={`${scale.body} text-gray-500`}>
                    {[
                        data.sender.address,
                        data.sender.city,
                        data.sender.country,
                    ]
                        .filter(Boolean)
                        .join(" · ")}
                </p>

                <div
                    className="mx-auto mt-4 border-t-2 border-b"
                    style={{ borderColor: theme.accentColor, width: "100%" }}
                >
                    <div
                        className={`${scale.heading} py-2 font-semibold uppercase tracking-[0.3em] text-gray-900`}
                    >
                        {labels.invoiceNumber}
                    </div>
                </div>
            </header>

            <div className={`${scale.sectionGap} flex flex-wrap justify-between gap-6`}>
                <PartyBlock
                    ctx={ctx}
                    field="receiver"
                    party={data.receiver}
                    heading={labels.billTo}
                />
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

            <div className="mt-auto pt-8 text-center">
                <div className="flex justify-center">
                    <SignatureBlock ctx={ctx} />
                </div>
                <div
                    className="mt-4 border-t pt-3"
                    style={{ borderColor: theme.accentColor }}
                >
                    <ContactFooter ctx={ctx} />
                </div>
            </div>
        </TemplateFrame>
    );
}
