import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-head">
      <span className="eyebrow">404</span>
      <h1>No such page</h1>
      <p className="page-head__lead">
        The curriculum runs from day 1 to day 14.
      </p>
      <div className="btn-row">
        <Link className="btn btn--primary" href="/days">
          Go to the curriculum
        </Link>
        <Link className="btn" href="/">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
