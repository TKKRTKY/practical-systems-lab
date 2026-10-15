import type { Day } from "./types";

export const day03: Day = {
  id: 3,
  title: "NAT, firewalls, and proxies",
  focus: "Reason about what sits between your process and the internet.",
  estimatedMinutes: 55,
  objective:
    "Explain why one process on a machine can reach a service while another cannot, and identify whether an address translation, a filtering policy, or a proxy is responsible.",
  tags: ["nat", "firewalls", "proxies", "egress"],

  keyConcepts: [
    {
      term: "Private and public addresses",
      summary:
        "10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16 are not routable on the internet. A host with only a private address needs something to translate for it.",
    },
    {
      term: "NAT",
      summary:
        "Rewriting addresses and ports as traffic crosses a boundary. Outbound NAT lets many private hosts share one public address, and it is why your outbound traffic has a source address you never configured.",
    },
    {
      term: "Connection direction",
      summary:
        "NAT keeps a table of connections it has seen. Return traffic for a connection you started is allowed; unsolicited inbound traffic has no table entry and is dropped.",
    },
    {
      term: "Ingress and egress",
      summary:
        "Inbound and outbound rules are configured separately and often by different teams. Egress filtering is the usual explanation for a service that can be reached but cannot reach out.",
    },
    {
      term: "Drop versus reject",
      summary:
        "A firewall can silently drop traffic, giving you a timeout, or actively reject it, giving you an immediate refusal. The timing of a failure tells you which policy you hit.",
    },
    {
      term: "Allow lists",
      summary:
        "Access granted to specific source addresses or hostnames. They break the moment your source address changes, which happens when you move networks, scale out, or replace a NAT gateway.",
    },
    {
      term: "Forward proxy",
      summary:
        "An intermediary your client is configured to send requests through. Behaviour depends entirely on whether a given client reads that configuration.",
    },
    {
      term: "TLS interception",
      summary:
        "A proxy that terminates TLS and re-signs traffic with an internal authority. Clients must trust that authority, and clients that pin certificates will fail by design.",
    },
  ],

  explanations: [
    {
      heading: "Proxy configuration is per client, not per machine",
      paragraphs: [
        "On macOS, system proxy settings are respected by browsers and by anything using the system networking stack, but command-line tools generally read the HTTP_PROXY, HTTPS_PROXY, and NO_PROXY environment variables instead. Those variables are per process and per shell, so two terminals on one laptop can behave differently.",
        "Language runtimes add another layer. Some read the environment variables, some require explicit configuration, some respect only lowercase or only uppercase spellings, and some ignore proxies entirely. This is why asking which tool failed is as important as asking what the error was.",
      ],
    },
    {
      heading: "Egress restrictions produce a characteristic signature",
      paragraphs: [
        "When outbound traffic is filtered, DNS often still works, because resolution goes to an internal resolver that is explicitly permitted. So you get a resolved address and then a connection that hangs until it times out. That combination, successful resolution with a slow connection failure, should make you think about egress policy early.",
        "The tell is consistency: the same destination fails the same way every time, from every process on the host, while other destinations succeed. A per-destination, per-port pattern is policy. Intermittent failure is usually something else.",
      ],
    },
    {
      heading: "NO_PROXY is where this quietly goes wrong",
      paragraphs: [
        "Most proxy problems in practice are not the proxy being down. They are a request that should have bypassed the proxy being sent through it, or the reverse. Internal hostnames, localhost, and private address ranges usually need to be excluded, and the exclusion list has to be maintained by hand in several places.",
        "NO_PROXY matching is also not as clever as people expect: it is typically suffix matching on hostnames, with inconsistent support for CIDR ranges and ports across tools. An entry that works for one tool may be ignored by the next.",
      ],
    },
    {
      heading: "Your source address is not your business, until it is",
      paragraphs: [
        "If a partner has allow-listed your egress address and that address changes, every request starts failing with an authorization or forbidden response rather than a network error. The symptom looks like an application or credential problem, which sends people to the wrong place for hours.",
        "Knowing how to discover your own public source address, and knowing that it can differ per environment, converts that confusing class of failure into a single quick check.",
      ],
    },
  ],

  commands: [
    {
      command: "ifconfig | grep -A3 'flags=' | grep 'inet '",
      purpose: "List the local addresses your machine actually holds.",
      lookFor:
        "Whether your address is private. If so, something is translating for you on the way out.",
    },
    {
      command: "netstat -rn | head -10",
      purpose: "Show the routing table and the default gateway.",
      lookFor:
        "The default route, and any extra routes added by a VPN client, which reveal split tunnelling.",
    },
    {
      command: "curl -sS https://api.ipify.org; echo",
      purpose: "Discover the public source address your traffic appears to come from.",
      lookFor:
        "An address that differs from your local one. Compare this value between environments when an allow list is involved.",
      caution:
        "This is a third-party service. It is fine for learning; in a real investigation prefer an endpoint your own organisation controls.",
    },
    {
      command: "scutil --proxy",
      purpose: "Show the system-level proxy configuration on macOS.",
      lookFor:
        "Whether a proxy or an automatic configuration URL is set. Remember that this may apply to browsers while your shell ignores it.",
    },
    {
      command: "env | grep -i proxy; echo exit=$?",
      purpose:
        "Show the proxy configuration your current shell will actually apply.",
      lookFor:
        "Presence, absence, and case of the variables, and whether NO_PROXY covers internal hostnames.",
    },
    {
      command:
        "HTTPS_PROXY=http://127.0.0.1:3128 curl -sS -m 5 -o /dev/null -w '%{http_code}\\n' https://example.com; echo exit=$?",
      purpose:
        "Observe what a request looks like when it is pointed at a proxy that is not there.",
      lookFor:
        "A connection failure to the proxy rather than to the destination. Misconfigured proxies fail at the proxy, which is a different error than the site being down.",
    },
    {
      command: "curl -sS -m 5 -o /dev/null -w '%{http_code}\\n' --noproxy '*' https://example.com",
      purpose: "Force a request to bypass any proxy configuration.",
      lookFor:
        "Whether bypassing the proxy changes the result. A difference localises the fault to the proxy path.",
    },
    {
      command: "time curl -sS -m 8 -o /dev/null https://192.0.2.1; echo exit=$?",
      purpose:
        "Produce the signature of silently dropped egress traffic and time it.",
      lookFor:
        "Full consumption of the timeout with no response, which is what a drop policy looks like from the client side.",
    },
  ],

  exercises: [
    {
      id: "d03-e1",
      title: "Map what sits between you and the internet",
      steps: [
        "Find your local address and decide whether it is private.",
        "Find your default gateway from the routing table.",
        "Find your public source address.",
        "Draw the path as a line of boxes: process, host, gateway, translation, internet, destination.",
      ],
      successCriteria:
        "You have a drawing with at least four boxes and you can name what would break at each one.",
    },
    {
      id: "d03-e2",
      title: "Make one tool use a proxy and another ignore it",
      steps: [
        "In one terminal, export HTTPS_PROXY to a port where nothing is listening.",
        "Run a curl request in that terminal and record the error.",
        "Run the same request with --noproxy '*' and record the result.",
        "Explain in writing why a browser on the same machine would be unaffected by what you just did.",
      ],
      successCriteria:
        "You can state, from memory, where each of three clients reads proxy configuration from.",
    },
    {
      id: "d03-e3",
      title: "Classify failures by their timing",
      steps: [
        "Produce an immediate refusal: nc -vz 127.0.0.1 9",
        "Produce a slow timeout: time nc -vz -w 6 192.0.2.1 443",
        "Write a two-line rule mapping each timing signature to the likely policy on the other end.",
        "Note one case where the rule would mislead you.",
      ],
      successCriteria:
        "You can predict, before running a command, whether a drop policy or a reject policy will produce the error you are about to see.",
    },
  ],

  scenario: {
    title: "The browser works, the CLI does not",
    situation: [
      "A developer is setting up a new build agent on a managed laptop. They can open https://registry.internal.example.com in a browser and see the package index. The same host is unreachable from their terminal: the CLI tool hangs for about thirty seconds and then reports a connection error.",
      "They have already reinstalled the CLI tool twice and tried a different version of the runtime. A colleague on the same team, on an older laptop, reports that the CLI works fine for them.",
      "The laptop is enrolled in device management, and the two laptops were enrolled about a year apart.",
    ],
    known: [
      "The internal registry loads in a browser on the affected laptop.",
      "The CLI tool hangs for roughly thirty seconds before failing.",
      "The same CLI tool works on a colleague's older laptop.",
      "Both machines are managed, and were enrolled at different times.",
    ],
    unknown: [
      "Whether the hostname resolves identically for both clients on the affected laptop.",
      "Whether the browser is using a proxy that the CLI is not, or the reverse.",
      "Whether the CLI reaches the destination at all, or stalls before leaving the machine.",
      "Whether the two laptops have different proxy or certificate configuration applied by device management.",
    ],
    task: "Write the investigation plan. Your plan should be able to distinguish, with evidence, between four candidate explanations: a resolution difference, a proxy configuration difference, an egress policy difference, and a trust configuration difference. State the single command whose result would eliminate the most possibilities first.",
    guidance: {
      strongPlanIncludes: [
        "Treating the browser and the CLI as two different clients with independent configuration, rather than as one machine.",
        "Checking resolution and proxy configuration from the exact shell where the CLI fails.",
        "Using the thirty second hang as evidence of dropping rather than rejection.",
        "Testing a direct connection with a proxy bypass to localise the fault.",
        "Comparing the two laptops as a controlled experiment, since one works.",
      ],
      commonlyMissed: [
        "Looking at environment variables in the failing shell. Proxy settings are per process, and this is the most common cause of exactly this report.",
        "Noticing that the CLI hangs rather than failing fast, which rules out a straightforward closed port.",
        "Checking whether the hang is a connection to the destination or to a proxy that is unreachable.",
        "Asking what device management applies, since a managed configuration difference explains the two-laptop discrepancy.",
        "Reinstalling tools before gathering evidence, which consumed an hour and changed nothing.",
      ],
      systematicSequence: [
        {
          action: "Reproduce in the failing shell with verbose output and a short timeout.",
          reason:
            "You need to see whether it stops at resolution, at connect, or at a proxy, and you need it to fail quickly while you iterate.",
        },
        {
          action: "Print the proxy environment of that shell and the system proxy settings.",
          reason:
            "A mismatch between the two explains the browser and CLI divergence immediately.",
        },
        {
          action: "Resolve the hostname from the shell and compare with what the browser reaches.",
          reason:
            "Resolution differences are cheap to check and would otherwise invalidate later tests.",
        },
        {
          action: "Retry the request bypassing the proxy, then forcing it through the proxy.",
          reason:
            "Two controlled variants attribute the failure to the proxy path or exonerate it.",
        },
        {
          action: "Test the raw TCP port to the resolved address.",
          reason:
            "This separates an application or proxy problem from a pure egress policy problem.",
        },
        {
          action: "Diff the configuration of the working and failing laptops.",
          reason:
            "A known-good machine on the same network is the most valuable control you have.",
        },
      ],
      conceptsToReview: [
        "Where each class of client reads proxy configuration from",
        "NO_PROXY semantics and its inconsistencies between tools",
        "Drop versus reject, and the timing signature of each",
        "Why allow lists fail when a source address changes",
      ],
    },
  },

  communication: {
    prompt:
      "Write the message you would send to the platform or IT team to get this unblocked. Assume they are busy, receive many vague requests, and will deprioritise anything they cannot act on immediately.",
    questions: [
      "What exactly is blocked, and what is the business impact of it staying blocked?",
      "What have you already ruled out, with what evidence?",
      "What specific configuration are you asking them to check or change?",
      "What control case shows this is environment-specific rather than a tool bug?",
      "How would you phrase this if you had only two sentences?",
    ],
    examplePhrases: [
      "At this point, we know the hostname resolves and the browser can reach it, but the CLI stalls before any response.",
      "I would inspect the outbound network policy and the proxy configuration applied to this device.",
      "The same tool and version works on a colleague's machine on this network, which points at device configuration rather than the tool.",
      "The request hangs for thirty seconds rather than failing immediately, which is consistent with traffic being dropped rather than refused.",
      "What I need from you: confirmation of whether a proxy is enforced for command-line traffic on recently enrolled laptops.",
    ],
    tips: [
      "Lead with the specific ask. A request that requires the reader to infer what you want gets queued.",
      "Include your control case. Showing that one machine works and another does not is what makes the request credible.",
      "List what you ruled out so they do not repeat your work.",
    ],
  },
};
