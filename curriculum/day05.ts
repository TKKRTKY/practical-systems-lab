import type { Day } from "./types";

export const day05: Day = {
  id: 5,
  title: "Private networking and VPN",
  focus: "Understand how internal services are exposed, and why location changes the answer.",
  estimatedMinutes: 55,
  objective:
    "Explain the common ways a private service is made reachable across network boundaries, and diagnose a service that works from one network but not another.",
  tags: ["vpn", "private-networking", "internal-dns", "peering"],

  keyConcepts: [
    {
      term: "Site-to-site VPN",
      summary:
        "A permanent encrypted tunnel between two networks. Hosts on either side reach each other by private address, with no client software involved.",
    },
    {
      term: "Client VPN",
      summary:
        "Per-device software that places one machine inside a network. What it carries depends on the routes and DNS settings it pushes to the client.",
    },
    {
      term: "Split tunnelling",
      summary:
        "Only some ranges are routed through the tunnel. Traffic for anything else goes out your local connection, which is why a VPN can be connected and still not help.",
    },
    {
      term: "VPC peering",
      summary:
        "A direct private link between two cloud networks. It does not transit: peering A to B and B to C never gives A a path to C.",
    },
    {
      term: "Private endpoint",
      summary:
        "An interface inside your network that fronts an external or managed service. The service is then reached over private addressing, usually with a hostname that resolves differently inside the network.",
    },
    {
      term: "Split-horizon DNS",
      summary:
        "The same hostname resolving to a private address inside a network and a public address, or nothing at all, outside it. The design intent is that location changes the answer.",
    },
    {
      term: "Search domains",
      summary:
        "Suffixes appended to short names. A short hostname that works inside a network and fails outside often depends on a search domain supplied by DHCP or a VPN.",
    },
    {
      term: "Overlapping address space",
      summary:
        "Two networks using the same private range cannot be peered directly. This is the usual reason an otherwise sensible private link was never built.",
    },
  ],

  explanations: [
    {
      heading: "Private does not mean one thing",
      paragraphs: [
        "When someone says a service is internal only, they could mean several different arrangements: it has no public address at all; it has a public address but an allow list restricts who may connect; it is only routable through a tunnel; or it resolves only via an internal DNS zone. Each has a different failure signature and a different fix.",
        "Before investigating, establish which arrangement you are dealing with. A service with no public address will time out from outside. A service behind an allow list will often refuse or return a forbidden response. A service that only exists in internal DNS will fail at resolution. These are distinguishable in one command each.",
      ],
    },
    {
      heading: "A connected VPN proves very little",
      paragraphs: [
        "VPN clients report connected when the tunnel is up, not when your traffic is using it. With split tunnelling, only specific destination ranges are routed through the tunnel. If the service you need sits in a range that was never added, your packets go out the normal path and the tunnel is irrelevant.",
        "There is also a DNS dimension. A VPN may push a resolver and search domains for specific internal zones. If that configuration does not cover the zone you need, you will resolve the public answer, or nothing, while the tunnel is perfectly healthy. Checking routes and resolver scopes separately is the only way to know what the VPN is actually doing for you.",
      ],
    },
    {
      heading: "Cloud development environments are a different network",
      paragraphs: [
        "A development environment running in the cloud is not in the office network and usually cannot run a corporate VPN client the way a laptop does. So anything that silently depended on being inside the corporate network stops working: internal DNS zones, private addresses, source address allow lists, and internal certificate authorities.",
        "This is one of the most common surprises when work moves from a laptop to a hosted environment. The code did not change and nothing is broken; the environment simply sits outside every boundary the service assumed.",
      ],
    },
    {
      heading: "Why peering is not transitive",
      paragraphs: [
        "Peering creates a route between exactly two networks. If your network is peered with a shared services network, and that network is peered with a partner network, you still have no path to the partner. Traffic cannot hop through the middle network unless something there is explicitly built to forward it.",
        "The practical consequence is that a path which looks connected on an architecture diagram may not exist at all. Follow the route tables on both sides rather than following the lines on the diagram.",
      ],
    },
  ],

  commands: [
    {
      command: "netstat -rn | head -20",
      purpose:
        "Inspect the routing table to see which ranges are sent through a tunnel interface.",
      lookFor:
        "Routes pointing at a utun or similar interface. These are exactly what the VPN is carrying, and nothing else is.",
    },
    {
      command: "ifconfig | grep -E '^(utun|ipsec|tun)' ",
      purpose: "List tunnel interfaces present on the machine.",
      lookFor:
        "Whether a tunnel interface exists at all, and how many. Their presence means a client is connected; it says nothing about what is routed.",
    },
    {
      command: "scutil --dns | grep -E 'resolver|domain|nameserver' | head -40",
      purpose:
        "Show scoped resolvers, including per-domain resolvers and search domains pushed by a VPN.",
      lookFor:
        "Resolver blocks with a domain scope. These implement split-horizon DNS on your machine.",
    },
    {
      command: "dig +short internal.example.com; echo exit=$?",
      purpose:
        "Attempt to resolve an internal-style hostname from outside the network.",
      lookFor:
        "An empty answer or NXDOMAIN, which is the normal outcome for a name that exists only in an internal zone.",
    },
    {
      command: "dig +short api.internal.example.com @1.1.1.1; echo exit=$?",
      purpose:
        "Ask a public resolver for an internal name, to confirm the name is genuinely not public.",
      lookFor:
        "No answer. Comparing this against a resolver inside the network is how you demonstrate split-horizon DNS.",
    },
    {
      command: "python3 -c \"import ipaddress; a=ipaddress.ip_network('10.20.0.0/16'); b=ipaddress.ip_network('10.20.5.0/24'); print('overlaps:', a.overlaps(b))\"",
      purpose:
        "Check whether two private ranges overlap, which determines whether they can be peered.",
      lookFor:
        "Overlapping ranges cannot be peered directly. This arithmetic is often the real reason a private link does not exist.",
    },
    {
      command: "nc -vz -w 5 10.20.30.40 443; echo exit=$?",
      purpose:
        "Attempt a connection to a private address from outside the network.",
      lookFor:
        "A timeout rather than a refusal, which is the expected signature for an unroutable private address.",
      caution:
        "Use documentation-style private addresses for practice. Do not probe addresses you do not own.",
    },
  ],

  exercises: [
    {
      id: "d05-e1",
      title: "Determine what your VPN actually carries",
      steps: [
        "List tunnel interfaces on your machine, if any.",
        "List routes pointing at those interfaces and write down the ranges.",
        "List scoped resolvers and the domains they apply to.",
        "Write one sentence stating which destinations would and would not use the tunnel.",
      ],
      successCriteria:
        "You can name, from your own machine's configuration, at least one destination the tunnel carries and one it does not. If you have no VPN, write what you would run and what you would expect.",
    },
    {
      id: "d05-e2",
      title: "Demonstrate split-horizon DNS from the outside",
      steps: [
        "Resolve an internal-style hostname such as api.internal.example.com and record the result.",
        "Ask a public resolver the same question and compare.",
        "Write down the exact failure a client would report in each case.",
        "Explain how you would prove, from inside a network, that an internal answer exists.",
      ],
      successCriteria:
        "You can distinguish a name that does not exist from a name you cannot see, and you know which commands produce that distinction.",
    },
    {
      id: "d05-e3",
      title: "Decide between four exposure designs",
      steps: [
        "Write a two-line description of each: site-to-site VPN, client VPN, peering, private endpoint.",
        "For a cloud development environment that needs one internal API, rank them by how well they fit.",
        "For each, state the failure a learner would see if it were misconfigured.",
        "Note which of the four do not require software on the client machine.",
      ],
      successCriteria:
        "You can recommend one approach and defend it against the other three in terms of failure modes, not preferences.",
    },
  ],

  scenario: {
    title: "Works on the corporate network, not from a cloud environment",
    situation: [
      "An engineer has moved to a cloud-hosted development environment. Their project calls an internal service at svc.internal.example.com. On their office laptop everything works. In the hosted environment, the call fails immediately with a resolution error.",
      "They open a ticket saying the hosted environment has broken DNS. The platform team responds that DNS in the environment is working, and demonstrates that public names resolve correctly from the same machine.",
      "Both statements are true. The engineer has a deadline and wants the quickest viable path to a working setup.",
    ],
    known: [
      "The service is reachable from the office network by its internal hostname.",
      "In the hosted environment the failure is at resolution, and it is immediate.",
      "Public hostnames resolve correctly in the hosted environment.",
      "The hosted environment cannot run the corporate VPN client the same way a laptop does.",
    ],
    unknown: [
      "Whether the internal hostname exists in any publicly reachable zone, or only in an internal zone.",
      "Whether the service has any public address or only private addressing.",
      "Whether a private link between the hosted environment and the internal network exists or could exist.",
      "Whether the service enforces a source address allow list in addition to private routing.",
      "What the organisation's sanctioned pattern is for hosted environments reaching internal services.",
    ],
    task: "Write the investigation and the options you would present. Separate the diagnosis from the remedy: first establish exactly why it fails, then lay out the ways it could be made to work and the trade-offs of each. State which option you would recommend and why.",
    guidance: {
      strongPlanIncludes: [
        "Establishing that the failure is at resolution, before discussing connectivity at all.",
        "Testing whether the name resolves from any public resolver to prove it is internal-only.",
        "Distinguishing the DNS problem from the likely routing problem that would follow it.",
        "Presenting more than one remedy, with trade-offs, rather than a single demand.",
        "Identifying who owns the decision, since exposing an internal service is a security decision.",
      ],
      commonlyMissed: [
        "Noticing that fixing DNS alone would just move the failure to the connection stage, since a private address would still be unroutable.",
        "Checking whether both parties are describing different layers of the same system before treating it as a dispute.",
        "Asking whether a sanctioned pattern already exists, instead of designing a new one under deadline pressure.",
        "Considering source address allow lists, which will bite immediately after routing is solved.",
        "Writing down what would need to be true for the quick workaround to be acceptable.",
      ],
      systematicSequence: [
        {
          action: "Confirm the failure stage and its timing in the hosted environment.",
          reason:
            "An immediate resolution failure and a slow connection failure lead to entirely different conversations.",
        },
        {
          action: "Query the hostname from a public resolver and from inside the office network.",
          reason:
            "This proves split-horizon DNS and converts an argument about broken DNS into a shared fact.",
        },
        {
          action: "Determine whether the service has any non-private address.",
          reason:
            "It decides whether DNS is the only obstacle or merely the first one.",
        },
        {
          action: "Ask what the sanctioned path is for hosted environments reaching internal services.",
          reason:
            "Most organisations already have one, and using it is faster than inventing an exception.",
        },
        {
          action: "Enumerate the remedies with their trade-offs and owners.",
          reason:
            "The decision is about security posture, not just connectivity, so it needs the right decision maker.",
        },
        {
          action: "Confirm source address requirements before declaring it solved.",
          reason:
            "Allow lists produce an authorization-shaped failure right after the network starts working.",
        },
      ],
      conceptsToReview: [
        "Split-horizon DNS and scoped resolvers",
        "Split tunnelling and what a connected VPN does not guarantee",
        "Why peering is not transitive",
        "The four common ways a private service is exposed",
      ],
    },
  },

  communication: {
    prompt:
      "Write a message that resolves the apparent disagreement between the engineer and the platform team, then presents options. Your goal is to get a decision, not to be right.",
    questions: [
      "Why were both parties correct, and what distinction were they missing?",
      "What is the precise technical statement of the problem?",
      "What are the available options, and what does each cost?",
      "Which option do you recommend, and what would make you change that recommendation?",
      "How would you explain this to a manager who just wants to know when it will work?",
    ],
    examplePhrases: [
      "Both observations are correct: public resolution works, and this hostname only exists in an internal zone.",
      "I would separate name resolution from routing here, because solving the first still leaves the second.",
      "At this point, we know the name does not resolve from outside the corporate network, which is the intended design.",
      "There are three ways to make this work, and they differ mainly in how much private access we grant to a hosted environment.",
      "For a non-technical summary: the service is deliberately invisible outside the office network, so we need an approved doorway rather than a fix.",
    ],
    tips: [
      "When two people disagree and both have evidence, they are usually describing different layers. Name the layers.",
      "Offer options with costs rather than a single request. It is faster to approve a choice than to adjudicate a demand.",
      "Say explicitly when something is a security decision rather than a technical one.",
    ],
  },
};
