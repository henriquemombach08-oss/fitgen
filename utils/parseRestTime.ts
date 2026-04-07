/**
 * Parses a rest time string into seconds.
 * Examples: "30s" → 30, "60s" → 60, "1min" → 60, "90s" → 90,
 *           "2min" → 120, "1:30" → 90, "2-3min" → 150 (average)
 * Fallback: 60
 */
export function parseRestTime(str: string): number {
  if (!str) return 60;

  const s = str.trim().toLowerCase();

  // Format "1:30" → minutes:seconds
  const colonMatch = s.match(/^(\d+):(\d{2})$/);
  if (colonMatch) {
    return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  }

  // Format "2-3min" → average
  const rangeMinMatch = s.match(/^(\d+)-(\d+)\s*min/);
  if (rangeMinMatch) {
    const avg = (parseInt(rangeMinMatch[1]) + parseInt(rangeMinMatch[2])) / 2;
    return Math.round(avg * 60);
  }

  // Format "30-60s" → average
  const rangeSecMatch = s.match(/^(\d+)-(\d+)\s*s/);
  if (rangeSecMatch) {
    const avg = (parseInt(rangeSecMatch[1]) + parseInt(rangeSecMatch[2])) / 2;
    return Math.round(avg);
  }

  // Format "90s", "30s"
  const secMatch = s.match(/^(\d+)\s*s(?:eg)?(?:undo)?s?$/);
  if (secMatch) {
    return parseInt(secMatch[1]);
  }

  // Format "1min", "2min", "1.5min"
  const minMatch = s.match(/^(\d+(?:\.\d+)?)\s*min/);
  if (minMatch) {
    return Math.round(parseFloat(minMatch[1]) * 60);
  }

  // Plain number — assume seconds
  const numMatch = s.match(/^(\d+)$/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }

  return 60;
}
