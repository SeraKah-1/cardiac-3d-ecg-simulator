import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Activity } from 'lucide-react';

interface PhaseStep {
  key: string;
  acronym: string;
  shortLabel: string;
  fullLabel: string;
  organ: string;
  badgeClass: string;
}

const PHASES: PhaseStep[] = [
  {
    key: 'P',
    acronym: 'P',
    shortLabel: 'P (Atrium)',
    fullLabel: 'Gelombang P',
    organ: 'Depolarisasi Atrium',
    badgeClass: 'bg-sky-600 text-white border-sky-700 shadow-xs ring-1 ring-sky-300',
  },
  {
    key: 'PR',
    acronym: 'PR',
    shortLabel: 'PR (AV Nodus)',
    fullLabel: 'Segmen PR',
    organ: 'Konduksi Nodus AV',
    badgeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-1 ring-emerald-300',
  },
  {
    key: 'QRS',
    acronym: 'QRS',
    shortLabel: 'QRS (Ventrikel)',
    fullLabel: 'Kompleks QRS',
    organ: 'Depolarisasi Ventrikel',
    badgeClass: 'bg-rose-600 text-white border-rose-700 shadow-xs ring-1 ring-rose-300 animate-pulse',
  },
  {
    key: 'ST',
    acronym: 'ST',
    shortLabel: 'ST (Plateau)',
    fullLabel: 'Segmen ST',
    organ: 'Plateau Miokard',
    badgeClass: 'bg-amber-600 text-white border-amber-700 shadow-xs ring-1 ring-amber-300',
  },
  {
    key: 'T',
    acronym: 'T',
    shortLabel: 'T (Repol)',
    fullLabel: 'Gelombang T',
    organ: 'Repolarisasi Ventrikel',
    badgeClass: 'bg-purple-600 text-white border-purple-700 shadow-xs ring-1 ring-purple-300',
  },
  {
    key: 'Diastole',
    acronym: 'Dia',
    shortLabel: 'Diastol',
    fullLabel: 'Fase Diastol',
    organ: 'Pengisian Ventrikel',
    badgeClass: 'bg-slate-700 text-white border-slate-800 shadow-xs ring-1 ring-slate-300',
  },
];

export const CardiacPhaseBar: React.FC = () => {
  const currentPhaseInfo = useSimulationStore((s) => s.conductionPhase);

  return (
    <div className="flex items-center space-x-1 sm:space-x-1.5 text-xs select-none min-w-0">
      <div className="flex items-center space-x-1 text-slate-500 font-semibold text-[10px] uppercase tracking-wider shrink-0 mr-0.5">
        <Activity className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span className="hidden sm:inline">Fase:</span>
      </div>

      <div className="flex items-center space-x-0.5 sm:space-x-1 min-w-0">
        {PHASES.map((p, idx) => {
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

              {idx < PHASES.length - 1 && (
                <span className="text-slate-300 text-[10px] font-bold select-none shrink-0">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
