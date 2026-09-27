/**
 * ThalerEcgCanvas: Hospital-Grade 12-Lead ECG Paper Workstation
 * Mathematically locked to standard 25 mm/s paper speed and 10 mm/mV sensitivity.
 * Features 1:1 integer sample-to-grid alignment (0.5000 px/sample),
 * context-aware dynamic zoom (1.0x macro vs 2.0x micro wave focus),
 * and interactive digital calipers.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { EKGCase, CameraCoordinates, BoundingBox, TutorialStep } from '../../engine/clinical/thaler/thalerTypes';
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
  RHYTHM_TOP_Y_PX,
} from '../../engine/clinical/thaler/thalerGeometry';
import { useLocale } from '../../locales/useLocale';
import { ThalerPdfExportEngine } from '../../engine/export/ThalerPdfExportEngine';

interface ThalerEcgCanvasProps {
  currentCase: EKGCase;
  camera: CameraCoordinates;
  highlightBoxes: BoundingBox[];
  activeStepName: string;
  activeStep?: TutorialStep;
  isCaliperActive: boolean;
  onResetCamera: () => void;
  onZoomToFeature?: () => void;
  onLeadClick?: (lead: string) => void;
  isPracticeMode?: boolean;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
}

// 4 Columns x 3 Rows standard 12-lead layout
const GRID_COLUMNS = [
  { colIndex: 0, leads: ['I', 'II', 'III'] },
  { colIndex: 1, leads: ['aVR', 'aVL', 'aVF'] },
  { colIndex: 2, leads: ['V1', 'V2', 'V3'] },
  { colIndex: 3, leads: ['V4', 'V5', 'V6'] },
];

export const ThalerEcgCanvas: React.FC<ThalerEcgCanvasProps> = ({
  currentCase,
  camera,
  highlightBoxes,
  activeStepName,
  activeStep,
  isCaliperActive,
  onResetCamera,
  onZoomToFeature,
  isPracticeMode = false,
  onCanvasRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { t, locale } = useLocale();

  // Digital Caliper State
  const [caliperStart, setCaliperStart] = useState<{ x: number; y: number } | null>(null);
  const [caliperCurrent, setCaliperCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingCaliper, setIsDraggingCaliper] = useState<boolean>(false);
  const [isMarchingMode, setIsMarchingMode] = useState<boolean>(false);
  const [caliperResult, setCaliperResult] = useState<{
    mmX: number;
    mmY: number;
    sec: number;
    mv: number;
  } | null>(null);

  // Interactive Zoom & Pan State (Multi-touch Pinch, Wheel, and Drag Support)
  const [localZoom, setLocalZoom] = useState<number>(camera.zoomLevel);
  const [localCenterX, setLocalCenterX] = useState<number>(camera.centerPercentX);
  const [localCenterY, setLocalCenterY] = useState<number>(camera.centerPercentY);
  const [isGestureActive, setIsGestureActive] = useState<boolean>(false);

  // Synchronize local camera with external camera prop changes
  useEffect(() => {
    setLocalZoom(camera.zoomLevel);
    setLocalCenterX(camera.centerPercentX);
    setLocalCenterY(camera.centerPercentY);
  }, [camera.zoomLevel, camera.centerPercentX, camera.centerPercentY]);

  // Pointer tracking for multi-touch pinch-to-zoom and panning
  const activePointers = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const pinchInitialRef = useRef<{ initialDist: number; initialZoom: number } | null>(null);
  const panInitialRef = useRef<{ startX: number; startY: number; initialCenterX: number; initialCenterY: number } | null>(null);

  // Notify parent of canvas element
  useEffect(() => {
    if (onCanvasRef && canvasRef.current) {
      onCanvasRef(canvasRef.current);
    }
  }, [onCanvasRef]);

  // Clear caliper measurement when deactivated or case changes
  useEffect(() => {
    if (!isCaliperActive) {
      setCaliperStart(null);
      setCaliperCurrent(null);
      setCaliperResult(null);
      setIsDraggingCaliper(false);
      setIsMarchingMode(false);
    }
  }, [isCaliperActive, currentCase.id]);

  // Render ECG on Canvas with Mathematical Locking
  const renderEcg = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Clear & Paint Clinical Warm Pink ECG Paper Background
    ctx.fillStyle = '#fff9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Minor 1mm Grid Lines (Clinical Pink Paper Precision Grid)
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = '#fda4af'; // Rose-300 for high-contrast visible 1mm squares
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += PX_PER_MM) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += PX_PER_MM) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // 3. Major 5mm Grid Lines (Bold Coral Pink Accent)
    const step5mm = PX_PER_MM * 5; // 25 px
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = '#f43f5e'; // Rose-500
    ctx.globalAlpha = 0.70;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += step5mm) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += step5mm) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // 4. Standard Calibration Pulse (10 mm = 1.0 mV, 5 mm = 0.20 s)
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    const calBaselineY = ROW_BASELINES_PX[0]; // Exactly 125 px
    const calStartX = 40.0; // 8 mm * 5 px/mm
    const calPulseWidth = 25.0; // 5 mm = 25 px
    const calPulseHeight = 50.0; // 10 mm = 50 px

    ctx.moveTo(calStartX, calBaselineY);
    ctx.lineTo(calStartX + 5.0, calBaselineY);
    ctx.lineTo(calStartX + 5.0, calBaselineY - calPulseHeight);
    ctx.lineTo(calStartX + 5.0 + calPulseWidth, calBaselineY - calPulseHeight);
    ctx.lineTo(calStartX + 5.0 + calPulseWidth, calBaselineY);
    ctx.lineTo(calStartX + 5.0 + calPulseWidth + 10.0, calBaselineY);
    ctx.stroke();

    // Calibration label with crisp modern font
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('10 mm / 1 mV', calStartX - 8, calBaselineY + 18);
    ctx.fillText('25 mm / s', calStartX - 8, calBaselineY + 32);

    // 5. Draw 12 Leads Waveforms with 100% Integer Locking (0.5 px/sample)
    const samplingRate = currentCase.calibration.samplingRateHz || 250;
    // Samples per 2.5 seconds per lead (625 samples standard)
    const samplesPerChannel = Math.max(1, Math.floor(samplingRate * 2.5));

    GRID_COLUMNS.forEach((col, cIdx) => {
      const colStartX = MARGIN_LEFT_PX + cIdx * COL_WIDTH_PX;

      col.leads.forEach((leadName, rIdx) => {
        const rowCenterY = ROW_BASELINES_PX[rIdx] || (rIdx * ROW_HEIGHT_PX + 125);
        const samples = currentCase.leadSamples[leadName];

        const isFocused =
          !camera.focusLeads ||
          camera.focusLeads.length === 0 ||
          camera.focusLeads.includes(leadName) ||
          camera.focusLeads.includes('CALIBRATION_PULSE');

        // Draw lead label
        ctx.font = isFocused ? 'bold 13px Inter, sans-serif' : '500 12px Inter, sans-serif';
        ctx.fillStyle = isFocused ? '#0f172a' : 'rgba(100, 116, 139, 0.40)';
        ctx.fillText(leadName, colStartX + 10, rIdx * ROW_HEIGHT_PX + 24);

        if (!samples || samples.length === 0) return;

        // Render waveform: 100% charcoal for focused, soft 35% attenuation for peripheral
        ctx.lineWidth = isFocused ? 1.7 : 1.1;
        ctx.strokeStyle = isFocused ? '#0f172a' : 'rgba(71, 85, 105, 0.35)';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();

        const channelStartIdx = cIdx * samplesPerChannel;
        const availableSamples = Math.max(0, Math.min(samplesPerChannel, samples.length - channelStartIdx));
        const pxPerSample = COL_WIDTH_PX / samplesPerChannel; // Exactly 0.5000 px/sample!

        for (let i = 0; i < availableSamples; i++) {
          const sampleVal = samples[channelStartIdx + i]; // Voltage in mV
          const x = colStartX + i * pxPerSample;
          // Standard scale: 10 mm/mV * 5 px/mm = 50 px/mV
          const y = rowCenterY - sampleVal * 10 * PX_PER_MM;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });
    });

    // 6. Draw Continuous Rhythm Strip (Lead II) Across Full Signal Width
    const rhythmSamples = currentCase.leadSamples['RHYTHM_II'] || currentCase.leadSamples['II'];
    if (rhythmSamples && rhythmSamples.length > 0) {
      const rhythmBaselineY = RHYTHM_BASELINE_PX; // Exactly 820 px
      const rhythmPxPerSample = SIGNAL_WIDTH_PX / rhythmSamples.length; // Exactly 0.5000 px/sample!

      const isRhythmFocused =
        !camera.focusLeads ||
        camera.focusLeads.length === 0 ||
        camera.focusLeads.includes('RHYTHM_II') ||
        camera.focusLeads.includes('RHYTHM') ||
        camera.focusLeads.includes('II');

      // Rhythm label
      ctx.font = isRhythmFocused ? 'bold 12px Inter, sans-serif' : '500 11px Inter, sans-serif';
      ctx.fillStyle = isRhythmFocused ? '#0f172a' : 'rgba(100, 116, 139, 0.40)';
      ctx.fillText('Lead II (Rhythm)', MARGIN_LEFT_PX - 110, rhythmBaselineY + 5);

      ctx.lineWidth = isRhythmFocused ? 1.7 : 1.1;
      ctx.strokeStyle = isRhythmFocused ? '#0f172a' : 'rgba(71, 85, 105, 0.35)';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      for (let i = 0; i < rhythmSamples.length; i++) {
        const sampleVal = rhythmSamples[i];
        const x = MARGIN_LEFT_PX + i * rhythmPxPerSample;
        const y = rhythmBaselineY - sampleVal * 10 * PX_PER_MM;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // 7. Scale-Adaptive Marker & Caliper Overlay
    const isZoomedIn = camera.zoomLevel >= 1.6;

    if (highlightBoxes && highlightBoxes.length > 0 && camera.focusLeads.length > 0 && !camera.focusLeads.includes('CALIBRATION_PULSE')) {
      highlightBoxes.forEach((box) => {
        const bx = (box.x / 100) * canvas.width;
        const by = (box.y / 100) * canvas.height;
        const bw = (box.width / 100) * canvas.width;
        const bh = (box.height / 100) * canvas.height;

        if (isZoomedIn) {
          // High Zoom Mode (Z >= 1.6x): Precision Micro-Highlight with Dotted Outline
          ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
          ctx.fillRect(bx, by, bw, bh);

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#2563eb';
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(bx, by, bw, bh);
          ctx.setLineDash([]);

          // Metric Label Pill
          const activeBoxLabel = (locale === 'en' && box.labelEn) ? box.labelEn : box.label;
          const fallbackCaliperLabel = activeStep?.inSituAnnotation
            ? (locale === 'en' && activeStep.inSituAnnotation.labelEn
                ? activeStep.inSituAnnotation.labelEn
                : activeStep.inSituAnnotation.label) || (locale === 'en' && activeStep.stepNameEn ? activeStep.stepNameEn : activeStep.stepName)
            : (locale === 'en' && activeStep?.stepNameEn ? activeStep.stepNameEn : activeStep?.stepName);

          const labelText = activeBoxLabel || (activeStep?.inSituAnnotation
            ? (activeStep.inSituAnnotation.durationSec
                ? `${Math.round(activeStep.inSituAnnotation.durationSec * 1000)} ms`
                : activeStep.inSituAnnotation.voltageMv
                ? `${activeStep.inSituAnnotation.voltageMv.toFixed(2)} mV`
                : fallbackCaliperLabel)
            : fallbackCaliperLabel);

          if (labelText) {
            ctx.font = 'bold 11px Inter, sans-serif';
            const tw = ctx.measureText(labelText).width;
            const pillY = Math.max(16, by - 6);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.fillRect(bx + bw / 2 - tw / 2 - 6, pillY - 14, tw + 12, 17);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, bx + bw / 2 - tw / 2, pillY - 2);
          }
        } else {
          // Low Zoom Mode (Z < 1.6x): Clean Frame with subtle title tag
          ctx.fillStyle = 'rgba(37, 99, 235, 0.03)';
          ctx.fillRect(bx, by, bw, bh);

          ctx.lineWidth = 1.2;
          ctx.strokeStyle = 'rgba(37, 99, 235, 0.40)';
          ctx.strokeRect(bx, by, bw, bh);

          const displayBoxLabel = (locale === 'en' && box.labelEn) ? box.labelEn : box.label;
          if (displayBoxLabel) {
            ctx.font = 'bold 10px Inter, sans-serif';
            const tw = ctx.measureText(displayBoxLabel).width;
            ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
            ctx.fillRect(bx + 4, by + 4, tw + 8, 15);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(displayBoxLabel, bx + 8, by + 15);
          }
        }
      });
    }

    // 8. Draw User Interactive Drag Caliper Overlay
    if (isCaliperActive && caliperStart && caliperCurrent) {
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#c2410c'; // Precision Vermilion
      ctx.fillStyle = '#c2410c';

      ctx.beginPath();
      ctx.moveTo(caliperStart.x, caliperStart.y);
      ctx.lineTo(caliperCurrent.x, caliperCurrent.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(caliperStart.x, caliperStart.y, 3.5, 0, 2 * Math.PI);
      ctx.arc(caliperCurrent.x, caliperCurrent.y, 3.5, 0, 2 * Math.PI);
      ctx.fill();

      // Marching Caliper Ticks (when isMarchingMode is active)
      if (isMarchingMode && caliperResult && caliperResult.mmX > 0) {
        const dxPx = Math.abs(caliperCurrent.x - caliperStart.x);
        if (dxPx >= 10) {
          ctx.strokeStyle = 'rgba(194, 65, 12, 0.40)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 3]);

          // Forward marching ticks
          for (let mx = caliperStart.x + dxPx; mx <= canvas.width; mx += dxPx) {
            ctx.beginPath();
            ctx.moveTo(mx, 0);
            ctx.lineTo(mx, canvas.height);
            ctx.stroke();
          }
          // Backward marching ticks
          for (let mx = caliperStart.x - dxPx; mx >= 0; mx -= dxPx) {
            ctx.beginPath();
            ctx.moveTo(mx, 0);
            ctx.lineTo(mx, canvas.height);
            ctx.stroke();
          }
          ctx.setLineDash([]);
        }
      }

      if (caliperResult) {
        const midX = (caliperStart.x + caliperCurrent.x) / 2;
        const midY = (caliperStart.y + caliperCurrent.y) / 2 - 14;
        const label = `${caliperResult.mmX.toFixed(1)} mm (${Math.round(caliperResult.sec * 1000)} ms) | ${caliperResult.mv.toFixed(2)} mV`;

        ctx.font = 'bold 11px Inter, sans-serif';
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
        ctx.fillRect(midX - textWidth / 2 - 6, midY - 13, textWidth + 12, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, midX - textWidth / 2, midY);
      }
    }
  }, [currentCase, camera, highlightBoxes, activeStep, isCaliperActive, caliperStart, caliperCurrent, caliperResult, isMarchingMode]);

  useEffect(() => {
    renderEcg();
  }, [renderEcg]);

  // Target-Anchored Camera Centering Transformation with Smooth Interpolation
  const cameraTransform = useMemo(() => {
    const zoom = Math.max(1.0, localZoom);
    const targetPercentX = Math.min(95, Math.max(5, localCenterX));
    const targetPercentY = Math.min(95, Math.max(5, localCenterY));

    const translateX = 50 - targetPercentX;
    const translateY = 50 - targetPercentY;

    return {
      transformOrigin: `${targetPercentX}% ${targetPercentY}%`,
      transform: `translate3d(${translateX}%, ${translateY}%, 0) scale(${zoom})`,
      transition: isGestureActive ? 'none' : 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
    };
  }, [localZoom, localCenterX, localCenterY, isGestureActive]);

  // Zoom control helpers
  const handleZoomIn = () => {
    setLocalZoom((prev) => Math.min(4.0, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setLocalZoom((prev) => {
      const next = Math.max(1.0, Number((prev - 0.25).toFixed(2)));
      if (next <= 1.05) {
        setLocalCenterX(50);
        setLocalCenterY(50);
      }
      return next;
    });
  };

  const handleResetCameraZoom = () => {
    onResetCamera();
    setLocalZoom(1.0);
    setLocalCenterX(50);
    setLocalCenterY(50);
  };

  // Wheel zoom listener attached to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.20 : -0.20;
      setLocalZoom((prev) => {
        const next = Math.min(4.0, Math.max(1.0, Number((prev + zoomDelta).toFixed(2))));
        if (next <= 1.05) {
          setLocalCenterX(50);
          setLocalCenterY(50);
        }
        return next;
      });
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleNativeWheel);
  }, []);

  // Caliper & Touch Gesture Pointer Handlers
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointers.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    // 2 Pointers: Initiate multi-touch Pinch to Zoom
    if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      pinchInitialRef.current = {
        initialDist: dist,
        initialZoom: localZoom,
      };
      panInitialRef.current = null;
      setIsGestureActive(true);
      if (isDraggingCaliper) {
        setIsDraggingCaliper(false);
        setCaliperStart(null);
      }
      return;
    }

    // 1 Pointer: Caliper measurement OR 1-finger Pan when zoomed
    if (activePointers.current.size === 1) {
      if (isCaliperActive) {
        const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH_PX;
        const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT_PX;
        setIsDraggingCaliper(true);
        setCaliperStart({ x, y });
        setCaliperCurrent({ x, y });
        setCaliperResult(null);
      } else if (localZoom > 1.05) {
        panInitialRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initialCenterX: localCenterX,
          initialCenterY: localCenterY,
        };
        setIsGestureActive(true);
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointers.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

    // Handle 2-finger Pinch Zoom
    if (activePointers.current.size === 2 && pinchInitialRef.current) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      if (pinchInitialRef.current.initialDist > 0) {
        const scaleRatio = dist / pinchInitialRef.current.initialDist;
        const newZoom = Math.min(4.0, Math.max(1.0, pinchInitialRef.current.initialZoom * scaleRatio));
        setLocalZoom(Number(newZoom.toFixed(2)));
        if (newZoom <= 1.05) {
          setLocalCenterX(50);
          setLocalCenterY(50);
        }
      }
      return;
    }

    // Handle 1-finger Pan when zoomed
    if (activePointers.current.size === 1 && panInitialRef.current && !isCaliperActive && localZoom > 1.05) {
      const deltaX = e.clientX - panInitialRef.current.startX;
      const deltaY = e.clientY - panInitialRef.current.startY;
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const pctDeltaX = (deltaX / rect.width) * (100 / localZoom);
          const pctDeltaY = (deltaY / rect.height) * (100 / localZoom);
          const newCenterX = Math.min(95, Math.max(5, panInitialRef.current.initialCenterX - pctDeltaX));
          const newCenterY = Math.min(95, Math.max(5, panInitialRef.current.initialCenterY - pctDeltaY));
          setLocalCenterX(newCenterX);
          setLocalCenterY(newCenterY);
        }
      }
      return;
    }

    // Handle Caliper Drag
    if (isCaliperActive && isDraggingCaliper && caliperStart) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      let x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH_PX;
      let y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT_PX;

      if (e.shiftKey) {
        const dx = Math.abs(x - caliperStart.x);
        const dy = Math.abs(y - caliperStart.y);
        if (dx >= dy) {
          y = caliperStart.y;
        } else {
          x = caliperStart.x;
        }
      }

      setCaliperCurrent({ x, y });

      const dxPx = Math.abs(x - caliperStart.x);
      const dyPx = Math.abs(y - caliperStart.y);
      const mmX = dxPx / PX_PER_MM;
      const mmY = dyPx / PX_PER_MM;
      const sec = mmX * 0.04;
      const mv = mmY * 0.10;

      setCaliperResult({ mmX, mmY, sec, mv });
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointers.current.delete(e.pointerId);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    if (activePointers.current.size < 2) {
      pinchInitialRef.current = null;
    }
    if (activePointers.current.size === 1) {
      // Bug fix: Re-seed panInitialRef for the remaining pointer so 1-finger pan continues seamlessly
      const remainingPointer = Array.from(activePointers.current.values())[0];
      if (remainingPointer && localZoom > 1.05 && !isCaliperActive) {
        panInitialRef.current = {
          startX: remainingPointer.clientX,
          startY: remainingPointer.clientY,
          initialCenterX: localCenterX,
          initialCenterY: localCenterY,
        };
      } else {
        panInitialRef.current = null;
        setIsGestureActive(false);
      }
    } else if (activePointers.current.size === 0) {
      panInitialRef.current = null;
      setIsGestureActive(false);
      setIsDraggingCaliper(false);
    }
  };

  // Double tap / click to toggle zoom on mobile and desktop
  const handleCanvasDoubleClick = () => {
    if (localZoom >= 1.5) {
      handleResetCameraZoom();
    } else if (onZoomToFeature) {
      onZoomToFeature();
    }
  };

  // Keyboard shortcut: Z key toggles zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
        return;
      }

      if ((e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey) {
        if (localZoom >= 1.5) {
          handleResetCameraZoom();
        } else if (onZoomToFeature) {
          onZoomToFeature();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localZoom, onZoomToFeature]);

  const isZoomed = localZoom >= 1.5;

  return (
    <div className="flex flex-col h-full bg-stone-100 border border-stone-300 select-none overflow-hidden rounded-md shadow-xs">
      {/* Canvas Top Telemetry & Control Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-50 border-b border-stone-200 text-xs text-stone-700">
        <div className="flex items-center space-x-3">
          <span className="font-sans font-bold text-stone-900 tracking-tight">
            {t.common.appTitle}
          </span>
          <span className="text-stone-500 hidden sm:inline text-[11px]">
            {t.telemetry.leadFocus}: <strong className="text-stone-800">{camera.focusLeads.join(', ')}</strong> ({localZoom.toFixed(1)}x)
          </span>
          <span className="text-stone-500 hidden md:inline text-[11px]">
            {activeStepName}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Caliper active pill and Marching toggle */}
          {isCaliperActive && (
            <div className="flex items-center space-x-1.5">
              <div className="px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-900 font-mono text-[11px] rounded">
                {caliperResult ? (
                  <span>
                    dX: <strong>{caliperResult.mmX.toFixed(1)} mm</strong> ({Math.round(caliperResult.sec * 1000)} ms) | dY: <strong>{caliperResult.mv.toFixed(2)} mV</strong>
                  </span>
                ) : (
                  <span>{t.common.caliperActive} <span className="text-[10px] text-amber-700">{t.common.shiftOrthogonal}</span></span>
                )}
              </div>
              <button
                onClick={() => setIsMarchingMode(!isMarchingMode)}
                className={`px-2 py-0.5 text-[11px] font-sans font-semibold rounded border transition cursor-pointer ${
                  isMarchingMode
                    ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
                title={t.common.marchingTooltip}
              >
                {t.common.marchingToggle}: {isMarchingMode ? 'ON' : 'OFF'}
              </button>
            </div>
          )}

          {/* Export PDF Button */}
          <button
            onClick={() => ThalerPdfExportEngine.exportHospital12LeadStrip(currentCase, canvasRef.current, locale)}
            className="px-2.5 py-1 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 text-xs font-sans font-semibold rounded border border-stone-300 shadow-2xs transition cursor-pointer flex items-center space-x-1"
            title={t.common.printPdfTooltip}
          >
            <span>📄</span>
            <span className="hidden sm:inline">{t.common.printPdf}</span>
          </button>

          {/* 1-Click Zoom Toggle Button */}
          {isZoomed ? (
            <button
              onClick={handleResetCameraZoom}
              className="px-2.5 py-1 bg-white hover:bg-stone-50 text-stone-800 text-xs font-sans font-semibold rounded border border-stone-300 shadow-2xs transition cursor-pointer flex items-center space-x-1"
              title={t.common.zoomFullTooltip}
            >
              <span>⛶</span>
              <span>{t.common.zoomFull} ({localZoom.toFixed(1)}x)</span>
            </button>
          ) : (
            <button
              onClick={onZoomToFeature || handleZoomIn}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-sans font-semibold rounded border border-blue-200 shadow-2xs transition cursor-pointer flex items-center space-x-1"
              title={t.common.zoomWaveTooltip}
            >
              <span>🔍</span>
              <span>{t.common.zoomWave}</span>
            </button>
          )}
        </div>
      </div>

      {/* Viewport with CSS Transform Pan & Zoom (Aspect Ratio Locked 275:180) */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-stone-200/60 overflow-hidden flex items-center justify-center p-2"
        style={{ cursor: isCaliperActive ? 'crosshair' : localZoom > 1.05 ? 'grab' : 'default' }}
      >
        <div
          className="relative aspect-[275/180] max-h-full max-w-full shadow-md"
          style={{
            ...cameraTransform,
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH_PX}
            height={CANVAS_HEIGHT_PX}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
            onDoubleClick={handleCanvasDoubleClick}
            className="block w-full h-full object-contain rounded-xs border border-stone-300"
            style={{
              imageRendering: 'crisp-edges',
              touchAction: 'none',
            }}
          />
        </div>

        {/* Floating Interactive Zoom & Pan Toolbar Pill Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-md border border-stone-200 px-1 py-0.5 space-x-1 z-20">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={localZoom <= 1.05}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
            title={locale === 'en' ? 'Zoom Out (-)' : 'Perkecil (-)'}
          >
            -
          </button>
          <button
            type="button"
            onClick={handleResetCameraZoom}
            className="px-2 h-7 flex items-center justify-center font-mono text-[11px] font-bold text-stone-800 hover:bg-stone-100 rounded cursor-pointer transition"
            title={locale === 'en' ? 'Reset to 1.0x (Fit)' : 'Kembalikan ke 1.0x (Pas)'}
          >
            {localZoom.toFixed(1)}x
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={localZoom >= 3.95}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
            title={locale === 'en' ? 'Zoom In (+)' : 'Perbesar (+)'}
          >
            +
          </button>
          {localZoom > 1.05 && (
            <button
              type="button"
              onClick={handleResetCameraZoom}
              className="px-1.5 h-7 flex items-center justify-center text-[11px] font-bold text-blue-700 hover:bg-blue-50 rounded cursor-pointer transition"
              title={locale === 'en' ? 'Fit All Leads' : 'Pas Semua Sadapan'}
            >
              ⛶
            </button>
          )}
        </div>
      </div>

      {/* Bottom Technical Status Line */}
      <div className="flex items-center justify-between px-3 py-1 bg-stone-50 border-t border-stone-200 text-[11px] font-sans text-stone-500">
        <div>
          {t.telemetry.paperStandard}
        </div>
        <div className="flex items-center space-x-3 font-mono">
          {isPracticeMode ? (
            <span className="text-amber-800 text-[10px] font-sans font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {t.telemetry.hiddenInPractice}
            </span>
          ) : (
            <>
              <span>{t.telemetry.heartRate}: <strong className="text-stone-800">{currentCase.metrics.heartRateBpm} bpm</strong></span>
              <span>{t.telemetry.axis}: <strong className="text-stone-800">{currentCase.metrics.axisDegrees}° ({currentCase.metrics.axisClassification})</strong></span>
              <span>{t.telemetry.qrs}: <strong className="text-stone-800">{currentCase.metrics.qrsDurationMs} ms</strong></span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
