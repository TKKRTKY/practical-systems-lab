import { DayList } from "@/components/dashboard/DayList";
import { days } from "@/curriculum";

export const metadata = {
  title: "Curriculum — Practical Systems Lab",
};

export default function DaysPage() {
  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Curriculum</span>
        <h1>14 days</h1>
        <p className="page-head__lead">
          Each day follows the same loop: read a short explanation, run real
          commands, inspect the output, work a troubleshooting scenario, write
          an investigation plan, then compare it against a systematic sequence.
          Days build on each other, but each one stands alone if you need a
          specific topic.
        </p>
      </div>
      <DayList days={days} />
    </>
  );
}
