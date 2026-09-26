import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { CardiacDipoleEngine, getCardiacConductionPhase } from './engine/biophysics/CardiacDipoleEngine';
import { LeadFieldModel } from './engine/biophysics/LeadFieldModel';
import { LeadId, Vector3D } from './engine/biophysics/types';
import { EcgRingBuffer } from './components/ecg/EcgRingBuffer';
import { DiagnosticRuleEngine, MeasuredECGFeatures } from './engine/clinical/DiagnosticRuleEngine';
import { CLINICAL_PRESETS } from './engine/clinical/presets';
import { EcgPdfExporter, ExportPatientInfo } from './engine/export/EcgPdfExporter';
import { cardiacAudio } from './engine/audio/CardiacAudioEngine';
import { useSimulationStore } from './store/useSimulationStore';
import { AppHeader } from './components/layout/AppHeader';
import { Cardiac3DViewport } from './components/viewport3d/Cardiac3DViewport';
import { EcgMultiLeadCanvas } from './components/ecg/EcgMultiLeadCanvas';
import { EcgRhythmStripPreview } from './components/ecg/EcgRhythmStripPreview';
import { ClinicalSlideOverDrawer } from './components/inspector/ClinicalSlideOverDrawer';
import { CardiacPhaseBar } from './components/hud/CardiacPhaseBar';
import { TimeSpeedHUD } from './components/hud/TimeSpeedHUD';
import { ThalerAcademyView } from './components/thaler/ThalerAcademyView';
import { useLocale } from './locales/useLocale';

const LEAD_LIST: LeadId[] = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
const DT_SUBSTEP = 0.002; // Fixed timestep 500 Hz = exactly 2 ms per sample
const MAX_SUBSTEPS_PER_FRAME = 25; // Prevents spiral of death on background tab wakeups

export const App: React.FC = () => {
  const { locale } = useLocale();
  // Core Biophysical Engines
  const dipoleEngine = useMemo(() => new CardiacDipoleEngine(), []);
  const leadModel = useMemo(() => new LeadFieldModel(), []);

  // Pre-allocated ring buffers for all 12 leads (5000 samples = 10s at 500 Hz)
  const buffers = useMemo(() => {
    const map: Partial<Record<LeadId, EcgRingBuffer>> = {};
    for (const id of LEAD_LIST) {
      map[id] = new EcgRingBuffer(5000);
    }
    return map as Record<LeadId, EcgRingBuffer>;
  }, []);

  // Reactive state from Zustand store
  const factors = useSimulationStore((s) => s.factors);
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const simulationSpeed = useSimulationStore((s) => s.simulationSpeed);
  const setDiagnostic = useSimulationStore((s) => s.setDiagnostic);
  const activePresetId = useSimulationStore((s) => s.activePresetId);
  const workspaceMode = useSimulationStore((s) => s.workspaceMode);
  const placedElectrodes = useSimulationStore((s) => s.placedElectrodes);
  const setLeadOffWarnings = useSimulationStore((s) => s.setLeadOffWarnings);
  const setConductionPhase = useSimulationStore((s) => s.setConductionPhase);
  const isInspectorOpen = useSimulationStore((s) => s.isInspectorOpen);
  const setIsInspectorOpen = useSimulationStore((s) => s.setIsInspectorOpen);

  // Top-level View Switcher: 'thaler_academy' or 'simulator'
  const [activeAppView, setActiveAppView] = useState<'simulator' | 'thaler_academy'>('thaler_academy');

  // Local state for rendering synchronizer
  const [currentPhase, setCurrentPhase] = useState(0);
  const [graphicsDipole, setGraphicsDipole] = useState<Vector3D>({ x: 0, y: 0, z: 0 });

  // Audio R-wave peak detection state
  const prevRWaveRef = useRef<number>(0);
  const lastBeepTimeRef = useRef<number>(0);

  const simTimeRef = useRef<number>(0);

  // Mobile Safari/Chrome AudioContext unlock on first user touch gesture
  useEffect(() => {
    const handleFirstGesture = () => {
      cardiacAudio.unlock();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  // Synchronize electrode positions with active preset (e.g. V1/V2 malposition in 2nd ICS)
  useEffect(() => {
    const preset = CLINICAL_PRESETS.find((p) => p.id === activePresetId);
    if (preset?.electrodeMisplacement) {
      leadModel.setElectrodePosition('V1', { x: -0.03, y: -0.065, z: -0.11 }, false);
      leadModel.setElectrodePosition('V2', { x:  0.03, y: -0.065, z: -0.11 }, false);
    } else {
      leadModel.resetToStandardPositions();
    }
  }, [activePresetId, leadModel]);

  // Step Forward action: advance exactly 50ms (25 sub-steps at 500 Hz)
  const handleStepForward = useCallback(() => {
    for (let i = 0; i < 25; i++) {
      simTimeRef.current += DT_SUBSTEP * 1000.0;
      const phase = dipoleEngine.advancePhase(DT_SUBSTEP, factors);
      const dipole = dipoleEngine.evaluateDipole(phase, factors, simTimeRef.current / 1000.0);
      const frame = leadModel.compute12Leads(dipole, phase, simTimeRef.current, placedElectrodes);

      for (let l = 0; l < LEAD_LIST.length; l++) {
        const id = LEAD_LIST[l];
        buffers[id].push(frame.leads[id]);
      }
    }

    const currentSimPhase = dipoleEngine.getPhase();
    setCurrentPhase(currentSimPhase);
    const latestDipole = dipoleEngine.evaluateDipole(
      currentSimPhase,
      factors,
      simTimeRef.current / 1000.0
    );
    setGraphicsDipole(CardiacDipoleEngine.toGraphicsCoords(latestDipole));
    setConductionPhase(getCardiacConductionPhase(currentSimPhase, factors.rhythmType));
  }, [buffers, dipoleEngine, factors, leadModel, placedElectrodes, setConductionPhase]);

  // Fixed-Timestep Sub-Stepping at 500 Hz (dt = 0.002s) Simulation Loop
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();
    let accumulator = 0;

    const simulationTick = (now: number) => {
      const dtRaw = (now - lastTimestamp) / 1000.0;
      lastTimestamp = now;

      // Clamp raw frame delta to 100ms maximum to prevent spiral of death
      const dtClamped = Math.min(0.1, dtRaw);
      const effectiveDt = (isPlaying ? simulationSpeed : 0) * dtClamped;

      accumulator += effectiveDt;
      let substeps = 0;

      while (accumulator >= DT_SUBSTEP && substeps < MAX_SUBSTEPS_PER_FRAME) {
        simTimeRef.current += DT_SUBSTEP * 1000.0;
        const tSec = simTimeRef.current / 1000.0;

        // 1. Advance cardiac cycle phase
        const phase = dipoleEngine.advancePhase(DT_SUBSTEP, factors);

        // 2. Evaluate 3D dipole vector (with dynamic time for multi-oscillator arrhythmias)
        const dipole = dipoleEngine.evaluateDipole(phase, factors, tSec);

        // 3. Project onto all 12 leads via LeadFieldModel with active placed electrodes
        const frame = leadModel.compute12Leads(dipole, phase, simTimeRef.current, placedElectrodes);

        // 4. Push exact 500 Hz sample into zero-allocation ring buffers
        for (let i = 0; i < LEAD_LIST.length; i++) {
          const id = LEAD_LIST[i];
          buffers[id].push(frame.leads[id]);
        }

        // 5. Audio monitor beep on Lead II R-wave peak (only if Lead II is placed and not in lethal arrhythmia)
        const isLethalArrest =
          factors.rhythmType === 'vfib_coarse' ||
          factors.rhythmType === 'vfib_fine' ||
          factors.rhythmType === 'asystole' ||
          factors.rhythmType === 'torsades';

        if (!frame.leadOffStatus.II && !isLethalArrest) {
          const lead2Val = frame.leads['II'];
          if (
            lead2Val > 0.8 &&
            prevRWaveRef.current <= 0.8 &&
            now - lastBeepTimeRef.current > 250
          ) {
            cardiacAudio.triggerQrsBeep(factors.spo2Percent);
            lastBeepTimeRef.current = now;
          }
          prevRWaveRef.current = lead2Val;
        }

        accumulator -= DT_SUBSTEP;
        substeps++;
      }

      // Discard residual accumulator beyond 100ms
      if (accumulator > 0.1) {
        accumulator = 0;
      }

      // Synchronize UI visuals once per display frame
      const currentSimPhase = dipoleEngine.getPhase();
      setCurrentPhase(currentSimPhase);

      const latestDipole = dipoleEngine.evaluateDipole(
        currentSimPhase,
        factors,
        simTimeRef.current / 1000.0
      );
      setGraphicsDipole(CardiacDipoleEngine.toGraphicsCoords(latestDipole));

      // Update real-time Cardiac Conduction Phase
      const phaseInfo = getCardiacConductionPhase(currentSimPhase, factors.rhythmType);
      setConductionPhase(phaseInfo);

      // Update lead-off warnings in store
      const sampleFrame = leadModel.compute12Leads(
        latestDipole,
        currentSimPhase,
        simTimeRef.current,
        placedElectrodes
      );
      setLeadOffWarnings(sampleFrame.leadOffStatus);

      animId = requestAnimationFrame(simulationTick);
    };

    animId = requestAnimationFrame(simulationTick);
    return () => cancelAnimationFrame(animId);
  }, [
    buffers,
    dipoleEngine,
    factors,
    isPlaying,
    leadModel,
    placedElectrodes,
    setConductionPhase,
    setLeadOffWarnings,
    simulationSpeed,
  ]);

  // Reactive Clinical Diagnostic Rule Engine: 100% stable closed-form analytical ST evaluation
  useEffect(() => {
    const analytical = leadModel.computeAnalyticalFeatures(factors, placedElectrodes);
    const preset = CLINICAL_PRESETS.find((p) => p.id === activePresetId);
    const isHighV1V2 = leadModel.electrodes.V1.y < -0.035 || !!preset?.electrodeMisplacement;

    const features: MeasuredECGFeatures = {
      heartRate: factors.heartRate,
      prIntervalMs: analytical.prIntervalMs,
      qrsDurationMs: analytical.qrsDurationMs,
      qtIntervalMs: analytical.qtIntervalMs,
      qtcBazettMs: analytical.qtcBazettMs,
      qtcFridericiaMs: analytical.qtcFridericiaMs,
      stDeviationMv: analytical.stDeviationMv,
      tWaveAmplitudeMv: analytical.tWaveAmplitudeMv,
      factors,
      electrodeMisplacement: isHighV1V2,
    };

    const report = DiagnosticRuleEngine.evaluate(features, locale);
    setDiagnostic(report);
  }, [factors, placedElectrodes, activePresetId, leadModel, setDiagnostic, locale]);

  // Critical Cardiac Alarm Coupling (IEC 60601-1-8 standard) for Lethal Arrhythmias
  useEffect(() => {
    const isLethalArrest =
      factors.rhythmType === 'vfib_coarse' ||
      factors.rhythmType === 'vfib_fine' ||
      factors.rhythmType === 'asystole' ||
      factors.rhythmType === 'torsades';

    if (isLethalArrest && isPlaying) {
      cardiacAudio.startCriticalAlarm();
    } else {
      cardiacAudio.stopAlarm();
    }

    return () => {
      cardiacAudio.stopAlarm();
    };
  }, [factors.rhythmType, isPlaying]);

  // Handle PDF Export with Authentic Patient Information
  const handleExportPdf = useCallback(() => {
    const diagnostic = useSimulationStore.getState().currentDiagnostic;
    const recorded: Partial<Record<LeadId, number[]>> = {};

    for (let i = 0; i < LEAD_LIST.length; i++) {
      const id = LEAD_LIST[i];
      recorded[id] = buffers[id].getLatest(1250); // 2.5 seconds window for column display
    }

    const activePreset = CLINICAL_PRESETS.find((p) => p.id === activePresetId) || CLINICAL_PRESETS[0];

    const patient: ExportPatientInfo = {
      name: activePreset.patientInfo.name,
      id: activePreset.patientInfo.id,
      age: activePreset.patientInfo.age,
      gender: activePreset.patientInfo.gender,
      history: activePreset.patientInfo.history,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    };

    EcgPdfExporter.exportToPdf(
      recorded as Record<LeadId, number[]>,
      diagnostic,
      patient,
      factors
    );
  }, [activePresetId, buffers, factors]);

  if (activeAppView === 'thaler_academy') {
    return <ThalerAcademyView onBackToSimulator={() => setActiveAppView('simulator')} />;
  }

  return (
    <div className="w-full h-[100dvh] min-h-[100dvh] flex flex-col bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* 1. Streamlined App Top Header (52px) */}
      <AppHeader
        onExportPdf={handleExportPdf}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        isInspectorOpen={isInspectorOpen}
        onOpenThalerAcademy={() => setActiveAppView('thaler_academy')}
      />

      {/* 2. Dedicated Workspace Main Viewport Area */}
      <main className="flex-1 flex w-full overflow-hidden relative">
        {/* Mode A: 'Eksplorasi Anatomi' (Full-height 3D Viewport, Collapsible Electrode Tray, and Rhythm Strip Preview) */}
        {workspaceMode === 'exploration' && (
          <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
            <div className="flex-1 w-full h-full relative">
              <Cardiac3DViewport
                leadModel={leadModel}
                currentPhase={currentPhase}
                graphicsDipole={graphicsDipole}
                showTray={true}
              />
            </div>
            {/* Compact 3-Lead Rhythm Strip Preview at Bottom */}
            <EcgRhythmStripPreview buffers={buffers} leads={['I', 'II', 'V2']} />
          </div>
        )}

        {/* Mode B: 'Monitor EKG 12-Sadapan' (100% Full-Screen Clinical Paper, Row Height >185px, Zero Squishing) */}
        {workspaceMode === 'monitor' && (
          <div className="flex-1 h-full w-full overflow-hidden">
            <EcgMultiLeadCanvas buffers={buffers} />
          </div>
        )}

        {/* Mode C: 'Stasiun Terpadu' (Split: 3D Viewport & 12L Canvas - stacks vertically on mobile, side-by-side on desktop) */}
        {workspaceMode === 'integrated' && (
          <div className="flex-1 flex flex-col md:flex-row w-full h-full overflow-hidden">
            {/* Top on mobile, Left 50% on desktop: 3D Viewport */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-200">
              <Cardiac3DViewport
                leadModel={leadModel}
                currentPhase={currentPhase}
                graphicsDipole={graphicsDipole}
                showTray={true}
              />
            </div>

            {/* Bottom on mobile, Right 50% on desktop: 12-Lead ECG Canvas */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full">
              <EcgMultiLeadCanvas buffers={buffers} />
            </div>
          </div>
        )}
      </main>

      {/* 3. Unified Bottom Transport Dock: height 40px, fixed at bottom */}
      <footer className="h-10 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 sm:px-4 flex items-center justify-between z-20 shrink-0 shadow-xs gap-2 sm:gap-4 select-none">
        {/* Left/Center: Real-time Cardiac Conduction Phase Bar */}
        <CardiacPhaseBar />

        {/* Right: Time Speed HUD Controls (Play/Pause, Step 50ms, Speed Presets) */}
        <TimeSpeedHUD onStepForward={handleStepForward} />
      </footer>

      {/* 4. Non-Modal Right Slide-Over Drawer: Patient Details & Biophysical Audit */}
      <ClinicalSlideOverDrawer
        buffers={buffers}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        leadModel={leadModel}
        graphicsDipole={graphicsDipole}
        currentPhase={currentPhase}
      />
    </div>
  );
};

export default App;
