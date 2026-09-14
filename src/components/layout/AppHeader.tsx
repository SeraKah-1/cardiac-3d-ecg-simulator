import React, { useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { CLINICAL_PRESETS } from '../../engine/clinical/presets';
import { cardiacAudio } from '../../engine/audio/CardiacAudioEngine';
import {
  Heart,
  Volume2,
  VolumeX,
  FileDown,
  Activity,
  SlidersHorizontal,
  Info,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Monitor,
  Columns,
} from 'lucide-react';

interface AppHeaderProps {
  onExportPdf: () => void;
  onToggleInspector: () => void;
  isInspectorOpen: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onExportPdf,
  onToggleInspector,
  isInspectorOpen,
}) => {
  const [showPatientPopover, setShowPatientPopover] = useState(false);

  const activePresetId = useSimulationStore((s) => s.activePresetId);
  const loadPreset = useSimulationStore((s) => s.loadPreset);
  const workspaceMode = useSimulationStore((s) => s.workspaceMode);
  const setWorkspaceMode = useSimulationStore((s) => s.setWorkspaceMode);

  const audioMuted = useSimulationStore((s) => s.audioMuted);
  const setAudioMuted = useSimulationStore((s) => s.setAudioMuted);
  const factors = useSimulationStore((s) => s.factors);
  const diagnostic = useSimulationStore((s) => s.currentDiagnostic);

  const activePreset = CLINICAL_PRESETS.find((p) => p.id === activePresetId) || CLINICAL_PRESETS[0];
  const patient = activePreset.patientInfo;

  const handleAudioToggle = async () => {
    await cardiacAudio.unlock();
    const nextMuted = !audioMuted;
    setAudioMuted(nextMuted);
    cardiacAudio.setMuted(nextMuted);
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    loadPreset(e.target.value);
  };

  // 2-Second Idiograph Traffic Light Semantics in Hospital Light Theme
  const triageBadgeConfig = {
    red: {
      dot: 'bg-rose-600',
      pillBg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
      label: 'Cito Reperfusi',
    },
    yellow: {
      dot: 'bg-amber-500',
      pillBg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      label: 'Waspada',
    },
    green: {
      dot: 'bg-emerald-500',
      pillBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      label: 'Stabil',
    },
  }[diagnostic.triageCategory || 'green'];

  return (
    <header className="h-[52px] bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between z-30 select-none gap-2 text-slate-900 shadow-2xs shrink-0">
      {/* 1. Left Zone: Brand, Case Preset & 3-Mode Switcher */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-rose-600 flex items-center justify-center shadow-xs shrink-0">
          <Heart className="w-3.5 h-3.5 text-white fill-white" />
        </div>

        <div className="hidden lg:flex items-center space-x-1 shrink-0">
          <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-900">
            CardioSim 3D
          </span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-200 font-mono font-bold">
            500Hz
          </span>
        </div>

        {/* Case Preset Selector with Patient Popover on Hover */}
        <div
          className="relative flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-md border border-slate-200 text-xs transition cursor-pointer"
          onMouseEnter={() => setShowPatientPopover(true)}
          onMouseLeave={() => setShowPatientPopover(false)}
        >
          <span className="text-slate-500 font-medium hidden xl:inline">Kasus:</span>
          <select
            value={activePresetId}
            onChange={handlePresetChange}
            className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[160px] md:max-w-[185px] truncate text-xs"
            title="Pilih Skenario Kasus Pasien"
          >
            {CLINICAL_PRESETS.map((p) => (
              <option key={p.id} value={p.id} className="bg-white text-slate-800">
                {p.title}
              </option>
            ))}
          </select>
          <Info className="w-3 h-3 text-slate-400 shrink-0 hidden sm:inline" />

          {/* Hover Dossier Popover */}
          {showPatientPopover && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50 text-xs text-slate-800 pointer-events-none">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                <span className="font-bold text-slate-900">{patient.name}, {patient.age}th</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  {patient.id}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mb-1">
                <span className="font-semibold text-slate-700">Gender:</span> {patient.gender}
              </div>
              <div className="text-[11px] text-slate-600 leading-snug">
                <span className="font-semibold text-slate-700">Anamnesis:</span> {patient.history}
              </div>
            </div>
          )}
        </div>

        {/* 3-Mode Dedicated Workspace Segmented Control */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setWorkspaceMode('exploration')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md font-bold text-[11px] transition ${
              workspaceMode === 'exploration'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Mode A: 3D Anatomi (Viewport 3D + Baki Elektroda + Preview 3-Sadapan)"
          >
            <Layers className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="hidden xl:inline">3D Anatomi</span>
            <span className="xl:hidden">3D</span>
          </button>

          <button
            onClick={() => setWorkspaceMode('monitor')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md font-bold text-[11px] transition ${
              workspaceMode === 'monitor'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Mode B: 12L Monitor (100% Kertas Klinis EKG Tanpa Squishing)"
          >
            <Monitor className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden xl:inline">12L Monitor</span>
            <span className="xl:hidden">12L</span>
          </button>

          <button
            onClick={() => setWorkspaceMode('integrated')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md font-bold text-[11px] transition ${
              workspaceMode === 'integrated'
                ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Mode C: Split (Split 50/50 3D & 12L Grid 2x6)"
          >
            <Columns className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Split</span>
          </button>
        </div>
      </div>

      {/* 2. Center Zone: Streamlined 2-Second Idiograph Triage Pill (Guaranteed >= 250-400px visible space) */}
      <div className="flex-1 flex items-center justify-center min-w-0 px-1 sm:px-2">
        <div
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full border shadow-2xs min-w-0 max-w-[440px] w-auto ${triageBadgeConfig.pillBg}`}
          title={`Status Triage: ${triageBadgeConfig.label} | ${diagnostic.primaryHeadline}`}
        >
          {/* Compact Traffic Dot */}
          <span className={`w-2.5 h-2.5 rounded-full ${triageBadgeConfig.dot} shrink-0 animate-pulse`} />

          {/* Dominant Primary Headline */}
          <span className="font-bold text-xs sm:text-[13px] truncate tracking-tight text-slate-900">
            {diagnostic.primaryHeadline}
          </span>

          {/* Heart Rate Badge */}
          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 font-mono font-bold text-[11px] text-sky-700 shrink-0 ml-auto">
            <Activity className="w-3 h-3 text-rose-600 animate-pulse" />
            <span>{Math.round(factors.heartRate)} bpm</span>
          </div>
        </div>
      </div>

      {/* 3. Right Zone: Audio, Slide-Over Drawer button ('Klinis'), Print PDF */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
        {/* Audio Mute/Unmute */}
        <button
          onClick={handleAudioToggle}
          className={`p-1.5 rounded-lg border transition ${
            audioMuted
              ? 'bg-slate-100 text-slate-400 border-slate-200'
              : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
          }`}
          title={audioMuted ? 'Nyalakan audio QRS' : 'Bisukan audio jantung'}
        >
          {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Clinical Slide-Over Drawer Toggle ('Klinis') */}
        <button
          onClick={onToggleInspector}
          className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
            isInspectorOpen
              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="Buka / Tutup Stasiun Klinis & Audit (Drawer Kanan Non-Modal)"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Klinis</span>
        </button>

        {/* Export Vector PDF */}
        <button
          onClick={onExportPdf}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
          title="Cetak Rekam Medis EKG 12-Sadapan Format Standar Rumah Sakit"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Print PDF</span>
        </button>
      </div>
    </header>
  );
};
