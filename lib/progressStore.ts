/**
 * A tiny external store around localStorage.
 *
 * React reads this through `useSyncExternalStore`, which is the supported way
 * to consume state that lives outside React. That buys two things over reading
 * storage in an effect: no cascading render on mount, and a free cross-tab
 * sync, since another tab writing the same key notifies this one.
 */

import {
  createProgressState,
  loadProgress,
  saveProgress,
  STORAGE_KEY,
  type ProgressState,
} from "./progress";

/**
 * The snapshot used on the server and during hydration. It is a single stable
 * object, which is also how we detect that the real snapshot has been read:
 * see `isHydrated`.
 */
const serverSnapshot: ProgressState = createProgressState();

let snapshot: ProgressState | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function handleStorageEvent(event: StorageEvent): void {
  // key is null when storage is cleared entirely.
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = loadProgress();
  notify();
}

export function subscribeToProgress(listener: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorageEvent);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

export function getProgressSnapshot(): ProgressState {
  snapshot ??= loadProgress();
  return snapshot;
}

export function getServerProgressSnapshot(): ProgressState {
  return serverSnapshot;
}

/** False only while rendering the server snapshot, before storage was read. */
export function isHydrated(state: ProgressState): boolean {
  return state !== serverSnapshot;
}

export function writeProgress(next: ProgressState): void {
  snapshot = next;
  saveProgress(next);
  notify();
}

export function updateProgress(
  change: (previous: ProgressState) => ProgressState,
): void {
  writeProgress(change(getProgressSnapshot()));
}
