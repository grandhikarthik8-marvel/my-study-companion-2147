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

export function completedIn(sessions: StudySession[], from: Date, to: Date): StudySession[] {
  return sessions.filter((s) => {
    if (s.status !== "COMPLETED") return false;
    const ref = new Date(s.end_time ?? s.start_time);
    return ref >= from && ref <= to;
  });
}

export function totalMinutes(sessions: StudySession[]): number {
  return sessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60;
}

export function buildProgress(minutes: number, goalMinutes: number): GoalProgress {
  const safeGoal = goalMinutes > 0 ? goalMinutes : 1;
  return { minutes, goalMinutes, percent: Math.round((minutes / safeGoal) * 100) };
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
    map.set(s.subject_name, (map.get(s.subject_name) ?? 0) + s.duration_seconds / 60);
  }
  return [...map.entries()]
    .map(([subject, minutes]) => ({ subject, minutes: Math.round(minutes) }))
    .sort((a, b) => b.minutes - a.minutes);
}

export function weeklyHeatmap(sessions: StudySession[]): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const minutes = Math.round(
      totalMinutes(
        sessions.filter(
          (s) => s.status === "COMPLETED" && isSameDay(new Date(s.end_time ?? s.start_time), date),
        ),
      ),
    );
    let intensity: HeatmapDay["intensity"] = 0;
    if (minutes > 0) intensity = 1;
    if (minutes >= 30) intensity = 2;
    if (minutes >= 60) intensity = 3;
    if (minutes >= 120) intensity = 4;
    days.push({ date: format(date, "yyyy-MM-dd"), label: format(date, "EEEEE"), minutes, intensity });
  }
  return days;
}
