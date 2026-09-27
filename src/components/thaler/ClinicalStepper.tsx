/**
 * ClinicalStepper: Clean, Accessible 9-Step Diagnostic Navigation Bar
 * Replaces bloated, microscopic Mermaid diagrams with a human-readable,
 * responsive horizontal progress stepper with real typography.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useRef, useEffect } from 'react';
import { TutorialStep } from '../../engine/clinical/thaler/thalerTypes';
import { useLocale } from '../../locales/useLocale';

interface ClinicalStepperProps {
  steps: TutorialStep[];
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
}

export const ClinicalStepper: React.FC<ClinicalStepperProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
}) => {
  const { t, locale } = useLocale();
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active step into view gently on small viewports
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentStepIndex]);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="w-full bg-stone-100/90 border-b border-stone-200 select-none px-2 py-1.5 shrink-0">
      <div
        ref={containerRef}
        className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
      >
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          const stepNum = (step.stepNumber && step.stepNumber > 0) ? step.stepNumber : (idx + 1);

          return (
            <button
              key={idx}
              ref={isActive ? activeItemRef : null}
              onClick={() => onSelectStep(idx)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs transition cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-blue-700'
                  : isCompleted
                  ? 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium'
                  : 'bg-white/80 hover:bg-white text-stone-600 border border-stone-300 font-normal'
              }`}
              title={t.common.jumpToStep(stepNum, locale === 'en' && step.stepNameEn ? step.stepNameEn : step.stepName)}
            >
              {/* Step Status Icon / Number */}
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive
                    ? 'bg-white text-blue-700'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {isCompleted ? '✓' : stepNum}
              </span>

              {/* Step Name */}
              <span className="text-[11px] truncate max-w-[130px] sm:max-w-[170px]">
                {locale === 'en' && step.stepNameEn ? step.stepNameEn : step.stepName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
