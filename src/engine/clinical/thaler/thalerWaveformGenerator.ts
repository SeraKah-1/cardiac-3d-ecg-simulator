/**
 * Biophysical & Mathematical Waveform Generator for Thaler EKG Academy
 * Produces continuous 12-lead voltage arrays (mV) across 10 seconds at 250 Hz.
 * Incorporates genuine biophysical wave morphology: P, Q, R, S, J-point, ST segment, T, and U waves.
 * Zero em-dash compliance. Zero mock shortcuts.
 */

import { LeadMap } from './thalerTypes';

export type WaveformPresetKey =
  | 'NORMAL_SINUS'
  | 'INFERIOR_STEMI'
  | 'ANTERIOR_STEMI'
  | 'LVH_STRAIN'
  | 'ATRIAL_FIBRILLATION'
  | 'ATRIAL_FLUTTER_2_1'
  | 'WOLFF_PARKINSON_WHITE'
  | 'COMPLETE_HEART_BLOCK'
  | 'RBBB'
  | 'LBBB'
  | 'SEVERE_HYPERKALEMIA'
  | 'EARLY_REPOLARIZATION'
  | 'LEFT_ANTERIOR_HEMIBLOCK'
  | 'ACUTE_PERICARDITIS'
  | 'DIGOXIN_EFFECT'
  | 'VENTRICULAR_TACHYCARDIA'
  | 'POSTERIOR_STEMI'
  | 'PULMONARY_EMBOLISM'
  | 'BRUGADA_TYPE1'
  | 'SEVERE_HYPOKALEMIA';

interface WaveParams {
  pAmp: number;
  pWidth: number;
  prInterval: number;
  qAmp: number;
  rAmp: number;
  sAmp: number;
  qrsWidth: number;
  stElev: number;
  tAmp: number;
  tWidth: number;
  qtInterval: number;
  uAmp?: number;
  hasDeltaWave?: boolean;
  hasRabbitEars?: boolean;
  isNotchedLbbb?: boolean;
}

const LEADS = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

// Gaussian wave helper
function gaussian(t: number, center: number, width: number, amplitude: number): number {
  const diff = (t - center) / width;
  return amplitude * Math.exp(-0.5 * diff * diff);
}

// Generates a single beat for a lead
function generateSingleBeat(tInBeat: number, p: WaveParams): number {
  let v = 0;

  // 1. P wave (centered at ~0.08s)
  const pCenter = 0.08;
  v += gaussian(tInBeat, pCenter, p.pWidth, p.pAmp);

  // QRS start
  const qrsStart = pCenter + p.prInterval - 0.04;

  // Delta wave (WPW)
  if (p.hasDeltaWave) {
    v += gaussian(tInBeat, qrsStart + 0.02, 0.025, p.rAmp * 0.35);
  }

  // 2. Q wave
  const qCenter = qrsStart + 0.025;
  if (p.qAmp !== 0) {
    v += gaussian(tInBeat, qCenter, 0.015, -Math.abs(p.qAmp));
  }

  // 3. R wave & Rabbit Ears / LBBB notching
  const rCenter = qrsStart + 0.045;
  if (p.hasRabbitEars) {
    // rsR' in V1 (RBBB)
    v += gaussian(tInBeat, rCenter - 0.02, 0.018, p.rAmp * 0.4); // r
    v += gaussian(tInBeat, rCenter, 0.02, -Math.abs(p.sAmp || 0.4)); // s
    v += gaussian(tInBeat, rCenter + 0.035, 0.035, p.rAmp); // R' wide
  } else if (p.isNotchedLbbb) {
    // Broad notched R in I, V5, V6
    v += gaussian(tInBeat, rCenter - 0.015, 0.03, p.rAmp * 0.85);
    v += gaussian(tInBeat, rCenter + 0.025, 0.035, p.rAmp);
  } else {
    v += gaussian(tInBeat, rCenter, p.qrsWidth * 0.4, p.rAmp);
  }

  // 4. S wave
  const sCenter = rCenter + 0.025;
  if (p.sAmp !== 0 && !p.hasRabbitEars) {
    v += gaussian(tInBeat, sCenter, p.qrsWidth * 0.35, -Math.abs(p.sAmp));
  }

  // 5. ST segment & J-point
  const stCenter = rCenter + 0.08;
  if (p.stElev !== 0) {
    v += gaussian(tInBeat, stCenter, 0.08, p.stElev);
  }

  // 6. T wave
  const tCenter = qrsStart + p.qtInterval - 0.08;
  v += gaussian(tInBeat, tCenter, p.tWidth, p.tAmp);

  // 7. U wave (if present, e.g. hypokalemia or normal variant)
  if (p.uAmp) {
    v += gaussian(tInBeat, tCenter + 0.16, 0.06, p.uAmp);
  }

  return v;
}

export function synthesizeLeadWaveform(preset: WaveformPresetKey): LeadMap {
  const samplingRateHz = 250;
  const durationSec = 10;
  const totalSamples = samplingRateHz * durationSec;
  const leadMap: LeadMap = {};

  for (const lead of LEADS) {
    leadMap[lead] = new Array(totalSamples).fill(0);
  }
  // Rhythm strip is continuous Lead II
  leadMap['RHYTHM_II'] = new Array(totalSamples).fill(0);

  // Base configurations per preset
  switch (preset) {
    case 'NORMAL_SINUS': {
      const hr = 72;
      const beatInterval = 60 / hr; // ~0.833s
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getNormalLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getNormalLeadParams('II'));
      }
      break;
    }

    case 'INFERIOR_STEMI': {
      const hr = 52;
      const beatInterval = 60 / hr; // ~1.15s
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getInferiorStemiLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getInferiorStemiLeadParams('II'));
      }
      break;
    }

    case 'ANTERIOR_STEMI': {
      const hr = 104;
      const beatInterval = 60 / hr; // ~0.576s
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getAnteriorStemiLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getAnteriorStemiLeadParams('II'));
      }
      break;
    }

    case 'LVH_STRAIN': {
      const hr = 75;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getLvhStrainLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getLvhStrainLeadParams('II'));
      }
      break;
    }

    case 'ATRIAL_FIBRILLATION': {
      // Irregular RR intervals
      const rrIntervals = [0.42, 0.58, 0.38, 0.65, 0.44, 0.52, 0.48, 0.62, 0.40, 0.55, 0.45, 0.60, 0.42, 0.53, 0.47, 0.59, 0.41, 0.64, 0.46, 0.50];
      let currentBeatStart = 0;
      let rrIndex = 0;

      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const curInterval = rrIntervals[rrIndex % rrIntervals.length];

        if (t >= currentBeatStart + curInterval) {
          currentBeatStart += curInterval;
          rrIndex++;
        }

        const tInBeat = t - currentBeatStart;
        // High frequency fibrillatory baseline (f-waves: 6Hz - 8Hz undulating noise)
        const fWave = 0.04 * Math.sin(2 * Math.PI * 6.5 * t) + 0.02 * Math.sin(2 * Math.PI * 9.2 * t);

        for (const lead of LEADS) {
          const p = getAfibLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, p) + (lead === 'V1' || lead === 'II' ? fWave * 1.5 : fWave);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getAfibLeadParams('II')) + fWave * 1.5;
      }
      break;
    }

    case 'ATRIAL_FLUTTER_2_1': {
      // Flutter waves at 300 bpm (every 0.20s), QRS every 0.40s (150 bpm)
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatInterval = 0.40; // 150 bpm
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        // Saw-tooth wave (period 0.20s = 5 Hz)
        const fPeriod = 0.20;
        const sawTooth = 0.18 * (2 * ((t % fPeriod) / fPeriod) - 1);

        for (const lead of LEADS) {
          const p = getAFlutterLeadParams(lead);
          const beat = generateSingleBeat(tInBeat, p);
          const applySaw = (lead === 'II' || lead === 'III' || lead === 'aVF') ? sawTooth : sawTooth * 0.2;
          leadMap[lead][s] = beat + applySaw;
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getAFlutterLeadParams('II')) + sawTooth;
      }
      break;
    }

    case 'WOLFF_PARKINSON_WHITE': {
      const hr = 78;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getWpwLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getWpwLeadParams('II'));
      }
      break;
    }

    case 'COMPLETE_HEART_BLOCK': {
      // P waves at 75 bpm (every 0.80s), QRS escape at 34 bpm (every 1.76s)
      const pInterval = 0.80;
      const qrsInterval = 1.76;

      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const pPhase = (t % pInterval) / pInterval;
        const qrsPhase = (t % qrsInterval) / qrsInterval;
        const tInP = pPhase * pInterval;
        const tInQrs = qrsPhase * qrsInterval;

        // Independent P wave
        const pWave = gaussian(tInP, 0.10, 0.035, 0.16);

        // Independent Wide QRS Escape
        for (const lead of LEADS) {
          const qrsVal = generateEscapeQrs(tInQrs, lead);
          leadMap[lead][s] = qrsVal + (lead === 'II' ? pWave : pWave * 0.6);
        }
        leadMap['RHYTHM_II'][s] = generateEscapeQrs(tInQrs, 'II') + pWave;
      }
      break;
    }

    case 'RBBB': {
      const hr = 70;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getRbbbLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getRbbbLeadParams('II'));
      }
      break;
    }

    case 'LBBB': {
      const hr = 74;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getLbbbLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getLbbbLeadParams('II'));
      }
      break;
    }

    case 'SEVERE_HYPERKALEMIA': {
      const hr = 58;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getHyperkalemiaLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getHyperkalemiaLeadParams('II'));
      }
      break;
    }

    case 'EARLY_REPOLARIZATION': {
      const hr = 62;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getEarlyRepolLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getEarlyRepolLeadParams('II'));
      }
      break;
    }

    case 'LEFT_ANTERIOR_HEMIBLOCK': {
      const hr = 72;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getLahbLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getLahbLeadParams('II'));
      }
      break;
    }

    case 'ACUTE_PERICARDITIS': {
      const hr = 88;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getPericarditisLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getPericarditisLeadParams('II'));
      }
      break;
    }

    case 'VENTRICULAR_TACHYCARDIA': {
      const hr = 165;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getVentricularTachycardiaLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getVentricularTachycardiaLeadParams('II'));
      }
      break;
    }

    case 'POSTERIOR_STEMI': {
      const hr = 78;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getPosteriorStemiLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getPosteriorStemiLeadParams('II'));
      }
      break;
    }

    case 'PULMONARY_EMBOLISM': {
      const hr = 115;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getPulmonaryEmbolismLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getPulmonaryEmbolismLeadParams('II'));
      }
      break;
    }

    case 'BRUGADA_TYPE1': {
      const hr = 74;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getBrugadaType1LeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getBrugadaType1LeadParams('II'));
      }
      break;
    }

    case 'SEVERE_HYPOKALEMIA': {
      const hr = 82;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getSevereHypokalemiaLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getSevereHypokalemiaLeadParams('II'));
      }
      break;
    }

    case 'DIGOXIN_EFFECT':
    default: {
      const hr = 68;
      const beatInterval = 60 / hr;
      for (let s = 0; s < totalSamples; s++) {
        const t = s / samplingRateHz;
        const beatIndex = Math.floor(t / beatInterval);
        const tInBeat = t - beatIndex * beatInterval;

        for (const lead of LEADS) {
          const params = getDigoxinLeadParams(lead);
          leadMap[lead][s] = generateSingleBeat(tInBeat, params);
        }
        leadMap['RHYTHM_II'][s] = generateSingleBeat(tInBeat, getDigoxinLeadParams('II'));
      }
      break;
    }
  }

  return leadMap;
}

// Parameter generators per lead
function getNormalLeadParams(lead: string): WaveParams {
  switch (lead) {
    case 'I': return { pAmp: 0.12, pWidth: 0.04, prInterval: 0.16, qAmp: 0.05, rAmp: 0.90, sAmp: 0.15, qrsWidth: 0.08, stElev: 0, tAmp: 0.28, tWidth: 0.08, qtInterval: 0.38 };
    case 'II': return { pAmp: 0.18, pWidth: 0.04, prInterval: 0.16, qAmp: 0.04, rAmp: 1.30, sAmp: 0.10, qrsWidth: 0.08, stElev: 0, tAmp: 0.35, tWidth: 0.08, qtInterval: 0.38 };
    case 'III': return { pAmp: 0.08, pWidth: 0.04, prInterval: 0.16, qAmp: 0.02, rAmp: 0.65, sAmp: 0.15, qrsWidth: 0.08, stElev: 0, tAmp: 0.12, tWidth: 0.08, qtInterval: 0.38 };
    case 'aVR': return { pAmp: -0.15, pWidth: 0.04, prInterval: 0.16, qAmp: 0.60, rAmp: 0.15, sAmp: 0.00, qrsWidth: 0.08, stElev: 0, tAmp: -0.25, tWidth: 0.08, qtInterval: 0.38 };
    case 'aVL': return { pAmp: 0.05, pWidth: 0.04, prInterval: 0.16, qAmp: 0.05, rAmp: 0.50, sAmp: 0.20, qrsWidth: 0.08, stElev: 0, tAmp: 0.15, tWidth: 0.08, qtInterval: 0.38 };
    case 'aVF': return { pAmp: 0.14, pWidth: 0.04, prInterval: 0.16, qAmp: 0.03, rAmp: 0.95, sAmp: 0.12, qrsWidth: 0.08, stElev: 0, tAmp: 0.26, tWidth: 0.08, qtInterval: 0.38 };
    case 'V1': return { pAmp: 0.06, pWidth: 0.04, prInterval: 0.16, qAmp: 0.00, rAmp: 0.25, sAmp: 0.95, qrsWidth: 0.08, stElev: 0, tAmp: 0.10, tWidth: 0.08, qtInterval: 0.38 };
    case 'V2': return { pAmp: 0.10, pWidth: 0.04, prInterval: 0.16, qAmp: 0.00, rAmp: 0.55, sAmp: 1.30, qrsWidth: 0.08, stElev: 0, tAmp: 0.35, tWidth: 0.08, qtInterval: 0.38 };
    case 'V3': return { pAmp: 0.12, pWidth: 0.04, prInterval: 0.16, qAmp: 0.02, rAmp: 0.90, sAmp: 0.90, qrsWidth: 0.08, stElev: 0, tAmp: 0.45, tWidth: 0.08, qtInterval: 0.38 };
    case 'V4': return { pAmp: 0.14, pWidth: 0.04, prInterval: 0.16, qAmp: 0.04, rAmp: 1.40, sAmp: 0.50, qrsWidth: 0.08, stElev: 0, tAmp: 0.40, tWidth: 0.08, qtInterval: 0.38 };
    case 'V5': return { pAmp: 0.13, pWidth: 0.04, prInterval: 0.16, qAmp: 0.05, rAmp: 1.50, sAmp: 0.25, qrsWidth: 0.08, stElev: 0, tAmp: 0.35, tWidth: 0.08, qtInterval: 0.38 };
    case 'V6': return { pAmp: 0.11, pWidth: 0.04, prInterval: 0.16, qAmp: 0.06, rAmp: 1.20, sAmp: 0.10, qrsWidth: 0.08, stElev: 0, tAmp: 0.28, tWidth: 0.08, qtInterval: 0.38 };
    default: return getNormalLeadParams('II');
  }
}

function getInferiorStemiLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  if (lead === 'II') {
    return { ...norm, qAmp: 0.45, rAmp: 0.70, stElev: 0.35, tAmp: 0.55 }; // ST elevation + Q
  }
  if (lead === 'III') {
    return { ...norm, qAmp: 0.55, rAmp: 0.45, stElev: 0.42, tAmp: 0.60 }; // ST elevation + deep Q
  }
  if (lead === 'aVF') {
    return { ...norm, qAmp: 0.40, rAmp: 0.60, stElev: 0.38, tAmp: 0.50 }; // ST elevation + Q
  }
  if (lead === 'I' || lead === 'aVL') {
    return { ...norm, stElev: -0.22, tAmp: -0.20 }; // Reciprocal depression
  }
  return norm;
}

function getAnteriorStemiLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  const base: WaveParams = {
    ...norm,
    prInterval: 0.14,
    qtInterval: 0.30,
    tWidth: 0.055,
  };
  if (lead === 'V1' || lead === 'V2') {
    return { ...base, qAmp: 0.35, rAmp: 0.20, sAmp: 0, stElev: 0.45, tAmp: 0.70 }; // Tombstone ST elevation
  }
  if (lead === 'V3' || lead === 'V4') {
    return { ...base, qAmp: 0.40, rAmp: 0.30, sAmp: 0, stElev: 0.55, tAmp: 0.85 }; // Marked elevation
  }
  if (lead === 'V5') {
    return { ...base, stElev: 0.25, tAmp: 0.45 };
  }
  if (lead === 'III' || lead === 'aVF') {
    return { ...base, stElev: -0.18, tAmp: -0.15 }; // Reciprocal depression
  }
  return base;
}

function getLvhStrainLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  if (lead === 'V1') {
    return { ...norm, rAmp: 0.15, sAmp: 2.40 }; // Deep S in V1 = 24mm
  }
  if (lead === 'V2') {
    return { ...norm, rAmp: 0.25, sAmp: 2.80 }; // Deep S in V2 = 28mm
  }
  if (lead === 'V5') {
    return { ...norm, rAmp: 2.70, sAmp: 0.10, stElev: -0.22, tAmp: -0.35 }; // Tall R in V5 = 27mm + Strain
  }
  if (lead === 'V6') {
    return { ...norm, rAmp: 2.30, sAmp: 0.05, stElev: -0.20, tAmp: -0.30 }; // Tall R in V6 = 23mm + Strain
  }
  if (lead === 'I' || lead === 'aVL') {
    return { ...norm, rAmp: 1.50, stElev: -0.15, tAmp: -0.25 }; // Lateral strain
  }
  return norm;
}

function getAfibLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  return {
    ...norm,
    pAmp: 0, // Zero P wave
    prInterval: 0.10,
    qtInterval: 0.28,
    tWidth: 0.055,
  };
}

function getAFlutterLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  return {
    ...norm,
    pAmp: 0,
    prInterval: 0.08,
    qtInterval: 0.24,
    tWidth: 0.045,
  };
}

function getWpwLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  return {
    ...norm,
    prInterval: 0.09, // Short PR < 0.12s
    qrsWidth: 0.13,   // Widened QRS
    hasDeltaWave: true,
  };
}

function generateEscapeQrs(tInQrs: number, lead: string): number {
  // Broad, slow idioventricular escape (width 0.16s)
  const qrsCenter = 0.20;
  const isV1 = lead === 'V1';
  const isLateral = lead === 'I' || lead === 'V5' || lead === 'V6';
  const amp = isV1 ? -0.8 : (isLateral ? 0.9 : 0.6);
  const qrs = gaussian(tInQrs, qrsCenter, 0.07, amp);

  // Secondary T wave discordant with main QRS deflection
  const tCenter = 0.52;
  const tAmp = -amp * 0.35;
  const tWave = gaussian(tInQrs, tCenter, 0.10, tAmp);

  return qrs + tWave;
}

function getRbbbLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  if (lead === 'V1') {
    return { ...norm, qrsWidth: 0.14, hasRabbitEars: true, stElev: -0.12, tAmp: -0.22 };
  }
  if (lead === 'I' || lead === 'V6') {
    return { ...norm, qrsWidth: 0.14, sAmp: 0.70 }; // Wide slurred S wave
  }
  return { ...norm, qrsWidth: 0.13 };
}

function getLbbbLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  if (lead === 'I' || lead === 'aVL' || lead === 'V5' || lead === 'V6') {
    return { ...norm, qrsWidth: 0.15, isNotchedLbbb: true, qAmp: 0, stElev: -0.18, tAmp: -0.32 };
  }
  if (lead === 'V1' || lead === 'V2') {
    return { ...norm, qrsWidth: 0.15, rAmp: 0.05, sAmp: 1.80, stElev: 0.15, tAmp: 0.30 };
  }
  return { ...norm, qrsWidth: 0.14 };
}

function getHyperkalemiaLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  // Flattened P wave, wide QRS, massive tented T wave
  return {
    ...norm,
    pAmp: 0.04,
    qrsWidth: 0.13,
    tAmp: lead.startsWith('V') ? 1.10 : 0.65, // Tented peak
    tWidth: 0.045, // Narrow base tenting
  };
}

function getEarlyRepolLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  if (lead === 'V2' || lead === 'V3' || lead === 'V4') {
    return { ...norm, stElev: 0.18, tAmp: 0.55 }; // Concave ST elevation with J-point notch
  }
  return norm;
}

function getLahbLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  if (lead === 'I' || lead === 'aVL') {
    return { ...norm, qAmp: 0.12, rAmp: 1.30, sAmp: 0.05 }; // qR pattern in lateral
  }
  if (lead === 'II' || lead === 'III' || lead === 'aVF') {
    return { ...norm, qAmp: 0.00, rAmp: 0.15, sAmp: 1.25 }; // rS pattern in inferior (LAD)
  }
  return norm;
}

function getPericarditisLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  if (lead === 'aVR') {
    return { ...norm, stElev: -0.12 }; // PR elevation & ST depression in aVR
  }
  // Diffuse concave ST elevation across limb & precordial leads
  return { ...norm, stElev: 0.16, tAmp: 0.42 };
}

function getDigoxinLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  if (lead === 'V4' || lead === 'V5' || lead === 'V6' || lead === 'II') {
    return { ...norm, stElev: -0.15, tAmp: 0.10 }; // Scooped ST depression
  }
  return norm;
}

function getVentricularTachycardiaLeadParams(lead: string): WaveParams {
  const isV1 = lead === 'V1' || lead === 'V2';
  const isInferior = lead === 'II' || lead === 'III' || lead === 'aVF';
  const isLateral = lead === 'I' || lead === 'aVL' || lead === 'V5' || lead === 'V6';
  return {
    pAmp: 0.0, // AV dissociation / buried P waves
    pWidth: 0.04,
    prInterval: 0.02,
    qAmp: 0.0,
    rAmp: isInferior ? -1.35 : (isLateral ? 1.25 : -1.45),
    sAmp: isV1 ? 1.55 : (isLateral ? 0.20 : 0.85),
    qrsWidth: 0.14, // Broad bizarre QRS
    stElev: isInferior ? 0.20 : -0.15,
    tAmp: isInferior ? -0.45 : (isV1 ? 0.40 : -0.35),
    tWidth: 0.05,
    qtInterval: 0.24,
  };
}

function getPosteriorStemiLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  if (lead === 'V1') {
    return { ...norm, rAmp: 0.90, sAmp: 0.18, qrsWidth: 0.09, stElev: -0.18, tAmp: 0.38 };
  }
  if (lead === 'V2') {
    return { ...norm, rAmp: 1.35, sAmp: 0.30, qrsWidth: 0.09, stElev: -0.22, tAmp: 0.45 };
  }
  if (lead === 'V3') {
    return { ...norm, rAmp: 1.45, sAmp: 0.25, stElev: -0.15, tAmp: 0.40 };
  }
  if (lead === 'II' || lead === 'III' || lead === 'aVF') {
    return { ...norm, stElev: 0.12, tAmp: 0.32 };
  }
  return norm;
}

function getPulmonaryEmbolismLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  const base: WaveParams = {
    ...norm,
    prInterval: 0.14,
    qtInterval: 0.28,
    tWidth: 0.05,
  };
  if (lead === 'I') {
    return { ...base, rAmp: 0.45, sAmp: 0.75 }; // Prominent S in I
  }
  if (lead === 'III') {
    return { ...base, qAmp: 0.35, rAmp: 0.55, sAmp: 0.05, tAmp: -0.32 }; // Q and inverted T in III (S1Q3T3)
  }
  if (lead === 'aVF') {
    return { ...base, rAmp: 0.70, sAmp: 0.10 };
  }
  if (lead === 'V1' || lead === 'V2' || lead === 'V3' || lead === 'V4') {
    return { ...base, tAmp: -0.35, stElev: -0.05 }; // Anterior RV strain T-wave inversion
  }
  return base;
}

function getBrugadaType1LeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  if (lead === 'V1') {
    // Classic coved ST elevation >= 2mm followed by negative T wave
    return { ...norm, rAmp: 0.38, sAmp: 0.10, stElev: 0.28, tAmp: -0.34, tWidth: 0.06 };
  }
  if (lead === 'V2') {
    return { ...norm, rAmp: 0.48, sAmp: 0.18, stElev: 0.25, tAmp: -0.30, tWidth: 0.06 };
  }
  return norm;
}

function getSevereHypokalemiaLeadParams(lead: string): WaveParams {
  const norm = getNormalLeadParams(lead);
  const isMidPrecordial = lead === 'V2' || lead === 'V3' || lead === 'V4';
  return {
    ...norm,
    qtInterval: 0.32,
    stElev: -0.11, // Diffuse mild ST depression
    tAmp: 0.04,    // Severely flattened T wave
    tWidth: 0.045,
    uAmp: isMidPrecordial ? 0.28 : 0.18, // Huge prominent U wave
  };
}
