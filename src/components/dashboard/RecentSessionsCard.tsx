import { format } from "date-fns";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { StudySession } from "@/types";
import { formatDuration } from "@/utilities/timeFormatters";

export function RecentSessionsCard({ sessions }: { sessions: StudySession[] }) {
  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-sm font-semibold text-foreground">Recent sessions</h2>
      {sessions.length === 0 ? (
        <p className="text-xs text-muted-foreground">No completed sessions yet. Start your first one!</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary">
                <BookOpen className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{s.subject_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(s.end_time ?? s.start_time), "MMM d, h:mm a")}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-primary">
                {formatDuration(s.duration_seconds)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
