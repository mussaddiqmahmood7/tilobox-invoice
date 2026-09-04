"use client";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import { Form } from "@/components/ui/form";

// Components
import {
    InvoiceActions,
    InvoiceForm,
    MobileActionBar,
} from "@/app/components";

// Context
import { useInvoiceContext } from "@/contexts/InvoiceContext";

// Hooks
import useToasts from "@/hooks/useToasts";

// Types
import { InvoiceType } from "@/types";

const InvoiceMain = () => {
    const formContext = useFormContext<InvoiceType>();
    const { handleSubmit } = formContext;

    // Get the needed values from invoice context
    const { onFormSubmit } = useInvoiceContext();

    const { formValidationError } = useToasts();

    return (
        <Form {...formContext}>
            <form onSubmit={handleSubmit(onFormSubmit, formValidationError)}>
                {/*
                 * Mobile-first single column; two columns only at xl, where
                 * there is room for the form and the live preview side by side.
                 * `minmax(0, …)` lets the columns shrink below their content
                 * width instead of forcing the page to scroll horizontally.
                 */}
                {/*
                 * The preview column is deliberately the wider of the two: the
                 * invoice is what the user actually cares about, so it reads as
                 * the hero and the form beside it stays quiet.
                 */}
                {/*
                 * At `shell` (>=1280px wide AND >=800px tall) this becomes an
                 * application shell rather than a document: the region is
                 * pinned to the viewport and each pane scrolls inside itself,
                 * so the page never scrolls sideways past the work. Below that
                 * — including every phone — it stays exactly as it was, a
                 * single column that scrolls normally.
                 *
                 * The height subtracts the 4rem navbar and the 5rem of `md:py`
                 * gutter this main element carries.
                 */}
                <div
                    className={[
                        "grid grid-cols-1 items-start gap-8",
                        /*
                         * 34/66 rather than 44/56. The invoice is the product,
                         * so it gets the room; the form becomes a ~420px rail.
                         * `gap-0` in the shell because the two panes meet at a
                         * border there rather than floating apart.
                         */
                        "xl:grid-cols-[minmax(0,40fr)_minmax(0,60fr)] xl:gap-12",
                        /*
                         * No card. Option B has no frame around the panes —
                         * they meet the window, divided only by the hairline
                         * on the form column. The height subtracts just the
                         * 4rem navbar now, because the page gutter is dropped
                         * at this breakpoint too (see [locale]/page.tsx).
                         */
                        "shell:h-[calc(100dvh-4rem)] shell:grid-cols-[minmax(0,34fr)_minmax(0,66fr)] shell:items-stretch shell:gap-0 shell:overflow-hidden",
                    ].join(" ")}
                >
                    <InvoiceForm />
                    <InvoiceActions />
                </div>

                {/* Sticky Preview / Generate bar, below xl only */}
                <MobileActionBar />
            </form>
        </Form>
    );
};

export default InvoiceMain;
