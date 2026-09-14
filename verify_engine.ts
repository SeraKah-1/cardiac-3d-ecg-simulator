/**
 * Empirical Verification Suite for 3D Cardiac Dipole & 12-Lead ECG Engine
 * Tests Biophysical Invariants, Einthoven Law, Physiological Voltage Scale (S = 0.05),
 * Lead-Off Detection & WCT Reference, Coronary Ischemia Vectors, and Diagnostic Rules.
 */

import { CardiacDipoleEngine } from './src/engine/biophysics/CardiacDipoleEngine';
import { LeadFieldModel } from './src/engine/biophysics/LeadFieldModel';
import { DiagnosticRuleEngine } from './src/engine/clinical/DiagnosticRuleEngine';
import { CLINICAL_PRESETS } from './src/engine/clinical/presets';

console.log('====================================================');
console.log('EMPIRICAL VERIFICATION OF CARDIAC ENGINE INVARIANTS');
console.log('====================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`[PASS] ${message}`);
    passedTests++;
  }
}

const leadModel = new LeadFieldModel();
const dipoleEngine = new CardiacDipoleEngine();
const defaultFactors = CLINICAL_PRESETS[0].factors;

// ---------------------------------------------------------------
// TEST 1: Einthoven Universal Invariant: V_I + V_III === V_II
// ---------------------------------------------------------------
let maxEinthovenError = 0;
for (let i = 0; i < 100; i++) {
  const phase = -Math.PI + (i / 100.0) * (2 * Math.PI);
  const dipole = dipoleEngine.evaluateDipole(phase, defaultFactors);
  const frame = leadModel.compute12Leads(dipole, phase, i * 10);

  const sumI_III = frame.leads.I + frame.leads.III;
  const leadII = frame.leads.II;
  const diff = Math.abs(sumI_III - leadII);
  if (diff > maxEinthovenError) maxEinthovenError = diff;
}
assert(maxEinthovenError < 1e-10, `Einthoven Law Identity (V_I + V_III == V_II) holds with max error ${maxEinthovenError.toExponential(3)} mV`);

// ---------------------------------------------------------------
// TEST 2: Physiological Voltage Calibration (S = 0.05)
// Lead II R-wave ~1.28 mV, P-wave ~0.15 mV, T-wave ~0.35 mV
// ---------------------------------------------------------------
const rDipole = dipoleEngine.evaluateDipole(0.0, defaultFactors);
const rFrame = leadModel.compute12Leads(rDipole, 0.0, 0);
const pDipole = dipoleEngine.evaluateDipole(-1.20, defaultFactors);
const pFrame = leadModel.compute12Leads(pDipole, -1.20, 0);
const tDipole = dipoleEngine.evaluateDipole(1.35, defaultFactors);
const tFrame = leadModel.compute12Leads(tDipole, 1.35, 0);

const isRPhysiological = Math.abs(rFrame.leads.II - 1.28) < 0.15;
const isPPhysiological = Math.abs(pFrame.leads.II - 0.15) < 0.05;
const isTPhysiological = Math.abs(tFrame.leads.II - 0.35) < 0.10;

assert(
  isRPhysiological && isPPhysiological && isTPhysiological,
  `Physiological voltage calibration (S = 0.05): Lead II R-wave = ${rFrame.leads.II.toFixed(2)} mV (~1.28 mV), P-wave = ${pFrame.leads.II.toFixed(2)} mV (~0.15 mV), T-wave = ${tFrame.leads.II.toFixed(2)} mV (~0.35 mV)`
);

// ---------------------------------------------------------------
// TEST 3: Electrode Relocation Invariance
// Even when electrodes are placed in arbitrary distorted coordinates,
// Einthoven Law must still hold identically.
// ---------------------------------------------------------------
leadModel.setElectrodePosition('RA', { x: 0.12, y: -0.45, z: 0.22 }, false);
leadModel.setElectrodePosition('LA', { x: -0.33, y: 0.15, z: -0.05 }, false);
leadModel.setElectrodePosition('LL', { x: 0.40, y: 0.60, z: -0.30 }, false);

let maxDistortedError = 0;
for (let i = 0; i < 50; i++) {
  const phase = -Math.PI + (i / 50.0) * (2 * Math.PI);
  const dipole = dipoleEngine.evaluateDipole(phase, defaultFactors);
  const frame = leadModel.compute12Leads(dipole, phase, i * 10);
  const diff = Math.abs(frame.leads.I + frame.leads.III - frame.leads.II);
  if (diff > maxDistortedError) maxDistortedError = diff;
}
assert(maxDistortedError < 1e-10, `Einthoven Law holds under arbitrary electrode dislocation (error: ${maxDistortedError.toExponential(3)} mV)`);
leadModel.resetToStandardPositions();

// ---------------------------------------------------------------
// TEST 4: Acute LAD Occlusion (Anterior STEMI)
// V2 ST elevation ~2.47 mV, V3 ST elevation ~2.29 mV
// ---------------------------------------------------------------
const ladFactors = { ...defaultFactors, ladStenosisPercent: 100, hsTroponinT: 5200 };
// Evaluate during ST segment plateau (phase ~ 0.65 rad)
const ladSTDipole = dipoleEngine.evaluateDipole(0.65, ladFactors);
const ladFrame = leadModel.compute12Leads(ladSTDipole, 0.65, 0);

assert(
  Math.abs(ladFrame.leads.V2 - 2.47) < 0.20 && ladFrame.leads.V3 > 1.5,
  `100% LAD occlusion produces physiological ST elevation in V2 (${ladFrame.leads.V2.toFixed(2)} mV, target ~2.47 mV) and V3 (${ladFrame.leads.V3.toFixed(2)} mV)`
);

// ---------------------------------------------------------------
// TEST 5: Acute LAD Reciprocal ST Depression
// ---------------------------------------------------------------
assert(ladFrame.leads.III < 0.0, `100% LAD occlusion produces reciprocal ST depression in inferior lead III (${ladFrame.leads.III.toFixed(2)} mV)`);

// ---------------------------------------------------------------
// TEST 6: Acute RCA Occlusion (Inferior STEMI)
// ---------------------------------------------------------------
const rcaFactors = { ...defaultFactors, rcaStenosisPercent: 100, hsTroponinT: 3400 };
const rcaSTDipole = dipoleEngine.evaluateDipole(0.65, rcaFactors);
const rcaFrame = leadModel.compute12Leads(rcaSTDipole, 0.65, 0);

assert(
  rcaFrame.leads.II > 0.15 && rcaFrame.leads.III > 0.20 && rcaFrame.leads.aVF > 0.20,
  `100% RCA occlusion produces physiological ST elevation in inferior leads II (${rcaFrame.leads.II.toFixed(2)} mV), III (${rcaFrame.leads.III.toFixed(2)} mV), and aVF (${rcaFrame.leads.aVF.toFixed(2)} mV)`
);

// ---------------------------------------------------------------
// TEST 7: Acute RCA Reciprocal ST Depression
// ---------------------------------------------------------------
assert(rcaFrame.leads.aVL < 0.0, `100% RCA occlusion produces reciprocal ST depression in lead aVL (${rcaFrame.leads.aVL.toFixed(2)} mV)`);

// ---------------------------------------------------------------
// TEST 8: Severe Hyperkalemia T-Wave Peaking
// ---------------------------------------------------------------
const normalTDipole = dipoleEngine.evaluateDipole(1.35, defaultFactors);
const normalTFrame = leadModel.compute12Leads(normalTDipole, 1.35, 0);

const hyperKFactors = { ...defaultFactors, serumPotassium: 7.8 };
const hyperKTDipole = dipoleEngine.evaluateDipole(1.35, hyperKFactors);
const hyperKTFrame = leadModel.compute12Leads(hyperKTDipole, 1.35, 0);

assert(
  hyperKTFrame.leads.V3 > normalTFrame.leads.V3 * 1.5,
  `Serum K+ 7.8 mmol/L amplifies T wave voltage in V3 from ${normalTFrame.leads.V3.toFixed(2)} mV to ${hyperKTFrame.leads.V3.toFixed(2)} mV (>1.5x)`
);

// ---------------------------------------------------------------
// TEST 9: Diagnostic Rule Engine STEMI Classification
// ---------------------------------------------------------------
const report = DiagnosticRuleEngine.evaluate({
  heartRate: 98,
  prIntervalMs: 155,
  qrsDurationMs: 86,
  qtIntervalMs: 380,
  qtcBazettMs: 420,
  qtcFridericiaMs: 405,
  stDeviationMv: ladFrame.leads,
  tWaveAmplitudeMv: ladFrame.leads,
  factors: ladFactors,
});

assert(
  report.urgencyLevel === 'Critical Cath Lab Alert' && report.culpritArtery?.includes('LAD') === true,
  `Diagnostic rule engine categorizes LAD STEMI as 'Critical Cath Lab Alert' with culprit artery: ${report.culpritArtery}`
);

// ---------------------------------------------------------------
// TEST 10: Troponin Gate: NSTEMI vs Unstable Angina
// ---------------------------------------------------------------
const ischemicSTDepression = {
  I: -0.08, II: -0.10, III: 0.0, aVR: 0.12, aVL: -0.06, aVF: -0.05,
  V1: 0.0, V2: -0.02, V3: -0.05, V4: -0.08, V5: -0.10, V6: -0.09
};

const nstemiReport = DiagnosticRuleEngine.evaluate({
  heartRate: 85,
  prIntervalMs: 160,
  qrsDurationMs: 88,
  qtIntervalMs: 390,
  qtcBazettMs: 430,
  qtcFridericiaMs: 415,
  stDeviationMv: ischemicSTDepression,
  tWaveAmplitudeMv: ischemicSTDepression,
  factors: { ...defaultFactors, hsTroponinT: 145 }, // Elevated Troponin > 14
});

const uaReport = DiagnosticRuleEngine.evaluate({
  heartRate: 85,
  prIntervalMs: 160,
  qrsDurationMs: 88,
  qtIntervalMs: 390,
  qtcBazettMs: 430,
  qtcFridericiaMs: 415,
  stDeviationMv: ischemicSTDepression,
  tWaveAmplitudeMv: ischemicSTDepression,
  factors: { ...defaultFactors, hsTroponinT: 8 }, // Normal Troponin <= 14
});

assert(
  nstemiReport.infarctionIschemia.includes('NSTEMI') && uaReport.infarctionIschemia.includes('Unstable Angina'),
  `Troponin Gate: Elevated Troponin (>14 ng/L) = NSTEMI ("${nstemiReport.infarctionIschemia}"); Normal Troponin (<=14 ng/L) = Unstable Angina ("${uaReport.infarctionIschemia}")`
);

// ---------------------------------------------------------------
// TEST 11: Lead-Off Detection & Biophysical Circuit Rules
// - Disconnecting RA invalidates WCT and precordial reference (leadOff: true)
// - Disconnecting RL injects 50 Hz powerline AC interference
// - Disconnecting V2 triggers LEAD OFF alert on V2 only
// ---------------------------------------------------------------
const unplacedRAPrec = leadModel.compute12Leads(rDipole, 0.0, 0, {
  ...leadModel.placed,
  RA: false, // Disconnected Right Arm
});

const unplacedRLFrame = leadModel.compute12Leads(rDipole, 0.0, 5, {
  ...leadModel.placed,
  RL: false, // Disconnected Ground / Driven Right Leg
});

const unplacedV2Frame = leadModel.compute12Leads(rDipole, 0.0, 0, {
  ...leadModel.placed,
  V2: false, // Disconnected V2 only
});

const isWctInvalidWhenRaOff = unplacedRAPrec.referenceLost === true && unplacedRAPrec.leadOffStatus.V1 === true && unplacedRAPrec.leadOffStatus.I === true;
const is50HzInjectedWhenRlOff = unplacedRLFrame.has50HzNoise === true;
const isV2OffIsolated = unplacedV2Frame.leadOffStatus.V2 === true && unplacedV2Frame.leadOffStatus.V1 === false && unplacedV2Frame.leadOffStatus.I === false;

assert(
  isWctInvalidWhenRaOff && is50HzInjectedWhenRlOff && isV2OffIsolated,
  `Lead-Off detection verified: Unplaced RA invalidates WCT and precordials; unplaced RL injects 50 Hz AC noise; unplaced V2 isolates lead-off to V2.`
);

// ---------------------------------------------------------------
// TEST 12: Atrial Fibrillation Dynamics (AFib f-waves)
// - Eliminates organized sinus P wave
// - Produces continuous micro-reentrant chaotic f-waves in V1 and Lead II
// ---------------------------------------------------------------
const afibPreset = CLINICAL_PRESETS.find((p) => p.id === 'afib_rvr')!;
const afibDipole = dipoleEngine.evaluateDipole(0.0, afibPreset.factors, 1.25);
const afibFrame = leadModel.compute12Leads(afibDipole, 0.0, 1250);
const afibFeatures = leadModel.computeAnalyticalFeatures(afibPreset.factors);
const afibReport = DiagnosticRuleEngine.evaluate({
  ...afibFeatures,
  heartRate: afibPreset.factors.heartRate,
  factors: afibPreset.factors,
});

assert(
  afibReport.triageCategory === 'yellow' &&
  afibReport.primaryHeadline.includes('Fibrilasi Atrium') &&
  Math.abs(afibFrame.leads.V1) > 0.01,
  `Atrial Fibrillation verified: Headline "${afibReport.primaryHeadline}", chaotic f-waves active in V1 (${afibFrame.leads.V1.toFixed(3)} mV).`
);

// ---------------------------------------------------------------
// TEST 13: Ventricular Fibrillation 3D Chaotic Rotor
// - Generates chaotic 3D wandering rotor without organized QRS/T
// - Triage Category RED, Critical Cath Lab Alert
// ---------------------------------------------------------------
const vfibPreset = CLINICAL_PRESETS.find((p) => p.id === 'vfib_cardiac_arrest')!;
const vfibDipole1 = dipoleEngine.evaluateDipole(0.0, vfibPreset.factors, 0.50);
const vfibDipole2 = dipoleEngine.evaluateDipole(0.0, vfibPreset.factors, 0.65);
const vfibFrame1 = leadModel.compute12Leads(vfibDipole1, 0.0, 500);
const vfibFrame2 = leadModel.compute12Leads(vfibDipole2, 0.0, 650);
const vfibFeatures = leadModel.computeAnalyticalFeatures(vfibPreset.factors);
const vfibReport = DiagnosticRuleEngine.evaluate({
  ...vfibFeatures,
  heartRate: 0,
  factors: vfibPreset.factors,
});

const vfibAmplitudesNonZero = Math.abs(vfibFrame1.leads.II) > 0.1 && Math.abs(vfibFrame2.leads.II) > 0.1;
const vfibIsChaoticDynamic = Math.abs(vfibFrame1.leads.II - vfibFrame2.leads.II) > 0.05;

assert(
  vfibReport.triageCategory === 'red' &&
  vfibReport.primaryHeadline.includes('Fibrilasi Ventrikel') &&
  vfibAmplitudesNonZero &&
  vfibIsChaoticDynamic,
  `Ventricular Fibrillation verified: Triage RED, Headline "${vfibReport.primaryHeadline}", chaotic 3D rotor active (Lead II: ${vfibFrame1.leads.II.toFixed(2)} mV -> ${vfibFrame2.leads.II.toFixed(2)} mV).`
);

// ---------------------------------------------------------------
// TEST 14: Asystole Ventricular Flatline
// - All leads strictly bounded within thermal noise (|V| < 0.03 mV)
// - Triage Category RED, Non-Shockable
// ---------------------------------------------------------------
const asystolePreset = CLINICAL_PRESETS.find((p) => p.id === 'asystole_flatline')!;
const asysDipole = dipoleEngine.evaluateDipole(0.0, asystolePreset.factors, 2.0);
const asysFrame = leadModel.compute12Leads(asysDipole, 0.0, 2000);
const asysFeatures = leadModel.computeAnalyticalFeatures(asystolePreset.factors);
const asysReport = DiagnosticRuleEngine.evaluate({
  ...asysFeatures,
  heartRate: 0,
  factors: asystolePreset.factors,
});

let maxAsystoleLead = 0;
for (const lead of Object.keys(asysFrame.leads) as (keyof typeof asysFrame.leads)[]) {
  const val = Math.abs(asysFrame.leads[lead]);
  if (val > maxAsystoleLead) maxAsystoleLead = val;
}

assert(
  asysReport.triageCategory === 'red' &&
  asysReport.primaryHeadline.includes('Asistol') &&
  maxAsystoleLead < 0.035,
  `Asystole flatline verified: Max lead potential = ${maxAsystoleLead.toFixed(4)} mV (< 0.035 mV), Headline "${asysReport.primaryHeadline}".`
);

// ---------------------------------------------------------------
// TEST 15: Complete 3rd-Degree AV Block (AV Dissociation)
// - Independent Atrial Sinus (75 bpm) & Ventricular Escape (35 bpm)
// - Triage Category RED, Wide QRS
// ---------------------------------------------------------------
const chbPreset = CLINICAL_PRESETS.find((p) => p.id === 'complete_heart_block')!;
const chbFeatures = leadModel.computeAnalyticalFeatures(chbPreset.factors);
const chbReport = DiagnosticRuleEngine.evaluate({
  ...chbFeatures,
  heartRate: chbPreset.factors.heartRate,
  factors: chbPreset.factors,
});

assert(
  chbReport.triageCategory === 'red' &&
  chbReport.primaryHeadline.includes('Total AV Block') &&
  chbFeatures.qrsDurationMs >= 130,
  `Complete Heart Block verified: Headline "${chbReport.primaryHeadline}", QRS duration = ${chbFeatures.qrsDurationMs} ms.`
);

// ---------------------------------------------------------------
// TEST 16: Monomorphic Ventricular Tachycardia (VTach)
// - Wide QRS (>120 ms), Northwest Electrical Axis
// ---------------------------------------------------------------
const vtPreset = CLINICAL_PRESETS.find((p) => p.id === 'ventricular_tachycardia')!;
const vtFeatures = leadModel.computeAnalyticalFeatures(vtPreset.factors);
const vtReport = DiagnosticRuleEngine.evaluate({
  ...vtFeatures,
  heartRate: vtPreset.factors.heartRate,
  factors: vtPreset.factors,
});

assert(
  vtReport.triageCategory === 'red' &&
  vtReport.primaryHeadline.includes('Takikardia Ventrikel') &&
  vtFeatures.qrsDurationMs >= 140,
  `Ventricular Tachycardia verified: Headline "${vtReport.primaryHeadline}", QRS duration = ${vtFeatures.qrsDurationMs} ms.`
);

// ---------------------------------------------------------------
// TEST 17: Torsades de Pointes 3D Precession Operator
// - Dynamic Rodrigues rotation operator continuously modulates dipole axis
// ---------------------------------------------------------------
const tdpPreset = CLINICAL_PRESETS.find((p) => p.id === 'torsades_de_pointes')!;
const tdpDipoleT0 = dipoleEngine.evaluateDipole(0.0, tdpPreset.factors, 0.0);
const tdpDipoleT1 = dipoleEngine.evaluateDipole(0.0, tdpPreset.factors, 1.0);
const tdpFrame0 = leadModel.compute12Leads(tdpDipoleT0, 0.0, 0);
const tdpFrame1 = leadModel.compute12Leads(tdpDipoleT1, 0.0, 1000);
const tdpFeatures = leadModel.computeAnalyticalFeatures(tdpPreset.factors);
const tdpReport = DiagnosticRuleEngine.evaluate({
  ...tdpFeatures,
  heartRate: tdpPreset.factors.heartRate,
  factors: tdpPreset.factors,
});

const isPrecessing = Math.abs(tdpFrame0.leads.V1 - tdpFrame1.leads.V1) > 0.05;

assert(
  tdpReport.triageCategory === 'red' &&
  tdpReport.primaryHeadline.includes('Torsades de Pointes') &&
  isPrecessing,
  `Torsades de Pointes verified: Headline "${tdpReport.primaryHeadline}", 3D axis precession active in V1 (${tdpFrame0.leads.V1.toFixed(2)} mV -> ${tdpFrame1.leads.V1.toFixed(2)} mV).`
);

// ---------------------------------------------------------------
// TEST 18: Diagnostic Stability (Zero Polling Flicker Invariant)
// - Re-evaluating analytical features 100 times produces identical headlines
// ---------------------------------------------------------------
let headlineFlickers = 0;
const baselineHeadline = leadModel.computeAnalyticalFeatures(defaultFactors);
const refReport = DiagnosticRuleEngine.evaluate({
  ...baselineHeadline,
  heartRate: defaultFactors.heartRate,
  factors: defaultFactors,
});

for (let i = 0; i < 100; i++) {
  const testFeatures = leadModel.computeAnalyticalFeatures(defaultFactors);
  const testReport = DiagnosticRuleEngine.evaluate({
    ...testFeatures,
    heartRate: defaultFactors.heartRate,
    factors: defaultFactors,
  });

  if (testReport.primaryHeadline !== refReport.primaryHeadline) {
    headlineFlickers++;
  }
}

assert(
  headlineFlickers === 0,
  `Diagnostic stability verified: Exactly 0 flickers across 100 evaluations (100% deterministic closed-form ST features).`
);

console.log('====================================================');
console.log(`ALL ${passedTests}/${totalTests} EMPIRICAL VERIFICATION TESTS PASSED (EXIT CODE 0)`);
console.log('====================================================');
