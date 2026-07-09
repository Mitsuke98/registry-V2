import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface Step {
  title: string;
  description?: string;
  validate?: () => boolean | string;
}

interface WizardProps {
  steps: Step[];
  onFinish: (values: any) => void;
  onCancel: () => void;
  renderStepContent: (stepIndex: number, setStepValid: (isValid: boolean | string) => void) => React.ReactNode;
}

export const Wizard: React.FC<WizardProps> = ({
  steps,
  onFinish,
  onCancel,
  renderStepContent
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  const setStepValid = (isValid: boolean | string) => {
    if (typeof isValid === 'string') {
      setStepError(isValid);
    } else if (isValid) {
      setStepError(null);
    } else {
      setStepError("Required fields are missing or invalid.");
    }
  };

  const handleNext = () => {
    const stepVal = steps[currentStep].validate ? steps[currentStep].validate!() : true;
    if (stepVal === true) {
      setStepError(null);
      if (currentStep === steps.length - 1) {
        onFinish({});
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      setStepError(typeof stepVal === 'string' ? stepVal : "Step validation failed.");
    }
  };

  const handleBack = () => {
    setStepError(null);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card shadow-md flex flex-col overflow-hidden">
      {/* Header Stepper */}
      <div className="bg-muted/40 border-b border-border px-6 py-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-muted-foreground/30 text-xs">/</span>}
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span
                    className={`size-5 rounded-full flex items-center justify-center font-mono ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isActive
                        ? 'bg-primary text-primary-foreground animate-pulse'
                        : 'bg-muted border border-border text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="size-3" /> : idx + 1}
                  </span>
                  <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>
                    {step.title}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-8 flex-1 min-h-[300px]">
        {renderStepContent(currentStep, setStepValid)}

        {stepError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {stepError}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="border-t border-border bg-muted/20 px-8 py-4 flex items-center justify-between select-none">
        <button
          onClick={currentStep === 0 ? onCancel : handleBack}
          className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-accent/60 text-xs font-semibold cursor-pointer"
        >
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </button>

        <button
          onClick={handleNext}
          className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold px-4 h-9 rounded-lg transition-colors cursor-pointer"
        >
          {currentStep === steps.length - 1 ? 'Submit' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

// Pipeline progress step helper component
export const PipelineProgress: React.FC<{
  steps: { label: string; subLabel: string; status: 'pending' | 'loading' | 'success' | 'failed' }[];
}> = ({ steps }) => {
  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/10">
          <div className="shrink-0 mt-0.5">
            {step.status === 'loading' && <Loader2 className="size-4 text-primary animate-spin" />}
            {step.status === 'success' && <Check className="size-4 text-emerald-500 font-bold" />}
            {step.status === 'pending' && <span className="size-4 rounded-full border border-border bg-background block" />}
            {step.status === 'failed' && <span className="size-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold">!</span>}
          </div>
          <div>
            <h5 className="text-xs font-semibold text-foreground leading-none">{step.label}</h5>
            <span className="text-[10px] text-muted-foreground mt-1 block">{step.subLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
