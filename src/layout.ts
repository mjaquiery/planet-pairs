export interface GridFit {
  cols: number;
  rows: number;
  /** Item width in px; height is width × aspect. */
  width: number;
}

/**
 * Find the column count that lets `count` items of the given aspect
 * (height / width) be as large as possible inside `w`×`h`, with `gap`
 * spacing between items. Only layouts that fill every row exactly are
 * considered, unless none exist.
 */
export function fitGrid(count: number, w: number, h: number, gap: number, aspect: number): GridFit {
  let best: GridFit = { cols: 1, rows: count, width: 0 };
  const evenOnly = Array.from({ length: count }, (_, i) => i + 1).some(
    (c) => count % c === 0 && c > 1 && c < count,
  );
  for (let cols = 1; cols <= count; cols++) {
    if (evenOnly && count % cols !== 0) continue;
    const rows = Math.ceil(count / cols);
    const byWidth = (w - gap * (cols - 1)) / cols;
    const byHeight = (h - gap * (rows - 1)) / rows / aspect;
    const width = Math.max(0, Math.floor(Math.min(byWidth, byHeight)));
    if (width > best.width) best = { cols, rows, width };
  }
  return best;
}
