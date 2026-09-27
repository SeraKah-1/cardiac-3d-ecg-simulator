/**
 * Thaler EKG Academy Data Contracts & Types
 * Grounded in Dr. Malcolm S. Thaler's 'The Only EKG Book You'll Ever Need'
 * Strictly adhering to Clinical Idiograph UX invariants (Zero em-dashes).
 */

export type TriageCategory = 'NORMAL' | 'PATHOLOGIC' | 'NON_SIGNIFICANT_VARIANT';

export type ClinicalTier =
  | 'FOUNDATION'
  | 'EMERGENCY_RED_FLAG'
  | 'INTERMEDIATE_WARD'
  | 'ADVANCED_EXPERT';

export interface TierMetadata {
  id: ClinicalTier;
  label: string;
  labelEn?: string;
  badgeLabel: string;
  badgeLabelEn?: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
  description: string;
  descriptionEn?: string;
}

export const CLINICAL_TIER_CONFIG: Record<ClinicalTier, TierMetadata> = {
  FOUNDATION: {
    id: 'FOUNDATION',
    label: 'Tingkat 1: Fondasi & Normal',
    labelEn: 'Level 1: Foundations & Normal',
    badgeLabel: 'Fondasi',
    badgeLabelEn: 'Foundations',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/60',
    borderClass: 'border-emerald-800/80',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    description: 'Anatomi dasar gelombang, interval normal, varian fisiologis, dan pulsa kalibrasi.',
    descriptionEn: 'Basic waveform anatomy, normal intervals, physiological variants, and calibration pulses.',
  },
  EMERGENCY_RED_FLAG: {
    id: 'EMERGENCY_RED_FLAG',
    label: 'Tingkat 2: Kegawatdaruratan Merah (Red Flags)',
    labelEn: 'Level 2: Emergency Red Flags',
    badgeLabel: 'Gawat Darurat',
    badgeLabelEn: 'Emergency',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-950/60',
    borderClass: 'border-rose-800/80',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    description: 'Kondisi mengancam jiwa: STEMI, VT, Blok Total, Fibrilasi Atrium Cepat, Brugada, Emboli Paru.',
    descriptionEn: 'Life-threatening emergencies: STEMI, VT, Complete Heart Block, Rapid Atrial Fibrillation, Brugada, Pulmonary Embolism.',
  },
  INTERMEDIATE_WARD: {
    id: 'INTERMEDIATE_WARD',
    label: 'Tingkat 3: Ruang Rawat & Bangsal Medis',
    labelEn: 'Level 3: Inpatient & Medical Ward',
    badgeLabel: 'Bangsal',
    badgeLabelEn: 'Ward',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-950/60',
    borderClass: 'border-amber-800/80',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    description: 'Kasus rutin rawat inap: Hipertropi ventrikel, WPW, Flutter atrium, perikarditis, hipokalemia.',
    descriptionEn: 'Routine inpatient cases: Ventricular hypertrophy, WPW, Atrial flutter, pericarditis, hypokalemia.',
  },
  ADVANCED_EXPERT: {
    id: 'ADVANCED_EXPERT',
    label: 'Tingkat 4: Lanjutan & Blok Fasikular',
    labelEn: 'Level 4: Advanced & Fascicular Blocks',
    badgeLabel: 'Lanjutan',
    badgeLabelEn: 'Advanced',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-950/60',
    borderClass: 'border-purple-800/80',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
    description: 'Kelainan konduksi intraventrikular rumit: RBBB, LBBB, Hemiblok anterior kiri (LAHB), intoksikasi digitalis.',
    descriptionEn: 'Complex intraventricular conduction defects: RBBB, LBBB, Left anterior hemiblock (LAHB), digitalis toxicity.',
  },
};

export type PathologyGroup = 
  | 'ACUTE_CORONARY_SYNDROME' 
  | 'ARRHYTHMIA' 
  | 'CONDUCTION_BLOCK' 
  | 'HYPERTROPHY' 
  | 'SYSTEMIC_ELECTROLYTE_DRUG';

export type AxisClassification = 'NORMAL' | 'LAD' | 'RAD' | 'EXTREME';

export interface BoundingBox {
  x: number; // Percentage coordinate (0 to 100)
  y: number; // Percentage coordinate (0 to 100)
  width: number; // Percentage width
  height: number; // Percentage height
  label?: string; // Optional feature label (e.g. 'Gelombang P', 'Kompleks QRS', 'Segmen ST')
  labelEn?: string; // Optional English feature label
}

export interface CameraCoordinates {
  focusLeads: string[];
  zoomLevel: number;
  centerPercentX: number;
  centerPercentY: number;
}

export interface InSituCaliperAnnotation {
  type: 'RATE_CALIPER' | 'INTERVAL_CALIPER' | 'AXIS_VECTOR' | 'ST_ELEVATION' | 'VOLTAGE_CALIPER' | 'CALIBRATION_PULSE';
  targetLead: string;
  leadRow: number;
  leadCol: number;
  label: string;
  labelEn?: string;
  calculationFormula?: string;
  calculationFormulaEn?: string;
  latexFormula?: string;
  detailExplanation: string;
  detailExplanationEn?: string;
  smallBoxesCount?: number;
  largeBoxesCount?: number;
  voltageMv?: number;
  durationSec?: number;
  targetRail?: 'TOP' | 'BOTTOM';
}

export interface TutorialStep {
  stepIndex: number;
  stepNumber: number; // 0 to 9 (0 for Chapter 0 foundational anatomy, 1 to 9 for systematic tutorial steps)
  stepName: string;
  stepNameEn?: string;
  cameraTarget: CameraCoordinates;
  highlightBoxes: BoundingBox[];
  clinicalFindingTitle: string;
  clinicalFindingTitleEn?: string;
  triageStatus: 'NORMAL' | 'ABNORMAL' | 'NEUTRAL';
  plainInstructions: string[];
  plainInstructionsEn?: string[];
  clinicalTip?: string;
  clinicalTipEn?: string;
  thalerRuleQuote: string; // Kept for backward test compatibility
  thalerRuleQuoteEn?: string;
  deepMechanismDetails?: string;
  deepMechanismDetailsEn?: string;
  relevantFormula?: string;
  relevantFormulaEn?: string;
  latexFormula?: string;
  inSituAnnotation?: InSituCaliperAnnotation;
  exemplarGroupId?: string;
}

export interface PatientPresentation {
  name: string;
  mrn: string;
  age: number;
  gender: 'Male' | 'Female';
  chiefComplaint: string;
  chiefComplaintEn?: string;
  vitalSigns: {
    bloodPressure: string;
    heartRateBpm: number;
    respiratoryRate: number;
    spo2Percent: number;
  };
}

export interface LeadWaveformPoint {
  timeSec: number;
  millivolts: number;
}

export type LeadMap = Record<string, number[]>; // Array of microvolt/millivolt samples at 250Hz or 500Hz

export type PWaveMorphology = 'NORMAL_SINUS' | 'ECTOPIC_ATRIAL' | 'RETROGRADE' | 'ABSENT_FIBRILLATORY' | 'FLUTTER' | 'DISSOCIATED';
export type AtrialEnlargement = 'NORMAL' | 'RAE' | 'LAE' | 'BIATRIAL';
export type VentricularHypertrophy = 'NORMAL' | 'LVH' | 'LVH_STRAIN' | 'RVH';
export type BundleBranchBlock = 'NONE' | 'RBBB' | 'LBBB' | 'WPW_PREEXCITATION';
export type RWaveProgression = 'NORMAL' | 'POOR_R_PROGRESSION' | 'EARLY_TRANSITION' | 'REVERSED';
export type UWaveStatus = 'NORMAL' | 'PROMINENT' | 'INVERTED';

export interface EKGCase {
  id: string;
  caseCode: string;
  title: string;
  titleEn?: string;
  medicalTermEn?: string;
  category: TriageCategory;
  clinicalTier: ClinicalTier;
  pathologyGroup?: PathologyGroup;
  difficultyLevel: 1 | 2 | 3;
  patient: PatientPresentation;
  calibration: {
    paperSpeedMmPerSec: number; // 25
    voltageMmPerMv: number;      // 10
    samplingRateHz: number;      // 250 or 500
  };
  metrics: {
    heartRateBpm: number;
    rhythmDescription: string;
    rhythmDescriptionEn?: string;
    isRegular: boolean;
    axisDegrees: number;
    axisClassification: AxisClassification;
    prIntervalMs: number;
    qrsDurationMs: number;
    qtcIntervalMs: number;
    stElevationLeads: string[];
    stDepressionLeads: string[];
    tWaveInversionLeads: string[];
    pathologicQWaveLeads: string[];
    pWaveMorphology?: PWaveMorphology;
    atrialEnlargement?: AtrialEnlargement;
    ventricularHypertrophy?: VentricularHypertrophy;
    bundleBranchBlock?: BundleBranchBlock;
    rWaveProgression?: RWaveProgression;
    uWaveStatus?: UWaveStatus;
  };
  tutorialSteps: TutorialStep[];
  // Precomputed or synthesized lead waveform data:
  // 12 leads: I, II, III, aVR, aVL, aVF, V1, V2, V3, V4, V5, V6, plus long rhythm strip (II)
  leadSamples: LeadMap;
}

export interface CaliperMeasurement {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaMmX: number;
  deltaMmY: number;
  deltaSec: number;
  deltaMv: number;
  active: boolean;
}
