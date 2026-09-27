/**
 * AxisQuadrantModal: Pop-up Modal for Frontal Plane Hexaxial Axis Deconstruction
 * Allows full-scale inspection, vector dragging, and clinical disparity analysis.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useEffect } from 'react';
import { X, Compass } from 'lucide-react';
import { AxisQuadrantWheel } from './AxisQuadrantWheel';
import { useLocale } from '../../locales/useLocale';

interface AxisQuadrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  axisDegrees: number;
  axisClassification?: string;
}

export const AxisQuadrantModal: React.FC<AxisQuadrantModalProps> = ({
  isOpen,
  onClose,
  axisDegrees,
  axisClassification,
}) => {
  const { t } = useLocale();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="axis-quadrant-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-stone-900 text-white shrink-0 border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <Compass className="w-5 h-5 text-purple-400" />
            <div>
              <h3 id="axis-quadrant-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
                {t.axisWheel.modalTitle}
              </h3>
              <p className="text-[11px] text-stone-400">
                {t.axisWheel.modalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            aria-label={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[78vh]">
          <AxisQuadrantWheel
            axisDegrees={axisDegrees}
            axisClassification={axisClassification}
            compact={false}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-sans font-bold bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition shadow-xs cursor-pointer"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
