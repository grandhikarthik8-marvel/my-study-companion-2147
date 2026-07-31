import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatStopwatch } from "@/utilities/timeFormatters";

export function TodayOverviewCard({
  todaySeconds,
  streak,
}: {
  todaySeconds: number;
  streak: number;
}) {
  return (
    <Card className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Studied today</p>
        <p className="mt-1 truncate font-mono text-3xl font-bold tabular-nums text-foreground">
          {formatStopwatch(todaySeconds)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-warning/15 px-3 py-2 text-warning">
        <Flame className="h-4 w-4" aria-hidden />
        <span className="text-sm font-semibold">{streak} day{streak === 1 ? "" : "s"}</span>
      </div>
    </Card>
  );
}
