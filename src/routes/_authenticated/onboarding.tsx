import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, upsertGoals } from "@/services/studyService";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — My Study Companion" },
      { name: "description", content: "Tell us your name and set your study targets to get started." },
      { property: "og:title", content: "Set up your profile — My Study Companion" },
      { property: "og:description", content: "Set your name, avatar and study targets." },
    ],
  }),
  component: OnboardingPage,
});

const AVATARS = ["🦉", "🚀", "📚", "🧠", "⭐", "🐱"];

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [daily, setDaily] = useState("2");
  const [weekly, setWeekly] = useState("14");
  const [monthly, setMonthly] = useState("60");
  const [saving, setSaving] = useState(false);

  const hours = [daily, weekly, monthly].map(Number);
  const invalid = fullName.trim().length < 2 || hours.some((h) => !Number.isFinite(h) || h <= 0);

  async function handleFinish() {
    if (invalid) {
      toast.error("Add your name and positive goal hours to continue.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatar,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      await upsertGoals({
        daily_goal_minutes: Math.round(hours[0] * 60),
        weekly_goal_minutes: Math.round(hours[1] * 60),
        monthly_goal_minutes: Math.round(hours[2] * 60),
      });
      await queryClient.invalidateQueries();
      toast.success("You're all set!");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error("Could not save your setup", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome aboard</h1>
          <p className="text-sm text-muted-foreground">A few details and your habit starts today.</p>
        </div>

        <Card className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" className="min-h-12" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Choose an avatar</Label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={avatar === a}
                  onClick={() => setAvatar(a)}
                  className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl transition-colors ${
                    avatar === a ? "bg-primary/25 ring-2 ring-primary" : "bg-secondary"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="text-sm font-semibold text-foreground">Your study targets (hours)</h2>
          <GoalInput id="d" label="Daily" value={daily} onChange={setDaily} />
          <GoalInput id="w" label="Weekly" value={weekly} onChange={setWeekly} />
          <GoalInput id="m" label="Monthly" value={monthly} onChange={setMonthly} />
        </Card>

        <Button className="min-h-12 w-full" disabled={saving || invalid} onClick={handleFinish}>
          {saving ? "Saving…" : "Start studying"}
        </Button>
      </div>
    </div>
  );
}

function GoalInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        className="min-h-12"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
      />
    </div>
  );
}
