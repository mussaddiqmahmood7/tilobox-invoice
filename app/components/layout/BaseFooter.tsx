"use client";

import { useTranslationContext } from "@/contexts/TranslationContext";
import { BrandMark } from "@/app/components/reusables/BrandMark";

// Next Intl
import { Link } from "@/i18n/navigation";

// Icons & Variables
import { Github } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/variables";

const BaseFooter = () => {
    const { _t } = useTranslationContext();

    return (
        // pb clears the sticky MobileActionBar, which only renders below xl
        <footer className="no-print border-t border-border bg-card/30 backdrop-blur-xs">
            <div className="container flex flex-col items-center justify-between gap-4 py-8 pb-28 text-sm text-muted-foreground sm:flex-row xl:pb-8">
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <a
                        href="https://tilobox.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 font-black tracking-tight text-foreground transition-opacity hover:opacity-80"
                    >
                        <BrandMark className="h-6 w-6 rounded-md shadow-xs transition-transform group-hover:scale-105" />
                        <span>
                            Tilo<span className="text-primary">Box</span>
                        </span>
                    </a>
                    <span className="hidden text-border sm:inline">•</span>
                    <p className="text-center sm:text-start text-xs sm:text-sm">
                        Built with open-source love • Based on Invoify • Maintained & Enhanced by{" "}
                        <a
                            href="https://tilobox.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                        >
                            TiloBox
                        </a>
                    </p>
                </div>

                <nav className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
                    <a
                        href={GITHUB_REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                        <Github className="h-3.5 w-3.5" />
                        GitHub Repository
                    </a>
                    <a
                        href="https://tilobox.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                        TiloBox Directory
                    </a>
                    <Link
                        href="/guide"
                        className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                    >
                        {_t("footer.guide")}
                    </Link>
                </nav>
            </div>
        </footer>
    );
};

export default BaseFooter;
