/**
 * LeadTerritoryModal: Interactive 12-Lead Territory & Diagnostic Pitfall Guide
 * Decodes the anatomical perspectives of the 12 leads and prevents common novice misinterpretations
 * (e.g. inverted aVR is normal, rS in V1 is normal, isolated III Q waves can be benign).
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useEffect } from 'react';
import { X, Layers, AlertTriangle, CheckCircle2, ShieldAlert, HeartPulse } from 'lucide-react';
import { useLocale } from '../../locales/useLocale';

interface LeadTerritoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeadTerritoryModal: React.FC<LeadTerritoryModalProps> = ({
  isOpen,
  onClose,
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

  const territories = t.leadTerritoryData.territories;
  const pitfalls = t.leadTerritoryData.pitfalls;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-territory-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-stone-900 text-white shrink-0 border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-blue-400" />
            <div>
              <h3 id="lead-territory-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
                {t.leadTerritory.modalTitle}
              </h3>
              <p className="text-[11px] text-stone-400">
                {t.leadTerritory.modalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            aria-label={t.common.closeEsc}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Section 1: Anatomical Territories */}
          <div>
            <div className="flex items-center space-x-2 pb-2 border-b border-stone-200 mb-3">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-800">
                {t.leadTerritory.section1Title}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {territories.map((territory) => (
                <div
                  key={territory.name}
                  className={`p-3 rounded-lg border ${territory.borderColor} ${territory.bgColor} flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold ${territory.textColor}`}>
                        {territory.name}
                      </span>
                      <div className="flex gap-1">
                        {territory.leads.map((lead) => (
                          <span
                            key={lead}
                            className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-white/90 rounded border border-stone-300 text-stone-800"
                          >
                            {lead}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-[11px] font-semibold text-stone-700 mb-1">
                      {t.leadTerritory.arteryLabel}<span className="text-stone-900">{territory.artery}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
                      {territory.viewAngle}
                    </p>
                  </div>
                  <div className="text-[10px] text-stone-500 bg-white/80 p-1.5 rounded border border-stone-200">
                    <strong className="text-stone-700">{t.leadTerritory.normalPatternLabel}</strong> {territory.normalFeatures}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Clinical Pitfalls Matrix */}
          <div>
            <div className="flex items-center space-x-2 pb-2 border-b border-stone-200 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-800">
                {t.leadTerritory.section2Title}
              </h4>
            </div>

            <div className="space-y-3">
              {pitfalls.map((pitfall) => (
                <div
                  key={pitfall.id}
                  className="bg-stone-50 rounded-lg p-3.5 border border-stone-200 hover:border-stone-300 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 mb-2 border-b border-stone-200">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                        {pitfall.id}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-stone-900">
                        {pitfall.finding}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-stone-200 rounded text-stone-700">
                        {pitfall.leadTarget}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-300">
                        {pitfall.dangerBadge}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="bg-rose-50/70 p-2.5 rounded border border-rose-200 text-rose-950">
                      <div className="flex items-center space-x-1 font-bold text-rose-800 mb-0.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{t.leadTerritory.noviceMistakeLabel}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {pitfall.noviceMistake}
                      </p>
                    </div>

                    <div className="bg-emerald-50/70 p-2.5 rounded border border-emerald-200 text-emerald-950">
                      <div className="flex items-center space-x-1 font-bold text-emerald-800 mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.leadTerritory.clinicalRealityLabel}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {pitfall.clinicalReality}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Golden Clinical Rule */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-950">
            <h5 className="font-bold text-blue-900 mb-1 flex items-center space-x-1.5">
              <span>{t.leadTerritory.contiguousRuleTitle}</span>
            </h5>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              {t.leadTerritory.contiguousRuleBody}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-sans font-bold bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition shadow-xs cursor-pointer"
          >
            {t.leadTerritory.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
