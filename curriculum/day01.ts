import type { Day } from "./types";

export const day01: Day = {
  id: 1,
  title: "DNS, TCP, and basic connectivity",
  focus: "Separate name resolution from reachability, and prove which one broke.",
  estimatedMinutes: 60,
  objective:
    "Given a report that something cannot be reached, determine within a few commands whether the failure is DNS resolution, TCP connectivity, or the target service itself.",
  tags: ["dns", "tcp", "connectivity", "ports"],

  keyConcepts: [
    {
      term: "Name resolution",
      summary:
        "Turning a hostname into one or more IP addresses. It happens before any connection is attempted, so it can fail entirely on its own.",
    },
    {
      term: "Resolver vs authoritative server",
      summary:
        "Your machine asks a configured resolver; the resolver asks the chain of authoritative servers. Stale or wrong answers usually come from the resolver, not the zone.",
    },
    {
      term: "NXDOMAIN vs empty answer vs SERVFAIL",
      summary:
        "NXDOMAIN means the name does not exist. An empty answer means the name exists but has no record of that type. SERVFAIL means the resolver could not get an answer at all.",
    },
    {
      term: "TCP three-way handshake",
      summary:
        "SYN, SYN-ACK, ACK. A completed handshake proves a process is listening and the path allows traffic both ways.",
    },
    {
      term: "Connection refused vs timeout",
      summary:
        "Refused means something answered with RST: you reached the host, nothing is listening on that port. A timeout means no answer at all, which usually points at a firewall, routing, or the wrong address.",
    },
    {
      term: "Port",
      summary:
        "A 16-bit number identifying a listener on a host. Reachability is always per host and port, never just per host.",
    },
    {
      term: "ICMP is not TCP",
      summary:
        "ping tests ICMP echo. Many networks drop ICMP while allowing TCP, so a failed ping is weak evidence and a successful ping proves little about your service.",
    },
  ],

  explanations: [
    {
      heading: "The layers you are actually testing",
      paragraphs: [
        "Almost every connectivity complaint resolves to one of four questions, in order: does the name resolve, does the TCP connection establish, does the service respond, and does the service respond correctly. Each question has a different owner and a different fix, so answering them in order saves hours.",
        "The reason to work bottom-up is that a failure at a lower layer makes every higher-layer observation meaningless. If a hostname resolves to an old IP address, nothing you learn from the HTTP response tells you anything about the service you meant to reach.",
      ],
    },
    {
      heading: "Read the failure mode, not just the failure",
      paragraphs: [
        "The shape of a failure carries more information than the fact of it. An immediate refusal means packets reached a host that actively rejected them, which tells you routing works and the port is closed. A hang that ends in a timeout means your packets went somewhere and nothing came back, which points at a filtering device, an asymmetric route, or an address that nobody answers for.",
        "Time the failure. Instant failures are local or administrative: a bad name, a closed port, a proxy rejecting you. Slow failures are almost always silent drops. Getting into the habit of noticing how long something takes to fail turns a vague report into a hypothesis.",
      ],
    },
    {
      heading: "Your machine resolves names in more places than you think",
      paragraphs: [
        "On macOS, the answer you get from a browser or application can differ from what dig reports. dig talks to a DNS server directly over the network, while applications usually go through the system resolver, which also consults /etc/hosts, per-domain resolvers, VPN-supplied search domains, and a cache.",
        "This is why a seemingly impossible bug report, where curl works and the application does not, is often perfectly ordinary: the two are not asking the same resolver the same question.",
      ],
    },
    {
      heading: "Reserved names and addresses for safe practice",
      paragraphs: [
        "Use example.com and its subdomains for hostnames, and 192.0.2.0/24, 198.51.100.0/24, and 203.0.113.0/24 for addresses. These exist precisely so that documentation and exercises never collide with real infrastructure.",
        "192.0.2.1 is particularly useful: it is a valid, routable-looking address that nobody answers for, which makes it a reliable way to produce a genuine connection timeout on demand.",
      ],
    },
  ],

  commands: [
    {
      command: "dig example.com A +noall +answer",
      purpose:
        "Resolve a hostname to IPv4 addresses with the noise stripped out.",
      lookFor:
        "The record type, the TTL, and the address. A low TTL means answers can change quickly; a long TTL means a stale answer may stick around after a fix.",
    },
    {
      command: "dig @1.1.1.1 example.com +short",
      purpose:
        "Ask a specific public resolver instead of the one your machine is configured to use.",
      lookFor:
        "Whether the answer differs from your system resolver. A difference is the single strongest signal that the problem is DNS and not the service.",
    },
    {
      command: "dig no-such-host.example.com",
      purpose: "See what a non-existent name looks like.",
      lookFor:
        "status: NXDOMAIN in the header, and an empty ANSWER section. Compare this with a name that exists but has no A record.",
    },
    {
      command: "scutil --dns | head -40",
      purpose:
        "Show how macOS is actually configured to resolve names, including per-domain resolvers added by a VPN.",
      lookFor:
        "Multiple resolver blocks with domain scopes. These explain why one hostname resolves and a similar one does not.",
    },
    {
      command: "ping -c 3 example.com",
      purpose: "Check basic ICMP reachability and round-trip latency.",
      lookFor:
        "The resolved address in the first line, plus packet loss and time values.",
      caution:
        "Plenty of hosts and networks drop ICMP by policy. Never conclude a service is down because ping failed.",
    },
    {
      command: "nc -vz example.com 443",
      purpose: "Test whether one TCP port on one host accepts a connection.",
      lookFor:
        "succeeded means the handshake completed. Compare the wording and the speed of the failure when you try a closed port.",
    },
    {
      command: "time nc -vz -w 5 192.0.2.1 443",
      purpose:
        "Produce a real connection timeout using a reserved address, and measure it.",
      lookFor:
        "The command consumes the full timeout and reports an operation timeout. This is the signature of silently dropped packets.",
    },
    {
      command:
        "curl -sS -o /dev/null -w 'dns=%{time_namelookup}s connect=%{time_connect}s total=%{time_total}s code=%{http_code}\\n' https://example.com",
      purpose:
        "Break a single request into its phases so you can see where the time goes.",
      lookFor:
        "Which phase dominates. A large namelookup time points at DNS; a large connect time points at the network path.",
    },
  ],

  exercises: [
    {
      id: "d01-e1",
      title: "Resolve the same name two ways and compare",
      steps: [
        "Run dig example.com +short and note the addresses.",
        "Run dig @1.1.1.1 example.com +short and compare.",
        "Run scutil --dns | head -40 and identify which resolver your system would have used.",
        "Write down one sentence explaining what you would conclude if the two answers disagreed.",
      ],
      successCriteria:
        "You can state which resolver answered each query, and you can describe what a mismatch between them would imply.",
    },
    {
      id: "d01-e2",
      title: "Produce all three failure modes deliberately",
      steps: [
        "DNS failure: run curl -v http://no-such-host.example.com and read the error line.",
        "Connection refused: run nc -vz 127.0.0.1 9 and note how fast it fails.",
        "Connection timeout: run time nc -vz -w 5 192.0.2.1 443 and note how slowly it fails.",
        "Record the exact error text of each, side by side.",
      ],
      successCriteria:
        "You have three distinct error messages written down, and you can say which layer each one failed at without running the command again.",
    },
    {
      id: "d01-e3",
      title: "Prove a port is open without using a browser",
      steps: [
        "Start a listener in one terminal: nc -l 8080",
        "In another terminal, confirm it accepts connections: nc -vz 127.0.0.1 8080",
        "Confirm nothing is listening one port over: nc -vz 127.0.0.1 8081",
        "Optional: run lsof -nP -iTCP:8080 -sTCP:LISTEN to see the listening process and the address it is bound to.",
      ],
      successCriteria:
        "You can distinguish an open port from a closed one by the response alone, and you know how to find which process owns a listener.",
    },
  ],

  scenario: {
    title: "Reachable from one machine, not from another",
    situation: [
      "A teammate reports that the internal reporting service at reports.internal.example.com is down. They have been getting errors for about twenty minutes and say nothing changed on their side.",
      "You try the same URL from your laptop and it loads immediately. A second teammate on a different network says it loads for them too. The service owners say they have had no deployments today and their dashboards look normal.",
      "Your teammate is working from a cafe today rather than the office, and connected to the company VPN about an hour ago.",
    ],
    known: [
      "The hostname is internal and is normally only reachable from company networks.",
      "The service loads for you and for one other person, both on the office network.",
      "The reporting teammate is on a public network with the VPN connected.",
      "No deployment or configuration change has been reported by the service owners.",
    ],
    unknown: [
      "Whether the hostname resolves at all on the affected machine, and to what address.",
      "Whether TCP connections to the service port are established, refused, or dropped.",
      "Whether the VPN is actually carrying traffic for that hostname, or only for some subnets.",
      "What the exact error text and timing are on the affected machine.",
    ],
    task: "Write the sequence of checks you would ask your teammate to run, in order, and state what each result would rule in or out. Do not guess the root cause yet. Decide what evidence would let you hand this to the right owner with confidence.",
    guidance: {
      strongPlanIncludes: [
        "Asking for the exact error message and how long it took to appear, before running anything.",
        "Resolving the hostname on the affected machine first, and comparing against a known-good machine.",
        "Testing the TCP port directly rather than only loading the page, so DNS and transport are separated.",
        "Treating the VPN as a variable to test, for example by comparing behaviour with it connected and disconnected.",
        "Deciding in advance what result would mean this is not your team's problem.",
      ],
      commonlyMissed: [
        "Comparing resolved IP addresses between the working and failing machines. A different address explains the whole report in one step.",
        "Checking /etc/hosts and VPN-supplied resolvers on the failing machine, not just the public DNS answer.",
        "Noticing whether the failure is instant or slow, which separates a bad name or closed port from silent packet drops.",
        "Confirming the port, not just the hostname. Reachability is per host and port.",
      ],
      systematicSequence: [
        {
          action: "Collect the exact error text and the time to failure.",
          reason:
            "The wording distinguishes a resolution error from a connection error before you run a single command.",
        },
        {
          action: "Resolve the hostname on the failing machine and on a working one.",
          reason:
            "If the addresses differ, you have found the layer and can stop testing transport.",
        },
        {
          action: "Inspect the system resolver configuration on the failing machine.",
          reason:
            "A VPN-scoped or missing search domain explains a resolution difference that public DNS cannot show you.",
        },
        {
          action: "Test the TCP port on the resolved address from the failing machine.",
          reason:
            "This separates name resolution from reachability and classifies the failure as refused or dropped.",
        },
        {
          action: "Repeat the port test from a known-good network.",
          reason:
            "A working path from elsewhere proves the service is up and narrows the problem to the affected path.",
        },
        {
          action: "Vary one network variable at a time, such as the VPN connection.",
          reason:
            "Changing one thing per test is the only way to attribute a difference to a cause.",
        },
      ],
      conceptsToReview: [
        "The difference between NXDOMAIN, an empty answer, and SERVFAIL",
        "Why connection refused and connection timeout imply different owners",
        "How per-domain resolvers and search domains change resolution",
        "Why a successful ping does not mean a service is reachable",
      ],
    },
  },

  communication: {
    prompt:
      "Write a short status update for the team channel, as if the investigation is still open. Describe what you have established, what is still unknown, and what you are doing next. Aim for a paragraph that a reader could act on without asking you a follow-up question.",
    questions: [
      "What is the reported symptom, stated in terms of impact rather than technology?",
      "Which layer have you ruled out, and what evidence rules it out?",
      "What is still unknown, and what would resolve it?",
      "What is your next concrete step, and when will you report back?",
      "How would you describe this to someone who does not know what DNS is?",
    ],
    examplePhrases: [
      "First, I would verify whether the issue is reproducible from a second machine.",
      "At this point, we know that DNS resolution succeeds, but the TCP connection times out.",
      "The hostname resolves to a different address on the affected machine, so I am treating this as a resolution problem rather than a service outage.",
      "The failure is immediate rather than slow, which suggests an active rejection rather than dropped traffic.",
      "For a non-technical summary: the service is running, but one laptop is being sent to the wrong address for it.",
    ],
    tips: [
      "State impact before mechanism. The reader needs to know who is affected before they need to know why.",
      "Separate observation from interpretation. Say what you measured, then what you think it means.",
      "Name the next step and a time to check back. An update without a next step reads as a dead end.",
    ],
  },
};
