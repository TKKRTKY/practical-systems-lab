import { ProgressDataView } from "@/components/dashboard/ProgressDataView";

export const metadata = {
  title: "Progress data — Practical Systems Lab",
};

export default function ProgressPage() {
  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Progress data</span>
        <h1>Your progress file</h1>
        <p className="page-head__lead">
          Progress lives in this browser via localStorage. There is no account
          and no server. Export it to a JSON file to back it up or move it to
          another browser, and import that file to restore it.
        </p>
      </div>
      <ProgressDataView />
    </>
  );
}
