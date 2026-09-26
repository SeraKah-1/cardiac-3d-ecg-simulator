/**
 * WelcomeOnboardingModal: First-Time User Orientation & Persona Gate Modal
 * Solves initial cognitive overload by offering a choice between a 1-minute
 * guided interactive spotlight tour (for students/beginners) or immediate self-exploration (for clinicians).
 * Features a 4-pillar overview of the medical workstation.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  FileText,
  GraduationCap,
  Layers,
  Sparkles,
  Stethoscope,
  X,
  Zap,
} from 'lucide-react';
import { UserRoleProfile } from '../../engine/storage/onboardingStorage';
import { useLocale } from '../../locales/useLocale';

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: (role: UserRoleProfile) => void;
  onDismiss: (role: UserRoleProfile) => void;
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  onDismiss,
}) => {
  const { t } = useLocale();
  const [doNotShowAgain, setDoNotShowAgain] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleStartStudentTour = () => {
    onStartTour('STUDENT');
  };

  const handleStartDirectExploration = () => {
    onDismiss('CLINICIAN');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/70 backdrop-blur-xs font-sans animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden text-stone-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Top Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-purple-950 to-blue-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={t.common.closeEsc}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
              <Activity className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/15 rounded text-purple-200">
                {t.welcome.badge}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight mt-0.5">
                {t.welcome.title}
              </h2>
            </div>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed max-w-xl">
            {t.welcome.subtitle}
          </p>
        </div>

        {/* 2. Four Pillars Overview Bento Grid */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <span className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-wider block mb-2">
              {t.welcome.pillarsHeader}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Pillar 1 */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{t.welcome.pillar1Title}</h3>
                  <p className="text-[11px] text-stone-600 leading-snug mt-0.5">
                    {t.welcome.pillar1Desc}
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{t.welcome.pillar2Title}</h3>
                  <p className="text-[11px] text-stone-600 leading-snug mt-0.5">
                    {t.welcome.pillar2Desc}
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{t.welcome.pillar3Title}</h3>
                  <p className="text-[11px] text-stone-600 leading-snug mt-0.5">
                    {t.welcome.pillar3Desc}
                  </p>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{t.welcome.pillar4Title}</h3>
                  <p className="text-[11px] text-stone-600 leading-snug mt-0.5">
                    {t.welcome.pillar4Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Persona Gate Action Selection */}
          <div className="pt-2 border-t border-stone-200 space-y-2">
            <span className="text-[11px] font-bold text-stone-700 block">
              {t.welcome.choicesHeader}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Guided Tour (Recommended) */}
              <button
                type="button"
                onClick={handleStartStudentTour}
                className="p-3.5 rounded-xl border-2 border-purple-600 bg-purple-50/50 hover:bg-purple-100/70 text-left transition shadow-xs group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white shadow-2xs">
                      <Sparkles className="w-3 h-3" />
                      <span>{t.welcome.studentBadge}</span>
                    </span>
                    <GraduationCap className="w-4 h-4 text-purple-700" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-purple-900 transition">
                    {t.welcome.studentTitle}
                  </h4>
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                    {t.welcome.studentDesc}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-bold text-purple-700 group-hover:translate-x-0.5 transition-transform">
                  <span>{t.welcome.studentAction}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Option B: Direct Exploration */}
              <button
                type="button"
                onClick={handleStartDirectExploration}
                className="p-3.5 rounded-xl border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-left transition shadow-2xs group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                      <span>{t.welcome.clinicianBadge}</span>
                    </span>
                    <Stethoscope className="w-4 h-4 text-stone-500" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-stone-900 transition">
                    {t.welcome.clinicianTitle}
                  </h4>
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                    {t.welcome.clinicianDesc}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-stone-600 group-hover:text-stone-900 transition">
                  <span>{t.welcome.clinicianAction}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Modal Bottom Footer */}
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={doNotShowAgain}
              onChange={(e) => setDoNotShowAgain(e.target.checked)}
              className="rounded border-stone-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span className="text-[11px] text-stone-600">{t.welcome.doNotShowAgain}</span>
          </label>

          <span className="text-[10px] font-mono text-stone-600 hidden sm:inline">
            {t.welcome.relaunchHint}
          </span>
        </div>
      </div>
    </div>
  );
};
