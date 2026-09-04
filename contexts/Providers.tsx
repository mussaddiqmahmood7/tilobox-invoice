"use client";

import React, { useEffect } from "react";

// RHF
import { FormProvider, useForm } from "react-hook-form";

// Zod
import { zodResolver } from "@hookform/resolvers/zod";

// Schema
import { InvoiceSchema } from "@/lib/schemas";

// Radix
import { DirectionProvider } from "@radix-ui/react-direction";

// Next Intl
import { useLocale } from "next-intl";

// Context
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { InvoiceContextProvider } from "@/contexts/InvoiceContext";
import { ChargesContextProvider } from "@/contexts/ChargesContext";

// Storage
import { readSecure } from "@/lib/secureStore";

// Types
import { InvoiceType } from "@/types";

// Variables
import {
  FORM_DEFAULT_VALUES,
  LOCAL_STORAGE_INVOICE_DRAFT_KEY,
  dirForLocale,
} from "@/lib/variables";

// Helpers
/**
 * Restores the saved draft. Async because the draft is encrypted at rest —
 * see lib/secureStore. It was already read in a mount effect rather than
 * during render, so awaiting it changes when the form repopulates by a
 * microtask, not which paint it lands in.
 */
const readDraft = async (): Promise<InvoiceType | null> => {
  /*
   * Read loosely, then revive. The stored dates are ISO strings and the form
   * wants Date objects, so this deliberately does not read as InvoiceType —
   * the whole point of this step is that the parsed value does not match the
   * type yet.
   */
  const parsed = await readSecure<{
    details?: { invoiceDate?: unknown; dueDate?: unknown };
  }>(LOCAL_STORAGE_INVOICE_DRAFT_KEY);
  if (!parsed) return null;

  // revive dates
  if (parsed.details) {
    if (parsed.details.invoiceDate)
      parsed.details.invoiceDate = new Date(
        parsed.details.invoiceDate as string
      );
    if (parsed.details.dueDate)
      parsed.details.dueDate = new Date(parsed.details.dueDate as string);
  }
  return parsed as unknown as InvoiceType;
};

type ProvidersProps = {
  children: React.ReactNode;
};

const Providers = ({ children }: ProvidersProps) => {
  /*
   * Radix reads direction from its own context, not from the document, so
   * without this its menus, popovers and tabs stay left-to-right on an RTL
   * page while everything around them mirrors.
   */
  const dir = dirForLocale(useLocale());

  const form = useForm<InvoiceType>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: FORM_DEFAULT_VALUES,
    /*
     * Default is "onSubmit", which meant `errors` stayed empty until a failed
     * submit — so the wizard could not distinguish "fine" from "not filled in
     * yet". onTouched surfaces problems as the user leaves a field, without
     * shouting at them mid-typing.
     */
    mode: "onTouched",
  });

  // Hydrate once on mount
  useEffect(() => {
    let active = true;
    readDraft().then((draft) => {
      if (active && draft) {
        form.reset(draft, { keepDefaultValues: false });
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DirectionProvider dir={dir}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TranslationProvider>
        <FormProvider {...form}>
          <InvoiceContextProvider>
            <ChargesContextProvider>{children}</ChargesContextProvider>
          </InvoiceContextProvider>
        </FormProvider>
      </TranslationProvider>
    </ThemeProvider>
    </DirectionProvider>
  );
};

export default Providers;
