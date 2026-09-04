"use client";

import React from "react";
import { usePwa } from "@/contexts/PwaContext";
import { Download, RefreshCw, WifiOff } from "lucide-react";

export default function PwaStatusBadge() {
    const { isOnline, isInstallable, hasUpdate, promptInstall, updateApp } = usePwa();

    return (
        <div className="flex items-center gap-2">
            {/* 1. Offline Mode Indicator */}
            {!isOnline && (
                <div
                    role="status"
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400"
                    title="You are currently working offline. Invoices and drafts are stored safely in your browser."
                >
                    <WifiOff className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                    <span className="hidden sm:inline">Offline Mode</span>
                </div>
            )}

            {/* 2. New Version Update Prompt */}
            {hasUpdate && (
                <button
                    type="button"
                    onClick={updateApp}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                    title="A new version of TiloBox Invoice is available. Click to refresh."
                >
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Update Ready</span>
                </button>
            )}

            {/* 3. PWA Install App Button */}
            {isInstallable && (
                <button
                    type="button"
                    onClick={() => promptInstall()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                    title="Install TiloBox Invoice as a standalone app on your desktop or phone"
                >
                    <Download className="h-3.5 w-3.5" />
                    <span>Install App</span>
                </button>
            )}
        </div>
    );
}
