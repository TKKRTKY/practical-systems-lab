"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createDayProgress,
  createProgressState,
  getDayProgress,
  normalizeProgress,
  summarize,
  toLocalDate,
  type Confidence,
  type DayProgress,
  type ProgressSummary,
  type ProgressState,
} from "@/lib/progress";
import {
  getProgressSnapshot,
  getServerProgressSnapshot,
  isHydrated,
  subscribeToProgress,
  updateProgress,
  writeProgress,
} from "@/lib/progressStore";
import { days } from "@/curriculum";

interface ProgressContextValue {
  /** False until stored progress has been read. Interactive UI waits for it. */
  hydrated: boolean;
  state: ProgressState;
  summary: ProgressSummary;
  dayProgress: (dayId: number) => DayProgress;
  setCompleted: (dayId: number, completed: boolean) => void;
  setNeedsReview: (dayId: number, needsReview: boolean) => void;
  setConfidence: (dayId: number, confidence: Confidence | null) => void;
  setInvestigationNotes: (dayId: number, notes: string) => void;
  setCommunicationNotes: (dayId: number, notes: string) => void;
  toggleExercise: (dayId: number, exerciseId: string, done: boolean) => void;
  revealGuidance: (dayId: number) => void;
  replaceState: (next: unknown) => void;
  resetAll: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    subscribeToProgress,
    getProgressSnapshot,
    getServerProgressSnapshot,
  );

  /**
   * Single write path: apply a change to one day, stamp it, record today as an
   * activity date, and persist. Every mutation below goes through this.
   */
  const mutateDay = useCallback(
    (dayId: number, change: (previous: DayProgress) => DayProgress) => {
      updateProgress((previous) => {
        const key = String(dayId);
        const current = previous.days[key] ?? createDayProgress();
        const today = toLocalDate();
        return {
          ...previous,
          days: {
            ...previous.days,
            [key]: { ...change(current), updatedAt: new Date().toISOString() },
          },
          activity: previous.activity.includes(today)
            ? previous.activity
            : [...previous.activity, today].sort(),
        };
      });
    },
    [],
  );

  const value = useMemo<ProgressContextValue>(() => {
    return {
      hydrated: isHydrated(state),
      state,
      summary: summarize(days, state),
      dayProgress: (dayId) => getDayProgress(state, dayId),

      setCompleted: (dayId, completed) =>
        mutateDay(dayId, (previous) => ({
          ...previous,
          completed,
          // Keep the first completion date; clearing the box clears it.
          completedAt: completed
            ? (previous.completedAt ?? toLocalDate())
            : null,
        })),

      setNeedsReview: (dayId, needsReview) =>
        mutateDay(dayId, (previous) => ({ ...previous, needsReview })),

      setConfidence: (dayId, confidence) =>
        mutateDay(dayId, (previous) => ({ ...previous, confidence })),

      setInvestigationNotes: (dayId, investigationNotes) =>
        mutateDay(dayId, (previous) => ({ ...previous, investigationNotes })),

      setCommunicationNotes: (dayId, communicationNotes) =>
        mutateDay(dayId, (previous) => ({ ...previous, communicationNotes })),

      toggleExercise: (dayId, exerciseId, done) =>
        mutateDay(dayId, (previous) => {
          const exercises = { ...previous.exercises };
          if (done) exercises[exerciseId] = new Date().toISOString();
          else delete exercises[exerciseId];
          return { ...previous, exercises };
        }),

      revealGuidance: (dayId) =>
        mutateDay(dayId, (previous) => ({
          ...previous,
          guidanceRevealed: true,
        })),

      replaceState: (next) => writeProgress(normalizeProgress(next)),

      resetAll: () => writeProgress(createProgressState()),
    };
  }, [state, mutateDay]);

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used inside a ProgressProvider");
  }
  return context;
}
