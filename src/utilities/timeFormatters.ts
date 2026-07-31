/** All durations in this app are stored and computed in exact seconds. */

/** Canonical display format: HH:MM:SS (never rounded to minutes). */
export function formatStopwatch(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

/** Alias kept for readability at call sites. */
export const formatDuration = formatStopwatch;

/** Formats a goal expressed in minutes, still shown as HH:MM:SS. */
export function formatMinutes(totalMinutes: number): string {
  return formatStopwatch(totalMinutes * 60);
}
