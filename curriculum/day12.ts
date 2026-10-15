import type { Day } from "./types";

export const day12: Day = {
  id: 12,
  title: "Enterprise integration scenarios",
  focus: "Debug across organisational boundaries, where networking, trust, and identity overlap.",
  estimatedMinutes: 65,
  objective:
    "Investigate a failure that spans network policy, certificate trust, and authentication at once, and work out which team owns each layer.",
  tags: ["enterprise", "proxies", "certificates", "registries", "sso"],

  keyConcepts: [
    {
      term: "Internal package registry",
      summary:
        "A private or proxying registry for dependencies. Requires its own authentication and often its own certificate authority, and it is frequently the first thing a new environment fails on.",
    },
    {
      term: "Private Git server",
      summary:
        "Source hosting inside the network. Access depends on network path, host key trust, and credentials, which fail with three distinct error shapes.",
    },
    {
      term: "Enterprise proxy",
      summary:
        "A mandatory intermediary for outbound traffic. Clients that do not read its configuration appear to have no network access at all.",
    },
    {
      term: "Custom certificate authority",
      summary:
        "An internally issued root used to sign internal services or to re-sign intercepted traffic. Every client must trust it, and each runtime has its own trust store.",
    },
    {
      term: "Per-runtime trust stores",
      summary:
        "The operating system, each language runtime, each container image, and some tools all keep separate trust configuration. Installing a root in one place fixes one client.",
    },
    {
      term: "IP allow lists",
      summary:
        "Access granted by source address. A new or elastic environment has an address nobody listed, which produces timeouts or forbidden responses rather than useful errors.",
    },
    {
      term: "SSO-gated tooling",
      summary:
        "Services that require an interactive browser sign-in. Non-interactive environments need a token or a service identity instead, which must be issued deliberately.",
    },
    {
      term: "Host key verification",
      summary:
        "SSH clients verify the server's host key against a known hosts file. In a fresh environment nothing is known, so a strict client refuses to connect.",
    },
    {
      term: "Layered failure",
      summary:
        "Enterprise problems rarely have one cause. Fixing the network reveals a trust problem, which reveals an identity problem. Expect to peel layers.",
    },
  ],

  explanations: [
    {
      heading: "Three error shapes, three owners",
      paragraphs: [
        "Across every enterprise integration, the same three shapes recur. A timeout means no path: routing, firewall, or proxy, owned by the network team. A certificate verification error means no trust: a missing internal root or an intercepting proxy, owned by the platform or security team. A 401 or 403 means no identity or no permission: credentials, tokens, or group membership, owned by the service or identity team.",
        "Learning to classify in one glance is the highest-leverage skill here, because these failures arrive in long, noisy output from tools that do not distinguish them. Classify first, then you know which team to talk to and what to ask them.",
      ],
    },
    {
      heading: "Expect to fix it more than once",
      paragraphs: [
        "A new environment reaching an internal registry typically fails three times in sequence. First no route, so you get a timeout. Add the proxy configuration and you now reach it, but the proxy re-signs TLS with an internal authority your runtime does not trust, so you get a verification error. Install the root and the connection succeeds, and now the registry wants credentials your environment does not have.",
        "This sequence is normal and should be planned for, not treated as three separate incidents. When you report progress, say which layer you have cleared and which you expect next. That turns an apparently endless problem into visible progress.",
      ],
    },
    {
      heading: "Each tool has its own idea of trust and proxies",
      paragraphs: [
        "A system trust store, a language runtime bundle, a container image's root certificates, and a package manager's own configuration are four different places. Similarly, proxy settings may come from the system, from environment variables, from a tool-specific config file, or not be read at all.",
        "So the question is never does this machine trust the internal authority. It is does this specific client, in this specific environment, read this specific configuration. That reframing resolves most of the confusion in this area, including the recurring case where one command works and another does not on the same host.",
      ],
    },
    {
      heading: "Never work around trust silently",
      paragraphs: [
        "Disabling certificate verification or skipping host key checking makes the error disappear and leaves a real vulnerability behind, usually permanently, usually in a configuration file nobody revisits. It also hides the information you needed: which authority signed the certificate you were offered.",
        "The correct move is to obtain and install the internal root, from a trusted internal source, in the place that specific client reads. If you must use an insecure flag to confirm a diagnosis, do it once, in a throwaway command, and say so out loud.",
      ],
    },
  ],

  commands: [
    {
      command: "security find-certificate -a -c 'Example Internal Root' /Library/Keychains/System.keychain 2>/dev/null | head -5; echo exit=$?",
      purpose:
        "Check whether a named internal root is present in the macOS system keychain.",
      lookFor:
        "No result here, since this authority is fictional. The point is knowing where to look on macOS.",
    },
    {
      command: "python3 -c \"import ssl; print(ssl.get_default_verify_paths())\"",
      purpose:
        "Show which trust store one specific runtime will actually use.",
      lookFor:
        "The paths. Compare with where you would install a root, and notice that this is runtime-specific.",
    },
    {
      command: "node -e \"console.log('NODE_EXTRA_CA_CERTS =', process.env.NODE_EXTRA_CA_CERTS || '(unset)')\"",
      purpose:
        "Check the variable that adds a root to the Node runtime's trust configuration.",
      lookFor:
        "That trust is configured per runtime, through a mechanism the operating system knows nothing about.",
    },
    {
      command: "npm config get registry; npm config get proxy; npm config get https-proxy; npm config get cafile",
      purpose:
        "Read a package manager's own view of registry, proxy, and certificate authority.",
      lookFor:
        "Four independent settings, each of which can be wrong on its own and none of which the operating system controls.",
    },
    {
      command:
        "openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | openssl x509 -noout -issuer",
      purpose:
        "Identify who signed the certificate you were actually offered.",
      lookFor:
        "A public authority here. An internal issuer on a public site is conclusive evidence of TLS interception.",
    },
    {
      command: "ssh -o BatchMode=yes -o ConnectTimeout=5 -T git@github.com 2>&1 | head -3; echo exit=$?",
      purpose:
        "Observe the three distinguishable SSH outcomes: no route, host key problem, or authentication result.",
      lookFor:
        "Which of the three you get. Each maps to a different owner and a different fix.",
    },
    {
      command: "ssh-keyscan -T 5 github.com 2>/dev/null | head -2; echo exit=$?",
      purpose:
        "Fetch a host key the way a provisioning script would, instead of disabling verification.",
      lookFor:
        "That host keys can be obtained and pinned deliberately. In a real environment, verify fingerprints out of band.",
    },
    {
      command:
        "GIT_SSL_NO_VERIFY= git ls-remote https://github.com/git/git 2>&1 | head -3; echo exit=$?",
      purpose:
        "Confirm a repository is reachable over HTTPS with verification left intact.",
      lookFor:
        "Success. Note that the variable is deliberately empty here: this is the correct, verifying path.",
      caution:
        "Never set this variable to true in a real environment. Install the internal root instead.",
    },
    {
      command: "env | grep -iE 'proxy|ca_cert|cafile|ssl' | sort; echo '(empty output means no proxy or trust overrides in this shell)'",
      purpose:
        "Inventory every proxy and trust override in the current shell in one view.",
      lookFor:
        "Inconsistent case, a NO_PROXY list that misses internal hostnames, or a certificate path pointing somewhere that does not exist.",
    },
  ],

  exercises: [
    {
      id: "d12-e1",
      title: "Build the three-shape classifier",
      steps: [
        "Write the three error shapes: timeout, certificate verification error, 401 or 403.",
        "For each, write the owning team and the single question you would ask them.",
        "Collect one real example of each from commands you have run this week, or produce them deliberately.",
        "Write the one case where the shape would mislead you about the owner.",
      ],
      successCriteria:
        "You have three shapes with owners, real examples, and one documented exception.",
    },
    {
      id: "d12-e2",
      title: "Inventory trust and proxy configuration on your machine",
      steps: [
        "List where the system, your language runtime, and your package manager each read trust configuration from.",
        "List where each reads proxy configuration from.",
        "Build a small table: client, trust source, proxy source.",
        "Mark which entries you would have to change to add an internal certificate authority for all of them.",
      ],
      successCriteria:
        "Your table has at least three clients, and you can say how many separate changes adding one internal root would require.",
    },
    {
      id: "d12-e3",
      title: "Predict the layered failure sequence",
      steps: [
        "For a fresh cloud environment that must clone from a private Git server and install from an internal registry, write the sequence of failures you expect.",
        "For each failure, write the error shape, the owner, and the fix.",
        "Mark which fixes you could do yourself and which require a request to another team.",
        "Write the order in which you would request access, to minimise waiting.",
      ],
      successCriteria:
        "Your sequence has at least three layers in a plausible order, each with an owner, and a request order that overlaps the waiting.",
    },
  ],

  scenario: {
    title: "A cloud development environment cannot clone or install",
    situation: [
      "A team is piloting cloud-hosted development environments. The environment provisions successfully, but the setup script fails. Cloning from the internal Git server at git.internal.example.com times out after thirty seconds. The engineer then tries the internal package registry at registry.internal.example.com and gets a certificate verification error from the package manager, though curl to the same host appears to work.",
      "Their laptop does both successfully. The platform team says the environment has standard internet access and has provided a proxy hostname to use. Security mentions that all outbound traffic is inspected.",
      "The engineer has found a suggestion online to disable certificate verification for the package manager, and is about to try it.",
    ],
    known: [
      "The environment provisions and has general internet access.",
      "Cloning from the internal Git server times out after thirty seconds.",
      "The package manager reports a certificate verification error for the internal registry.",
      "curl to the registry host appears to work.",
      "Both operations succeed on the engineer's laptop.",
      "A proxy hostname has been provided, and outbound traffic is inspected.",
      "There is no indication that credentials have been provisioned for this environment.",
    ],
    unknown: [
      "Whether the internal Git hostname resolves from the environment, and to what.",
      "Whether the proxy is configured for the specific clients that are failing.",
      "Which authority signed the certificate the package manager was offered.",
      "Why curl succeeds where the package manager fails.",
      "What credentials or service identity this environment is supposed to use for each service.",
      "Whether the environment's egress address is on any required allow list.",
    ],
    task: "Write the full investigation plan. Classify each of the two failures by shape and owner. Explain the apparent contradiction between curl working and the package manager failing. State the order in which you would work, including which access requests you would file first so that waiting overlaps with investigation. Finally, write what you would say to the engineer about disabling certificate verification.",
    guidance: {
      strongPlanIncludes: [
        "Classifying the timeout and the certificate error as two separate problems with different owners.",
        "Explaining the curl and package manager difference as separate trust stores and separate proxy configuration.",
        "Identifying the certificate issuer as the decisive piece of evidence for the registry failure.",
        "Treating TLS interception as the likely explanation given that outbound traffic is inspected.",
        "Anticipating a credentials layer after the network and trust layers are cleared.",
        "Filing access requests early so that waiting overlaps with further investigation.",
        "Refusing the verification workaround and naming the correct fix.",
      ],
      commonlyMissed: [
        "Checking resolution of the internal Git hostname before assuming a network block. An internal-only zone would explain a hang before any firewall does.",
        "Realising that curl and the package manager read different trust stores and different proxy settings, which fully explains the contradiction.",
        "Reading the certificate issuer, which distinguishes a missing internal root from a genuinely broken certificate.",
        "Checking whether the proxy is configured for each failing client specifically, rather than for the environment generally.",
        "Planning for the credentials layer, which will fail immediately after trust is fixed.",
        "Checking the egress address against allow lists, since a hosted environment has a different source address than a laptop.",
        "Noticing that the laptop is not a valid control, as it sits inside several boundaries this environment does not.",
      ],
      systematicSequence: [
        {
          action: "Classify both failures by shape and assign a provisional owner to each.",
          reason:
            "A timeout and a trust error are different problems; treating them as one guarantees confusion.",
        },
        {
          action: "Resolve both internal hostnames from inside the environment.",
          reason:
            "If the Git hostname does not resolve, the thirty second hang has a simpler explanation than a firewall.",
        },
        {
          action: "Inspect the certificate chain for the registry from inside the environment and read the issuer.",
          reason:
            "An internal issuer confirms interception and tells you exactly which root must be installed where.",
        },
        {
          action: "Compare the proxy and trust configuration of curl against the package manager.",
          reason:
            "This resolves the contradiction and identifies the specific configuration to change.",
        },
        {
          action: "File the access requests you can already predict: Git access, registry credentials, allow-list entry.",
          reason:
            "These have human lead times. Submitting them now means the waiting runs in parallel with your work.",
        },
        {
          action: "Install the internal root in each client that needs it, then retest and expect an authentication failure next.",
          reason:
            "Clearing trust exposes the identity layer, and expecting it keeps the team from reading progress as a new problem.",
        },
      ],
      conceptsToReview: [
        "The three error shapes and their owners",
        "Per-runtime trust stores and per-client proxy configuration",
        "TLS interception and how to detect it from the issuer",
        "Why a laptop is not a control for a hosted environment",
      ],
    },
  },

  communication: {
    prompt:
      "Write two messages. First, a short note to the engineer about the verification workaround, which should teach rather than scold. Second, a message to the platform and security teams that requests exactly what you need and shows you have done your part.",
    questions: [
      "What would disabling verification actually do, in terms of risk and of lost information?",
      "What is the correct fix, and what do you need from whom to apply it?",
      "How do you describe two failures without making it sound like everything is broken?",
      "What have you already established, so the other teams do not repeat it?",
      "How would you report progress on a problem that has several layers left?",
    ],
    examplePhrases: [
      "I would rather not disable verification: it hides which authority signed the certificate, which is the evidence we need.",
      "We have two separate failures here, and they have different owners: one is a network path, the other is certificate trust.",
      "At this point, we know the registry certificate is issued by an internal authority, which is consistent with inspected outbound traffic.",
      "What I need: the internal root certificate from an authoritative source, and confirmation of the proxy settings for command-line clients.",
      "I expect a credentials failure once trust is resolved, so I have already requested registry access in parallel.",
    ],
    tips: [
      "Explain the cost of a workaround in terms of lost evidence as well as risk. It persuades engineers who are immune to policy arguments.",
      "Report layers cleared, not just failures remaining. It is the same information and reads as progress.",
      "Request in parallel. Enterprise access requests have lead times that dominate everything else.",
    ],
  },
};
