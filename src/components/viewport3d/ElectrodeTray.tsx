import React from 'react';
import { PhysicalElectrodeId } from '../../engine/biophysics/types';
import { STANDARD_ELECTRODE_LANDMARKS } from '../../engine/biophysics/LeadFieldModel';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Check, X, AlertCircle, ChevronLeft, ChevronRight, Disc3 } from 'lucide-react';
import { useLocale } from '../../locales/useLocale';

interface ElectrodeTrayProps {
  onElectrodeClick?: (id: PhysicalElectrodeId) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const LIMB_ELECTRODES: PhysicalElectrodeId[] = ['RA', 'LA', 'RL', 'LL'];
const CHEST_ELECTRODES: PhysicalElectrodeId[] = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

// Color mapping for AHA and IEC standards
const AHA_BADGE_COLORS: Record<PhysicalElectrodeId, { bg: string; text: string; border: string }> = {
  RA: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' }, // White
  LA: { bg: 'bg-slate-800', text: 'text-white', border: 'border-slate-900' },     // Black
  RL: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' }, // Green (Ground)
  LL: { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700' },       // Red
  V1: { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600' },       // Red
  V2: { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },     // Yellow
  V3: { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' }, // Green
  V4: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },       // Blue
  V5: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },   // Orange
  V6: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700' },   // Purple
};

const IEC_BADGE_COLORS: Record<PhysicalElectrodeId, { bg: string; text: string; border: string }> = {
  RA: { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700' },       // Red
  LA: { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },     // Yellow
  RL: { bg: 'bg-slate-800', text: 'text-white', border: 'border-slate-900' },     // Black
  LL: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' }, // Green
  V1: { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600' },
  V2: { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
  V3: { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' },
  V4: { bg: 'bg-amber-800', text: 'text-white', border: 'border-amber-900' },     // Brown
  V5: { bg: 'bg-slate-800', text: 'text-white', border: 'border-slate-900' },     // Black
  V6: { bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-700' },   // Violet
};

export const ElectrodeTray: React.FC<ElectrodeTrayProps> = ({
  onElectrodeClick,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const placedElectrodes = useSimulationStore((s) => s.placedElectrodes);
  const { t, locale } = useLocale();
  const setElectrodePlaced = useSimulationStore((s) => s.setElectrodePlaced);
  const attachAllElectrodes = useSimulationStore((s) => s.attachAllElectrodes);
  const detachAllElectrodes = useSimulationStore((s) => s.detachAllElectrodes);
  const colorStandard = useSimulationStore((s) => s.colorStandard);
  const selectedLeadId = useSimulationStore((s) => s.selectedLeadId);
  const setSelectedLeadId = useSimulationStore((s) => s.setSelectedLeadId);

  const colors = colorStandard === 'AHA' ? AHA_BADGE_COLORS : IEC_BADGE_COLORS;

  const totalPlaced = Object.values(placedElectrodes).filter(Boolean).length;
  const isAllAttached = totalPlaced === 10;
  const isAllDetached = totalPlaced === 0;

  const handleToggleElectrode = (id: PhysicalElectrodeId, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentlyPlaced = placedElectrodes[id];
    setElectrodePlaced(id, !currentlyPlaced);
    setSelectedLeadId(id);
    if (onElectrodeClick) {
      onElectrodeClick(id);
    }
  };

  // Collapsed View: Compact side-docked pill
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md px-2.5 py-2 rounded-r-xl border border-slate-200 border-l-0 shadow-md text-xs font-bold text-slate-800 hover:bg-slate-50 transition pointer-events-auto"
        title={t.viewport3d.openTray}
      >
        <Disc3 className="w-3.5 h-3.5 text-sky-600 animate-spin-slow" />
        <span className="text-[11px] font-bold text-slate-800">{t.viewport3d.trayTitle} ({totalPlaced}/10)</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
      </button>
    );
  }

  // Expanded View: Side-docked panel with max-height guard to prevent overlap with bottom controls
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-r-xl rounded-l-none border border-slate-200 border-l-0 shadow-xl p-3 text-slate-900 text-xs select-none w-72 sm:w-80 max-h-[calc(100%-65px)] overflow-y-auto pointer-events-auto transition-all duration-200">
      {/* Tray Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <div className="flex items-center space-x-1.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
          <span className="font-bold text-slate-800 text-xs tracking-tight truncate">
            {t.viewport3d.trayTitle}
          </span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
            isAllAttached ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {totalPlaced}/10
          </span>
        </div>

        {/* Collapse Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0 ml-1"
            title={t.viewport3d.collapseTray}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Action Buttons: Pasang Semua / Lepas Semua */}
      <div className="flex items-center space-x-1.5 mb-2">
        <button
          onClick={attachAllElectrodes}
          disabled={isAllAttached}
          className={`flex-1 flex items-center justify-center space-x-1 py-1 rounded-md text-[11px] font-semibold transition ${
            isAllAttached
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
          }`}
          title={t.viewport3d.attachAllTooltip}
        >
          <Check className="w-3 h-3" />
          <span>{t.viewport3d.attachAll}</span>
        </button>
        <button
          onClick={detachAllElectrodes}
          disabled={isAllDetached}
          className={`flex-1 flex items-center justify-center space-x-1 py-1 rounded-md text-[11px] font-semibold transition ${
            isAllDetached
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
          }`}
          title={t.viewport3d.detachAllTooltip}
        >
          <X className="w-3 h-3" />
          <span>{t.viewport3d.detachAll}</span>
        </button>
      </div>

      {/* Helper notice */}
      {!isAllAttached && (
        <div className="flex items-center space-x-1.5 p-1.5 mb-2 bg-amber-50 border border-amber-200 rounded-md text-[10px] text-amber-800 leading-tight">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{t.viewport3d.trayNotice}</span>
        </div>
      )}

      {/* 1. Limb Leads Group */}
      <div className="mb-2">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>{t.viewport3d.limbLeads}</span>
          <span className="text-[9px] font-normal text-slate-400">{t.viewport3d.standardPrefix} {colorStandard}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {LIMB_ELECTRODES.map((id) => {
            const isPlaced = !!placedElectrodes[id];
            const isSelected = selectedLeadId === id;
            const badge = colors[id];
            const landmark = STANDARD_ELECTRODE_LANDMARKS[id];

            return (
              <div
                key={id}
                onClick={(e) => handleToggleElectrode(id, e)}
                className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/60 ring-1 ring-sky-500'
                    : isPlaced
                    ? 'border-slate-200 bg-slate-50/80 hover:bg-slate-100'
                    : 'border-dashed border-rose-300 bg-rose-50/40 hover:bg-rose-50'
                }`}
                title={`${locale === 'en' ? landmark.fullTitleEn || landmark.fullTitle : landmark.fullTitle}: ${locale === 'en' ? landmark.landmarkDescEn || landmark.landmarkDesc : landmark.landmarkDesc}`}
              >
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {id}
                  </span>
                  <div className="truncate">
                    <div className="text-[11px] font-semibold text-slate-800 truncate leading-none">
                      {id}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5">
                      {id === 'RL' ? t.viewport3d.groundLead : id === 'RA' ? t.viewport3d.rightArmShort : id === 'LA' ? t.viewport3d.leftArmShort : t.viewport3d.leftLegShort}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-1">
                  {isPlaced ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ON
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      OFF
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Precordial Leads Group */}
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          {t.viewport3d.precordialLeads}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {CHEST_ELECTRODES.map((id) => {
            const isPlaced = !!placedElectrodes[id];
            const isSelected = selectedLeadId === id;
            const badge = colors[id];
            const landmark = STANDARD_ELECTRODE_LANDMARKS[id];

            return (
              <div
                key={id}
                onClick={(e) => handleToggleElectrode(id, e)}
                className={`p-1.5 rounded-lg border flex flex-col items-center justify-between cursor-pointer transition ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/60 ring-1 ring-sky-500'
                    : isPlaced
                    ? 'border-slate-200 bg-slate-50/80 hover:bg-slate-100'
                    : 'border-dashed border-rose-300 bg-rose-50/40 hover:bg-rose-50'
                }`}
                title={`${locale === 'en' ? landmark.fullTitleEn || landmark.fullTitle : landmark.fullTitle}: ${locale === 'en' ? landmark.landmarkDescEn || landmark.landmarkDesc : landmark.landmarkDesc}`}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {id}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700">{id}</span>
                </div>

                <div>
                  {isPlaced ? (
                    <span className="text-[8.5px] font-semibold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      ON
                    </span>
                  ) : (
                    <span className="text-[8.5px] font-semibold px-1 py-0.2 rounded bg-rose-100 text-rose-800">
                      OFF
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
