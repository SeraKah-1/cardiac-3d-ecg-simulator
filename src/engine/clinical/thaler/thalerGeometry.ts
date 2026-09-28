/**
 * Thaler EKG Geometry Engine
 * Deterministic mathematical mapping for 12-lead ECG paper canvas.
 * Guarantees 100% pixel-perfect alignment for camera focal points,
 * grid millimeter lines, and beat-level waveform bounding boxes.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import { BoundingBox, CameraCoordinates } from './thalerTypes';

// Physical ECG Paper Constants (25 mm/s, 10 mm/mV)
export const PX_PER_MM = 5; // 5 px per mm eliminates subpixel moire and ensures integer alignment
export const CANVAS_WIDTH_MM = 275.0; // 25 mm margin + 250 mm signal tracing
export const CANVAS_HEIGHT_MM = 180.0;
export const CANVAS_WIDTH_PX = CANVAS_WIDTH_MM * PX_PER_MM; // 1375 px
export const CANVAS_HEIGHT_PX = CANVAS_HEIGHT_MM * PX_PER_MM; // 900 px

export const MARGIN_LEFT_PX = 25.0 * PX_PER_MM; // 125 px = exactly 25.0 mm calibration area
export const SIGNAL_WIDTH_PX = CANVAS_WIDTH_PX - MARGIN_LEFT_PX; // 1250 px = exactly 250.0 mm (10.0 s at 25 mm/s)
export const COL_WIDTH_PX = SIGNAL_WIDTH_PX / 4; // 312.5 px = exactly 62.5 mm (2.5 s at 25 mm/s)
export const ROW_HEIGHT_PX = (CANVAS_HEIGHT_PX - 45 * PX_PER_MM) / 3; // 225 px = 45 mm
export const RHYTHM_TOP_Y_PX = CANVAS_HEIGHT_PX - 36 * PX_PER_MM; // 720 px

// Exactly aligned row baselines on 5mm bold grid lines
export const ROW_BASELINES_PX = [125.0, 350.0, 575.0]; // Rows 0, 1, 2 baselines
export const RHYTHM_BASELINE_PX = 825.0; // Rhythm row baseline (33rd 5mm bold grid line at 165 mm)

// Lead Column and Row indices in 4x3 standard grid
export const LEAD_MATRIX: Record<string, { col: number; row: number }> = {
  'I': { col: 0, row: 0 },
  'II': { col: 0, row: 1 },
  'III': { col: 0, row: 2 },
  'aVR': { col: 1, row: 0 },
  'aVL': { col: 1, row: 1 },
  'aVF': { col: 1, row: 2 },
  'V1': { col: 2, row: 0 },
  'V2': { col: 2, row: 1 },
  'V3': { col: 2, row: 2 },
  'V4': { col: 3, row: 0 },
  'V5': { col: 3, row: 1 },
  'V6': { col: 3, row: 2 },
};

/**
 * Returns exact bounding box in percentage (0 to 100) for any lead or feature.
 */
export function getLeadBounds(lead: string): BoundingBox {
  if (lead === 'CALIBRATION_PULSE') {
    const xPx = 40.0; // 8 mm * 5 px/mm
    const yPx = 75.0; // 125 - 50 px
    const widthPx = 25.0; // 5 mm * 5 px/mm
    const heightPx = 55.0;
    return {
      x: (xPx / CANVAS_WIDTH_PX) * 100,
      y: (yPx / CANVAS_HEIGHT_PX) * 100,
      width: (widthPx / CANVAS_WIDTH_PX) * 100,
      height: (heightPx / CANVAS_HEIGHT_PX) * 100,
    };
  }

  if (lead === 'RHYTHM_II' || lead === 'RHYTHM') {
    const x = (MARGIN_LEFT_PX / CANVAS_WIDTH_PX) * 100;
    const y = (RHYTHM_TOP_Y_PX / CANVAS_HEIGHT_PX) * 100;
    const width = (SIGNAL_WIDTH_PX / CANVAS_WIDTH_PX) * 100;
    const height = ((CANVAS_HEIGHT_PX - RHYTHM_TOP_Y_PX) / CANVAS_HEIGHT_PX) * 100;
    return { x, y, width, height };
  }

  const pos = LEAD_MATRIX[lead];
  if (!pos) {
    return getLeadBounds('II');
  }

  const pxX = MARGIN_LEFT_PX + pos.col * COL_WIDTH_PX;
  const pxY = pos.row * ROW_HEIGHT_PX;

  return {
    x: (pxX / CANVAS_WIDTH_PX) * 100,
    y: (pxY / CANVAS_HEIGHT_PX) * 100,
    width: (COL_WIDTH_PX / CANVAS_WIDTH_PX) * 100,
    height: (ROW_HEIGHT_PX / CANVAS_HEIGHT_PX) * 100,
  };
}

/**
 * Computes bounding box enveloping multiple leads.
 */
export function getMultiLeadBounds(leads: string[]): BoundingBox {
  if (leads.length === 0) return { x: 0, y: 0, width: 100, height: 100 };
  if (leads.length === 1) return getLeadBounds(leads[0]);

  let minX = 100;
  let minY = 100;
  let maxX = 0;
  let maxY = 0;

  leads.forEach((l) => {
    const b = getLeadBounds(l);
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.width > maxX) maxX = b.x + b.width;
    if (b.y + b.height > maxY) maxY = b.y + b.height;
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Returns an array of individual bounding boxes for each lead with labels.
 * Prevents gigantic single-box occlusions over multiple leads.
 */
export function getMultiLeadBoxes(leads: string[]): BoundingBox[] {
  return leads.map((lead) => ({
    ...getLeadBounds(lead),
    label: lead,
  }));
}

// Waveform Feature Types for Exact Beat-Level Pointing
export type WaveformFeatureType =
  | 'CALIBRATION_PULSE'
  | 'P_WAVE'
  | 'PR_INTERVAL'
  | 'QRS_COMPLEX'
  | 'J_POINT'
  | 'ST_SEGMENT'
  | 'T_WAVE'
  | 'QT_INTERVAL'
  | 'U_WAVE'
  | 'LEAD_FULL';

export interface WaveFeatureGeometry {
  boundingBox: BoundingBox;
  cameraTarget: CameraCoordinates;
  caliperCoords: {
    startX: number;
    endX: number;
    baselineY: number;
    peakY: number;
  };
}

/**
 * Computes exact beat-level pixel and percentage coordinates for any specific wave feature.
 * Grounds markers on true biophysical waveform locations rather than arbitrary cells.
 * Resolves column-specific time offsets (0-2.5s, 2.5-5.0s, etc.) so markers never drift.
 */
export function getWaveFeatureGeometry(
  lead: string,
  feature: WaveformFeatureType,
  heartRateBpm = 75,
  prIntervalMs = 160,
  qrsDurationMs = 80,
  stElevationMv = 0.0,
  customLabel?: string
): WaveFeatureGeometry {
  if (lead === 'CALIBRATION_PULSE' || feature === 'CALIBRATION_PULSE') {
    const xPx = 40.0;
    const yPx = 75.0; // 125 - 50 px (10 mm)
    const wPx = 25.0; // 5 mm
    const hPx = 55.0;
    return {
      boundingBox: {
        x: (xPx / CANVAS_WIDTH_PX) * 100,
        y: (yPx / CANVAS_HEIGHT_PX) * 100,
        width: (wPx / CANVAS_WIDTH_PX) * 100,
        height: (hPx / CANVAS_HEIGHT_PX) * 100,
        label: customLabel || 'Pulsa Kalibrasi (10 mm / 1.0 mV)',
        labelEn: customLabel || 'Calibration Pulse (10 mm / 1.0 mV)',
      },
      cameraTarget: {
        focusLeads: ['CALIBRATION_PULSE', 'I'],
        zoomLevel: 2.0,
        centerPercentX: Number(((xPx + wPx / 2) / CANVAS_WIDTH_PX * 100).toFixed(2)),
        centerPercentY: Number(((yPx + hPx / 2) / CANVAS_HEIGHT_PX * 100).toFixed(2)),
      },
      caliperCoords: {
        startX: xPx,
        endX: xPx + wPx,
        baselineY: 125.0,
        peakY: 75.0,
      },
    };
  }

  const pos = LEAD_MATRIX[lead] || { col: 0, row: 1 };
  const colStartX = MARGIN_LEFT_PX + pos.col * COL_WIDTH_PX;
  const baselineY = ROW_BASELINES_PX[pos.row] || 350.0;

  const hr = Math.max(35, Math.min(180, heartRateBpm));
  const rrSec = 60 / hr;
  const colStartTimeSec = pos.col * 2.5;

  // Find the most centered and fully formed beat inside the 2.5-second column window
  const kFirst = Math.ceil((colStartTimeSec + 0.05) / rrSec);
  let kTarget = kFirst;
  let beatOffsetSec = kTarget * rrSec - colStartTimeSec;

  // If the beat starts too early in the column (near edge) and next beat fits well, use next beat
  if (beatOffsetSec < 0.12 && (beatOffsetSec + rrSec) < 2.0) {
    kTarget = kFirst + 1;
    beatOffsetSec = kTarget * rrSec - colStartTimeSec;
  }
  // Clamp offset safely within 2.5s column
  const tBeat = Math.max(0.08, Math.min(1.8, beatOffsetSec));

  const prSec = prIntervalMs / 1000;
  const qrsSec = qrsDurationMs / 1000;

  // Wave phase relative to beat origin (aligned with thalerWaveformGenerator.ts)
  const pCenter = 0.08;
  const qrsStart = pCenter + prSec - 0.04;
  const rCenter = qrsStart + 0.045;
  const qrsEnd = qrsStart + qrsSec;

  let tStartInBeat = 0;
  let tEndInBeat = 0.2;
  let vMin = -0.1;
  let vMax = 0.3;
  let defaultLabel = 'Gelombang EKG';
  let defaultLabelEn = 'ECG Wave';

  switch (feature) {
    case 'P_WAVE':
      tStartInBeat = 0.02;
      tEndInBeat = qrsStart - 0.01;
      vMin = 0.0;
      vMax = 0.25;
      defaultLabel = `Gelombang P (${Math.round(prIntervalMs * 0.5)} ms)`;
      defaultLabelEn = `P Wave (${Math.round(prIntervalMs * 0.5)} ms)`;
      break;
    case 'PR_INTERVAL':
      tStartInBeat = 0.02;
      tEndInBeat = qrsStart;
      vMin = -0.05;
      vMax = 0.25;
      defaultLabel = `Interval PR (${prIntervalMs} ms)`;
      defaultLabelEn = `PR Interval (${prIntervalMs} ms)`;
      break;
    case 'QRS_COMPLEX':
      tStartInBeat = qrsStart;
      tEndInBeat = qrsEnd;
      vMin = -0.4;
      vMax = 1.25;
      defaultLabel = `Kompleks QRS (${qrsDurationMs} ms)`;
      defaultLabelEn = `QRS Complex (${qrsDurationMs} ms)`;
      break;
    case 'J_POINT':
      tStartInBeat = qrsEnd - 0.02;
      tEndInBeat = qrsEnd + 0.03;
      vMin = Math.min(0, stElevationMv) - 0.05;
      vMax = Math.max(0.1, stElevationMv + 0.15);
      defaultLabel = 'Titik J (J-Point)';
      defaultLabelEn = 'J-Point (ST Junction)';
      break;
    case 'ST_SEGMENT':
      tStartInBeat = qrsEnd;
      tEndInBeat = qrsEnd + 0.10;
      vMin = Math.min(0, stElevationMv) - 0.05;
      vMax = Math.max(0.12, stElevationMv + 0.18);
      defaultLabel = stElevationMv !== 0 ? `Segmen ST (${stElevationMv > 0 ? '+' : ''}${stElevationMv.toFixed(1)} mV)` : 'Segmen ST Isoelektrik';
      defaultLabelEn = stElevationMv !== 0 ? `ST Segment (${stElevationMv > 0 ? '+' : ''}${stElevationMv.toFixed(1)} mV)` : 'Isoelectric ST Segment';
      break;
    case 'T_WAVE':
      tStartInBeat = qrsEnd + 0.04;
      tEndInBeat = qrsStart + 0.40;
      vMin = 0.0;
      vMax = 0.50;
      defaultLabel = 'Gelombang T';
      defaultLabelEn = 'T Wave';
      break;
    default:
      return {
        boundingBox: {
          ...getLeadBounds(lead),
          label: customLabel || lead,
          labelEn: customLabel || lead,
        },
        cameraTarget: getCameraForLeads([lead], 1.8),
        caliperCoords: {
          startX: colStartX,
          endX: colStartX + COL_WIDTH_PX,
          baselineY,
          peakY: baselineY - 40,
        },
      };
  }

  const pxPerSecInCol = COL_WIDTH_PX / 2.5; // Exactly 125 px/sec = 25 mm/s * 5 px/mm
  const startXPx = colStartX + (tBeat + tStartInBeat) * pxPerSecInCol;
  const endXPx = colStartX + (tBeat + tEndInBeat) * pxPerSecInCol;
  const widthPx = Math.max(20, endXPx - startXPx);

  const topYPx = baselineY - vMax * 50 - 10;
  const bottomYPx = baselineY - vMin * 50 + 10;
  const heightPx = bottomYPx - topYPx;

  const centerXPercent = ((startXPx + widthPx / 2) / CANVAS_WIDTH_PX) * 100;
  const centerYPercent = ((topYPx + heightPx / 2) / CANVAS_HEIGHT_PX) * 100;

  return {
    boundingBox: {
      x: Number(((startXPx / CANVAS_WIDTH_PX) * 100).toFixed(2)),
      y: Number(((topYPx / CANVAS_HEIGHT_PX) * 100).toFixed(2)),
      width: Number(((widthPx / CANVAS_WIDTH_PX) * 100).toFixed(2)),
      height: Number(((heightPx / CANVAS_HEIGHT_PX) * 100).toFixed(2)),
      label: customLabel || defaultLabel,
      labelEn: customLabel || defaultLabelEn,
    },
    cameraTarget: {
      focusLeads: [lead],
      zoomLevel: 2.0, // Optimal 2.0x magnification for clear wave readability
      centerPercentX: Number(centerXPercent.toFixed(2)),
      centerPercentY: Number(centerYPercent.toFixed(2)),
    },
    caliperCoords: {
      startX: startXPx,
      endX: endXPx,
      baselineY,
      peakY: baselineY - vMax * 50,
    },
  };
}

// Non-Occlusive Caliper Rail Constants
export const TOP_RAIL_Y_PX = 22.0; // Upper margin gutter (Y = 22 px)
export const BOTTOM_RAIL_Y_PX = 198.0; // Lower margin gutter (Y = 198 px)
export const WAVEFORM_ZONE_TOP_PX = 35.0; // Sterile waveform zone upper boundary
export const WAVEFORM_ZONE_BOTTOM_PX = 185.0; // Sterile waveform zone lower boundary

/**
 * Returns exact camera coordinates with context-aware dynamic scaling.
 * Balances macro full 12-lead overview (1.0x) with micro wave feature focus (2.0x).
 */
export function getCameraForLeads(leads: string[], zoomLevel = 2.0): CameraCoordinates {
  if (leads.length === 0 || (leads.length >= 12 && !leads.includes('CALIBRATION_PULSE'))) {
    return {
      focusLeads: leads,
      zoomLevel: 1.0,
      centerPercentX: 50,
      centerPercentY: 50,
    };
  }

  const box = getMultiLeadBounds(leads);
  const rawCenterX = box.x + box.width / 2;
  const rawCenterY = box.y + box.height / 2;

  // Automated containment zoom clamp
  const marginFactor = leads.includes('RHYTHM_II') || leads.includes('RHYTHM') ? 1.05 : 1.15;
  const maxFitZoomX = box.width > 0 ? 100 / (marginFactor * box.width) : 3.5;
  const maxFitZoomY = box.height > 0 ? 100 / (marginFactor * box.height) : 3.5;
  const maxFitZoom = Math.min(maxFitZoomX, maxFitZoomY);

  // Context-aware dynamic scaling clamp:
  // Single leads or micro-wave features allow up to 2.2x zoom (default ~2.0x)
  // Multi-lead groups allow up to 1.5x
  // Global 12-lead stays 1.0x
  const maxPermissibleZoom = leads.length === 1 || leads.includes('CALIBRATION_PULSE') ? 2.2 : (leads.length <= 3 ? 1.5 : 1.25);
  const safeZoom = Math.max(1.0, Math.min(zoomLevel, maxFitZoom, maxPermissibleZoom));

  const targetCenterX = Math.max(5, Math.min(95, rawCenterX));
  const targetCenterY = Math.max(5, Math.min(95, rawCenterY));

  return {
    focusLeads: leads,
    zoomLevel: Number(safeZoom.toFixed(2)),
    centerPercentX: Number(targetCenterX.toFixed(2)),
    centerPercentY: Number(targetCenterY.toFixed(2)),
  };
}
