import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, Play } from "lucide-react";
import { AppShell } from "@/components/common/AppShell";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CompanionPlaceholderCard } from "@/components/dashboard/CompanionPlaceholderCard";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";
import { RecentSessionsCard } from "@/components/dashboard/RecentSessionsCard";
import { TodayOverviewCard } from "@/components/dashboard/TodayOverviewCard";
import { Button } from "@/components/ui/button";
import { useGoals, useNotifications, useProfile, useSessions, useStreak } from "@/hooks/useStudyData";
import { studyOverview } from "@/services/statsService";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — My Study Companion" },
      { name: "description", content: "Your streak, goals and study activity at a glance." },
      { property: "og:title", content: "Dashboard — My Study Companion" },
      { property: "og:description", content: "Your streak, goals and study activity at a glance." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const goals = useGoals();
  const streak = useStreak();
  const sessions = useSessions();
  const notifications = useNotifications();

  const needsOnboarding = profile.isSuccess && (!profile.data || !profile.data.full_name);
  useEffect(() => {
    if (needsOnboarding) navigate({ to: "/onboarding", replace: true });
  }, [needsOnboarding, navigate]);

  const loading = profile.isLoading || goals.isLoading || sessions.isLoading;
  const all = sessions.data ?? [];
  const day = dayRange();
  const week = weekRange();
  const month = monthRange();

  const todayMinutes = totalMinutes(completedIn(all, day.from, day.to));
  const weekMinutes = totalMinutes(completedIn(all, week.from, week.to));
  const monthMinutes = totalMinutes(completedIn(all, month.from, month.to));
  const unread = (notifications.data ?? []).filter((n) => !n.is_read).length;

  return (
    <AppShell
      header={
        <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl">
              {profile.data?.avatar_url && profile.data.avatar_url.length <= 4
                ? profile.data.avatar_url
                : "🎓"}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Welcome back,</p>
              <h1 className="truncate text-lg font-bold text-foreground">
                {profile.data?.full_name || "Student"}!
              </h1>
            </div>
          </div>
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-foreground"
          >
            <Bell className="h-5 w-5" aria-hidden />
            {unread > 0 && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-destructive" />
            )}
          </Link>
        </header>
      }
    >
      {loading ? (
        <LoadingSpinner label="Loading your dashboard" />
      ) : (
        <>
          <CompanionPlaceholderCard />
          <TodayOverviewCard todayMinutes={todayMinutes} streak={streak.data?.current_streak ?? 0} />
          <GoalCard
            daily={buildProgress(todayMinutes, goals.data?.daily_goal_minutes ?? 120)}
            weekly={buildProgress(weekMinutes, goals.data?.weekly_goal_minutes ?? 840)}
            monthly={buildProgress(monthMinutes, goals.data?.monthly_goal_minutes ?? 3600)}
          />
          <HeatmapCard days={weeklyHeatmap(all)} />
          <RecentSessionsCard sessions={all.filter((s) => s.status === "COMPLETED").slice(0, 3)} />
        </>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
        <Button asChild className="pointer-events-auto min-h-12 rounded-full px-6 shadow-lg">
          <Link to="/session">
            <Play className="h-4 w-4" aria-hidden /> Start Study Session
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}
