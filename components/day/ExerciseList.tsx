"use client";

import type { Exercise } from "@/curriculum/types";

interface ExerciseListProps {
  exercises: Exercise[];
  done: Record<string, string>;
  onToggle: (exerciseId: string, done: boolean) => void;
}

export function ExerciseList({ exercises, done, onToggle }: ExerciseListProps) {
  return (
    <div className="stack stack--tight">
      {exercises.map((exercise) => {
        const isDone = Boolean(done[exercise.id]);
        return (
          <div
            className={isDone ? "exercise exercise--done" : "exercise"}
            key={exercise.id}
          >
            <div className="exercise__head">
              <input
                type="checkbox"
                id={exercise.id}
                checked={isDone}
                onChange={(event) => onToggle(exercise.id, event.target.checked)}
                aria-label={`Mark ${exercise.title} complete`}
              />
              <label className="exercise__title" htmlFor={exercise.id}>
                {exercise.title}
              </label>
            </div>
            <ol className="exercise__steps">
              {exercise.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <p className="exercise__criteria">
              <b>Done when:</b> {exercise.successCriteria}
            </p>
          </div>
        );
      })}
    </div>
  );
}
