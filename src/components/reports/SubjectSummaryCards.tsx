import { Card } from "@/components/ui/card";
import type { SubjectTotal } from "@/types";
import { formatMinutes } from "@/utilities/timeFormatters";

export function SubjectSummaryCards({ totals }: { totals: SubjectTotal[] }) {
  const most = totals[0];
  const least = totals.length > 1 ? totals[totals.length - 1] : undefined;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Most studied</p>
        <p className="text-lg font-semibold text-foreground">{most?.subject ?? "—"}</p>
        <p className="text-xs text-success">{most ? formatMinutes(most.minutes) : "No data yet"}</p>
      </Card>
      <Card className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommended focus</p>
        <p className="text-lg font-semibold text-foreground">{least?.subject ?? "—"}</p>
        <p className="text-xs text-warning">
          {least ? `Only ${formatMinutes(least.minutes)} — give it more time` : "Track more subjects"}
        </p>
      </Card>
    </div>
  );
}
