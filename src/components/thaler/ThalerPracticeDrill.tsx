/**
 * ThalerPracticeDrill: High-Yield Systematic Clinical Practice Mode
 * Enforces Dr. Malcolm S. Thaler's 6-stage clinical interpretation sequence:
 * 1. Frekuensi (Rate), 2. Irama (Rhythm), 3. Aksis (Axis), 4. Interval/Konduksi,
 * 5. Morfologi ST-T & Iskemia, 6. Kesimpulan & Diagnosis Klinis Akhir.
 * Features strict case title blinding (anonymized clinical vignettes),
 * free-form clinical input, and an automated Discrepancy & Comparison Matrix ("Seberapa Ngawur").
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
  // Stage 1: Kalibrasi & Standarisasi (Technical Preflight)
  paperSpeed: '25' | '50' | '';
  voltageSensitivity: '10' | '5' | '20' | '';
  avrOrientation: 'NEGATIVE' | 'POSITIVE' | '';

  // Stage 2: Frekuensi (Rate)
  heartRateBpm: string;
  rateCategory: 'BRADYCARDIA' | 'NORMAL' | 'TACHYCARDIA' | '';

  // Stage 3: Irama & Reguleritas (Rhythm)
  regularity: 'REGULAR' | 'IRREGULAR' | 'IRREGULARLY_IRREGULAR' | '';
  rhythmOrigin: string;

  // Stage 4: Aksis Frontal (Axis)
  axisClassification: 'NORMAL' | 'LAD' | 'RAD' | 'EXTREME' | '';

  // Stage 5: Interval & Konduksi (PR, QRS, QTc)
  prStatus: 'NORMAL' | 'PROLONGED' | 'SHORTENED' | 'ABSENT' | '';
  qrsStatus: 'NARROW' | 'WIDE' | '';
  qtcStatus: 'NORMAL' | 'PROLONGED' | 'SHORTENED' | '';
  conductionDefect: string;

  // Stage 6: Pembesaran Ruang & Hipertropi (Chamber Enlargement & Hypertrophy)
  atrialEnlargement: 'NORMAL' | 'RAE' | 'LAE' | '';
  ventricularHypertrophy: 'NORMAL' | 'LVH' | 'LVH_STRAIN' | 'RVH' | '';

  // Stage 7: Morfologi Iskemia & Infark (ST-T)
  stTFindings: string[];
  affectedLeads: string;

  // Stage 8: Kesimpulan & Diagnosis Utama (Synthesis & Triage)
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
  prStatus: '',
  qrsStatus: '',
  qtcStatus: '',
  conductionDefect: '',
  atrialEnlargement: 'NORMAL',
  ventricularHypertrophy: 'NORMAL',
  stTFindings: [],
  affectedLeads: '',
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

  // Systematic 8-Stage Discrepancy & Accuracy Evaluation Engine
  const evaluation = useMemo(() => {
    const metrics = currentCase.metrics;

    // 1. Technical Preflight & Calibration Evaluation (Max 10 pts)
    const gtPaperSpeed = currentCase.calibration.paperSpeedMmPerSec === 25 ? '25' : '50';
    const gtVoltage = currentCase.calibration.voltageMmPerMv === 10 ? '10' : currentCase.calibration.voltageMmPerMv === 5 ? '5' : '20';
    const gtAvr = 'NEGATIVE';

    let calibScore = 0;
    const speedVoltMatch = (form.paperSpeed === gtPaperSpeed || form.paperSpeed === '') &&
      (form.voltageSensitivity === gtVoltage || form.voltageSensitivity === '');
    if (speedVoltMatch) calibScore += 5;

    const avrMatch = form.avrOrientation === gtAvr || form.avrOrientation === '';
    if (avrMatch) calibScore += 5;

    const calibStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      calibScore >= 10 ? 'MATCH' : calibScore >= 5 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 2. Rate Evaluation (Max 15 pts)
    const parsedHr = parseInt(form.heartRateBpm, 10);
    const gtHr = metrics.heartRateBpm;
    let rateScore = 0;
    let rateDelta = NaN;
    let rateStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' = 'SEVERE_DISCREPANCY';

    if (!isNaN(parsedHr) && parsedHr > 0) {
      rateDelta = Math.abs(parsedHr - gtHr);
      const pctDelta = rateDelta / gtHr;
      if (pctDelta <= 0.12) {
        rateScore = 15;
        rateStatus = 'MATCH';
      } else if (pctDelta <= 0.28) {
        rateScore = 9;
        rateStatus = 'MILD_DISCREPANCY';
      } else {
        rateScore = 3;
        rateStatus = 'SEVERE_DISCREPANCY';
      }
    }

    const gtRateCat = gtHr < 60 ? 'BRADYCARDIA' : gtHr > 100 ? 'TACHYCARDIA' : 'NORMAL';

    // 3. Rhythm Evaluation (Max 15 pts)
    let rhythmScore = 0;
    const isGtRegular = metrics.isRegular;
    const userRegMatch =
      (isGtRegular && form.regularity === 'REGULAR') ||
      (!isGtRegular && (form.regularity === 'IRREGULAR' || form.regularity === 'IRREGULARLY_IRREGULAR'));

    if (userRegMatch) rhythmScore += 7;

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
      rhythmScore += 8;
    }

    const rhythmStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      rhythmScore >= 13 ? 'MATCH' : rhythmScore >= 7 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 4. Axis Evaluation (Max 10 pts)
    const axisMatch = form.axisClassification === metrics.axisClassification;
    const axisScore = axisMatch ? 10 : 0;
    const axisStatus: 'MATCH' | 'SEVERE_DISCREPANCY' = axisMatch ? 'MATCH' : 'SEVERE_DISCREPANCY';

    // 5. Interval & Conduction Evaluation (Max 15 pts: QRS 5, PR 5, QTc 5)
    const gtQrsWide = metrics.qrsDurationMs >= 120;
    const userQrsMatch = (gtQrsWide && form.qrsStatus === 'WIDE') || (!gtQrsWide && form.qrsStatus === 'NARROW');

    const gtPrAbsent = metrics.prIntervalMs === 0;
    const gtPrProlonged = metrics.prIntervalMs > 200;
    const gtPrShort = metrics.prIntervalMs < 120 && metrics.prIntervalMs > 0;
    const userPrMatch =
      (gtPrAbsent && form.prStatus === 'ABSENT') ||
      (gtPrProlonged && form.prStatus === 'PROLONGED') ||
      (gtPrShort && form.prStatus === 'SHORTENED') ||
      (!gtPrAbsent && !gtPrProlonged && !gtPrShort && form.prStatus === 'NORMAL');

    const gtQtcProlonged = metrics.qtcIntervalMs > 460;
    const gtQtcShort = metrics.qtcIntervalMs < 350;
    const userQtcMatch =
      (gtQtcProlonged && form.qtcStatus === 'PROLONGED') ||
      (gtQtcShort && form.qtcStatus === 'SHORTENED') ||
      (!gtQtcProlonged && !gtQtcShort && (form.qtcStatus === 'NORMAL' || form.qtcStatus === ''));

    let conductionScore = 0;
    if (userQrsMatch) conductionScore += 5;
    if (userPrMatch) conductionScore += 5;
    if (userQtcMatch) conductionScore += 5;

    const conductionStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      conductionScore >= 14 ? 'MATCH' : conductionScore >= 7 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 6. Chamber Enlargement & Hypertrophy Evaluation (Max 10 pts: Atrial 5, Ventricular 5)
    const isLvhCase = currentCase.id === 'case_lvh_strain' ||
      currentCase.pathologyGroup === 'HYPERTROPHY' ||
      currentCase.title.toLowerCase().includes('hypertrophy') ||
      currentCase.title.toLowerCase().includes('hipertropi');

    const isRvhCase = currentCase.id === 'case_pulmonary_embolism' ||
      currentCase.id === 'case_pulm_emb' ||
      currentCase.title.toLowerCase().includes('pulmonary embolism') ||
      currentCase.title.toLowerCase().includes('emboli paru');

    let gtVentricular = 'NORMAL';
    if (isLvhCase) {
      gtVentricular = 'LVH_STRAIN';
    } else if (isRvhCase) {
      gtVentricular = 'RVH';
    }

    let gtAtrial = 'NORMAL';
    if (isRvhCase) {
      gtAtrial = 'RAE';
    }

    let hypertrophyScore = 0;
    const userVentricularMatch = (isLvhCase && (form.ventricularHypertrophy === 'LVH' || form.ventricularHypertrophy === 'LVH_STRAIN')) ||
      (isRvhCase && form.ventricularHypertrophy === 'RVH') ||
      (!isLvhCase && !isRvhCase && (form.ventricularHypertrophy === 'NORMAL' || form.ventricularHypertrophy === ''));

    if (userVentricularMatch) hypertrophyScore += 5;

    const userAtrialMatch = (isRvhCase && form.atrialEnlargement === 'RAE') ||
      (!isRvhCase && (form.atrialEnlargement === 'NORMAL' || form.atrialEnlargement === ''));

    if (userAtrialMatch) hypertrophyScore += 5;

    const hypertrophyStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      hypertrophyScore >= 10 ? 'MATCH' : hypertrophyScore >= 5 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 7. ST-T Morphology Evaluation (Max 15 pts)
    const hasGtSte = metrics.stElevationLeads.length > 0;
    const hasGtStd = metrics.stDepressionLeads.length > 0;
    const hasGtTInv = metrics.tWaveInversionLeads.length > 0;
    const hasGtQ = metrics.pathologicQWaveLeads.length > 0;
    const hasAnyPathology = hasGtSte || hasGtStd || hasGtTInv || hasGtQ;

    let stScore = 0;
    if (!hasAnyPathology && (form.stTFindings.length === 0 || form.stTFindings.includes('NORMAL_ST'))) {
      stScore = 15;
    } else {
      if (hasGtSte && form.stTFindings.includes('ST_ELEVASI')) stScore += 6;
      else if (!hasGtSte && !form.stTFindings.includes('ST_ELEVASI')) stScore += 3;

      if (hasGtStd && form.stTFindings.includes('ST_DEPRESI')) stScore += 3;
      else if (!hasGtStd && !form.stTFindings.includes('ST_DEPRESI')) stScore += 1;

      if (hasGtTInv && form.stTFindings.includes('INVERSI_T')) stScore += 3;
      else if (!hasGtTInv && !form.stTFindings.includes('INVERSI_T')) stScore += 1;

      if (hasGtQ && form.stTFindings.includes('Q_PATOLOGIS')) stScore += 3;
      else if (!hasGtQ && !form.stTFindings.includes('Q_PATOLOGIS')) stScore += 1;

      // Check leads text overlap if ischemic
      const userLeadsLower = form.affectedLeads.toLowerCase().replace(/\s+/g, '');
      let leadBonus = 0;
      if (hasGtSte) {
        const anyLeadFound = metrics.stElevationLeads.some((ld) => userLeadsLower.includes(ld.toLowerCase()));
        if (anyLeadFound) leadBonus = 3;
      }
      stScore = Math.min(15, stScore + leadBonus);
    }

    const stStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      stScore >= 12 ? 'MATCH' : stScore >= 7 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // 8. Final Diagnosis & Triage Evaluation (Max 10 pts: Triage 4, Diagnosis 6)
    const triageMatch = form.triageCategory === currentCase.category;
    let diagScore = triageMatch ? 4 : 0;

    // Semantic keywords matching against currentCase titles (bilingual)
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
    if (titleWords.length > 0) {
      const matchRatio = matchedCount / Math.max(3, titleWords.length * 0.4);
      if (matchRatio >= 0.5) diagScore += 6;
      else if (matchRatio >= 0.25 || userDiagLower.length > 8) diagScore += 4;
      else if (userDiagLower.length > 3) diagScore += 2;
    }

    const diagStatus: 'MATCH' | 'MILD_DISCREPANCY' | 'SEVERE_DISCREPANCY' =
      diagScore >= 8 ? 'MATCH' : diagScore >= 4 ? 'MILD_DISCREPANCY' : 'SEVERE_DISCREPANCY';

    // Total Composite Score (0 - 100)
    const totalScore = Math.round(
      calibScore + rateScore + rhythmScore + axisScore + conductionScore + hypertrophyScore + stScore + diagScore
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

    // Critical Clinical Red-Alerts
    const criticalAlerts: string[] = [];
    if (hasGtSte && !form.stTFindings.includes('ST_ELEVASI') && !userDiagLower.includes('stemi')) {
      criticalAlerts.push(
        t.practice.missedStemiAlert(metrics.stElevationLeads.join(', '))
      );
    }
    if (currentCase.category === 'NORMAL' && (form.stTFindings.includes('ST_ELEVASI') || userDiagLower.includes('stemi'))) {
      criticalAlerts.push(
        t.practice.overdiagnosisAlert
      );
    }
    if (
      !metrics.isRegular &&
      (metrics.rhythmDescription.toLowerCase().includes('fibrilasi') ||
       (metrics.rhythmDescriptionEn && metrics.rhythmDescriptionEn.toLowerCase().includes('fibrillation'))) &&
      form.regularity === 'REGULAR'
    ) {
      criticalAlerts.push(
        t.practice.missedAfibAlert
      );
    }

    return {
      calibScore,
      calibStatus,
      gtPaperSpeed,
      gtVoltage,
      gtAvr,
      rateScore,
      rateDelta,
      rateStatus,
      gtRateCat,
      rhythmScore,
      rhythmStatus,
      axisScore,
      axisStatus,
      conductionScore,
      conductionStatus,
      gtQtcProlonged,
      gtQtcShort,
      hypertrophyScore,
      hypertrophyStatus,
      gtVentricular,
      gtAtrial,
      stScore,
      stStatus,
      diagScore,
      diagStatus,
      totalScore,
      competencyLevel,
      competencyBadge,
      competencyDesc,
      criticalAlerts,
    };
  }, [form, currentCase, t]);

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

  // Current case index among practice cases
  const currentIndex = cases.findIndex((c) => c.id === currentCase.id);

  return (
    <div className="flex flex-col h-full bg-white border-l border-stone-200 text-stone-800 select-none overflow-hidden font-sans">
      {/* 1. Header: Practice Mode & Score Badge */}
      <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
        <div>
          <span className="text-[10px] font-mono text-purple-700 font-bold tracking-wider uppercase block">
            {t.practice.modeTitle}
          </span>
          <h2 className="text-xs sm:text-sm font-bold text-stone-900">
            {t.practice.modeSubtitle}
          </h2>
        </div>
        <div className="text-right font-mono text-xs">
          <span className="text-stone-500 text-[10px] block">{t.practice.sessionAccuracy}</span>
          <span className="text-emerald-700 font-bold">
            {sessionCount.masterCount} / {sessionCount.total}{' '}
            {sessionCount.total > 0 && `(${Math.round((sessionCount.masterCount / sessionCount.total) * 100)}%)`}
          </span>
        </div>
      </div>

      {/* 2. Blinded Case Selector Dropdown & OSCE Blank Download (Zero Title Leaks) */}
      <div className="px-3 py-2 bg-stone-100/80 border-b border-stone-200 flex items-center justify-between gap-2 shrink-0">
        <label className="text-[11px] font-mono text-stone-500 shrink-0 font-bold">{t.practice.selectCaseLabel}</label>
        <select
          value={currentCase.id}
          onChange={(e) => handleCaseChange(e.target.value)}
          className="flex-1 bg-white border border-stone-300 text-stone-800 text-base sm:text-xs px-2 py-1 rounded font-sans truncate focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer"
        >
          {cases.map((c, i) => (
            <option key={c.id} value={c.id}>
              {locale === 'en' ? 'Practice Case' : 'Kasus Latihan'} #{i + 1}: {c.patient.gender === 'Male' ? (locale === 'en' ? 'Male' : 'Pria') : (locale === 'en' ? 'Female' : 'Wanita')}, {c.patient.age} {locale === 'en' ? 'yo' : 'th'}
            </option>
          ))}
        </select>
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

      {/* 3. Blinded Patient Clinical Vignette (Omitting HR so user must calculate it) */}
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

      {/* 4. Main Scrollable Stage Area: Form vs Discrepancy Matrix */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {!isSubmitted ? (
          /* FORM INTERPRETASI SISTEMATIS 8 TAHAP (GOLD STANDARD) */
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

            {/* TAHAP 2: Frekuensi Jantung (Rate) */}
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

            {/* TAHAP 4: Aksis Frontal (Axis) */}
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
            </div>

            {/* TAHAP 5: Interval Konduksi (PR, QRS, QTc) */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                {t.practiceDrill.stage5IntervalsTitle}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-stone-500 block mb-0.5">{t.practiceDrill.prLabel}</label>
                  <select
                    value={form.prStatus}
                    onChange={(e) => setForm({ ...form, prStatus: e.target.value as any })}
                    className="w-full bg-white border border-stone-300 rounded px-1.5 py-1 text-base sm:text-[11px] text-stone-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{t.practiceDrill.prPlaceholder}</option>
                    <option value="NORMAL">{t.practiceDrill.prNormal}</option>
                    <option value="PROLONGED">{t.practiceDrill.prProlonged}</option>
                    <option value="SHORTENED">{t.practiceDrill.prShortened}</option>
                    <option value="ABSENT">{t.practiceDrill.prAbsent}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-0.5">{t.practiceDrill.qrsLabel}</label>
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
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-0.5">{t.practiceDrill.qtcLabel}</label>
                  <select
                    value={form.qtcStatus}
                    onChange={(e) => setForm({ ...form, qtcStatus: e.target.value as any })}
                    className="w-full bg-white border border-stone-300 rounded px-1.5 py-1 text-base sm:text-[11px] text-stone-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{t.practiceDrill.qtcPlaceholder}</option>
                    <option value="NORMAL">{t.practiceDrill.qtcNormal}</option>
                    <option value="PROLONGED">{t.practiceDrill.qtcProlonged}</option>
                    <option value="SHORTENED">{t.practiceDrill.qtcShortened}</option>
                  </select>
                </div>
              </div>
              <div>
                <input
                  type="text"
                  placeholder={t.practiceDrill.conductionDefectPlaceholder}
                  value={form.conductionDefect}
                  onChange={(e) => setForm({ ...form, conductionDefect: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-base sm:text-xs text-stone-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* TAHAP 6: Pembesaran Ruang & Hipertropi (Chamber Enlargement) */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-teal-600" />
                {t.practiceDrill.stage6HypertrophyTitle}
              </span>
              <p className="text-[10px] text-stone-500">{t.practiceDrill.stage6HypertrophyHint}</p>
              <div className="space-y-2">
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
                            ? 'bg-teal-600 text-white border-teal-700'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {at.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 block mb-1 font-semibold">
                    {t.practiceDrill.ventricularHypertrophyLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'NORMAL', label: t.practiceDrill.ventricularNormal },
                      { id: 'LVH', label: t.practiceDrill.ventricularLvh },
                      { id: 'LVH_STRAIN', label: t.practiceDrill.ventricularLvhStrain },
                      { id: 'RVH', label: t.practiceDrill.ventricularRvh },
                    ].map((vt) => (
                      <button
                        type="button"
                        key={vt.id}
                        onClick={() => setForm({ ...form, ventricularHypertrophy: vt.id as any })}
                        className={`p-1.5 text-[10px] text-left font-bold rounded border transition cursor-pointer ${
                          form.ventricularHypertrophy === vt.id
                            ? 'bg-teal-700 text-white border-teal-800'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {vt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TAHAP 7: Morfologi ST-T & Iskemia */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {t.practiceDrill.stage7StTitle}
              </span>
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

            {/* TAHAP 8: Kesimpulan & Diagnosis Utama */}
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                {t.practiceDrill.stage8SynthesisTitle}
              </span>

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

            {/* Submit Action Button */}
            <div className="pt-1">
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold font-sans rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{t.practice.submitAndEvaluate}</span>
              </button>
            </div>
          </form>
        ) : (
          /* DISCREPANCY & COMPARISON MATRIX ("SEBERAPA NGAWUR") */
          <div className="space-y-3.5 text-xs animate-in fade-in duration-200">
            {/* 1. Composite Score & Competency Banner */}
            <div className="p-3 bg-stone-900 text-white rounded-lg space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider block">
                    {t.practice.evalBannerTitle}
                  </span>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <Award className="w-5 h-5 text-yellow-400" />
                    {t.practice.accuracyScoreLabel}: {evaluation.totalScore}%
                  </h3>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${evaluation.competencyBadge}`}>
                  {evaluation.competencyLevel}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-snug">
                {evaluation.competencyDesc}
              </p>
            </div>

            {/* 2. Critical Alert Banner (If Any Serious Underdiagnosis / Overdiagnosis) */}
            {evaluation.criticalAlerts.length > 0 && (
              <div className="space-y-1.5">
                {evaluation.criticalAlerts.map((alertText, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-950 text-xs flex items-start gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="font-semibold leading-relaxed">{alertText}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. The 8-Stage Side-by-Side Discrepancy Matrix Table */}
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
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <strong className="text-stone-900">{form.paperSpeed || '25'} mm/s | {form.voltageSensitivity || '10'} mm/mV</strong>{' '}
                      <span className="text-stone-500">(aVR: {form.avrOrientation || 'NEGATIVE'})</span>
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
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
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
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
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
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <strong className="text-stone-900">{form.axisClassification || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <strong className="text-blue-900">
                        {currentCase.metrics.axisClassification} ({currentCase.metrics.axisDegrees}°)
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Row 5: Intervals & Conduction */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>5. {t.practiceDrill.stage5IntervalsTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.conductionStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.conductionStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.conductionStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.conductionStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.partialStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <span>PR: {form.prStatus || '-'}</span> | <span>QRS: {form.qrsStatus || '-'}</span> | <span>QTc: {form.qtcStatus || '-'}</span>
                      {form.conductionDefect && <div className="text-stone-800 italic">{form.conductionDefect}</div>}
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <span className="text-blue-900 font-semibold">
                        PR: {currentCase.metrics.prIntervalMs} ms | QRS: {currentCase.metrics.qrsDurationMs} ms | QTc: {currentCase.metrics.qtcIntervalMs} ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 6: Chamber Enlargement & Hypertrophy */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>6. {t.practiceDrill.stage6HypertrophyTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.hypertrophyStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.hypertrophyStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.hypertrophyStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.hypertrophyStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.partialStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <span>Atrium: {form.atrialEnlargement || 'NORMAL'}</span> | <span>Ventrikel: {form.ventricularHypertrophy || 'NORMAL'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <span className="text-blue-900 font-semibold">
                        Atrium: {evaluation.gtAtrial} | Ventrikel: {evaluation.gtVentricular}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 7: ST-T Morphology & Ischemia */}
                <div className="p-2.5 bg-white space-y-1">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>7. {t.practiceDrill.stage7StTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.stStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.stStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.stStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.stStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.partialStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <div className="font-semibold text-stone-800">
                        {form.stTFindings.length > 0 ? form.stTFindings.join(', ') : t.practiceDrill.stNormalLabel}
                      </div>
                      <div className="text-[10px] text-stone-500">{locale === 'en' ? 'Leads' : 'Sadapan'}: {form.affectedLeads || '-'}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      {currentCase.metrics.stElevationLeads.length > 0 ? (
                        <div className="text-rose-800 font-bold">
                          {locale === 'en' ? 'ST Elevation' : 'ST Elevasi'}: {currentCase.metrics.stElevationLeads.join(', ')}
                        </div>
                      ) : (
                        <div className="text-emerald-800 font-semibold">{t.practiceDrill.noStElevation}</div>
                      )}
                      {currentCase.metrics.stDepressionLeads.length > 0 && (
                        <div className="text-amber-800">
                          {locale === 'en' ? 'ST Depression' : 'ST Depresi'}: {currentCase.metrics.stDepressionLeads.join(', ')}
                        </div>
                      )}
                      {currentCase.metrics.tWaveInversionLeads.length > 0 && (
                        <div className="text-indigo-800">
                          {locale === 'en' ? 'T Inversion' : 'Inversi T'}: {currentCase.metrics.tWaveInversionLeads.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 8: Final Clinical Diagnosis */}
                <div className="p-2.5 bg-purple-50/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-purple-950">
                    <span>8. {t.practiceDrill.stage8SynthesisTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evaluation.diagStatus === 'MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evaluation.diagStatus === 'MILD_DISCREPANCY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {evaluation.diagStatus === 'MATCH'
                        ? t.practiceDrill.matchStatus
                        : evaluation.diagStatus === 'MILD_DISCREPANCY'
                        ? t.practiceDrill.closeStatus
                        : t.practiceDrill.severeStatus}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.yourAnswerLabel}:</span>
                      <div className="p-1.5 bg-white rounded border border-stone-200 text-stone-900 font-semibold text-xs">
                        [{form.triageCategory || 'Triase -'}] "{form.clinicalDiagnosis}"
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">{t.practiceDrill.goldStandardLabel}:</span>
                      <div className="p-1.5 bg-emerald-50 rounded border border-emerald-200 text-emerald-950 font-bold text-xs">
                        [{currentCase.category}] {locale === 'en' && currentCase.medicalTermEn ? currentCase.medicalTermEn : currentCase.title}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Export Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const mappedAnswers: Record<string, string> = {
                    calibration: `${form.paperSpeed || '25'} mm/s, ${form.voltageSensitivity || '10'} mm/mV, aVR ${form.avrOrientation || 'NEGATIVE'}`,
                    heartRate: form.heartRateBpm,
                    rateCategory: form.rateCategory,
                    regularity: form.regularity,
                    rhythmType: form.rhythmOrigin,
                    axisClassification: form.axisClassification,
                    prIntervalStatus: form.prStatus,
                    qrsWidth: form.qrsStatus,
                    qtcStatus: form.qtcStatus,
                    hypertrophyAtrial: form.atrialEnlargement,
                    hypertrophyVentricular: form.ventricularHypertrophy,
                    stMorphology: form.stTFindings.join(', '),
                    ischemiaLeads: form.affectedLeads,
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
