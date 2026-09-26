import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useLocale } from '../../locales/useLocale';
import { Activity } from 'lucide-react';

export const CardiacPhaseBar: React.FC = () => {
  const { t } = useLocale();
  const currentPhaseInfo = useSimulationStore((s) => s.conductionPhase);

  const phases = [
    {
      key: 'P',
      acronym: 'P',
      shortLabel: `P (${t.cardiacPhase.atrialShortLabel || 'Atria'})`,
      fullLabel: t.cardiacPhase.pWave,
      organ: t.cardiacPhase.atrialDepol,
      badgeClass: 'bg-sky-600 text-white border-sky-700 shadow-xs ring-1 ring-sky-300',
    },
    {
      key: 'PR',
      acronym: 'PR',
      shortLabel: 'PR',
      fullLabel: t.cardiacPhase.prSegment,
      organ: t.cardiacPhase.avDelay,
      badgeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-1 ring-emerald-300',
    },
    {
      key: 'QRS',
      acronym: 'QRS',
      shortLabel: `QRS (${t.cardiacPhase.ventricularShortLabel || 'Ventricles'})`,
      fullLabel: t.cardiacPhase.qrsComplex,
      organ: t.cardiacPhase.ventricularDepol,
      badgeClass: 'bg-rose-600 text-white border-rose-700 shadow-xs ring-1 ring-rose-300 animate-pulse',
    },
    {
      key: 'ST',
      acronym: 'ST',
      shortLabel: 'ST',
      fullLabel: t.cardiacPhase.stSegment,
      organ: t.cardiacPhase.plateau,
      badgeClass: 'bg-amber-600 text-white border-amber-700 shadow-xs ring-1 ring-amber-300',
    },
    {
      key: 'T',
      acronym: 'T',
      shortLabel: 'T',
      fullLabel: t.cardiacPhase.tWave,
      organ: t.cardiacPhase.ventricularRepol,
      badgeClass: 'bg-purple-600 text-white border-purple-700 shadow-xs ring-1 ring-purple-300',
    },
    {
      key: 'Diastole',
      acronym: 'Dia',
      shortLabel: t.cardiacPhase.diastoleShortLabel || 'Diastole',
      fullLabel: t.cardiacPhase.diastole,
      organ: t.cardiacPhase.ventricularFilling,
      badgeClass: 'bg-slate-700 text-white border-slate-800 shadow-xs ring-1 ring-slate-300',
    },
  ];

  return (
    <div className="flex items-center space-x-1 sm:space-x-1.5 text-xs select-none min-w-0">
      <div className="flex items-center space-x-1 text-slate-500 font-semibold text-[10px] uppercase tracking-wider shrink-0 mr-0.5">
        <Activity className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span className="hidden sm:inline">{t.cardiacPhase.phasePrefix}</span>
      </div>

      <div className="flex items-center space-x-0.5 sm:space-x-1 min-w-0">
        {phases.map((p, idx) => {
          const isActive = currentPhaseInfo.key === p.key;

          return (
            <React.Fragment key={p.key}>
              <div
                className={`px-1.5 sm:px-2 py-0.5 rounded font-semibold text-[10px] sm:text-[11px] transition-all duration-100 flex items-center shrink-0 ${
                  isActive
                    ? p.badgeClass
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200/70'
                }`}
                title={`${p.fullLabel}: ${p.organ}`}
              >
                <span className="hidden xl:inline">{p.shortLabel}</span>
                <span className="xl:hidden font-mono">{p.acronym}</span>
              </div>

              {idx < phases.length - 1 && (
                <span className="text-slate-300 text-[10px] font-bold select-none shrink-0">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
