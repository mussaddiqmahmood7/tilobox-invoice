"use client";

import { useMemo, useState } from "react";

// Next
import Link from "next/link";
import Image from "next/image";

// Assets
import Logo from "@/public/assets/img/invoify-logo.svg";

// ShadCn
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

// Components
import {
    BaseButton,
    DevDebug,
    LanguageSelector,
    ThemeSwitcher,
} from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { Settings2 } from "lucide-react";

const BaseNavbar = () => {
    const devEnv = useMemo(() => {
        return process.env.NODE_ENV === "development";
    }, []);

    const [menuOpen, setMenuOpen] = useState(false);

    const { _t } = useTranslationContext();

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <nav className="container flex h-16 items-center justify-between gap-4">
                <Link href="/" className="flex shrink-0 items-center">
                    <Image
                        src={Logo}
                        alt="Invoify Logo"
                        width={887}
                        height={294}
                        loading="eager"
                        priority
                        className="h-9 w-auto sm:h-10"
                    />
                </Link>

                {/* ? DEV Only */}
                {devEnv && (
                    <div className="hidden lg:block">
                        <DevDebug />
                    </div>
                )}

                {/* Desktop controls */}
                <div className="hidden items-center gap-2 sm:flex">
                    <LanguageSelector />
                    <ThemeSwitcher />
                </div>

                {/*
                 * Below sm the language select alone is wider than the space
                 * left beside the logo, so both controls move into a sheet.
                 */}
                <div className="flex items-center gap-1 sm:hidden">
                    <ThemeSwitcher />
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger asChild>
                            <BaseButton
                                variant="ghost"
                                size="icon"
                                aria-label={_t("navbar.openSettings")}
                            >
                                <Settings2 className="h-5 w-5" />
                            </BaseButton>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[85vw] max-w-sm">
                            <SheetHeader className="mb-6">
                                <SheetTitle>
                                    {_t("navbar.settings")}
                                </SheetTitle>
                            </SheetHeader>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {_t("navbar.language")}
                                    </span>
                                    <LanguageSelector variant="block" />
                                </div>

                                {devEnv && <DevDebug />}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>
        </header>
    );
};

export default BaseNavbar;
