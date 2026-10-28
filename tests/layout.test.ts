import { describe, expect, it } from 'vitest';
import { fitGrid } from '../src/layout';

describe('fitGrid', () => {
  it('uses wide grids on landscape screens', () => {
    expect(fitGrid(12, 1000, 700, 10, 1.25)).toMatchObject({ cols: 4, rows: 3 });
    expect(fitGrid(8, 1000, 700, 10, 1.25)).toMatchObject({ cols: 4, rows: 2 });
    expect(fitGrid(4, 1000, 700, 10, 1.25)).toMatchObject({ cols: 2, rows: 2 });
  });

  it('uses tall grids on portrait screens', () => {
    expect(fitGrid(12, 700, 1000, 10, 1.25)).toMatchObject({ cols: 3, rows: 4 });
    expect(fitGrid(8, 700, 1000, 10, 1.25)).toMatchObject({ cols: 2, rows: 4 });
  });

  it('never makes cards overflow', () => {
    const { cols, rows, width } = fitGrid(12, 800, 600, 12, 1.25);
    expect(cols * width + (cols - 1) * 12).toBeLessThanOrEqual(800);
    expect(rows * width * 1.25 + (rows - 1) * 12).toBeLessThanOrEqual(600);
  });
});
