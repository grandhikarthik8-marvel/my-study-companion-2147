import { differenceInCalendarDays, format } from "date-fns";
import type { StudyStreak } from "@/types";

/** Returns the next streak values after a qualifying study day (today). */
export function nextStreak(streak: Pick<StudyStreak, "current_streak" | "longest_streak" | "last_study_date">) {
  const today = new Date();
  const last = streak.last_study_date ? new Date(`${streak.last_study_date}T00:00:00`) : null;
  const diff = last ? differenceInCalendarDays(today, last) : null;

  let current = 1;
  if (diff === 0) current = Math.max(1, streak.current_streak);
  else if (diff === 1) current = streak.current_streak + 1;

  return {
    current_streak: current,
    longest_streak: Math.max(current, streak.longest_streak),
    last_study_date: format(today, "yyyy-MM-dd"),
  };
}
