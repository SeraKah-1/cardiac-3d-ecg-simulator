/**
 * AxisQuadrantWheel: Interactive Hexaxial Cardiac Axis Deconstruction
 * Reconstructs Einthoven's limb leads into a dynamic vector simulator.
 * Real-time QRS projection into Lead I (0°), Lead aVF (+90°), and Lead II (+60°).
 * Grounded in Dr. Malcolm S. Thaler's clinical curriculum.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Compass, RotateCcw, Info, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocale } from '../../locales/useLocale';

interface AxisQuadrantWheelProps {
  axisDegrees: number; // -180 to +180
  axisClassification?: string;
  onSelectAxis?: (degrees: number) => void;
  compact?: boolean;
}

interface MicroQrsWaveformProps {
  projection: number; // Value between -1.0 and +1.0
  label: string;
  isDecider?: boolean;
  statusText?: string;
}

const MicroQrsWaveform: React.FC<MicroQrsWaveformProps> = ({
  projection,
  label,
  isDecider = false,
  statusText: customStatusText,
}) => {
  // Clamp projection to [-1.0, 1.0]
  const p = Math.max(-1.0, Math.min(1.0, projection));
  const isIsoelectric = Math.abs(p) < 0.15;
  const isInverted = p < -0.15;

  // Generate SVG path for a representative QRS complex:
  // Baseline is at y = 14 (total height 28)
  const baseY = 14;
  const rAmp = Math.max(0, p * 11); // Upward deflection
  const sAmp = Math.max(0, -p * 11); // Downward deflection

  // Path: Isoelectric -> tiny q -> R peak -> S trough -> baseline
  const pathD = `M 2,${baseY} L 8,${baseY} L 10,${baseY + 1.5} L 14,${baseY - rAmp} L 18,${baseY + sAmp} L 20,${baseY - 0.5} L 26,${baseY}`;

  let statusText = customStatusText || (isInverted ? '(-)' : isIsoelectric ? '(+-)' : '(+)');
  let badgeStyle = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (isInverted) {
    badgeStyle = 'text-rose-700 bg-rose-50 border-rose-200';
  } else if (isIsoelectric) {
    badgeStyle = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  return (
    <div
      className={`flex items-center justify-between p-1.5 rounded border text-[11px] font-sans ${
        isDecider ? 'bg-amber-50/50 border-amber-300' : 'bg-stone-50 border-stone-200'
      }`}
    >
      <div className="flex items-center space-x-2">
        <span className="font-mono font-bold text-stone-800 text-xs w-7">{label}</span>
        <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0 overflow-visible">
          {/* Baseline reference */}
          <line x1="1" y1={baseY} x2="27" y2={baseY} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
          {/* Dynamic QRS line */}
          <path
            d={pathD}
            fill="none"
            stroke={isDecider ? '#d97706' : '#2563eb'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex items-center space-x-1.5">
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeStyle}`}>
          {statusText}
        </span>
        <span className="text-[10px] font-mono text-stone-400 w-10 text-right">
          {p > 0 ? `+${p.toFixed(2)}` : p.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export const AxisQuadrantWheel: React.FC<AxisQuadrantWheelProps> = ({
  axisDegrees,
  axisClassification,
  onSelectAxis,
  compact = false,
}) => {
  const { t } = useLocale();
  const [activeDegrees, setActiveDegrees] = useState<number>(axisDegrees);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showCauses, setShowCauses] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Sync state if external patient case changes
  useEffect(() => {
    setActiveDegrees(axisDegrees);
  }, [axisDegrees]);

  // Coordinate geometry for 260x260 SVG
  const center = 130;
  const radius = 95;

  // Convert degrees to radians for geometric calculations
  // On standard hexaxial system:
  // 0 deg is at 3 o'clock (Lead I)
  // +90 deg is at 6 o'clock (Lead aVF)
  // -90 deg is at 12 o'clock
  // +-180 deg is at 9 o'clock
  const angleRad = (activeDegrees * Math.PI) / 180;
  const knobX = center + radius * Math.cos(angleRad);
  const knobY = center + radius * Math.sin(angleRad);

  // Drag interaction handler
  const handlePointerMove = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      if (!isDragging && e.type !== 'pointerdown') return;
      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const clientX = 'clientX' in e ? e.clientX : 0;
      const clientY = 'clientY' in e ? e.clientY : 0;

      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);

      let deg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      // Snap to +-180 cleanly
      if (deg > 180) deg -= 360;
      if (deg < -180) deg += 360;

      setActiveDegrees(deg);
      if (onSelectAxis) {
        onSelectAxis(deg);
      }
    },
    [isDragging, onSelectAxis]
  );

  useEffect(() => {
    const handleGlobalPointerUp = () => setIsDragging(false);
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (isDragging) handlePointerMove(e);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isDragging, handlePointerMove]);

  // Real-Time Scalar Waveform Projections:
  // Lead I: cos(theta - 0 deg)
  // Lead aVF: cos(theta - 90 deg) = sin(theta)
  // Lead II: cos(theta - 60 deg)
  const pI = Math.cos(angleRad);
  const paVF = Math.sin(angleRad);
  const pII = Math.cos(angleRad - (60 * Math.PI) / 180);

  // Active Zone Classification:
  let currentZone: 'NORMAL' | 'LAD_PHYSIO' | 'LAD_PATHO' | 'RAD' | 'EXTREME' = 'NORMAL';
  let zoneTitle = t.axisWheel.normalZone;
  let zoneBadgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let zoneDesc = t.axisWheel.zoneDescriptions.normal;

  if (activeDegrees >= 0 && activeDegrees <= 90) {
    currentZone = 'NORMAL';
    zoneTitle = t.axisWheel.normalZone;
    zoneBadgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    zoneDesc = t.axisWheel.zoneDescriptions.normal;
  } else if (activeDegrees < 0 && activeDegrees >= -30) {
    currentZone = 'LAD_PHYSIO';
    zoneTitle = t.axisWheel.physLADZone;
    zoneBadgeStyle = 'bg-blue-50 text-blue-800 border-blue-300';
    zoneDesc = t.axisWheel.zoneDescriptions.physLad;
  } else if (activeDegrees < -30 && activeDegrees >= -90) {
    currentZone = 'LAD_PATHO';
    zoneTitle = t.axisWheel.pathLADZone;
    zoneBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
    zoneDesc = t.axisWheel.zoneDescriptions.pathLad;
  } else if (activeDegrees > 90 && activeDegrees <= 180) {
    currentZone = 'RAD';
    zoneTitle = t.axisWheel.radZone;
    zoneBadgeStyle = 'bg-orange-50 text-orange-800 border-orange-300';
    zoneDesc = t.axisWheel.zoneDescriptions.rad;
  } else {
    currentZone = 'EXTREME';
    zoneTitle = t.axisWheel.extremeZone;
    zoneBadgeStyle = 'bg-rose-50 text-rose-800 border-rose-300';
    zoneDesc = t.axisWheel.zoneDescriptions.extreme;
  }

  const isSyncedWithPatient = activeDegrees === axisDegrees;

  const getStatusText = (proj: number) => {
    if (proj < -0.15) return t.axisWheel.negative;
    if (Math.abs(proj) < 0.15) return t.axisWheel.biphasic;
    return t.axisWheel.positive;
  };

  return (
    <div className="bg-white rounded-lg border border-stone-200 p-3 shadow-xs font-sans">
      {/* 1. Header: Axis Title & Synchronization Indicator */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
        <div className="flex items-center space-x-1.5">
          <Compass className="w-4 h-4 text-purple-600" />
          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            {t.axisWheel.wheelTitle}
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          {!isSyncedWithPatient && (
            <button
              onClick={() => setActiveDegrees(axisDegrees)}
              className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-sans font-bold rounded shadow-2xs transition cursor-pointer"
              title={t.axisWheel.syncTooltip(axisDegrees)}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.axisWheel.syncBtn} ({axisDegrees > 0 ? `+${axisDegrees}` : axisDegrees}°)</span>
            </button>
          )}
          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${zoneBadgeStyle}`}>
            {activeDegrees > 0 ? `+${activeDegrees}` : activeDegrees}°
          </span>
        </div>
      </div>

      {/* 2. SVG Wheel Dial & Real-Time Projections */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {/* SVG Dial (Interactive Draggable Hexaxial System) */}
        <div className="relative shrink-0 select-none">
          <svg
            ref={svgRef}
            width="240"
            height="240"
            viewBox="0 0 260 260"
            className="cursor-crosshair touch-none"
            onPointerDown={(e) => {
              setIsDragging(true);
              handlePointerMove(e);
            }}
          >
            {/* Quadrant Wedges */}
            {/* 1. Normal (0° to +90°): Green */}
            <path
              d={`M ${center},${center} L ${center + radius},${center} A ${radius},${radius} 0 0,1 ${center},${center + radius} Z`}
              fill="#ecfdf5"
              stroke="#a7f3d0"
              strokeWidth="1"
            />
            {/* 2. Physiologic LAD (0° to -30°): Light Blue */}
            <path
              d={`M ${center},${center} L ${center + radius},${center} A ${radius},${radius} 0 0,0 ${
                center + radius * Math.cos((-30 * Math.PI) / 180)
              },${center + radius * Math.sin((-30 * Math.PI) / 180)} Z`}
              fill="#eff6ff"
              stroke="#bfdbfe"
              strokeWidth="1"
            />
            {/* 3. Pathologic LAD (-30° to -90°): Amber */}
            <path
              d={`M ${center},${center} L ${
                center + radius * Math.cos((-30 * Math.PI) / 180)
              },${center + radius * Math.sin((-30 * Math.PI) / 180)} A ${radius},${radius} 0 0,0 ${center},${
                center - radius
              } Z`}
              fill="#fffbeb"
              stroke="#fde68a"
              strokeWidth="1"
            />
            {/* 4. Extreme Northwest Axis (-90° to -180°): Rose */}
            <path
              d={`M ${center},${center} L ${center},${center - radius} A ${radius},${radius} 0 0,0 ${
                center - radius
              },${center} Z`}
              fill="#fff1f2"
              stroke="#fecdd3"
              strokeWidth="1"
            />
            {/* 5. RAD (+90° to +180°): Orange */}
            <path
              d={`M ${center},${center} L ${center - radius},${center} A ${radius},${radius} 0 0,0 ${center},${
                center + radius
              } Z`}
              fill="#fff7ed"
              stroke="#fed7aa"
              strokeWidth="1"
            />

            {/* Hexaxial Axes (12 Spokes Every 30°) */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const x2 = center + (radius + 8) * Math.cos(rad);
              const y2 = center + (radius + 8) * Math.sin(rad);
              return (
                <line
                  key={deg}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="#cbd5e1"
                  strokeWidth={deg % 90 === 0 ? '1.5' : '1'}
                  strokeDasharray={deg % 90 === 0 ? 'none' : '2,2'}
                />
              );
            })}

            {/* Quadrant Zone Labels */}
            <text x="175" y="165" fontSize="8.5" fill="#047857" fontWeight="bold" textAnchor="middle">
              {t.axisWheel.svgNormal}
            </text>
            <text x="195" y="118" fontSize="7.5" fill="#1d4ed8" fontWeight="bold" textAnchor="middle">
              {t.axisWheel.svgPhysLad}
            </text>
            <text x="175" y="75" fontSize="7.5" fill="#b45309" fontWeight="bold" textAnchor="middle">
              {t.axisWheel.svgPathLad}
            </text>
            <text x="85" y="75" fontSize="8" fill="#be123c" fontWeight="bold" textAnchor="middle">
              {t.axisWheel.svgExtreme}
            </text>
            <text x="85" y="165" fontSize="8.5" fill="#c2410c" fontWeight="bold" textAnchor="middle">
              {t.axisWheel.svgRad}
            </text>

            {/* Standard Anatomical Leads */}
            <text x="248" y="133" fontSize="9.5" fill="#1e293b" fontWeight="bold" textAnchor="start">
              I (0°)
            </text>
            <text x="130" y="254" fontSize="9.5" fill="#1e293b" fontWeight="bold" textAnchor="middle">
              aVF (+90°)
            </text>
            <text x="188" y="228" fontSize="9.5" fill="#b45309" fontWeight="bold" textAnchor="start">
              II (+60°)
            </text>
            <text x="72" y="228" fontSize="9" fill="#64748b" textAnchor="end">
              III (+120°)
            </text>
            <text x="188" y="38" fontSize="9" fill="#64748b" textAnchor="start">
              aVL (-30°)
            </text>
            <text x="72" y="38" fontSize="9" fill="#be123c" fontWeight="bold" textAnchor="end">
              aVR (-150°)
            </text>

            {/* Interactive Vector Line */}
            <line
              x1={center}
              y1={center}
              x2={knobX}
              y2={knobY}
              stroke="#7c3aed"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Center Pivot Point */}
            <circle cx={center} cy={center} r="4" fill="#7c3aed" />

            {/* Draggable Knob */}
            <circle
              cx={knobX}
              cy={knobY}
              r="9"
              fill="#7c3aed"
              stroke="#ffffff"
              strokeWidth="2.5"
              className="hover:scale-125 transition-transform"
            />
          </svg>
          <div className="text-[10px] text-center text-stone-600 pt-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>{t.axisWheel.dragHint}</span>
          </div>
        </div>

        {/* Dynamic Projections & Deconstruction Panel */}
        <div className="flex-1 w-full space-y-2 text-xs">
          {/* Active Quadrant Status Card */}
          <div className="bg-stone-50 rounded p-2 border border-stone-200">
            <div className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-wider">
              {t.axisWheel.selectedVectorLabel}
            </div>
            <div className="font-bold text-stone-900 text-xs sm:text-[13px] pt-0.5">
              {zoneTitle}
            </div>
            <div className="text-[11px] text-stone-600 pt-0.5">
              {zoneDesc}
            </div>
          </div>

          {/* Micro-Waveform Projections: Lead I, Lead aVF, Lead II */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between">
              <span>{t.axisWheel.realtimeProjectionTitle}</span>
              <span className="text-stone-600 font-normal">{t.axisWheel.frontalMorphologyTitle}</span>
            </div>
            <MicroQrsWaveform projection={pI} label="Lead I" statusText={getStatusText(pI)} />
            <MicroQrsWaveform projection={paVF} label="Lead aVF" statusText={getStatusText(paVF)} />
            <MicroQrsWaveform
              projection={pII}
              label="Lead II"
              statusText={getStatusText(pII)}
              isDecider={activeDegrees < 0 && activeDegrees >= -90}
            />
          </div>

          {/* Aturan Emas Lead II: Penentu LAD Fisiologis vs Patologis */}
          {activeDegrees < 0 && activeDegrees >= -90 && (
            <div className="bg-amber-50 p-2 rounded border border-amber-200 text-[11px] text-amber-900 leading-snug">
              <span className="font-bold">{t.axisWheel.thalerKeyTitle}</span>
              {pII > 0 ? (
                <span>{t.axisWheel.thalerLeadIIPositive}</span>
              ) : (
                <span>{t.axisWheel.thalerLeadIINegative}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Slider Control & Quick Presets */}
      <div className="pt-2 border-t border-stone-100 mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-stone-500 shrink-0 w-12">-180°</span>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={activeDegrees}
            onChange={(e) => setActiveDegrees(parseInt(e.target.value, 10))}
            className="w-full accent-purple-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
          />
          <span className="text-[10px] font-mono text-stone-500 shrink-0 w-12 text-right">+180°</span>
        </div>

        {/* Quick Presets for Rapid Clinical Deconstruction */}
        <div className="flex flex-wrap gap-1 items-center justify-between text-[10px]">
          <span className="text-stone-600 font-semibold">{t.axisWheel.quickPresetsLabel}</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveDegrees(60)}
              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 cursor-pointer"
            >
              {t.axisWheel.presets.normal}
            </button>
            <button
              onClick={() => setActiveDegrees(-15)}
              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded border border-blue-200 cursor-pointer"
            >
              {t.axisWheel.presets.phys}
            </button>
            <button
              onClick={() => setActiveDegrees(-60)}
              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 cursor-pointer"
            >
              {t.axisWheel.presets.lafb}
            </button>
            <button
              onClick={() => setActiveDegrees(120)}
              className="px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded border border-orange-200 cursor-pointer"
            >
              {t.axisWheel.presets.rad}
            </button>
            <button
              onClick={() => setActiveDegrees(-120)}
              className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded border border-rose-200 cursor-pointer"
            >
              {t.axisWheel.presets.extreme}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Collapsible Clinical Causes matching Active Zone */}
      <div className="pt-2 border-t border-stone-100 mt-2">
        <button
          onClick={() => setShowCauses(!showCauses)}
          className="w-full flex items-center justify-between text-[11px] font-semibold text-purple-700 hover:text-purple-800 py-0.5 cursor-pointer"
        >
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            {t.axisWheel.fullEtiologyTitle}
          </span>
          {showCauses ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showCauses && (
          <div className="pt-1.5 space-y-1.5 text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded border border-stone-200 mt-1">
            <div>
              <strong className="text-emerald-800">{t.axisWheel.etiologies.normalTitle}</strong>
              <span className="text-stone-700"> {t.axisWheel.etiologies.normalBody}</span>
            </div>
            <div>
              <strong className="text-blue-800">{t.axisWheel.etiologies.physTitle}</strong>
              <span className="text-stone-700"> {t.axisWheel.etiologies.physBody}</span>
            </div>
            <div>
              <strong className="text-amber-800">{t.axisWheel.etiologies.pathTitle}</strong>
              <span className="text-stone-700"> {t.axisWheel.etiologies.pathBody}</span>
            </div>
            <div>
              <strong className="text-orange-800">{t.axisWheel.etiologies.radTitle}</strong>
              <span className="text-stone-700"> {t.axisWheel.etiologies.radBody}</span>
            </div>
            <div>
              <strong className="text-rose-800">{t.axisWheel.etiologies.extremeTitle}</strong>
              <span className="text-stone-700"> {t.axisWheel.etiologies.extremeBody}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
