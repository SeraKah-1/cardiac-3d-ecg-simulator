import { create } from 'zustand';
import {
  ClinicalFactors,
  LeadId,
  PhysicalElectrodeId,
  WorkspaceMode,
  CardiacConductionPhaseInfo,
} from '../engine/biophysics/types';
import { CLINICAL_PRESETS, ClinicalPreset } from '../engine/clinical/presets';
import { DiagnosticReport } from '../engine/clinical/DiagnosticRuleEngine';

export interface SimulationStoreState {
  // Workspace Layout Mode
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;

  // Clinical Biomarkers & Modulators
  factors: ClinicalFactors;
  activePresetId: string;

  // 3D Viewport Controls
  torsoOpacity: number; // 0.0 to 1.0
  showLeadWires: boolean;
  showDipoleVector: boolean;
  colorStandard: 'AHA' | 'IEC';
  isDraggingElectrode: boolean;
  setIsDraggingElectrode: (dragging: boolean) => void;

  // Electrode Placement & Lead-Off State
  placedElectrodes: Record<PhysicalElectrodeId, boolean>;
  leadOffWarnings: Record<LeadId, boolean>;
  setElectrodePlaced: (id: PhysicalElectrodeId, placed: boolean) => void;
  attachAllElectrodes: () => void;
  detachAllElectrodes: () => void;
  setLeadOffWarnings: (warnings: Record<LeadId, boolean>) => void;

  // ECG Canvas Configuration
  isPlaying: boolean;
  simulationSpeed: number; // 0.1, 0.25, 0.5, 1.0
  paperSpeedMmPerSec: 25 | 50;
  voltageGainMmPerMv: 5 | 10 | 20;
  layoutFormat: 'standard' | 'cabrera';
  displayTheme: 'clinical';

  // Cardiac Conduction Phase
  conductionPhase: CardiacConductionPhaseInfo;
  setConductionPhase: (phase: CardiacConductionPhaseInfo) => void;

  // Inspector & Calipers
  selectedLeadId: LeadId | PhysicalElectrodeId;
  calipersActive: boolean;
  isInspectorOpen: boolean;
  setIsInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;

  // Audio Configuration
  audioMuted: boolean;
  audioVolume: number;

  // Diagnostic State
  currentDiagnostic: DiagnosticReport;

  // Actions
  setFactor: <K extends keyof ClinicalFactors>(key: K, value: ClinicalFactors[K]) => void;
  setFactors: (partial: Partial<ClinicalFactors>) => void;
  loadPreset: (presetId: string) => ClinicalPreset | undefined;
  setTorsoOpacity: (opacity: number) => void;
  setShowLeadWires: (show: boolean) => void;
  setShowDipoleVector: (show: boolean) => void;
  setColorStandard: (std: 'AHA' | 'IEC') => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setSimulationSpeed: (speed: number) => void;
  setPaperSpeed: (speed: 25 | 50) => void;
  setVoltageGain: (gain: 5 | 10 | 20) => void;
  setLayoutFormat: (format: 'standard' | 'cabrera') => void;
  setDisplayTheme: (theme: 'clinical') => void;
  setSelectedLeadId: (id: LeadId | PhysicalElectrodeId) => void;
  setCalipersActive: (active: boolean) => void;
  setAudioMuted: (muted: boolean) => void;
  setAudioVolume: (vol: number) => void;
  setDiagnostic: (report: DiagnosticReport) => void;
}

const defaultPreset = CLINICAL_PRESETS[0];

const INITIAL_PLACED_ELECTRODES: Record<PhysicalElectrodeId, boolean> = {
  RA: true,
  LA: true,
  LL: true,
  RL: true,
  V1: true,
  V2: true,
  V3: true,
  V4: true,
  V5: true,
  V6: true,
};

const INITIAL_LEAD_OFF_WARNINGS: Record<LeadId, boolean> = {
  I: false,
  II: false,
  III: false,
  aVR: false,
  aVL: false,
  aVF: false,
  V1: false,
  V2: false,
  V3: false,
  V4: false,
  V5: false,
  V6: false,
};

export const useSimulationStore = create<SimulationStoreState>((set) => ({
  workspaceMode: 'integrated',
  setWorkspaceMode: (mode) => set({ workspaceMode: mode }),

  factors: { ...defaultPreset.factors },
  activePresetId: defaultPreset.id,

  torsoOpacity: 0.35,
  showLeadWires: true,
  showDipoleVector: true,
  colorStandard: 'AHA',
  isDraggingElectrode: false,
  setIsDraggingElectrode: (dragging) => set({ isDraggingElectrode: dragging }),

  placedElectrodes: { ...INITIAL_PLACED_ELECTRODES },
  leadOffWarnings: { ...INITIAL_LEAD_OFF_WARNINGS },
  setElectrodePlaced: (id, placed) =>
    set((state) => ({
      placedElectrodes: { ...state.placedElectrodes, [id]: placed },
    })),
  attachAllElectrodes: () =>
    set({
      placedElectrodes: { ...INITIAL_PLACED_ELECTRODES },
    }),
  detachAllElectrodes: () =>
    set({
      placedElectrodes: {
        RA: false,
        LA: false,
        LL: false,
        RL: false,
        V1: false,
        V2: false,
        V3: false,
        V4: false,
        V5: false,
        V6: false,
      },
    }),
  setLeadOffWarnings: (warnings) =>
    set((state) => {
      const keys = Object.keys(warnings) as LeadId[];
      let changed = false;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (state.leadOffWarnings[k] !== warnings[k]) {
          changed = true;
          break;
        }
      }
      return changed ? { leadOffWarnings: warnings } : state;
    }),

  isPlaying: true,
  simulationSpeed: 1.0,
  paperSpeedMmPerSec: 25,
  voltageGainMmPerMv: 10,
  layoutFormat: 'standard',
  displayTheme: 'clinical',

  conductionPhase: {
    key: 'Diastole',
    label: 'Fase Diastol',
    organ: 'Polarisasi Istirahat & Pengisian Ventrikel',
    color: 'bg-slate-500 text-white',
  },
  setConductionPhase: (phase) =>
    set((state) => (state.conductionPhase.key === phase.key ? state : { conductionPhase: phase })),

  selectedLeadId: 'V1',
  calipersActive: false,
  isInspectorOpen: false,
  setIsInspectorOpen: (open) => set({ isInspectorOpen: open }),
  toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),

  audioMuted: false,
  audioVolume: 0.25,

  currentDiagnostic: {
    rhythm: 'Normal Sinus Rhythm',
    conduction: [],
    infarctionIschemia: 'No Acute Ischemic ST Changes',
    culpritArtery: null,
    electrolyteAlerts: [],
    urgencyLevel: 'Normal',
    triageCategory: 'green',
    primaryHeadline: 'Normal Sinus Rhythm - No Acute Ischemia',
    bedsideActions: [
      'Healthy lifestyle education and cardiovascular prevention',
      'No emergency intervention indicated at present',
      'Archive baseline ECG recording in patient electronic record',
    ],
    allStatements: ['Normal Sinus Rhythm', 'No Acute Ischemia'],
  },

  setFactor: (key, value) =>
    set((state) => ({
      factors: { ...state.factors, [key]: value },
    })),

  setFactors: (partial) =>
    set((state) => ({
      factors: { ...state.factors, ...partial },
    })),

  loadPreset: (presetId) => {
    const preset = CLINICAL_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      set({
        factors: { ...preset.factors },
        activePresetId: preset.id,
      });
    }
    return preset;
  },

  setTorsoOpacity: (opacity) => set({ torsoOpacity: opacity }),
  setShowLeadWires: (show) => set({ showLeadWires: show }),
  setShowDipoleVector: (show) => set({ showDipoleVector: show }),
  setColorStandard: (std) => set({ colorStandard: std }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  setPaperSpeed: (speed) => set({ paperSpeedMmPerSec: speed }),
  setVoltageGain: (gain) => set({ voltageGainMmPerMv: gain }),
  setLayoutFormat: (format) => set({ layoutFormat: format }),
  setDisplayTheme: (theme) => set({ displayTheme: theme }),

  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
  setCalipersActive: (active) => set({ calipersActive: active }),

  setAudioMuted: (muted) => set({ audioMuted: muted }),
  setAudioVolume: (vol) => set({ audioVolume: vol }),
  setDiagnostic: (report) => set({ currentDiagnostic: report }),
}));
