import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GoalProgress } from "@/types";
import { formatStopwatch } from "@/utilities/timeFormatters";

function Row({ label, progress }: { label: string; progress: GoalProgress }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={progress.percent >= 100 ? "text-success" : "text-muted-foreground"}>
          {progress.percent}% {progress.percent >= 100 ? "Completed!" : ""}
        </span>
      </div>
      <Progress value={Math.min(100, progress.percent)} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {formatStopwatch(progress.seconds)} of {formatStopwatch(progress.goalSeconds)}
      </p>
    </div>
  );
}


export function GoalCard({
  daily,
  weekly,
  monthly,
}: {
  daily: GoalProgress;
  weekly: GoalProgress;
  monthly: GoalProgress;
}) {
  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-sm font-semibold text-foreground">Goal progress</h2>
      <Row label="Daily" progress={daily} />
      <Row label="Weekly" progress={weekly} />
      <Row label="Monthly" progress={monthly} />
    </Card>
  );
}
