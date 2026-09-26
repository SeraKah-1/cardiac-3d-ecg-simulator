/**
 * InteractiveSpotlightTour: High-Yield Clinical Coachmark & Spotlight Tour
 * Highlights key regions of the Thaler 12-Lead EKG Workstation one at a time:
 * 1. Hospital-Standard 12-Lead Canvas (Zoom/Pan/Caliper)
 * 2. Clinical Stepper (6-stage sequence)
 * 3. Idiograph Reasoning Panel (Clinical findings & Visual Atlas)
 * 4. Bedside Educational Tools (Pocket cheat sheet, calculators, axis)
 * 5. Case Selector & Mode Switcher (Blinded practice & 3D simulation)
 * Features SVG backdrop masking, adaptive tooltip clamping, and keyboard Escape listener.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { OnboardingStorage } from '../../engine/storage/onboardingStorage';
import { useLocale } from '../../locales/useLocale';

interface TourStep {
  selector: string;
  title: string;
  badge: string;
  description: string;
  tip: string;
  preferredPosition: 'bottom' | 'top' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="ecg-canvas"]',
    title: '1. Kertas EKG 12-Sadapan Berstandar RS',
    badge: 'Kanvas Klinis',
    description:
      'Kertas grid milimeter autentik dengan kalibrasi standar (25 mm/s dan 10 mm/mV). Klik sadapan mana pun untuk fokus pandangan, scroll untuk zoom, atau aktifkan Kaliper Digital untuk marching interval.',
    tip: 'Tips: Tahan tombol Shift saat menggeser kaliper untuk mengunci pergerakan murni horizontal (waktu) atau vertikal (voltase).',
    preferredPosition: 'right',
  },
  {
    selector: '[data-tour="clinical-stepper"]',
    title: '2. Tahapan Pembacaan Sistematis 6-Langkah',
    badge: 'Alur Diagnosis',
    description:
      'Metode sistematis Dr. Malcolm S. Thaler: Kalibrasi, Frekuensi, Irama, Aksis, Interval & Konduksi, hingga Morfologi ST-T & Iskemia.',
    tip: 'Tips: Jangan melompati langkah! Pembacaan terburu-buru adalah penyebab utama salah diagnosis di IGD.',
    preferredPosition: 'bottom',
  },
  {
    selector: '[data-tour="reasoning-panel"]',
    title: '3. Panel Penalaran Klinis (Idiograph)',
    badge: 'Penalaran Medis',
    description:
      'Asisten pembacaan komprehensif: rincian temuan gelombang, kartu Atlas Visual pembanding normal vs varian vs patologis, serta rumus perhitungan KaTeX.',
    tip: 'Tips: Buka kartu komparasi visual untuk membedakan bentuk gelombang fisiologis dengan kelainan kritis.',
    preferredPosition: 'left',
  },
  {
    selector: '[data-tour="educational-tools"]',
    title: '4. Alat Bantu Bedside & Buku Saku',
    badge: 'Instrumen Klinis',
    description:
      'Akses cepat peralatan pendukung: Buku Saku EKG (Shortcut: B), Kalkulator Klinis QTc / LVH / Sgarbossa (Shortcut: C), Roda Aksis Frontal, dan Peta Sadapan koroner.',
    tip: 'Tips: Tekan tombol B di keyboard untuk membuka Buku Saku ringkas kapan saja.',
    preferredPosition: 'bottom',
  },
  {
    selector: '[data-tour="mode-switcher"]',
    title: '5. Bank 21 Kasus & Mode Latihan Mandiri',
    badge: 'Latihan Mandiri',
    description:
      'Jelajahi 21 kasus nyata dalam 4 tingkat kegawatan, uji kemampuan tanpa bocoran diagnosis di Mode Latihan (Practice Drill), atau beralih ke Simulator Jantung 3D.',
    tip: 'Tips: Di Mode Latihan, Anda dapat mengunduh Lembar Kerja OSCE kosong dalam format PDF.',
    preferredPosition: 'bottom',
  },
];

interface InteractiveSpotlightTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveSpotlightTour: React.FC<InteractiveSpotlightTourProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLocale();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const tourSteps: TourStep[] = useMemo(() => {
    const rawSteps = t.tour.steps;
    return TOUR_STEPS.map((s, idx) => ({
      ...s,
      title: rawSteps[idx]?.title || s.title,
      badge: rawSteps[idx]?.badge || s.badge,
      description: rawSteps[idx]?.description || s.description,
      tip: rawSteps[idx]?.tip || s.tip,
    }));
  }, [t.tour.steps]);

  const step = tourSteps[currentStepIndex] || tourSteps[0];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === tourSteps.length - 1;

  // Measure target bounding rect
  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;
    const el = document.querySelector(step.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      // If target element not yet found, fall back to center
      setTargetRect(null);
    }
  }, [isOpen, step.selector]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    const timer = setTimeout(updateTargetRect, 80);
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
      clearTimeout(timer);
    };
  }, [updateTargetRect, currentStepIndex]);

  const handleFinishTour = useCallback(() => {
    OnboardingStorage.completeTour();
    onClose();
  }, [onClose]);

  const handleNextStep = useCallback(() => {
    if (isLastStep) {
      handleFinishTour();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [isLastStep, handleFinishTour]);

  const handlePrevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [isFirstStep]);

  // Keyboard Navigation: Escape to close, Arrows to navigate
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinishTour();
      } else if (e.key === 'ArrowRight' && !isLastStep) {
        handleNextStep();
      } else if (e.key === 'ArrowLeft' && !isFirstStep) {
        handlePrevStep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLastStep, isFirstStep, handleFinishTour, handleNextStep, handlePrevStep]);

  if (!isOpen) return null;

  // Compute tooltip position with responsive viewport clamping
  const effectiveWidth = Math.min(360, typeof window !== 'undefined' ? window.innerWidth - 32 : 360);
  const padding = 10;
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 32px)',
    overflowY: 'auto',
    zIndex: 60,
  };

  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const spaceRight = window.innerWidth - targetRect.right;
    const spaceLeft = targetRect.left;

    let posX = targetRect.left;
    let posY = targetRect.bottom + padding;

    if (step.preferredPosition === 'bottom' && spaceBelow > 220) {
      posY = targetRect.bottom + padding;
      posX = Math.max(16, Math.min(targetRect.left, window.innerWidth - effectiveWidth - 16));
    } else if (step.preferredPosition === 'top' && spaceAbove > 220) {
      posY = targetRect.top - 230 - padding;
      posX = Math.max(16, Math.min(targetRect.left, window.innerWidth - effectiveWidth - 16));
    } else if (step.preferredPosition === 'left' && spaceLeft > effectiveWidth + 20) {
      posX = targetRect.left - effectiveWidth - padding;
      posY = Math.max(16, Math.min(targetRect.top + 20, window.innerHeight - 260));
    } else if (step.preferredPosition === 'right' && spaceRight > effectiveWidth + 20) {
      posX = targetRect.right + padding;
      posY = Math.max(16, Math.min(targetRect.top + 20, window.innerHeight - 260));
    } else {
      // Default fallback: place below or above
      if (spaceBelow >= 220) {
        posY = targetRect.bottom + padding;
        posX = Math.max(16, Math.min(targetRect.left, window.innerWidth - effectiveWidth - 16));
      } else {
        posY = Math.max(16, targetRect.top - 240);
        posX = Math.max(16, Math.min(targetRect.left, window.innerWidth - effectiveWidth - 16));
      }
    }

    tooltipStyle = {
      ...tooltipStyle,
      position: 'fixed',
      left: `${posX}px`,
      top: `${posY}px`,
      width: `${effectiveWidth}px`,
      zIndex: 60,
    };
  } else {
    // Center if target not measured
    tooltipStyle = {
      ...tooltipStyle,
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${effectiveWidth}px`,
      zIndex: 60,
    };
  }

  return (
    <div
      className="fixed inset-0 z-50 font-sans pointer-events-auto"
      onClick={handleFinishTour}
    >
      {/* 1. Darkened Spotlight Mask */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-50">
        <defs>
          <mask id="spotlight-mask">
            {/* White covers all (opaque dark) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout reveals the target element, or gentle fallback if not mounted */}
            {targetRect ? (
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx="8"
                ry="8"
                fill="black"
              />
            ) : (
              <rect
                x="15%"
                y="15%"
                width="70%"
                height="70%"
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Semi-transparent dark overlay with cutout */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.72)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* 2. Spotlight Animated Focus Ring */}
      {targetRect && (
        <div
          className="fixed pointer-events-none z-50 rounded-lg ring-4 ring-purple-500/80 shadow-2xl transition-all duration-300 animate-pulse"
          style={{
            left: `${targetRect.left - 4}px`,
            top: `${targetRect.top - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
        />
      )}

      {/* 3. Interactive Floating Tooltip Card */}
      <div
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-stone-200 p-4 text-stone-800 space-y-3 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Tooltip Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
              {step.badge}
            </span>
            <span className="text-[10px] text-stone-500 font-mono">
              {t.tour.stepOf(currentStepIndex + 1, tourSteps.length)}
            </span>
          </div>

          <button
            onClick={handleFinishTour}
            className="p-1 text-stone-400 hover:text-stone-700 rounded transition cursor-pointer"
            title={t.tour.skip}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold text-stone-900 leading-snug">
            {step.title}
          </h3>
          <p className="text-[11px] text-stone-600 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Pro Tip Box */}
        <div className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-[10.5px] text-stone-700 leading-snug">
          {step.tip}
        </div>

        {/* Action Controls & Dots */}
        <div className="pt-1 flex items-center justify-between">
          {/* Step Indicator Dots */}
          <div className="flex gap-1">
            {tourSteps.map((_, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'bg-purple-700 w-4'
                    : 'bg-stone-300 hover:bg-stone-400'
                }`}
                title={t.tour.stepOf(idx + 1, tourSteps.length)}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-2.5 py-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 transition cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>{t.tour.prev}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNextStep}
              className="px-3 py-1 text-[11px] font-bold text-white bg-purple-700 hover:bg-purple-800 rounded shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <span>{isLastStep ? t.tour.finish : t.tour.next}</span>
              {isLastStep ? <CheckCircle2 className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
