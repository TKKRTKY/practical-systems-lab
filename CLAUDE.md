# CLAUDE.md

Guidance for Claude Code when working in this repository.

# Project purpose

This repository is a hands-on systems troubleshooting learning environment for
software engineers.

It is a local Next.js application with a 14-day curriculum covering
networking, cloud infrastructure, containers, authentication, CI/CD,
observability, and production troubleshooting. The learner reads a short
explanation, runs real commands, inspects output, works a realistic failure,
writes an investigation plan, and reviews topics where their self-assessed
confidence was low.

The goal is not to produce specialists. It is to help a software engineer
investigate an unfamiliar failure methodically and explain it clearly.

# Content principles

- Prefer practical debugging over textbook theory.
- Use realistic production-style scenarios.
- Do not reveal troubleshooting answers before the learner attempts the
  exercise.
- Encourage hypothesis-driven debugging.
- Keep explanations concise and practical.
- Avoid requiring expensive cloud resources.
- Prefer exercises that can run locally when possible.

Additional conventions that follow from those principles:

- A concept belongs here only if knowing it changes what the learner would
  check next.
- Teach failure shapes: timeout, refusal, resolution error, certificate error,
  status code. Each implies a different layer and a different owner.
- Commands must be runnable on macOS as written, and each one needs a reason
  to exist plus something specific to notice in its output.
- Exercises need success criteria the learner can check themselves, without
  an answer key.
- Scenarios must include what is known and what is unknown, and the unknowns
  must be genuinely open.

# Claude's role

When adding or improving exercises:

1. Make the scenario realistic.
2. Include enough information to begin investigation, but do not make the root
   cause obvious.
3. Ask the learner to write an investigation plan before showing guidance.
4. Review investigation steps for technical correctness and completeness.
5. Suggest a more systematic debugging sequence.
6. Highlight relevant commands and evidence sources.
7. Keep technical communication examples concise and professional.

When reviewing a learner's investigation plan, say what the plan covers well,
what it misses and why that matters, and offer a better-ordered sequence.
Order checks by how much each one eliminates, not by protocol layer. Do not
simply confirm that a plan looks fine.

# Repository safety

The repository is public.

Never add:

- Private company information
- Customer information
- Internal URLs
- Credentials
- Secrets
- Proprietary code
- Personal job-search information
- Recruiting notes

Use fictional companies, domains, systems, and scenarios.

Use reserved names and addresses in all examples:

- Hostnames: `example.com`, `api.example.com`, `internal.example.com`,
  `registry.internal.example.com`
- Addresses: `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`
- Private ranges for cloud examples: `10.0.0.0/8`, `172.16.0.0/12`,
  `192.168.0.0/16`

`192.0.2.1` is useful on purpose: it reliably produces a connection timeout,
which makes it the simplest way to demonstrate silently dropped traffic.

Sample tokens and certificates in curriculum content must be obviously
fictional and must never be real credentials, even expired ones. Commands may
reference public endpoints that exist for testing, such as
`expired.badssl.com`, but should never probe hosts the learner does not own.

Progress exports contain the learner's own notes. They are gitignored, and
nothing in the application should ever transmit them anywhere.

# Code quality

- Use TypeScript. No `any`, and no type assertions where a type guard would do.
- Keep components small and single-purpose.
- Avoid unnecessary dependencies. There is no CSS framework and no state
  library here, and adding one needs a strong reason.
- Run `npm run check` (lint plus type check) before considering work done, and
  `npm run build` when touching routing or data loading.
- Keep curriculum content easy to edit.
- Add clear types for curriculum data.
- Prefer maintainability over cleverness.

# Architecture notes

- `curriculum/` is plain typed data: no JSX, no imports from the application,
  no runtime behaviour. This boundary is the most important one in the
  repository, because it keeps content editable without reading app code.
- `curriculum/types.ts` defines the shape of a day. Changing it means updating
  all 14 day files, so extend it additively with optional fields where
  possible.
- `lib/progress.ts` owns the progress model, derived statistics, and storage.
  Everything except `loadProgress` and `saveProgress` is a pure function.
  Statistics belong here, not in components.
- `components/providers/ProgressProvider.tsx` is the only writer of progress
  state, through a single `mutateDay` path that also records activity dates for
  the streak. Add new mutations there rather than writing to storage directly.
- Interactive sections render only after `hydrated` is true, because progress
  is read from localStorage in an effect. Rendering stored values before that
  would cause a hydration mismatch.
- `normalizeProgress` validates any untrusted JSON document, so a hand-edited
  or outdated progress file can never crash the application. Keep it tolerant.
- `app/globals.css` holds the whole design system as class names and custom
  properties, with a dark mode via `prefers-color-scheme`. Add a class there
  rather than introducing inline styles or a CSS-in-JS approach.
- Day routes are statically generated from `generateStaticParams`, so day pages
  stay server components and only the interactive parts are client components.

# Adding a day

1. Create `curriculum/dayNN.ts` exporting a `Day` with a unique `id`.
2. Give every exercise a unique, stable id of the form `dNN-eN`. Progress is
   keyed on these, so never renumber an existing one.
3. Add the import and the array entry in `curriculum/index.ts`.
4. Run `npm run check`.

No application code should need to change to add a day. If it does, that is a
sign the content type needs extending rather than the page.

# Tone

Write for a competent engineer who is new to a specific layer, not to
programming. Be direct, concrete, and free of hype. Avoid certification-style
phrasing and motivational filler. Do not frame the material as preparation for
anything other than doing the work well.
