"use client";

import { useEffect, useRef, useState } from "react";

interface NotesFieldProps {
  label: string;
  help?: string;
  placeholder?: string;
  initialValue: string;
  rows?: number;
  onCommit: (value: string) => void;
}

/**
 * A textarea that keeps its own value and commits upstream after a short
 * pause, so typing never triggers a storage write per keystroke.
 */
export function NotesField({
  label,
  help,
  placeholder,
  initialValue,
  rows = 8,
  onCommit,
}: NotesFieldProps) {
  const [value, setValue] = useState(initialValue);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const committed = useRef(initialValue);

  useEffect(() => {
    if (value === committed.current) return;
    const timer = window.setTimeout(() => {
      committed.current = value;
      onCommit(value);
      setSavedAt(new Date().toLocaleTimeString());
    }, 600);
    return () => window.clearTimeout(timer);
  }, [value, onCommit]);

  return (
    <div className="field">
      <label className="field__label" htmlFor={`notes-${label}`}>
        {label}
      </label>
      {help && <p className="field__help">{help}</p>}
      <textarea
        id={`notes-${label}`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          if (value !== committed.current) {
            committed.current = value;
            onCommit(value);
            setSavedAt(new Date().toLocaleTimeString());
          }
        }}
      />
      <div className="saved-note">
        {savedAt ? `Saved locally at ${savedAt}` : "Saved automatically as you type"}
      </div>
    </div>
  );
}
