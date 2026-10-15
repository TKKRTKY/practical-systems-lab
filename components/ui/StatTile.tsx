interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
}

export function StatTile({ label, value, unit, sub }: StatTileProps) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div className="stat__value">
        {value}
        {unit && <span className="stat__unit">{unit}</span>}
      </div>
      {sub && <div className="stat__sub">{sub}</div>}
    </div>
  );
}
