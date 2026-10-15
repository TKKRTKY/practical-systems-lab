import type { Day } from "./types";

export const day10: Day = {
  id: 10,
  title: "Observability",
  focus: "Decide what evidence to collect first when nothing is obviously broken.",
  estimatedMinutes: 55,
  objective:
    "Choose between logs, metrics, and traces for a given question, and build an evidence plan for a slow system with no visible errors.",
  tags: ["observability", "metrics", "logs", "tracing", "latency"],

  keyConcepts: [
    {
      term: "Logs",
      summary:
        "Discrete records of events. Best for the detail of a specific occurrence, worst for answering how often or how bad.",
    },
    {
      term: "Metrics",
      summary:
        "Numbers aggregated over time. Best for scope, trend, and whether something is abnormal, and unable to explain any individual request.",
    },
    {
      term: "Traces",
      summary:
        "A single request's path across services with timing per span. The only tool that answers which hop is slow without guesswork.",
    },
    {
      term: "Correlation ID",
      summary:
        "An identifier propagated across service boundaries so records about one request can be joined. Without it, cross-service investigation is manual and slow.",
    },
    {
      term: "Percentiles",
      summary:
        "Averages hide the experience of the worst-served users. The 95th and 99th percentiles are where slow is visible, and where it is usually reported from.",
    },
    {
      term: "Error rate",
      summary:
        "Errors as a proportion of traffic. An absolute count rises with traffic and tells you much less than a rate.",
    },
    {
      term: "Saturation",
      summary:
        "How close a resource is to its limit: connection pools, thread pools, queues, CPU, memory, file descriptors. Saturation produces latency without errors, which is exactly the hard case.",
    },
    {
      term: "Symptom versus cause",
      summary:
        "Slow is a symptom. A connection pool at its limit is closer to a cause. Fixing symptoms produces incidents that recur.",
    },
    {
      term: "Cardinality",
      summary:
        "The number of distinct label combinations on a metric. High cardinality makes metrics expensive and sometimes unavailable at the moment you need them.",
    },
  ],

  explanations: [
    {
      heading: "Pick the tool by the question, not by habit",
      paragraphs: [
        "Three questions map cleanly onto three tools. How many and how bad is a metrics question: it establishes scope and whether this is abnormal. Which part is slow is a tracing question: it localises the delay to a hop. What exactly happened in this case is a logs question: it gives you the detail once you know where to look.",
        "Investigations stall when people start with logs, because logs are detailed and compelling and reveal nothing about scope. Starting with metrics is almost always right: you need to know how big the problem is before you need to know what it is.",
      ],
    },
    {
      heading: "Latency without errors usually means waiting",
      paragraphs: [
        "A system that gets slower while the error rate stays flat is usually queueing somewhere. Requests are waiting for a database connection, a thread, a lock, a downstream call, or disk. Nothing has failed yet, so there is nothing in the error logs, which is why the classic report is slow but no errors.",
        "The investigative move is to look for saturation rather than failure: pool utilisation, queue depth, wait times, and the ratio between time spent working and time spent waiting. If you can see the gap between a request arriving and work starting, you have found the queue.",
      ],
    },
    {
      heading: "Measure where the user is, then work inwards",
      paragraphs: [
        "Start with the outermost measurement that reflects user experience, then decompose. If total latency at the edge is up, split it by endpoint, then by downstream dependency, then by instance. At each level you are asking whether the increase is uniform or concentrated.",
        "Concentration is the most valuable finding at every level. One slow endpoint, one slow dependency, one slow instance, or one slow availability zone turns an open-ended problem into a specific one. Uniform degradation points at something shared: a dependency everyone uses, a resource everyone contends for, or a change deployed everywhere.",
      ],
    },
    {
      heading: "Write down what would disconfirm your hypothesis",
      paragraphs: [
        "A hypothesis you cannot disprove is not a hypothesis. Before collecting more evidence, write what you expect to see if you are right and what you would see if you are wrong. This prevents the most common failure mode in observability work, which is finding something that looks suspicious and treating it as the cause.",
        "There is always something anomalous in a large system. The discipline is to ask whether the anomaly can account for the magnitude, timing, and shape of the symptom. If it cannot, it is a distraction regardless of how interesting it is.",
      ],
    },
  ],

  commands: [
    {
      command:
        "for i in 1 2 3 4 5; do curl -sS -o /dev/null -w '%{time_connect} %{time_starttransfer} %{time_total}\\n' https://example.com; done",
      purpose:
        "Produce a small latency sample and see the spread rather than a single number.",
      lookFor:
        "Variation between runs. One measurement is never evidence about latency.",
    },
    {
      command:
        "for i in $(seq 1 20); do curl -sS -o /dev/null -w '%{time_total}\\n' https://example.com; done | sort -n | awk '{a[NR]=$1} END {printf \"n=%d p50=%.3f p95=%.3f max=%.3f\\n\", NR, a[int(NR*0.5)], a[int(NR*0.95)], a[NR]}'",
      purpose: "Compute percentiles from a real sample rather than reading an average.",
      lookFor:
        "The gap between p50 and p95. That gap is what users complaining about slowness are experiencing.",
    },
    {
      command:
        "curl -sS -o /dev/null -w 'dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\\n' https://example.com",
      purpose:
        "Decompose one request into phases, which is tracing in miniature.",
      lookFor:
        "Where the time accumulates. Subtract each phase from the next to get the duration of that phase.",
    },
    {
      command:
        "python3 -c \"import uuid; cid=str(uuid.uuid4()); print('correlation id:', cid)\" ",
      purpose: "Generate a correlation identifier to carry through a request.",
      lookFor:
        "The idea that this value must be propagated in a header and logged by every service to be useful.",
    },
    {
      command:
        "curl -sS -o /dev/null -D - -H \"X-Correlation-Id: $(uuidgen)\" https://example.com | head -5",
      purpose:
        "Send a correlation header and observe that propagation is a convention, not automatic.",
      lookFor:
        "Nothing echoes it back here. Propagation only works if every service is instrumented to pass it on.",
    },
    {
      command:
        "python3 -c \"\nreqs=[0.02]*95+[2.5]*5\nn=len(reqs); avg=sum(reqs)/n; s=sorted(reqs)\nprint(f'avg={avg:.3f}s p50={s[n//2]:.3f}s p95={s[int(n*0.95)-1]:.3f}s p99={s[int(n*0.99)-1]:.3f}s')\"",
      purpose:
        "Demonstrate numerically how an average conceals a serious problem for a minority of requests.",
      lookFor:
        "An acceptable average alongside a p95 that would generate complaints. This is why dashboards showing averages mislead.",
    },
    {
      command:
        "python3 -c \"\nimport math\nrho=[0.5,0.8,0.9,0.95,0.99]\nprint('utilisation -> relative wait time')\nfor r in rho: print(f'{r:>4} -> {1/(1-r):>6.1f}x')\"",
      purpose:
        "See how wait time grows as a resource approaches saturation.",
      lookFor:
        "The curve is not linear. A pool at 95 percent utilisation behaves nothing like one at 80 percent, which is why saturation shows up as sudden slowness.",
    },
    {
      command: "uptime; vm_stat | head -6",
      purpose:
        "Read local saturation signals: load average and memory pressure on your own machine.",
      lookFor:
        "Load relative to core count, and page-out activity. The same categories apply to any host you investigate.",
    },
  ],

  exercises: [
    {
      id: "d10-e1",
      title: "Match question to tool",
      steps: [
        "Write six investigation questions you have actually asked or been asked about a system.",
        "For each, assign logs, metrics, or traces, and justify it in one line.",
        "Identify which of the six you cannot answer today with the tools available to you.",
        "For one of those gaps, write what instrumentation would close it.",
      ],
      successCriteria:
        "Every question has a tool and a justification, and you have named at least one real instrumentation gap.",
    },
    {
      id: "d10-e2",
      title: "Show yourself why averages lie",
      steps: [
        "Run the percentile command against a real endpoint and record p50, p95, and max.",
        "Run the synthetic distribution command and compare average against p95.",
        "Write the sentence you would use to explain to a stakeholder why the dashboard looks fine while users complain.",
        "Decide which single metric you would add to a dashboard that currently shows only averages.",
      ],
      successCriteria:
        "You can explain the average-versus-percentile problem with your own numbers, not a borrowed example.",
    },
    {
      id: "d10-e3",
      title: "Write an evidence plan for slow with no errors",
      steps: [
        "List the first five pieces of evidence you would collect, in order.",
        "For each, write what result would support and what would weaken a saturation hypothesis.",
        "Mark which evidence you could gather in under a minute.",
        "Write the one measurement you would want that you probably do not have today.",
      ],
      successCriteria:
        "Your plan starts with scope rather than detail, and every item has a disconfirming outcome written next to it.",
    },
  ],

  scenario: {
    title: "The application got slow, and nothing is erroring",
    situation: [
      "Support has escalated a pattern of complaints: the application feels slow. The complaints started sometime yesterday afternoon and have continued today. The error rate dashboard is flat, the uptime checks are green, and the service owners say they have deployed nothing for a week.",
      "One engineer has been reading application logs for two hours and has found nothing unusual. Another insists it must be the database because it usually is. A third has noticed that the slowness seems worse in the afternoon but has not quantified it.",
      "You have access to dashboards and logs. There is partial tracing: the edge service and one internal service emit spans, the rest do not.",
    ],
    known: [
      "Complaints began yesterday afternoon and continue.",
      "Error rate is flat and uptime checks are green.",
      "No deployments to the service for a week.",
      "The slowness may be worse in the afternoon, unquantified.",
      "Tracing coverage is partial.",
    ],
    unknown: [
      "How much slower, measured at which percentile, for which endpoints.",
      "Whether the degradation is uniform or concentrated in a subset of traffic.",
      "Whether request volume has changed over the same period.",
      "Whether any dependency, resource pool, or queue is near saturation.",
      "Whether anything changed outside this service: a dependency, a configuration, data volume, or a scheduled job.",
    ],
    task: "Write the evidence plan. Order it by information gained, not by convenience. For each item, state what result would support and what would weaken a saturation hypothesis. Also state what you would tell the engineer who has been reading logs for two hours, and why.",
    guidance: {
      strongPlanIncludes: [
        "Quantifying the symptom first: how much slower, at which percentile, since when.",
        "Establishing whether the degradation is uniform or concentrated before looking for causes.",
        "Checking volume alongside latency, since a traffic change explains saturation without any code change.",
        "Looking for saturation signals explicitly: pool utilisation, queue depth, wait time.",
        "Using the afternoon pattern as a testable claim rather than an anecdote.",
        "Writing what would disconfirm the leading hypothesis.",
      ],
      commonlyMissed: [
        "Quantifying the complaint. Slow without a number cannot be confirmed fixed later.",
        "Checking request volume. Most no-change slowdowns are load changes meeting a limit that was always there.",
        "Looking beyond this service. No deployments here does not mean no changes anywhere.",
        "Treating flat error rates as evidence of health, when queueing produces latency without errors.",
        "Testing the time-of-day pattern, which if real narrows the cause enormously.",
        "Stopping unfocused log reading, which produces interesting findings and no scope.",
      ],
      systematicSequence: [
        {
          action: "Quantify latency at p50, p95, and p99 before and after the reported start.",
          reason:
            "You cannot localise a change you have not measured, and you will need a baseline to confirm any fix.",
        },
        {
          action: "Split the latency increase by endpoint, dependency, and instance.",
          reason:
            "Concentration points at a specific component; uniformity points at something shared.",
        },
        {
          action: "Overlay request volume on the latency change.",
          reason:
            "A volume increase meeting a fixed capacity explains slowness with no deployment.",
        },
        {
          action: "Check saturation signals on the suspect path: pools, queues, threads, CPU, memory.",
          reason:
            "Latency without errors is usually waiting, and waiting shows up as utilisation.",
        },
        {
          action: "Use traces for the instrumented hops to split time between services.",
          reason:
            "Partial tracing still answers whether the time is spent in the edge, the known internal service, or everything else.",
        },
        {
          action: "Test the time-of-day claim against the data, then look for changes outside the service.",
          reason:
            "A confirmed periodic pattern implicates scheduled work or load cycles, which narrows the search sharply.",
        },
      ],
      conceptsToReview: [
        "When to use logs, metrics, and traces",
        "Percentiles versus averages",
        "Saturation and non-linear queueing behaviour",
        "Symptom versus cause, and how to tell them apart",
      ],
    },
  },

  communication: {
    prompt:
      "Write the first substantive update on this investigation, roughly thirty minutes in, when you have quantified the symptom but do not yet have a cause. The audience is a mixed channel of engineers and support staff.",
    questions: [
      "What is the measured impact, stated in numbers a support agent could repeat?",
      "What have you ruled out, and on what evidence?",
      "What is your current hypothesis, and what would disconfirm it?",
      "What are you doing next, and when will you update again?",
      "How would you tell support what to say to a customer who asks if it is fixed?",
    ],
    examplePhrases: [
      "We have quantified it: p95 latency on the main endpoint is up from 400 milliseconds to 2.1 seconds since about 3pm yesterday.",
      "The error rate being flat is consistent with requests queueing rather than failing, so I am treating this as a saturation question.",
      "At this point, we know the degradation is concentrated in two endpoints rather than across all traffic.",
      "My next step would be to check connection pool utilisation on the path those two endpoints share.",
      "For support: it is not fixed, we have confirmed it is real and measurable, and the next update will be in thirty minutes.",
    ],
    tips: [
      "Give numbers, not adjectives. Support staff need a sentence they can repeat to a customer.",
      "Say what flat errors mean rather than letting people read it as nothing is wrong.",
      "Commit to a next update time. It stops the channel from asking for one.",
    ],
  },
};
