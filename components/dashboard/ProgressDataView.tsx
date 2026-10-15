"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useProgress } from "@/components/providers/ProgressProvider";
import { STORAGE_KEY } from "@/lib/progress";

export function ProgressDataView() {
  const { hydrated, state, summary, replaceState, resetAll } = useProgress();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function exportFile() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `practical-systems-lab-progress-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Exported a JSON file to your downloads.");
  }

  async function importFile(file: File) {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      replaceState(parsed);
      setMessage("Imported. Anything unrecognised in the file was ignored.");
    } catch {
      setMessage("That file could not be read as JSON. Nothing was changed.");
    }
  }

  if (!hydrated) {
    return (
      <Card title="Progress data">
        <p className="empty">Loading…</p>
      </Card>
    );
  }

  return (
    <div className="stack stack--loose">
      <Card
        title="Export and import"
        note="The export is a plain JSON document. It contains your notes, so treat it as personal and keep it out of version control."
      >
        <div className="stack">
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={exportFile}>
              Export progress
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fileInput.current?.click()}
            >
              Import progress
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importFile(file);
                event.target.value = "";
              }}
            />
          </div>
          {message && <p className="field__help">{message}</p>}
        </div>
      </Card>

      <Card title="What is stored" hint={STORAGE_KEY}>
        <ul className="inline-list">
          <li>
            {summary.completedDays} completed {summary.completedDays === 1 ? "day" : "days"},{" "}
            {summary.exercisesCompleted} exercises checked off
          </li>
          <li>
            {summary.assessedDays} self-assessment{" "}
            {summary.assessedDays === 1 ? "score" : "scores"},{" "}
            {summary.reviewItems.length} flagged for review
          </li>
          <li>
            {state.activity.length} active{" "}
            {state.activity.length === 1 ? "day" : "days"} recorded, current
            streak {summary.streak}
          </li>
          <li>Your investigation notes and written explanations per day</li>
        </ul>
      </Card>

      <Card
        title="Reset"
        note="This clears every day, score, flag, and note in this browser. It cannot be undone, so export first if you want a copy."
      >
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => {
            const confirmed = window.confirm(
              "Clear all progress and notes in this browser? This cannot be undone.",
            );
            if (confirmed) {
              resetAll();
              setMessage("All progress cleared.");
            }
          }}
        >
          Reset all progress
        </button>
      </Card>

      <Card title="Raw JSON" hint="read only">
        <textarea
          readOnly
          rows={14}
          value={JSON.stringify(state, null, 2)}
          aria-label="Raw progress JSON"
        />
      </Card>
    </div>
  );
}
