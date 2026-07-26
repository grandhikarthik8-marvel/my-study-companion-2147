import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertGoals } from "@/services/studyService";
import type { Goals } from "@/types";

export function GoalSettingsForm({ goals }: { goals: Goals | null }) {
  const queryClient = useQueryClient();
  const [daily, setDaily] = useState("120");
  const [weekly, setWeekly] = useState("840");
  const [monthly, setMonthly] = useState("3600");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!goals) return;
    setDaily(String(goals.daily_goal_minutes));
    setWeekly(String(goals.weekly_goal_minutes));
    setMonthly(String(goals.monthly_goal_minutes));
  }, [goals]);

  const values = [daily, weekly, monthly].map((v) => Number(v));
  const invalid = values.some((v) => !Number.isFinite(v) || v <= 0);

  async function handleSave() {
    if (invalid) {
      toast.error("Goals must be positive numbers of minutes.");
      return;
    }
    setSaving(true);
    try {
      await upsertGoals({
        daily_goal_minutes: values[0],
        weekly_goal_minutes: values[1],
        monthly_goal_minutes: values[2],
      });
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goals updated");
    } catch (error) {
      toast.error("Could not save goals", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-sm font-semibold text-foreground">Study goals (minutes)</h2>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="daily">Daily</Label>
          <Input id="daily" inputMode="numeric" value={daily} onChange={(e) => setDaily(e.target.value.replace(/[^0-9]/g, ""))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weekly">Weekly</Label>
          <Input id="weekly" inputMode="numeric" value={weekly} onChange={(e) => setWeekly(e.target.value.replace(/[^0-9]/g, ""))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="monthly">Monthly</Label>
          <Input id="monthly" inputMode="numeric" value={monthly} onChange={(e) => setMonthly(e.target.value.replace(/[^0-9]/g, ""))} />
        </div>
      </div>
      <Button className="min-h-12 w-full" disabled={saving || invalid} onClick={handleSave}>
        {saving ? "Saving…" : "Save goals"}
      </Button>
    </Card>
  );
}
