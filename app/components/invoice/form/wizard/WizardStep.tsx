"use client";

import React from "react";

// Contexts
import { useWizard } from "@/contexts/WizardContext";

// Components
import { WizardNavigation, WizardProgress } from "@/app/components";

type WizardStepProps = {
    /** Index of this step, from WIZARD_STEPS. */
    step: number;
    children: React.ReactNode;
};

/**
 * Renders its children only while it is the active step.
 *
 * react-use-wizard did this for us; now that the step lives in our own context
 * the check is explicit. Inactive steps unmount rather than hide, so their
 * fields do not participate in focus order or in any measurement.
 */
const WizardStep = ({ step, children }: WizardStepProps) => {
    const { activeStep } = useWizard();

    if (activeStep !== step) return null;

    return (
        <div className="flex min-h-[18rem] flex-col @2xl:min-h-[22rem]">
            <WizardProgress />
            <div className="flex-1">{children}</div>
            <WizardNavigation />
        </div>
    );
};

export default WizardStep;
