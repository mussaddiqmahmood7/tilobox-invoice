"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

// ShadCn
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { BookOpen, Check, Moon, Sparkles, Sun } from "lucide-react";

export type TiloBoxThemeId =
    | "soft-slate"
    | "cyberpunk-slate"
    | "classic-obsidian"
    | "paper-light";

export interface TiloBoxThemeOption {
    id: TiloBoxThemeId;
    name: string;
    tagline: string;
    mode: "light" | "dark";
    swatchBg: string;
    swatchBorder: string;
    swatchAccent: string;
    icon: typeof Sun;
}

export const TILOBOX_THEMES: TiloBoxThemeOption[] = [
    {
        id: "soft-slate",
        name: "Soft Slate",
        tagline: "Clean light canvas with #0b5fa5 cobalt",
        mode: "light",
        swatchBg: "#f8fafc",
        swatchBorder: "#d0d7de",
        swatchAccent: "#0b5fa5",
        icon: Sun,
    },
    {
        id: "cyberpunk-slate",
        name: "Cyberpunk Slate",
        tagline: "Navy slate #0b0f19 with cyan accents",
        mode: "dark",
        swatchBg: "#0b0f19",
        swatchBorder: "#1e293b",
        swatchAccent: "#38bdf8",
        icon: Moon,
    },
    {
        id: "classic-obsidian",
        name: "Classic Obsidian",
        tagline: "Pure OLED black with monochrome whites",
        mode: "dark",
        swatchBg: "#000000",
        swatchBorder: "#262626",
        swatchAccent: "#fafafa",
        icon: Sparkles,
    },
    {
        id: "paper-light",
        name: "Paper Light",
        tagline: "Warm sepia #faf8f5 with amber accents",
        mode: "light",
        swatchBg: "#faf8f5",
        swatchBorder: "#e7e0d8",
        swatchAccent: "#92400e",
        icon: BookOpen,
    },
];

const THEME_STORAGE_KEY = "tilobox_theme";

export function applyTiloBoxTheme(themeId: TiloBoxThemeId) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.setAttribute("data-theme", themeId);
    root.classList.remove("classic-obsidian", "paper-light");

    if (themeId === "classic-obsidian") {
        root.classList.add("classic-obsidian");
    } else if (themeId === "paper-light") {
        root.classList.add("paper-light");
    }
}

const ThemeSwitcher = () => {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [currentThemeId, setCurrentThemeId] = useState<TiloBoxThemeId>("soft-slate");

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as TiloBoxThemeId | null;
        if (stored && TILOBOX_THEMES.some((t) => t.id === stored)) {
            setCurrentThemeId(stored);
            applyTiloBoxTheme(stored);
        } else {
            const initialId: TiloBoxThemeId =
                resolvedTheme === "dark" ? "cyberpunk-slate" : "soft-slate";
            setCurrentThemeId(initialId);
            applyTiloBoxTheme(initialId);
        }
    }, [resolvedTheme]);

    const handleSelectTheme = (item: TiloBoxThemeOption) => {
        setCurrentThemeId(item.id);
        localStorage.setItem(THEME_STORAGE_KEY, item.id);
        applyTiloBoxTheme(item.id);
        setTheme(item.mode);
        setOpen(false);
    };

    if (!mounted) {
        return (
            <div
                className="h-9 w-9 rounded-full border border-border bg-card"
                aria-hidden="true"
            />
        );
    }

    const activeTheme =
        TILOBOX_THEMES.find((t) => t.id === currentThemeId) ||
        (resolvedTheme === "dark" ? TILOBOX_THEMES[1] : TILOBOX_THEMES[0]);
    const ActiveIcon = activeTheme.icon;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={`Current theme: ${activeTheme.name}. Click to change theme`}
                    className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-sm text-muted-foreground transition-all hover:border-primary/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden",
                        open && "border-primary/60 text-foreground ring-2 ring-primary/20"
                    )}
                >
                    <span
                        className="flex h-4 w-4 items-center justify-center rounded-full border shadow-2xs"
                        style={{
                            backgroundColor: activeTheme.swatchBg,
                            borderColor: activeTheme.swatchBorder,
                        }}
                    >
                        <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: activeTheme.swatchAccent }}
                        />
                    </span>
                    <ActiveIcon className="h-4 w-4" />
                    <span className="hidden text-xs font-semibold sm:inline">
                        {activeTheme.name}
                    </span>
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-64 border-border bg-card p-2 shadow-xl"
            >
                <div className="mb-2 flex items-center justify-between border-b border-border/60 px-2 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        TiloBox Themes
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        Palette
                    </span>
                </div>

                <div className="flex flex-col gap-1">
                    {TILOBOX_THEMES.map((item) => {
                        const isSelected = item.id === currentThemeId;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectTheme(item)}
                                className={cn(
                                    "flex w-full items-center justify-between gap-2.5 rounded-lg p-2 text-left transition-colors",
                                    isSelected
                                        ? "bg-primary/10 font-medium text-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <div
                                        className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border shadow-xs"
                                        style={{
                                            backgroundColor: item.swatchBg,
                                            borderColor: item.swatchBorder,
                                        }}
                                    >
                                        <div
                                            className="h-2.5 w-2.5 rounded-full shadow-xs"
                                            style={{ backgroundColor: item.swatchAccent }}
                                        />
                                    </div>
                                    <div className="flex min-w-0 flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <span className="truncate text-xs font-semibold text-foreground">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="truncate text-[10px] text-muted-foreground">
                                            {item.tagline}
                                        </span>
                                    </div>
                                </div>

                                {isSelected && (
                                    <Check className="h-4 w-4 shrink-0 text-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default ThemeSwitcher;
