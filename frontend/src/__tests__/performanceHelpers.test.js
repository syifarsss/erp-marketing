import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  formatRevenue,
  convertJutaToRupiah,
  calcTargetRevenue,
  calcPersen,
  calcSisa,
  getStatusLabel
} from '../utils/performanceHelpers';

// ─── Property-Based Tests ────────────────────────────────────────────────────

describe('Property 1: calcTargetRevenue — formula target_project × harga_per_project', () => {
  it('returns target_project × harga_per_project for all non-zero tp', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.double({ min: 0, max: 1e12, noNaN: true }),
        (tp, hpp) => {
          expect(calcTargetRevenue(tp, hpp)).toBeCloseTo(tp * hpp, 0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 0 when target_project is 0', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1e12, noNaN: true }), (hpp) => {
        expect(calcTargetRevenue(0, hpp)).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 1b: convertJutaToRupiah — unit conversion', () => {
  it('always equals juta * 1_000_000 for all juta >= 0', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 999999, noNaN: true }), (juta) => {
        expect(convertJutaToRupiah(juta)).toBeCloseTo(juta * 1_000_000, 0);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: calcPersen — no division by zero', () => {
  it('returns null for all r when target = 0', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1e12, noNaN: true }), (r) => {
        expect(calcPersen(r, 0)).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('returns correct formula result for t > 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e12, noNaN: true }),
        fc.double({ min: 0.01, max: 1e12, noNaN: true }),
        (r, t) => {
          const result = calcPersen(r, t);
          const expected = parseFloat(((r / t) * 100).toFixed(1));
          expect(result).toBeCloseTo(expected, 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: bar progress never exceeds 100%', () => {
  it('Math.min(calcPersen(r, t), 100) <= 100 for all r >= 0, t > 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e12, noNaN: true }),
        fc.double({ min: 0.01, max: 1e12, noNaN: true }),
        (r, t) => {
          const persen = calcPersen(r, t);
          expect(Math.min(persen, 100)).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 4: getStatusLabel — consistent thresholds', () => {
  it('returns correct label for all percentage ranges', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 200, noNaN: true }), (p) => {
        const label = getStatusLabel(p);
        if (p >= 70) expect(label.text).toBe('Di jalur');
        else if (p >= 50) expect(label.text).toBe('Perlu dorong');
        else expect(label.text).toBe('Tertinggal');
      }),
      { numRuns: 100 }
    );
  });

  it('returns dash for null input', () => {
    expect(getStatusLabel(null).text).toBe('-');
  });
});

describe('Property 5: formatRevenue — correct threshold', () => {
  it('values < 1_000_000 contain "rb"', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1000, max: 999_999 }), (v) => {
        expect(formatRevenue(v)).toContain('rb');
      }),
      { numRuns: 100 }
    );
  });

  it('values >= 1_000_000 and < 1_000_000_000 contain "jt"', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1_000_000, max: 999_999_999 }), (v) => {
        expect(formatRevenue(v)).toContain('jt');
      }),
      { numRuns: 100 }
    );
  });

  it('values >= 1_000_000_000 contain "M"', () => {
    fc.assert(
      fc.property(fc.double({ min: 1_000_000_000, max: 1e12, noNaN: true }), (v) => {
        expect(formatRevenue(v)).toContain('M');
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Unit Tests (Example-Based) ──────────────────────────────────────────────

describe('formatRevenue — example cases', () => {
  it('returns "Rp 0" for 0', () => expect(formatRevenue(0)).toBe('Rp 0'));
  it('formats thousands as rb', () => expect(formatRevenue(500_000)).toContain('500 rb'));
  it('formats millions as jt', () => expect(formatRevenue(1_500_000)).toContain('1,5 jt'));
  it('formats billions as M', () => expect(formatRevenue(2_500_000_000)).toContain('2,5 M'));
});

describe('calcPersen — example cases', () => {
  it('returns null for zero target', () => expect(calcPersen(0, 0)).toBeNull());
  it('returns 70 for 7B / 10B', () => expect(calcPersen(7_000_000_000, 10_000_000_000)).toBe(70.0));
  it('returns 100 for equal values', () => expect(calcPersen(5, 5)).toBe(100.0));
  it('returns >100 when realisasi exceeds target', () => expect(calcPersen(12, 10)).toBe(120.0));
});

describe('calcSisa — example cases', () => {
  it('returns positive sisa', () => expect(calcSisa(10_000_000_000, 7_000_000_000)).toBe(3_000_000_000));
  it('returns negative sisa when exceeded', () => expect(calcSisa(10_000_000_000, 12_000_000_000)).toBe(-2_000_000_000));
  it('returns 0 when equal', () => expect(calcSisa(5, 5)).toBe(0));
});

describe('getStatusLabel — example cases', () => {
  it('null → dash', () => expect(getStatusLabel(null).text).toBe('-'));
  it('70 → Di jalur', () => expect(getStatusLabel(70).text).toBe('Di jalur'));
  it('69.9 → Perlu dorong', () => expect(getStatusLabel(69.9).text).toBe('Perlu dorong'));
  it('50 → Perlu dorong', () => expect(getStatusLabel(50).text).toBe('Perlu dorong'));
  it('49.9 → Tertinggal', () => expect(getStatusLabel(49.9).text).toBe('Tertinggal'));
  it('0 → Tertinggal', () => expect(getStatusLabel(0).text).toBe('Tertinggal'));
});

describe('calcTargetRevenue — example cases', () => {
  it('returns 0 when target_project is 0', () => expect(calcTargetRevenue(0, 5_000_000_000)).toBe(0));
  it('returns tp × hpp', () => expect(calcTargetRevenue(4, 2_500_000_000)).toBe(10_000_000_000));
  it('returns 0 when harga is 0', () => expect(calcTargetRevenue(5, 0)).toBe(0));
});

describe('convertJutaToRupiah — example cases', () => {
  it('converts 1 juta → 1_000_000', () => expect(convertJutaToRupiah(1)).toBe(1_000_000));
  it('converts 2500 juta → 2_500_000_000', () => expect(convertJutaToRupiah(2500)).toBe(2_500_000_000));
  it('converts 0 → 0', () => expect(convertJutaToRupiah(0)).toBe(0));
});
