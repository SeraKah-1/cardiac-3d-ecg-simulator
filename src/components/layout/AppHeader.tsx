import React, { useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { CLINICAL_PRESETS } from '../../engine/clinical/presets';
import { cardiacAudio } from '../../engine/audio/CardiacAudioEngine';
import { useLocale } from '../../locales/useLocale';
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
  Globe,
  Menu,
  X,
} from 'lucide-react';

interface AppHeaderProps {
  onExportPdf: () => void;
  onToggleInspector: () => void;
  isInspectorOpen: boolean;
  onOpenThalerAcademy?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onExportPdf,
  onToggleInspector,
  isInspectorOpen,
  onOpenThalerAcademy,
}) => {
  const { locale, toggleLocale, t } = useLocale();
  const [showPatientPopover, setShowPatientPopover] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      label: t.appHeader.triageCito,
    },
    yellow: {
      dot: 'bg-amber-500',
      pillBg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      label: t.appHeader.triageWarning,
    },
    green: {
      dot: 'bg-emerald-500',
      pillBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      label: t.appHeader.triageStable,
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
          <span className="text-slate-500 font-medium hidden xl:inline">{t.appHeader.caseLabel}</span>
          <select
            value={activePresetId}
            onChange={handlePresetChange}
            className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[160px] md:max-w-[185px] truncate text-xs"
            title={t.appHeader.selectScenarioTitle}
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
                <span className="font-bold text-slate-900">{patient.name}, {patient.age}{t.appHeader.yearsOldSuffix}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  {patient.id}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mb-1">
                <span className="font-semibold text-slate-700">{t.appHeader.genderLabel}</span> {patient.gender}
              </div>
              <div className="text-[11px] text-slate-600 leading-snug">
                <span className="font-semibold text-slate-700">{t.appHeader.historyLabel}</span> {patient.history}
              </div>
            </div>
          )}
        </div>

        {/* 3-Mode Dedicated Workspace Segmented Control (Desktop md+) */}
        <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setWorkspaceMode('exploration')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md font-bold text-[11px] transition ${
              workspaceMode === 'exploration'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title={t.appHeader.mode3DTooltip}
          >
            <Layers className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="hidden xl:inline">{t.appHeader.mode3D}</span>
            <span className="xl:hidden">{t.appHeader.mode3DShort}</span>
          </button>

          <button
            onClick={() => setWorkspaceMode('monitor')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md font-bold text-[11px] transition ${
              workspaceMode === 'monitor'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title={t.appHeader.mode12LTooltip}
          >
            <Monitor className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden xl:inline">{t.appHeader.mode12L}</span>
            <span className="xl:hidden">{t.appHeader.mode12LShort}</span>
          </button>

          <button
            onClick={() => setWorkspaceMode('integrated')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md font-bold text-[11px] transition ${
              workspaceMode === 'integrated'
                ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title={t.appHeader.modeSplitTooltip}
          >
            <Columns className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>{t.appHeader.modeSplit}</span>
          </button>
        </div>
      </div>

      {/* 2. Center Zone: Streamlined 2-Second Idiograph Triage Pill */}
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

      {/* 3. Right Zone: Desktop Actions (hidden on mobile) & Mobile Hamburger */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
        {/* Desktop Buttons (md+) */}
        <div className="hidden md:flex items-center space-x-1 sm:space-x-1.5">
          {/* Audio Mute/Unmute */}
          <button
            onClick={handleAudioToggle}
            className={`p-1.5 rounded-lg border transition ${
              audioMuted
                ? 'bg-slate-100 text-slate-400 border-slate-200'
                : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
            }`}
            title={audioMuted ? t.appHeader.unmuteAudio : t.appHeader.muteAudio}
          >
            {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Clinical Slide-Over Drawer Toggle */}
          <button
            onClick={onToggleInspector}
            className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
              isInspectorOpen
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title={t.appHeader.toggleInspector}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.appHeader.inspectorButton}</span>
          </button>

          {/* 12-Lead ECG Tutorial Workstation Button */}
          {onOpenThalerAcademy && (
            <button
              onClick={onOpenThalerAcademy}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title={t.appHeader.tutorialTooltip}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t.appHeader.tutorialButton}</span>
              <span className="lg:hidden">{t.appHeader.tutorialShort}</span>
            </button>
          )}

          {/* Export Vector PDF */}
          <button
            onClick={onExportPdf}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            title={t.appHeader.printPdfTooltip}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.appHeader.printPdf}</span>
          </button>

          {/* Global Locale Switcher Toggle (ID / EN) */}
          <button
            onClick={toggleLocale}
            className="flex items-center space-x-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-mono font-bold text-slate-700 transition cursor-pointer"
            title={locale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
          >
            <Globe className="w-3 h-3 text-slate-500 shrink-0" />
            <span className={locale === 'id' ? 'text-sky-600 font-black' : 'text-slate-400'}>ID</span>
            <span className="text-slate-300">/</span>
            <span className={locale === 'en' ? 'text-sky-600 font-black' : 'text-slate-400'}>EN</span>
          </button>
        </div>

        {/* Mobile Quick Tutorial Button (Compact) */}
        {onOpenThalerAcademy && (
          <button
            onClick={onOpenThalerAcademy}
            className="md:hidden flex items-center p-1.5 rounded-lg bg-blue-700 text-white text-xs font-bold shadow-xs"
            title={t.appHeader.tutorialTooltip}
          >
            <Activity className="w-4 h-4" />
          </button>
        )}

        {/* Mobile Hamburger Menu Button (< md) */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Slide-Over Navigation Sheet */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" />

          {/* Slide-over Content Drawer */}
          <div
            className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-sky-600 to-rose-600 flex items-center justify-center">
                  <Heart className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                <span className="font-bold text-sm tracking-tight text-slate-900">CardioSim 3D</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Patient Case Dossier */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{patient.name}, {patient.age}{t.appHeader.yearsOldSuffix}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700">{patient.id}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold">{t.appHeader.genderLabel}</span> {patient.gender}
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold">{t.appHeader.historyLabel}</span> {patient.history}
                </div>
              </div>

              {/* Workspace View Mode */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {locale === 'en' ? 'Workspace Mode' : 'Mode Tampilan'}
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => {
                      setWorkspaceMode('exploration');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-left transition ${
                      workspaceMode === 'exploration'
                        ? 'bg-sky-50 border-sky-400 text-sky-800 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">{t.appHeader.mode3D}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{t.appHeader.mode3DTooltip}</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setWorkspaceMode('monitor');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-left transition ${
                      workspaceMode === 'monitor'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Monitor className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">{t.appHeader.mode12L}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{t.appHeader.mode12LTooltip}</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setWorkspaceMode('integrated');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-left transition ${
                      workspaceMode === 'integrated'
                        ? 'bg-purple-50 border-purple-400 text-purple-800 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Columns className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">{t.appHeader.modeSplit}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{t.appHeader.modeSplitTooltip}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tools & Modules */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {locale === 'en' ? 'Actions & Tools' : 'Alat & Modul'}
                </label>

                {onOpenThalerAcademy && (
                  <button
                    onClick={() => {
                      onOpenThalerAcademy();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold transition shadow-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4" />
                      <span>{t.appHeader.tutorialButton}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-800 font-mono">12-Lead</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onToggleInspector();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border font-semibold transition ${
                    isInspectorOpen
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>{t.appHeader.inspectorButton}</span>
                  </div>
                  <span className="text-[10px] font-mono">{isInspectorOpen ? 'ACTIVE' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => {
                    onExportPdf();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs"
                >
                  <div className="flex items-center space-x-2">
                    <FileDown className="w-4 h-4" />
                    <span>{t.appHeader.printPdf}</span>
                  </div>
                  <span className="text-[10px] font-mono">PDF</span>
                </button>

                <button
                  onClick={handleAudioToggle}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border font-semibold transition ${
                    audioMuted
                      ? 'bg-slate-100 text-slate-500 border-slate-200'
                      : 'bg-sky-50 text-sky-800 border-sky-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {audioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-sky-600" />}
                    <span>{audioMuted ? t.appHeader.unmuteAudio : t.appHeader.muteAudio}</span>
                  </div>
                  <span className="text-[10px] font-mono">{audioMuted ? 'MUTED' : 'ON'}</span>
                </button>
              </div>

              {/* Language Switch */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  onClick={toggleLocale}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <span>{locale === 'id' ? 'Bahasa Indonesia' : 'English (US)'}</span>
                  </div>
                  <span className="font-mono text-xs text-sky-600 uppercase">[{locale.toUpperCase()}]</span>
                </button>
              </div>
            </div>

            {/* Safe Area Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
              CardioSim 3D • Clinical Biophysics Engine
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
