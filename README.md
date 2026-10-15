# Practical Systems Lab

Practical Systems Lab is a hands-on learning project for software engineers who
want to improve their ability to debug real-world systems across networking,
cloud infrastructure, containers, authentication, CI/CD, and production
environments.

It is a local web application, not a documentation site. Each day you read a
short explanation, run real commands on your own machine, inspect the output,
work through a realistic failure, and write down how you would investigate it.
The application keeps track of what you have completed, how confident you felt,
and what you flagged to come back to.

## Motivation

Most systems knowledge is written either as reference documentation, which
assumes you already know what you are looking for, or as tutorials that walk
you to a working result without ever letting anything fail.

Real debugging looks different. You are handed an ambiguous symptom, you decide
which layer to question first, and you work out what each result rules out.
The skill is not memorising commands. It is choosing the next check well, and
being able to explain what you have established and what you have not.

This project is built around that loop:

1. Read a short explanation of a systems concept
2. Run real commands locally
3. Inspect the output
4. Work through a realistic troubleshooting scenario
5. Write down an investigation approach
6. Review the topic later if your self-assessed confidence was low

Scenario guidance stays hidden until you have written a plan. Reading a model
answer first is comfortable and teaches almost nothing, so the application
simply does not let you do it by accident.

The aim is not to turn you into a network engineer. It is to make you an
engineer who can investigate an unfamiliar failure methodically, across
boundaries you do not own, and explain the investigation clearly while it is
still in progress.

## Topics covered

A 14-day curriculum, roughly an hour per day:

| Day | Topic | Focus |
| --- | --- | --- |
| 1 | DNS, TCP, and basic connectivity | Separate name resolution from reachability |
| 2 | HTTP, HTTPS, and TLS | Transport, handshake, or application failure |
| 3 | NAT, firewalls, and proxies | What sits between your process and the internet |
| 4 | Cloud networking fundamentals | Trace a packet through a VPC |
| 5 | Private networking and VPN | How internal services are exposed |
| 6 | Docker networking | What localhost means in every context |
| 7 | OAuth, OIDC, and SSO | Identity versus permission, and token failures |
| 8 | CI/CD troubleshooting | Code, environment, permissions, or network |
| 9 | Kubernetes fundamentals | Follow a request into a cluster |
| 10 | Observability | What evidence to collect first |
| 11 | Production troubleshooting | Structured incident investigation |
| 12 | Enterprise integration scenarios | Networking, trust, and identity at once |
| 13 | Incident explanation practice | Explaining an investigation in writing |
| 14 | End-to-end debugging challenge | One failure, many candidate layers |

Each day includes a learning objective, key concepts, short explanations,
commands to run, three hands-on exercises, a troubleshooting scenario with
known and unknown facts, a field for your investigation plan, technical
communication practice, a self-assessment score, and completion and review
flags.

Days 1 to 3, 6, 10, and 13 are fully runnable on a laptop with no cloud
account. Days 4, 5, 9, and 12 are exercises in reasoning and reading, with
local commands where they are genuinely useful, because nothing here should
require you to spend money on infrastructure.

## How to run locally

Requires Node.js 20 or newer. Tested on macOS.

```bash
git clone https://github.com/TKKRTKY/practical-systems-lab.git
cd practical-systems-lab
npm install
npm run dev
```

Then open http://localhost:3000.

Other useful commands:

```bash
npm run build
```

```bash
npm run check
```

`npm run check` runs linting and TypeScript type checking together.

There is nothing else to configure. No database, no API keys, no accounts, no
environment variables. Day 6 is the only day that benefits from having Docker
installed, and day 9 is written so that it does not require a cluster.

## Tech stack

- Next.js (App Router) and React
- TypeScript throughout, with curriculum content as typed data
- Plain CSS with custom properties, including a dark mode
- Browser localStorage for progress, with JSON export and import
- ESLint via `eslint-config-next`

No CSS framework, no state management library, no backend. The dependency list
is deliberately short: this is a learning tool whose content should outlive its
framework choices.

## Project structure

```
practical-systems-lab/
├── README.md
├── CLAUDE.md               # how to maintain and extend this repository
├── package.json
├── app/
│   ├── layout.tsx          # shell, header, progress provider
│   ├── globals.css         # the entire design system
│   ├── page.tsx            # dashboard
│   ├── days/page.tsx       # curriculum index
│   ├── days/[day]/page.tsx # one day, statically generated
│   └── progress/page.tsx   # export, import, reset
├── components/
│   ├── providers/          # progress context
│   ├── dashboard/          # dashboard, day list, progress data
│   ├── day/                # the per-day learning loop
│   └── ui/                 # card, badge, progress bar, stat tile
├── curriculum/
│   ├── types.ts            # the shape of a day
│   ├── index.ts            # the ordered list of days
│   ├── day01.ts
│   ├── day02.ts
│   └── ...                 # through day14.ts
├── lib/
│   └── progress.ts         # progress model, statistics, storage
└── public/
```

The important boundary is between `curriculum/` and everything else.
Curriculum files are plain typed data with no imports from the application, so
content can be edited, reviewed, and extended without touching the UI. Adding a
day means writing one file and adding one line to `curriculum/index.ts`.

Progress is read and written in exactly one place, `lib/progress.ts`, and the
statistics derived from it are pure functions.

## Learning philosophy

**Debugging over theory.** Concepts are introduced because they explain a
failure you will encounter, not for completeness. If knowing something does not
change what you would check next, it is not here.

**Failure shapes carry information.** A refusal, a timeout, a resolution error,
and a status code have different causes and different owners. Much of this
curriculum is practice at classifying a failure before investigating it.

**Order your checks by what they eliminate.** The difference between fast and
slow investigation is rarely knowledge of commands. It is choosing a next check
that rules out whole families of explanation.

**Write the plan before reading the answer.** Guidance unlocks only after you
have written an investigation plan, and then shows strong points, commonly
missed steps, and a more systematic sequence so you can see the gap.

**Hypotheses need disconfirming conditions.** In any large system something
looks suspicious. A hypothesis you cannot disprove is not a hypothesis.

**Explaining is part of the work.** Every day includes written communication
practice, because an investigation nobody can follow does not help anyone, and
"what do we know, what do we not know, what is next" is a skill you can
practise deliberately.

**Mitigation and root cause are separate decisions.** Restoring service and
explaining a failure run on different clocks.

**Honest self-assessment drives review.** The score you give yourself decides
what the dashboard asks you to revisit. A 2 you recorded honestly is worth more
than a 4 you awarded for having read the page.

## Contributing

Improvements to scenarios and explanations are welcome, especially failures you
have actually investigated. Please read `CLAUDE.md` first: it describes the
content principles, and the repository rules that keep this safe to publish.

This repository is public. Use fictional companies, reserved domains such as
`example.com` and `internal.example.com`, and reserved address ranges such as
`192.0.2.0/24`. Never include real internal hostnames, customer information,
credentials, or proprietary detail in a scenario.

## License

MIT. See `LICENSE`.
