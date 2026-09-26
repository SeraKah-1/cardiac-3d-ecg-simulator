/**
 * VisualExemplarInlineCard: Compact Side-by-Side Morphology Teaser
 * Replaces dense textual explanations with direct visual pattern recognition.
 * Shows NORMAL vs ACTIVE FINDING with 1-line clues and opens the full comparative atlas.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React from 'react';
import { VisualExemplarGroup } from '../../engine/clinical/thaler/thalerExemplarTypes';
import { VisualExemplarSvg } from './VisualExemplarSvg';
import { useLocale } from '../../locales/useLocale';

interface VisualExemplarInlineCardProps {
  group: VisualExemplarGroup;
  currentCaseTriageStatus?: 'NORMAL' | 'ABNORMAL' | 'NEUTRAL';
  activeFindingTitle?: string;
  onOpenFullComparison: (groupId: string) => void;
}

export const VisualExemplarInlineCard: React.FC<VisualExemplarInlineCardProps> = ({
  group,
  currentCaseTriageStatus = 'ABNORMAL',
  activeFindingTitle,
  onOpenFullComparison,
}) => {
  const { t, locale } = useLocale();
  const normalExemplar = group.exemplars.find((e) => e.triageType === 'NORMAL') || group.exemplars[0];
  
  // Pick active pathology or variant
  const activeExemplar =
    group.exemplars.find((e) => e.triageType === 'PATHOLOGY') ||
    group.exemplars.find((e) => e.triageType === 'VARIANT') ||
    group.exemplars[1] ||
    normalExemplar;

  const isCaseNormal = currentCaseTriageStatus === 'NORMAL';

  const normalTitle = locale === 'en' ? (normalExemplar.medicalTermEn || normalExemplar.title) : normalExemplar.title;
  const activeTitle = locale === 'en' ? (activeExemplar.medicalTermEn || activeExemplar.title) : activeExemplar.title;
  const activeBadge = locale === 'en' 
    ? (activeExemplar.triageType === 'PATHOLOGY' ? 'Pathology' : (activeExemplar.triageType === 'VARIANT' ? 'Variant' : 'Normal'))
    : activeExemplar.badgeLabel;

  return (
    <div className="border border-stone-200 rounded-lg p-3 bg-white shadow-2xs space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-700">
            {t.visualAtlas.inlineCardTitle}
          </span>
        </div>
        <button
          onClick={() => onOpenFullComparison(group.id)}
          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer flex items-center space-x-0.5"
        >
          <span>{t.visualAtlas.viewAllBtn(group.exemplars.length)}</span>
        </button>
      </div>

      {/* Side-by-Side Quick Contrast */}
      <div className="grid grid-cols-2 gap-2">
        {/* Normal Card */}
        <div className={`border rounded p-1.5 space-y-1 ${
          isCaseNormal
            ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-400'
            : 'border-emerald-100 bg-emerald-50/30'
        }`}>
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-emerald-800">NORMAL</span>
            {isCaseNormal && (
              <span className="text-[9px] bg-emerald-600 text-white px-1 rounded font-bold">
                {t.visualAtlas.currentCaseBadge}
              </span>
            )}
          </div>
          <VisualExemplarSvg exemplar={normalExemplar} height={52} showMarker={false} />
          <p className="text-[10px] text-stone-600 leading-tight line-clamp-2">
            {normalTitle}
          </p>
        </div>

        {/* Pathology / Variant Card */}
        <div className={`border rounded p-1.5 space-y-1 ${
          !isCaseNormal
            ? 'border-rose-400 bg-rose-50/50 ring-1 ring-rose-400'
            : 'border-rose-100 bg-rose-50/20'
        }`}>
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-rose-800 truncate max-w-[90px]">
              {activeBadge}
            </span>
            {!isCaseNormal && (
              <span className="text-[9px] bg-rose-600 text-white px-1 rounded font-bold">
                {t.visualAtlas.currentCaseBadge}
              </span>
            )}
          </div>
          <VisualExemplarSvg exemplar={activeExemplar} height={52} showMarker={true} />
          <p className="text-[10px] text-stone-700 leading-tight font-medium line-clamp-2">
            {activeTitle}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onOpenFullComparison(group.id)}
        className="w-full py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs rounded border border-stone-200 transition cursor-pointer text-center"
      >
        {t.visualAtlas.openComparisonBtn}
      </button>
    </div>
  );
};
