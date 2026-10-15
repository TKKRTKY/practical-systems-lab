"use client";

import { CONFIDENCE_LABELS, type Confidence } from "@/lib/progress";

const SCORES: Confidence[] = [1, 2, 3, 4, 5];

interface SelfAssessmentProps {
  value: Confidence | null;
  onChange: (value: Confidence | null) => void;
}

export function SelfAssessment({ value, onChange }: SelfAssessmentProps) {
  return (
    <div className="stack stack--tight">
      <div className="rating" role="group" aria-label="Self-assessment score">
        {SCORES.map((score) => (
          <button
            key={score}
            type="button"
            className="rating__btn"
            aria-pressed={value === score}
            aria-label={`${score}: ${CONFIDENCE_LABELS[score]}`}
            onClick={() => onChange(value === score ? null : score)}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="rating__scale">
        <span>1 lost</span>
        <span>5 could lead</span>
      </div>
      <p className="field__help">
        {value
          ? CONFIDENCE_LABELS[value]
          : "Score yourself honestly. A low score is what marks a topic for review."}
      </p>
    </div>
  );
}
