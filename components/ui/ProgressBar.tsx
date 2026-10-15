interface ProgressBarProps {
  percent: number;
  label: string;
  detail?: string;
}

export function ProgressBar({ percent, label, detail }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="progress">
      <div className="progress__meta">
        <span>{label}</span>
        <span>{detail ?? `${clamped}%`}</span>
      </div>
      <div
        className="progress__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="progress__fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
