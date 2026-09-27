/**
 * Clinical Pocket Cheat Sheet Modal (Buku Saku EKG)
 * Quick-reference clinical bedside cards for normal intervals,
 * coronary topography, STEMI mimickers, and ACLS algorithms.
 * Grounded in Dr. Malcolm S. Thaler's clinical curriculum.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useState, useEffect } from 'react';
import { X, Search, ShieldCheck, Heart, AlertTriangle, Activity, BookOpen } from 'lucide-react';
import { useLocale } from '../../locales/useLocale';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'NORMAL_INTERVALS' | 'CORONARY_TOPOGRAPHY' | 'MIMICKERS' | 'ACLS_PEARLS';

export const ClinicalPocketCheatSheetModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<TabType>('NORMAL_INTERVALS');
  const [searchQuery, setSearchQuery] = useState('');

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

  const content = t.cheatSheetContent;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pocket-cheat-sheet-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-2 sm:p-6 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92dvh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 id="pocket-cheat-sheet-title" className="text-sm font-bold tracking-tight">{t.cheatSheet.modalTitle}</h2>
              <p className="text-[11px] text-stone-400">{t.cheatSheet.modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            title={t.common.closeEsc}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar & Search */}
        <div className="px-5 py-2.5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('NORMAL_INTERVALS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'NORMAL_INTERVALS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.cheatSheet.tabIntervals}</span>
            </button>
            <button
              onClick={() => setActiveTab('CORONARY_TOPOGRAPHY')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'CORONARY_TOPOGRAPHY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>{t.cheatSheet.tabTopography}</span>
            </button>
            <button
              onClick={() => setActiveTab('MIMICKERS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'MIMICKERS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.cheatSheet.tabMimickers}</span>
            </button>
            <button
              onClick={() => setActiveTab('ACLS_PEARLS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'ACLS_PEARLS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{t.cheatSheet.tabAcls}</span>
            </button>
          </div>

          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.cheatSheet.searchPlaceholder}
              className="w-full bg-white border border-stone-300 rounded-md pl-8 pr-7 py-1 text-base sm:text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-blue-500 font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans text-stone-800">
          {activeTab === 'NORMAL_INTERVALS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Laju & Irama */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>{content.rateTitle}</span>
                    <span className="font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">60 - 100 bpm</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-600 space-y-1 text-[11px]">
                    <li>{content.rateBrady}</li>
                    <li>{content.rateBigBox}</li>
                    <li>{content.rateSmallBox}</li>
                    <li>{content.rateSixSec}</li>
                  </ul>
                </div>

                {/* Gelombang P */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>{content.pWaveTitle}</span>
                    <span className="font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">{content.pWaveNormalRange}</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-600 space-y-1 text-[11px]">
                    <li>{content.pWaveDuration}</li>
                    <li>{content.pWaveAmplitude}</li>
                    <li>{content.pWavePolarity}</li>
                  </ul>
                </div>

                {/* Interval PR */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>{content.prTitle}</span>
                    <span className="font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">{content.prNormalRange}</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-600 space-y-1 text-[11px]">
                    <li>{content.prProlonged}</li>
                    <li>{content.prShortened}</li>
                  </ul>
                </div>

                {/* Kompleks QRS */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>{content.qrsTitle}</span>
                    <span className="font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">{content.qrsNormalRange}</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-600 space-y-1 text-[11px]">
                    <li>{content.qrsNarrow}</li>
                    <li>{content.qrsWide}</li>
                    <li>{content.qrsQWave}</li>
                  </ul>
                </div>

                {/* Interval QTc */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>{content.qtcTitle}</span>
                    <span className="font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">{content.qtcNormalRange}</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-600 space-y-1 text-[11px]">
                    <li>{content.qtcBazettFormula}</li>
                    <li>{content.qtcHalfRrRule}</li>
                    <li>{content.qtcCriticalThreshold}</li>
                  </ul>
                </div>

                {/* Aksis Frontal */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>{content.axisTitle}</span>
                    <span className="font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">{content.axisNormalRange}</span>
                  </div>
                  <ul className="list-disc list-inside text-stone-600 space-y-1 text-[11px]">
                    <li>{content.axisNormal}</li>
                    <li>{content.axisLad}</li>
                    <li>{content.axisRad}</li>
                    <li>{content.axisExtreme}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CORONARY_TOPOGRAPHY' && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-2.5">{content.tableHeaderWall}</th>
                      <th className="p-2.5">{content.tableHeaderLeads}</th>
                      <th className="p-2.5">{content.tableHeaderVessel}</th>
                      <th className="p-2.5">{content.tableHeaderReciprocal}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-700">
                    {content.topographyRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-stone-50 ${
                          row.highlightType === 'posterior'
                            ? 'bg-rose-50/40'
                            : row.highlightType === 'rv'
                            ? 'bg-amber-50/40'
                            : ''
                        }`}
                      >
                        <td className="p-2.5 font-bold text-stone-900">{row.wall}</td>
                        <td className="p-2.5 font-mono font-semibold text-blue-700">{row.leads}</td>
                        <td className="p-2.5">{row.vessel}</td>
                        <td className={`p-2.5 ${row.isHighlighted ? 'text-rose-900 font-semibold' : 'text-rose-700'}`}>
                          {row.reciprocal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] space-y-1">
                <div className="font-bold">{content.goldenRulesTitle}</div>
                <p>{content.goldenRulePosterior}</p>
                <p>{content.goldenRuleRvInfarct}</p>
              </div>
            </div>
          )}

          {activeTab === 'MIMICKERS' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* STEMI vs Perikarditis */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 border-b border-stone-200 pb-1 flex items-center justify-between">
                    <span>{content.mimickerPericarditisTitle}</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono font-bold">
                      {content.badgeCritical}
                    </span>
                  </div>
                  <ul className="text-stone-600 space-y-1 text-[11px]">
                    {content.mimickerPericarditisItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* STEMI vs Repolarisasi Dini (BER) */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 border-b border-stone-200 pb-1 flex items-center justify-between">
                    <span>{content.mimickerBerTitle}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                      {content.badgeNormalVariant}
                    </span>
                  </div>
                  <ul className="text-stone-600 space-y-1 text-[11px]">
                    {content.mimickerBerItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* LBBB vs STEMI (Kriteria Smith-Sgarbossa) */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 border-b border-stone-200 pb-1 flex items-center justify-between">
                    <span>{content.mimickerLbbbTitle}</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-mono font-bold">
                      {content.badgeAdvanced}
                    </span>
                  </div>
                  <ul className="text-stone-600 space-y-1 text-[11px]">
                    {content.mimickerLbbbItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Hiperkalemia vs Hipokalemia */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 border-b border-stone-200 pb-1 flex items-center justify-between">
                    <span>{content.mimickerPotassiumTitle}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">
                      {content.badgeElectrolyte}
                    </span>
                  </div>
                  <ul className="text-stone-600 space-y-1 text-[11px]">
                    {content.mimickerPotassiumItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ACLS_PEARLS' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Takikardia Dewasa dengan Nadi */}
                <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200 space-y-2">
                  <div className="font-bold text-rose-950 flex items-center justify-between border-b border-rose-200 pb-1">
                    <span>{content.tachyTitle}</span>
                    <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                      {content.badgeAcls}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-900 font-semibold">{content.tachyInstabilityHeader}</p>
                  <ul className="list-disc list-inside text-rose-800 space-y-0.5 text-[11px]">
                    {content.tachyInstabilityItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  <div className="p-2 bg-white rounded border border-rose-300 text-[11px] text-rose-950 font-semibold">
                    {content.tachyCardioversionPrompt}
                  </div>
                </div>

                {/* Bradikardia Dewasa dengan Nadi */}
                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-2">
                  <div className="font-bold text-amber-950 flex items-center justify-between border-b border-amber-200 pb-1">
                    <span>{content.bradyTitle}</span>
                    <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                      {content.badgeAcls}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 font-semibold">{content.bradyResusHeader}</p>
                  <ol className="list-decimal list-inside text-amber-800 space-y-1 text-[11px]">
                    {content.bradySteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Henti Jantung (Cardiac Arrest) */}
                <div className="p-3 bg-stone-900 text-stone-100 rounded-lg space-y-2">
                  <div className="font-bold text-white flex items-center justify-between border-b border-stone-700 pb-1">
                    <span>{content.arrestTitle}</span>
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                      {content.badgePriority1}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-stone-800 rounded border border-stone-700">
                      <div className="font-bold text-emerald-400">{content.arrestShockableTitle}</div>
                      <p className="text-stone-300">{content.arrestShockableSub}</p>
                      <ul className="list-disc list-inside text-stone-400 mt-1 space-y-0.5">
                        {content.arrestShockableItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-2 bg-stone-800 rounded border border-stone-700">
                      <div className="font-bold text-rose-400">{content.arrestNonShockableTitle}</div>
                      <p className="text-stone-300">{content.arrestNonShockableSub}</p>
                      <ul className="list-disc list-inside text-stone-400 mt-1 space-y-0.5">
                        {content.arrestNonShockableItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Golden Invariants di Ruang Gawat Darurat */}
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-950 flex items-center justify-between border-b border-emerald-200 pb-1">
                    <span>{content.threeGoldenRulesTitle}</span>
                    <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                      {content.badgePrinciples}
                    </span>
                  </div>
                  <ul className="text-emerald-900 space-y-1.5 text-[11px]">
                    {content.threeGoldenRules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between shrink-0 text-[11px] text-stone-500">
          <span>{t.cheatSheet.footerNote}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded transition cursor-pointer"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
