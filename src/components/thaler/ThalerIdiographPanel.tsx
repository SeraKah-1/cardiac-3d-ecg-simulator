/**
 * ThalerIdiographPanel: Swiss Clinical Editorial Reasoning Panel
 * Replaces stacked dashboard boxes with calm, high-contrast clinical typography.
 * Follows the 2-Second Rule: clear actionable guidance without cognitive overload.
 * Features Visual Exemplar System (inline cards + modal atlas),
 * collapsible measurement inspector, and deep electrophysiology details.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useState, useMemo } from 'react';
import { Layers, Compass, Award } from 'lucide-react';
import { EKGCase, TutorialStep } from '../../engine/clinical/thaler/thalerTypes';
import { ClinicalFormula } from '../ui/ClinicalFormula';
import { useLocale } from '../../locales/useLocale';
import { THALER_VISUAL_EXEMPLAR_GROUPS } from '../../engine/clinical/thaler/thalerExemplarData';
import { getLocalizedExemplarGroups } from '../../engine/clinical/thaler/thalerLocalization';
import { VisualExemplarInlineCard } from './VisualExemplarInlineCard';
import { VisualExemplarModal } from './VisualExemplarModal';
import { AxisQuadrantWheel } from './AxisQuadrantWheel';

interface ThalerIdiographPanelProps {
  currentCase: EKGCase;
  currentStepIndex: number;
  totalSteps: number;
  activeStep: TutorialStep;
  isCaliperActive: boolean;
  onSelectStep: (stepIndex: number) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onToggleCaliper: () => void;
  onResetZoom: () => void;
  onOpenFlowchart?: () => void;
  onOpenAtlas?: (groupId: string) => void;
  onCompleteCase?: () => void;
  onOpenLeadTerritory?: () => void;
  onOpenAxisWheel?: () => void;
}

export const ThalerIdiographPanel: React.FC<ThalerIdiographPanelProps> = ({
  currentCase,
  currentStepIndex,
  totalSteps,
  activeStep,
  isCaliperActive,
  onNextStep,
  onPrevStep,
  onToggleCaliper,
  onResetZoom,
  onOpenFlowchart,
  onOpenAtlas,
  onCompleteCase,
  onOpenLeadTerritory,
  onOpenAxisWheel,
}) => {
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
  const [isMechanismOpen, setIsMechanismOpen] = useState(false);
  const [isAtlasModalOpen, setIsAtlasModalOpen] = useState(false);
  const [atlasGroupId, setAtlasGroupId] = useState<string>('INFARCTION_ST_T');
  const [showInlineAxisWheel, setShowInlineAxisWheel] = useState(false);
  const { t, locale } = useLocale();

  // Status badge
  const getStatusBadge = () => {
    switch (activeStep.triageStatus) {
      case 'NORMAL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {t.triage.statusNormal}
          </span>
        );
      case 'ABNORMAL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            {t.triage.statusAbnormal}
          </span>
        );
      case 'NEUTRAL':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            {t.triage.statusVariant}
          </span>
        );
      }
  };

  const hasMeasurementDetails =
    Boolean(activeStep.inSituAnnotation) ||
    Boolean(activeStep.latexFormula) ||
    Boolean(activeStep.relevantFormula);

  const localizedExemplarGroups = useMemo(() => {
    return getLocalizedExemplarGroups(THALER_VISUAL_EXEMPLAR_GROUPS, locale);
  }, [locale]);

  // Match the active step to an exemplar group (explicit ID first, then resilient fallback)
  const matchedExemplarGroup = useMemo(() => {
    if (activeStep.exemplarGroupId) {
      const explicit = localizedExemplarGroups.find((g) => g.id === activeStep.exemplarGroupId);
      if (explicit) return explicit;
    }

    const name = ((activeStep.stepName || '') + ' ' + (activeStep.stepNameEn || '')).toLowerCase();
    const title = ((activeStep.clinicalFindingTitle || '') + ' ' + (activeStep.clinicalFindingTitleEn || '')).toLowerCase();

    if (name.includes('aksis') || title.includes('aksis') || name.includes('axis')) {
      return localizedExemplarGroups.find((g) => g.id === 'AXIS');
    }
    if (
      name.includes('irama') ||
      title.includes('irama') ||
      name.includes('rhythm') ||
      title.includes('fibrilasi') ||
      title.includes('fibrillation') ||
      title.includes('flutter')
    ) {
      return localizedExemplarGroups.find((g) => g.id === 'RHYTHM');
    }
    if (name.includes('interval') || title.includes('interval') || title.includes('blok av') || title.includes('av block')) {
      return localizedExemplarGroups.find((g) => g.id === 'CONDUCTION_AV_BLOCK');
    }
    if (name.includes('blok') || name.includes('block') || title.includes('rbbb') || title.includes('lbbb') || title.includes('berkas') || title.includes('bundle')) {
      return localizedExemplarGroups.find((g) => g.id === 'CONDUCTION_BBB');
    }
    if (name.includes('hipertrofi') || name.includes('hypertrophy') || title.includes('lvh') || title.includes('rvh') || title.includes('strain')) {
      return localizedExemplarGroups.find((g) => g.id === 'HYPERTROPHY_VENTRICULAR');
    }
    if (title.includes('kalium') || title.includes('potassium') || title.includes('elektrolit') || title.includes('electrolyte') || title.includes('tented')) {
      return localizedExemplarGroups.find((g) => g.id === 'ELECTROLYTES');
    }
    // Default to ST segment / Infarction group
    return localizedExemplarGroups.find((g) => g.id === 'INFARCTION_ST_T');
  }, [activeStep, localizedExemplarGroups]);

  // Determine if active step relates to electrical axis analysis
  const isAxisFinding = useMemo(() => {
    const name = (activeStep.stepName || '').toLowerCase();
    const title = (activeStep.clinicalFindingTitle || '').toLowerCase();
    return (
      (matchedExemplarGroup && matchedExemplarGroup.id === 'AXIS') ||
      name.includes('aksis') ||
      name.includes('axis') ||
      title.includes('aksis') ||
      title.includes('axis') ||
      activeStep.inSituAnnotation?.type === 'AXIS_VECTOR'
    );
  }, [matchedExemplarGroup, activeStep]);

  const handleOpenAtlas = (groupId: string) => {
    if (onOpenAtlas) {
      onOpenAtlas(groupId);
    } else {
      setAtlasGroupId(groupId);
      setIsAtlasModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-stone-200 rounded-md text-stone-800 select-none overflow-hidden font-sans shadow-xs">
      {/* 1. Header: Patient Telemetry Strip */}
      <div className="p-3 bg-stone-50 border-b border-stone-200 shrink-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-mono text-stone-500 font-bold tracking-wider text-[11px]">
            {currentCase.caseCode}
          </span>
          <div className="font-mono text-[11px] text-stone-600">
            {currentCase.patient.gender === 'Male' ? t.telemetry.genderMale : t.telemetry.genderFemale}, {currentCase.patient.age} {t.common.yearsOld} | {t.telemetry.bloodPressure}: {currentCase.patient.vitalSigns.bloodPressure}
          </div>
        </div>
        <h2 className="text-sm font-bold text-stone-900 leading-snug line-clamp-1">
          {currentCase.title}
        </h2>
        <p className="text-xs text-stone-500 line-clamp-1 mt-0.5 italic">
          "{currentCase.patient.chiefComplaint}"
        </p>
      </div>

      {/* 2. Main Clinical Guidance Stage (Calm Typography, Visual-First Layout) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Step Indicator & Finding Title */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-blue-700 uppercase tracking-wide">
              {activeStep.stepName}
            </span>
            {getStatusBadge()}
          </div>
          <h3 className="text-base font-bold text-stone-900 leading-snug">
            {activeStep.clinicalFindingTitle}
          </h3>
          {activeStep.cameraTarget.focusLeads.length > 0 && !activeStep.cameraTarget.focusLeads.includes('CALIBRATION_PULSE') && (
            <div className="mt-1.5 flex items-center space-x-1.5 text-xs text-stone-500">
              <span className="font-medium">{t.telemetry.leadFocus}:</span>
              <span className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-800 font-mono font-bold text-[11px] border border-stone-200">
                {activeStep.cameraTarget.focusLeads.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Visual Exemplar Inline Card: Replaces walls of text with direct visual contrast */}
        {matchedExemplarGroup && (
          <VisualExemplarInlineCard
            group={matchedExemplarGroup}
            currentCaseTriageStatus={activeStep.triageStatus}
            activeFindingTitle={activeStep.clinicalFindingTitle}
            onOpenFullComparison={handleOpenAtlas}
          />
        )}

        {/* Dynamic Axis Quadrant Wheel: Auto-render on Axis steps or when user toggles */}
        {(isAxisFinding || showInlineAxisWheel) && (
          <div className="pt-1">
            <AxisQuadrantWheel
              axisDegrees={currentCase.metrics.axisDegrees}
              axisClassification={currentCase.metrics.axisClassification}
              compact={true}
            />
          </div>
        )}

        {/* Quick Clinical Guidance Utilities: Lead Orientation & Axis Wheel */}
        <div className="flex items-center gap-2 pt-1 border-t border-stone-100 text-xs">
          {onOpenLeadTerritory && (
            <button
              onClick={onOpenLeadTerritory}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-50/80 hover:bg-amber-100 text-amber-900 rounded border border-amber-200 transition cursor-pointer text-[11px] font-semibold"
              title={t.common.leadTerritoryTooltip}
            >
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>{t.common.leadTerritoryBtn}</span>
            </button>
          )}

          {!isAxisFinding && (
            <button
              onClick={() => setShowInlineAxisWheel(!showInlineAxisWheel)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-purple-50/80 hover:bg-purple-100 text-purple-900 rounded border border-purple-200 transition cursor-pointer text-[11px] font-semibold"
              title={t.common.axisTooltip}
            >
              <Compass className="w-3.5 h-3.5 text-purple-700" />
              <span>{showInlineAxisWheel ? t.common.closeDetails : t.common.axisBtn}</span>
            </button>
          )}
        </div>

        {/* Action Directives: Clean Guidance */}
        <div className="space-y-2 pt-1 border-t border-stone-100">
          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
            {t.common.level1Directive}
          </h4>
          <ul className="space-y-2 text-xs sm:text-[13px] text-stone-700 leading-relaxed">
            {activeStep.plainInstructions.map((instruction, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold mt-0.5 text-sm leading-none">&bull;</span>
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Clinical Tip / Thaler Pearl */}
        <div className="border-l-2 border-amber-500 bg-amber-50/50 pl-3 py-2 pr-2.5 rounded-r text-xs text-amber-950">
          <div className="font-mono text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
            {t.common.clinicalTip}
          </div>
          <p className="font-sans text-[12px] leading-relaxed text-amber-900">
            {activeStep.clinicalTip || activeStep.thalerRuleQuote}
          </p>
        </div>

        {/* Optional Collapsible Measurement Inspector */}
        {hasMeasurementDetails && (
          <div className="border border-stone-200 rounded-md bg-stone-50/60 overflow-hidden">
            <button
              onClick={() => setIsMeasurementOpen(!isMeasurementOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-sans font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>{t.common.measurementDetails}</span>
              </span>
              <span className="text-stone-400 text-xs font-mono">
                {isMeasurementOpen ? t.common.closeDetails : t.common.openDetails}
              </span>
            </button>

            {isMeasurementOpen && (
              <div className="p-3 border-t border-stone-200 text-xs bg-white space-y-2">
                {activeStep.inSituAnnotation && (
                  activeStep.inSituAnnotation.smallBoxesCount !== undefined ||
                  activeStep.inSituAnnotation.largeBoxesCount !== undefined ||
                  activeStep.inSituAnnotation.durationSec !== undefined ||
                  activeStep.inSituAnnotation.voltageMv !== undefined
                ) && (
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px] p-2 bg-stone-50 rounded border border-stone-200">
                    {activeStep.inSituAnnotation.smallBoxesCount !== undefined && (
                      <div>
                        <span className="text-stone-600 font-medium text-[11px] block">{t.telemetry.smallBoxUnit}</span>
                        <strong className="text-stone-800">{t.common.unitBoxes(activeStep.inSituAnnotation.smallBoxesCount)}</strong>
                      </div>
                    )}
                    {activeStep.inSituAnnotation.largeBoxesCount !== undefined && (
                      <div>
                        <span className="text-stone-600 font-medium text-[11px] block">{t.telemetry.largeBoxUnit}</span>
                        <strong className="text-stone-800">{t.common.unitBoxes(activeStep.inSituAnnotation.largeBoxesCount)}</strong>
                      </div>
                    )}
                    {activeStep.inSituAnnotation.durationSec !== undefined && (
                      <div>
                        <span className="text-stone-600 font-medium text-[11px] block">{t.common.duration}</span>
                        <strong className="text-emerald-700">{Math.round(activeStep.inSituAnnotation.durationSec * 1000)} ms</strong>
                      </div>
                    )}
                    {activeStep.inSituAnnotation.voltageMv !== undefined && (
                      <div>
                        <span className="text-stone-600 font-medium text-[11px] block">{t.common.voltage}</span>
                        <strong className="text-blue-700">{activeStep.inSituAnnotation.voltageMv.toFixed(2)} mV</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Clinical Calculation String from Caliper Map */}
                {activeStep.inSituAnnotation?.calculationFormula && (
                  <div className="p-2 bg-blue-50/70 rounded border border-blue-200 text-blue-950 font-mono text-xs text-center leading-relaxed">
                    <span className="text-[10px] text-blue-700 block font-sans font-bold uppercase tracking-wider mb-0.5">
                      {t.common.caliperCalculation}
                    </span>
                    {activeStep.inSituAnnotation.calculationFormula}
                  </div>
                )}

                {/* KaTeX LaTeX Formula or Monospace Fallback */}
                {(activeStep.latexFormula || activeStep.inSituAnnotation?.latexFormula) ? (
                  <div className="text-center py-2 px-3 bg-stone-50/90 rounded border border-stone-200 overflow-x-auto">
                    <span className="text-[10px] text-stone-500 block font-sans font-semibold uppercase tracking-wider mb-1">
                      {t.common.standardFormula}
                    </span>
                    <ClinicalFormula
                      tex={activeStep.latexFormula || activeStep.inSituAnnotation?.latexFormula || ''}
                      displayMode={true}
                    />
                  </div>
                ) : (
                  activeStep.relevantFormula && (
                    <div className="font-mono text-xs text-stone-700 text-center py-1.5 px-2 bg-stone-50 rounded border border-stone-200">
                      {activeStep.relevantFormula}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Optional Collapsible Biological Mechanism */}
        {activeStep.deepMechanismDetails && (
          <div className="border border-stone-200 rounded-md bg-stone-50/60 overflow-hidden">
            <button
              onClick={() => setIsMechanismOpen(!isMechanismOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-sans font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                <span>{t.common.biologicalMechanism}</span>
              </span>
              <span className="text-stone-400 text-xs font-mono">
                {isMechanismOpen ? (locale === 'en' ? 'Close ▲' : 'Tutup ▲') : (locale === 'en' ? 'Open ▼' : 'Buka ▼')}
              </span>
            </button>

            {isMechanismOpen && (
              <div className="p-3 border-t border-stone-200 text-xs bg-white text-stone-700 leading-relaxed space-y-2">
                <p>{activeStep.deepMechanismDetails}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Bottom Tool & Step Navigation Bar */}
      <div className="p-3 bg-stone-50 border-t border-stone-200 shrink-0 space-y-2">
        {/* Caliper toggle button */}
        <div className="flex items-center justify-between">
          <button
            onClick={onToggleCaliper}
            className={`px-3 py-1.5 text-xs font-sans font-medium rounded transition cursor-pointer flex items-center space-x-1.5 ${
              isCaliperActive
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 shadow-2xs'
            }`}
          >
            <span>{isCaliperActive ? '✓ ' + t.common.caliperActive : t.common.inspectCaliper}</span>
          </button>

          <button
            onClick={onResetZoom}
            className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 text-xs font-sans rounded border border-stone-300 shadow-2xs transition cursor-pointer"
            title={t.common.resetZoom}
          >
            {t.common.zoomFull}
          </button>
        </div>

        {/* Onboarding Guidance for Step 0 (First Time Users) */}
        {currentStepIndex === 0 && (
          <div className="bg-blue-50/70 border border-blue-200 rounded p-2 text-[11px] text-blue-900 flex items-center justify-between">
            <span>{t.common.interactiveGuideBanner}</span>
          </div>
        )}

        {/* Completion Guidance Banner for Final Step */}
        {currentStepIndex >= totalSteps - 1 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-semibold text-[11px]">{t.common.allStepsCompleted}</span>
            </div>
            {onCompleteCase && (
              <button
                onClick={onCompleteCase}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[11px] transition cursor-pointer shadow-2xs shrink-0"
              >
                {t.common.nextStep}
              </button>
            )}
          </div>
        )}

        {/* Step Pager [Prev | Step X of Y | Next / Complete] */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-200">
          <button
            onClick={onPrevStep}
            disabled={currentStepIndex === 0}
            className={`px-3 py-1.5 text-xs font-sans font-semibold rounded border transition cursor-pointer ${
              currentStepIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-stone-100 border-stone-200 text-stone-400'
                : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300 shadow-2xs'
            }`}
          >
            &larr; {t.common.previous}
          </button>

          <span className="text-xs font-mono font-bold text-stone-600">
            {t.common.stepCounter(currentStepIndex + 1, totalSteps)}
          </span>

          {currentStepIndex >= totalSteps - 1 ? (
            <button
              onClick={onCompleteCase}
              className="px-3.5 py-1.5 text-xs font-sans font-bold rounded border transition cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs flex items-center gap-1 animate-pulse"
            >
              <span>{t.common.completeCase}</span>
            </button>
          ) : (
            <button
              onClick={onNextStep}
              disabled={currentStepIndex >= totalSteps - 1}
              className="px-3 py-1.5 text-xs font-sans font-semibold rounded border transition cursor-pointer bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-xs"
            >
              {t.common.next} &rarr;
            </button>
          )}
        </div>
      </div>

      {/* 4. Full Visual Exemplar Modal (Fallback when parent does not control modal) */}
      {!onOpenAtlas && (
        <VisualExemplarModal
          isOpen={isAtlasModalOpen}
          onClose={() => setIsAtlasModalOpen(false)}
          initialGroupId={atlasGroupId}
          activeCaseFindingId={matchedExemplarGroup?.exemplars[0]?.id}
        />
      )}
    </div>
  );
};
