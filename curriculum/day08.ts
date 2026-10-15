import type { Day } from "./types";

export const day08: Day = {
  id: 8,
  title: "CI/CD troubleshooting",
  focus: "Classify a pipeline failure as code, environment, permissions, or network.",
  estimatedMinutes: 60,
  objective:
    "Read a failed GitHub Actions run and determine whether the cause is the code, the runner environment, missing permissions, or blocked network access.",
  tags: ["ci-cd", "github-actions", "secrets", "permissions"],

  keyConcepts: [
    {
      term: "Workflow, job, step",
      summary:
        "A workflow contains jobs; jobs run on runners and contain steps. Jobs are isolated from each other, so anything shared between them must be passed explicitly.",
    },
    {
      term: "Runner",
      summary:
        "The machine executing a job. A hosted runner is a fresh environment every time; a self-hosted runner carries state and sits inside someone's network.",
    },
    {
      term: "Ephemerality",
      summary:
        "Hosted runners start clean. Anything installed, cached, or configured locally on your laptop does not exist there unless the workflow creates it.",
    },
    {
      term: "Secrets",
      summary:
        "Encrypted values injected as environment variables at runtime. They are masked in logs, not available to some fork-based events, and scoped to a repository, environment, or organisation.",
    },
    {
      term: "Environment variables versus secrets",
      summary:
        "Both arrive as environment variables in the job. The difference is confidentiality and scoping, which is why an empty value is more often a scoping problem than a typo.",
    },
    {
      term: "Artifacts",
      summary:
        "Files uploaded from one job and downloaded by another. They are the supported way to move build output between isolated jobs.",
    },
    {
      term: "Caching",
      summary:
        "Restoring a directory keyed by a hash of lock files. A stale or over-broad key is a leading cause of works-locally-fails-in-CI, and of the reverse.",
    },
    {
      term: "GITHUB_TOKEN permissions",
      summary:
        "An automatically provided token whose permissions are configurable per workflow or job. Insufficient permissions produce a 403 that looks like an outage.",
    },
    {
      term: "OIDC cloud authentication",
      summary:
        "The workflow requests a short-lived identity token and exchanges it for cloud credentials, with no long-lived secrets stored. Requires the id-token permission and a trust policy that matches the repository and ref.",
    },
  ],

  explanations: [
    {
      heading: "Four causes, and how to tell them apart quickly",
      paragraphs: [
        "A pipeline failure is nearly always one of four things. Code: the same failure reproduces locally with the same inputs. Environment: a different tool version, a missing dependency, a different operating system, or an empty variable. Permissions: a 401 or 403 from an API, registry, or cloud provider. Network: a timeout, resolution failure, or TLS error reaching something outside the runner.",
        "The fastest classifier is the error text plus one question: would this fail on my machine with the same inputs? If yes, it is code. If no, the error shape tells you which of the other three it is. Working in that order prevents the common spiral of re-running a pipeline hoping for a different outcome.",
      ],
    },
    {
      heading: "Works locally is a statement about your environment, not the code",
      paragraphs: [
        "Your machine has your tool versions, your globally installed packages, your credentials in a config file or keychain, your DNS, and your network access. A hosted runner has none of that. So works locally, fails in CI is usually true and usually not about the code at all.",
        "The useful move is to enumerate the differences rather than argue with them. Pin tool versions, install dependencies from a lock file, make credentials explicit, and never rely on something being present just because it is present for you.",
      ],
    },
    {
      heading: "Read the log the right way round",
      paragraphs: [
        "Scroll to the first error, not the last. CI logs end with summary failures that are consequences, and the useful line is usually hundreds of lines earlier. Then check which step failed, and whether the step that was supposed to prepare it actually succeeded.",
        "Pay attention to empty values. A command that receives an empty string for a secret often fails in a confusing way: an authentication error, a malformed request, or a request sent to an empty hostname. Echoing the length of a variable, never its contents, is a safe way to confirm it arrived.",
      ],
    },
    {
      heading: "Permissions failures in CI have a recognisable shape",
      paragraphs: [
        "A 403 from a package registry, a cloud API, or the platform itself almost always means the identity used by the job lacks a permission, or the trust policy does not match the context the job runs in. With OIDC, the trust policy typically constrains the repository and the ref, so the same workflow can succeed on a branch and fail on a tag, or succeed for a branch push and fail for a pull request from a fork.",
        "That context sensitivity is the signature. If a pipeline works on one trigger and fails on another with an authorization error, examine the identity and the trust conditions before examining the code, which did not change between triggers.",
      ],
    },
  ],

  commands: [
    {
      command: "cat > /tmp/psl-ci-example.yml <<'YAML'\nname: build\non: [push]\npermissions:\n  contents: read\n  id-token: write\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version-file: .nvmrc\n          cache: npm\n      - run: npm ci\n      - run: npm run build\n      - uses: actions/upload-artifact@v4\n        with:\n          name: build-output\n          path: .next\nYAML\necho written to /tmp/psl-ci-example.yml",
      purpose:
        "Write a minimal workflow locally so you can read its structure without a repository.",
      lookFor:
        "The explicit permissions block, the pinned node version from a file, the lock-file install, and the artifact handover.",
    },
    {
      command: "cat /tmp/psl-ci-example.yml",
      purpose: "Read the workflow back and identify each concept in it.",
      lookFor:
        "Which lines address environment reproducibility, which address permissions, and which address passing data between jobs.",
    },
    {
      command: "node --version; npm --version; cat .nvmrc 2>/dev/null || echo 'no .nvmrc in this project'",
      purpose:
        "Compare your local tool versions against what a workflow would pin.",
      lookFor:
        "Any gap between your versions and a pinned version. Unpinned versions are the most common environment difference.",
    },
    {
      command: "echo \"secret length: ${#EXAMPLE_SECRET}\"",
      purpose:
        "Demonstrate the safe way to check whether a secret arrived: its length, never its value.",
      lookFor:
        "A length of zero, since it is unset here. In CI, zero means a scoping or naming problem rather than a wrong value.",
    },
    {
      command: "env | grep -c . ; echo 'variables visible to this shell'",
      purpose:
        "Appreciate how much of your local environment a command inherits, none of which exists on a fresh runner.",
      lookFor:
        "The count. Every one of those is a potential hidden dependency of a script that works only for you.",
    },
    {
      command: "git log --oneline -5; git status --short | head",
      purpose:
        "Confirm exactly what commit and working tree you are testing locally, so a comparison with CI is valid.",
      lookFor:
        "Uncommitted changes. If your working tree differs from the commit CI built, works locally proves nothing.",
    },
    {
      command: "curl -sS -o /dev/null -w '%{http_code}\\n' https://api.github.com/rate_limit",
      purpose:
        "Check an API that reports limits, since rate limiting is a common and easily misread CI failure.",
      lookFor:
        "A 200 unauthenticated response, and the idea that a 403 here can mean rate limited rather than forbidden.",
    },
    {
      command: "rm -f /tmp/psl-ci-example.yml && echo cleaned",
      purpose: "Clean up the example file.",
      lookFor: "Leaving no scratch files behind.",
    },
  ],

  exercises: [
    {
      id: "d08-e1",
      title: "Build the four-cause classifier",
      steps: [
        "Write the four categories: code, environment, permissions, network.",
        "For each, list two error texts that would place a failure in that bucket.",
        "Write the single question you would ask first to separate code from the other three.",
        "Note which category re-running the job could plausibly fix, and why re-running is otherwise wasted time.",
      ],
      successCriteria:
        "You have a one-page classifier that assigns a category from error text alone in most cases.",
    },
    {
      id: "d08-e2",
      title: "Enumerate your hidden local dependencies",
      steps: [
        "List your local tool versions for the runtime and package manager.",
        "List where your credentials for registries or cloud providers are stored locally.",
        "List anything your project needs that you installed once and forgot.",
        "For each item, write what a workflow would have to do to provide it explicitly.",
      ],
      successCriteria:
        "You have at least five items, each with the workflow step that would make it reproducible.",
    },
    {
      id: "d08-e3",
      title: "Read a workflow for failure modes",
      steps: [
        "Write the example workflow to a file using the command above.",
        "For each step, write one way it could fail and which category that failure belongs to.",
        "Identify what would happen if the permissions block were removed.",
        "Identify what would happen if the cache key matched but the lock file had changed.",
      ],
      successCriteria:
        "You can name a failure mode and category for every step, and predict the effect of removing the permissions block.",
    },
  ],

  scenario: {
    title: "Deploys locally, fails in the pipeline",
    situation: [
      "A deployment script works when an engineer runs it from their laptop. The same script, run by a GitHub Actions workflow on a tag push, fails during the cloud authentication step with an authorization error. The build and test jobs in the same workflow pass.",
      "The workflow has been deploying successfully from the main branch for months. This is the first time it has been triggered by a tag. The engineer has re-run the job four times and opened an incident channel.",
      "A platform engineer mentions in passing that the cloud trust policy for this repository was written last year.",
    ],
    known: [
      "The script succeeds when run manually from a laptop.",
      "Build and test jobs in the same workflow pass.",
      "The failure is an authorization error during cloud authentication.",
      "The workflow has worked for months on main branch pushes.",
      "This is the first tag-triggered run.",
      "The cloud trust policy was written a year ago.",
    ],
    unknown: [
      "Which identity the job presents to the cloud provider, and with what context.",
      "What conditions the trust policy requires, particularly around the ref.",
      "Whether the required permissions are declared for this job.",
      "Whether the laptop run uses the same identity at all, or a long-lived local credential.",
      "Whether anything else differs between a tag trigger and a branch trigger.",
    ],
    task: "Write the investigation plan. Identify which of the four causes this most likely is, and say what evidence makes you confident. Explain specifically why succeeding on the laptop and succeeding on main are both consistent with your hypothesis, and name the one configuration you would read first.",
    guidance: {
      strongPlanIncludes: [
        "Classifying this as a permissions problem from the error shape, and saying why code and network are unlikely.",
        "Noting that the trigger changed, and that the trigger is part of the identity context.",
        "Recognising that the laptop uses a different identity entirely, so it is not a valid control.",
        "Reading the trust policy conditions, especially any ref or branch constraint.",
        "Checking that the job declares the permissions needed to request an identity token.",
      ],
      commonlyMissed: [
        "Noticing the first tag run. The highest-value fact in the report is that this trigger has never been exercised.",
        "Understanding that a trust policy scoped to a branch will reject a tag, which fully explains the symptom.",
        "Discarding the laptop comparison, since local long-lived credentials prove nothing about workflow identity.",
        "Checking the permissions block, since a missing id-token permission produces an authorization-shaped failure too.",
        "Stopping the re-run loop. Re-running cannot change an identity context.",
      ],
      systematicSequence: [
        {
          action: "Read the first error in the failing step, not the summary at the end.",
          reason:
            "The authentication error text usually names the identity and the condition that failed.",
        },
        {
          action: "Classify the failure into one of the four categories.",
          reason:
            "An authorization error from the cloud provider rules out code and most network causes immediately.",
        },
        {
          action: "Compare the failing run's trigger and ref against a successful run's.",
          reason:
            "The only variable that changed is the trigger, which makes it the prime suspect.",
        },
        {
          action: "Read the cloud trust policy conditions for this repository.",
          reason:
            "If it constrains refs to a branch pattern, a tag can never satisfy it.",
        },
        {
          action: "Confirm the job declares the permissions required to obtain an identity token.",
          reason:
            "A second, independent cause with the same error shape, worth eliminating explicitly.",
        },
        {
          action: "Stop re-running and state the required configuration change and its owner.",
          reason:
            "Repeated identical runs produce no new information and delay the actual fix.",
        },
      ],
      conceptsToReview: [
        "Hosted runner ephemerality and what it implies",
        "GITHUB_TOKEN permissions and job-level scoping",
        "OIDC cloud authentication and trust policy conditions",
        "Why works locally is not a control for CI identity",
      ],
    },
  },

  communication: {
    prompt:
      "An incident channel has been opened and people are re-running the job. Write the message that stops the thrashing, states the hypothesis with evidence, and names the next action and its owner.",
    questions: [
      "What is the actual impact, and is an incident the right frame?",
      "What is your hypothesis, and which single fact supports it most strongly?",
      "Why is the laptop success not evidence against your hypothesis?",
      "What is the next action, who owns it, and what will confirm the fix?",
      "How would you explain this to a release manager who only wants to know if they can ship?",
    ],
    examplePhrases: [
      "Please hold off on further re-runs; the failure is deterministic and re-running will not change the identity context.",
      "At this point, we know the build and tests pass and the failure is an authorization error during cloud authentication.",
      "This is the first tag-triggered run, and the trust policy may be scoped to branch refs only.",
      "The laptop run uses a different, long-lived credential, so it does not tell us anything about the workflow identity.",
      "For the release decision: the artifact is built and valid; only the deploy step is blocked, and the fix is a policy change rather than a code change.",
    ],
    tips: [
      "Stop wasted effort explicitly and politely. People re-run because nobody told them it cannot help.",
      "Lead with the one fact that most constrains the hypothesis. Here it is the first tag run.",
      "Separate what is blocked from what is broken. Release managers need that distinction.",
    ],
  },
};
