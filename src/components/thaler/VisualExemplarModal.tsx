/**
 * VisualExemplarModal: High-Contrast Comparative ECG Atlas
 * Displays side-by-side morphology strips for Normal vs Benign Variants vs Pathologies.
 * Features group switcher tabs, 1-line visual clues, and clinical reasons.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useState, useEffect } from 'react';
import { X, BookOpen, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import {
  THALER_VISUAL_EXEMPLAR_GROUPS,
} from '../../engine/clinical/thaler/thalerExemplarData';
import { getLocalizedExemplarGroups } from '../../engine/clinical/thaler/thalerLocalization';
import {
  VisualExemplarGroup,
  VisualExemplarItem,
} from '../../engine/clinical/thaler/thalerExemplarTypes';
import { CLINICAL_TIER_CONFIG } from '../../engine/clinical/thaler/thalerTypes';
import { VisualExemplarSvg } from './VisualExemplarSvg';
import { useLocale } from '../../locales/useLocale';

interface VisualExemplarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGroupId?: string;
  activeCaseFindingId?: string;
}

export const VisualExemplarModal: React.FC<VisualExemplarModalProps> = ({
  isOpen,
  onClose,
  initialGroupId = 'INFARCTION_ST_T',
  activeCaseFindingId,
}) => {
  const { t, locale } = useLocale();
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId);

  useEffect(() => {
    if (initialGroupId) {
      setSelectedGroupId(initialGroupId);
    }
  }, [initialGroupId]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const localizedGroups = React.useMemo(() => {
    return getLocalizedExemplarGroups(THALER_VISUAL_EXEMPLAR_GROUPS, locale);
  }, [locale]);

  if (!isOpen) return null;

  const currentGroup =
    localizedGroups.find((g) => g.id === selectedGroupId) ||
    localizedGroups[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Top Bar */}
        <div className="h-14 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                  {t.visualAtlas.modalTitle}
                </h2>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {t.visualAtlas.modalSubtitleBadge}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                {t.visualAtlas.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
            title={t.common.closeEsc}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Group Selector Tabs */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-6 py-2 flex items-center space-x-1.5 overflow-x-auto no-scrollbar shrink-0 select-none">
          {localizedGroups.map((g) => {
            const isActive = g.id === selectedGroupId;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`px-3 py-1 rounded-md text-xs font-sans whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200 font-medium'
                }`}
              >
                {g.groupTitle.split('(')[0]}
              </button>
            );
          })}
        </div>

        {/* 3. Exemplars Grid Tray */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100/60 space-y-4">
          <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-2xs">
            <h3 className="text-sm font-bold text-stone-900">
              {currentGroup.groupTitle}
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              {currentGroup.groupSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {currentGroup.exemplars.map((item: VisualExemplarItem) => {
              const isNormal = item.triageType === 'NORMAL';
              const isVariant = item.triageType === 'VARIANT';
              const isMatch = activeCaseFindingId === item.id;
              const displayTitle = locale === 'en' ? (item.medicalTermEn || item.title) : item.title;
              const displayBadge = locale === 'en'
                ? (isNormal ? 'Normal' : isVariant ? 'Variant' : 'Pathology')
                : item.badgeLabel;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg border p-3 flex flex-col justify-between transition shadow-2xs relative ${
                    isMatch
                      ? 'border-amber-500 ring-2 ring-amber-400 bg-amber-50/20'
                      : isNormal
                      ? 'border-emerald-200 hover:border-emerald-400'
                      : isVariant
                      ? 'border-blue-200 hover:border-blue-400'
                      : 'border-rose-200 hover:border-rose-400'
                  }`}
                >
                  {isMatch && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full shadow-xs">
                      {t.visualAtlas.currentCaseBadge}
                    </span>
                  )}

                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isNormal
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isVariant
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isNormal ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : isVariant ? (
                          <AlertTriangle className="w-3 h-3 text-blue-600" />
                        ) : (
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{displayBadge}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-stone-400 truncate max-w-[120px]">
                          {item.medicalTermEn}
                        </span>
                        {item.clinicalTier && (
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                              CLINICAL_TIER_CONFIG[item.clinicalTier].badgeClass
                            }`}
                          >
                            {t.tiers[item.clinicalTier]?.badgeLabel || CLINICAL_TIER_CONFIG[item.clinicalTier].label.split(':')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-stone-900 leading-snug">
                      {displayTitle}
                    </h4>

                    {/* Waveform Strip */}
                    <div className="my-2">
                      <VisualExemplarSvg exemplar={item} height={75} showMarker={true} />
                    </div>

                    {/* 1-Line Visual Clue */}
                    <div className="bg-stone-50 rounded p-2 border border-stone-200 mb-2">
                      <span className="text-[9.5px] font-mono font-bold text-stone-500 block uppercase">
                        {t.visualAtlas.visualClueLabel}
                      </span>
                      <p className="text-xs font-semibold text-stone-800 leading-snug mt-0.5">
                        {item.visualClue}
                      </p>
                    </div>

                    {/* Clinical Reason */}
                    <div className="text-[11px] text-stone-600 leading-relaxed mb-1">
                      <strong className="text-stone-700">{t.visualAtlas.significanceLabel}</strong>
                      <span>{item.clinicalSignificance}</span>
                    </div>
                  </div>

                  {/* Benchmark Criteria */}
                  <div className="pt-2 border-t border-stone-100 text-[10px] font-mono text-stone-500">
                    {t.visualAtlas.criteriaLabel}{item.diagnosticCriteria}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Modal Footer */}
        <div className="h-12 bg-white border-t border-stone-200 px-4 sm:px-6 flex items-center justify-between text-xs shrink-0">
          <span className="text-stone-500 hidden sm:inline">
            {t.visualAtlas.standardCitation}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-black text-white font-semibold rounded-md transition cursor-pointer ml-auto"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
