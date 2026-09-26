import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useLocale } from '../../locales/useLocale';
import { Play, Pause, StepForward, Gauge } from 'lucide-react';

interface TimeSpeedHUDProps {
  onStepForward?: () => void;
}

export const TimeSpeedHUD: React.FC<TimeSpeedHUDProps> = ({ onStepForward }) => {
  const { t } = useLocale();
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const togglePlay = useSimulationStore((s) => s.togglePlay);
  const simulationSpeed = useSimulationStore((s) => s.simulationSpeed);
  const setSimulationSpeed = useSimulationStore((s) => s.setSimulationSpeed);

  const speedOptions = [
    { value: 0.1, label: '0.1x', title: t.timeSpeed.slow01 },
    { value: 0.25, label: '0.25x', title: '0.25x' },
    { value: 0.5, label: '0.5x', title: t.timeSpeed.slow05 },
    { value: 1.0, label: '1.0x', title: t.timeSpeed.realtime },
  ];

  const handleStep = () => {
    onStepForward?.();
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-1.5 text-xs select-none shrink-0">
      {/* Play / Pause Toggle */}
      <button
        onClick={togglePlay}
        className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md font-bold text-xs transition shadow-2xs ${
          isPlaying
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
        }`}
        title={isPlaying ? t.timeSpeed.pause : t.timeSpeed.play}
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline">Pause</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Play</span>
          </>
        )}
      </button>

      {/* Step (50 ms forward) */}
      <button
        onClick={handleStep}
        className="flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] border border-slate-200 transition shadow-2xs cursor-pointer"
        title={t.timeSpeed.step}
      >
        <StepForward className="w-3.5 h-3.5 text-slate-600" />
        <span className="hidden md:inline">Step 50ms</span>
        <span className="md:hidden">50ms</span>
      </button>

      <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

      {/* Speed Selector Buttons */}
      <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-md border border-slate-200">
        <div className="hidden sm:flex items-center px-1 text-slate-400">
          <Gauge className="w-3 h-3 text-slate-500" />
        </div>
        {speedOptions.map((opt) => {
          const isActive = Math.abs(simulationSpeed - opt.value) < 0.01;

          return (
            <button
              key={opt.value}
              onClick={() => setSimulationSpeed(opt.value)}
              className={`px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
              title={opt.title}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
