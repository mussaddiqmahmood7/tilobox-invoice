"use client";

import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";

// Next Intl
import { useLocale } from "next-intl";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// ShadCn
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

// Components
import { BaseButton, DynamicInvoiceTemplate } from "@/app/components";

// Template system
import {
    TEMPLATES,
    DEFAULT_TEMPLATE_ID,
    getTemplateEntry,
} from "@/app/components/templates/invoice-pdf/registry";
import {
    ACCENT_PRESETS,
    DEFAULT_INVOICE_THEME,
    INVOICE_FONTS,
    resolveTheme,
    type InvoiceDensity,
    type InvoiceFontId,
    type InvoiceTheme,
} from "@/app/components/templates/invoice-pdf/invoiceTheme";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { Check, ChevronDown, LayoutTemplate } from "lucide-react";

// Types
import type { InvoiceType } from "@/types";

/**
 * Miniature of a template, rendered from the real component.
 *
 * Deliberately a live render rather than a pre-generated PNG. The plan called
 * for screenshotting each template through Puppeteer at build time, but that
 * needs a running server to render against and produces thirteen binaries that
 * go stale the moment a layout changes. Scaling the actual component down is
 * always accurate, needs no build step, and costs one static render each.
 */
const TemplatePreview = memo(function TemplatePreview({
    values,
    templateId,
    locale,
    scale = 0.34,
    height = 250,
}: {
    values: InvoiceType;
    templateId: number;
    locale: string;
    scale?: number;
    height?: number;
}) {
    const previewValues = useMemo(
        () => ({
            ...values,
            details: { ...values.details, pdfTemplate: templateId },
        }),
        [values, templateId]
    );

    return (
        <div
            className="pointer-events-none overflow-hidden bg-white"
            style={{ height }}
            aria-hidden="true"
        >
            <div
                style={{
                    width: `${100 / scale}%`,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                }}
            >
                <DynamicInvoiceTemplate {...previewValues} locale={locale} />
            </div>
        </div>
    );
});

/**
 * Trailing debounce for the custom colour picker. Long enough that a drag
 * produces a handful of commits rather than dozens, short enough that letting
 * go feels immediate.
 */
const ACCENT_COMMIT_DELAY_MS = 140;

type ThemeControlProps = {
    theme: InvoiceTheme;
    setTheme: (patch: Partial<InvoiceTheme>) => void;
    /**
     * `row` is the dialog header, where the three controls sit side by side.
     * `list` is a chip's dropdown, where a vertical list of named options with
     * a tick on the current one is the shape people expect of a menu.
     */
    layout?: "row" | "list";
};

/**
 * Accent colour: eight presets plus a native colour input.
 *
 * The custom input is debounced. `<input type="color">` streams `change`
 * events continuously while the user drags around the picker — dozens per
 * second — and each one used to commit to form state, re-rendering thirteen
 * complete invoice templates. The swatch is driven by local state so it tracks
 * the pointer with no lag, and the form is written on a trailing timer.
 * Presets commit immediately: one discrete click, not a drag.
 */
const AccentControl = ({ theme, setTheme }: ThemeControlProps) => {
    const { _t } = useTranslationContext();

    const [draftAccent, setDraftAccent] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pending = useRef<string | null>(null);

    // The cleanup below must not re-run when `setTheme` changes identity, so it
    // reads the latest one through a ref rather than taking it as a dependency.
    const setThemeRef = useRef(setTheme);
    setThemeRef.current = setTheme;

    const commitAccent = useCallback((value: string) => {
        setDraftAccent(value);
        pending.current = value;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            pending.current = null;
            setThemeRef.current({ accentColor: value });
            setDraftAccent(null);
        }, ACCENT_COMMIT_DELAY_MS);
    }, []);

    /*
     * Flush, don't drop.
     *
     * This control now lives in a popover as well as in the dialog, and a
     * popover closes on any outside click — including the one that lands right
     * after you let go of the colour picker. Clearing the timer alone would
     * silently discard the colour the user just chose.
     */
    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
            if (pending.current !== null) {
                setThemeRef.current({ accentColor: pending.current });
            }
        },
        []
    );

    const shownAccent = draftAccent ?? theme.accentColor;

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {ACCENT_PRESETS.map((preset) => (
                <button
                    key={preset.value}
                    type="button"
                    title={preset.name}
                    aria-label={preset.name}
                    aria-pressed={theme.accentColor === preset.value}
                    onClick={() => setTheme({ accentColor: preset.value })}
                    className={cn(
                        /*
                         * The hairline is not decoration.
                         *
                         * The Ink preset is #111827 — rgb(17, 24, 39) — and the
                         * dark popover it sits on is hsl(235 27% 12%), which is
                         * rgb(22, 23, 39). A contrast ratio of about 1.02:1: an
                         * unselected Ink swatch was simply not there in dark
                         * mode. A ring the opposite way round from the surface
                         * gives every swatch an edge on either theme.
                         */
                        "h-6 w-6 rounded-full border-2 ring-1 ring-inset ring-black/15 transition-transform hover:scale-110 dark:ring-white/25",
                        theme.accentColor === preset.value
                            ? "border-foreground"
                            : "border-transparent"
                    )}
                    style={{ backgroundColor: preset.value }}
                />
            ))}
            <label
                className="ms-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground"
                title={_t("gallery.customColor")}
                style={
                    draftAccent
                        ? {
                              backgroundColor: draftAccent,
                              // Same reason as the presets: a custom near-black
                              // needs an edge to be seen at all in dark mode.
                              borderColor: "transparent",
                              boxShadow: "inset 0 0 0 1px rgb(127 127 127 / 0.45)",
                          }
                        : undefined
                }
            >
                {draftAccent ? "" : "+"}
                <input
                    type="color"
                    className="sr-only"
                    value={shownAccent}
                    onChange={(e) => commitAccent(e.target.value)}
                />
            </label>
        </div>
    );
};

/**
 * Shared shape for the font and density pickers: a row of pills in the dialog,
 * a ticked list in a dropdown.
 */
function OptionSet<T extends string>({
    options,
    value,
    onSelect,
    layout = "row",
    optionStyle,
}: {
    options: { id: T; label: string }[];
    value: T;
    onSelect: (id: T) => void;
    layout?: "row" | "list";
    optionStyle?: (id: T) => React.CSSProperties | undefined;
}) {
    if (layout === "list") {
        return (
            <div className="flex flex-col">
                {options.map((option) => {
                    const isActive = option.id === value;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onSelect(option.id)}
                            aria-pressed={isActive}
                            className={cn(
                                "flex items-center justify-between gap-4 rounded-md px-2 py-1.5 text-start text-sm transition-colors",
                                isActive
                                    ? "bg-primary/10 font-medium text-primary"
                                    : "hover:bg-muted"
                            )}
                            style={optionStyle?.(option.id)}
                        >
                            <span className="truncate">{option.label}</span>
                            {isActive && (
                                <Check className="h-3.5 w-3.5 shrink-0" />
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-1">
            {options.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelect(option.id)}
                    aria-pressed={option.id === value}
                    className={cn(
                        "rounded-md border px-2.5 py-1 text-xs transition-colors",
                        option.id === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                    )}
                    style={optionStyle?.(option.id)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

const FontControl = ({ theme, setTheme, layout }: ThemeControlProps) => (
    <OptionSet
        layout={layout}
        value={theme.fontId}
        onSelect={(fontId) => setTheme({ fontId })}
        options={INVOICE_FONTS.map((font) => ({
            id: font.id as InvoiceFontId,
            label: font.name,
        }))}
        // Each option is set in the face it names.
        optionStyle={(id) => ({
            fontFamily: INVOICE_FONTS.find((font) => font.id === id)?.stack,
        })}
    />
);

const DensityControl = ({ theme, setTheme, layout }: ThemeControlProps) => {
    const { _t } = useTranslationContext();

    // Ordered smallest to largest, so the row reads as a scale.
    const densities: { id: InvoiceDensity; label: string }[] = [
        { id: "compact", label: _t("gallery.compact") },
        { id: "comfortable", label: _t("gallery.comfortable") },
        { id: "spacious", label: _t("gallery.spacious") },
    ];

    return (
        <OptionSet
            layout={layout}
            value={theme.density}
            onSelect={(density) => setTheme({ density })}
            options={densities}
        />
    );
};

/**
 * One chip and its dropdown.
 *
 * These used to open the template dialog, so "Density · Comfortable" led to a
 * modal whose main content was thirteen template thumbnails. Only the template
 * chip still opens it — a grid of thirteen live miniatures is the one control
 * here that needs the room.
 *
 * `content` is given a `close` callback rather than a static node: font and
 * density are one-of-N choices and should dismiss on pick, while the accent
 * palette carries a colour picker you drag, so it stays put.
 */
const ChipMenu = ({
    className,
    label,
    value,
    title,
    content,
}: {
    className: string;
    label: string;
    value: ReactNode;
    title: string;
    content: (close: () => void) => ReactNode;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button type="button" className={className} title={title}>
                    {label}
                    {value}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto min-w-[10rem] p-2">
                <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                {content(() => setOpen(false))}
            </PopoverContent>
        </Popover>
    );
};

type TemplateGalleryProps = {
    /**
     * `field` is the labelled thumbnail inside the Details step, used below xl.
     * `chips` is the pill row above the invoice in the desktop preview
     * toolbar, where option B puts template, accent and density.
     *
     * One component either way, so both entry points share a single dialog
     * instance rather than mounting two.
     */
    variant?: "field" | "chips";
};

const TemplateGallery = ({ variant = "field" }: TemplateGalleryProps) => {
    const { control, setValue, getValues } = useFormContext<InvoiceType>();
    const { _t } = useTranslationContext();
    const locale = useLocale();

    const [open, setOpen] = useState(false);

    /*
     * The gallery renders thirteen full invoice templates at once. Feeding them
     * live form values meant every keystroke re-rendered all thirteen, and the
     * re-render triggered by picking a template interrupted the dialog's exit
     * animation — leaving a phantom overlay with `pointer-events: none` on the
     * body, i.e. a frozen page.
     *
     * The miniatures are illustrative, so they run off a snapshot taken when
     * the dialog opens. Only the theme is live, because changing it is the one
     * thing the previews exist to show.
     */
    const [snapshot, setSnapshot] = useState<InvoiceType | null>(null);

    /*
     * Narrow subscription. This was `useWatch({ control })` with no name — a
     * full-form watch that re-rendered the gallery on every keystroke anywhere
     * in the invoice, to read two fields. The component is permanently mounted
     * in the details step, so that cost was paid constantly.
     */
    const [activeIdRaw, themeRaw] = useWatch({
        control,
        name: ["details.pdfTemplate", "details.theme"],
    });

    const activeId = activeIdRaw ?? DEFAULT_TEMPLATE_ID;

    /*
     * Memoised on the three primitives, not on `themeRaw`.
     *
     * resolveTheme returns a fresh object literal every call, so an unmemoised
     * `theme` gave `previewBase` a new identity on every render — which meant
     * the `memo` on TemplatePreview never hit and all thirteen miniatures
     * re-rendered for reasons entirely unrelated to the theme.
     */
    const theme = useMemo(
        () => resolveTheme(themeRaw),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [themeRaw?.accentColor, themeRaw?.fontId, themeRaw?.density]
    );

    /*
     * The trigger thumbnail is 64px tall at 0.12 scale — nothing typed into the
     * form is legible in it. It refreshes when the template or theme changes,
     * which is all it exists to show, rather than re-rendering a whole invoice
     * template per character.
     */
    const [triggerValues, setTriggerValues] = useState<InvoiceType | null>(null);

    useEffect(() => {
        setTriggerValues(getValues());
    }, [activeId, theme.accentColor, theme.fontId, theme.density, getValues]);

    const activeName =
        getTemplateEntry(activeId)?.name ??
        getTemplateEntry(DEFAULT_TEMPLATE_ID)!.name;

    const previewBase = useMemo<InvoiceType | null>(() => {
        if (!snapshot) return null;
        return {
            ...snapshot,
            details: { ...snapshot.details, theme },
        };
    }, [snapshot, theme]);

    const handleOpenChange = (next: boolean) => {
        if (next) setSnapshot(getValues());
        setOpen(next);
    };

    const setTheme = useCallback(
        (patch: Partial<InvoiceTheme>) => {
            setValue(
                "details.theme",
                { ...theme, ...patch },
                { shouldDirty: true }
            );
        },
        [setValue, theme]
    );

    const densityLabel = {
        compact: _t("gallery.compact"),
        comfortable: _t("gallery.comfortable"),
        spacious: _t("gallery.spacious"),
    }[theme.density];

    const fontLabel =
        INVOICE_FONTS.find((f) => f.id === theme.fontId)?.name ??
        INVOICE_FONTS[0].name;

    /*
     * The chip row above the invoice, as in option B.
     *
     * Each chip names *what it controls* before naming its value —
     * "Template · Classic", not "Classic" — and carries a chevron, because a
     * chip that only reads "Classic" tells you what the template is and
     * nothing about it being yours to change. That is the mockup's own wording.
     */
    const chip =
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:bg-muted hover:text-foreground";

    const chipValue = "font-medium text-foreground";
    const chipSep = <span aria-hidden="true">·</span>;

    const trigger =
        variant === "chips" ? (
            <div
                className="flex flex-wrap items-center gap-1.5"
                aria-label={_t("gallery.appearanceControls")}
            >
                <button
                    type="button"
                    className={chip}
                    onClick={() => handleOpenChange(true)}
                    title={_t("gallery.changeTemplate")}
                >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    {_t("gallery.templateLabel")}
                    {chipSep}
                    <span className={chipValue}>{activeName}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                </button>

                {/*
                 * The swatch *is* this chip's value, so there is no text after
                 * the separator. Pairing "Accent" with the font name — as an
                 * earlier version did — promised the accent and then showed
                 * something else.
                 */}
                <ChipMenu
                    className={chip}
                    label={_t("gallery.accent")}
                    title={_t("gallery.changeAppearance")}
                    value={
                        <span
                            // See the preset swatches: a dark accent on the
                            // dark chip is otherwise invisible.
                            className="h-3 w-3 rounded-full ring-1 ring-inset ring-black/20 dark:ring-white/30"
                            style={{ backgroundColor: theme.accentColor }}
                        />
                    }
                    content={() => (
                        <div className="px-2 pb-1">
                            <AccentControl theme={theme} setTheme={setTheme} />
                        </div>
                    )}
                />

                <ChipMenu
                    className={chip}
                    label={_t("gallery.font")}
                    title={_t("gallery.changeAppearance")}
                    value={
                        <>
                            {chipSep}
                            <span className={chipValue}>{fontLabel}</span>
                        </>
                    }
                    content={(close) => (
                        <FontControl
                            theme={theme}
                            setTheme={(patch) => {
                                setTheme(patch);
                                close();
                            }}
                            layout="list"
                        />
                    )}
                />

                <ChipMenu
                    className={chip}
                    label={_t("gallery.density")}
                    title={_t("gallery.changeAppearance")}
                    value={
                        <>
                            {chipSep}
                            <span className={chipValue}>{densityLabel}</span>
                        </>
                    }
                    content={(close) => (
                        <DensityControl
                            theme={theme}
                            setTheme={(patch) => {
                                setTheme(patch);
                                close();
                            }}
                            layout="list"
                        />
                    )}
                />
            </div>
        ) : (
            <>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {_t("gallery.templateLabel")}
                </p>
                <button
                    type="button"
                    onClick={() => handleOpenChange(true)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border p-2 text-start transition-colors hover:border-primary/60"
                >
                    <div className="w-24 shrink-0 overflow-hidden rounded border border-border">
                        {triggerValues && (
                            <TemplatePreview
                                values={triggerValues}
                                templateId={activeId}
                                locale={locale}
                                scale={0.12}
                                height={64}
                            />
                        )}
                    </div>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                            {activeName}
                        </span>
                        <span className="block text-xs text-primary">
                            {_t("gallery.changeTemplate")}
                        </span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
            </>
        );

    return (
        <div className={variant === "chips" ? "min-w-0" : undefined}>
            {trigger}

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="flex h-[92dvh] max-w-6xl flex-col gap-0 p-0 sm:max-w-6xl">
                    <DialogHeader className="shrink-0 border-b px-5 py-4 text-start">
                        <DialogTitle>{_t("gallery.title")}</DialogTitle>
                        <DialogDescription>
                            {_t("gallery.description")}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Theme controls — the same three components the chips
                        drop down, laid out as a row. */}
                    <div className="shrink-0 border-b px-5 py-3">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {_t("gallery.accent")}
                                </span>
                                <AccentControl
                                    theme={theme}
                                    setTheme={setTheme}
                                />
                            </div>

                            <Separator
                                orientation="vertical"
                                className="hidden h-6 sm:block"
                            />

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {_t("gallery.font")}
                                </span>
                                <FontControl
                                    theme={theme}
                                    setTheme={setTheme}
                                />
                            </div>

                            <Separator
                                orientation="vertical"
                                className="hidden h-6 sm:block"
                            />

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {_t("gallery.density")}
                                </span>
                                <DensityControl
                                    theme={theme}
                                    setTheme={setTheme}
                                />
                            </div>

                            <BaseButton
                                variant="ghost"
                                size="sm"
                                className="ms-auto text-muted-foreground"
                                onClick={() => setTheme(DEFAULT_INVOICE_THEME)}
                            >
                                {_t("gallery.reset")}
                            </BaseButton>
                        </div>
                    </div>

                    {/* Gallery grid */}
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {TEMPLATES.map((template) => {
                                const isSelected = template.id === activeId;
                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => {
                                            setOpen(false);
                                            setValue(
                                                "details.pdfTemplate",
                                                template.id,
                                                { shouldDirty: true }
                                            );
                                        }}
                                        className={cn(
                                            "group relative overflow-hidden rounded-xl border-2 text-start transition-colors",
                                            isSelected
                                                ? "border-primary"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        {isSelected && (
                                            <span className="absolute end-2 top-2 z-10 rounded-full bg-primary p-1 text-primary-foreground shadow-card">
                                                <Check className="h-3.5 w-3.5" />
                                            </span>
                                        )}

                                        {previewBase && (
                                            <TemplatePreview
                                                values={previewBase}
                                                templateId={template.id}
                                                locale={locale}
                                            />
                                        )}

                                        <div className="border-t border-border bg-card px-3 py-2">
                                            <p className="text-sm font-medium">
                                                {template.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {template.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TemplateGallery;
