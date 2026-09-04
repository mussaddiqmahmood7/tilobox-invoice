"use client";

// Contexts
import { useWizard } from "@/contexts/WizardContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

// Components
import { BaseButton } from "@/app/components";

// Steps
import { WIZARD_STEPS } from "@/lib/wizardSteps";

// Icons
import { ArrowLeft, ArrowRight } from "lucide-react";

const WizardNavigation = () => {
    const { activeStep, isFirstStep, isLastStep, previousStep, nextStep } =
        useWizard();

    const { _t } = useTranslationContext();

    const nextLabel = WIZARD_STEPS[activeStep + 1]
        ? _t(`form.wizard.${WIZARD_STEPS[activeStep + 1].labelKey}`)
        : null;

    /*
     * A single hairline instead of the bordered footer this used to sit in.
     * "Next" is the one obvious action on every step except the last, where the
     * primary action becomes Generate PDF in the action bar.
     */
    // Tighter in the rail: `mt-8` plus `pt-5` is 52px of nothing between the
    // last field and the Next button, and the rail is short on height.
    return (
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5 shell:mt-5 shell:pt-4">
            {!isFirstStep ? (
                <BaseButton
                    variant="ghost"
                    tooltipLabel={_t("form.wizard.backTooltip")}
                    onClick={previousStep}
                >
                    <ArrowLeft className="h-4 w-4" />
                    {_t("form.wizard.back")}
                </BaseButton>
            ) : (
                // Keeps "Next" right-aligned on the first step
                <span />
            )}

            {!isLastStep && (
                <div className="flex items-center gap-3">
                    {/*
                     * Names what comes next. The stepper showed numbers only,
                     * so there was no way to know what the next section was
                     * without going there. Hidden on the narrowest screens,
                     * where it would push the button off the row.
                     */}
                    {nextLabel && (
                        <span className="hidden text-sm text-muted-foreground @xl:inline">
                            {_t("form.wizard.upNext")}: {nextLabel}
                        </span>
                    )}

                    <BaseButton
                        tooltipLabel={_t("form.wizard.nextTooltip")}
                        onClick={nextStep}
                    >
                        {_t("form.wizard.next")}
                        <ArrowRight className="h-4 w-4" />
                    </BaseButton>
                </div>
            )}
        </div>
    );
};

export default WizardNavigation;
