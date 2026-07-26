import { Card } from "@/components/ui/card";
import type { HeatmapDay } from "@/types";
import { formatMinutes } from "@/utilities/timeFormatters";

const intensityClass: Record<HeatmapDay["intensity"], string> = {
  0: "bg-muted",
  1: "bg-primary/25",
  2: "bg-primary/45",
  3: "bg-primary/70",
  4: "bg-primary",
};

export function HeatmapCard({ days }: { days: HeatmapDay[] }) {
  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-sm font-semibold text-foreground">Weekly activity</h2>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <div
              className={`h-10 w-full rounded-lg ${intensityClass[d.intensity]}`}
              title={`${d.date}: ${formatMinutes(d.minutes)}`}
              aria-label={`${d.date}: ${formatMinutes(d.minutes)} studied`}
            />
            <span className="text-[10px] text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
