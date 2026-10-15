"use client";

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard access can be denied. The command is visible and selectable,
      // so there is nothing useful to report here.
    }
  }

  return (
    <button
      type="button"
      className="copy-btn"
      onClick={copy}
      aria-label="Copy command"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}
