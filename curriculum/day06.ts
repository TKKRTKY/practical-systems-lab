import type { Day } from "./types";

export const day06: Day = {
  id: 6,
  title: "Docker networking",
  focus: "Know what localhost means in every context, and debug across the container boundary.",
  estimatedMinutes: 65,
  objective:
    "Explain how container networking changes the meaning of localhost and port numbers, and debug connectivity between containers, the host, and the outside world.",
  tags: ["docker", "containers", "networking", "ports"],

  keyConcepts: [
    {
      term: "Network namespace",
      summary:
        "Each container gets its own interfaces, addresses, routes, and localhost. That isolation is the root of nearly every container networking surprise.",
    },
    {
      term: "Bridge network",
      summary:
        "The default: containers get private addresses on a virtual switch and reach the outside through address translation on the host.",
    },
    {
      term: "Host networking",
      summary:
        "The container shares the host's namespace, so its localhost is the host's localhost and no port mapping is involved. On macOS this behaves differently than on Linux, because containers run inside a virtual machine.",
    },
    {
      term: "Port publishing",
      summary:
        "Mapping a host port to a container port. Without it, a listener inside the container is unreachable from the host no matter what it is bound to.",
    },
    {
      term: "Bind address",
      summary:
        "A process bound to 127.0.0.1 inside a container accepts only traffic from inside that container. Published ports will still fail. Binding to 0.0.0.0 is what makes it reachable.",
    },
    {
      term: "Embedded DNS",
      summary:
        "On a user-defined network, Docker resolves container and service names to container addresses. On the default bridge, name resolution between containers is not provided.",
    },
    {
      term: "host.docker.internal",
      summary:
        "A special name that resolves to the host from inside a container on Docker Desktop. It exists because the container's localhost is not the host.",
    },
    {
      term: "Service-to-service addressing",
      summary:
        "Containers address each other by service name and the container's own port, never by a published host port.",
    },
  ],

  explanations: [
    {
      heading: "The four meanings of localhost",
      paragraphs: [
        "Inside a container, localhost is that container. On the host, localhost is the host. Inside a second container, localhost is that second container. And on macOS, the Docker host itself is a virtual machine, so there is a further boundary between your Mac and the environment where containers actually run.",
        "Most container connectivity bugs are a mismatch between which of these four the author meant and which one the code gets. A database connection string pointing at localhost works perfectly on a laptop and fails immediately in a container, because it now refers to the container, where no database is running.",
      ],
    },
    {
      heading: "Published ports and bind addresses are two separate requirements",
      paragraphs: [
        "To reach a containerised service from the host you need two things: the port must be published, and the process inside must be listening on an address that accepts external traffic. Satisfy only the first and connections are refused or reset; satisfy only the second and there is no route in at all.",
        "A fast way to tell them apart: if the service answers from inside the container but not from the host, the port mapping or bind address is wrong. If it answers from neither, the service is not running or not listening where you think.",
      ],
    },
    {
      heading: "Container to container is not the same as host to container",
      paragraphs: [
        "When two containers are on the same user-defined network, they reach each other by container or service name on the container's internal port. The published host port is irrelevant on that path, and using it is a common mistake that produces confusing intermittent behaviour.",
        "On the default bridge network, name resolution between containers is not available, so a name that works in one compose project fails in an ad hoc docker run. If a hostname resolves for one container and not another, check which network each is attached to before anything else.",
      ],
    },
    {
      heading: "Debug from inside the namespace",
      paragraphs: [
        "The decisive evidence for container networking problems comes from inside the container. Execute a shell in it and test resolution and connectivity from there, because that is the only place that shares the application's view of the network.",
        "Minimal images often lack the tools you want. Rather than installing packages into a running container, use a small diagnostic image attached to the same network, or the same network namespace as the target container. That keeps the image you are debugging unchanged.",
      ],
    },
  ],

  commands: [
    {
      command: "docker run --rm -d -p 8080:80 --name psl-web nginx:alpine",
      purpose: "Start a published service to experiment against.",
      lookFor:
        "The mapping syntax: host port on the left, container port on the right. Confirm with curl on the host.",
    },
    {
      command: "curl -sS -o /dev/null -w '%{http_code}\\n' http://localhost:8080",
      purpose: "Reach the container from the host through the published port.",
      lookFor:
        "A 200 response. Note that the host port and container port differ, and only the host port works from here.",
    },
    {
      command: "docker ps --format 'table {{.Names}}\\t{{.Ports}}\\t{{.Networks}}'",
      purpose: "See the mappings and networks of running containers at a glance.",
      lookFor:
        "The port column tells you what is published. An empty port column with a running service is a complete explanation for an unreachable container.",
    },
    {
      command:
        "docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}={{$v.IPAddress}} {{end}}' psl-web",
      purpose: "Find which networks a container is on and its address on each.",
      lookFor:
        "The network name. Two containers that cannot resolve each other are usually on different networks.",
    },
    {
      command: "docker network ls",
      purpose: "List networks, including the per-project networks compose creates.",
      lookFor:
        "The driver column. Bridge networks created by a project provide name resolution; the default bridge does not.",
    },
    {
      command:
        "docker network create psl-net && docker network connect psl-net psl-web",
      purpose:
        "Create a user-defined network and attach the container, enabling name resolution.",
      lookFor:
        "After this, other containers on psl-net can reach the container by name.",
    },
    {
      command:
        "docker run --rm --network psl-net alpine sh -c 'apk add -q curl >/dev/null 2>&1; nslookup psl-web; curl -sS -o /dev/null -w \"name:%{http_code}\\n\" http://psl-web:80'",
      purpose:
        "From a second container, resolve and reach the first one by name on its container port.",
      lookFor:
        "Resolution to a private container address, and a 200 using port 80, not 8080.",
    },
    {
      command:
        "docker run --rm --network psl-net alpine sh -c 'apk add -q curl >/dev/null 2>&1; curl -sS -m 3 -o /dev/null -w \"published:%{http_code}\\n\" http://psl-web:8080; echo exit=$?'",
      purpose:
        "Prove that the published host port does not exist on the container-to-container path.",
      lookFor:
        "A failure. This is the single most instructive result of the day.",
    },
    {
      command:
        "docker run --rm alpine sh -c 'cat /etc/resolv.conf; ip addr show eth0 | grep inet; ip route'",
      purpose:
        "Inspect a container's own resolver, address, and routes from inside its namespace.",
      lookFor:
        "An internal resolver address and a private container address with a default route via the bridge.",
    },
    {
      command: "docker rm -f psl-web >/dev/null 2>&1; docker network rm psl-net >/dev/null 2>&1; echo cleaned",
      purpose: "Clean up the containers and network created by these exercises.",
      lookFor:
        "Leaving no running containers behind. Removing only what you created.",
    },
  ],

  exercises: [
    {
      id: "d06-e1",
      title: "Demonstrate all four meanings of localhost",
      steps: [
        "Start the published nginx container from the commands above.",
        "Reach it from the host on the published port.",
        "From a second container on the same user-defined network, reach it by name and container port.",
        "From that second container, try the published port and record the failure.",
        "Write a four-line note: what localhost means on the host, in container one, in container two, and what name plus container port means.",
      ],
      successCriteria:
        "You produced both a success and a failure on purpose, and your note explains why each happened.",
    },
    {
      id: "d06-e2",
      title: "Break it with a bind address",
      steps: [
        "Run a container publishing a port, with a process bound only to 127.0.0.1 inside: docker run --rm -d -p 8081:8081 --name psl-bind alpine sh -c 'nc -l -s 127.0.0.1 -p 8081'",
        "From the host, try to connect to port 8081 and record the error.",
        "Run the equivalent bound to 0.0.0.0 on another port and confirm it succeeds.",
        "Remove the containers you created.",
      ],
      successCriteria:
        "You can state the difference between an unpublished port and a wrongly bound process from the error alone.",
    },
    {
      id: "d06-e3",
      title: "Write the container connectivity checklist",
      steps: [
        "Write an ordered checklist for an application that works on the host and fails in a container.",
        "Include at least one check performed from inside the container.",
        "Include the question of which network each container is attached to.",
        "Include the host port versus container port distinction.",
      ],
      successCriteria:
        "The checklist would catch all three of: wrong localhost, missing port publication, and wrong network attachment.",
    },
  ],

  scenario: {
    title: "Works on the host, fails in Docker",
    situation: [
      "A service runs correctly when started directly on a developer's machine. Containerised with the same configuration, it starts, reports healthy, and then every request it makes to the team's cache and database fails. The logs show connection refused for the database and a resolution error for the cache.",
      "The developer has published the application port and can load the application's own health endpoint from the host, which is why they believe networking inside the container is fine.",
      "The database runs directly on the developer's machine. The cache runs as a second container started separately with docker run.",
    ],
    known: [
      "The application starts in the container and its health endpoint is reachable from the host.",
      "Database connections are refused immediately.",
      "The cache hostname fails to resolve.",
      "The database runs on the host, not in a container.",
      "The cache container was started separately rather than as part of one project.",
    ],
    unknown: [
      "What addresses the application is configured to use for the database and the cache.",
      "Which networks the application container and cache container are attached to.",
      "Whether the database listens on an address reachable from outside the host's loopback.",
      "Whether the application is using published host ports or container ports for its dependencies.",
    ],
    task: "Write the investigation plan. There are two distinct failures here with two distinct causes, and the error shapes tell you which is which. Explain what you would check for each, and in what order, and note why the working health endpoint is not evidence that container networking is correct.",
    guidance: {
      strongPlanIncludes: [
        "Treating the refused database connection and the unresolved cache name as separate problems.",
        "Reading the application's configured addresses before testing anything.",
        "Testing resolution and connectivity from inside the application container.",
        "Checking which Docker network each container is attached to.",
        "Recognising that inbound reachability of the health endpoint says nothing about outbound paths.",
      ],
      commonlyMissed: [
        "Noticing that localhost in the configuration now means the container, which fully explains the refused database connection.",
        "Checking what the database is bound to on the host, since a loopback-only listener is unreachable from a container even with the right hostname.",
        "Checking that both containers are on the same user-defined network, since the default bridge provides no name resolution.",
        "Distinguishing a resolution failure from a connection failure in the logs, which points at two different layers.",
        "Using the published host port rather than the container port on the container-to-container path.",
      ],
      systematicSequence: [
        {
          action: "Read the configured database and cache addresses as the container sees them.",
          reason:
            "Configuration carried over from a laptop is the most likely cause, and it costs nothing to check.",
        },
        {
          action: "Classify each failure: refused, timed out, or unresolved.",
          reason:
            "Each shape maps to a different layer, so this splits one vague report into two tractable problems.",
        },
        {
          action: "From inside the container, attempt resolution and a raw connection to each dependency.",
          reason:
            "Only the container's namespace shares the application's view of the network.",
        },
        {
          action: "List the networks both containers are attached to.",
          reason:
            "Name resolution between containers depends on a shared user-defined network.",
        },
        {
          action: "Check what the host database process is bound to.",
          reason:
            "A loopback-only bind cannot accept container traffic however the address is written.",
        },
        {
          action: "Correct the addressing: a host-reachable name for the database, service name and container port for the cache.",
          reason:
            "Fixing both causes together, then retesting from inside the container, confirms the diagnosis rather than coincidence.",
        },
      ],
      conceptsToReview: [
        "The four meanings of localhost",
        "Published ports versus bind addresses",
        "Embedded DNS on user-defined networks versus the default bridge",
        "Why container-to-container traffic uses container ports",
      ],
    },
  },

  communication: {
    prompt:
      "The developer has concluded that Docker networking is broken on their machine. Write a response that explains what is actually happening, in a way that leaves them better able to debug the next one themselves.",
    questions: [
      "What did they observe, and what reasonable but wrong conclusion did it lead to?",
      "What are the two separate causes, and how does the error text distinguish them?",
      "What is the mental model you want them to keep?",
      "What would you have them verify to confirm the fix?",
      "How would you explain the localhost problem to someone who has never used a container?",
    ],
    examplePhrases: [
      "The health endpoint working proves inbound publishing is correct, but it does not test any outbound path.",
      "We have two different failures: one connection refused and one name that does not resolve. They have different causes.",
      "Inside the container, localhost refers to the container itself, so the database on your machine is not there.",
      "My next step would be to test resolution and connectivity from inside the container rather than from the host.",
      "In plain terms: each container has its own private idea of here, and the configuration still says here.",
    ],
    tips: [
      "Replace the broken conclusion with a model, not just a fix. Models prevent the next three tickets.",
      "Point at the difference in the error text. It teaches the reader to classify failures themselves.",
      "Confirm the fix from inside the failing context, and say that is what you did.",
    ],
  },
};
