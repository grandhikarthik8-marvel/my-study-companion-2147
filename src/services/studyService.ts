import { supabase } from "@/integrations/supabase/client";
import type {
  AchievementBadge,
  AppNotification,
  Goals,
  Profile,
  StudySession,
  StudyStreak,
} from "@/types";
import { nextStreak } from "@/utilities/streakUtils";
import { completedIn, dayRange, totalSeconds } from "@/utilities/goalCalculators";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export async function fetchProfile(): Promise<Profile | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function fetchGoals(): Promise<Goals | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase.from("goals").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data as Goals | null;
}

export async function upsertGoals(values: {
  daily_goal_minutes: number;
  weekly_goal_minutes: number;
  monthly_goal_minutes: number;
}): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("goals")
    .upsert({ user_id: userId, ...values, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function fetchStreak(): Promise<StudyStreak | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("study_streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as StudyStreak | null;
}

export async function fetchSessions(): Promise<StudySession[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as StudySession[];
}

export async function fetchBadges(): Promise<AchievementBadge[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("achievement_badges")
    .select("*")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AchievementBadge[];
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function markAllNotificationsRead(): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

export async function createNotification(input: {
  notification_type: string;
  title: string;
  message: string;
}): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from("notifications").insert({ user_id: userId, ...input });
  if (error) throw error;
}

/* ---------------- Session lifecycle ---------------- */

export async function startSession(subjectName: string): Promise<StudySession> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("study_sessions")
    .insert({
      user_id: userId,
      subject_name: subjectName,
      start_time: new Date().toISOString(),
      status: "ACTIVE",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as StudySession;
}

export async function setSessionStatus(
  sessionId: string,
  status: "ACTIVE" | "PAUSED",
  pausedSeconds: number,
): Promise<void> {
  const { error } = await supabase
    .from("study_sessions")
    .update({ status, paused_duration_seconds: Math.max(0, Math.floor(pausedSeconds)) })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function cancelSession(
  sessionId: string,
  elapsedSeconds = 0,
  pausedSeconds = 0,
): Promise<void> {
  // Persist the exact elapsed seconds so a restore within 24h keeps the real duration.
  const { error } = await supabase
    .from("study_sessions")
    .update({
      status: "CANCELLED",
      cancelled_at: new Date().toISOString(),
      end_time: new Date().toISOString(),
      duration_seconds: Math.max(0, Math.floor(elapsedSeconds)),
      paused_duration_seconds: Math.max(0, Math.floor(pausedSeconds)),
    })
    .eq("id", sessionId);
  if (error) throw error;
  await recalculateMetrics();
}

export interface CompletionResult {
  durationSeconds: number;
  newBadges: { key: string; name: string }[];
}

export async function completeSession(
  sessionId: string,
  elapsedSeconds: number,
  pausedSeconds: number,
): Promise<CompletionResult> {
  const { error } = await supabase
    .from("study_sessions")
    .update({
      status: "COMPLETED",
      end_time: new Date().toISOString(),
      duration_seconds: Math.max(0, Math.floor(elapsedSeconds)),
      paused_duration_seconds: Math.max(0, Math.floor(pausedSeconds)),
    })
    .eq("id", sessionId);
  if (error) throw error;

  const newBadges = await recalculateMetrics();
  return { durationSeconds: Math.max(0, Math.floor(elapsedSeconds)), newBadges };
}

export async function restoreSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("study_sessions")
    .update({ status: "COMPLETED", restored_at: new Date().toISOString(), cancelled_at: null })
    .eq("id", sessionId);
  if (error) throw error;
  await recalculateMetrics();
}

export async function fetchRecentlyCancelled(): Promise<StudySession[]> {
  const userId = await requireUserId();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "CANCELLED")
    .gte("cancelled_at", cutoff)
    .order("cancelled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StudySession[];
}

/* ------- Streaks, goals & badge evaluation (runs after completion/restore) ------- */

const BADGES = {
  first_step: { name: "First Step", level: "Bronze" },
  consistency_master: { name: "Consistency Master", level: "Silver" },
  goal_crusher: { name: "Goal Crusher", level: "Gold" },
} as const;

export async function recalculateMetrics(): Promise<{ key: string; name: string }[]> {
  const userId = await requireUserId();
  const [sessions, goals, streak, badges] = await Promise.all([
    fetchSessions(),
    fetchGoals(),
    fetchStreak(),
    fetchBadges(),
  ]);

  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const { from, to } = dayRange();
  const todaySeconds = totalSeconds(completedIn(sessions, from, to));
  const todayMinutes = todaySeconds / 60;

  // Streak update
  let currentStreak = streak?.current_streak ?? 0;
  if (todaySeconds >= 60) {
    const next = nextStreak({
      current_streak: streak?.current_streak ?? 0,
      longest_streak: streak?.longest_streak ?? 0,
      last_study_date: streak?.last_study_date ?? null,
    });
    currentStreak = next.current_streak;
    const { error } = await supabase
      .from("study_streaks")
      .upsert(
        { user_id: userId, ...next, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (error) throw error;
  }

  // Badge evaluation
  const owned = new Set(badges.map((b) => b.badge_key));
  const unlock: (keyof typeof BADGES)[] = [];
  if (completed.length >= 1 && !owned.has("first_step")) unlock.push("first_step");
  if (currentStreak >= 7 && !owned.has("consistency_master")) unlock.push("consistency_master");
  const dailyGoal = goals?.daily_goal_minutes ?? 120;
  if (todayMinutes >= dailyGoal && !owned.has("goal_crusher")) unlock.push("goal_crusher");

  const unlocked: { key: string; name: string }[] = [];
  for (const key of unlock) {
    const meta = BADGES[key];
    const { error } = await supabase.from("achievement_badges").insert({
      user_id: userId,
      badge_key: key,
      badge_name: meta.name,
      badge_level: meta.level,
    });
    if (!error) {
      unlocked.push({ key, name: meta.name });
      await createNotification({
        notification_type: "BADGE",
        title: `Badge unlocked: ${meta.name}`,
        message: `You earned the ${meta.level} "${meta.name}" badge. Keep the momentum going!`,
      });
    }
  }

  if (todayMinutes >= dailyGoal) {
    const alreadyToday = (await fetchNotifications()).some(
      (n) =>
        n.notification_type === "GOAL" &&
        new Date(n.created_at) >= from &&
        new Date(n.created_at) <= to,
    );
    if (!alreadyToday) {
      await createNotification({
        notification_type: "GOAL",
        title: "Daily goal reached!",
        message: `You hit your daily target of ${dailyGoal} minutes. Fantastic work.`,
      });
    }
  }

  return unlocked;
}
