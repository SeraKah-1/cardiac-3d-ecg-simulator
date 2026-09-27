/**
 * ThalerPracticeDrill: High-Yield Systematic 10-Step Clinical Practice Mode
 * Enforces the Gold-Standard 12-Lead EKG Interpretation Sequence:
 * 1. Technical Preflight & Calibration (Speed, Voltage, aVR)
 * 2. Heart Rate Determination (bpm, brady/normal/tachy)
 * 3. Cardiac Rhythm & Regularity (Sinus, Atrial, Junctional, Ventricular, Blocks)
 * 4. Frontal Electrical Axis & Lead II Confirmation
 * 5. P-Wave Morphology & Atrial Enlargement (RAE, LAE, f-waves, flutter, dissociation)
 * 6. Conduction Intervals & AV Blocks (PR interval, Sex-specific QTc)
 * 7. QRS Complex Duration & Bundle Branch Blocks (Narrow, Wide, RBBB, LBBB, WPW)
 * 8. Precordial R-Wave Progression & Pathological Q Waves (V1-V6, PRWP, Necrosis)
 * 9. ST-Segment, T-Wave & U-Wave Repolarization (STEMI, Ischemia, Hyperkalemia, Hypokalemia)
 * 10. Anatomical Vascular Territories, Triage & Definitive Diagnosis
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  HelpCircle,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { EKGCase, TriageCategory, CLINICAL_TIER_CONFIG } from '../../engine/clinical/thaler/thalerTypes';
import { ThalerPdfExportEngine } from '../../engine/export/ThalerPdfExportEngine';
import { FeedbackStorage } from '../../engine/storage/feedbackStorage';
import { useLocale } from '../../locales/useLocale';

interface ThalerPracticeDrillProps {
  cases: EKGCase[];
  currentCase: EKGCase;
  onSelectCase: (caseId: string) => void;
  onOpenTutorialForCase: () => void;
  onResetZoom: () => void;
}

interface FormState {
  // Step 1: Kalibrasi & Standarisasi (Technical Preflight)
  paperSpeed: '25' | '50' | '';
  voltageSensitivity: '10' | '5' | '20' | '';
  avrOrientation: 'NEGATIVE' | 'POSITIVE' | '';

  // Step 2: Frekuensi Denyut Jantung (Heart Rate)
  heartRateBpm: string;
  rateCategory: 'BRADYCARDIA' | 'NORMAL' | 'TACHYCARDIA' | '';

  // Step 3: Irama & Reguleritas (Rhythm)
  regularity: 'REGULAR' | 'IRREGULAR' | 'IRREGULARLY_IRREGULAR' | '';
  rhythmOrigin: string;

  // Step 4: Aksis Bidang Frontal (Frontal Electrical Axis)
  axisClassification: 'NORMAL' | 'LAD' | 'RAD' | 'EXTREME' | '';
  leadIIPolarity: 'POSITIVE' | 'NEGATIVE' | '';

  // Step 5: Analisis Gelombang P & Pembesaran Atrium (P Wave & Atrium)
  pWaveMorphology: 'NORMAL_SINUS' | 'ECTOPIC_ATRIAL' | 'RETROGRADE' | 'ABSENT_FIBRILLATORY' | 'FLUTTER' | 'DISSOCIATED' | '';
  atrialEnlargement: 'NORMAL' | 'RAE' | 'LAE' | 'BIATRIAL' | '';

  // Step 6: Interval Konduksi & Blok AV (PR, QTc)
  prStatus: 'NORMAL' | 'PROLONGED' | 'SHORTENED' | 'ABSENT' | '';
  qtcStatus: 'NORMAL' | 'PROLONGED' | 'SHORTENED' | '';

  // Step 7: Kompleks QRS & Blok Berkas (QRS Duration & BBB)
  qrsStatus: 'NARROW' | 'WIDE' | '';
  bundleBranchBlock: 'NONE' | 'RBBB' | 'LBBB' | 'WPW_PREEXCITATION' | '';
  conductionDefect: string;

  // Step 8: Progresi Gelombang R Prekordial & Gelombang Q Patologis
  rWaveProgression: 'NORMAL' | 'POOR_R_PROGRESSION' | 'EARLY_TRANSITION' | 'REVERSED' | '';
  hasPathologicQ: 'NO' | 'YES' | '';

  // Step 9: Segmen ST, Gelombang T & Gelombang U (Repolarisasi)
  stDeviation: 'ISOELECTRIC' | 'ELEVATION' | 'DEPRESSION' | 'BOTH' | '';
  tWaveMorphology: 'NORMAL' | 'INVERTED' | 'PEAKED_TENTED' | 'FLAT' | '';
  uWaveStatus: 'NORMAL' | 'PROMINENT' | 'INVERTED' | '';
  stTFindings: string[];
  affectedLeads: string;

  // Step 10: Teritori Vaskular Anatomi & Sintesis Triase Klinis
  vascularTerritory: 'NONE' | 'INFERIOR' | 'ANTEROSEPTAL' | 'LATERAL' | 'POSTERIOR' | 'DIFFUSE' | '';
  triageCategory: TriageCategory | '';
  clinicalDiagnosis: string;
  confidenceLevel: 50 | 75 | 100;
}

const INITIAL_FORM: FormState = {
  paperSpeed: '25',
  voltageSensitivity: '10',
  avrOrientation: 'NEGATIVE',
  heartRateBpm: '',
  rateCategory: '',
  regularity: '',
  rhythmOrigin: '',
  axisClassification: '',
  leadIIPolarity: '',
  pWaveMorphology: '',
  atrialEnlargement: '',
  prStatus: '',
  qtcStatus: '',
  qrsStatus: '',
  bundleBranchBlock: '',
  conductionDefect: '',
  rWaveProgression: '',
  hasPathologicQ: '',
  stDeviation: '',
  tWaveMorphology: '',
  uWaveStatus: '',
  stTFindings: [],
  affectedLeads: '',
  vascularTerritory: '',
  triageCategory: '',
  clinicalDiagnosis: '',
  confidenceLevel: 75,
};

export const ThalerPracticeDrill: React.FC<ThalerPracticeDrillProps> = ({
  cases,
  currentCase,
  onSelectCase,
  onOpenTutorialForCase,
  onResetZoom,
}) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [sessionCount, setSessionCount] = useState<{ total: number; masterCount: number }>({
    total: 0,
    masterCount: 0,
  });

  const { t, locale } = useLocale();

  // Reset form when changing case externally or when currentCase.id changes
  React.useEffect(() => {
    setForm(INITIAL_FORM);
    setIsSubmitted(false);
  }, [currentCase.id]);

  const handleCaseChange = (caseId: string) => {
    onSelectCase(caseId);
    setForm(INITIAL_FORM);
    setIsSubmitted(false);
    onResetZoom();
  };

  // Toggle ST-T findings multi-select
  const toggleStTFinding = (val: string) => {
    setForm((prev) => {
      const exists = prev.stTFindings.includes(val);
      const updated = exists ? prev.stTFindings.filter((x) => x !== val) : [...prev.stTFindings, val];
      return { ...prev, stTFindings: updated };
    });
  };

  // Helper to infer ground-truth primary territory
  const gtTerritory = useMemo<'NONE' | 'INFERIOR' | 'ANTEROSEPTAL' | 'LATERAL' | 'POSTERIOR' | 'DIFFUSE'>(() => {
    const id = currentCase.id;
    if (id === 'case_inferior_stemi') return 'INFERIOR';
    if (id === 'case_anterior_stemi') return 'ANTEROSEPTAL';
    if (id === 'case_posterior_stemi') return 'POSTERIOR';
    if (id === 'case_acute_pericarditis' || id === 'case_hyperkalemia' || id === 'case_severe_hypokalemia') return 'DIFFUSE';
    if (id === 'case_lvh_strain') return 'LATERAL';
    if (currentCase.metrics.stElevationLeads.some((l) => ['II', 'III', 'aVF'].includes(l))) return 'INFERIOR';
    if (currentCase.metrics.stElevationLeads.some((l) => ['V1', 'V2', 'V3', 'V4'].includes(l))) return 'ANTEROSEPTAL';
    if (currentCase.metrics.stElevationLeads.some((l) => ['I', 'aVL', 'V5', 'V6'].includes(l))) return 'LATERAL';
    return 'NONE';
  }, [currentCase]);

  // Systematic 10-Step Discrepancy & Accuracy Evaluation Engine
  const evaluation = useMemo(() => {
    const metrics = currentCase.metrics;

    // 1. Technical Preflight & Calibration (Max 10 pts)
    const gtPaperSpeed = currentCase.calibration.paperSpeedMmPerSec === 25 ? '25' : '50';
    const gtVoltage = currentCase.calibration.voltageMmPerMv === 10 ? '10' : currentCase.calibration.voltageMmPerMv === 5 ? '5' : '20';
    const gtAvr = 'NEGATIVE';

    let calibScore = 0;
    if (form.paperSpeed !== '' && form.paperSpeed === gtPaperSpeed) calibScore += 3;
    if (form.voltageSensitivity !== '' && form.voltageSensitivity === gtVoltage) calibScore += 3;
    if (form.avrOrientation !== '' && form.avrOrientation === gtAvr) calibScore += 4;

    const calibStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      calibScore >= 10 ? 'MATCH' : calibScore >= 6 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 2. Heart Rate Determination (Max 10 pts)
    const parsedHr = parseInt(form.heartRateBpm, 10);
    const gtHr = metrics.heartRateBpm;
    const gtRateCat = gtHr < 60 ? 'BRADYCARDIA' : gtHr > 100 ? 'TACHYCARDIA' : 'NORMAL';
    let rateScore = 0;
    let rateDelta = NaN;
    let rateStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' = 'SEVERE_DISCREPANCY';

    if (!isNaN(parsedHr) && parsedHr > 0) {
      rateDelta = Math.abs(parsedHr - gtHr);
      if (rateDelta <= 5) {
        rateScore = 10;
        rateStatus = 'MATCH';
      } else if (rateDelta <= 10) {
        rateScore = 7;
        rateStatus = 'MILD_DISCREPANCY';
      } else if (rateDelta <= 20) {
        rateScore = 4;
        rateStatus = 'MILD_DISCREPANCY';
      } else if (form.rateCategory === gtRateCat) {
        rateScore = 5;
        rateStatus = 'MILD_DISCREPANCY';
      } else {
        rateScore = 1;
        rateStatus = 'SEVERE_DISCREPANCY';
      }
    }

    // 3. Cardiac Rhythm & Regularity (Max 10 pts)
    let rhythmScore = 0;
    const isGtRegular = metrics.isRegular;
    const userRegMatch =
      form.regularity !== '' &&
      ((isGtRegular && form.regularity === 'REGULAR') ||
        (!isGtRegular && (form.regularity === 'IRREGULAR' || form.regularity === 'IRREGULARLY_IRREGULAR')));

    if (userRegMatch) rhythmScore += 5;

    const rhythmLower = form.rhythmOrigin.toLowerCase();
    const gtRhythmLower = `${metrics.rhythmDescription} ${metrics.rhythmDescriptionEn || ''}`.toLowerCase();
    if (
      (gtRhythmLower.match(/(sinus)/i) && rhythmLower.match(/(sinus)/i)) ||
      (gtRhythmLower.match(/(fibrilasi|fibrillation)/i) && rhythmLower.match(/(fibrilasi|fibrillation)/i)) ||
      (gtRhythmLower.match(/(flutter)/i) && rhythmLower.match(/(flutter)/i)) ||
      (gtRhythmLower.match(/(ventrikel|ventricular|vt)/i) && rhythmLower.match(/(ventrikel|ventricular|vt)/i)) ||
      (gtRhythmLower.match(/(junctional)/i) && rhythmLower.match(/(junctional)/i)) ||
      (gtRhythmLower.match(/(blok|block)/i) && rhythmLower.match(/(blok|block)/i))
    ) {
      rhythmScore += 5;
    }

    const rhythmStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      rhythmScore >= 9 ? 'MATCH' : rhythmScore >= 5 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 4. Frontal Electrical Axis (Max 10 pts)
    const axisMatch = form.axisClassification !== '' && form.axisClassification === metrics.axisClassification;
    const axisScore = axisMatch ? 10 : 0;
    const axisStatus: 'MATCH' | 'SEVERE_DISCREPANCY' = axisMatch ? 'MATCH' : 'SEVERE_DISCREPANCY';

    // 5. P-Wave Morphology & Atrial Enlargement (Max 10 pts: P-wave 5, Atrial 5)
    const gtPWave = metrics.pWaveMorphology || 'NORMAL_SINUS';
    const gtAtrial = metrics.atrialEnlargement || 'NORMAL';
    const userPWaveMatch = form.pWaveMorphology !== '' && form.pWaveMorphology === gtPWave;
    const userAtrialMatch = form.atrialEnlargement !== '' && form.atrialEnlargement === gtAtrial;

    let pWaveScore = 0;
    if (userPWaveMatch) pWaveScore += 5;
    if (userAtrialMatch) pWaveScore += 5;

    const pWaveStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      pWaveScore >= 10 ? 'MATCH' : pWaveScore >= 5 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 6. Conduction Intervals & AV Blocks (Max 10 pts: PR 5, QTc 5)
    const gtPrAbsent = metrics.prIntervalMs === 0;
    const gtPrProlonged = metrics.prIntervalMs > 200;
    const gtPrShort = metrics.prIntervalMs < 120 && metrics.prIntervalMs > 0;
    const userPrMatch =
      form.prStatus !== '' &&
      ((gtPrAbsent && form.prStatus === 'ABSENT') ||
        (gtPrProlonged && form.prStatus === 'PROLONGED') ||
        (gtPrShort && form.prStatus === 'SHORTENED') ||
        (!gtPrAbsent && !gtPrProlonged && !gtPrShort && form.prStatus === 'NORMAL'));

    // Sex-specific QTc Cutoff (Male > 450 ms, Female > 460 ms)
    const qtcCutoff = currentCase.patient.gender === 'Male' ? 450 : 460;
    const gtQtcProlonged = metrics.qtcIntervalMs > qtcCutoff;
    const gtQtcShort = metrics.qtcIntervalMs < 350;
    const userQtcMatch =
      form.qtcStatus !== '' &&
      ((gtQtcProlonged && form.qtcStatus === 'PROLONGED') ||
        (gtQtcShort && form.qtcStatus === 'SHORTENED') ||
        (!gtQtcProlonged && !gtQtcShort && form.qtcStatus === 'NORMAL'));

    let intervalScore = 0;
    if (userPrMatch) intervalScore += 5;
    if (userQtcMatch) intervalScore += 5;

    const intervalStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      intervalScore >= 10 ? 'MATCH' : intervalScore >= 5 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 7. QRS Complex Duration & Bundle Branch Block (Max 10 pts: Width 5, BBB 5)
    const gtQrsWide = metrics.qrsDurationMs >= 120;
    const userQrsMatch =
      form.qrsStatus !== '' &&
      ((gtQrsWide && form.qrsStatus === 'WIDE') || (!gtQrsWide && form.qrsStatus === 'NARROW'));

    const gtBbb = metrics.bundleBranchBlock || 'NONE';
    const userBbbMatch = form.bundleBranchBlock !== '' && form.bundleBranchBlock === gtBbb;

    let qrsScore = 0;
    if (userQrsMatch) qrsScore += 5;
    if (userBbbMatch) qrsScore += 5;

    const qrsStatusVerdict: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      qrsScore >= 10 ? 'MATCH' : qrsScore >= 5 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 8. Precordial R-Wave Progression & Pathological Q Waves (Max 10 pts: R-progression 5, Q-waves 5)
    const gtProgression = metrics.rWaveProgression || 'NORMAL';
    const userProgressionMatch = form.rWaveProgression !== '' && form.rWaveProgression === gtProgression;

    const gtHasQ = metrics.pathologicQWaveLeads.length > 0;
    const userQMatch =
      form.hasPathologicQ !== '' &&
      ((gtHasQ && form.hasPathologicQ === 'YES') || (!gtHasQ && form.hasPathologicQ === 'NO'));

    let progressionScore = 0;
    if (userProgressionMatch) progressionScore += 5;
    if (userQMatch) progressionScore += 5;

    const progressionStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      progressionScore >= 10 ? 'MATCH' : progressionScore >= 5 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 9. ST-Segment, T-Wave & U-Wave Repolarization (Max 10 pts: ST 4, T 3, U 3)
    const hasGtSte = metrics.stElevationLeads.length > 0;
    const hasGtStd = metrics.stDepressionLeads.length > 0;
    const hasGtTInv = metrics.tWaveInversionLeads.length > 0;
    const gtStDev = (hasGtSte && hasGtStd) ? 'BOTH' : hasGtSte ? 'ELEVATION' : hasGtStd ? 'DEPRESSION' : 'ISOELECTRIC';
    const userStDevMatch = form.stDeviation !== '' && form.stDeviation === gtStDev;

    const gtT = hasGtTInv
      ? 'INVERTED'
      : currentCase.id === 'case_hyperkalemia'
      ? 'PEAKED_TENTED'
      : currentCase.id === 'case_severe_hypokalemia'
      ? 'FLAT'
      : 'NORMAL';
    const userTMatch = form.tWaveMorphology !== '' && form.tWaveMorphology === gtT;

    const gtU = metrics.uWaveStatus || 'NORMAL';
    const userUMatch = form.uWaveStatus !== '' && form.uWaveStatus === gtU;

    let stTuScore = 0;
    if (userStDevMatch) stTuScore += 4;
    if (userTMatch) stTuScore += 3;
    if (userUMatch) stTuScore += 3;

    const stTuStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      stTuScore >= 9 ? 'MATCH' : stTuScore >= 5 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 10. Vascular Territory & Clinical Synthesis (Max 10 pts: Territory 4, Triage 3, Diagnosis text 3)
    const userTerritoryMatch = form.vascularTerritory !== '' && form.vascularTerritory === gtTerritory;
    const triageMatch = form.triageCategory !== '' && form.triageCategory === currentCase.category;

    // Title keyword matching for diagnosis text
    const combinedTitles = `${currentCase.title} ${currentCase.titleEn || ''} ${currentCase.medicalTermEn || ''}`.toLowerCase();
    const stopWords = new Set([
      'dan', 'atau', 'pada', 'dengan', 'yang', 'akut', 'pola', 'sindrom', 'derajat', 'kasus',
      'and', 'or', 'with', 'the', 'in', 'acute', 'of', 'for', 'pattern', 'syndrome', 'type', 'signs'
    ]);
    const titleWords = combinedTitles
      .replace(/[():,./°\-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w));

    const userDiagLower = form.clinicalDiagnosis.toLowerCase();
    const matchedCount = titleWords.filter((w) => userDiagLower.includes(w)).length;

    let synthesisScore = 0;
    if (userTerritoryMatch) synthesisScore += 4;
    if (triageMatch) synthesisScore += 3;
    if (titleWords.length > 0 && matchedCount > 0) {
      const matchRatio = matchedCount / Math.max(3, titleWords.length * 0.4);
      if (matchRatio >= 0.5) synthesisScore += 3;
      else if (matchRatio >= 0.25 || userDiagLower.length > 6) synthesisScore += 2;
      else synthesisScore += 1;
    }

    const synthesisStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      synthesisScore >= 8 ? 'MATCH' : synthesisScore >= 4 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // Total Composite Score (0 - 100)
    const totalScore = Math.round(
      calibScore +
        rateScore +
        rhythmScore +
        axisScore +
        pWaveScore +
        intervalScore +
        qrsScore +
        progressionScore +
        stTuScore +
        synthesisScore
    );

    // Competency Level
    let competencyLevel = t.practice.criticalTitle;
    let competencyBadge = 'bg-rose-100 text-rose-800 border-rose-300';
    let competencyDesc = t.practice.criticalDesc;
    if (totalScore >= 85) {
      competencyLevel = t.practice.masteryTitle;
      competencyBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      competencyDesc = t.practice.masteryDesc;
    } else if (totalScore >= 70) {
      competencyLevel = t.practice.competentTitle;
      competencyBadge = 'bg-blue-100 text-blue-800 border-blue-300';
      competencyDesc = t.practice.competentDesc;
    } else if (totalScore >= 50) {
      competencyLevel = t.practice.moderateTitle;
      competencyBadge = 'bg-amber-100 text-amber-800 border-amber-300';
      competencyDesc = t.practice.moderateDesc;
    }

    // Critical Red Flags & Safety Alerts
    const criticalAlerts: string[] = [];
    if (hasGtSte && form.stDeviation !== 'ELEVATION' && form.stDeviation !== 'BOTH') {
      criticalAlerts.push(t.practice.missedStemiAlert(metrics.stElevationLeads.join(', ')));
    }
    if (currentCase.category === 'PATHOLOGIC' && form.triageCategory === 'NORMAL') {
      criticalAlerts.push(
        locale === 'en'
          ? 'FATAL TRIAGE DISCREPANCY: A life-threatening pathologic ECG was marked as Normal!'
          : 'DISKREPANSI TRIASE FATAL: EKG patologis yang mengancam jiwa ditandai sebagai Normal!'
      );
    }
    if (currentCase.id === 'case_hyperkalemia' && form.tWaveMorphology !== 'PEAKED_TENTED') {
      criticalAlerts.push(
        locale === 'en'
          ? 'CRITICAL ALERT: Severe Hyperkalemic peaked tented T-waves missed! Urgent IV Calcium Gluconate required.'
          : 'PERINGATAN KRITIS: Gelombang T lancip hiperkalemia berat terlewat! Segera berikan IV Kalsium Glukonat.'
      );
    }
    if (currentCase.id === 'case_atrial_fibrillation' && form.pWaveMorphology !== 'ABSENT_FIBRILLATORY') {
      criticalAlerts.push(t.practice.missedAfibAlert);
    }
    if (currentCase.id === 'case_severe_hypokalemia' && form.uWaveStatus !== 'PROMINENT') {
      criticalAlerts.push(
        locale === 'en'
          ? 'CRITICAL ALERT: Prominent giant U-waves indicative of severe hypokalemia missed! Extreme risk of Torsades de Pointes.'
          : 'PERINGATAN KRITIS: Gelombang U raksasa hipokalemia berat terlewat! Risiko ekstrem aritmia fatal Torsades de Pointes.'
      );
    }

    return {
      gtPaperSpeed,
      gtVoltage,
      gtAvr,
      calibScore,
      calibStatus,
      rateScore,
      rateDelta,
      rateStatus,
      gtRateCat,
      rhythmScore,
      rhythmStatus,
      axisScore,
      axisStatus,
      pWaveScore,
      pWaveStatus,
      gtPWave,
      gtAtrial,
      intervalScore,
      intervalStatus,
      gtQtcProlonged,
      gtQtcShort,
      qrsScore,
      qrsStatusVerdict,
      gtBbb,
      progressionScore,
      progressionStatus,
      gtProgression,
      gtHasQ,
      stTuScore,
      stTuStatus,
      gtStDev,
      gtT,
      gtU,
      synthesisScore,
      synthesisStatus,
      gtTerritory,
      totalScore,
      competencyLevel,
      competencyBadge,
      competencyDesc,
      criticalAlerts,
    };
  }, [form, currentCase, gtTerritory, t, locale]);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedHr = parseInt(form.heartRateBpm, 10);
    if (isNaN(parsedHr) || parsedHr < 20 || parsedHr > 300) {
      alert(t.practiceDrill.validationAlertHr);
      return;
    }
    if (!form.triageCategory || !form.clinicalDiagnosis.trim()) {
      alert(t.practiceDrill.validationAlertDiagnosis);
      return;
    }
    setIsSubmitted(true);
    FeedbackStorage.recordPracticeSessionCompleted();
    setSessionCount((prev) => ({
      total: prev.total + 1,
      masterCount: prev.masterCount + (evaluation.totalScore >= 70 ? 1 : 0),
    }));
  };

  // Next random blinded case handler
  const handleNextRandomCase = () => {
    setForm(INITIAL_FORM);
    setIsSubmitted(false);
    onResetZoom();

    const available = cases.filter((c) => c.id !== currentCase.id);
    if (available.length > 0) {
      const next = available[Math.floor(Math.random() * available.length)];
      onSelectCase(next.id);
    }
  };

  // Reset drill for current case
  const handleResetCurrentCase = () => {
    setForm(INITIAL_FORM);
    setIsSubmitted(false);
    onResetZoom();
  };

  return (
    <div className="flex flex-col h-full bg-stone-100 overflow-hidden font-sans border-l border-stone-200">
      {/* 1. Header: Blinded Practice Session & Accuracy Counter */}
      <div className="p-3 bg-white border-b border-stone-200 flex items-center justify-between shrink-0 shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-sm text-stone-900">{t.practice.modeTitle}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold">
              10-STEP OSCE
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">{t.practice.modeSubtitle}</p>
        </div>

        {/* Accuracy badge / Mastery tally */}
        <div className="text-right">
          <div className="text-[10px] text-stone-500 font-semibold">{t.practice.sessionAccuracy}</div>
          <div className="font-mono text-xs font-bold text-stone-800">
            {sessionCount.total > 0
              ? `${Math.round((sessionCount.masterCount / sessionCount.total) * 100)}% (${sessionCount.masterCount}/${sessionCount.total})`
              : '0/0'}
          </div>
        </div>
      </div>

      {/* 2. Blinded Case Selector Bar */}
      <div className="px-3 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider shrink-0">
            {locale === 'en' ? 'Blinded Case:' : 'Kasus Buta:'}
          </span>
          <select
            value={currentCase.id}
            onChange={(e) => handleCaseChange(e.target.value)}
            className="text-base sm:text-xs bg-white border border-stone-300 rounded px-2 py-1 font-mono font-bold text-stone-800 focus:outline-none focus:border-purple-500 truncate cursor-pointer"
          >
            {cases.map((c, idx) => (
              <option key={c.id} value={c.id}>
                {c.caseCode || `CASE-${idx + 1}`} ({locale === 'en' ? 'Blinded Patient' : 'Pasien Anonim'})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => ThalerPdfExportEngine.exportBlankOsceWorksheet(currentCase, locale)}
          className="px-2 py-1 bg-white hover:bg-stone-200 text-stone-700 text-[10px] font-bold border border-stone-300 rounded shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
          title={t.practice.osceSheetPdf}
        >
          <FileText className="w-3 h-3 text-purple-700" />
          <span className="hidden sm:inline">{locale === 'en' ? 'OSCE Sheet' : 'Lembar OSCE'}</span>
        </button>
      </div>

      {/* 3. Blinded Patient Clinical Vignette */}
      <div className="px-3 py-2 bg-white border-b border-stone-200 text-xs shrink-0">
        <div className="flex items-center justify-between text-xs text-stone-600 font-mono mb-1">
          <span>
            {currentCase.patient.gender === 'Male' ? (locale === 'en' ? 'Male Patient' : 'Pasien Pria') : (locale === 'en' ? 'Female Patient' : 'Pasien Wanita')}, {currentCase.patient.age} {locale === 'en' ? 'yo' : 'th'} | {locale === 'en' ? 'BP' : 'TD'}:{' '}
            <strong className="text-stone-900">{currentCase.patient.vitalSigns.bloodPressure}</strong> | RR:{' '}
            <strong className="text-stone-900">{currentCase.patient.vitalSigns.respiratoryRate} {t.pdfExport.breathsPerMin}</strong> | SpO2:{' '}
            <strong className="text-stone-900">{currentCase.patient.vitalSigns.spo2Percent}%</strong>
          </span>
          {currentCase.clinicalTier && (
            <span
              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold border shrink-0 ${
                CLINICAL_TIER_CONFIG[currentCase.clinicalTier].badgeClass
              }`}
            >
              {t.tiers[currentCase.clinicalTier]?.badgeLabel || CLINICAL_TIER_CONFIG[currentCase.clinicalTier].label}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-700 italic leading-snug">
          "{currentCase.patient.chiefComplaint}"
        </p>
      </div>

      {/* 4. Main Scrollable Area: Form vs Discrepancy Matrix */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {!isSubmitted ? (
          /* FORM INTERPRETASI SISTEMATIS 10 TAHAP (GOLD STANDARD) */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* TAHAP 1: Kalibrasi & Standarisasi Kertas (Technical Preflight) */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {t.practiceDrill.stage1CalibrationTitle}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">25 mm/s | 10 mm/mV</span>
              </div>
              <p className="text-[10px] text-stone-500">{t.practiceDrill.stage1CalibrationHint}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-stone-600 block mb-0.5 font-semibold">
                    {t.practiceDrill.calibrationPaperSpeedLabel}
                  </label>
                  <div className="flex gap-1">
                    {[
                      { id: '25', label: '25 mm/s' },
                      { id: '50', label: '50 mm/s' },
                    ].map((sp) => (
                      <button
                        type="button"
                        key={sp.id}
                        onClick={() => setForm({ ...form, paperSpeed: sp.id as any })}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border transition cursor-pointer ${
                          form.paperSpeed === sp.id
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 block mb-0.5 font-semibold">
                    {t.practiceDrill.calibrationVoltageLabel}
                  </label>
                  <div className="flex gap-1">
                    {[
                      { id: '10', label: '10 mm/mV' },
                      { id: '5', label: '5 mm/mV' },
                      { id: '20', label: '20 mm/mV' },
                    ].map((vt) => (
                      <button
                        type="button"
                        key={vt.id}
                        onClick={() => setForm({ ...form, voltageSensitivity: vt.id as any })}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border transition cursor-pointer ${
                          form.voltageSensitivity === vt.id
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {vt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 block mb-0.5 font-semibold">
                    {t.practiceDrill.calibrationAvrLabel}
                  </label>
                  <div className="flex gap-1">
                    {[
                      { id: 'NEGATIVE', label: locale === 'en' ? 'Inverted (-)' : 'Inversi (-)' },
                      { id: 'POSITIVE', label: locale === 'en' ? 'Upright (+)' : 'Tegak (+)' },
                    ].map((av) => (
                      <button
                        type="button"
                        key={av.id}
                        onClick={() => setForm({ ...form, avrOrientation: av.id as any })}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border transition cursor-pointer ${
                          form.avrOrientation === av.id
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {av.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TAHAP 2: Frekuensi Denyut Jantung (Heart Rate) */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  {t.practiceDrill.stage2RateTitle}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">{t.practiceDrill.rateFromPaperHint}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-500 block mb-0.5">{t.practiceDrill.rateBpmLabel}</label>
                  <input
                    type="number"
                    min="20"
                    max="300"
                    step="1"
                    placeholder={locale === 'en' ? 'e.g. 75' : 'Contoh: 75'}
                    value={form.heartRateBpm}
                    onChange={(e) => setForm({ ...form, heartRateBpm: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-base sm:text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-0.5">{t.practiceDrill.rateCategoryLabel}</label>
                  <div className="flex gap-1">
                    {(
                      [
                        { id: 'BRADYCARDIA', label: '<60' },
                        { id: 'NORMAL', label: '60-100' },
                        { id: 'TACHYCARDIA', label: '>100' },
                      ] as const
                    ).map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setForm({ ...form, rateCategory: cat.id })}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border transition cursor-pointer ${
                          form.rateCategory === cat.id
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TAHAP 3: Irama & Reguleritas (Rhythm) */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                {t.practiceDrill.stage3RhythmTitle}
              </span>
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-500 block mb-0.5">{t.practiceDrill.rhythmRegularityLabel}</label>
                <div className="flex gap-1">
                  {[
                    { id: 'REGULAR', label: t.practiceDrill.rhythmRegular },
                    { id: 'IRREGULAR', label: t.practiceDrill.rhythmIrregular },
                    { id: 'IRREGULARLY_IRREGULAR', label: t.practiceDrill.rhythmIrregularlyIrregular },
                  ].map((reg) => (
                    <button
                      type="button"
                      key={reg.id}
                      onClick={() => setForm({ ...form, regularity: reg.id as any })}
                      className={`flex-1 py-1 text-[10px] font-bold rounded border transition cursor-pointer ${
                        form.regularity === reg.id
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {reg.label}
                    </button>
                  ))}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={t.practiceDrill.rhythmPlaceholder}
                    value={form.rhythmOrigin}
                    onChange={(e) => setForm({ ...form, rhythmOrigin: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-base sm:text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                  {/* Quick rhythm chips */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.practiceDrill.rhythmChips.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setForm({ ...form, rhythmOrigin: r })}
                        className="px-1.5 py-0.5 text-[9px] bg-white border border-stone-200 rounded text-stone-600 hover:bg-stone-100 cursor-pointer"
                      >
                        +{r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TAHAP 4: Aksis Bidang Frontal (Electrical Axis) */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                {t.practiceDrill.stage4AxisTitle}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'NORMAL', label: t.practiceDrill.axisNorm },
                  { id: 'LAD', label: t.practiceDrill.axisLad },
                  { id: 'RAD', label: t.practiceDrill.axisRad },
                  { id: 'EXTREME', label: t.practiceDrill.axisExtreme },
                ].map((ax) => (
                  <button
                    type="button"
                    key={ax.id}
                    onClick={() => setForm({ ...form, axisClassification: ax.id as any })}
                    className={`py-1.5 px-2 text-[10px] text-left font-bold rounded border transition cursor-pointer ${
                      form.axisClassification === ax.id
                        ? 'bg-purple-600 text-white border-purple-700'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {ax.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[10px] text-stone-500 block mb-0.5 font-semibold">
                  {t.practiceDrill.leadIIPolarityLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {[
                    { id: 'POSITIVE', label: t.practiceDrill.leadIIPositive },
                    { id: 'NEGATIVE', label: t.practiceDrill.leadIINegative },
                  ].map((pol) => (
                    <button
                      type="button"
                      key={pol.id}
                      onClick={() => setForm({ ...form, leadIIPolarity: pol.id as any })}
                      className={`py-1 px-1.5 text-[9.5px] text-left rounded border transition cursor-pointer ${
                        form.leadIIPolarity === pol.id
                          ? 'bg-purple-700 text-white border-purple-800 font-bold'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {pol.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TAHAP 5: Analisis Gelombang P & Pembesaran Atrium */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-600" />
                {t.practiceDrill.stage5PWaveTitle}
              </span>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-stone-600 block mb-1 font-semibold">
                    {t.practiceDrill.pWaveMorphologyLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'NORMAL_SINUS', label: t.practiceDrill.pWaveNormalSinus },
                      { id: 'ECTOPIC_ATRIAL', label: t.practiceDrill.pWaveEctopicAtrial },
                      { id: 'RETROGRADE', label: t.practiceDrill.pWaveRetrograde },
                      { id: 'ABSENT_FIBRILLATORY', label: t.practiceDrill.pWaveAbsentFib },
                      { id: 'FLUTTER', label: t.practiceDrill.pWaveFlutter },
                      { id: 'DISSOCIATED', label: t.practiceDrill.pWaveDissociated },
                    ].map((pw) => (
                      <button
                        type="button"
                        key={pw.id}
                        onClick={() => setForm({ ...form, pWaveMorphology: pw.id as any })}
                        className={`p-1.5 text-[9.5px] text-left rounded border transition cursor-pointer ${
                          form.pWaveMorphology === pw.id
                            ? 'bg-cyan-700 text-white border-cyan-800 font-bold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {pw.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 block mb-1 font-semibold">
                    {t.practiceDrill.atrialEnlargementLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    {[
                      { id: 'NORMAL', label: t.practiceDrill.atrialNormal },
                      { id: 'RAE', label: t.practiceDrill.atrialRae },
                      { id: 'LAE', label: t.practiceDrill.atrialLae },
                    ].map((at) => (
                      <button
                        type="button"
                        key={at.id}
                        onClick={() => setForm({ ...form, atrialEnlargement: at.id as any })}
                        className={`p-1.5 text-[10px] text-left font-bold rounded border transition cursor-pointer ${
                          form.atrialEnlargement === at.id
                            ? 'bg-cyan-600 text-white border-cyan-700'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {at.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TAHAP 6: Interval Konduksi & Blok AV (PR, QTc) */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                {t.practiceDrill.stage6IntervalsTitle}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-500 block mb-0.5">{t.practiceDrill.prLabel}</label>
                  <select
                    value={form.prStatus}
                    onChange={(e) => setForm({ ...form, prStatus: e.target.value as any })}
                    className="w-full bg-white border border-stone-300 rounded px-1.5 py-1 text-base sm:text-[11px] text-stone-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">{t.practiceDrill.prPlaceholder}</option>
                    <option value="NORMAL">{t.practiceDrill.prNormal}</option>
                    <option value="PROLONGED">{t.practiceDrill.prProlonged}</option>
                    <option value="SHORTENED">{t.practiceDrill.prShortened}</option>
                    <option value="ABSENT">{t.practiceDrill.prAbsent}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-0.5">{t.practiceDrill.qtcLabel}</label>
                  <select
                    value={form.qtcStatus}
                    onChange={(e) => setForm({ ...form, qtcStatus: e.target.value as any })}
                    className="w-full bg-white border border-stone-300 rounded px-1.5 py-1 text-base sm:text-[11px] text-stone-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">{t.practiceDrill.qtcPlaceholder}</option>
                    <option value="NORMAL">{t.practiceDrill.qtcNormal}</option>
                    <option value="PROLONGED">{t.practiceDrill.qtcProlonged}</option>
                    <option value="SHORTENED">{t.practiceDrill.qtcShortened}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TAHAP 7: Kompleks QRS & Blok Berkas (QRS Duration & BBB) */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-teal-600" />
                {t.practiceDrill.stage7QrsTitle}
              </span>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-stone-600 block mb-0.5 font-semibold">
                    {t.practiceDrill.qrsDurationLabel}
                  </label>
                  <div className="flex gap-1">
                    {[
                      { id: 'NARROW', label: t.practiceDrill.qrsNarrow },
                      { id: 'WIDE', label: t.practiceDrill.qrsWide },
                    ].map((w) => (
                      <button
                        type="button"
                        key={w.id}
                        onClick={() => setForm({ ...form, qrsStatus: w.id as any })}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border transition cursor-pointer ${
                          form.qrsStatus === w.id
                            ? 'bg-teal-600 text-white border-teal-700'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 block mb-0.5 font-semibold">
                    {t.practiceDrill.bbbLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'NONE', label: t.practiceDrill.bbbNone },
                      { id: 'RBBB', label: t.practiceDrill.bbbRbbb },
                      { id: 'LBBB', label: t.practiceDrill.bbbLbbb },
                      { id: 'WPW_PREEXCITATION', label: t.practiceDrill.bbbWpw },
                    ].map((bb) => (
                      <button
                        type="button"
                        key={bb.id}
                        onClick={() => setForm({ ...form, bundleBranchBlock: bb.id as any })}
                        className={`p-1.5 text-[9.5px] text-left rounded border transition cursor-pointer ${
                          form.bundleBranchBlock === bb.id
                            ? 'bg-teal-700 text-white border-teal-800 font-bold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {bb.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={t.practiceDrill.conductionDefectPlaceholder}
                    value={form.conductionDefect}
                    onChange={(e) => setForm({ ...form, conductionDefect: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-base sm:text-xs text-stone-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* TAHAP 8: Progresi Gelombang R Prekordial & Gelombang Q Patologis */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-orange-600" />
                {t.practiceDrill.stage8RProgressionTitle}
              </span>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-stone-600 block mb-1 font-semibold">
                    {t.practiceDrill.rProgressionLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'NORMAL', label: t.practiceDrill.rProgressionNormal },
                      { id: 'POOR_R_PROGRESSION', label: t.practiceDrill.rProgressionPrwp },
                      { id: 'EARLY_TRANSITION', label: t.practiceDrill.rProgressionEarly },
                      { id: 'REVERSED', label: t.practiceDrill.rProgressionReversed },
                    ].map((rp) => (
                      <button
                        type="button"
                        key={rp.id}
                        onClick={() => setForm({ ...form, rWaveProgression: rp.id as any })}
                        className={`p-1.5 text-[9.5px] text-left rounded border transition cursor-pointer ${
                          form.rWaveProgression === rp.id
                            ? 'bg-orange-600 text-white border-orange-700 font-bold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {rp.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 block mb-1 font-semibold">
                    {t.practiceDrill.pathologicQLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'NO', label: t.practiceDrill.pathologicQNone },
                      { id: 'YES', label: t.practiceDrill.pathologicQPresent },
                    ].map((q) => (
                      <button
                        type="button"
                        key={q.id}
                        onClick={() => setForm({ ...form, hasPathologicQ: q.id as any })}
                        className={`p-1.5 text-[9.5px] text-left rounded border transition cursor-pointer ${
                          form.hasPathologicQ === q.id
                            ? 'bg-orange-700 text-white border-orange-800 font-bold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TAHAP 9: Segmen ST, Gelombang T & Gelombang U (Repolarisasi) */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {t.practiceDrill.stage9StTuTitle}
              </span>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-stone-600 block mb-0.5 font-semibold">
                    {t.practiceDrill.stDeviationLabel}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                    {[
                      { id: 'ISOELECTRIC', label: t.practiceDrill.stDeviationIsoelectric },
                      { id: 'ELEVATION', label: t.practiceDrill.stDeviationElevation },
                      { id: 'DEPRESSION', label: t.practiceDrill.stDeviationDepression },
                      { id: 'BOTH', label: t.practiceDrill.stDeviationBoth },
                    ].map((sd) => (
                      <button
                        type="button"
                        key={sd.id}
                        onClick={() => setForm({ ...form, stDeviation: sd.id as any })}
                        className={`p-1 text-[9.5px] text-center font-bold rounded border transition cursor-pointer ${
                          form.stDeviation === sd.id
                            ? 'bg-rose-600 text-white border-rose-700'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {sd.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 block mb-0.5 font-semibold">
                    {t.practiceDrill.tWaveLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'NORMAL', label: t.practiceDrill.tWaveNormal },
                      { id: 'INVERTED', label: t.practiceDrill.tWaveInverted },
                      { id: 'PEAKED_TENTED', label: t.practiceDrill.tWavePeakedTented },
                      { id: 'FLAT', label: t.practiceDrill.tWaveFlat },
                    ].map((tw) => (
                      <button
                        type="button"
                        key={tw.id}
                        onClick={() => setForm({ ...form, tWaveMorphology: tw.id as any })}
                        className={`p-1.5 text-[9.5px] text-left rounded border transition cursor-pointer ${
                          form.tWaveMorphology === tw.id
                            ? 'bg-rose-700 text-white border-rose-800 font-bold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {tw.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 block mb-0.5 font-semibold">
                    {t.practiceDrill.uWaveLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    {[
                      { id: 'NORMAL', label: t.practiceDrill.uWaveNormal },
                      { id: 'PROMINENT', label: t.practiceDrill.uWaveProminent },
                      { id: 'INVERTED', label: t.practiceDrill.uWaveInverted },
                    ].map((uw) => (
                      <button
                        type="button"
                        key={uw.id}
                        onClick={() => setForm({ ...form, uWaveStatus: uw.id as any })}
                        className={`p-1 text-[9.5px] text-left font-bold rounded border transition cursor-pointer ${
                          form.uWaveStatus === uw.id
                            ? 'bg-rose-800 text-white border-rose-900'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {uw.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 block mb-0.5 font-semibold">
                    {locale === 'en' ? 'Detailed Morphological Findings:' : 'Temuan Morfologis Terperinci:'}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'ST_ELEVASI', label: t.practiceDrill.stElevLabel },
                      { id: 'ST_DEPRESI', label: t.practiceDrill.stDeprLabel },
                      { id: 'INVERSI_T', label: t.practiceDrill.tInvLabel },
                      { id: 'Q_PATOLOGIS', label: t.practiceDrill.qWaveLabel },
                      { id: 'T_LANCIP', label: t.practiceDrill.peakedTLabel },
                      { id: 'NORMAL_ST', label: t.practiceDrill.stNormalLabel },
                    ].map((f) => {
                      const active = form.stTFindings.includes(f.id);
                      return (
                        <button
                          type="button"
                          key={f.id}
                          onClick={() => toggleStTFinding(f.id)}
                          className={`px-2 py-1 text-[10px] font-bold rounded border transition cursor-pointer ${
                            active
                              ? 'bg-rose-600 text-white border-rose-700'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {active ? '✓ ' : ''}{f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={t.practiceDrill.affectedLeadsPlaceholder}
                    value={form.affectedLeads}
                    onChange={(e) => setForm({ ...form, affectedLeads: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-base sm:text-xs text-stone-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* TAHAP 10: Teritori Vaskular Anatomi & Sintesis Triase Klinis */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                {t.practiceDrill.stage10SynthesisTitle}
              </span>

              {/* Vascular Territory Selection */}
              <div>
                <label className="text-[10px] text-stone-600 block mb-1 font-semibold">
                  {t.practiceDrill.vascularTerritoryLabel}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {[
                    { id: 'NONE', label: t.practiceDrill.territoryNone },
                    { id: 'INFERIOR', label: t.practiceDrill.territoryInferior },
                    { id: 'ANTEROSEPTAL', label: t.practiceDrill.territoryAnteroseptal },
                    { id: 'LATERAL', label: t.practiceDrill.territoryLateral },
                    { id: 'POSTERIOR', label: t.practiceDrill.territoryPosterior },
                    { id: 'DIFFUSE', label: t.practiceDrill.territoryDiffuse },
                  ].map((ter) => (
                    <button
                      type="button"
                      key={ter.id}
                      onClick={() => setForm({ ...form, vascularTerritory: ter.id as any })}
                      className={`p-1.5 text-[9.5px] text-left rounded border transition cursor-pointer ${
                        form.vascularTerritory === ter.id
                          ? 'bg-indigo-700 text-white border-indigo-800 font-bold'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {ter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2-Second Global Triage */}
              <div>
                <label className="text-[10px] text-stone-500 block mb-1">{t.practiceDrill.globalTriageLabel}</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'NORMAL', label: t.practiceDrill.triageNormal },
                    { id: 'PATHOLOGIC', label: t.practiceDrill.triagePathologic },
                    { id: 'NON_SIGNIFICANT_VARIANT', label: t.practiceDrill.triageVariant },
                  ].map((tri) => (
                    <button
                      type="button"
                      key={tri.id}
                      onClick={() => setForm({ ...form, triageCategory: tri.id as any })}
                      className={`py-1 text-[10px] font-bold rounded border transition cursor-pointer ${
                        form.triageCategory === tri.id
                          ? tri.id === 'NORMAL'
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : tri.id === 'PATHOLOGIC'
                            ? 'bg-rose-600 text-white border-rose-700'
                            : 'bg-amber-600 text-white border-amber-700'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {tri.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Free text clinical diagnosis */}
              <div>
                <label className="text-[10px] text-stone-500 block mb-1">
                  {t.practiceDrill.clinicalDiagnosisLabel}
                </label>
                <textarea
                  rows={2}
                  placeholder={t.practiceDrill.clinicalDiagnosisPlaceholder}
                  value={form.clinicalDiagnosis}
                  onChange={(e) => setForm({ ...form, clinicalDiagnosis: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded p-2 text-base sm:text-xs text-stone-900 focus:outline-none focus:border-indigo-500 font-sans"
                  required
                />
              </div>

              {/* Confidence level */}
              <div className="flex items-center justify-between text-[11px] text-stone-600">
                <span>{t.practiceDrill.confidenceLabel}</span>
                <div className="flex gap-1 font-mono text-[10px]">
                  {[50, 75, 100].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setForm({ ...form, confidenceLevel: lvl as any })}
                      className={`px-2 py-0.5 rounded border cursor-pointer font-bold ${
                        form.confidenceLevel === lvl
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-300'
                      }`}
                    >
                      {lvl}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-sans text-xs font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.practice.submitAndEvaluate}</span>
            </button>
          </form>
        ) : (
          /* DEBRIEFING & 10-STAGE DISCREPANCY COMPARISON MATRIX */
          <div className="space-y-4">
            {/* 1. Composite Score Banner & Competency Level */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm text-center space-y-2">
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                {t.practice.evalBannerTitle}
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-black font-mono text-stone-900">{evaluation.totalScore}</span>
                <span className="text-stone-400 font-bold text-sm">/ 100</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border">
                <Award className="w-3.5 h-3.5" />
                <span>{evaluation.competencyLevel}</span>
              </div>
              <p className="text-xs text-stone-600 max-w-md mx-auto">{evaluation.competencyDesc}</p>
            </div>

            {/* 2. High-Severity Critical Safety Alerts */}
            {evaluation.criticalAlerts.length > 0 && (
              <div className="bg-rose-50 border border-rose-300 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{locale === 'en' ? 'Critical Patient Safety Alerts' : 'Peringatan Keselamatan Pasien Kritis'}</span>
                </div>
                {evaluation.criticalAlerts.map((alertText, idx) => (
                  <div key={idx} className="text-[11px] text-rose-800 leading-snug pl-5 font-semibold">
                    - {alertText}
                  </div>
                ))}
              </div>
            )}

            {/* 3. The 10-Stage Side-by-Side Discrepancy Matrix Table */}
            <div className="border border-stone-200 rounded-lg overflow-hidden shadow-2xs">
              <div className="bg-stone-100 px-3 py-1.5 font-bold text-[11px] text-stone-700 flex justify-between items-center border-b border-stone-200">
                <span>{t.practiceDrill.tableStageHeader}</span>
                <span>{t.practiceDrill.tableAuditHeader}</span>
              </div>

              <div className="divide-y divide-stone-200 text-[11px]">
                {/* Row 1: Technical Preflight & Calibration */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>1. {t.practiceDrill.stage1CalibrationTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.calibStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.calibStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.calibStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.calibStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.mildStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <strong className="text-stone-900">{form.paperSpeed || '-'} mm/s | {form.voltageSensitivity || '-'} mm/mV</strong>{' '}
                      <span className="text-stone-500">(aVR: {form.avrOrientation || '-'})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <strong className="text-blue-900">{evaluation.gtPaperSpeed} mm/s | {evaluation.gtVoltage} mm/mV</strong>{' '}
                      <span className="text-stone-500">(aVR: {evaluation.gtAvr})</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Rate */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>2. {t.practiceDrill.stage2RateTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.rateStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.rateStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.rateStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.rateStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.mildStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <strong className="text-stone-900">{form.heartRateBpm || '--'} bpm</strong>{' '}
                      <span className="text-stone-500">({form.rateCategory || '-'})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <strong className="text-blue-900">{currentCase.metrics.heartRateBpm} bpm</strong>{' '}
                      <span className="text-stone-500">({evaluation.gtRateCat})</span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Rhythm */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>3. {t.practiceDrill.stage3RhythmTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.rhythmStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.rhythmStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.rhythmStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.rhythmStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.closeStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <span className="text-stone-900 font-semibold">{form.regularity || '-'}</span> |{' '}
                      <span>{form.rhythmOrigin || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <span className="text-blue-900 font-semibold">
                        {currentCase.metrics.isRegular ? t.practiceDrill.rhythmRegular : t.practiceDrill.rhythmIrregular}
                      </span>{' '}
                      - <span>{locale === 'en' && currentCase.metrics.rhythmDescriptionEn ? currentCase.metrics.rhythmDescriptionEn : currentCase.metrics.rhythmDescription}</span>
                    </div>
                  </div>
                </div>

                {/* Row 4: Axis */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>4. {t.practiceDrill.stage4AxisTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.axisStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.axisStatus === 'MATCH' ? t.practiceDrill.matchStatus : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <strong className="text-stone-900">{form.axisClassification || '-'}</strong>
                      {form.leadIIPolarity && <div className="text-[10px] text-stone-500">Lead II: {form.leadIIPolarity}</div>}
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <strong className="text-blue-900">
                        {currentCase.metrics.axisClassification} ({currentCase.metrics.axisDegrees}°)
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Row 5: P-Wave Morphology & Atrial Enlargement */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>5. {t.practiceDrill.stage5PWaveTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.pWaveStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.pWaveStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.pWaveStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.pWaveStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.partialStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <span>P: {form.pWaveMorphology || '-'}</span> | <span>Atrium: {form.atrialEnlargement || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <span className="text-blue-900 font-semibold">
                        P: {evaluation.gtPWave} | Atrium: {evaluation.gtAtrial}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 6: Conduction Intervals & AV Blocks */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>6. {t.practiceDrill.stage6IntervalsTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.intervalStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.intervalStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.intervalStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.intervalStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.partialStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <span>PR: {form.prStatus || '-'}</span> | <span>QTc: {form.qtcStatus || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <span className="text-blue-900 font-semibold">
                        PR: {currentCase.metrics.prIntervalMs} ms | QTc: {currentCase.metrics.qtcIntervalMs} ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 7: QRS Complex & Bundle Branch Block */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>7. {t.practiceDrill.stage7QrsTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.qrsStatusVerdict === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.qrsStatusVerdict === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.qrsStatusVerdict === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.qrsStatusVerdict === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.partialStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <span>QRS: {form.qrsStatus || '-'}</span> | <span>BBB: {form.bundleBranchBlock || '-'}</span>
                      {form.conductionDefect && <div className="text-stone-700 italic">{form.conductionDefect}</div>}
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <span className="text-blue-900 font-semibold">
                        QRS: {currentCase.metrics.qrsDurationMs} ms ({currentCase.metrics.qrsDurationMs >= 120 ? 'Wide' : 'Narrow'}) | BBB: {evaluation.gtBbb}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 8: Precordial R-Wave Progression & Pathological Q Waves */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>8. {t.practiceDrill.stage8RProgressionTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.progressionStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.progressionStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.progressionStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.progressionStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.partialStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <span>R: {form.rWaveProgression || '-'}</span> | <span>Q Patologis: {form.hasPathologicQ || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <span className="text-blue-900 font-semibold">
                        R: {evaluation.gtProgression} | Q Patologis:{' '}
                        {evaluation.gtHasQ
                          ? `${locale === 'en' ? 'Yes' : 'Ya'} (${currentCase.metrics.pathologicQWaveLeads.join(', ')})`
                          : locale === 'en' ? 'None' : 'Tidak Ada'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 9: ST-Segment, T-Wave & U-Wave Repolarization */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>9. {t.practiceDrill.stage9StTuTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.stTuStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.stTuStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.stTuStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.stTuStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.partialStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <span>ST: {form.stDeviation || '-'}</span> | <span>T: {form.tWaveMorphology || '-'}</span> | <span>U: {form.uWaveStatus || '-'}</span>
                      {form.affectedLeads && <div className="text-[10px] text-stone-500">Leads: {form.affectedLeads}</div>}
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <div className="text-blue-900 font-semibold">
                        ST: {evaluation.gtStDev} | T: {evaluation.gtT} | U: {evaluation.gtU}
                      </div>
                      {currentCase.metrics.stElevationLeads.length > 0 && (
                        <div className="text-rose-700 text-[10px]">
                          STE: {currentCase.metrics.stElevationLeads.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 10: Vascular Territory & Clinical Synthesis */}
                <div className="p-2.5 bg-purple-50/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-purple-950">
                    <span>10. {t.practiceDrill.stage10SynthesisTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.synthesisStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.synthesisStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.synthesisStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.synthesisStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.closeStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <div className="p-1.5 bg-white rounded border border-stone-200 text-stone-900 font-semibold text-xs">
                        [{form.vascularTerritory || 'Territory -'}] [{form.triageCategory || 'Triase -'}] "{form.clinicalDiagnosis}"
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <div className="p-1.5 bg-emerald-50 rounded border border-emerald-200 text-emerald-950 font-bold text-xs">
                        [{evaluation.gtTerritory}] [{currentCase.category}] {locale === 'en' && currentCase.medicalTermEn ? currentCase.medicalTermEn : currentCase.title}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Export Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const mappedAnswers: Record<string, string> = {
                    calibration: `${form.paperSpeed || '-'} mm/s, ${form.voltageSensitivity || '-'} mm/mV, aVR ${form.avrOrientation || '-'}`,
                    heartRate: form.heartRateBpm,
                    rateCategory: form.rateCategory,
                    regularity: form.regularity,
                    rhythmType: form.rhythmOrigin,
                    axisClassification: form.axisClassification,
                    pWaveMorphology: form.pWaveMorphology,
                    atrialEnlargement: form.atrialEnlargement,
                    prIntervalStatus: form.prStatus,
                    qtcStatus: form.qtcStatus,
                    qrsWidth: form.qrsStatus,
                    bundleBranchBlock: form.bundleBranchBlock,
                    rWaveProgression: form.rWaveProgression,
                    pathologicalQ: form.hasPathologicQ,
                    stDeviation: form.stDeviation,
                    tWaveMorphology: form.tWaveMorphology,
                    stMorphology: `${form.stDeviation || '-'} ST, ${form.tWaveMorphology || '-'} T`,
                    uWaveStatus: form.uWaveStatus,
                    vascularTerritory: form.vascularTerritory,
                    ischemiaLeads: form.affectedLeads || form.vascularTerritory || '-',
                    clinicalDiagnosis: `[${form.triageCategory}] ${form.clinicalDiagnosis}`,
                  };
                  ThalerPdfExportEngine.exportPracticeDebriefReport(
                    currentCase,
                    mappedAnswers,
                    evaluation.totalScore,
                    evaluation.competencyLevel,
                    evaluation.criticalAlerts,
                    locale
                  );
                }}
                className="py-2 px-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-sans text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title={t.practice.discrepancyReportPdf}
              >
                <Download className="w-3.5 h-3.5 text-purple-700" />
                <span>{t.practice.discrepancyReportPdf}</span>
              </button>
              <button
                type="button"
                onClick={() => ThalerPdfExportEngine.exportBlankOsceWorksheet(currentCase, locale)}
                className="py-2 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-sans text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title={t.practice.osceSheetPdf}
              >
                <FileText className="w-3.5 h-3.5 text-stone-600" />
                <span>{t.practice.osceSheetPdf}</span>
              </button>
            </div>

            {/* 4. Action Directives & Navigation */}
            <div className="space-y-2 pt-1">
              <button
                onClick={onOpenTutorialForCase}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-semibold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>{t.practice.studyTutorialBtn}</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleResetCurrentCase}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-sans text-xs font-semibold rounded-lg border border-stone-300 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.practice.retestCaseBtn}</span>
                </button>
                <button
                  onClick={handleNextRandomCase}
                  className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white font-sans text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{t.practice.nextRandomCaseBtn}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
