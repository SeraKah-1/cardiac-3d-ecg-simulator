/**
 * ClinicalFormula: Sub-millisecond KaTeX Mathematical Formula Renderer
 * Produces crisp Computer Modern Roman mathematical notation for clinical EKG formulas.
 * Zero cumulative layout shift (CLS = 0).
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { useMemo } from 'react';
import katex from 'katex';

interface ClinicalFormulaProps {
  tex: string;
  displayMode?: boolean;
  className?: string;
  ariaLabel?: string;
}

const escapeHtml = (str: string): string => {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
};

export const ClinicalFormula: React.FC<ClinicalFormulaProps> = ({
  tex,
  displayMode = false,
  className = '',
  ariaLabel,
}) => {
  const html = useMemo(() => {
    if (!tex || typeof tex !== 'string' || !tex.trim()) {
      return '';
    }
    try {
      return katex.renderToString(tex, {
        displayMode,
        throwOnError: false,
        errorColor: '#be123c',
        output: 'htmlAndMathml',
        strict: 'warn',
        trust: false,
      });
    } catch (err) {
      console.warn('KaTeX parsing error:', err);
      return `<span class="text-rose-600 font-mono text-xs">${escapeHtml(tex)}</span>`;
    }
  }, [tex, displayMode]);

  if (!html) return null;

  return (
    <span
      className={`clinical-latex-math ${displayMode ? 'block my-1.5 text-center' : 'inline-block align-middle'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      {...(ariaLabel ? { 'aria-label': ariaLabel, role: 'math' } : { role: 'math' })}
    />
  );
};
