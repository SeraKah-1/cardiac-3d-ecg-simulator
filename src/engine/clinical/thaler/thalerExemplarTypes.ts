/**
 * Visual Exemplar Data Contracts
 * Defines morphology structures for comparative ECG education.
 * Grounded in Dr. Malcolm S. Thaler's 'The Only EKG Book You'll Ever Need'.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import { ClinicalTier } from './thalerTypes';

export type ExemplarTriageType = 'NORMAL' | 'VARIANT' | 'PATHOLOGY';

export type ExemplarCategory =
  | 'WAVEFORM_ANATOMY'
  | 'RATE'
  | 'AXIS'
  | 'RHYTHM'
  | 'CONDUCTION_AV_BLOCK'
  | 'CONDUCTION_BBB'
  | 'HYPERTROPHY_ATRIAL'
  | 'HYPERTROPHY_VENTRICULAR'
  | 'PRE_EXCITATION'
  | 'INFARCTION_ST_T'
  | 'INFARCTION_Q_WAVE'
  | 'ELECTROLYTES'
  | 'CALIBRATION';

export interface ExemplarCalloutMarker {
  cx: number; // SVG X coordinate (0 to 200)
  cy: number; // SVG Y coordinate (0 to 100)
  radius?: number; // Highlight radius
  label: string; // Brief callout label (e.g. "Titik J", "Delta Wave")
  labelEn?: string;
  type: 'CIRCLE_SPOTLIGHT' | 'BRACKET_INTERVAL' | 'ARROW_POINTER';
  width?: number; // For bracket
  height?: number;
}

export interface VisualExemplarItem {
  id: string;
  category: ExemplarCategory;
  triageType: ExemplarTriageType;
  clinicalTier?: ClinicalTier;
  title: string; // e.g. "STEMI Akut (Tombstone Pattern)"
  titleEn?: string;
  medicalTermEn: string; // e.g. "Acute STEMI / Injury Current"
  badgeLabel: string; // e.g. "Patologi A", "Normal", "Varian"
  badgeLabelEn?: string;

  // 1-Line Visual Clue (What the eye catches in 2 seconds)
  visualClue: string;
  visualClueEn?: string;

  // Clinical Significance (Why it matters)
  clinicalSignificance: string;
  clinicalSignificanceEn?: string;

  // Diagnostic Benchmark Criteria
  diagnosticCriteria: string;
  diagnosticCriteriaEn?: string;

  // Waveform SVG definition (calibrated on 200 x 100 viewBox)
  waveformSvgPath: string;

  // Baseline isoelectric Y coordinate (standard is 50 in 100-height box)
  isoelectricY: number;

  // Specific visual callout marker
  calloutMarker?: ExemplarCalloutMarker;
}

export interface VisualExemplarGroup {
  id: ExemplarCategory;
  groupTitle: string; // e.g. "Segmen ST & Titik J"
  groupTitleEn?: string;
  groupSubtitle: string; // e.g. "Membedakan Infark Akut vs Varian Normal vs Perikarditis"
  groupSubtitleEn?: string;
  clinicalEntityKey: string;
  exemplars: VisualExemplarItem[];
}
