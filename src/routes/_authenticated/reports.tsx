import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/common/AppShell";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AnalyticsBarChart } from "@/components/reports/AnalyticsBarChart";
import { SubjectSummaryCards } from "@/components/reports/SubjectSummaryCards";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessions } from "@/hooks/useStudyData";
import { periodStats, type StatsPeriod } from "@/services/statsService";
import { formatStopwatch } from "@/utilities/timeFormatters";


export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — My Study Companion" },
      { name: "description", content: "See where your study time goes and which subject needs focus." },
      { property: "og:title", content: "Reports — My Study Companion" },
      { property: "og:description", content: "See where your study time goes." },
    ],
  }),
  component: ReportsPage,
});

type Period = StatsPeriod;

function ReportsPage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const sessions = useSessions();

  // Shared calculation service — identical logic to the Dashboard.
  const stats = periodStats(sessions.data ?? [], period);

  return (
    <AppShell
      header={
        <header className="mb-4">
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Your study analytics.</p>
        </header>
      }
    >
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="min-h-11">Daily</TabsTrigger>
          <TabsTrigger value="weekly" className="min-h-11">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" className="min-h-11">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>

      {sessions.isLoading ? (
        <LoadingSpinner label="Crunching your numbers" />
      ) : (
        <>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total study time</p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-foreground">{formatStopwatch(stats.seconds)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.sessionCount} completed session{stats.sessionCount === 1 ? "" : "s"}
            </p>
          </Card>
          <AnalyticsBarChart data={stats.subjects} />
          <SubjectSummaryCards totals={stats.subjects} />
        </>
      )}
    </AppShell>
  );
}
