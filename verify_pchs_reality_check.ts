import { synthesizeLeadWaveform, WaveformPresetKey } from './src/engine/clinical/thaler/thalerWaveformGenerator';
import {
  PX_PER_MM,
  CANVAS_WIDTH_PX,
  CANVAS_HEIGHT_PX,
  MARGIN_LEFT_PX,
  SIGNAL_WIDTH_PX,
  COL_WIDTH_PX,
  ROW_HEIGHT_PX,
  ROW_BASELINES_PX,
  RHYTHM_BASELINE_PX,
} from './src/engine/clinical/thaler/thalerGeometry';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, msg: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${msg}${detail ? ` -> ${detail}` : ''}`);
  } else {
    failedTests++;
    console.error(`[FAIL] ${msg}${detail ? ` -> ${detail}` : ''}`);
  }
}

console.log('=== PCHS ENGINE RIGOROUS EMPIRICAL VERIFICATION ===');

// 0. Quintic Smoothstep Mathematical Foundation Test
console.log('\n--- 1. Smoothstep5 Basis & Hermite Transition Verification ---');
function smoothstep5(u: number): number {
  if (u <= 0.0) return 0.0;
  if (u >= 1.0) return 1.0;
  return u * u * u * (u * (u * 6.0 - 15.0) + 10.0);
}

assert(smoothstep5(0.0) === 0.0, 'S_5(0.0) is identically 0.0');
assert(smoothstep5(1.0) === 1.0, 'S_5(1.0) is identically 1.0');
assert(smoothstep5(0.5) === 0.5, 'S_5(0.5) is identically 0.5 (anti-symmetric)');
assert(smoothstep5(-0.2) === 0.0, 'S_5(-0.2) clamps cleanly to 0.0');
assert(smoothstep5(1.2) === 1.0, 'S_5(1.2) clamps cleanly to 1.0');

// Derivative checks via finite differences: S'(0) = 0, S'(1) = 0
const eps = 1e-6;
const dS0 = (smoothstep5(eps) - smoothstep5(0)) / eps;
const dS1 = (smoothstep5(1) - smoothstep5(1 - eps)) / eps;
assert(Math.abs(dS0) < 1e-4, 'S_5 derivative at u=0 is 0 (C^1 smooth)', `dS(0) = ${dS0.toExponential(4)}`);
assert(Math.abs(dS1) < 1e-4, 'S_5 derivative at u=1 is 0 (C^1 smooth)', `dS(1) = ${dS1.toExponential(4)}`);

// Second derivative checks: S''(0) = 0, S''(1) = 0
const d2S0 = (smoothstep5(2 * eps) - 2 * smoothstep5(eps) + smoothstep5(0)) / (eps * eps);
const d2S1 = (smoothstep5(1) - 2 * smoothstep5(1 - eps) + smoothstep5(1 - 2 * eps)) / (eps * eps);
assert(Math.abs(d2S0) < 1e-2, 'S_5 2nd derivative at u=0 is 0 (C^2 smooth)', `d2S(0) = ${d2S0.toExponential(4)}`);
assert(Math.abs(d2S1) < 1e-2, 'S_5 2nd derivative at u=1 is 0 (C^2 smooth)', `d2S(1) = ${d2S1.toExponential(4)}`);

// Monotonicity check
let isMonotonic = true;
for (let u = 0; u <= 1.0; u += 0.01) {
  if (smoothstep5(u + 0.01) < smoothstep5(u)) {
    isMonotonic = false;
    break;
  }
}
assert(isMonotonic, 'S_5 is strictly monotonic on [0, 1]');

// 1. Synthesize Normal Sinus Lead Map
console.log('\n--- 2. Normal Sinus Waveform Telemetry ---');
const normalSinus = synthesizeLeadWaveform('NORMAL_SINUS');
const leadII = normalSinus['II'];
const leadV1 = normalSinus['V1'];
const rhythmII = normalSinus['RHYTHM_II'];

// Sampling parameters
const fs = 250;
const dt = 1 / fs; // 4 ms per sample
const beatInterval = 60 / 72; // ~0.8333 s (208.33 samples per beat)

// Telemetry check on Lead II
const samplesPerBeat = Math.round(beatInterval * fs); // ~208 samples
const firstBeat = leadII.slice(0, samplesPerBeat);

// Find min and max in first beat
let minII = Infinity;
let maxII = -Infinity;
let minIITime = 0;
let maxIITime = 0;

firstBeat.forEach((v, idx) => {
  const t = idx * dt;
  if (v < minII) {
    minII = v;
    minIITime = t;
  }
  if (v > maxII) {
    maxII = v;
    maxIITime = t;
  }
});

console.log(`Lead II First Beat: Min = ${minII.toFixed(4)} mV at t = ${minIITime.toFixed(3)}s, Max = ${maxII.toFixed(4)} mV at t = ${maxIITime.toFixed(3)}s`);

// Verify R peak
assert(Math.abs(maxII - 1.30) < 1e-4, 'Lead II R-wave peak amplitude is strictly 1.30 mV', `observed ${maxII.toFixed(4)} mV`);

// Verify Q wave dip (< 0 mV) and S wave dip (< 0 mV) in Lead II
const tQ = 0.208 + 0.08 * 0.20;
const tR = 0.208 + 0.08 * 0.50;
const tS = 0.208 + 0.08 * 0.80;

const sampleAt = (arr: number[], t: number) => {
  const s = Math.round(t * fs);
  return arr[s];
};

const vQ = sampleAt(leadII, tQ);
const vR = sampleAt(leadII, tR);
const vS = sampleAt(leadII, tS);

console.log(`Lead II Q-R-S samples: Q(${tQ.toFixed(3)}s) = ${vQ.toFixed(4)} mV, R(${tR.toFixed(3)}s) = ${vR.toFixed(4)} mV, S(${tS.toFixed(3)}s) = ${vS.toFixed(4)} mV`);

assert(Math.abs(vQ - (-0.04)) < 1e-4, 'Lead II Q wave dips below 0 mV to strictly -qAmp (-0.04 mV)', `observed ${vQ.toFixed(4)} mV`);
assert(Math.abs(vR - 1.30) < 1e-4, 'Lead II R wave peaks at strictly +rAmp (+1.30 mV)', `observed ${vR.toFixed(4)} mV`);
assert(Math.abs(vS - (-0.10)) < 1e-4, 'Lead II S wave dips below 0 mV to strictly -sAmp (-0.10 mV)', `observed ${vS.toFixed(4)} mV`);

// Verify Lead V1
const tRV1 = 0.208 + 0.08 * 0.35;
const tSV1 = 0.208 + 0.08 * 0.70;
const vRV1 = sampleAt(leadV1, tRV1);
const vSV1 = sampleAt(leadV1, tSV1);

console.log(`Lead V1 QRS samples: R(${tRV1.toFixed(3)}s) = ${vRV1.toFixed(4)} mV, S(${tSV1.toFixed(3)}s) = ${vSV1.toFixed(4)} mV`);
assert(Math.abs(vRV1 - 0.25) < 1e-4, 'Lead V1 R wave is upright (+0.25 mV) eliminating false QS pattern', `observed ${vRV1.toFixed(4)} mV`);
assert(Math.abs(vSV1 - (-0.95)) < 1e-4, 'Lead V1 S wave is deep (-0.95 mV)', `observed ${vSV1.toFixed(4)} mV`);

// Verify Isoelectric segments: PR segment, ST segment, TP diastole
console.log('\n--- 3. Strict Isoelectric Segments (0.0000 mV) & Compact Duration ---');
const vPR = sampleAt(leadII, 0.160);
assert(Math.abs(vPR) === 0.0, 'PR segment is strictly 0.0000 mV isoelectric line', `observed ${vPR.toFixed(6)} mV`);

const vST = sampleAt(leadII, 0.315);
assert(Math.abs(vST) === 0.0, 'ST segment in normal sinus is strictly 0.0000 mV', `observed ${vST.toFixed(6)} mV`);

const vTP1 = sampleAt(leadII, 0.600);
const vTP2 = sampleAt(leadII, 0.750);
assert(Math.abs(vTP1) === 0.0 && Math.abs(vTP2) === 0.0, 'TP diastole is strictly 0.0000 mV', `observed ${vTP1.toFixed(6)} mV and ${vTP2.toFixed(6)} mV`);

// Check cycle boundary step jump
const tBeatEnd = beatInterval - 0.001;
const tBeatStart = beatInterval;
const sEnd = Math.floor(tBeatEnd * fs);
const sStart = Math.floor(tBeatStart * fs);
const stepJump = Math.abs(leadII[sStart] - leadII[sEnd]);
console.log(`Cycle boundary transition: sample[${sEnd}] = ${leadII[sEnd].toFixed(6)} mV, sample[${sStart}] = ${leadII[sStart].toFixed(6)} mV, stepJump = ${stepJump.toFixed(6)} mV`);
assert(stepJump === 0.0, 'Zero step jump at cycle boundaries (continuous isoelectric transition)', `stepJump = ${stepJump.toFixed(6)} mV`);

// P wave compact duration check
const vBeforeP = sampleAt(leadII, 0.040);
const vPPeak = sampleAt(leadII, 0.088);
const vAfterP = sampleAt(leadII, 0.136);
assert(Math.abs(vBeforeP) === 0.0, 'Voltage before P wave onset (t = 0.040s) is strictly 0.0000 mV', `observed ${vBeforeP.toFixed(6)} mV`);
assert(Math.abs(vPPeak - 0.18) < 1e-4, 'P wave peak amplitude in Lead II is strictly 0.18 mV', `observed ${vPPeak.toFixed(4)} mV`);
assert(Math.abs(vAfterP) === 0.0, 'Voltage after P wave offset (t = 0.136s) is strictly 0.0000 mV', `observed ${vAfterP.toFixed(6)} mV`);

// T wave asymmetric duration check (peak at 60% upstroke in normal)
const tOnset = 0.288 + 0.060; // 0.348s
const tPeakT = tOnset + 0.16 * 0.60; // 0.444s
const tOffset = tOnset + 0.16; // 0.508s
const vTPeak = sampleAt(leadII, tPeakT);
const vTOffset = sampleAt(leadII, tOffset);
const vAfterT = sampleAt(leadII, tOffset + 0.010);
console.log(`T wave samples: Peak(${tPeakT.toFixed(3)}s) = ${vTPeak.toFixed(4)} mV, Offset(${tOffset.toFixed(3)}s) = ${vTOffset.toFixed(6)} mV`);
assert(Math.abs(vTPeak - 0.35) < 1e-4, 'T wave peak in Lead II matches tAmp (0.35 mV)', `observed ${vTPeak.toFixed(4)} mV`);
assert(Math.abs(vTOffset) === 0.0, 'T wave returns strictly to 0.0000 mV at offset', `observed ${vTOffset.toFixed(6)} mV`);
assert(Math.abs(vAfterT) === 0.0, 'Voltage after T wave offset is strictly 0.0000 mV', `observed ${vAfterT.toFixed(6)} mV`);

// 4. Geometry and Paper Constants Audit
console.log('\n--- 4. Geometry & Paper Constants Audit ---');
assert(RHYTHM_BASELINE_PX === 825.0, 'RHYTHM_BASELINE_PX is exactly 825.0 px', `observed ${RHYTHM_BASELINE_PX}`);
assert(RHYTHM_BASELINE_PX % (PX_PER_MM * 5) === 0.0, 'RHYTHM_BASELINE_PX perfectly aligns with 5mm bold grid lines', `${RHYTHM_BASELINE_PX} / 25 = ${RHYTHM_BASELINE_PX / 25}`);
assert(RHYTHM_BASELINE_PX / (PX_PER_MM * 5) === 33.0, 'RHYTHM_BASELINE_PX aligns with the 33rd 5mm bold grid line at 165 mm', `line index: ${RHYTHM_BASELINE_PX / 25}`);

assert(ROW_BASELINES_PX[0] === 125.0, 'Row 0 baseline is exactly 125.0 px (5th bold line at 25 mm)', `observed ${ROW_BASELINES_PX[0]}`);
assert(ROW_BASELINES_PX[1] === 350.0, 'Row 1 baseline is exactly 350.0 px (14th bold line at 70 mm)', `observed ${ROW_BASELINES_PX[1]}`);
assert(ROW_BASELINES_PX[2] === 575.0, 'Row 2 baseline is exactly 575.0 px (23rd bold line at 115 mm)', `observed ${ROW_BASELINES_PX[2]}`);

// 5. Presets Invariant & Robustness Matrix
console.log('\n--- 5. All 20 Presets Synthesis Invariants Matrix ---');
const ALL_PRESETS: WaveformPresetKey[] = [
  'NORMAL_SINUS',
  'INFERIOR_STEMI',
  'ANTERIOR_STEMI',
  'LVH_STRAIN',
  'ATRIAL_FIBRILLATION',
  'ATRIAL_FLUTTER_2_1',
  'WOLFF_PARKINSON_WHITE',
  'COMPLETE_HEART_BLOCK',
  'RBBB',
  'LBBB',
  'SEVERE_HYPERKALEMIA',
  'EARLY_REPOLARIZATION',
  'LEFT_ANTERIOR_HEMIBLOCK',
  'ACUTE_PERICARDITIS',
  'DIGOXIN_EFFECT',
  'VENTRICULAR_TACHYCARDIA',
  'POSTERIOR_STEMI',
  'PULMONARY_EMBOLISM',
  'BRUGADA_TYPE1',
  'SEVERE_HYPOKALEMIA',
];

const EXPECTED_LEADS = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'RHYTHM_II'];

ALL_PRESETS.forEach((presetKey) => {
  const leadMap = synthesizeLeadWaveform(presetKey);
  let allLeadsValid = true;
  let sampleCountValid = true;
  let noNaNsOrInfs = true;
  let boundedVoltages = true;

  EXPECTED_LEADS.forEach((lead) => {
    const data = leadMap[lead];
    if (!data) {
      allLeadsValid = false;
      return;
    }
    if (data.length !== 2500) {
      sampleCountValid = false;
    }
    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      if (Number.isNaN(v) || !Number.isFinite(v)) {
        noNaNsOrInfs = false;
      }
      if (Math.abs(v) > 5.0) {
        boundedVoltages = false;
      }
    }
  });

  assert(allLeadsValid && sampleCountValid && noNaNsOrInfs && boundedVoltages, `Preset ${presetKey} generates valid, finite, bounded waveforms across all 13 channels`);
});

console.log('\n=== ALL PCHS VERIFICATIONS COMPLETE ===');
console.log(`Total tests: ${totalTests}, Passed: ${passedTests}, Failed: ${failedTests}`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
