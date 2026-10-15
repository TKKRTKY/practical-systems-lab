import type { ReactNode } from "react";

type BadgeTone = "neutral" | "done" | "review" | "accent";

const toneClass: Record<BadgeTone, string> = {
  neutral: "badge",
  done: "badge badge--done",
  review: "badge badge--review",
  accent: "badge badge--accent",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return <span className={toneClass[tone]}>{children}</span>;
}
