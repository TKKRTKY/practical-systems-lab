"use client";

import type { ScenarioGuidance } from "@/curriculum/types";

interface GuidancePanelProps {
  guidance: ScenarioGuidance;
  revealed: boolean;
  /** A plan has been written. Guidance stays locked until it has. */
  planWritten: boolean;
  onReveal: () => void;
}

/**
 * The review for a scenario. Deliberately gated: the learner has to write an
 * investigation plan first, because reading the answer first removes the
 * exercise entirely.
 */
export function GuidancePanel({
  guidance,
  revealed,
  planWritten,
  onReveal,
}: GuidancePanelProps) {
  if (!revealed) {
    return (
      <div className="guidance">
        <div className="guidance__locked">
          <p>
            The review is hidden until you have written an investigation plan
            above. Working out the order of checks yourself is the exercise; the
            review is only useful once you have something to compare it against.
          </p>
          {planWritten ? (
            <button type="button" className="btn btn--primary" onClick={onReveal}>
              Reveal the review
            </button>
          ) : (
            <p className="empty">
              Write your investigation notes above, then this unlocks.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="guidance">
      <div className="guidance__section">
        <div className="guidance__heading">Strong points to look for</div>
        <ul>
          {guidance.strongPlanIncludes.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="guidance__section">
        <div className="guidance__heading">Commonly missed steps</div>
        <ul>
          {guidance.commonlyMissed.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="guidance__section">
        <div className="guidance__heading">A more systematic sequence</div>
        <ol className="sequence">
          {guidance.systematicSequence.map((step, index) => (
            <li key={index}>
              <div>
                <div className="sequence__action">{step.action}</div>
                <div className="sequence__reason">{step.reason}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="guidance__section">
        <div className="guidance__heading">Concepts to review</div>
        <ul>
          {guidance.conceptsToReview.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
