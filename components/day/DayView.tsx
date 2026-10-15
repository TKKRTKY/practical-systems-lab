"use client";

import Link from "next/link";
import { useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CommunicationPanel } from "@/components/day/CommunicationPanel";
import { ExerciseList } from "@/components/day/ExerciseList";
import { GuidancePanel } from "@/components/day/GuidancePanel";
import { NotesField } from "@/components/day/NotesField";
import { ScenarioPanel } from "@/components/day/ScenarioPanel";
import { SelfAssessment } from "@/components/day/SelfAssessment";
import {
  CommandList,
  ConceptList,
  ExplanationList,
} from "@/components/day/StaticSections";
import { useProgress } from "@/components/providers/ProgressProvider";
import type { Day } from "@/curriculum/types";

interface DayViewProps {
  day: Day;
  previous?: { id: number; title: string };
  next?: { id: number; title: string };
}

export function DayView({ day, previous, next }: DayViewProps) {
  const {
    hydrated,
    dayProgress,
    setCompleted,
    setNeedsReview,
    setConfidence,
    setInvestigationNotes,
    setCommunicationNotes,
    toggleExercise,
    revealGuidance,
  } = useProgress();

  const progress = dayProgress(day.id);

  const commitInvestigation = useCallback(
    (value: string) => setInvestigationNotes(day.id, value),
    [day.id, setInvestigationNotes],
  );
  const commitCommunication = useCallback(
    (value: string) => setCommunicationNotes(day.id, value),
    [day.id, setCommunicationNotes],
  );

  const exercisesDone = day.exercises.filter((exercise) =>
    Boolean(progress.exercises[exercise.id]),
  ).length;

  return (
    <div className="stack stack--loose">
      <div className="page-head">
        <span className="eyebrow">
          Day {day.id} of 14 &middot; about {day.estimatedMinutes} minutes
        </span>
        <h1>{day.title}</h1>
        <p className="page-head__lead">{day.focus}</p>
        <div className="meta-row">
          {hydrated && progress.completed && <Badge tone="done">completed</Badge>}
          {hydrated && progress.needsReview && (
            <Badge tone="review">needs review</Badge>
          )}
          {hydrated && (
            <span>
              {exercisesDone} of {day.exercises.length} exercises checked off
            </span>
          )}
          <span className="tag-row">
            {day.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </span>
        </div>
      </div>

      <Card title="Learning objective">
        <p className="prose">{day.objective}</p>
      </Card>

      <Card title="Key concepts" hint="Be able to explain each in your own words">
        <ConceptList concepts={day.keyConcepts} />
      </Card>

      <Card title="How this actually works">
        <ExplanationList explanations={day.explanations} />
      </Card>

      <Card
        title="Commands to try"
        hint="Run them, then read the output"
        note="These are meant to be run on macOS. Read the output before moving on: the output is the lesson, not the command."
      >
        <CommandList commands={day.commands} />
      </Card>

      <Card title="Hands-on exercises">
        {hydrated ? (
          <ExerciseList
            exercises={day.exercises}
            done={progress.exercises}
            onToggle={(exerciseId, done) =>
              toggleExercise(day.id, exerciseId, done)
            }
          />
        ) : (
          <p className="empty">Loading your progress…</p>
        )}
      </Card>

      <div className="stack">
        <h2 className="card__title">Troubleshooting scenario</h2>
        <ScenarioPanel scenario={day.scenario} />
      </div>

      <Card
        title="Your investigation plan"
        hint="Write this before revealing the review"
      >
        {hydrated ? (
          <NotesField
            label="Investigation notes"
            help="What would you check, in what order, and what would each result rule in or out? Name the evidence you would collect and who owns each layer."
            placeholder={
              "1. First I would ...\n   expect: ...\n   rules out: ...\n2. Then ..."
            }
            rows={12}
            initialValue={progress.investigationNotes}
            onCommit={commitInvestigation}
          />
        ) : (
          <p className="empty">Loading your notes…</p>
        )}
      </Card>

      <Card title="Review" hint="Unlocks once you have written a plan">
        {hydrated ? (
          <GuidancePanel
            guidance={day.scenario.guidance}
            revealed={progress.guidanceRevealed}
            planWritten={progress.investigationNotes.trim().length >= 40}
            onReveal={() => revealGuidance(day.id)}
          />
        ) : (
          <p className="empty">Loading…</p>
        )}
      </Card>

      <Card title="Technical communication practice">
        <div className="stack">
          <CommunicationPanel practice={day.communication} />
          {hydrated ? (
            <NotesField
              label="Written explanation"
              help="Write it as if you were posting it. Keep observation and interpretation separate."
              rows={10}
              initialValue={progress.communicationNotes}
              onCommit={commitCommunication}
            />
          ) : (
            <p className="empty">Loading your notes…</p>
          )}
        </div>
      </Card>

      <Card
        title="Self-assessment"
        hint="1 to 5"
        note="Your average score appears on the dashboard, and anything you flag for review is listed there too."
      >
        {hydrated ? (
          <div className="stack">
            <SelfAssessment
              value={progress.confidence}
              onChange={(value) => setConfidence(day.id, value)}
            />
            <hr />
            <label className="check">
              <input
                type="checkbox"
                checked={progress.completed}
                onChange={(event) => setCompleted(day.id, event.target.checked)}
              />
              <span>
                Mark day {day.id} complete
                <br />
                <span className="field__help">
                  Complete means you ran the commands, attempted the scenario,
                  and compared your plan against the review.
                </span>
              </span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={progress.needsReview}
                onChange={(event) =>
                  setNeedsReview(day.id, event.target.checked)
                }
              />
              <span>
                Needs review
                <br />
                <span className="field__help">
                  Flag this if your plan missed steps or your score was 3 or
                  below.
                </span>
              </span>
            </label>
          </div>
        ) : (
          <p className="empty">Loading your progress…</p>
        )}
      </Card>

      <nav className="day-nav" aria-label="Day navigation">
        {previous ? (
          <Link className="btn" href={`/days/${previous.id}`}>
            &larr; Day {previous.id}: {previous.title}
          </Link>
        ) : (
          <Link className="btn btn--quiet" href="/days">
            All days
          </Link>
        )}
        {next ? (
          <Link className="btn" href={`/days/${next.id}`}>
            Day {next.id}: {next.title} &rarr;
          </Link>
        ) : (
          <Link className="btn btn--quiet" href="/">
            Dashboard
          </Link>
        )}
      </nav>
    </div>
  );
}
