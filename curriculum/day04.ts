import type { Day } from "./types";

export const day04: Day = {
  id: 4,
  title: "Cloud networking fundamentals",
  focus: "Trace a packet through a VPC and find the one hop that is missing.",
  estimatedMinutes: 65,
  objective:
    "Describe the full path from a workload in a private subnet to an external API, and name the specific misconfiguration that would break each hop.",
  tags: ["cloud", "vpc", "routing", "security-groups"],

  keyConcepts: [
    {
      term: "VPC",
      summary:
        "A private address space you control. Nothing inside it reaches the internet unless you build a path for it explicitly.",
    },
    {
      term: "Subnet",
      summary:
        "A slice of the VPC range, tied to one availability zone. Subnets are public or private purely by what their route table says, not by any flag.",
    },
    {
      term: "Route table",
      summary:
        "Per-subnet rules mapping destination ranges to a target. The default route, 0.0.0.0/0, decides how a subnet reaches the internet, or whether it can at all.",
    },
    {
      term: "Internet gateway",
      summary:
        "The VPC attachment that allows bidirectional internet traffic for instances that have public addresses. Required for inbound, and for outbound from public subnets.",
    },
    {
      term: "NAT gateway",
      summary:
        "Lets private workloads make outbound connections while remaining unreachable from outside. It lives in a public subnet and is the usual target of a private subnet's default route.",
    },
    {
      term: "Security group",
      summary:
        "A stateful allow-only firewall attached to an interface. Return traffic for an allowed connection is automatically permitted, so you rarely need outbound rules for replies.",
    },
    {
      term: "Network ACL",
      summary:
        "A stateless filter at the subnet edge, with allow and deny rules evaluated in order. Because it is stateless, blocking ephemeral return ports breaks connections that looked correctly configured.",
    },
    {
      term: "Public IP versus private IP",
      summary:
        "A workload with only a private address can never be reached directly from the internet, regardless of how permissive the security groups are.",
    },
  ],

  explanations: [
    {
      heading: "A private subnet reaching the internet, hop by hop",
      paragraphs: [
        "The path is: the workload sends to a destination outside the VPC; the subnet's route table matches the default route and sends it to a NAT gateway; the NAT gateway sits in a public subnet whose route table points the default route at an internet gateway; the NAT gateway rewrites the source address to its own public address; the internet gateway forwards the traffic out. Return traffic follows the reverse path using the translation table.",
        "Every element in that chain is a separate configuration object, often owned by a different team or module. Learning the chain by heart means a failure becomes a short checklist rather than an open-ended search.",
      ],
    },
    {
      heading: "Stateful and stateless filtering fail differently",
      paragraphs: [
        "Security groups are stateful: allow the outbound connection and the response comes back automatically. Network ACLs are stateless: they evaluate each direction independently, so a rule set that permits outbound traffic on port 443 but does not permit inbound traffic on the high ephemeral port range will let your request leave and silently drop every reply.",
        "The symptom is a connection that always times out, never refuses, and looks identical to a routing problem. If routes check out but traffic still disappears, a stateless filter on the return path is the next thing to examine.",
      ],
    },
    {
      heading: "The misconfigurations that account for most incidents",
      paragraphs: [
        "In rough order of frequency: a subnet that was intended to be public but whose route table has no default route to an internet gateway; a NAT gateway placed in a private subnet, which cannot work; a route table that was never associated with the subnet it was written for; a security group that allows the wrong port or references the wrong source group; and a network ACL that blocks return traffic.",
        "Notice that four of those five are route table or association problems. When a cloud network does not work, read the route tables and their associations before anything else.",
      ],
    },
    {
      heading: "Names resolve differently inside a VPC",
      paragraphs: [
        "A VPC usually has its own resolver, which answers for internal records and forwards everything else. A workload may therefore resolve an internal hostname that your laptop cannot, and may resolve a public hostname to a private address when a private hosted zone or an interface endpoint exists.",
        "That split behaviour is intentional and useful, but it means you cannot validate a workload's view of DNS from outside the VPC. Resolution has to be tested from inside.",
      ],
    },
  ],

  commands: [
    {
      command: "echo 'Draw the path before you query anything'",
      purpose:
        "A deliberate first step: sketch workload, subnet, route table, NAT gateway, internet gateway, destination.",
      lookFor:
        "Whether you can name the object that owns each hop. The gaps in your drawing are the questions worth asking.",
    },
    {
      command: "curl -sS -m 3 http://169.254.169.254/latest/meta-data/ 2>&1 | head -5; echo exit=$?",
      purpose:
        "The instance metadata endpoint, which from inside a cloud instance reveals its own networking facts.",
      lookFor:
        "From your laptop this correctly fails. Note the address: link-local, non-routable, and identical in every instance.",
      caution:
        "Only meaningful inside a cloud instance. On a laptop it should time out, and that is the expected result here.",
    },
    {
      command: "python3 -c \"import ipaddress; net=ipaddress.ip_network('10.0.0.0/16'); subs=list(net.subnets(new_prefix=24)); print(len(subs), subs[0], subs[1], subs[-1])\"",
      purpose: "Practise subnetting arithmetic without a calculator or a console.",
      lookFor:
        "How many /24 subnets fit in a /16, and the boundaries of the first and last. Being fluent here makes route tables readable.",
    },
    {
      command: "python3 -c \"import ipaddress; print(ipaddress.ip_address('10.0.7.42') in ipaddress.ip_network('10.0.0.0/20'))\"",
      purpose:
        "Check whether an address falls inside a range, which is exactly what a route table lookup does.",
      lookFor:
        "Try a few addresses against a few prefixes until the answer is obvious to you before you run it.",
    },
    {
      command: "python3 -c \"import ipaddress; n=[ipaddress.ip_network(x) for x in ['0.0.0.0/0','10.0.0.0/16','10.0.5.0/24']]; a=ipaddress.ip_address('10.0.5.9'); print(max([x for x in n if a in x], key=lambda x: x.prefixlen))\"",
      purpose:
        "Demonstrate longest-prefix match, the rule that decides which route wins.",
      lookFor:
        "The most specific matching route is selected, not the first one listed. This is why one stray specific route can hijack traffic.",
    },
    {
      command: "dig +short api.example.com; dig +short @1.1.1.1 api.example.com",
      purpose:
        "Reinforce that resolution depends on which resolver answers, which matters inside a VPC with a private zone.",
      lookFor:
        "Equal answers here, and a reminder that inside a VPC they may legitimately differ.",
    },
  ],

  exercises: [
    {
      id: "d04-e1",
      title: "Draw the private-subnet-to-internet path from memory",
      steps: [
        "Without notes, draw every hop from a workload in a private subnet to an external API.",
        "Label each hop with the configuration object that owns it.",
        "For each hop, write the one misconfiguration that would break it.",
        "Check your drawing against the explanation above and mark what you missed.",
      ],
      successCriteria:
        "Your drawing has at least six labelled hops, each with a named failure mode.",
    },
    {
      id: "d04-e2",
      title: "Build a route table decision exercise",
      steps: [
        "Write a route table with three entries: 0.0.0.0/0 to a NAT gateway, 10.0.0.0/16 local, and 10.0.5.0/24 to a peering connection.",
        "For each of 10.0.5.9, 10.0.9.9, and 93.184.216.34, decide which route is selected and why.",
        "Verify your reasoning with the longest-prefix-match command above.",
        "Write one sentence on how a stray /32 route could silently break one destination.",
      ],
      successCriteria:
        "You chose the correct target for all three addresses by applying longest-prefix match, not by guessing.",
    },
    {
      id: "d04-e3",
      title: "Write the checklist you would actually use",
      steps: [
        "Produce an ordered checklist for diagnosing a private workload that cannot reach an external API.",
        "Order the items by how much each one eliminates, not by the layer they live at.",
        "Mark which items need access you may not have, and note who you would ask.",
        "Keep it to ten items or fewer so it is usable under pressure.",
      ],
      successCriteria:
        "The checklist fits on one screen, is ordered by information gained, and names an owner for every item you cannot check yourself.",
    },
  ],

  scenario: {
    title: "A private workload cannot reach an external API",
    situation: [
      "A background worker running in a private subnet has started failing all calls to a third-party payment provider's API. The failures are timeouts after thirty seconds, not errors from the provider. The worker was deployed to this environment for the first time this morning.",
      "An older service in the same account calls the same provider successfully. The team that owns the network says nothing has changed, and points out that the security group allows all outbound traffic.",
      "You can see from the worker's logs that it resolves the provider hostname successfully before the timeout.",
    ],
    known: [
      "Resolution of the provider hostname succeeds from the worker.",
      "Connections time out after thirty seconds rather than being refused.",
      "The security group permits all outbound traffic.",
      "A different service in the same account reaches the same provider successfully.",
      "The failing worker is new to this environment as of today.",
    ],
    unknown: [
      "Which subnet the worker is actually running in, and what its route table says.",
      "Whether the working service runs in the same subnet or a different one.",
      "Whether a NAT gateway exists and is reachable from that subnet.",
      "Whether a network ACL permits the return traffic.",
      "Whether the provider requires a source address that is on an allow list.",
    ],
    task: "Write the investigation plan. Resolution works and the security group is permissive, so state what those two facts eliminate and what they do not. Identify which single lookup would most likely explain the whole report, and justify why you would start there.",
    guidance: {
      strongPlanIncludes: [
        "Determining the worker's actual subnet before reasoning about anything else.",
        "Reading the route table associated with that subnet, and checking that it is in fact associated.",
        "Comparing against the subnet of the service that works, as a control.",
        "Using the timeout rather than refusal to focus on routing and stateless filtering rather than a closed port.",
        "Considering the provider's own source address allow list as a candidate, given the new deployment.",
      ],
      commonlyMissed: [
        "Confirming which subnet the workload landed in. Teams routinely debug the wrong subnet entirely.",
        "Checking that the route table is associated with the subnet, not merely that it exists and looks right.",
        "Checking network ACLs for return traffic on ephemeral ports, which is invisible in security group configuration.",
        "Verifying the NAT gateway itself is in a public subnet with a route to an internet gateway.",
        "Taking all outbound allowed as proof of reachability. A permissive security group says nothing about routing.",
      ],
      systematicSequence: [
        {
          action: "Identify the subnet and availability zone the worker is running in.",
          reason:
            "Every subsequent check depends on this, and it is the most commonly wrong assumption.",
        },
        {
          action: "Read the route table associated with that subnet, including the association itself.",
          reason:
            "A missing or unassociated default route is the single most likely cause of this exact symptom.",
        },
        {
          action: "Compare with the subnet and route table of the service that works.",
          reason:
            "A working control in the same account reduces the search to the difference between two configurations.",
        },
        {
          action: "Verify the NAT gateway placement and its own route to an internet gateway.",
          reason:
            "A NAT gateway in a private subnet is a real and frequent misconfiguration that looks fine in a diagram.",
        },
        {
          action: "Check the network ACL rules in both directions, including ephemeral ports.",
          reason:
            "Stateless filtering silently drops replies and mimics a routing failure exactly.",
        },
        {
          action: "Confirm the egress address the provider sees against their allow list.",
          reason:
            "A new workload may egress through a different address, which produces timeouts if the provider drops unknown sources.",
        },
      ],
      conceptsToReview: [
        "The full hop list from a private subnet to the internet",
        "Longest-prefix match and route table associations",
        "Stateful security groups versus stateless network ACLs",
        "Why permissive egress rules do not imply a usable path",
      ],
    },
  },

  communication: {
    prompt:
      "The network team has said nothing changed and that outbound traffic is fully allowed. Write a reply that keeps the investigation moving, is specific about what you want them to look at, and does not turn into an argument about blame.",
    questions: [
      "What have you established, and which of their statements is consistent with your evidence?",
      "What does a timeout rather than a refusal tell you, and why does it matter here?",
      "What exact configuration object are you asking them to check?",
      "What control case are you offering them?",
      "How would you summarise this for a status page update aimed at non-engineers?",
    ],
    examplePhrases: [
      "A permissive outbound rule is consistent with what we see; the traffic appears to have no path rather than to be rejected.",
      "At this point, we know DNS resolution succeeds and connections time out after thirty seconds.",
      "My next step would be to compare the route table association for this subnet against the one used by the service that works.",
      "I am not assuming a change was made. A new workload can land in a subnet that was never finished.",
      "In non-technical terms: the worker knows the address it needs, but there is no road out of its part of the network.",
    ],
    tips: [
      "Accept the parts of their answer that match your evidence. It moves the conversation to the open question quickly.",
      "Ask about one named object rather than asking whether the network is fine.",
      "Avoid the word nothing changed as an accusation. New deployments encounter old gaps constantly.",
    ],
  },
};
