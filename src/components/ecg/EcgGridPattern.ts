/**
 * Pre-rendered Clinical ECG Paper Grid Pattern
 * Creates a reusable CanvasPattern for 1mm and 5mm grid lines,
 * rendering authentic hospital-grade ivory-pink ECG paper.
 */
const patternCache = new Map<number, CanvasPattern>();

export function createEcgGridPattern(pxPerMm: number): CanvasPattern | null {
  const cached = patternCache.get(pxPerMm);
  if (cached) return cached;

  const tileSizeMm = 25; // 5 large boxes = 25 small boxes
  const tileSizePx = Math.round(tileSizeMm * pxPerMm);
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = tileSizePx;
  patternCanvas.height = tileSizePx;
  const pCtx = patternCanvas.getContext('2d');
  if (!pCtx) return null;

  // Hospital-grade authentic ivory-pink paper
  pCtx.fillStyle = '#fff7f7';
  pCtx.fillRect(0, 0, tileSizePx, tileSizePx);

  const minorColor = 'rgba(244, 63, 94, 0.28)';
  const majorColor = 'rgba(225, 29, 72, 0.72)';

  // 1. Draw 1mm Minor Grid Lines
  pCtx.lineWidth = 0.5;
  pCtx.strokeStyle = minorColor;
  pCtx.beginPath();
  for (let i = 0; i <= tileSizeMm; i++) {
    const pos = Math.round(i * pxPerMm) + 0.5;
    // Vertical
    pCtx.moveTo(pos, 0);
    pCtx.lineTo(pos, tileSizePx);
    // Horizontal
    pCtx.moveTo(0, pos);
    pCtx.lineTo(tileSizePx, pos);
  }
  pCtx.stroke();

  // 2. Draw 5mm Major Grid Lines
  pCtx.lineWidth = 1.0;
  pCtx.strokeStyle = majorColor;
  pCtx.beginPath();
  for (let i = 0; i <= tileSizeMm; i += 5) {
    const pos = Math.round(i * pxPerMm) + 0.5;
    // Vertical
    pCtx.moveTo(pos, 0);
    pCtx.lineTo(pos, tileSizePx);
    // Horizontal
    pCtx.moveTo(0, pos);
    pCtx.lineTo(tileSizePx, pos);
  }
  pCtx.stroke();

  const pattern = pCtx.createPattern(patternCanvas, 'repeat');
  if (pattern) {
    patternCache.set(pxPerMm, pattern);
  }
  return pattern;
}
