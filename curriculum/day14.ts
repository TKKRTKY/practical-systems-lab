import type { Day } from "./types";

export const day14: Day = {
  id: 14,
  title: "End-to-end debugging challenge",
  focus: "One failure, many candidate layers. Plan before you touch anything.",
  estimatedMinutes: 90,
  objective:
    "Produce a complete, ordered investigation plan for an ambiguous multi-layer failure, then compare it against a systematic sequence and identify your own gaps.",
  tags: [
    "dns",
    "routing",
    "firewalls",
    "tls",
    "proxies",
    "authentication",
    "configuration",
  ],

  keyConcepts: [
    {
      term: "Layer elimination",
      summary:
        "Work in an order where each result invalidates whole families of explanation. Cheap, high-elimination checks come first.",
    },
    {
      term: "Failure shape",
      summary:
        "Timeout, refusal, resolution error, certificate error, status code. The shape constrains the layer before you know anything else.",
    },
    {
      term: "Controls",
      summary:
        "A working case to compare against. Choose controls that differ in exactly one dimension from the failing case.",
    },
    {
      term: "Change correlation",
      summary:
        "What changed near the start of the symptom, including changes made by other teams and by scheduled automation.",
    },
    {
      term: "Layered causes",
      summary:
        "Fixing one layer can expose the next. Expect a sequence, and treat each resolved layer as progress rather than a new incident.",
    },
    {
      term: "Evidence before action",
      summary:
        "Capture what you need before changing anything, because most remedies destroy the evidence that would have confirmed them.",
    },
    {
      term: "Ownership boundaries",
      summary:
        "Knowing which team owns each layer lets you parallelise requests instead of waiting serially.",
    },
  ],

  explanations: [
    {
      heading: "How this day works",
      paragraphs: [
        "Read the scenario, then write a complete investigation plan in the notes field before revealing any guidance. The plan should be specific enough that another engineer could execute it without asking you questions.",
        "Only after you have saved your plan should you reveal the review. It gives you the strong points a good plan contains, the steps most people miss, a systematic sequence, and the concepts to revisit. Compare honestly, mark this day as needing review if the comparison was uncomfortable, and come back to it.",
      ],
    },
    {
      heading: "What a complete plan contains",
      paragraphs: [
        "An ordered list of checks, each with the result you expect and what each possible result would eliminate. A named control case. An explicit note of evidence to capture before making changes. An identification of which layers you cannot check yourself, and who owns them. And finally, a statement of what you would do first if the service needed to be restored before the cause was known.",
        "Plans that omit the last two are the usual reason an investigation stalls. Technical completeness without ownership awareness produces a correct plan that nobody can execute in time.",
      ],
    },
    {
      heading: "Ordering by elimination, not by layer",
      paragraphs: [
        "The familiar bottom-up order, DNS then TCP then TLS then HTTP then application, is a good default but not a rule. The better rule is to order by how much each check eliminates per unit of effort. If you have one working client and one failing client on the same path, comparing their configuration can eliminate four layers in one step.",
        "In practice you alternate: a cheap elimination, then a bottom-up walk through whatever survives. The people who are fast at this are not the ones who know more commands; they are the ones who pick the next check well.",
      ],
    },
  ],

  commands: [
    {
      command: "echo 'Write your plan before running anything. The plan is the exercise.'",
      purpose:
        "A deliberate reminder: today the thinking happens before the tooling.",
      lookFor:
        "Resisting the urge to start typing commands. Write the plan first.",
    },
    {
      command:
        "printf 'layer,check,expected if healthy,eliminates if healthy,owner\\nDNS,,,,\\nrouting,,,,\\nfirewall,,,,\\nTLS,,,,\\nproxy,,,,\\nauth,,,,\\nconfig,,,,\\n' > /tmp/psl-plan.csv && cat /tmp/psl-plan.csv",
      purpose:
        "Create a worksheet with one row per candidate layer, to fill in as you plan.",
      lookFor:
        "The eliminates column. If a check eliminates nothing, it does not belong in the plan.",
    },
    {
      command:
        "for h in example.com api.example.com internal.example.com; do printf '%-26s %s\\n' \"$h\" \"$(dig +short \"$h\" | head -1 || true)\"; done",
      purpose:
        "Practise a fast resolution sweep across several hostnames at once.",
      lookFor:
        "Which names resolve and which return nothing. One command, several layers constrained.",
    },
    {
      command:
        "for p in 443 8443 9999; do printf 'port %-5s ' \"$p\"; nc -vz -w 3 example.com \"$p\" 2>&1 | tail -1; done",
      purpose: "Sweep several ports and compare the failure shapes side by side.",
      lookFor:
        "Which ports succeed, refuse, or time out. Shape differences across ports localise policy quickly.",
    },
    {
      command:
        "curl -sS -o /dev/null -w 'dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} code=%{http_code}\\n' https://example.com",
      purpose:
        "One command that reports on four layers at once, which is why it is a good opening move.",
      lookFor:
        "The first phase that is zero or absent. That is where the request stopped.",
    },
    {
      command:
        "openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | openssl x509 -noout -issuer -subject -dates",
      purpose: "Check who issued the certificate and whether it is currently valid.",
      lookFor:
        "An unexpected issuer, which indicates interception, or dates that straddle today.",
    },
    {
      command: "env | grep -iE 'proxy|ca_cert|cafile' | sort; echo '(empty means no overrides in this shell)'",
      purpose: "Rule the proxy and trust layers in or out for this specific client.",
      lookFor:
        "Any override. These explain differences between clients on one machine.",
    },
    {
      command: "rm -f /tmp/psl-plan.csv && echo cleaned",
      purpose: "Clean up the worksheet when you are finished.",
      lookFor: "Leaving no scratch files behind.",
    },
  ],

  exercises: [
    {
      id: "d14-e1",
      title: "Write the plan before revealing anything",
      steps: [
        "Read the scenario carefully and list every layer that could plausibly be involved.",
        "For each layer, write one check, the expected healthy result, and what a healthy result eliminates.",
        "Order the checks by elimination per unit of effort, not by layer.",
        "Save the plan in the investigation notes field.",
      ],
      successCriteria:
        "Your saved plan covers at least six layers, each with a check and an elimination, in a defended order.",
    },
    {
      id: "d14-e2",
      title: "Name your controls and your evidence",
      steps: [
        "Identify every working case available to you as a control.",
        "For each, state which single dimension it differs from the failing case in.",
        "List the evidence you would capture before changing anything.",
        "List which layers you cannot check yourself, with the owner of each.",
      ],
      successCriteria:
        "You have at least two controls with a stated difference, an evidence list, and an owner for every layer you cannot check.",
    },
    {
      id: "d14-e3",
      title: "Review your plan against the guidance",
      steps: [
        "Reveal the review only after saving your plan.",
        "Mark each strong point you covered and each missed step you omitted.",
        "Compare your ordering against the systematic sequence and note where they differ and why.",
        "Set your self-assessment honestly, and mark the day for review if the gaps were substantial.",
      ],
      successCriteria:
        "You have an explicit list of what you missed, and a decision about which earlier days to revisit.",
    },
  ],

  scenario: {
    title: "A cloud application cannot reach an internal service",
    situation: [
      "An application running in a cloud environment cannot reach an internal service at svc.internal.example.com. The failure began at some point in the last twenty four hours. The application logs one line per attempt: a generic request failed message with no detail, after what looks like a long pause.",
      "The same application, running in a second cloud environment that is configured from the same templates, works. An engineer can reach the internal service from their laptop while connected to the corporate network. The internal service team reports normal traffic volumes and no errors on their side, though they cannot tell whether traffic from this particular environment is arriving at all.",
      "In the last twenty four hours: the application image was rebuilt, a platform team rolled out a network policy change to one environment, and an internal certificate authority was rotated according to a schedule published last month. Nobody has correlated any of these with the symptom yet.",
    ],
    known: [
      "One cloud environment fails; a second, built from the same templates, works.",
      "The failure appeared within the last twenty four hours.",
      "The application logs a generic failure after a long pause, with no layer detail.",
      "A laptop on the corporate network can reach the internal service.",
      "The internal service team sees normal traffic and no errors, but cannot confirm traffic from this environment.",
      "Three changes landed in the window: an image rebuild, a network policy rollout to one environment, and a certificate authority rotation.",
    ],
    unknown: [
      "Whether the hostname resolves from inside the failing environment, and to what address.",
      "Whether TCP connections are established, refused, or dropped.",
      "Whether TLS completes, and which authority signed the certificate presented.",
      "Whether the request passes through a proxy, and whether that proxy is configured for this client.",
      "Whether authentication succeeds, and what identity the application presents.",
      "Which of the three changes applied to the failing environment specifically.",
      "Whether the application configuration differs between the two environments despite shared templates.",
    ],
    task: "Write a complete investigation plan before revealing any guidance. Include: an ordered list of checks with the expected result and what each eliminates; which controls you would use and how they differ from the failing case; the evidence you would capture before changing anything; which layers you cannot check yourself and who owns them; and what you would do first if the application had to be restored before the cause was known. Save the plan, then reveal the review and compare.",
    guidance: {
      strongPlanIncludes: [
        "Using the working second environment as the primary control, since it differs in very few dimensions.",
        "Starting with a single command that reports on several layers at once, to find where the request stops.",
        "Reading the long pause as evidence of dropped traffic rather than refusal, and saying so explicitly.",
        "Mapping each of the three changes to whether it applied to the failing environment.",
        "Checking the certificate issuer, given a certificate authority rotation in the window.",
        "Planning for layered causes, since the image rebuild and the authority rotation could both be involved.",
        "Naming owners for the network policy, the certificate authority, and the internal service.",
        "Stating a restoration option that does not depend on knowing the cause.",
      ],
      commonlyMissed: [
        "Diffing the two environments. A working environment built from the same templates is the most valuable evidence available, and plans routinely ignore it.",
        "Testing from inside the failing environment rather than from a laptop. The laptop sits inside boundaries the environment does not.",
        "Getting layer detail out of a generic error, by reproducing the request with a verbose client inside the environment.",
        "Checking whether the certificate authority rotation reached the rebuilt image's trust store, which is exactly the kind of coincidence that produces this symptom.",
        "Asking the internal service team to confirm whether any traffic from this environment arrives, which cleanly splits the problem in half.",
        "Mapping the network policy rollout to environments, since the report says it went to one environment and two exist.",
        "Capturing evidence before rebuilding or redeploying, which are the first things people try and the fastest way to lose the trail.",
        "Considering that more than one of the three changes may be contributing.",
      ],
      systematicSequence: [
        {
          action: "Reproduce the failure from inside the failing environment with a verbose client, capturing phase timings.",
          reason:
            "The application's generic error hides the layer. One verbose request tells you where it stops and makes everything after this targeted.",
        },
        {
          action: "Resolve the hostname from inside both environments and compare the answers.",
          reason:
            "A resolution difference would explain everything and costs one command in each place.",
        },
        {
          action: "Test the raw TCP port from inside both environments and compare the failure shapes.",
          reason:
            "Established, refused, and dropped point at three different owners, and the comparison isolates the difference.",
        },
        {
          action: "Ask the internal service team whether any traffic from the failing environment arrives.",
          reason:
            "This splits the problem into before or after the service boundary, which no amount of local testing can do.",
        },
        {
          action: "If TCP succeeds, inspect the TLS handshake and the issuer of the presented certificate.",
          reason:
            "The certificate authority rotation in the change window makes trust a leading hypothesis once the path is proven.",
        },
        {
          action: "Diff the two environments: network policy, proxy settings, trust store contents, image version, and application configuration.",
          reason:
            "With a working control built from the same templates, the difference is the cause, and this is the step that finds it.",
        },
        {
          action: "Map each of the three changes to the failing environment and to the symptom start time.",
          reason:
            "Change correlation separates the coincidental changes from the causal one, and may show that two of them interact.",
        },
        {
          action: "If authentication is reached and fails, compare the identity and credentials used in both environments.",
          reason:
            "An identity failure after a trust fix is the expected next layer, not a new incident.",
        },
      ],
      conceptsToReview: [
        "Failure shapes and what each eliminates (Day 1, Day 2, Day 3)",
        "Egress policy and proxy configuration per client (Day 3, Day 12)",
        "Certificate trust and per-runtime trust stores (Day 2, Day 12)",
        "Change correlation and evidence capture (Day 11)",
        "Choosing controls that differ in one dimension (Day 11, Day 14)",
      ],
    },
  },

  communication: {
    prompt:
      "Write the message you would post after your first thirty minutes, before you have a cause. It must coordinate three teams, say what you have eliminated, and ask each owner for exactly one thing. Then write two sentences a non-engineer could use to explain the situation.",
    questions: [
      "What is the impact, and what is the scope boundary?",
      "What have you eliminated, and what evidence eliminated it?",
      "What single thing do you need from each of the three owners?",
      "What is your leading hypothesis, and what would disconfirm it?",
      "How would you explain a multi-layer failure to someone without implying everything is broken?",
    ],
    examplePhrases: [
      "First, I would verify whether the issue is reproducible from inside the affected environment.",
      "I would separate network connectivity from authentication before involving the identity team.",
      "At this point, we know that DNS resolution succeeds, but the TCP connection times out.",
      "My next step would be to inspect the outbound network policy.",
      "The second environment is built from the same templates and works, so I am treating the difference between them as the fastest path to a cause.",
      "Three changes landed in the window. I am not assuming any of them yet, and I will map each to this environment before drawing a conclusion.",
      "In plain terms: one of our two copies of this application has lost its route to an internal system, and we are comparing the two to find what differs.",
    ],
    tips: [
      "With three candidate changes, say explicitly that you have not chosen one. It keeps other teams from defending themselves instead of helping.",
      "Ask each owner for one specific thing. Three precise asks get answered; one broad ask gets discussed.",
      "Lead with the control case. We have a working copy is the most useful sentence you can give a reader.",
    ],
  },
};
