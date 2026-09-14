import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { LeadId } from '../../engine/biophysics/types';
import { EcgRingBuffer } from './EcgRingBuffer';
import { createEcgGridPattern } from './EcgGridPattern';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Ruler, Activity } from 'lucide-react';

interface EcgMultiLeadCanvasProps {
  buffers: Record<LeadId, EcgRingBuffer>;
}

export const EcgMultiLeadCanvas: React.FC<EcgMultiLeadCanvasProps> = ({ buffers }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const workspaceMode = useSimulationStore((s) => s.workspaceMode);
  const paperSpeed = useSimulationStore((s) => s.paperSpeedMmPerSec);
  const setPaperSpeed = useSimulationStore((s) => s.setPaperSpeed);
  const voltageGain = useSimulationStore((s) => s.voltageGainMmPerMv);
  const setVoltageGain = useSimulationStore((s) => s.setVoltageGain);
  const layoutFormat = useSimulationStore((s) => s.layoutFormat);
  const setLayoutFormat = useSimulationStore((s) => s.setLayoutFormat);
  const selectedLeadId = useSimulationStore((s) => s.selectedLeadId);
  const setSelectedLeadId = useSimulationStore((s) => s.setSelectedLeadId);
  const leadOffWarnings = useSimulationStore((s) => s.leadOffWarnings);
  const calipersActive = useSimulationStore((s) => s.calipersActive);
  const setCalipersActive = useSimulationStore((s) => s.setCalipersActive);

  // Digital Calipers local state [0.0 to 1.0 fraction of width]
  const [caliperX1, setCaliperX1] = useState(0.25);
  const [caliperX2, setCaliperX2] = useState(0.55);
  const [draggingCaliper, setDraggingCaliper] = useState<'c1' | 'c2' | null>(null);

  const isSplitMode = workspaceMode === 'integrated';
  const numCols = isSplitMode ? 2 : 4;
  const numRows = isSplitMode ? 6 : 3;
  const hasRhythmStrip = !isSplitMode;

  // Lead Grid Configuration:
  // Mode C (Split): 2 Columns x 6 Rows
  //   Col 1: Limb leads (I, II, III, aVR, aVL, aVF)
  //   Col 2: Precordials (V1, V2, V3, V4, V5, V6)
  // Mode B / Default: 4 Columns x 3 Rows
  const columns = useMemo<Array<Array<{ name: LeadId; displayName: string; invert?: boolean }>>>(() => {
    if (isSplitMode) {
      if (layoutFormat === 'cabrera') {
        return [
          [
            { name: 'aVL', displayName: 'aVL (-30°)' },
            { name: 'I', displayName: 'I (0°)' },
            { name: 'aVR', displayName: '-aVR (+30°)', invert: true },
            { name: 'II', displayName: 'II (+60°)' },
            { name: 'aVF', displayName: 'aVF (+90°)' },
            { name: 'III', displayName: 'III (+120°)' },
          ],
          [
            { name: 'V1', displayName: 'V1' },
            { name: 'V2', displayName: 'V2' },
            { name: 'V3', displayName: 'V3' },
            { name: 'V4', displayName: 'V4' },
            { name: 'V5', displayName: 'V5' },
            { name: 'V6', displayName: 'V6' },
          ],
        ];
      }
      return [
        [
          { name: 'I', displayName: 'I' },
          { name: 'II', displayName: 'II' },
          { name: 'III', displayName: 'III' },
          { name: 'aVR', displayName: 'aVR' },
          { name: 'aVL', displayName: 'aVL' },
          { name: 'aVF', displayName: 'aVF' },
        ],
        [
          { name: 'V1', displayName: 'V1' },
          { name: 'V2', displayName: 'V2' },
          { name: 'V3', displayName: 'V3' },
          { name: 'V4', displayName: 'V4' },
          { name: 'V5', displayName: 'V5' },
          { name: 'V6', displayName: 'V6' },
        ],
      ];
    }

    // 4 Columns x 3 Rows (Standard or Cabrera)
    if (layoutFormat === 'cabrera') {
      return [
        [
          { name: 'aVL', displayName: 'aVL (-30°)' },
          { name: 'I', displayName: 'I (0°)' },
          { name: 'aVR', displayName: '-aVR (+30°)', invert: true },
        ],
        [
          { name: 'II', displayName: 'II (+60°)' },
          { name: 'aVF', displayName: 'aVF (+90°)' },
          { name: 'III', displayName: 'III (+120°)' },
        ],
        [
          { name: 'V1', displayName: 'V1' },
          { name: 'V2', displayName: 'V2' },
          { name: 'V3', displayName: 'V3' },
        ],
        [
          { name: 'V4', displayName: 'V4' },
          { name: 'V5', displayName: 'V5' },
          { name: 'V6', displayName: 'V6' },
        ],
      ];
    }
    return [
      [
        { name: 'I', displayName: 'I' },
        { name: 'II', displayName: 'II' },
        { name: 'III', displayName: 'III' },
      ],
      [
        { name: 'aVR', displayName: 'aVR' },
        { name: 'aVL', displayName: 'aVL' },
        { name: 'aVF', displayName: 'aVF' },
      ],
      [
        { name: 'V1', displayName: 'V1' },
        { name: 'V2', displayName: 'V2' },
        { name: 'V3', displayName: 'V3' },
      ],
      [
        { name: 'V4', displayName: 'V4' },
        { name: 'V5', displayName: 'V5' },
        { name: 'V6', displayName: 'V6' },
      ],
    ];
  }, [isSplitMode, layoutFormat]);

  // Nominal CSS pixel to millimeter scale (96 DPI standard: 96 / 25.4 = 3.7795 px/mm)
  const pxPerMm = 3.78;

  // Render frame
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.scale(dpr, dpr);

    const cssWidth = width / dpr;
    const cssHeight = height / dpr;

    // 1. Draw Background Grid Pattern in Hospital Light Theme
    const pattern = createEcgGridPattern(pxPerMm);
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, cssWidth, cssHeight);
    } else {
      ctx.fillStyle = '#fff7f7';
      ctx.fillRect(0, 0, cssWidth, cssHeight);
    }

    // Grid Dimensions
    const padding = 10;
    const availableW = cssWidth - padding * 2;
    const availableH = cssHeight - padding * 2;

    if (availableW <= 40 || availableH <= 80) {
      ctx.restore();
      return;
    }

    const rhythmHeight = hasRhythmStrip ? Math.min(95, Math.max(70, availableH * 0.20)) : 0;
    const mainGridH = hasRhythmStrip ? availableH - rhythmHeight - 8 : availableH;

    const colWidth = availableW / numCols;
    const rowHeight = mainGridH / numRows;

    const eraseGapPx = 20;
    const scaleY = voltageGain * pxPerMm; // Pixels per mV

    // 2. Draw Columns x Rows
    for (let col = 0; col < numCols; col++) {
      const colX = padding + col * colWidth;

      for (let row = 0; row < numRows; row++) {
        const leadConfig = columns[col][row];
        const leadId = leadConfig.name;
        const buffer = buffers[leadId];
        const rowY = padding + row * rowHeight;
        const baselineY = rowY + rowHeight / 2.0;

        const isSelected = selectedLeadId === leadId;
        const isLeadOff = !!leadOffWarnings[leadId];

        // Selection Border Highlight
        if (isSelected) {
          ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(colX, rowY, colWidth, rowHeight);
        }

        // Lead Title
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillStyle = isSelected ? '#0284c7' : '#1e293b';
        ctx.fillText(leadConfig.displayName, colX + 6, rowY + 14);

        // Lead-Off Warning Banner
        if (isLeadOff) {
          ctx.fillStyle = '#e11d48';
          ctx.font = 'bold 9.5px system-ui, sans-serif';
          ctx.fillText('LEAD OFF', colX + 38, rowY + 14);
        }

        // Standard Calibration Pulse (1mV = 10mm high, 0.20s = 5mm wide) at left edge of column 0
        if (col === 0 && row === 0) {
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          const calX = colX + 4;
          const calH = 1.0 * scaleY;
          const calW = 5.0 * pxPerMm;
          ctx.moveTo(calX, baselineY);
          ctx.lineTo(calX + 2, baselineY);
          ctx.lineTo(calX + 2, baselineY - calH);
          ctx.lineTo(calX + 2 + calW, baselineY - calH);
          ctx.lineTo(calX + 2 + calW, baselineY);
          ctx.lineTo(calX + 4 + calW, baselineY);
          ctx.stroke();
        }

        if (!buffer || colWidth <= 12) continue;

        // Clip strictly within the current lead cell to prevent waveform bleed
        ctx.save();
        ctx.beginPath();
        ctx.rect(colX, rowY, colWidth, rowHeight);
        ctx.clip();

        // Oscilloscope Sweep Logic
        const totalDurationSec = (colWidth - 12) / (paperSpeed * pxPerMm);
        const sampleRate = 500; // 500 Hz standard
        const visibleSamples = Math.max(1, Math.round(totalDurationSec * sampleRate));
        const stepX = (colWidth - 12) / visibleSamples;

        const writeIdx = buffer.getWriteIndex();
        const currentPos = writeIdx % visibleSamples;
        const sweepX = colX + 10 + currentPos * stepX;

        // Erase bar ahead of sweep
        ctx.fillStyle = pattern || '#fff7f7';
        ctx.fillRect(sweepX, rowY, eraseGapPx, rowHeight);

        // Clean wraparound erase at left start
        if (currentPos * stepX + eraseGapPx > (colWidth - 12)) {
          const wrapW = (currentPos * stepX + eraseGapPx) - (colWidth - 12);
          ctx.fillRect(colX + 10, rowY, wrapW, rowHeight);
        }

        // Draw Trace: Crisp high-contrast dark-slate #0f172a
        ctx.strokeStyle = isLeadOff ? '#94a3b8' : '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        let isDrawing = false;

        // Segment A: 0 to currentPos
        for (let i = 0; i < currentPos; i++) {
          const sampleIdx = writeIdx - currentPos + i;
          let val = buffer.getSample(sampleIdx);
          if (leadConfig.invert) val = -val;

          const px = colX + 10 + i * stepX;
          const py = baselineY - val * scaleY;

          if (!isDrawing) {
            ctx.moveTo(px, py);
            isDrawing = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();

        // Segment B: from currentPos + eraseGap to visibleSamples
        const resumeIdx = Math.min(visibleSamples, currentPos + Math.ceil(eraseGapPx / Math.max(0.001, stepX)));
        ctx.beginPath();
        isDrawing = false;
        for (let i = resumeIdx; i < visibleSamples; i++) {
          const sampleIdx = writeIdx - currentPos + i;
          let val = buffer.getSample(sampleIdx);
          if (leadConfig.invert) val = -val;

          const px = colX + 10 + i * stepX;
          const py = baselineY - val * scaleY;

          if (!isDrawing) {
            ctx.moveTo(px, py);
            isDrawing = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Draw Continuous Lead II Rhythm Strip at Bottom (in 4x3 mode)
    if (hasRhythmStrip) {
      const rhythmY = padding + mainGridH + 8;
      const rhythmBaselineY = rhythmY + rhythmHeight / 2.0;
      const lead2Buffer = buffers['II'];
      const isLead2Off = !!leadOffWarnings['II'];

      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = '#0369a1';
      ctx.fillText('II (Continuous Rhythm Strip)', padding + 6, rhythmY + 14);

      if (isLead2Off) {
        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 9.5px system-ui, sans-serif';
        ctx.fillText('LEAD OFF', padding + 160, rhythmY + 14);
      }

      if (lead2Buffer && availableW > 20) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(padding, rhythmY, availableW, rhythmHeight);
        ctx.clip();

        const rhythmTotalSec = availableW / (paperSpeed * pxPerMm);
        const rhythmVisibleSamples = Math.max(1, Math.round(rhythmTotalSec * 500));
        const rhythmStepX = availableW / rhythmVisibleSamples;

        const writeIdx = lead2Buffer.getWriteIndex();
        const currentPos = writeIdx % rhythmVisibleSamples;
        const sweepX = padding + currentPos * rhythmStepX;

        // Erase gap
        ctx.fillStyle = pattern || '#fff7f7';
        ctx.fillRect(sweepX, rhythmY, eraseGapPx + 5, rhythmHeight);

        if (currentPos * rhythmStepX + eraseGapPx + 5 > availableW) {
          const wrapW = (currentPos * rhythmStepX + eraseGapPx + 5) - availableW;
          ctx.fillRect(padding, rhythmY, wrapW, rhythmHeight);
        }

        // Waveform: Crisp high-contrast dark-slate #0f172a
        ctx.strokeStyle = isLead2Off ? '#94a3b8' : '#0f172a';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        let isDrawing = false;
        for (let i = 0; i < currentPos; i++) {
          const val = lead2Buffer.getSample(writeIdx - currentPos + i);
          const px = padding + i * rhythmStepX;
          const py = rhythmBaselineY - val * scaleY;
          if (!isDrawing) {
            ctx.moveTo(px, py);
            isDrawing = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();

        const resumeIdx = Math.min(
          rhythmVisibleSamples,
          currentPos + Math.ceil((eraseGapPx + 5) / Math.max(0.001, rhythmStepX))
        );
        ctx.beginPath();
        isDrawing = false;
        for (let i = resumeIdx; i < rhythmVisibleSamples; i++) {
          const val = lead2Buffer.getSample(writeIdx - currentPos + i);
          const px = padding + i * rhythmStepX;
          const py = rhythmBaselineY - val * scaleY;
          if (!isDrawing) {
            ctx.moveTo(px, py);
            isDrawing = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. Digital Calipers Overlay (if active)
    if (calipersActive) {
      const c1X = padding + caliperX1 * availableW;
      const c2X = padding + caliperX2 * availableW;

      // Caliper 1 Line (Amber/Gold)
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(c1X, padding);
      ctx.lineTo(c1X, cssHeight - padding);
      ctx.stroke();

      // Caliper 2 Line (Cyan/Sky)
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.9)';
      ctx.beginPath();
      ctx.moveTo(c2X, padding);
      ctx.lineTo(c2X, cssHeight - padding);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Span Arrow & Measurement Box
      const minX = Math.min(c1X, c2X);
      const maxX = Math.max(c1X, c2X);
      const deltaPx = maxX - minX;
      const deltaMm = deltaPx / pxPerMm;
      const deltaMs = Math.round((deltaMm / paperSpeed) * 1000);
      const bpm = deltaMs > 20 ? Math.round(60000 / deltaMs) : 0;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      const boxW = 125;
      const boxH = 22;
      const boxX = Math.max(padding, Math.min(cssWidth - padding - boxW, minX + (deltaPx - boxW) / 2));
      const boxY = padding + 4;

      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${deltaMs} ms | ${bpm} bpm`, boxX + 8, boxY + 15);
    }

    ctx.restore();
  }, [
    buffers,
    calipersActive,
    caliperX1,
    caliperX2,
    columns,
    hasRhythmStrip,
    leadOffWarnings,
    numCols,
    numRows,
    paperSpeed,
    selectedLeadId,
    voltageGain,
  ]);

  // Animation Loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderFrame();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderFrame]);

  // Resize handler with ResizeObserver
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const wrapper = canvasWrapperRef.current;
      if (!canvas || !wrapper) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = wrapper.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const newW = Math.round(rect.width * dpr);
      const newH = Math.round(rect.height * dpr);
      if (canvas.width !== newW || canvas.height !== newH) {
        canvas.width = newW;
        canvas.height = newH;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (canvasWrapperRef.current) {
      observer.observe(canvasWrapperRef.current);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle click on canvas to select lead or drag calipers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!calipersActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 10;
    const availableW = rect.width - padding * 2;

    const c1X = padding + caliperX1 * availableW;
    const c2X = padding + caliperX2 * availableW;

    if (Math.abs(x - c1X) < 15) {
      setDraggingCaliper('c1');
    } else if (Math.abs(x - c2X) < 15) {
      setDraggingCaliper('c2');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!calipersActive || !draggingCaliper) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 10;
    const availableW = rect.width - padding * 2;

    const norm = Math.max(0.02, Math.min(0.98, (x - padding) / availableW));
    if (draggingCaliper === 'c1') {
      setCaliperX1(norm);
    } else {
      setCaliperX2(norm);
    }
  };

  const handleMouseUp = () => {
    setDraggingCaliper(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (calipersActive) return; // Don't change selection while measuring
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = 10;
    const availableW = rect.width - padding * 2;
    const availableH = rect.height - padding * 2;
    const rhythmHeight = hasRhythmStrip ? Math.min(95, Math.max(70, availableH * 0.20)) : 0;
    const mainGridH = hasRhythmStrip ? availableH - rhythmHeight - 8 : availableH;

    if (hasRhythmStrip && y > padding + mainGridH) {
      setSelectedLeadId('II');
      return;
    }

    const colWidth = availableW / numCols;
    const rowHeight = mainGridH / numRows;

    const colIdx = Math.floor((x - padding) / colWidth);
    const rowIdx = Math.floor((y - padding) / rowHeight);

    if (colIdx >= 0 && colIdx < numCols && rowIdx >= 0 && rowIdx < numRows) {
      const selected = columns[colIdx][rowIdx].name;
      setSelectedLeadId(selected);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#fff7f7] overflow-hidden select-none flex flex-col">
      {/* Static Sub-Header Ribbon Toolbar ABOVE the canvas (Inside Flex Flow - Zero Canvas Floating Overlap!) */}
      <div className="h-9 px-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-10 select-none gap-2 text-xs">
        {/* Left: Mode Context Indicator */}
        <div className="flex items-center space-x-1.5 text-slate-700 min-w-0">
          <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-bold tracking-tight text-[11px] truncate">
            {isSplitMode ? '12L Terpadu (2 Kolom x 6 Baris)' : 'Monitor EKG 12-Sadapan'}
          </span>
          <span className="text-slate-400 text-[10px] font-mono hidden md:inline">
            ({paperSpeed} mm/s, {voltageGain} mm/mV)
          </span>
        </div>

        {/* Right: Ribbon Controls */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0 overflow-x-auto">
          {/* Paper Speed */}
          <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px] sm:text-[11px]">
            <button
              onClick={() => setPaperSpeed(25)}
              className={`px-1.5 py-0.5 rounded transition ${
                paperSpeed === 25 ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kecepatan Kertas: 25 mm/s"
            >
              25 mm/s
            </button>
            <button
              onClick={() => setPaperSpeed(50)}
              className={`px-1.5 py-0.5 rounded transition ${
                paperSpeed === 50 ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kecepatan Kertas: 50 mm/s"
            >
              50 mm/s
            </button>
          </div>

          {/* Voltage Gain */}
          <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px] sm:text-[11px]">
            <button
              onClick={() => setVoltageGain(5)}
              className={`px-1.5 py-0.5 rounded transition ${
                voltageGain === 5 ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Voltase: 5 mm/mV"
            >
              5
            </button>
            <button
              onClick={() => setVoltageGain(10)}
              className={`px-1.5 py-0.5 rounded transition ${
                voltageGain === 10 ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Voltase: 10 mm/mV (Standar)"
            >
              10
            </button>
            <button
              onClick={() => setVoltageGain(20)}
              className={`px-1.5 py-0.5 rounded transition ${
                voltageGain === 20 ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Voltase: 20 mm/mV"
            >
              20
            </button>
          </div>

          {/* Layout: Standard 12L / Cabrera */}
          <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px] sm:text-[11px]">
            <button
              onClick={() => setLayoutFormat('standard')}
              className={`px-1.5 py-0.5 rounded transition ${
                layoutFormat === 'standard' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Susunan Standar 12 Sadapan"
            >
              {isSplitMode ? '12L' : 'Standar'}
            </button>
            <button
              onClick={() => setLayoutFormat('cabrera')}
              className={`px-1.5 py-0.5 rounded transition ${
                layoutFormat === 'cabrera' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Susunan Cabrera (Hexaksial Anatomis: aVL, I, -aVR, II, aVF, III)"
            >
              {isSplitMode ? 'Cab' : 'Cabrera'}
            </button>
          </div>

          {/* Digital Calipers Toggle */}
          <button
            onClick={() => setCalipersActive(!calipersActive)}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition border ${
              calipersActive
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Nyalakan / Matikan Kaliper Digital"
          >
            <Ruler className="w-3 h-3" />
            <span>Kaliper</span>
          </button>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div ref={canvasWrapperRef} className="flex-1 w-full h-full relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="block cursor-pointer absolute inset-0"
          title={calipersActive ? 'Geser garis kaliper untuk mengukur interval' : 'Klik sadapan untuk inspeksi lebih detail'}
        />
      </div>
    </div>
  );
};
