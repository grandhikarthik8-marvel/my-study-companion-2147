import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pause, Play, Square, X } from "lucide-react";
import { AppShell } from "@/components/common/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessions } from "@/hooks/useStudyData";
import { computeElapsedSeconds, totalPausedSeconds, useTimerStore } from "@/hooks/useTimer";
import {
  cancelSession,
  completeSession,
  setSessionStatus,
  startSession,
} from "@/services/studyService";
import { formatStopwatch } from "@/utilities/timeFormatters";

export const Route = createFileRoute("/_authenticated/session")({
  head: () => ({
    meta: [
      { title: "Study session — My Study Companion" },
      { name: "description", content: "Run a focused, tracked study session with pause and resume." },
      { property: "og:title", content: "Study session — My Study Companion" },
      { property: "og:description", content: "Run a focused, tracked study session." },
    ],
  }),
  component: SessionPage,
});

function SessionPage() {
  const queryClient = useQueryClient();
  const timer = useTimerStore();
  const sessions = useSessions();
  const [subject, setSubject] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (timer.status === "IDLE") return;
    const id = setInterval(() => useTimerStore.getState().tick(), 3000);
    return () => clearInterval(id);
  }, [timer.status]);

  const elapsed = useMemo(() => computeElapsedSeconds(timer), [timer, now]);

  const recentSubjects = useMemo(() => {
    const seen: string[] = [];
    for (const s of sessions.data ?? []) {
      if (!seen.includes(s.subject_name)) seen.push(s.subject_name);
      if (seen.length === 5) break;
    }
    return seen;
  }, [sessions.data]);

  async function handleStart() {
    const name = subject.trim();
    if (name.length < 2) {
      toast.error("Enter a subject name to start.");
      return;
    }
    setBusy(true);
    try {
      const created = await startSession(name);
      timer.begin(created.id, created.subject_name, created.start_time);
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success(`Studying ${name} — go!`);
    } catch (error) {
      toast.error("Could not start the session", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handlePauseResume() {
    if (!timer.sessionId) return;
    const pausing = timer.status === "ACTIVE";
    setBusy(true);
    try {
      if (pausing) timer.pause();
      else timer.resume();
      const state = useTimerStore.getState();
      await setSessionStatus(state.sessionId!, pausing ? "PAUSED" : "ACTIVE", totalPausedSeconds(state));
    } catch (error) {
      toast.error("Could not update the session", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleEnd() {
    if (!timer.sessionId) return;
    setBusy(true);
    try {
      const state = useTimerStore.getState();
      const result = await completeSession(
        state.sessionId!,
        computeElapsedSeconds(state),
        totalPausedSeconds(state),
      );
      timer.reset();
      await queryClient.invalidateQueries({ refetchType: "all" });
      toast.success("Session saved!", {
        description: `You studied ${formatStopwatch(result.durationSeconds)}.`,
      });
      for (const badge of result.newBadges) {
        toast.success(`🏆 Badge unlocked: ${badge.name}`);
      }
    } catch (error) {
      toast.error("Could not save the session", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!timer.sessionId) return;
    setBusy(true);
    try {
      const state = useTimerStore.getState();
      await cancelSession(
        state.sessionId!,
        computeElapsedSeconds(state),
        totalPausedSeconds(state),
      );
      timer.reset();
      await queryClient.invalidateQueries({ refetchType: "all" });
      toast("Session cancelled", { description: "You can restore it from Profile within 24 hours." });
    } catch (error) {
      toast.error("Could not cancel the session", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
      setConfirmCancel(false);
    }
  }

  const running = timer.status !== "IDLE";

  return (
    <AppShell
      header={
        <header className="mb-4">
          <h1 className="text-xl font-bold text-foreground">Study session</h1>
          <p className="text-sm text-muted-foreground">Track every focused minute.</p>
        </header>
      }
    >
      <Card className="space-y-4 p-5 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {running ? timer.subjectName : "Ready when you are"}
        </p>
        <p className="font-mono text-5xl font-bold tabular-nums text-foreground">
          {formatStopwatch(elapsed)}
        </p>
        {timer.status === "PAUSED" && <p className="text-xs text-warning">Paused</p>}
      </Card>

      {!running ? (
        <Card className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              className="min-h-12"
              placeholder="e.g. Physics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          {recentSubjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recentSubjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className="min-h-11 rounded-full bg-secondary px-4 text-sm text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <Button className="min-h-12 w-full" disabled={busy} onClick={handleStart}>
            <Play className="h-4 w-4" aria-hidden /> Start session
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          <Button className="min-h-12 w-full" variant="secondary" disabled={busy} onClick={handlePauseResume}>
            {timer.status === "ACTIVE" ? (
              <>
                <Pause className="h-4 w-4" aria-hidden /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden /> Resume
              </>
            )}
          </Button>
          <Button className="min-h-12 w-full" disabled={busy} onClick={handleEnd}>
            <Square className="h-4 w-4" aria-hidden /> End session
          </Button>
          <Button
            className="min-h-12 w-full"
            variant="destructive"
            disabled={busy}
            onClick={() => setConfirmCancel(true)}
          >
            <X className="h-4 w-4" aria-hidden /> Cancel session
          </Button>
        </div>
      )}

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this session?</AlertDialogTitle>
            <AlertDialogDescription>
              The session won't count towards your goals or streak. You can restore it from your Profile
              within the next 24 hours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Keep studying</AlertDialogCancel>
            <AlertDialogAction className="min-h-11" onClick={handleCancel}>
              Cancel session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
