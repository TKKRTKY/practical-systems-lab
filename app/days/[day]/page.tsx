import { notFound } from "next/navigation";
import { DayView } from "@/components/day/DayView";
import { days, getAdjacentDays, getDay } from "@/curriculum";

interface DayPageProps {
  params: Promise<{ day: string }>;
}

export function generateStaticParams() {
  return days.map((day) => ({ day: String(day.id) }));
}

export async function generateMetadata({ params }: DayPageProps) {
  const { day: dayParam } = await params;
  const day = getDay(Number(dayParam));
  if (!day) return { title: "Not found — Practical Systems Lab" };
  return {
    title: `Day ${day.id}: ${day.title} — Practical Systems Lab`,
    description: day.objective,
  };
}

export default async function DayPage({ params }: DayPageProps) {
  const { day: dayParam } = await params;
  const dayId = Number(dayParam);
  const day = getDay(dayId);
  if (!day) notFound();

  const { previous, next } = getAdjacentDays(dayId);

  return (
    <DayView
      day={day}
      previous={previous && { id: previous.id, title: previous.title }}
      next={next && { id: next.id, title: next.title }}
    />
  );
}
