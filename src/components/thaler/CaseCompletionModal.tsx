/**
 * CaseCompletionModal: Guided Post-Tutorial Onboarding & Progression Modal
 * Solves the 'what next?' dead-end by providing 3 clear next-step pathways
 * (Next Case, Practice Drill, Diagnostic Flowchart) and clinical case recap.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useEffect } from 'react';
import { CheckCircle2, ArrowRight, Activity, GitFork, RotateCcw, X, Award, Stethoscope, Star } from 'lucide-react';
import { EKGCase } from '../../engine/clinical/thaler/thalerTypes';
import { FeedbackStorage } from '../../engine/storage/feedbackStorage';
import { useLocale } from '../../locales/useLocale';

interface CaseCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCase: EKGCase;
  nextCase?: EKGCase;
  onSelectNextCase: () => void;
  onGoToPractice: () => void;
  onOpenFlowchart: () => void;
  onRestartCase: () => void;
  onOpenFeedback?: () => void;
}

export const CaseCompletionModal: React.FC<CaseCompletionModalProps> = ({
  isOpen,
  onClose,
  currentCase,
  nextCase,
  onSelectNextCase,
  onGoToPractice,
  onOpenFlowchart,
  onRestartCase,
  onOpenFeedback,
}) => {
  const { t, locale } = useLocale();

  useEffect(() => {
    if (isOpen && currentCase) {
      FeedbackStorage.recordTutorialCaseCompleted(currentCase.id);
    }
  }, [isOpen, currentCase]);

  if (!isOpen) return null;

  const isFoundation = currentCase.category === 'NORMAL' && currentCase.id.includes('foundations');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-xl max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Banner */}
        <div className="bg-linear-to-r from-emerald-600 to-teal-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full text-emerald-100 hover:text-white hover:bg-emerald-800/40 transition cursor-pointer"
            aria-label={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/25 rounded">
                {isFoundation ? t.completion.foundationDoneBadge : t.completion.caseDoneBadge}
              </span>
              <h3 className="text-lg font-bold text-white leading-tight mt-1">
                {isFoundation ? t.completion.foundationDoneTitle : t.completion.caseDoneTitle(currentCase.caseCode)}
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Body: Summary & Guided Pathways */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Diagnostic Takeaway Card */}
          <div className="bg-stone-50 rounded-lg p-3.5 border border-stone-200 text-xs">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.completion.summaryHeader}</span>
            </div>
            <div className="text-sm font-bold text-stone-900">
              {locale === 'en' && (currentCase.titleEn || currentCase.medicalTermEn) ? (currentCase.titleEn || currentCase.medicalTermEn) : currentCase.title}
            </div>
            <p className="text-stone-600 mt-1 leading-relaxed text-[11px]">
              {locale === 'en' && currentCase.metrics.rhythmDescriptionEn ? currentCase.metrics.rhythmDescriptionEn : currentCase.metrics.rhythmDescription}
            </p>
          </div>

          {/* Three Guided Next Action Pathways */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              {t.completion.nextStepsHeader}
            </div>

            {/* Pathway 1: Next Case */}
            {nextCase && (
              <button
                onClick={onSelectNextCase}
                className="w-full flex items-center justify-between p-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition group cursor-pointer text-left"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-[13px]">
                    <span>{t.completion.proceedNextCase}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-[11px] text-blue-100 font-normal">
                    {nextCase.caseCode}: {locale === 'en' && (nextCase.titleEn || nextCase.medicalTermEn) ? (nextCase.titleEn || nextCase.medicalTermEn) : nextCase.title}
                  </div>
                </div>
                <div className="hidden sm:block shrink-0 px-2 py-1 bg-white/20 rounded text-[10px] font-mono">
                  {nextCase.category}
                </div>
              </button>
            )}

            {/* Pathway 2: Practice Drill */}
            <button
              onClick={onGoToPractice}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-semibold text-xs transition shadow-2xs group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-600">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-stone-900">
                    {t.completion.testInPracticeTitle}
                  </div>
                  <div className="text-[11px] text-stone-500 font-normal">
                    {t.completion.testInPracticeSub}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Pathway 3: Decision Flowchart */}
            <button
              onClick={onOpenFlowchart}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-semibold text-xs transition shadow-2xs group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-teal-600">
                  <GitFork className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-stone-900">
                    {t.completion.openFlowchartTitle}
                  </div>
                  <div className="text-[11px] text-stone-500 font-normal">
                    {t.completion.openFlowchartSub}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <button
            onClick={onRestartCase}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.completion.reviewCaseBtn}</span>
          </button>

          {onOpenFeedback && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFeedback();
              }}
              className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{t.completion.giveFeedbackBtn}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-sans font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 rounded transition cursor-pointer"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
