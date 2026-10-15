"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatTile } from "@/components/ui/StatTile";
import { useProgress } from "@/components/providers/ProgressProvider";
import { getDay } from "@/curriculum";

export function DashboardView() {
  const { hydrated, summary } = useProgress();
  const currentDay = getDay(summary.currentDayId);

  if (!hydrated) {
    return (
      <Card title="Progress">
        <p className="empty">Loading your progress from this browser…</p>
      </Card>
    );
  }

  return (
    <div className="stack stack--loose">
      <Card
        title="Overall progress"
        hint={`${summary.completedDays} of ${summary.totalDays} days complete`}
      >
        <div className="stack">
          <ProgressBar
            percent={summary.completionPercent}
            label="Curriculum completed"
            detail={`${summary.completionPercent}%`}
          />
          <ProgressBar
            percent={
              summary.totalExercises === 0
                ? 0
                : (summary.exercisesCompleted / summary.totalExercises) * 100
            }
            label="Hands-on exercises checked off"
            detail={`${summary.exercisesCompleted} of ${summary.totalExercises}`}
          />
        </div>
      </Card>

      <div className="stat-grid">
        <StatTile
          label="Completed"
          value={String(summary.completedDays)}
          unit={`/ ${summary.totalDays}`}
          sub="days"
        />
        <StatTile
          label="Current day"
          value={summary.allComplete ? "done" : `Day ${summary.currentDayId}`}
          sub={
            summary.allComplete
              ? "all days complete"
              : (currentDay?.title ?? "")
          }
        />
        <StatTile
          label="Streak"
          value={String(summary.streak)}
          unit={summary.streak === 1 ? "day" : "days"}
          sub="consecutive days of activity"
        />
        <StatTile
          label="Avg self-assessment"
          value={
            summary.averageConfidence === null
              ? "—"
              : summary.averageConfidence.toFixed(1)
          }
          unit={summary.averageConfidence === null ? undefined : "/ 5"}
          sub={
            summary.assessedDays === 0
              ? "no days scored yet"
              : `across ${summary.assessedDays} scored ${
                  summary.assessedDays === 1 ? "day" : "days"
                }`
          }
        />
        <StatTile
          label="Flagged for review"
          value={String(summary.reviewItems.length)}
          unit={summary.reviewItems.length === 1 ? "day" : "days"}
          sub={
            summary.reviewTopics.length === 0
              ? "nothing flagged"
              : `${summary.reviewTopics.length} topics`
          }
        />
      </div>

      {!summary.allComplete && currentDay && (
        <Card title="Pick up here" hint={`about ${currentDay.estimatedMinutes} minutes`}>
          <div className="stack stack--tight">
            <p className="prose">
              <b>
                Day {currentDay.id}: {currentDay.title}
              </b>
              <br />
              {currentDay.objective}
            </p>
            <div className="btn-row">
              <Link className="btn btn--primary" href={`/days/${currentDay.id}`}>
                Start day {currentDay.id}
              </Link>
              <Link className="btn" href="/days">
                See all days
              </Link>
            </div>
          </div>
        </Card>
      )}

      <Card
        title="Topics marked for review"
        hint="From days you flagged or scored low"
      >
        {summary.reviewItems.length === 0 ? (
          <p className="empty">
            Nothing flagged yet. Flag a day when your plan missed steps, or when
            your self-assessment was 3 or below.
          </p>
        ) : (
          <div className="stack stack--tight">
            <div className="tag-row">
              {summary.reviewTopics.map((topic) => (
                <Badge key={topic} tone="review">
                  {topic}
                </Badge>
              ))}
            </div>
            <div className="day-list">
              {summary.reviewItems.map((item) => (
                <Link
                  key={item.dayId}
                  href={`/days/${item.dayId}`}
                  className="day-row"
                >
                  <span className="day-row__num">Day {item.dayId}</span>
                  <span className="day-row__title">{item.dayTitle}</span>
                  <span className="day-row__flags">
                    {item.confidence && <Badge>score {item.confidence}</Badge>}
                    <Badge tone="review">review</Badge>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Recently completed exercises"
        hint={`${summary.exercisesCompleted} total`}
      >
        {summary.recentExercises.length === 0 ? (
          <p className="empty">
            No exercises checked off yet. Each day has three.
          </p>
        ) : (
          <ul className="inline-list">
            {summary.recentExercises.map((exercise) => (
              <li key={exercise.exerciseId}>
                <Link href={`/days/${exercise.dayId}`}>
                  Day {exercise.dayId}
                </Link>
                {" — "}
                {exercise.exerciseTitle}{" "}
                <span className="empty">
                  ({new Date(exercise.completedAt).toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
