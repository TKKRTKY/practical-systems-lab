import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__brand">
          <span className="site-header__title">Practical Systems Lab</span>
          <span className="site-header__tagline">
            Hands-on systems troubleshooting practice
          </span>
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/">Dashboard</Link>
          <Link href="/days">Curriculum</Link>
          <Link href="/progress">Progress data</Link>
        </nav>
      </div>
    </header>
  );
}
