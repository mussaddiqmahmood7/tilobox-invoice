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
 * Bordered — an explicit frame around the whole document with ruled cells,
 * the way tax-office and government invoice forms tend to look. The most
 * formal of the set.
 */
export default function Bordered(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;

    return (
        <TemplateFrame ctx={ctx}>
            <div
                className="flex flex-1 flex-col border-2"
                style={{ borderColor: theme.accentColor }}
            >
                <header
                    className="flex flex-wrap items-center justify-between gap-4 border-b-2 p-4"
                    style={{ borderColor: theme.accentColor }}
                >
                    <div className="flex items-center gap-3">
                        <Logo {...ctx} />
                        <p className={`${scale.name} font-bold text-gray-900`}>
                            {data.sender.name}
                        </p>
                    </div>
                    <div
                        className={`${scale.heading} font-bold uppercase tracking-widest`}
                        style={{ color: theme.accentColor }}
                    >
                        {labels.invoiceNumber}
                    </div>
                </header>

                <div className="grid border-b sm:grid-cols-2" style={{ borderColor: theme.accentColor }}>
                    <div
                        className="border-b p-4 sm:border-b-0 sm:border-e"
                        style={{ borderColor: theme.accentColor }}
                    >
                        <PartyBlock ctx={ctx} field="sender" party={data.sender} heading={labels.from} />
                    </div>
                    <div className="p-4">
                        <PartyBlock
                            ctx={ctx}
                            field="receiver"
                            party={data.receiver}
                            heading={labels.billTo}
                        />
                    </div>
                </div>

                <div
                    className="border-b p-4"
                    style={{ borderColor: theme.accentColor }}
                >
                    <DocumentMeta ctx={ctx} align="left" />
                </div>

                <div className="p-4">
                    <ItemsTable ctx={ctx} />
                </div>

                <div
                    className="border-t p-4"
                    style={{ borderColor: theme.accentColor }}
                >
                    <div className="flex justify-end">
                        <div className="w-full sm:w-1/2">
                            <TotalsBlock ctx={ctx} />
                        </div>
                    </div>
                </div>

                <div
                    className="mt-auto grid gap-4 border-t p-4 sm:grid-cols-3"
                    style={{ borderColor: theme.accentColor }}
                >
                    <NotesBlock ctx={ctx} />
                    <PaymentBlock ctx={ctx} />
                    <div className="space-y-3">
                        <SignatureBlock ctx={ctx} />
                        <ContactFooter ctx={ctx} />
                    </div>
                </div>
            </div>
        </TemplateFrame>
    );
}
