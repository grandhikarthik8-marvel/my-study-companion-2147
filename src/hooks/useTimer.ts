import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TimerStatus = "IDLE" | "ACTIVE" | "PAUSED";

interface TimerState {
  sessionId: string | null;
  subjectName: string;
  startTime: string | null;
  pausedSeconds: number;
  pauseStartedAt: string | null;
  status: TimerStatus;
  lastTickTime: string | null;
  begin: (sessionId: string, subjectName: string, startTime: string) => void;
  pause: () => void;
  resume: () => void;
  tick: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      sessionId: null,
      subjectName: "",
      startTime: null,
      pausedSeconds: 0,
      pauseStartedAt: null,
      status: "IDLE",
      lastTickTime: null,
      begin: (sessionId, subjectName, startTime) =>
        set({
          sessionId,
          subjectName,
          startTime,
          pausedSeconds: 0,
          pauseStartedAt: null,
          status: "ACTIVE",
          lastTickTime: new Date().toISOString(),
        }),
      pause: () =>
        set((s) =>
          s.status !== "ACTIVE" ? s : { ...s, status: "PAUSED", pauseStartedAt: new Date().toISOString() },
        ),
      resume: () =>
        set((s) => {
          if (s.status !== "PAUSED") return s;
          const extra = s.pauseStartedAt
            ? (Date.now() - new Date(s.pauseStartedAt).getTime()) / 1000
            : 0;
          return { ...s, status: "ACTIVE", pauseStartedAt: null, pausedSeconds: s.pausedSeconds + extra };
        }),
      tick: () => set({ lastTickTime: new Date().toISOString() }),
      reset: () =>
        set({
          sessionId: null,
          subjectName: "",
          startTime: null,
          pausedSeconds: 0,
          pauseStartedAt: null,
          status: "IDLE",
          lastTickTime: null,
        }),
    }),
    { name: "msc.active-timer" },
  ),
);

export function computeElapsedSeconds(state: {
  startTime: string | null;
  pausedSeconds: number;
  pauseStartedAt: string | null;
  status: TimerStatus;
}): number {
  if (!state.startTime) return 0;
  const gross = (Date.now() - new Date(state.startTime).getTime()) / 1000;
  const ongoingPause =
    state.status === "PAUSED" && state.pauseStartedAt
      ? (Date.now() - new Date(state.pauseStartedAt).getTime()) / 1000
      : 0;
  return Math.max(0, gross - state.pausedSeconds - ongoingPause);
}

export function totalPausedSeconds(state: {
  pausedSeconds: number;
  pauseStartedAt: string | null;
  status: TimerStatus;
}): number {
  const ongoing =
    state.status === "PAUSED" && state.pauseStartedAt
      ? (Date.now() - new Date(state.pauseStartedAt).getTime()) / 1000
      : 0;
  return state.pausedSeconds + ongoing;
}
