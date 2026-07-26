import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export function CompanionPlaceholderCard() {
  return (
    <Card
      className="relative overflow-hidden border-primary/30 p-5"
      style={{ backgroundImage: "var(--gradient-companion)" }}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/25">
          <Sparkles className="h-6 w-6 text-primary-foreground" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Virtual Study Companion</p>
          <p className="text-xs text-muted-foreground">Arriving in Sprint 4 — your buddy is on the way.</p>
        </div>
      </div>
    </Card>
  );
}
