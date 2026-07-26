import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/common/AppShell";
import { CancelledSessionsAccordion } from "@/components/profile/CancelledSessionsAccordion";
import { GoalSettingsForm } from "@/components/profile/GoalSettingsForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useBadges, useCancelledSessions, useGoals, useProfile } from "@/hooks/useStudyData";
import { updateProfile } from "@/services/studyService";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — My Study Companion" },
      { name: "description", content: "Update your details, study goals and restore cancelled sessions." },
      { property: "og:title", content: "Profile — My Study Companion" },
      { property: "og:description", content: "Update your details and study goals." },
    ],
  }),
  component: ProfilePage,
});

const AVATARS = ["🦉", "🚀", "📚", "🧠", "⭐", "🐱"];

function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useProfile();
  const goals = useGoals();
  const badges = useBadges();
  const cancelled = useCancelledSessions();

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setFullName(profile.data.full_name ?? "");
    setMobile(profile.data.mobile_number ?? "");
    if (profile.data.avatar_url && profile.data.avatar_url.length <= 4) setAvatar(profile.data.avatar_url);
  }, [profile.data]);

  async function handleSave() {
    if (fullName.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        mobile_number: mobile.trim() || null,
        avatar_url: avatar,
      });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Could not update profile", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell
      header={
        <header className="mb-4">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">{profile.data?.email}</p>
        </header>
      }
    >
      <Card className="space-y-4 p-5">
        <div className="space-y-2">
          <Label>Avatar</Label>
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
        <div className="space-y-1.5">
          <Label htmlFor="fullname">Full name</Label>
          <Input id="fullname" className="min-h-12" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mobile">Mobile number</Label>
          <Input
            id="mobile"
            className="min-h-12"
            inputMode="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>
        <Button className="min-h-12 w-full" disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </Card>

      <GoalSettingsForm goals={goals.data ?? null} />

      <Card className="space-y-3 p-5">
        <h2 className="text-sm font-semibold text-foreground">Badges</h2>
        {(badges.data ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No badges yet — your first session unlocks one.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(badges.data ?? []).map((b) => (
              <span key={b.id} className="rounded-full bg-secondary px-3 py-2 text-xs text-foreground">
                🏆 {b.badge_name} · {b.badge_level}
              </span>
            ))}
          </div>
        )}
      </Card>

      <CancelledSessionsAccordion sessions={cancelled.data ?? []} />

      <Button variant="destructive" className="min-h-12 w-full" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" aria-hidden /> Log out
      </Button>
    </AppShell>
  );
}
