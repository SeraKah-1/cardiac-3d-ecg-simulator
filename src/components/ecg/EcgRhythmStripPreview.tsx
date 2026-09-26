import React, { useRef, useEffect, useCallback } from 'react';
import { LeadId } from '../../engine/biophysics/types';
import { EcgRingBuffer } from './EcgRingBuffer';
import { createEcgGridPattern } from './EcgGridPattern';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Activity } from 'lucide-react';
import { useLocale } from '../../locales/useLocale';

interface EcgRhythmStripPreviewProps {
  buffers: Record<LeadId, EcgRingBuffer>;
  leads?: LeadId[];
}

export const EcgRhythmStripPreview: React.FC<EcgRhythmStripPreviewProps> = ({
  buffers,
  leads = ['I', 'II', 'V2'],
}) => {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const paperSpeed = useSimulationStore((s) => s.paperSpeedMmPerSec);
  const voltageGain = useSimulationStore((s) => s.voltageGainMmPerMv);
  const leadOffWarnings = useSimulationStore((s) => s.leadOffWarnings);
  const selectedLeadId = useSimulationStore((s) => s.selectedLeadId);
  const setSelectedLeadId = useSimulationStore((s) => s.setSelectedLeadId);

  const pxPerMm = 3.78;

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

    // Draw background grid
    const pattern = createEcgGridPattern(pxPerMm);
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, cssWidth, cssHeight);
    } else {
      ctx.fillStyle = '#fff7f7';
      ctx.fillRect(0, 0, cssWidth, cssHeight);
    }

    const padding = 6;
    const availableW = cssWidth - padding * 2;
    const availableH = cssHeight - padding * 2;

    if (availableW <= 20 || availableH <= 20) {
      ctx.restore();
      return;
    }

    const stripCount = leads.length;
    const stripHeight = availableH / stripCount;
    const scaleY = voltageGain * pxPerMm;
    const eraseGapPx = 20;

    for (let i = 0; i < stripCount; i++) {
      const leadId = leads[i];
      const buffer = buffers[leadId];
      const rowY = padding + i * stripHeight;
      const baselineY = rowY + stripHeight / 2.0;
      const isLeadOff = !!leadOffWarnings[leadId];
      const isSelected = selectedLeadId === leadId;

      // Divider line between strips
      if (i > 0) {
        ctx.strokeStyle = 'rgba(225, 29, 72, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, rowY);
        ctx.lineTo(cssWidth - padding, rowY);
        ctx.stroke();
      }

      // Selection highlight
      if (isSelected) {
        ctx.fillStyle = 'rgba(2, 132, 199, 0.04)';
        ctx.fillRect(padding, rowY, availableW, stripHeight);
      }

      // Calibration pulse at left edge (1 mV high, 0.20s wide)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      const calX = padding + 4;
      const calH = 1.0 * scaleY;
      const calW = 5.0 * pxPerMm;
      ctx.moveTo(calX, baselineY);
      ctx.lineTo(calX + 2, baselineY);
      ctx.lineTo(calX + 2, baselineY - calH);
      ctx.lineTo(calX + 2 + calW, baselineY - calH);
      ctx.lineTo(calX + 2 + calW, baselineY);
      ctx.lineTo(calX + 4 + calW, baselineY);
      ctx.stroke();

      // Lead Title Badge
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = isSelected ? '#0284c7' : '#1e293b';
      ctx.fillText(leadId, calX + calW + 10, baselineY - 8);

      // Lead-Off Warning Banner
      if (isLeadOff) {
        ctx.fillStyle = 'rgba(225, 29, 72, 0.9)';
        ctx.font = 'bold 9.5px system-ui, sans-serif';
        ctx.fillText('LEAD OFF', calX + calW + 36, baselineY - 8);
      }

      if (!buffer) continue;

      const traceStartX = calX + calW + 80;
      const traceW = cssWidth - padding - traceStartX;
      if (traceW <= 10) continue;

      // Clip strictly within the current strip
      ctx.save();
      ctx.beginPath();
      ctx.rect(traceStartX, rowY, traceW, stripHeight);
      ctx.clip();

      const totalDurationSec = traceW / (paperSpeed * pxPerMm);
      const visibleSamples = Math.max(1, Math.round(totalDurationSec * 500));
      const stepX = traceW / visibleSamples;

      const writeIdx = buffer.getWriteIndex();
      const currentPos = writeIdx % visibleSamples;
      const sweepX = traceStartX + currentPos * stepX;

      // Erase gap ahead of sweep
      ctx.fillStyle = pattern || '#fff7f7';
      ctx.fillRect(sweepX, rowY + 1, eraseGapPx, stripHeight - 2);

      if (currentPos * stepX + eraseGapPx > traceW) {
        const wrapW = (currentPos * stepX + eraseGapPx) - traceW;
        ctx.fillRect(traceStartX, rowY + 1, wrapW, stripHeight - 2);
      }

      // Waveform trace
      ctx.strokeStyle = isLeadOff ? '#94a3b8' : '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      let isDrawing = false;

      for (let s = 0; s < currentPos; s++) {
        const sampleIdx = writeIdx - currentPos + s;
        const val = buffer.getSample(sampleIdx);
        const px = traceStartX + s * stepX;
        const py = baselineY - val * scaleY;

        if (!isDrawing) {
          ctx.moveTo(px, py);
          isDrawing = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Segment B (after erase gap)
      const resumeIdx = Math.min(visibleSamples, currentPos + Math.ceil(eraseGapPx / Math.max(0.001, stepX)));
      ctx.beginPath();
      isDrawing = false;
      for (let s = resumeIdx; s < visibleSamples; s++) {
        const sampleIdx = writeIdx - currentPos + s;
        const val = buffer.getSample(sampleIdx);
        const px = traceStartX + s * stepX;
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

    ctx.restore();
  }, [buffers, leads, leadOffWarnings, paperSpeed, selectedLeadId, voltageGain]);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderFrame();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderFrame]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
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
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const stripH = rect.height / leads.length;
    const idx = Math.floor(y / stripH);
    if (idx >= 0 && idx < leads.length) {
      setSelectedLeadId(leads[idx]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-36 bg-[#fff7f7] border-t border-slate-200 shadow-inner overflow-hidden select-none"
    >
      <div className="absolute top-1.5 right-3 z-10 flex items-center space-x-2 text-[10px] bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-mono">
        <Activity className="w-3 h-3 text-rose-500 animate-pulse" />
        <span>{t.canvas.rhythmStripLiveTitle}</span>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="block cursor-pointer w-full h-full"
        title={t.canvas.clickLeadToSelect}
      />
    </div>
  );
};
