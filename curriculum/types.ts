/**
 * Types for curriculum content.
 *
 * Curriculum content is plain, source-controlled data: no JSX, no imports from
 * the application, no runtime behaviour. That keeps `curriculum/` editable by
 * anyone who wants to add or improve a day without reading the app code.
 */

/** A term the learner should be able to explain in their own words. */
export interface KeyConcept {
  term: string;
  summary: string;
}

/** A short block of explanation. Keep it practical; link theory to symptoms. */
export interface Explanation {
  heading: string;
  paragraphs: string[];
}

/** A command the learner should actually run and read the output of. */
export interface CommandExample {
  /** The command, written so it can be copied and run as-is on macOS. */
  command: string;
  /** Why you would reach for this command during an investigation. */
  purpose: string;
  /** What to notice in the output. This is where the learning happens. */
  lookFor?: string;
  /** Anything that could be slow, noisy, blocked by a network, or confusing. */
  caution?: string;
}

/** A hands-on task with an observable outcome. */
export interface Exercise {
  /** Stable id, e.g. `d01-e2`. Used as the progress-tracking key. */
  id: string;
  title: string;
  steps: string[];
  /** How the learner knows they are done. Must be checkable by the learner. */
  successCriteria: string;
}

/** One step of a recommended investigation order, with the reasoning. */
export interface SequenceStep {
  action: string;
  reason: string;
}

/**
 * Guidance for a scenario. Rendered only after the learner has written and
 * saved an investigation plan, so that the root cause is never spoiled.
 */
export interface ScenarioGuidance {
  /** Things a strong investigation plan tends to include. */
  strongPlanIncludes: string[];
  /** Steps learners commonly skip, and why they matter. */
  commonlyMissed: string[];
  /** A systematic order to work through the problem. */
  systematicSequence: SequenceStep[];
  /** Concepts worth revisiting if the plan felt uncertain. */
  conceptsToReview: string[];
}

/** A realistic failure to investigate. The root cause is deliberately absent. */
export interface Scenario {
  title: string;
  /** Narrative framing: the report as it would actually arrive. */
  situation: string[];
  /** Established facts. Enough to start, not enough to conclude. */
  known: string[];
  /** Open questions the learner has to resolve with evidence. */
  unknown: string[];
  /** The writing task put to the learner. */
  task: string;
  guidance: ScenarioGuidance;
}

/** Practice at explaining an investigation in clear, professional English. */
export interface CommunicationPractice {
  prompt: string;
  /** Questions the written answer should address. */
  questions: string[];
  /** Reusable sentence patterns for describing an investigation. */
  examplePhrases: string[];
  tips: string[];
}

/** One day of the curriculum. */
export interface Day {
  /** 1-based day number. Also the route segment: /days/3 */
  id: number;
  title: string;
  /** One-line framing shown in lists. */
  focus: string;
  estimatedMinutes: number;
  /** A single sentence: what the learner can do after this day. */
  objective: string;
  /** Topic tags. Aggregated into "topics to review" on the dashboard. */
  tags: string[];
  keyConcepts: KeyConcept[];
  explanations: Explanation[];
  commands: CommandExample[];
  exercises: Exercise[];
  scenario: Scenario;
  communication: CommunicationPractice;
}
