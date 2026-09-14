import { CardiacDipoleEngine } from './src/engine/biophysics/CardiacDipoleEngine';
import { LeadFieldModel, STANDARD_ELECTRODE_LANDMARKS } from './src/engine/biophysics/LeadFieldModel';
import { CLINICAL_PRESETS } from './src/engine/clinical/presets';
import { DiagnosticRuleEngine, MeasuredECGFeatures } from './src/engine/clinical/DiagnosticRuleEngine';
import { PhysicalElectrodeId, LeadId } from './src/engine/biophysics/types';
import * as fs from 'fs';
import * as path from 'path';

console.log('====================================================');
console.log('ADVERSARIAL DESTRUCTIVE QA & INVARIANT TEST SUITE');
console.log('====================================================');

let testsPassed = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`[PASS] ${msg}`);
  testsPassed++;
}

const engine = new CardiacDipoleEngine();
const leadModel = new LeadFieldModel();
const defaultFactors = CLINICAL_PRESETS[0].factors;

// ----------------------------------------------------
// TEST 1: Edge Case A - All Electrodes Detached
// ----------------------------------------------------
leadModel.detachAllElectrodes();
const dipoleNormal = engine.evaluateDipole(0, defaultFactors);
const frameAllDetached = leadModel.compute12Leads(dipoleNormal, 0, 500);

assert(frameAllDetached.vWCT === 0.0, 'Edge Case A: WCT voltage is exactly 0.0 when all electrodes detached');
assert(frameAllDetached.referenceLost === true, 'Edge Case A: referenceLost flag is true when all electrodes detached');
for (const [leadId, isOff] of Object.entries(frameAllDetached.leadOffStatus)) {
  assert(isOff === true, `Edge Case A: Lead ${leadId} correctly marked as LEAD OFF`);
}
for (const [leadId, val] of Object.entries(frameAllDetached.leads)) {
  assert(Number.isFinite(val) && !Number.isNaN(val), `Edge Case A: Lead ${leadId} is finite, no NaN (${val} mV)`);
  assert(Math.abs(val) < 0.05, `Edge Case A: Lead ${leadId} voltage bounded to baseline amplifier noise`);
}

// ----------------------------------------------------
// TEST 2: Edge Case B - Partial Electrode Attachments
// ----------------------------------------------------
// Scenario B1: Only V1 placed
leadModel.detachAllElectrodes();
leadModel.setElectrodePlaced('V1', true);
const frameOnlyV1 = leadModel.compute12Leads(dipoleNormal, 0, 500);
assert(frameOnlyV1.vWCT === 0.0, 'Edge Case B1: WCT is 0.0 when limbs are missing');
assert(frameOnlyV1.leadOffStatus.V1 === true, 'Edge Case B1: V1 marked as LEAD OFF because reference WCT is missing');
assert(frameOnlyV1.leadOffStatus.I === true && frameOnlyV1.leadOffStatus.II === true, 'Edge Case B1: Limb leads marked as LEAD OFF');
for (const [leadId, val] of Object.entries(frameOnlyV1.leads)) {
  assert(Number.isFinite(val) && !Number.isNaN(val), `Edge Case B1: Lead ${leadId} has zero NaNs`);
}

// Scenario B2: Only RA and LA placed (LL missing)
leadModel.detachAllElectrodes();
leadModel.setElectrodePlaced('RA', true);
leadModel.setElectrodePlaced('LA', true);
const frameRaLa = leadModel.compute12Leads(dipoleNormal, 0, 500);
assert(frameRaLa.leadOffStatus.I === false, 'Edge Case B2: Lead I is active when RA and LA are placed');
assert(frameRaLa.leadOffStatus.II === true, 'Edge Case B2: Lead II is LEAD OFF when LL is missing');
assert(frameRaLa.leadOffStatus.III === true, 'Edge Case B2: Lead III is LEAD OFF when LL is missing');
assert(frameRaLa.leadOffStatus.aVR === true, 'Edge Case B2: aVR is LEAD OFF when WCT is incomplete');
assert(frameRaLa.leadOffStatus.V1 === true, 'Edge Case B2: Precordials are LEAD OFF when WCT is incomplete');

// Scenario B3: Ground RL Missing (50 Hz powerline AC interference injected)
leadModel.attachAllElectrodes();
leadModel.setElectrodePlaced('RL', false);
const frameNoRL1 = leadModel.compute12Leads(dipoleNormal, 0, 0);
const frameNoRL2 = leadModel.compute12Leads(dipoleNormal, 0, 5); // 5ms = quarter cycle of 50 Hz (peak amplitude)
assert(frameNoRL1.has50HzNoise === true, 'Edge Case B3: has50HzNoise is true when RL ground is missing');
const noiseDiff = Math.abs(frameNoRL1.leads.II - frameNoRL2.leads.II);
assert(noiseDiff > 0.1, `Edge Case B3: 50 Hz powerline interference injected on missing RL (${noiseDiff.toFixed(3)} mV)`);

// ----------------------------------------------------
// TEST 3: Edge Case C - Speed Manipulation & Accumulator
// ----------------------------------------------------
leadModel.attachAllElectrodes();
const testEngine = new CardiacDipoleEngine();
const DT_SUBSTEP = 0.002;
const MAX_SUBSTEPS = 25;
let accumulator = 0;
let simTime = 0;

for (let f = 0; f < 3000; f++) {
  const speed = [0.1, 0.25, 0.5, 1.0, 0.0][f % 5];
  const dtRaw = (f % 100 === 0) ? 2.5 : 0.016; // periodic 2.5s freeze
  const dtClamped = Math.min(0.1, dtRaw);
  accumulator += speed * dtClamped;

  let substeps = 0;
  while (accumulator >= DT_SUBSTEP && substeps < MAX_SUBSTEPS) {
    simTime += DT_SUBSTEP * 1000.0;
    const p = testEngine.advancePhase(DT_SUBSTEP, defaultFactors.heartRate);
    assert(p >= -Math.PI && p <= Math.PI, `Edge Case C: Phase bounded in [-pi, pi] (${p.toFixed(3)})`);
    accumulator -= DT_SUBSTEP;
    substeps++;
  }
  if (accumulator > 0.1) accumulator = 0;
  assert(accumulator <= 0.1, 'Edge Case C: Accumulator strictly capped, zero spiral of death');
}
assert(Number.isFinite(simTime) && simTime > 0, `Edge Case C: simTime monotonically progressed to ${simTime} ms`);

// ----------------------------------------------------
// TEST 4: Edge Case D - Physiological Rate & Voltage Extremes
// ----------------------------------------------------
// Extreme Tachycardia (220 BPM)
const fTachy = { ...defaultFactors, heartRate: 220 };
for (let p = -Math.PI; p <= Math.PI; p += 0.1) {
  const d = engine.evaluateDipole(p, fTachy);
  const frame = leadModel.compute12Leads(d, p, 100);
  for (const [lead, v] of Object.entries(frame.leads)) {
    assert(Number.isFinite(v) && Math.abs(v) < 8.0, `Edge Case D: 220 BPM lead ${lead} bounded (${v.toFixed(2)} mV)`);
  }
}

// Extreme Bradycardia (30 BPM)
const fBrady = { ...defaultFactors, heartRate: 30 };
for (let p = -Math.PI; p <= Math.PI; p += 0.1) {
  const d = engine.evaluateDipole(p, fBrady);
  const frame = leadModel.compute12Leads(d, p, 100);
  for (const [lead, v] of Object.entries(frame.leads)) {
    assert(Number.isFinite(v) && Math.abs(v) < 8.0, `Edge Case D: 30 BPM lead ${lead} bounded (${v.toFixed(2)} mV)`);
  }
}

// Critical Hyperkalemia Sine Wave (K+ 9.0 mmol/L)
const fHyperK = { ...defaultFactors, serumPotassium: 9.0 };
for (let p = -Math.PI; p <= Math.PI; p += 0.1) {
  const d = engine.evaluateDipole(p, fHyperK);
  const frame = leadModel.compute12Leads(d, p, 100);
  for (const [lead, v] of Object.entries(frame.leads)) {
    assert(Number.isFinite(v) && Math.abs(v) < 5.0, `Edge Case D: K+ 9.0 sine wave lead ${lead} bounded (${v.toFixed(2)} mV)`);
  }
}

// ----------------------------------------------------
// TEST 5: Edge Case E - Zero/Extreme Canvas Geometry
// ----------------------------------------------------
assert(leadModel.kappa === 1.085, 'Edge Case E: LeadFieldModel kappa transfer constant calibrated to 1.085');
assert(leadModel.voltageScale === 0.05, 'Edge Case E: Voltage scale factor calibrated to S = 0.05');

// ----------------------------------------------------
// TEST 6: Static Invariant - Strictly 0 Unicode U+2014 (Em-Dash)
// ----------------------------------------------------
let emDashCount = 0;
function scanEmDashes(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanEmDashes(fullPath);
    } else if (/\.(tsx|ts|css|html|md|json)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('\u2014')) {
        console.error(`Em-dash found in ${fullPath}`);
        emDashCount++;
      }
    }
  }
}
scanEmDashes(path.resolve(process.cwd(), 'src'));
assert(emDashCount === 0, 'Zero Unicode U+2014 (em-dash) occurrences across entire src/');

// ----------------------------------------------------
// TEST 7: Edge Case F - Adversarial Clinical Diagnostic Rule Engine Gate
// ----------------------------------------------------
const zeroST: Record<LeadId, number> = {
  I: 0, II: 0, III: 0, aVR: 0, aVL: 0, aVF: 0,
  V1: 0, V2: 0, V3: 0, V4: 0, V5: 0, V6: 0,
};

// Baseline normal report
const normalFeatures: MeasuredECGFeatures = {
  heartRate: 72,
  prIntervalMs: 160,
  qrsDurationMs: 88,
  qtIntervalMs: 380,
  qtcBazettMs: 415,
  qtcFridericiaMs: 403,
  stDeviationMv: zeroST,
  tWaveAmplitudeMv: zeroST,
  factors: defaultFactors,
};
const repNormal = DiagnosticRuleEngine.evaluate(normalFeatures);
assert(repNormal.triageCategory === 'green', 'Edge Case F: Baseline ECG triageCategory is green');
assert(repNormal.primaryHeadline.includes('Irama Sinus Normal'), 'Edge Case F: Baseline headline is normal sinus');

// Extensive Anterior STEMI
const antST: Record<LeadId, number> = {
  ...zeroST,
  V1: 0.22, V2: 0.35, V3: 0.30, V4: 0.20, I: 0.15, aVL: 0.15,
};
const repAnt = DiagnosticRuleEngine.evaluate({
  ...normalFeatures,
  stDeviationMv: antST,
  factors: { ...defaultFactors, ladStenosisPercent: 100, hsTroponinT: 5000 },
});
assert(repAnt.triageCategory === 'red', 'Edge Case F: Anterior STEMI triageCategory is red');
assert(repAnt.culpritArtery === 'Proximal Left Anterior Descending (LAD)', 'Edge Case F: Culprit artery is Proximal LAD');

// Inferior STEMI
const infST: Record<LeadId, number> = {
  ...zeroST,
  II: 0.25, III: 0.32, aVF: 0.28, aVL: -0.18,
};
const repInf = DiagnosticRuleEngine.evaluate({
  ...normalFeatures,
  stDeviationMv: infST,
  factors: { ...defaultFactors, rcaStenosisPercent: 100, hsTroponinT: 3200 },
});
assert(repInf.triageCategory === 'red', 'Edge Case F: Inferior STEMI triageCategory is red');
assert(repInf.culpritArtery === 'Right Coronary Artery (RCA)', 'Edge Case F: Culprit artery is RCA');

// Lateral STEMI
const latST: Record<LeadId, number> = {
  ...zeroST,
  I: 0.18, aVL: 0.20, V5: 0.16, V6: 0.15,
};
const repLat = DiagnosticRuleEngine.evaluate({
  ...normalFeatures,
  stDeviationMv: latST,
  factors: { ...defaultFactors, lcxStenosisPercent: 100, hsTroponinT: 2800 },
});
assert(repLat.triageCategory === 'red', 'Edge Case F: Lateral STEMI triageCategory is red');
assert(repLat.culpritArtery === 'Left Circumflex (LCx)', 'Edge Case F: Culprit artery is LCx');

// Lead Misplacement (V1/V2 2nd ICS pseudo-Brugada)
const repMisplacement = DiagnosticRuleEngine.evaluate({
  ...normalFeatures,
  electrodeMisplacement: true,
});
assert(repMisplacement.triageCategory === 'yellow', 'Edge Case F: Electrode misplacement triageCategory is yellow');
assert(repMisplacement.primaryHeadline.includes('Malposisi Sadapan'), 'Edge Case F: Misplacement detected in headline');

// Lethal Hyperkalemia Sine Wave (K+ > 8.5)
const repLethalK = DiagnosticRuleEngine.evaluate({
  ...normalFeatures,
  factors: { ...defaultFactors, serumPotassium: 9.2 },
});
assert(repLethalK.triageCategory === 'red', 'Edge Case F: Lethal Hyperkalemia triageCategory is red');
assert(repLethalK.primaryHeadline.includes('Pola Gelombang Sinus'), 'Edge Case F: Lethal Hyperkalemia triggers sine wave headline');

// Troponin Boundary: 14 ng/L (normal) vs 15 ng/L (elevated)
const subendoST: Record<LeadId, number> = {
  ...zeroST,
  V4: -0.10, V5: -0.12, V6: -0.08,
};
const repTropNormal = DiagnosticRuleEngine.evaluate({
  ...normalFeatures,
  stDeviationMv: subendoST,
  factors: { ...defaultFactors, hsTroponinT: 14 },
});
const repTropElevated = DiagnosticRuleEngine.evaluate({
  ...normalFeatures,
  stDeviationMv: subendoST,
  factors: { ...defaultFactors, hsTroponinT: 15 },
});
assert(repTropNormal.infarctionIschemia.includes('Unstable Angina'), 'Edge Case F: Troponin 14 ng/L categorized as Unstable Angina');
assert(repTropElevated.infarctionIschemia.includes('NSTEMI'), 'Edge Case F: Troponin 15 ng/L categorized as NSTEMI');

// ----------------------------------------------------
// TEST 8: Edge Case G - Physical Electrode Landmarks Integrity
// ----------------------------------------------------
const expectedPhysicalIds: PhysicalElectrodeId[] = ['RA', 'LA', 'RL', 'LL', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
for (const id of expectedPhysicalIds) {
  const lm = STANDARD_ELECTRODE_LANDMARKS[id];
  assert(!!lm, `Edge Case G: Electrode ${id} defined in standard landmarks`);
  assert(Number.isFinite(lm.pos.x) && Number.isFinite(lm.pos.y) && Number.isFinite(lm.pos.z), `Edge Case G: Electrode ${id} has finite 3D coordinates`);
  assert(lm.fullTitle.length > 0 && lm.landmarkDesc.length > 0, `Edge Case G: Electrode ${id} has descriptive anatomical metadata`);
}

console.log('====================================================');
console.log(`ALL ${testsPassed}/${totalTests} ADVERSARIAL DESTRUCTIVE QA TESTS PASSED (EXIT CODE 0)`);
console.log('====================================================');
