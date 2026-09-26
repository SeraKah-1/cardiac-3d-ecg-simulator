/**
 * Thaler Clinical Content Localization Engine
 * Provides pure functional projection of clinical datasets between Indonesian (id) and English (en).
 * Grounded in Dr. Malcolm S. Thaler's clinical curriculum.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import { Locale } from '../../../locales/types';
import { EKGCase, TutorialStep, InSituCaliperAnnotation } from './thalerTypes';
import { FlowchartStage } from './thalerFlowchartData';
import { VisualExemplarGroup } from './thalerExemplarTypes';

/**
 * Returns a localized projection of InSituCaliperAnnotation.
 */
export function getLocalizedCaliper(
  caliper: InSituCaliperAnnotation,
  locale: Locale
): InSituCaliperAnnotation {
  if (locale !== 'en') return caliper;
  return {
    ...caliper,
    label: caliper.labelEn || caliper.label,
    calculationFormula: caliper.calculationFormulaEn || caliper.calculationFormula,
    detailExplanation: caliper.detailExplanationEn || caliper.detailExplanation,
  };
}

/**
 * Returns a localized projection of TutorialStep.
 */
export function getLocalizedStep(step: TutorialStep, locale: Locale): TutorialStep {
  if (locale !== 'en') return step;
  return {
    ...step,
    stepName: step.stepNameEn || step.stepName,
    clinicalFindingTitle: step.clinicalFindingTitleEn || step.clinicalFindingTitle,
    plainInstructions: step.plainInstructionsEn || step.plainInstructions,
    clinicalTip: step.clinicalTipEn || step.clinicalTip,
    thalerRuleQuote: step.thalerRuleQuoteEn || step.thalerRuleQuote,
    deepMechanismDetails: step.deepMechanismDetailsEn || step.deepMechanismDetails,
    relevantFormula: step.relevantFormulaEn || step.relevantFormula,
    inSituAnnotation: step.inSituAnnotation ? getLocalizedCaliper(step.inSituAnnotation, locale) : undefined,
    highlightBoxes: step.highlightBoxes.map((b) => ({
      ...b,
      label: b.labelEn || (b.label ? translateBoxLabel(b.label) : b.label),
    })),
  };
}

function translateBoxLabel(rawLabel: string): string {
  let l = rawLabel;
  l = l.replace(/Sadapan Inferior/g, 'Inferior Leads');
  l = l.replace(/Sadapan Lateral/g, 'Lateral Leads');
  l = l.replace(/Sadapan Prekordial Anterior/g, 'Anterior Precordial Leads');
  l = l.replace(/Sadapan Prekordial/g, 'Precordial Leads');
  l = l.replace(/Sadapan Ekstremitas/g, 'Limb Leads');
  l = l.replace(/Sadapan aVR/g, 'Lead aVR');
  l = l.replace(/Sadapan/g, 'Lead');
  l = l.replace(/Lead II Ritme/g, 'Lead II Rhythm Strip');
  l = l.replace(/Gelombang P/g, 'P Wave');
  l = l.replace(/Interval PR/g, 'PR Interval');
  l = l.replace(/Kompleks QRS/g, 'QRS Complex');
  l = l.replace(/Segmen ST/g, 'ST Segment');
  l = l.replace(/Gelombang T/g, 'T Wave');
  l = l.replace(/Gelombang U/g, 'U Wave');
  l = l.replace(/Pulsa Kalibrasi/g, 'Calibration Pulse');
  l = l.replace(/Kaidah R-R/g, 'R-R Rule');
  l = l.replace(/Kotak Besar/g, 'Large Boxes');
  l = l.replace(/Kotak Kecil/g, 'Small Boxes');
  l = l.replace(/Progresi R Normal/g, 'Normal R Progression');
  return l;
}

/**
 * Returns a localized projection of EKGCase.
 */
export function getLocalizedCase(caseData: EKGCase, locale: Locale): EKGCase {
  if (locale !== 'en') return caseData;
  return {
    ...caseData,
    title: caseData.titleEn || (caseData.medicalTermEn ? caseData.medicalTermEn : caseData.title),
    patient: {
      ...caseData.patient,
      chiefComplaint: caseData.patient.chiefComplaintEn || caseData.patient.chiefComplaint,
    },
    metrics: {
      ...caseData.metrics,
      rhythmDescription: caseData.metrics.rhythmDescriptionEn || caseData.metrics.rhythmDescription,
    },
    tutorialSteps: caseData.tutorialSteps.map((s) => getLocalizedStep(s, locale)),
  };
}

/**
 * Returns a localized projection of FlowchartStages.
 */
export function getLocalizedFlowchartStages(
  stages: FlowchartStage[],
  locale: Locale
): FlowchartStage[] {
  if (locale !== 'en') return stages;
  return stages.map((stage) => ({
    ...stage,
    stageName: stage.stageNameEn || stage.stageName,
    subtitle: stage.subtitleEn || stage.subtitle,
    clinicalObjective: stage.clinicalObjectiveEn || stage.clinicalObjective,
    nodes: stage.nodes.map((node) => ({
      ...node,
      stepBadge: node.stepBadgeEn || node.stepBadge,
      questionTitle: node.questionTitleEn || node.questionTitle,
      clinicalDirective: node.clinicalDirectiveEn || node.clinicalDirective,
      branches: node.branches.map((branch) => ({
        ...branch,
        label: branch.labelEn || branch.label,
        condition: branch.conditionEn || branch.condition,
        finding: branch.findingEn || branch.finding,
        diagnosticOutcome: branch.diagnosticOutcomeEn || branch.diagnosticOutcome,
      })),
    })),
  }));
}

/**
 * Returns a localized projection of VisualExemplarGroups.
 */
export function getLocalizedExemplarGroups(
  groups: VisualExemplarGroup[],
  locale: Locale
): VisualExemplarGroup[] {
  if (locale !== 'en') return groups;
  return groups.map((g) => ({
    ...g,
    groupTitle: g.groupTitleEn || g.groupTitle,
    groupSubtitle: g.groupSubtitleEn || g.groupSubtitle,
    exemplars: g.exemplars.map((item) => ({
      ...item,
      title: item.titleEn || item.medicalTermEn || item.title,
      badgeLabel:
        item.badgeLabelEn ||
        (item.triageType === 'NORMAL'
          ? 'Normal'
          : item.triageType === 'VARIANT'
          ? 'Variant'
          : 'Pathology'),
      visualClue: item.visualClueEn || item.visualClue,
      clinicalSignificance: item.clinicalSignificanceEn || item.clinicalSignificance,
      diagnosticCriteria: item.diagnosticCriteriaEn || item.diagnosticCriteria,
      calloutMarker: item.calloutMarker
        ? {
            ...item.calloutMarker,
            label: item.calloutMarker.labelEn || item.calloutMarker.label,
          }
        : undefined,
    })),
  }));
}
