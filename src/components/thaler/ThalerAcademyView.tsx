/**
 * ThalerAcademyView: Systematic 12-Lead EKG Learning & Deliberate Practice Workstation
 * Integrates hospital-grade 12-lead paper canvas, choreographed camera pan & zoom,
 * minimal step-by-step tutorial, Visual Exemplar Atlas, and Diagnostic Decision Flowchart.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GitFork, BookOpen, Layers, Compass, Calculator, FileText, Bookmark, Star, X, HelpCircle, Activity, ChevronRight } from 'lucide-react';
import { THALER_EKG_CASES } from '../../engine/clinical/thaler/thalerCases';
import { CameraCoordinates, EKGCase, TutorialStep, ClinicalTier, CLINICAL_TIER_CONFIG } from '../../engine/clinical/thaler/thalerTypes';
import { getLocalizedCase } from '../../engine/clinical/thaler/thalerLocalization';
import { ThalerEcgCanvas } from './ThalerEcgCanvas';
import { ThalerIdiographPanel } from './ThalerIdiographPanel';
import { ThalerPracticeDrill } from './ThalerPracticeDrill';
import { ClinicalStepper } from './ClinicalStepper';
import { DiagnosticFlowchartModal } from './DiagnosticFlowchartModal';
import { VisualExemplarModal } from './VisualExemplarModal';
import { LeadTerritoryModal } from './LeadTerritoryModal';
import { AxisQuadrantModal } from './AxisQuadrantModal';
import { CaseCompletionModal } from './CaseCompletionModal';
import { ClinicalPocketCheatSheetModal } from './ClinicalPocketCheatSheetModal';
import { ClinicalCalculatorsModal } from './ClinicalCalculatorsModal';
import { FeedbackModal } from './FeedbackModal';
import { FeedbackStorage } from '../../engine/storage/feedbackStorage';
import { WelcomeOnboardingModal } from './WelcomeOnboardingModal';
import { InteractiveSpotlightTour } from './InteractiveSpotlightTour';
import { OnboardingStorage } from '../../engine/storage/onboardingStorage';
import { ThalerPdfExportEngine } from '../../engine/export/ThalerPdfExportEngine';
import { LocaleProvider, useLocale } from '../../locales/useLocale';

type AcademyMode = 'TUTORIAL' | 'PRACTICE';

interface ThalerAcademyViewProps {
  onBackToSimulator?: () => void;
}

const ThalerAcademyInner: React.FC<ThalerAcademyViewProps> = ({ onBackToSimulator }) => {
  const { locale, toggleLocale, t } = useLocale();

  // Mode selection
  const [academyMode, setAcademyMode] = useState<AcademyMode>('TUTORIAL');

  // Mobile active tab switcher ('canvas' | 'reasoning')
  const [mobileTab, setMobileTab] = useState<'canvas' | 'reasoning'>('canvas');

  // Case selection
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case_foundations_anatomy');

  // Tutorial step index
  const [stepIndex, setStepIndex] = useState<number>(0);

  // Digital caliper tool active state
  const [isCaliperActive, setIsCaliperActive] = useState<boolean>(false);

  // Modals state: Flowchart, Visual Atlas, Lead Territory, Axis Wheel, Case Completion, Pocket Cheat Sheet, Calculators
  const [isFlowchartOpen, setIsFlowchartOpen] = useState<boolean>(false);
  const [isVisualAtlasOpen, setIsVisualAtlasOpen] = useState<boolean>(false);
  const [atlasInitialGroupId, setAtlasInitialGroupId] = useState<string>('INFARCTION_ST_T');
  const [isLeadTerritoryOpen, setIsLeadTerritoryOpen] = useState<boolean>(false);
  const [isAxisWheelOpen, setIsAxisWheelOpen] = useState<boolean>(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState<boolean>(false);
  const [isPocketCheatSheetOpen, setIsPocketCheatSheetOpen] = useState<boolean>(false);
  const [isCalculatorsOpen, setIsCalculatorsOpen] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [isAutomaticFeedbackPrompt, setIsAutomaticFeedbackPrompt] = useState<boolean>(false);
  const [showFeedbackToast, setShowFeedbackToast] = useState<boolean>(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
  const [isSpotlightTourOpen, setIsSpotlightTourOpen] = useState<boolean>(false);

  // Check if first-time user is eligible for welcome modal orientation
  useEffect(() => {
    if (OnboardingStorage.isEligibleForWelcome()) {
      const timer = setTimeout(() => {
        setIsWelcomeModalOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Check if user is eligible for non-intrusive feedback toast after engagement (capped at once per session)
  const hasShownToastInSessionRef = useRef(false);
  useEffect(() => {
    if (hasShownToastInSessionRef.current) return;
    const timer = setTimeout(() => {
      if (!hasShownToastInSessionRef.current && FeedbackStorage.isEligibleForPrompt()) {
        setShowFeedbackToast(true);
        hasShownToastInSessionRef.current = true;
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [selectedCaseId]);

  // Keyboard shortcuts: 'b' for pocket cheat sheet, 'c' for clinical calculators
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
        return;
      }
      if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey) {
        setIsPocketCheatSheetOpen((prev) => !prev);
      }
      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
        setIsCalculatorsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Find active case
  const currentCase: EKGCase = useMemo(() => {
    const rawCase = THALER_EKG_CASES.find((c) => c.id === selectedCaseId) || THALER_EKG_CASES[0];
    return getLocalizedCase(rawCase, locale);
  }, [selectedCaseId, locale]);

  // Current tutorial step with defensive fallback against empty steps
  const activeStep: TutorialStep = useMemo(() => {
    if (!currentCase.tutorialSteps || currentCase.tutorialSteps.length === 0) {
      return {
        stepIndex: 0,
        stepNumber: 0,
        stepName: 'Tutorial',
        cameraTarget: { focusLeads: ['II'], zoomLevel: 1.0, centerPercentX: 50, centerPercentY: 50 },
        highlightBoxes: [],
        clinicalFindingTitle: currentCase.title,
        triageStatus: 'NORMAL' as const,
        plainInstructions: [locale === 'en' ? 'Analyze ECG leads on the canvas.' : 'Analisis sadapan EKG pada kanvas.'],
        thalerRuleQuote: locale === 'en' ? 'Analyze ECG leads meticulously.' : 'Analisis sadapan EKG dengan cermat.',
      };
    }
    return currentCase.tutorialSteps[stepIndex] || currentCase.tutorialSteps[0];
  }, [currentCase, stepIndex, locale]);

  // Manual camera override (e.g. if user pressed reset zoom or zoom to wave)
  const [manualCamera, setManualCamera] = useState<CameraCoordinates | null>(null);

  // Effective camera target
  const effectiveCamera: CameraCoordinates = useMemo(() => {
    if (manualCamera) return manualCamera;
    if (academyMode === 'PRACTICE') {
      return {
        focusLeads: ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'],
        zoomLevel: 1.0,
        centerPercentX: 50,
        centerPercentY: 50,
      };
    }
    return activeStep.cameraTarget;
  }, [manualCamera, academyMode, activeStep]);

  // Navigation handlers with functional bounds checking against rapid clicks
  const handleSelectCase = useCallback((caseId: string) => {
    setSelectedCaseId(caseId);
    setStepIndex(0);
    setManualCamera(null);
  }, []);

  const handleNextStep = useCallback(() => {
    setStepIndex((prev) => (prev < currentCase.tutorialSteps.length - 1 ? prev + 1 : prev));
    setManualCamera(null);
  }, [currentCase.tutorialSteps.length]);

  const handlePrevStep = useCallback(() => {
    setStepIndex((prev) => (prev > 0 ? prev - 1 : 0));
    setManualCamera(null);
  }, []);

  const handleSelectStep = useCallback((idx: number) => {
    setStepIndex(Math.max(0, Math.min(idx, currentCase.tutorialSteps.length - 1)));
    setManualCamera(null);
  }, [currentCase.tutorialSteps.length]);

  const handleResetCamera = useCallback(() => {
    setManualCamera({
      focusLeads: ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'],
      zoomLevel: 1.0,
      centerPercentX: 50,
      centerPercentY: 50,
    });
  }, []);

  const handleZoomToFeature = useCallback(() => {
    if (academyMode === 'PRACTICE') {
      setManualCamera({
        focusLeads: ['II'],
        zoomLevel: 2.0,
        centerPercentX: 50,
        centerPercentY: 50,
      });
      return;
    }
    const target = activeStep.cameraTarget;
    setManualCamera({
      focusLeads: target.focusLeads.length > 0 ? target.focusLeads : ['II'],
      zoomLevel: 2.0,
      centerPercentX: target.centerPercentX,
      centerPercentY: target.centerPercentY,
    });
  }, [academyMode, activeStep]);

  const handleToggleCaliper = useCallback(() => {
    setIsCaliperActive((prev) => !prev);
  }, []);

  const handleOpenTutorialFromPractice = useCallback(() => {
    setAcademyMode('TUTORIAL');
    setStepIndex(0);
    setManualCamera(null);
  }, []);

  const handleOpenAtlas = useCallback((groupId?: string) => {
    if (groupId) {
      setAtlasInitialGroupId(groupId);
    }
    setIsVisualAtlasOpen(true);
  }, []);

  // Compute next case for smooth linear curriculum progression
  const currentCaseIndex = useMemo(() => {
    return THALER_EKG_CASES.findIndex((c) => c.id === selectedCaseId);
  }, [selectedCaseId]);

  const nextCase = useMemo(() => {
    if (currentCaseIndex >= 0 && currentCaseIndex < THALER_EKG_CASES.length - 1) {
      return THALER_EKG_CASES[currentCaseIndex + 1];
    }
    return undefined;
  }, [currentCaseIndex]);

  const handleSelectNextCase = useCallback(() => {
    if (nextCase) {
      handleSelectCase(nextCase.id);
      setIsCompletionModalOpen(false);
    }
  }, [nextCase, handleSelectCase]);

  const handleRestartCase = useCallback(() => {
    setStepIndex(0);
    setManualCamera(null);
    setIsCompletionModalOpen(false);
  }, []);

  const handleGoToPractice = useCallback(() => {
    setAcademyMode('PRACTICE');
    if (selectedCaseId === 'case_foundations_anatomy') {
      setSelectedCaseId(THALER_EKG_CASES[1]?.id || THALER_EKG_CASES[0].id);
    }
    setIsCompletionModalOpen(false);
  }, [selectedCaseId]);

  const handleJumpFromFlowchart = useCallback((caseId: string, stepNumber: number) => {
    const targetCase = THALER_EKG_CASES.find((c) => c.id === caseId);
    if (targetCase) {
      setSelectedCaseId(caseId);
      const safeStep = Math.max(0, Math.min(stepNumber - 1, targetCase.tutorialSteps.length - 1));
      setStepIndex(safeStep);
    } else {
      setSelectedCaseId(THALER_EKG_CASES[0].id);
      setStepIndex(0);
    }
    setManualCamera(null);
    setAcademyMode('TUTORIAL');
    setIsFlowchartOpen(false);
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] min-h-[100dvh] w-full bg-stone-100 text-stone-900 overflow-hidden font-sans">
      {/* 1. Master Application Top Bar (Clean Hospital Light / Swiss Style) */}
      <header className="h-12 bg-white border-b border-stone-200 px-3 sm:px-4 flex items-center justify-between shrink-0 shadow-2xs gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {onBackToSimulator && (
            <button
              onClick={onBackToSimulator}
              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-sans font-medium rounded border border-stone-300 transition cursor-pointer"
              title={t.common.backTo3DTooltip}
            >
              {t.common.backTo3D}
            </button>
          )}

          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <div className="flex items-baseline space-x-1.5">
              <h1 className="text-sm font-bold tracking-tight text-stone-900">
                {t.common.appTitle}
              </h1>
              <span className="text-[11px] text-stone-500 hidden sm:inline">
                {t.common.subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Educational Tools + Clinical Bedside Aids + Mode Switcher */}
        <div data-tour="educational-tools" className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto py-1 min-w-0 flex-1 no-scrollbar">
          {/* Lead Territory Guide Button */}
          <button
            onClick={() => setIsLeadTerritoryOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-sans font-semibold rounded border border-amber-200 shadow-2xs transition cursor-pointer shrink-0"
            title={t.common.leadTerritoryTooltip}
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden lg:inline">{t.common.leadTerritoryBtn}</span>
          </button>

          {/* Axis Quadrant Wheel Button */}
          <button
            onClick={() => setIsAxisWheelOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-sans font-semibold rounded border border-purple-200 shadow-2xs transition cursor-pointer shrink-0"
            title={t.common.axisTooltip}
          >
            <Compass className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden lg:inline">{t.common.axisBtn}</span>
          </button>

          {/* Flowchart Button */}
          <button
            onClick={() => setIsFlowchartOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-sans font-semibold rounded border border-blue-200 shadow-2xs transition cursor-pointer shrink-0"
            title={t.common.flowchartTooltip}
          >
            <GitFork className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden lg:inline">{t.common.flowchartBtn}</span>
          </button>

          {/* Visual Atlas Button */}
          <button
            onClick={() => setIsVisualAtlasOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-sans font-semibold rounded border border-rose-200 shadow-2xs transition cursor-pointer shrink-0"
            title={t.common.atlasTooltip}
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden lg:inline">{t.common.atlasBtn}</span>
          </button>

          {/* Buku Saku EKG (Pocket Cheat Sheet) */}
          <button
            onClick={() => setIsPocketCheatSheetOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-sans font-semibold rounded border border-emerald-200 shadow-2xs transition cursor-pointer shrink-0"
            title={t.common.pocketGuideTooltip}
          >
            <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden lg:inline">{t.common.pocketGuideBtn}</span>
          </button>

          {/* Bedside Clinical Calculators */}
          <button
            onClick={() => setIsCalculatorsOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-sans font-semibold rounded border border-sky-200 shadow-2xs transition cursor-pointer shrink-0"
            title={t.common.calculatorsTooltip}
          >
            <Calculator className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden lg:inline">{t.common.calculatorsBtn}</span>
          </button>

          {/* Lembar Kerja OSCE PDF Download Button */}
          <button
            onClick={() => ThalerPdfExportEngine.exportBlankOsceWorksheet(currentCase, locale)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-sans font-semibold rounded border border-stone-300 shadow-2xs transition cursor-pointer shrink-0"
            title={t.common.osceSheetTooltip}
          >
            <FileText className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden xl:inline">{t.common.osceSheetBtn}</span>
          </button>

          {/* Feedback & Review Button */}
          <button
            onClick={() => {
              setIsAutomaticFeedbackPrompt(false);
              setIsFeedbackModalOpen(true);
            }}
            className="flex items-center space-x-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-sans font-semibold rounded border border-purple-200 shadow-2xs transition cursor-pointer shrink-0"
            title={t.common.feedbackTooltip}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="hidden xl:inline">{t.common.feedbackBtn}</span>
          </button>

          {/* Interactive Guided Tour Button */}
          <button
            onClick={() => {
              setAcademyMode('TUTORIAL');
              setStepIndex(0);
              OnboardingStorage.resetAndRestartTour();
              setIsSpotlightTourOpen(true);
            }}
            className="flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-sans font-semibold rounded border border-blue-200 shadow-2xs transition cursor-pointer shrink-0"
            title={t.common.tourTooltip}
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden xl:inline">{t.common.tourBtn}</span>
          </button>

          {/* Mode Switcher Tabs */}
          <div data-tour="mode-switcher" className="flex items-center bg-stone-100 p-0.5 rounded-md border border-stone-200 shrink-0">
            <button
              onClick={() => {
                setAcademyMode('TUTORIAL');
                setManualCamera(null);
              }}
              className={`px-3 py-1 text-xs font-sans rounded transition cursor-pointer ${
                academyMode === 'TUTORIAL'
                  ? 'bg-white text-stone-900 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              {t.common.tutorialMode}
            </button>
            <button
              onClick={() => {
                setAcademyMode('PRACTICE');
                setManualCamera(null);
                if (selectedCaseId === 'case_foundations_anatomy') {
                  setSelectedCaseId(THALER_EKG_CASES[1]?.id || THALER_EKG_CASES[0].id);
                }
              }}
              className={`px-3 py-1 text-xs font-sans rounded transition cursor-pointer ${
                academyMode === 'PRACTICE'
                  ? 'bg-white text-stone-900 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              {t.common.practiceMode} ({THALER_EKG_CASES.length - 1})
            </button>
          </div>
        </div>

        {/* Right Controls: Tier-Grouped Case Selector & Language Switcher */}
        <div className="flex items-center space-x-2">
          {/* Case Dropdown grouped by Clinical Tier */}
          <select
            data-tour="case-selector"
            value={selectedCaseId}
            onChange={(e) => handleSelectCase(e.target.value)}
            className="bg-white border border-stone-300 text-stone-800 text-base sm:text-xs px-2.5 py-1 rounded font-sans focus:outline-none focus:border-blue-500 max-w-[130px] sm:max-w-[210px] truncate shadow-2xs cursor-pointer"
          >
            {(['FOUNDATION', 'EMERGENCY_RED_FLAG', 'INTERMEDIATE_WARD', 'ADVANCED_EXPERT'] as ClinicalTier[]).map((tierKey) => {
              const tierCases = THALER_EKG_CASES.filter((c) => c.clinicalTier === tierKey);
              if (tierCases.length === 0) return null;
              const tierCfg = CLINICAL_TIER_CONFIG[tierKey];
              const tierLabel = t.tiers[tierKey]?.label || tierCfg.label;
              return (
                <optgroup key={tierKey} label={tierLabel}>
                  {tierCases.map((c) => {
                    const globalIdx = THALER_EKG_CASES.findIndex((item) => item.id === c.id);
                    return (
                      <option key={c.id} value={c.id}>
                        {academyMode === 'PRACTICE'
                          ? (globalIdx === 0
                              ? t.common.anatomyFoundationsGuide
                              : t.common.practiceCaseLabel(globalIdx, c.patient.gender, c.patient.age))
                          : (globalIdx === 0
                              ? t.common.anatomyFoundationsGuide
                              : `${globalIdx}. ${c.caseCode}: ${(locale === 'en' ? (c.titleEn || c.medicalTermEn || c.title) : c.title).split('(')[0]}`)}
                      </option>
                    );
                  })}
                </optgroup>
              );
            })}
          </select>

          {/* Language Toggle Button [ID | EN] */}
          <button
            onClick={toggleLocale}
            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono font-bold rounded border border-stone-300 shadow-2xs transition cursor-pointer"
            title={t.common.switchLanguage}
          >
            {locale.toUpperCase()}
          </button>
        </div>
      </header>

      {/* Horizontal Diagnostic Clinical Stepper (Tutorial Mode Only) */}
      {academyMode === 'TUTORIAL' && (
        <div data-tour="clinical-stepper">
          <ClinicalStepper
            steps={currentCase.tutorialSteps}
            currentStepIndex={stepIndex}
            onSelectStep={handleSelectStep}
          />
        </div>
      )}

      {/* Mobile Segmented Tab Switcher (< 768px / md:hidden) */}
      <div className="md:hidden flex items-center justify-between bg-stone-200/90 backdrop-blur-xs px-3 py-1.5 border-b border-stone-300 shrink-0">
        <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-300 w-full">
          <button
            onClick={() => setMobileTab('canvas')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              mobileTab === 'canvas'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>{locale === 'en' ? 'EKG Canvas' : 'Kanvas EKG'}</span>
          </button>
          <button
            onClick={() => setMobileTab('reasoning')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              mobileTab === 'reasoning'
                ? 'bg-white text-stone-900 shadow-2xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-600" />
            <span className="truncate">
              {academyMode === 'TUTORIAL'
                ? (locale === 'en' ? `Reasoning (${stepIndex + 1}/${currentCase.tutorialSteps.length})` : `Penalaran (${stepIndex + 1}/${currentCase.tutorialSteps.length})`)
                : (locale === 'en' ? 'Practice Form' : 'Form Latihan')}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Coordinated Split-Pane Viewport (Aspect-Locked Canvas + Reasoning Panel) */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-stone-100 relative">
        {/* Left Stage (Canvas Pane): Visible on desktop OR when mobileTab === 'canvas' */}
        <section
          data-tour="ecg-canvas"
          className={`flex-1 overflow-hidden p-2 md:h-full ${
            mobileTab === 'canvas' ? 'flex flex-col h-full' : 'hidden md:flex md:flex-col'
          }`}
        >
          <div className="flex-1 min-h-0 w-full h-full relative">
            <ThalerEcgCanvas
              currentCase={currentCase}
              camera={effectiveCamera}
              highlightBoxes={academyMode === 'TUTORIAL' ? activeStep.highlightBoxes : []}
              activeStepName={academyMode === 'TUTORIAL' ? activeStep.stepName : t.common.practiceMode}
              activeStep={academyMode === 'TUTORIAL' ? activeStep : undefined}
              isCaliperActive={isCaliperActive}
              onResetCamera={handleResetCamera}
              onZoomToFeature={handleZoomToFeature}
              isPracticeMode={academyMode === 'PRACTICE'}
            />
          </div>

          {/* Mobile Bottom Quick Control Strip (visible on mobile canvas view) */}
          <div className="md:hidden mt-1.5 pt-1 border-t border-stone-200 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-xs px-2 py-1.5 rounded-lg border shadow-2xs">
            {academyMode === 'TUTORIAL' ? (
              <>
                <button
                  onClick={handlePrevStep}
                  disabled={stepIndex === 0}
                  className="px-2.5 py-1 text-xs font-semibold rounded border border-stone-200 bg-white disabled:opacity-40 text-stone-700 cursor-pointer"
                >
                  &larr; {t.common.previous}
                </button>
                <span className="text-[11px] font-mono font-bold text-stone-600">
                  {stepIndex + 1} / {currentCase.tutorialSteps.length}
                </span>
                <button
                  onClick={stepIndex >= currentCase.tutorialSteps.length - 1 ? () => setIsCompletionModalOpen(true) : handleNextStep}
                  className="px-2.5 py-1 text-xs font-bold rounded bg-blue-600 text-white cursor-pointer shadow-xs shrink-0"
                >
                  {stepIndex >= currentCase.tutorialSteps.length - 1 ? (
                    <>
                      <span className="hidden sm:inline">{t.common.completeCase}</span>
                      <span className="sm:hidden">{locale === 'en' ? 'Finish' : 'Selesai'}</span>
                    </>
                  ) : `${t.common.next} \u2192`}
                </button>
                <button
                  onClick={() => setMobileTab('reasoning')}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded bg-stone-900 text-white cursor-pointer ml-1 shadow-xs"
                >
                  <BookOpen className="w-3 h-3 text-rose-400" />
                  <span>{locale === 'en' ? 'Reasoning' : 'Penalaran'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setMobileTab('reasoning')}
                className="w-full flex items-center justify-center space-x-1.5 py-1 text-xs font-bold rounded bg-purple-700 text-white shadow-xs cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{locale === 'en' ? 'Open Practice Interpretation Form' : 'Buka Form Interpretasi Latihan'}</span>
              </button>
            )}
          </div>
        </section>

        {/* Right Stage (Reasoning / Practice Pane): Visible on desktop OR when mobileTab === 'reasoning' */}
        <aside
          data-tour="reasoning-panel"
          className={`w-full md:w-[380px] lg:w-[420px] md:h-full shrink-0 overflow-hidden p-2 md:pl-0 ${
            mobileTab === 'reasoning' ? 'flex flex-col h-full' : 'hidden md:flex md:flex-col'
          }`}
        >
          {academyMode === 'TUTORIAL' ? (
            <ThalerIdiographPanel
              currentCase={currentCase}
              currentStepIndex={stepIndex}
              totalSteps={currentCase.tutorialSteps.length}
              activeStep={activeStep}
              isCaliperActive={isCaliperActive}
              onSelectStep={handleSelectStep}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
              onToggleCaliper={handleToggleCaliper}
              onResetZoom={handleResetCamera}
              onOpenFlowchart={() => setIsFlowchartOpen(true)}
              onOpenAtlas={handleOpenAtlas}
              onCompleteCase={() => setIsCompletionModalOpen(true)}
              onOpenLeadTerritory={() => setIsLeadTerritoryOpen(true)}
              onOpenAxisWheel={() => setIsAxisWheelOpen(true)}
            />
          ) : (
            <ThalerPracticeDrill
              key={currentCase.id}
              cases={THALER_EKG_CASES.filter((c) => c.id !== 'case_foundations_anatomy')}
              currentCase={currentCase}
              onSelectCase={handleSelectCase}
              onOpenTutorialForCase={handleOpenTutorialFromPractice}
              onResetZoom={handleResetCamera}
            />
          )}
        </aside>
      </main>

      {/* Diagnostic Decision Flowchart Modal */}
      <DiagnosticFlowchartModal
        isOpen={isFlowchartOpen}
        onClose={() => setIsFlowchartOpen(false)}
        onJumpToTutorial={handleJumpFromFlowchart}
        currentCaseId={selectedCaseId}
      />

      {/* Full Visual Exemplar Modal */}
      <VisualExemplarModal
        isOpen={isVisualAtlasOpen}
        onClose={() => setIsVisualAtlasOpen(false)}
        initialGroupId={atlasInitialGroupId}
        activeCaseFindingId={activeStep.exemplarGroupId}
      />

      {/* Lead Territory & Clinical Pitfalls Modal */}
      <LeadTerritoryModal
        isOpen={isLeadTerritoryOpen}
        onClose={() => setIsLeadTerritoryOpen(false)}
      />

      {/* Frontal Plane Axis Quadrant Wheel Modal */}
      <AxisQuadrantModal
        isOpen={isAxisWheelOpen}
        onClose={() => setIsAxisWheelOpen(false)}
        axisDegrees={currentCase.metrics.axisDegrees}
        axisClassification={currentCase.metrics.axisClassification}
      />

      {/* Post-Tutorial Case Completion Modal */}
      <CaseCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        currentCase={currentCase}
        nextCase={nextCase}
        onSelectNextCase={handleSelectNextCase}
        onGoToPractice={handleGoToPractice}
        onOpenFlowchart={() => {
          setIsCompletionModalOpen(false);
          setIsFlowchartOpen(true);
        }}
        onRestartCase={handleRestartCase}
        onOpenFeedback={() => {
          setIsAutomaticFeedbackPrompt(false);
          setIsFeedbackModalOpen(true);
        }}
      />

      {/* Clinical Pocket Cheat Sheet Modal (Buku Saku EKG) */}
      <ClinicalPocketCheatSheetModal
        isOpen={isPocketCheatSheetOpen}
        onClose={() => setIsPocketCheatSheetOpen(false)}
      />

      {/* Bedside Clinical Calculators Modal */}
      <ClinicalCalculatorsModal
        isOpen={isCalculatorsOpen}
        onClose={() => setIsCalculatorsOpen(false)}
        currentCase={currentCase}
      />

      {/* User Review & Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setShowFeedbackToast(false);
        }}
        isAutomaticPrompt={isAutomaticFeedbackPrompt}
      />

      {/* Non-Intrusive Floating Feedback Toast */}
      {showFeedbackToast && !isFeedbackModalOpen && (
        <div className="fixed bottom-4 right-4 z-40 bg-white border border-purple-300 shadow-xl rounded-xl p-3 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 max-w-sm text-xs text-stone-800">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 fill-purple-700" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-stone-900 leading-snug">{t.feedback.toastPrompt}</div>
            <div className="text-[11px] text-stone-500">{t.feedback.toastSubtext}</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setShowFeedbackToast(false);
                setIsAutomaticFeedbackPrompt(true);
                setIsFeedbackModalOpen(true);
              }}
              className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] rounded-md transition shadow-2xs cursor-pointer"
            >
              {t.feedback.toastBtn}
            </button>
            <button
              onClick={() => {
                setShowFeedbackToast(false);
                FeedbackStorage.setRemindLater();
              }}
              className="p-1 text-stone-400 hover:text-stone-700 rounded transition cursor-pointer"
              title={t.feedback.toastLaterTooltip}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome Onboarding & Persona Orientation Modal */}
      <WelcomeOnboardingModal
        isOpen={isWelcomeModalOpen}
        onClose={() => {
          OnboardingStorage.dismissOnboarding();
          setIsWelcomeModalOpen(false);
        }}
        onStartTour={(role) => {
          setAcademyMode('TUTORIAL');
          setStepIndex(0);
          OnboardingStorage.setRoleAndStartTour(role);
          setIsWelcomeModalOpen(false);
          setIsSpotlightTourOpen(true);
        }}
        onDismiss={() => {
          OnboardingStorage.dismissOnboarding();
          setIsWelcomeModalOpen(false);
        }}
      />

      {/* 5-Step Interactive Spotlight Coachmark Tour */}
      <InteractiveSpotlightTour
        isOpen={isSpotlightTourOpen}
        onClose={() => setIsSpotlightTourOpen(false)}
      />
    </div>
  );
};

export const ThalerAcademyView: React.FC<ThalerAcademyViewProps> = (props) => {
  return (
    <LocaleProvider>
      <ThalerAcademyInner {...props} />
    </LocaleProvider>
  );
};
