/**
 * VisualExemplarSvg: Precision ECG Grid Waveform Vector Renderer
 * Renders calibrated 1mm minor and 5mm major hospital pink grid lines,
 * neutral isoelectric dashed baseline, and crisp morphological wave vectors.
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React from 'react';
import { VisualExemplarItem } from '../../engine/clinical/thaler/thalerExemplarTypes';
import { useLocale } from '../../locales/useLocale';

interface VisualExemplarSvgProps {
  exemplar: VisualExemplarItem;
  width?: number | string;
  height?: number | string;
  showMarker?: boolean;
  className?: string;
}

export const VisualExemplarSvg: React.FC<VisualExemplarSvgProps> = ({
  exemplar,
  width = '100%',
  height = 90,
  showMarker = true,
  className = '',
}) => {
  const { locale } = useLocale();
  const patternId = `ecg-grid-${exemplar.id}`;

  return (
    <div className={`relative overflow-hidden rounded border border-rose-200 bg-[#fff9fa] select-none ${className}`}>
      <svg
        viewBox="0 0 200 100"
        className="w-full h-full block"
        style={{ width, height }}
      >
        <defs>
          {/* Minor 1mm grid (4 units) */}
          <pattern id={`${patternId}-minor`} width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#ffe4e6" strokeWidth="0.5" />
          </pattern>
          {/* Major 5mm grid (20 units) */}
          <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill={`url(#${patternId}-minor)`} />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f43f5e" strokeWidth="0.8" opacity="0.45" />
          </pattern>
        </defs>

        {/* Paper Grid Background */}
        <rect width="200" height="100" fill={`url(#${patternId})`} />

        {/* Neutral Isoelectric Baseline (Dashed) */}
        <line
          x1="0"
          y1={exemplar.isoelectricY}
          x2="200"
          y2={exemplar.isoelectricY}
          stroke="#94a3b8"
          strokeWidth="0.8"
          strokeDasharray="3,2"
          opacity="0.75"
        />

        {/* Crisp Waveform Vector */}
        <path
          d={exemplar.waveformSvgPath}
          fill="none"
          stroke="#09090b"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Morphological Feature Callout Spotlight */}
        {showMarker && exemplar.calloutMarker && (
          <g>
            {exemplar.calloutMarker.type === 'CIRCLE_SPOTLIGHT' && (
              <>
                <circle
                  cx={exemplar.calloutMarker.cx}
                  cy={exemplar.calloutMarker.cy}
                  r={exemplar.calloutMarker.radius || 9}
                  fill="#f43f5e"
                  fillOpacity="0.22"
                  stroke="#e11d48"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
                <circle
                  cx={exemplar.calloutMarker.cx}
                  cy={exemplar.calloutMarker.cy}
                  r="2.5"
                  fill="#e11d48"
                />
              </>
            )}
            {exemplar.calloutMarker.type === 'BRACKET_INTERVAL' && (
              <rect
                x={exemplar.calloutMarker.cx - (exemplar.calloutMarker.width || 20) / 2}
                y={exemplar.calloutMarker.cy - (exemplar.calloutMarker.height || 10) / 2}
                width={exemplar.calloutMarker.width || 20}
                height={exemplar.calloutMarker.height || 10}
                fill="#3b82f6"
                fillOpacity="0.18"
                stroke="#2563eb"
                strokeWidth="1.2"
                strokeDasharray="2,1"
                rx="2"
              />
            )}
            <text
              x={exemplar.calloutMarker.cx}
              y={Math.max(12, exemplar.calloutMarker.cy - 10)}
              fontSize="7.5"
              fontFamily="monospace"
              fontWeight="bold"
              fill="#be123c"
              textAnchor="middle"
            >
              {locale === 'en' && exemplar.calloutMarker.labelEn ? exemplar.calloutMarker.labelEn : exemplar.calloutMarker.label}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
