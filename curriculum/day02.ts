import type { Day } from "./types";

export const day02: Day = {
  id: 2,
  title: "HTTP, HTTPS, and TLS",
  focus: "Tell the difference between a transport failure, a TLS failure, and an HTTP response.",
  estimatedMinutes: 60,
  objective:
    "Inspect an HTTPS request end to end and state precisely which stage failed: connection, TLS handshake, or the HTTP exchange itself.",
  tags: ["http", "https", "tls", "certificates"],

  keyConcepts: [
    {
      term: "Request and response anatomy",
      summary:
        "A method, a path, headers, and an optional body in each direction. Most integration bugs live in the headers, not the body.",
    },
    {
      term: "Status code families",
      summary:
        "2xx succeeded, 3xx redirects, 4xx means your request was unacceptable, 5xx means the server failed while handling an acceptable request. 4xx points at the caller, 5xx at the callee.",
    },
    {
      term: "TLS handshake",
      summary:
        "Negotiation of protocol version and cipher, plus server identity proof via a certificate chain. It happens after TCP connects and before any HTTP bytes are sent.",
    },
    {
      term: "Certificate chain and trust store",
      summary:
        "A server sends its leaf certificate and usually intermediates. The client validates up to a root it already trusts. Missing intermediates fail on some clients and not others.",
    },
    {
      term: "SNI",
      summary:
        "The hostname the client announces during the handshake, so one IP address can serve many certificates. Wrong or absent SNI gets you the wrong certificate or a default one.",
    },
    {
      term: "Hostname verification",
      summary:
        "A certificate is valid only for the names it lists. Connecting by IP address, or through a hostname not in the certificate, fails verification even when the certificate is otherwise fine.",
    },
    {
      term: "Expiry and clock skew",
      summary:
        "Validation compares the certificate validity window against the client clock. A badly wrong client clock looks exactly like an expired certificate.",
    },
  ],

  explanations: [
    {
      heading: "Three failures that all look like the page not loading",
      paragraphs: [
        "A failed HTTPS request can fail before the connection, during the handshake, or after the application has already responded. These have completely different owners: the network, the certificate and TLS configuration, and the application respectively.",
        "The ordering is useful because it is strict. You cannot have a TLS error without a working TCP connection, and you cannot have a status code without a completed handshake. So a status code, even a 500, is proof that the network and TLS layers are fine.",
      ],
    },
    {
      heading: "Reading verbose curl output as a timeline",
      paragraphs: [
        "curl -v prints the stages in order, and each stage has a recognisable marker. Lines beginning with an asterisk are curl's own narration: resolution, the TCP connect, the TLS handshake, and the certificate it was offered. Lines beginning with a greater-than sign are the request you sent, and lines with a less-than sign are the response.",
        "If output stops before the TLS lines, you have a network problem. If it stops during them, you have a trust, name, or protocol problem. If you see a response line, the transport worked and you are now debugging an application.",
      ],
    },
    {
      heading: "4xx and 5xx are instructions, not just errors",
      paragraphs: [
        "A 400 says the request was malformed, a 401 says you were not authenticated, a 403 says you were authenticated but not permitted, a 404 says the path does not exist for this host, and a 429 says you are being rate limited. Each tells you precisely where to look next, and 401 against 403 in particular saves an enormous amount of time.",
        "On the server side, a 502 or 503 from a proxy usually means the proxy is healthy but the thing behind it is not, while a 504 means the thing behind it was too slow. These distinctions tell you whether to investigate the edge or the origin.",
      ],
    },
    {
      heading: "Why one client succeeds and another fails on the same URL",
      paragraphs: [
        "Clients do not share trust stores. A browser carries its own roots and often fills in missing intermediates automatically; curl uses the system store; a language runtime may use yet another bundle, or a corporate certificate authority installed only on managed machines.",
        "So a page that loads in a browser while a CLI tool fails with a verification error is not a contradiction. It is strong evidence that the server is missing intermediate certificates, or that the client is missing a root the server depends on.",
      ],
    },
  ],

  commands: [
    {
      command: "curl -v https://example.com -o /dev/null",
      purpose:
        "See every stage of an HTTPS request in order, discarding the body.",
      lookFor:
        "The connect line, the TLS version and cipher, the certificate subject and issuer, then the request and response headers.",
    },
    {
      command: "curl -sS -o /dev/null -D - https://example.com",
      purpose: "Show only the response headers.",
      lookFor:
        "The status line, server and caching headers, and any redirect target in Location.",
    },
    {
      command:
        "curl -sS -o /dev/null -w 'connect=%{time_connect}s tls=%{time_appconnect}s first_byte=%{time_starttransfer}s code=%{http_code}\\n' https://example.com",
      purpose:
        "Attribute latency to a phase: TCP connect, TLS handshake, or server processing.",
      lookFor:
        "The gap between tls and first_byte is time the server spent thinking. A large gap between connect and tls points at handshake cost.",
    },
    {
      command:
        "openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | head -25",
      purpose:
        "Inspect the handshake and the offered certificate chain directly, without HTTP involved.",
      lookFor:
        "The certificate chain depth, the issuer of each element, and the verify return code at the end.",
    },
    {
      command:
        "openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName",
      purpose:
        "Read the identity and validity of the certificate the server actually served.",
      lookFor:
        "notBefore and notAfter against today, and whether the hostname you used appears in subjectAltName.",
    },
    {
      command:
        "openssl s_client -connect example.com:443 -servername wrong.example.com </dev/null 2>&1 | head -15",
      purpose:
        "Observe how changing SNI changes which certificate you are offered.",
      lookFor:
        "A different subject, or a default certificate. This is how shared edge infrastructure behaves when SNI is wrong.",
    },
    {
      command: "curl -v https://expired.badssl.com 2>&1 | head -30",
      purpose:
        "See a real certificate validation failure, using a site published for exactly this purpose.",
      lookFor:
        "The handshake stage reached, then the verification error. Note that no HTTP status code is ever printed.",
      caution:
        "This is an intentionally broken public test site. Observe the failure; do not pass -k to work around it and move on.",
    },
    {
      command: "curl -sS -o /dev/null -w '%{http_code}\\n' https://example.com/no-such-path",
      purpose: "Produce a 4xx deliberately and confirm the transport was fine.",
      lookFor:
        "A status code, which by itself proves DNS, TCP, and TLS all succeeded.",
    },
  ],

  exercises: [
    {
      id: "d02-e1",
      title: "Annotate a verbose request as a timeline",
      steps: [
        "Run curl -v https://example.com -o /dev/null and save the output.",
        "Mark the last line of each stage: resolution, TCP connect, TLS handshake, request sent, response received.",
        "For each stage, write one failure that would stop the request at that exact point.",
      ],
      successCriteria:
        "You can point at a line in real curl output and name both the stage and who would own a failure there.",
    },
    {
      id: "d02-e2",
      title: "Compare three failures that are not the same failure",
      steps: [
        "Transport failure: curl -v --connect-timeout 5 https://192.0.2.1 and note where output stops.",
        "TLS failure: curl -v https://expired.badssl.com 2>&1 | tail -20 and note where output stops.",
        "HTTP failure: curl -v https://example.com/no-such-path 2>&1 | tail -20 and note where output stops.",
        "Write the one-line rule you would use to classify any future failure into these three buckets.",
      ],
      successCriteria:
        "You have a written rule that classifies a failure by the last stage reached, not by the error text.",
    },
    {
      id: "d02-e3",
      title: "Read a certificate the way a client does",
      steps: [
        "Fetch the certificate for a host with openssl s_client and print subject, issuer, dates, and subjectAltName.",
        "Confirm the hostname you connected with appears in subjectAltName.",
        "Run the same connection with -servername set to a different hostname and compare what you are offered.",
        "Note the verify return code in each case.",
      ],
      successCriteria:
        "You can explain why the same server can present different certificates, and name the three reasons a valid certificate still fails verification.",
    },
  ],

  scenario: {
    title: "HTTPS fails, but the network is fine",
    situation: [
      "A backend service has started failing when it calls a partner API at api.partner.example.com. The service logs show a generic TLS error and a retry storm. The partner's status page reports no incident.",
      "You confirm from the same host that DNS resolves and that a TCP connection to port 443 is established in a few milliseconds. A developer notes that the same URL loads fine in a browser on their laptop, which has them convinced the partner is lying about the outage.",
      "The service runs in a container image that was rebuilt yesterday as part of an unrelated dependency upgrade.",
    ],
    known: [
      "DNS resolution succeeds and returns an address.",
      "A TCP connection to port 443 is established quickly.",
      "The application reports a TLS-level error, and never logs an HTTP status code.",
      "The same URL works from a developer browser on a different machine.",
      "The container image was rebuilt yesterday.",
    ],
    unknown: [
      "Whether the handshake fails on certificate validation, protocol version, or cipher selection.",
      "What certificate chain the server actually presents to this client.",
      "What trust store the container image ships, and whether it changed in the rebuild.",
      "Whether the request is reaching the partner directly or passing through an intermediary.",
    ],
    task: "Write the investigation you would run from inside the failing environment. Be explicit about which commands you would run where, and what each possible result would tell you. Note which single piece of evidence would most quickly separate a server-side chain problem from a client-side trust problem.",
    guidance: {
      strongPlanIncludes: [
        "Reproducing the failure from inside the same container or host, not from a laptop.",
        "Using openssl s_client to see the handshake and chain independently of the application.",
        "Comparing the chain the server presents against what the failing client is willing to trust.",
        "Treating the image rebuild as a candidate change and diffing the trust store or TLS library version.",
        "Recognising that the absence of an HTTP status code is itself evidence.",
      ],
      commonlyMissed: [
        "Testing from the environment that actually fails. A laptop browser and a container share almost nothing relevant here.",
        "Checking whether the chain is complete, rather than only whether the leaf certificate is valid.",
        "Checking the client clock, which makes a valid certificate look expired.",
        "Looking for an intercepting proxy, which replaces the certificate you expected with one issued by an internal authority.",
        "Resisting the temptation to disable verification to make the error go away, which converts a diagnosable fault into a silent security hole.",
      ],
      systematicSequence: [
        {
          action: "Confirm where the request stops, using verbose output from the failing host.",
          reason:
            "This pins the failure to the handshake rather than the network or the application.",
        },
        {
          action: "Capture the exact TLS error text and the protocol and cipher negotiated.",
          reason:
            "Validation, version, and cipher failures look similar in application logs but have different fixes.",
        },
        {
          action: "Inspect the presented chain with openssl s_client from the failing host.",
          reason:
            "You need the chain as this client sees it, which may differ from what a browser is served or can repair.",
        },
        {
          action: "Compare against a client that succeeds, from the same network path if possible.",
          reason:
            "A difference between two clients on one path isolates the problem to client trust configuration.",
        },
        {
          action: "Check the client trust store and TLS library version against the previous image.",
          reason:
            "A rebuilt image is a change, and changes are the highest-yield place to look.",
        },
        {
          action: "Check whether traffic is being intercepted and re-signed.",
          reason:
            "An unexpected issuer is conclusive, and it moves the investigation to the network team rather than the partner.",
        },
      ],
      conceptsToReview: [
        "The ordering guarantee: TCP, then TLS, then HTTP",
        "Why missing intermediate certificates fail on some clients only",
        "SNI and multi-certificate edge servers",
        "What a status code proves about the layers beneath it",
      ],
    },
  },

  communication: {
    prompt:
      "The developer believes the partner is having an outage and wants to escalate to them. Write a reply that corrects the conclusion without dismissing the observation, states the evidence, and proposes the next step.",
    questions: [
      "What did the developer observe, and why was it a reasonable thing to notice?",
      "What does the evidence actually show about which side the problem is on?",
      "What is the strongest single piece of evidence you have, and what would overturn it?",
      "What do you need from whom, and by when?",
      "How would you explain the difference between a network failure and a certificate failure to a product manager?",
    ],
    examplePhrases: [
      "I would separate network connectivity from certificate validation before we escalate.",
      "We never receive an HTTP status code, which tells us the request fails before the application is involved.",
      "The browser succeeding and the service failing is expected here, because they do not share a trust store.",
      "My next step would be to compare the certificate chain as seen from inside the failing container.",
      "In plain terms: the connection is reaching them, but our service does not accept the ID card it is being shown.",
    ],
    tips: [
      "Acknowledge the observation before correcting the interpretation. People stop listening once they feel dismissed.",
      "Quote the specific evidence rather than asserting a conclusion.",
      "Say what would change your mind. It makes the rest of your reasoning more credible.",
    ],
  },
};
