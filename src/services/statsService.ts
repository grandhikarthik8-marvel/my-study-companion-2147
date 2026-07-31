import type { GoalProgress, Goals, HeatmapDay, StudySession, SubjectTotal } from "@/types";
import {
  buildProgress,
  completedIn,
  dayRange,
  monthRange,
  subjectTotals,
  totalSeconds,
  weekRange,
  weeklyHeatmap,
} from "@/utilities/goalCalculators";

export type StatsPeriod = "daily" | "weekly" | "monthly";

export interface PeriodStats {
  period: StatsPeriod;
  from: Date;
  to: Date;
  sessions: StudySession[];
  seconds: number;
  sessionCount: number;
  subjects: SubjectTotal[];
}

export function periodRange(period: StatsPeriod) {
  if (period === "daily") return dayRange();
  if (period === "weekly") return weekRange();
  return monthRange();
}

/**
 * Single shared calculation entry point used by BOTH Dashboard and Reports so
 * their numbers can never diverge. Only COMPLETED sessions are included.
 */
export function periodStats(sessions: StudySession[], period: StatsPeriod): PeriodStats {
  const { from, to } = periodRange(period);
  const scoped = completedIn(sessions, from, to);
  return {
    period,
    from,
    to,
    sessions: scoped,
    seconds: totalSeconds(scoped),
    sessionCount: scoped.length,
    subjects: subjectTotals(scoped),
  };
}

export interface StudyOverview {
  today: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
  daily: GoalProgress;
  weekly: GoalProgress;
  monthly: GoalProgress;
  heatmap: HeatmapDay[];
  recent: StudySession[];
}

export const DEFAULT_GOALS = {
  daily_goal_minutes: 120,
  weekly_goal_minutes: 840,
  monthly_goal_minutes: 3600,
};

export function studyOverview(
  sessions: StudySession[],
  goals: Pick<Goals, "daily_goal_minutes" | "weekly_goal_minutes" | "monthly_goal_minutes"> | null,
): StudyOverview {
  const today = periodStats(sessions, "daily");
  const week = periodStats(sessions, "weekly");
  const month = periodStats(sessions, "monthly");
  const g = goals ?? DEFAULT_GOALS;

  return {
    today,
    week,
    month,
    daily: buildProgress(today.seconds, g.daily_goal_minutes),
    weekly: buildProgress(week.seconds, g.weekly_goal_minutes),
    monthly: buildProgress(month.seconds, g.monthly_goal_minutes),
    heatmap: weeklyHeatmap(sessions),
    recent: sessions
      .filter((s) => s.status === "COMPLETED")
      .sort(
        (a, b) =>
          new Date(b.end_time ?? b.start_time).getTime() -
          new Date(a.end_time ?? a.start_time).getTime(),
      )
      .slice(0, 3),
  };
}
