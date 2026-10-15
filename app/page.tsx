import { DashboardView } from "@/components/dashboard/DashboardView";

export default function DashboardPage() {
  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Dashboard</span>
        <h1>Practical Systems Lab</h1>
        <p className="page-head__lead">
          A 14-day, hands-on curriculum for debugging real systems: networking,
          cloud infrastructure, containers, authentication, CI/CD, and
          production troubleshooting. Read a little, run real commands, then
          work a realistic failure and write down how you would investigate it.
        </p>
      </div>
      <DashboardView />
    </>
  );
}
