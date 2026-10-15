import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  hint?: string;
  note?: string;
  children: ReactNode;
}

export function Card({ title, hint, note, children }: CardProps) {
  return (
    <section className="card">
      {(title || hint) && (
        <header className="card__head">
          {title && <h2 className="card__title">{title}</h2>}
          {hint && <span className="card__hint">{hint}</span>}
        </header>
      )}
      {note && <p className="card__note">{note}</p>}
      {children}
    </section>
  );
}
