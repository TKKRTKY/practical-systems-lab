/**
 * Progress model and storage.
 *
 * Storage is deliberately boring: a single JSON document in the browser's
 * localStorage. No database, no account, no network. The same document can be
 * exported to a file and imported back, which is also how you move progress
 * between browsers or keep a backup.
 *
 * Everything in this module except `loadProgress`/`saveProgress` is a pure
 * function, so the statistics are easy to reason about and test.
 */

import type { Day } from "@/curriculum/types";

export const STORAGE_KEY = "practical-systems-lab:progress:v1";
export const PROGRESS_VERSION = 1 as const;

/** Self-assessed confidence, 1 (lost) to 5 (could lead this investigation). */
export type Confidence = 1 | 2 | 3 | 4 | 5;

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  1: "I could not start this on my own",
  2: "I need a reference open the whole time",
  3: "I can work through it with some checking",
  4: "I can do this unaided",
  5: "I could explain and lead this investigation",
};

export interface DayProgress {
  completed: boolean;
  needsReview: boolean;
  confidence: Confidence | null;
  /** The learner's investigation plan for the day's scenario. */
  investigationNotes: string;
  /** The learner's written technical explanation. */
  communicationNotes: string;
  /** Exercise id -> ISO timestamp it was checked off. */
  exercises: Record<string, string>;
  /** Scenario guidance is revealed only on purpose, and we remember that. */
  guidanceRevealed: boolean;
  /** Local date (YYYY-MM-DD) the day was first marked complete. */
  completedAt: string | null;
  updatedAt: string | null;
}

export interface ProgressState {
  version: typeof PROGRESS_VERSION;
  /** Keyed by day id as a string, so the document round-trips through JSON. */
  days: Record<string, DayProgress>;
  /** Local dates (YYYY-MM-DD) on which the learner did something. */
  activity: string[];
}

export function createDayProgress(): DayProgress {
  return {
    completed: false,
    needsReview: false,
    confidence: null,
    investigationNotes: "",
    communicationNotes: "",
    exercises: {},
    guidanceRevealed: false,
    completedAt: null,
    updatedAt: null,
  };
}

export function createProgressState(): ProgressState {
  return { version: PROGRESS_VERSION, days: {}, activity: [] };
}

export function getDayProgress(
  state: ProgressState,
  dayId: number,
): DayProgress {
  return state.days[String(dayId)] ?? createDayProgress();
}

/* -------------------------------------------------------------------------- */
/* dates                                                                      */
/* -------------------------------------------------------------------------- */

/** Local calendar date as YYYY-MM-DD. Avoids UTC off-by-one-day surprises. */
export function toLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
}

/**
 * Consecutive days of activity, counting backwards.
 *
 * The streak is alive if there was activity today or yesterday; that keeps a
 * study habit from looking broken just because today's session has not
 * started yet.
 */
export function calculateStreak(
  activity: string[],
  today: string = toLocalDate(),
): number {
  if (activity.length === 0) return 0;
  const seen = new Set(activity);
  const start = seen.has(today) ? today : shiftDate(today, -1);
  if (!seen.has(start)) return 0;

  let streak = 0;
  let cursor = start;
  while (seen.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

/* -------------------------------------------------------------------------- */
/* derived statistics                                                         */
/* -------------------------------------------------------------------------- */

export interface CompletedExerciseRef {
  dayId: number;
  dayTitle: string;
  exerciseId: string;
  exerciseTitle: string;
  completedAt: string;
}

export interface ReviewItem {
  dayId: number;
  dayTitle: string;
  tags: string[];
  confidence: Confidence | null;
}

export interface ProgressSummary {
  totalDays: number;
  completedDays: number;
  completionPercent: number;
  /** The day to work on next: the first incomplete day. */
  currentDayId: number;
  allComplete: boolean;
  streak: number;
  averageConfidence: number | null;
  assessedDays: number;
  exercisesCompleted: number;
  totalExercises: number;
  reviewItems: ReviewItem[];
  reviewTopics: string[];
  recentExercises: CompletedExerciseRef[];
}

export function summarize(
  days: Day[],
  state: ProgressState,
  options: { today?: string; recentLimit?: number } = {},
): ProgressSummary {
  const { today = toLocalDate(), recentLimit = 6 } = options;

  const completed = days.filter((day) => getDayProgress(state, day.id).completed);
  const firstIncomplete = days.find(
    (day) => !getDayProgress(state, day.id).completed,
  );

  const confidences = days
    .map((day) => getDayProgress(state, day.id).confidence)
    .filter((value): value is Confidence => value !== null);

  const reviewItems: ReviewItem[] = days
    .filter((day) => getDayProgress(state, day.id).needsReview)
    .map((day) => ({
      dayId: day.id,
      dayTitle: day.title,
      tags: day.tags,
      confidence: getDayProgress(state, day.id).confidence,
    }));

  const recentExercises: CompletedExerciseRef[] = days
    .flatMap((day) => {
      const progress = getDayProgress(state, day.id);
      return day.exercises
        .filter((exercise) => Boolean(progress.exercises[exercise.id]))
        .map((exercise) => ({
          dayId: day.id,
          dayTitle: day.title,
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          completedAt: progress.exercises[exercise.id],
        }));
    })
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  const totalExercises = days.reduce(
    (sum, day) => sum + day.exercises.length,
    0,
  );

  return {
    totalDays: days.length,
    completedDays: completed.length,
    completionPercent:
      days.length === 0
        ? 0
        : Math.round((completed.length / days.length) * 100),
    currentDayId: firstIncomplete?.id ?? days[days.length - 1]?.id ?? 1,
    allComplete: !firstIncomplete && days.length > 0,
    streak: calculateStreak(state.activity, today),
    averageConfidence:
      confidences.length === 0
        ? null
        : confidences.reduce((sum, value) => sum + value, 0) /
          confidences.length,
    assessedDays: confidences.length,
    exercisesCompleted: recentExercises.length,
    totalExercises,
    reviewItems,
    reviewTopics: [...new Set(reviewItems.flatMap((item) => item.tags))].sort(),
    recentExercises: recentExercises.slice(0, recentLimit),
  };
}

/* -------------------------------------------------------------------------- */
/* persistence                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Accept an unknown JSON document and return a well-formed state.
 *
 * Used for both localStorage reads and file imports, so a hand-edited or
 * out-of-date document can never crash the application.
 */
export function normalizeProgress(input: unknown): ProgressState {
  const base = createProgressState();
  if (typeof input !== "object" || input === null) return base;

  const raw = input as Partial<ProgressState>;
  const days: Record<string, DayProgress> = {};

  if (typeof raw.days === "object" && raw.days !== null) {
    for (const [key, value] of Object.entries(raw.days)) {
      const dayId = Number(key);
      if (!Number.isInteger(dayId) || dayId < 1) continue;
      if (typeof value !== "object" || value === null) continue;

      const day = value as Partial<DayProgress>;
      const exercises: Record<string, string> = {};
      if (typeof day.exercises === "object" && day.exercises !== null) {
        for (const [exerciseId, at] of Object.entries(day.exercises)) {
          if (typeof at === "string") exercises[exerciseId] = at;
          else if (at) exercises[exerciseId] = new Date(0).toISOString();
        }
      }

      days[String(dayId)] = {
        completed: day.completed === true,
        needsReview: day.needsReview === true,
        confidence: isConfidence(day.confidence) ? day.confidence : null,
        investigationNotes:
          typeof day.investigationNotes === "string"
            ? day.investigationNotes
            : "",
        communicationNotes:
          typeof day.communicationNotes === "string"
            ? day.communicationNotes
            : "",
        exercises,
        guidanceRevealed: day.guidanceRevealed === true,
        completedAt:
          typeof day.completedAt === "string" ? day.completedAt : null,
        updatedAt: typeof day.updatedAt === "string" ? day.updatedAt : null,
      };
    }
  }

  const activity = Array.isArray(raw.activity)
    ? [...new Set(raw.activity.filter((d): d is string => typeof d === "string"))].sort()
    : [];

  return { version: PROGRESS_VERSION, days, activity };
}

function isConfidence(value: unknown): value is Confidence {
  return (
    typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5
  );
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return createProgressState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createProgressState();
    return normalizeProgress(JSON.parse(raw));
  } catch {
    // Corrupt or unreadable storage (private window, blocked site data).
    // Starting fresh is better than failing to render.
    return createProgressState();
  }
}

export function saveProgress(state: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked. Progress stays in memory for this
    // session; nothing else in the app depends on the write succeeding.
  }
}
