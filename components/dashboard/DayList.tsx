"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { useProgress } from "@/components/providers/ProgressProvider";
import type { Day } from "@/curriculum/types";

export function DayList({ days }: { days: Day[] }) {
  const { hydrated, dayProgress, summary } = useProgress();

  return (
    <div className="day-list">
      {days.map((day) => {
        const progress = dayProgress(day.id);
        const isCurrent = hydrated && summary.currentDayId === day.id;
        return (
          <Link
            key={day.id}
            href={`/days/${day.id}`}
            className={isCurrent ? "day-row day-row--current" : "day-row"}
          >
            <span className="day-row__num">Day {day.id}</span>
            <span>
              <span className="day-row__title">{day.title}</span>
              <br />
              <span className="day-row__focus">{day.focus}</span>
            </span>
            <span className="day-row__flags">
              {hydrated && isCurrent && <Badge tone="accent">current</Badge>}
              {hydrated && progress.completed && (
                <Badge tone="done">completed</Badge>
              )}
              {hydrated && progress.needsReview && (
                <Badge tone="review">review</Badge>
              )}
              {hydrated && progress.confidence && (
                <Badge>score {progress.confidence}</Badge>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
