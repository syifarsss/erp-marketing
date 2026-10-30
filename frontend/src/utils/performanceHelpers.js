/**
 * Performance Tracking helper utilities.
 * Pure functions — no React dependencies.
 */

/**
 * Format a rupiah value as rb/jt/M with Indonesian decimal comma.
 * @param {number|string} value
 * @returns {string}
 */
export const formatRevenue = (value) => {
  const num = parseFloat(value) || 0;
  if (num === 0) return 'Rp 0';
  if (num < 1_000_000) return `Rp ${Math.round(num / 1000)} rb`;
  if (num < 1_000_000_000) return `Rp ${(num / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  return `Rp ${(num / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
};

/**
 * Convert target_revenue stored in miliar rupiah to rupiah penuh.
 * @param {number|string} miliar
 * @returns {number}
 */
export const convertTargetToRupiah = (miliar) => {
  return (parseFloat(miliar) || 0) * 1_000_000_000;
};

/**
 * Calculate achievement percentage. Returns null when target is 0.
 * @param {number|string} realisasi
 * @param {number|string} target
 * @returns {number|null}
 */
export const calcPersen = (realisasi, target) => {
  const t = parseFloat(target) || 0;
  const r = parseFloat(realisasi) || 0;
  if (t === 0) return null;
  return parseFloat(((r / t) * 100).toFixed(1));
};

/**
 * Calculate remaining target (can be negative if exceeded).
 * @param {number|string} target
 * @param {number|string} realisasi
 * @returns {number}
 */
export const calcSisa = (target, realisasi) => {
  return (parseFloat(target) || 0) - (parseFloat(realisasi) || 0);
};

/**
 * Get status label and color from achievement percentage.
 * @param {number|null} persen
 * @returns {{ text: string, color: string }}
 */
export const getStatusLabel = (persen) => {
  if (persen === null) return { text: '-', color: 'var(--text-muted)' };
  if (persen >= 70) return { text: 'Di jalur', color: 'var(--accent-green)' };
  if (persen >= 50) return { text: 'Perlu dorong', color: '#f59e0b' };
  return { text: 'Tertinggal', color: 'var(--accent-red)' };
};
