import type { Day } from "./types";

export const day13: Day = {
  id: 13,
  title: "Incident explanation practice",
  focus: "Explain an investigation clearly, in writing, to two different audiences.",
  estimatedMinutes: 55,
  objective:
    "Describe a technical investigation so that an engineer can continue it and a non-engineer can act on it, separating observation from interpretation throughout.",
  tags: ["communication", "technical-writing", "incident-response"],

  keyConcepts: [
    {
      term: "Observation versus interpretation",
      summary:
        "What you measured, and what you believe it means. Keeping them separate makes your reasoning checkable and your conclusions revisable.",
    },
    {
      term: "Known, unknown, next",
      summary:
        "The three-part spine of any status update. Anything else is detail that can be cut.",
    },
    {
      term: "Impact first",
      summary:
        "Open with who is affected and how badly. Mechanism matters to engineers and only after impact is clear.",
    },
    {
      term: "Confidence language",
      summary:
        "Use confirmed, likely, and possible deliberately and consistently. Imprecise confidence is the most common way technical writing misleads.",
    },
    {
      term: "Falsifiability in writing",
      summary:
        "Stating what would change your mind makes the rest of your argument more credible, and invites correction while it is cheap.",
    },
    {
      term: "Audience translation",
      summary:
        "The same facts, reorganised by what the reader can do about them. Not simplification: reorganisation.",
    },
    {
      term: "Actionable asks",
      summary:
        "A request names the person, the action, and the deadline. Anything vaguer gets queued.",
    },
    {
      term: "Handover completeness",
      summary:
        "An update should let someone else continue without asking you a question. That is the practical test of whether it is finished.",
    },
  ],

  explanations: [
    {
      heading: "The spine that works for every update",
      paragraphs: [
        "Impact, then what is confirmed, then what is unknown, then the next step with an owner and a time. Four parts, in that order. It works for a two-line message and a two-page summary, and it survives being read in a hurry on a phone.",
        "The reason this order works is that each part answers the question the previous one raises. Impact tells the reader whether to keep reading. Confirmed facts tell them what they can rely on. Unknowns tell them what not to assume. The next step tells them what will change and when, which is the only part most readers will remember.",
      ],
    },
    {
      heading: "Say what you measured, then what you think",
      paragraphs: [
        "Write p95 latency rose from 400 milliseconds to 2.1 seconds at 15:10, rather than the database is slow. The first is a fact that stays true; the second is a theory wearing the clothes of a fact. When an investigation changes direction, updates written in the first style remain accurate, while updates written in the second have to be retracted.",
        "Mark interpretation explicitly: this suggests, I suspect, consistent with. The small cost in words buys the ability to be wrong gracefully, which is worth far more than sounding certain.",
      ],
    },
    {
      heading: "Writing for someone who cannot act on mechanism",
      paragraphs: [
        "A non-engineer reader needs four things: who is affected, what they can and cannot do right now, what is being done, and when they will hear more. The mechanism is not merely unnecessary, it displaces the information they need in the space they will actually read.",
        "A reliable technique is one plain sentence of analogy, then straight back to impact and timing. The service is running, but one part of our network is sending requests to the wrong address. Nobody needs to know what a route table is to make a decision based on that.",
      ],
    },
    {
      heading: "Concise technical English, as a practical skill",
      paragraphs: [
        "A few patterns cover most of what an investigation needs to say: stating what you verified, stating what you separated, stating what you know at this point, stating your next step, and stating what would change your mind. Having these as ready-made shapes means you can write a good update quickly while under pressure, which is exactly when it is hardest.",
        "Keep sentences short and put the subject first. Prefer we confirmed to it has been confirmed, because the active form says who did it and takes fewer words. This is ordinary professional writing advice, and it matters more in incident communication than almost anywhere else.",
      ],
    },
  ],

  commands: [
    {
      command:
        "mkdir -p /tmp/psl-writing && printf '# Update\\n\\n**Impact:** \\n\\n**Confirmed:** \\n\\n**Unknown:** \\n\\n**Next step (owner, time):** \\n' > /tmp/psl-writing/update.md && cat /tmp/psl-writing/update.md",
      purpose: "Create the four-part update template you will fill in by hand.",
      lookFor:
        "That the template forces an owner and a time on the next step.",
    },
    {
      command:
        "printf 'observation: p95 latency rose from 400ms to 2.1s at 15:10\\ninterpretation: this is consistent with connection pool saturation\\ndisconfirmed by: pool utilisation flat across the same window\\n'",
      purpose:
        "See the three-line discipline that keeps observation and interpretation apart.",
      lookFor:
        "That each line is a different kind of claim, and only the first is a fact.",
    },
    {
      command: "wc -w /tmp/psl-writing/update.md",
      purpose:
        "Measure your own draft. Length is a proxy for whether you have decided what matters.",
      lookFor:
        "A target of under 120 words for a channel update. Longer means you have not chosen yet.",
    },
    {
      command:
        "python3 -c \"\nimport sys\ntext=open('/tmp/psl-writing/update.md').read()\nhedges=['maybe','probably','sort of','kind of','might be','seems like','i think']\nfound=[h for h in hedges if h in text.lower()]\nprint('vague hedges found:', found or 'none')\nprint('words:', len(text.split()))\"",
      purpose:
        "Check a draft for vague hedging, which is different from calibrated confidence.",
      lookFor:
        "Replace vague hedges with calibrated terms: confirmed, likely, possible, unknown.",
    },
    {
      command: "rm -rf /tmp/psl-writing && echo cleaned",
      purpose: "Clean up the writing practice directory.",
      lookFor: "Leaving no scratch files behind.",
    },
  ],

  exercises: [
    {
      id: "d13-e1",
      title: "Write the same update for two audiences",
      steps: [
        "Pick any scenario from days one to twelve.",
        "Write a technical update using the four-part spine, under 120 words.",
        "Write a non-technical version, under 60 words, with one sentence of analogy and no jargon.",
        "Check that both are consistent: no claim in one that is contradicted or missing in the other.",
      ],
      successCriteria:
        "Both versions stand alone, neither exceeds its word limit, and neither contains a claim the other contradicts.",
    },
    {
      id: "d13-e2",
      title: "Separate observation from interpretation line by line",
      steps: [
        "Take your technical update and split every sentence into observation or interpretation.",
        "Rewrite any sentence that mixes the two.",
        "Add a disconfirming condition to each interpretation.",
        "Mark each interpretation as confirmed, likely, or possible, and make sure the wording matches.",
      ],
      successCriteria:
        "Every sentence is classifiable, and every interpretation carries both a confidence level and a disconfirming condition.",
    },
    {
      id: "d13-e3",
      title: "Run the handover test",
      steps: [
        "Give your update the test: could a colleague continue the investigation from it alone?",
        "List every question they would still have to ask you.",
        "Add only what is needed to eliminate those questions, and cut something else to stay within the word limit.",
        "Write the final version and note which detail you chose to cut.",
      ],
      successCriteria:
        "You produced a final update with no outstanding handover questions, and you can name the detail you deliberately cut.",
    },
  ],

  scenario: {
    title: "Explain an investigation that is still open",
    situation: [
      "Yesterday afternoon a reporting feature started returning empty results for roughly a third of users. You have confirmed that the API returns 200 with an empty list rather than an error, and that the affected users all belong to organisations created after a migration two weeks ago. Users in older organisations are unaffected.",
      "You have not yet established why the newer organisations behave differently. A data engineer is checking whether a backfill completed. The feature owner is on leave, and their manager is asking for an update to send to two enterprise customers who have raised tickets.",
      "It is 16:00. You expect to know more within two hours but cannot promise a resolution today.",
    ],
    known: [
      "Roughly one third of users see empty results in the reporting feature.",
      "The API returns 200 with an empty list, not an error.",
      "Affected users belong to organisations created after a migration two weeks ago.",
      "Users in organisations created before the migration are unaffected.",
      "A backfill is being checked by a data engineer.",
    ],
    unknown: [
      "Whether the backfill completed for the newer organisations.",
      "Whether the empty result is a data problem or a query filter problem.",
      "Whether any data has been lost, as opposed to being unreadable by this feature.",
      "Whether other features relying on the same data are affected.",
      "When a fix can be delivered.",
    ],
    task: "Write three pieces of communication: a technical update for the engineering channel, a short message the manager can forward to enterprise customers, and a handover note for whoever picks this up if it is unresolved at the end of your day. Keep observation and interpretation separate in all three, and do not promise anything you cannot support.",
    guidance: {
      strongPlanIncludes: [
        "Leading with impact and a scope boundary in all three documents.",
        "Stating that the API returns a success status, since that shapes what customers and engineers should expect.",
        "Explicitly separating what is confirmed from what is being checked.",
        "Addressing the data loss question directly, since that is what an enterprise customer actually wants to know.",
        "Giving a next update time rather than a resolution time.",
        "A handover note that names the open thread and the person already working on it.",
      ],
      commonlyMissed: [
        "Answering the question customers will ask first: is our data gone. Even an honest we do not yet know is better than silence.",
        "Noting that the API returns 200, which explains why monitoring did not catch it and matters for the engineering audience.",
        "Stating the scope boundary as a negative: organisations created before the migration are unaffected.",
        "Avoiding a fix estimate while still committing to a next update time.",
        "Including, in the handover, what has already been ruled out so the next person does not repeat it.",
        "Checking whether other features share the same data, since the customer-facing message would change if so.",
      ],
      systematicSequence: [
        {
          action: "Write the confirmed facts as observations, with no interpretation attached.",
          reason:
            "These are reusable across all three audiences and are the only part that will not change.",
        },
        {
          action: "Write the scope boundary, including who is not affected.",
          reason:
            "It is the most reassuring and most informative single sentence available to you.",
        },
        {
          action: "Decide what you can responsibly say about data loss.",
          reason:
            "It is the question the customer cares about, and a vague answer here destroys trust later.",
        },
        {
          action: "Draft the technical update with the four-part spine.",
          reason:
            "Engineers need the mechanism and the current hypothesis in order to help.",
        },
        {
          action: "Reduce to a customer-facing version organised by what they can do.",
          reason:
            "Translation is reorganisation by reader action, not a simplified version of the same text.",
        },
        {
          action: "Write the handover note with open threads, owners, and what is already ruled out.",
          reason:
            "The handover is what prevents the investigation restarting from zero tomorrow morning.",
        },
      ],
      conceptsToReview: [
        "The impact, confirmed, unknown, next-step spine",
        "Observation versus interpretation",
        "Calibrated confidence language",
        "Audience translation as reorganisation",
      ],
    },
  },

  communication: {
    prompt:
      "This day is itself the communication exercise. Use the notes field for the three documents, then review your own writing against the checklist in the guidance. Mark the one sentence in your drafts that is least defensible and rewrite it.",
    questions: [
      "What happened, stated as impact rather than mechanism?",
      "What is confirmed, and what is the evidence for each confirmed item?",
      "What is unknown, and who is finding out?",
      "What would you check next, and what evidence would you collect?",
      "How would you explain this to engineers, and how would you explain it to a customer?",
    ],
    examplePhrases: [
      "First, I would verify whether the issue is reproducible.",
      "I would separate network connectivity from authentication.",
      "At this point, we know that DNS resolution succeeds, but the TCP connection times out.",
      "My next step would be to inspect the outbound network policy.",
      "To summarise what is confirmed: the API responds successfully, and the empty results are limited to organisations created after the migration.",
      "We have not yet established whether any data is missing, and I will not speculate on that until the backfill check completes.",
      "I will send the next update by 18:00, whether or not we have a cause.",
    ],
    tips: [
      "Write the confirmed facts once and reuse them. Rewriting from scratch per audience introduces contradictions.",
      "Never give a resolution time you cannot defend. Give a next update time instead; it satisfies the same need.",
      "Read your draft asking what question a reader would still have. That question is usually the thing worth adding.",
    ],
  },
};
