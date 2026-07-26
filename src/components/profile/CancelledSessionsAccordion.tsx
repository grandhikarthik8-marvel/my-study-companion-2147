import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { restoreSession } from "@/services/studyService";
import type { StudySession } from "@/types";

export function CancelledSessionsAccordion({ sessions }: { sessions: StudySession[] }) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleRestore(id: string) {
    setBusyId(id);
    try {
      await restoreSession(id);
      await queryClient.invalidateQueries();
      toast.success("Session restored", { description: "Goals, streaks and reports were updated." });
    } catch (error) {
      toast.error("Could not restore session", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="p-2">
      <Accordion type="single" collapsible>
        <AccordionItem value="cancelled" className="border-none">
          <AccordionTrigger className="px-3 text-sm">
            Recently cancelled sessions ({sessions.length})
          </AccordionTrigger>
          <AccordionContent className="space-y-3 px-3">
            <p className="text-xs text-muted-foreground">
              Cancelled sessions can be restored for 24 hours.
            </p>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing cancelled in the last 24 hours.</p>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{s.subject_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Cancelled {s.cancelled_at ? format(new Date(s.cancelled_at), "MMM d, h:mm a") : "-"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="min-h-11 shrink-0"
                    disabled={busyId === s.id}
                    onClick={() => handleRestore(s.id)}
                  >
                    {busyId === s.id ? "Restoring…" : "Restore"}
                  </Button>
                </div>
              ))
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
