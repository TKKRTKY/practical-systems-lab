/**
 * The curriculum.
 *
 * Adding a day: create curriculum/dayNN.ts exporting a `Day`, import it here,
 * and add it to the array. Nothing else in the application needs to change.
 */

import type { Day } from "./types";
import { day01 } from "./day01";
import { day02 } from "./day02";
import { day03 } from "./day03";
import { day04 } from "./day04";
import { day05 } from "./day05";
import { day06 } from "./day06";
import { day07 } from "./day07";
import { day08 } from "./day08";
import { day09 } from "./day09";
import { day10 } from "./day10";
import { day11 } from "./day11";
import { day12 } from "./day12";
import { day13 } from "./day13";
import { day14 } from "./day14";

export const days: Day[] = [
  day01,
  day02,
  day03,
  day04,
  day05,
  day06,
  day07,
  day08,
  day09,
  day10,
  day11,
  day12,
  day13,
  day14,
];

export function getDay(id: number): Day | undefined {
  return days.find((day) => day.id === id);
}

export function getAdjacentDays(id: number): {
  previous: Day | undefined;
  next: Day | undefined;
} {
  const index = days.findIndex((day) => day.id === id);
  return {
    previous: index > 0 ? days[index - 1] : undefined,
    next: index >= 0 && index < days.length - 1 ? days[index + 1] : undefined,
  };
}

export type { Day } from "./types";
