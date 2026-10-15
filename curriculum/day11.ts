import type { Day } from "./types";

export const day11: Day = {
  id: 11,
  title: "Production troubleshooting",
  focus: "Run a structured investigation instead of a sequence of guesses.",
  estimatedMinutes: 60,
  objective:
    "Triage a production incident with a repeatable process: establish scope, build a timeline, correlate changes, form falsifiable hypotheses, and mitigate before you have a root cause.",
  tags: ["incident-response", "triage", "debugging-process", "mitigation"],

  keyConcepts: [
    {
      term: "Triage",
      summary:
        "Deciding severity and ownership before investigating. It answers who needs to be involved and how much it matters, not why it happened.",
    },
    {
      term: "Scope",
      summary:
        "Who and what is affected, and who is not. The boundary of the problem is the most informative thing you can establish early.",
    },
    {
      term: "Timeline",
      summary:
        "When it started, when it was noticed, and what else happened near that moment. Start time is more valuable than any single log line.",
    },
    {
      term: "Change correlation",
      summary:
        "Deployments, configuration edits, feature flags, certificate rotations, scheduled jobs, dependency updates. Most incidents follow a change, and not always your own.",
    },
    {
      term: "Reproduction",
      summary:
        "A reliable way to trigger the failure on demand. It converts an investigation from archaeology into experiment.",
    },
    {
      term: "Hypothesis-driven debugging",
      summary:
        "State a cause, state what you would observe if it were true and if it were false, then test. Each test eliminates something.",
    },
    {
      term: "Mitigation versus fix",
      summary:
        "Mitigation restores service: roll back, fail over, disable a flag, add capacity, shed load. A fix addresses the cause. They are separate decisions with separate urgency.",
    },
    {
      term: "Blast radius of your own actions",
      summary:
        "Investigation changes systems. Restarts destroy evidence, retries add load, config edits break the timeline. Decide what you are willing to lose before you act.",
    },
    {
      term: "Single source of truth",
      summary:
        "One place where current status, findings, and next steps live. Without it, three people investigate the same thing and nobody knows the current state.",
    },
  ],

  explanations: [
    {
      heading: "Scope before cause, always",
      paragraphs: [
        "The first question is not why. It is who is affected, since when, and what still works. Scope tells you severity, it tells you which component is implicated, and it is almost always faster to establish than a cause.",
        "Scope is also defined by its negative. All users or some users. All endpoints or one. Every region or one availability zone. New sessions or existing ones. Each boundary you find eliminates a large set of explanations: a failure confined to one region is not a code bug in a deployment that went everywhere.",
      ],
    },
    {
      heading: "The timeline is the cheapest high-value artefact",
      paragraphs: [
        "Write down, in one place, when the symptom started, when it was reported, and every change anyone made near that window. Include changes you did not make: dependency incidents, certificate expiries, scheduled jobs, traffic events, data growth crossing a threshold.",
        "A timeline frequently solves the incident on its own. When the symptom begins four minutes after a configuration change, you have a prime suspect and a mitigation in the same observation. It also prevents the most expensive mistake in incident work, which is losing track of what you yourself changed.",
      ],
    },
    {
      heading: "Mitigate before you understand",
      paragraphs: [
        "Restoring service and explaining the failure are different jobs with different clocks. If a rollback restores service, do it, and investigate afterwards with the pressure off. Insisting on understanding first is a common and costly instinct, especially among engineers who find the puzzle compelling.",
        "Be explicit when you choose mitigation: say that you are mitigating, that the cause is not yet known, and that investigation continues. Otherwise a mitigated incident gets closed, the cause survives, and it recurs at a worse time.",
      ],
    },
    {
      heading: "Random debugging has a recognisable shape",
      paragraphs: [
        "The signs: several people changing things at once, no written timeline, restarts before evidence capture, moving to a new theory before the last one was tested, and nobody able to say what is currently believed to be true. Investigations in this state can run for hours without eliminating a single possibility.",
        "The antidote is cheap. One person coordinating, one written document, one hypothesis at a time, each with a stated test and a stated disconfirming result. Slower per step, dramatically faster to resolution.",
      ],
    },
  ],

  commands: [
    {
      command:
        "mkdir -p /tmp/psl-incident && printf '# Incident notes\\n\\n## Symptom\\n\\n## Scope (affected / not affected)\\n\\n## Timeline (UTC)\\n- %s  investigation started\\n\\n## Hypotheses\\n| hypothesis | predicts | disconfirmed by | status |\\n|---|---|---|---|\\n\\n## Actions taken (by whom, when)\\n\\n## Current status\\n' \"$(date -u +%H:%M)\" > /tmp/psl-incident/notes.md && cat /tmp/psl-incident/notes.md",
      purpose:
        "Create the incident document before investigating. The structure is the point.",
      lookFor:
        "That scope has an explicit not affected column, and that hypotheses have a disconfirmation column.",
    },
    {
      command: "date -u +'%Y-%m-%dT%H:%M:%SZ'",
      purpose:
        "Timestamp every observation in UTC, since participants and systems span time zones.",
      lookFor:
        "The habit. Mixed local times in a timeline cause real confusion during handovers.",
    },
    {
      command:
        "git log --since='7 days ago' --date=iso --pretty=format:'%ad %h %an %s' | head -20",
      purpose:
        "Build the change side of the timeline from the repository history.",
      lookFor:
        "Changes close to the symptom start time. In a real incident, extend this to configuration repositories and flag changes.",
    },
    {
      command: "git log --oneline -n 5 --first-parent",
      purpose: "Identify the most recent merges, which are the usual deploy boundaries.",
      lookFor:
        "The commit you would roll back to, decided before you need it under pressure.",
    },
    {
      command:
        "python3 -c \"\nfrom datetime import datetime, timedelta, timezone\nnow=datetime.now(timezone.utc)\nevents=[('symptom start', now-timedelta(minutes=47)),('config change', now-timedelta(minutes=51)),('reported', now-timedelta(minutes=12)),('restart by engineer', now-timedelta(minutes=5))]\nfor name,t in sorted(events,key=lambda e:e[1]): print(t.strftime('%H:%M:%SZ'), name)\"",
      purpose:
        "Practise ordering mixed events into one timeline, including your own actions.",
      lookFor:
        "The config change preceding the symptom by four minutes, and the restart that may have destroyed evidence.",
    },
    {
      command:
        "printf 'hypothesis: %s\\npredicts: %s\\ndisconfirmed by: %s\\n' 'config change at 09:12 caused it' 'symptom starts within minutes of 09:12 and rollback restores service' 'symptom predates 09:12 in any metric' ",
      purpose:
        "Write one hypothesis in the required form before testing anything.",
      lookFor:
        "That the disconfirming condition is concrete and checkable. If you cannot write one, it is not yet a hypothesis.",
    },
    {
      command: "rm -rf /tmp/psl-incident && echo cleaned",
      purpose: "Clean up the practice incident directory.",
      lookFor: "Leaving no scratch files behind.",
    },
  ],

  exercises: [
    {
      id: "d11-e1",
      title: "Write your scope questionnaire",
      steps: [
        "Write eight scope questions you would ask in the first five minutes of any incident.",
        "Make sure each has a negative form: who is not affected, what still works.",
        "Order them by how much each would narrow the search.",
        "Mark which you could answer from dashboards alone.",
      ],
      successCriteria:
        "The list fits on one screen, every question is answerable in under a minute, and each includes its negative.",
    },
    {
      id: "d11-e2",
      title: "Reconstruct a timeline including your own actions",
      steps: [
        "Create the incident notes file using the command above.",
        "Run the timeline ordering command and copy the events into the notes.",
        "Add two actions you can imagine taking, with timestamps.",
        "Write one sentence on which of those actions would have destroyed evidence.",
      ],
      successCriteria:
        "Your timeline includes investigator actions, not only system events, and you identified an evidence-destroying action.",
    },
    {
      id: "d11-e3",
      title: "Separate mitigation from fix",
      steps: [
        "Pick a system you know. Write three mitigations available to you that do not require knowing the cause.",
        "For each, write the cost: data staleness, reduced capability, financial cost, risk.",
        "Write the condition under which you would choose each.",
        "Write the sentence you would say in a channel to make clear you are mitigating rather than fixing.",
      ],
      successCriteria:
        "You have three mitigations with costs and trigger conditions, and a sentence that prevents the incident being closed prematurely.",
    },
  ],

  scenario: {
    title: "Error rates rise after a deployment",
    situation: [
      "A deployment went out at 14:05. At 14:20 the on-call engineer was paged for an elevated error rate on the checkout service: roughly four percent of requests are returning 500 responses, up from near zero. It is now 14:35.",
      "Two engineers are already investigating. One has restarted two instances, which temporarily reduced errors before they returned. The other is reading through the deployment diff, which touches fourteen files, and has found a change to a retry configuration that looks suspicious.",
      "Checkout is revenue-critical. A rollback is available and takes about six minutes. The deployment also included a database migration, which the team believes is additive only.",
    ],
    known: [
      "A deployment completed at 14:05.",
      "Paging began at 14:20 for a four percent error rate, up from near zero.",
      "Restarting instances temporarily reduced errors, which then returned.",
      "The deployment touches fourteen files and includes an additive database migration.",
      "Rollback is available and takes about six minutes.",
      "Checkout is revenue-critical.",
    ],
    unknown: [
      "Whether errors actually began at 14:05 or at some other time.",
      "Whether the errors are concentrated in one endpoint, instance, region, or customer segment.",
      "What the 500 responses actually are, as opposed to how many.",
      "Whether the migration is reversible in practice, which constrains rollback.",
      "Whether anything else changed in the same window.",
    ],
    task: "Write what you would do in the next ten minutes, in order, with timestamps. Decide explicitly whether to roll back now or investigate further first, and justify the decision in terms of impact and the reversibility of the migration. State what evidence you would capture before changing anything, and what you would tell the two engineers already working.",
    guidance: {
      strongPlanIncludes: [
        "Deciding on mitigation early and explicitly, given revenue impact and an available rollback.",
        "Checking whether the migration is truly reversible before committing to rollback.",
        "Confirming the actual error start time rather than accepting the deployment time or the page time.",
        "Capturing evidence, including a sample of the actual error, before further restarts.",
        "Coordinating the two engineers so changes are not made concurrently.",
        "Establishing scope: which endpoints, instances, and customers are affected.",
      ],
      commonlyMissed: [
        "Stopping the ad hoc restarts. They are a mitigation that masks the signal and destroys evidence, and the intermittent recovery is itself a clue.",
        "Reading the actual error, not just the rate. Four percent of requests failing in one identifiable way is far more tractable than four percent failing.",
        "Checking migration reversibility before announcing a rollback plan that may not be safe.",
        "Treating the suspicious diff line as a hypothesis to test rather than a conclusion. A plausible-looking change is not evidence.",
        "Correlating the error start with the deployment rather than assuming it, since a four percent rate may predate 14:05.",
        "Naming one coordinator, so that findings and actions have one home.",
      ],
      systematicSequence: [
        {
          action: "Take coordination: one person deciding, one document, and ask that no further changes be made without saying so.",
          reason:
            "Concurrent uncoordinated changes make the timeline unreadable and can turn one incident into two.",
        },
        {
          action: "Capture evidence: a sample of the failing responses, logs from an affected instance, current metrics.",
          reason:
            "Mitigation will remove the evidence. Thirty seconds of capture now saves the post-incident analysis.",
        },
        {
          action: "Establish scope and the true start time of the error increase.",
          reason:
            "It confirms or breaks the deployment hypothesis and tells you whether rollback can even help.",
        },
        {
          action: "Confirm whether the migration is reversible, and decide on rollback.",
          reason:
            "Rollback is the fastest mitigation only if the data change permits it; otherwise you need a different mitigation.",
        },
        {
          action: "Mitigate, and state clearly that the cause is not yet established.",
          reason:
            "Service is restored while the investigation stays open, which prevents a premature close.",
        },
        {
          action: "Test the retry configuration hypothesis against the captured evidence.",
          reason:
            "With the pressure off, the suspicious change can be confirmed or eliminated properly instead of assumed.",
        },
      ],
      conceptsToReview: [
        "Scope before cause, including the negative form",
        "Timeline construction with investigator actions included",
        "Mitigation versus fix as separate decisions",
        "Hypotheses with explicit disconfirming conditions",
      ],
    },
  },

  communication: {
    prompt:
      "Write two things: a two-sentence update for a business stakeholder channel at 14:40, and a short message to the two engineers coordinating the technical work. The constraint is that you have no root cause yet and must not pretend otherwise.",
    questions: [
      "What is the impact in business terms, and what is being done about it right now?",
      "What do you know with confidence, and what are you explicitly not claiming?",
      "What is the mitigation decision and its trade-off?",
      "What do you need each engineer to do, and what should they stop doing?",
      "When is the next update, and what will it contain?",
    ],
    examplePhrases: [
      "About four percent of checkout requests are failing since 14:05. We are rolling back now and expect recovery within ten minutes.",
      "We are mitigating, not fixing. The cause is not yet established and the investigation stays open after service recovers.",
      "Please hold off on further instance restarts; they briefly mask the errors and remove the evidence we need.",
      "At this point, we know the error rate rose shortly after the deployment, but we have not yet confirmed the deployment as the cause.",
      "I will post the next update at 14:55 with recovery status and what we have ruled out.",
    ],
    tips: [
      "Two audiences need two messages. Business stakeholders need impact and time to recovery; engineers need coordination.",
      "Say we are mitigating, not fixing out loud. It is the single most useful sentence in incident communication.",
      "Ask people to stop doing something clearly and without blame. Most people are helping in the only way they know.",
    ],
  },
};
