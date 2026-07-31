import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  isSameDay,
  subDays,
} from "date-fns";
import type { GoalProgress, HeatmapDay, StudySession, SubjectTotal } from "@/types";

/** Only COMPLETED sessions count. Cancelled sessions are excluded everywhere. */
export function completedIn(sessions: StudySession[], from: Date, to: Date): StudySession[] {
  return sessions.filter((s) => {
    if (s.status !== "COMPLETED") return false;
    const ref = new Date(s.end_time ?? s.start_time);
    return ref >= from && ref <= to;
  });
}

/** Exact seconds — the single source of truth for every calculation. */
export function totalSeconds(sessions: StudySession[]): number {
  return sessions.reduce((acc, s) => acc + Math.max(0, s.duration_seconds), 0);
}

export function buildProgress(seconds: number, goalMinutes: number): GoalProgress {
  const goalSeconds = goalMinutes > 0 ? goalMinutes * 60 : 60;
  return { seconds, goalSeconds, percent: Math.floor((seconds / goalSeconds) * 100) };
}

export function dayRange(d = new Date()) {
  return { from: startOfDay(d), to: endOfDay(d) };
}
export function weekRange(d = new Date()) {
  return { from: startOfWeek(d, { weekStartsOn: 1 }), to: endOfWeek(d, { weekStartsOn: 1 }) };
}
export function monthRange(d = new Date()) {
  return { from: startOfMonth(d), to: endOfMonth(d) };
}

export function subjectTotals(sessions: StudySession[]): SubjectTotal[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    map.set(s.subject_name, (map.get(s.subject_name) ?? 0) + Math.max(0, s.duration_seconds));
  }
  return [...map.entries()]
    .map(([subject, seconds]) => ({ subject, seconds }))
    .sort((a, b) => b.seconds - a.seconds);
}

export function weeklyHeatmap(sessions: StudySession[]): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const seconds = totalSeconds(
      sessions.filter(
        (s) => s.status === "COMPLETED" && isSameDay(new Date(s.end_time ?? s.start_time), date),
      ),
    );
    let intensity: HeatmapDay["intensity"] = 0;
    if (seconds > 0) intensity = 1;
    if (seconds >= 30 * 60) intensity = 2;
    if (seconds >= 60 * 60) intensity = 3;
    if (seconds >= 120 * 60) intensity = 4;
    days.push({ date: format(date, "yyyy-MM-dd"), label: format(date, "EEEEE"), seconds, intensity });
  }
  return days;
}
