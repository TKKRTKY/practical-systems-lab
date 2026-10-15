import type { Day } from "./types";

export const day09: Day = {
  id: 9,
  title: "Kubernetes fundamentals",
  focus: "Follow a request into a cluster, and know where to look when it stops.",
  estimatedMinutes: 60,
  objective:
    "Describe the request path from outside a cluster to a container, and identify which object to inspect when one workload cannot reach another.",
  tags: ["kubernetes", "containers", "service-discovery", "networking"],

  keyConcepts: [
    {
      term: "Pod",
      summary:
        "The smallest deployable unit: one or more containers sharing a network namespace and an IP address. Pods are replaceable and their addresses change.",
    },
    {
      term: "Deployment",
      summary:
        "Declares a desired number of pod replicas from a template and replaces them on change. You rarely create pods directly.",
    },
    {
      term: "Service",
      summary:
        "A stable name and virtual address in front of a changing set of pods, selected by labels. It exists because pod addresses are not stable.",
    },
    {
      term: "Label selector",
      summary:
        "How a Service finds its pods. A selector that matches nothing produces a Service with no endpoints, which fails like a network problem.",
    },
    {
      term: "Endpoints",
      summary:
        "The actual pod addresses currently behind a Service. An empty endpoint list is the single most useful signal when traffic goes nowhere.",
    },
    {
      term: "Ingress",
      summary:
        "Routes external HTTP traffic to Services by host and path. It needs a controller to do anything; the object alone is just a declaration.",
    },
    {
      term: "ConfigMap and Secret",
      summary:
        "Configuration and sensitive values mounted as files or environment variables. Changes do not restart pods by themselves, so a pod can be running with stale configuration.",
    },
    {
      term: "Namespace",
      summary:
        "A scope for names. Cross-namespace addressing requires a qualified name, and a short name that works in one namespace silently fails in another.",
    },
    {
      term: "Cluster DNS",
      summary:
        "Service names resolve as service.namespace.svc.cluster.local. A short name relies on search domains in the pod's resolver configuration.",
    },
    {
      term: "Readiness versus liveness",
      summary:
        "Readiness controls whether a pod receives traffic; liveness controls whether it is restarted. A pod can be running and alive while deliberately receiving nothing.",
    },
  ],

  explanations: [
    {
      heading: "The request path, outside in",
      paragraphs: [
        "External traffic arrives at a load balancer, reaches an ingress controller, which matches a host and path rule and forwards to a Service. The Service resolves to one of its current endpoints, which is a pod address, and the traffic arrives at a container port. Inside the cluster, a pod calling another workload skips the first two hops and starts at the Service.",
        "Each hop has one question. Does the ingress rule match? Does the Service have endpoints? Is the container listening on the port the Service targets? Is the pod ready? Walking the path in order turns an opaque cluster problem into four checks.",
      ],
    },
    {
      heading: "Running is not the same as serving",
      paragraphs: [
        "A pod in Running state has started its containers. That is all it means. The pod may be failing readiness probes and therefore excluded from its Service, it may be listening on a different port than the Service targets, or its labels may not match any selector at all.",
        "This is why the most valuable early check is not the pod status but the Service endpoints. Endpoints are the join between your intent and reality: if they are empty while pods are running, the problem is labels, ports, or readiness, and you have just eliminated the entire network.",
      ],
    },
    {
      heading: "Names, namespaces, and the quiet failure",
      paragraphs: [
        "Within a namespace, a Service can be addressed by its short name. Across namespaces you need service.namespace, and the fully qualified form always works. A configuration copied between namespaces will resolve to the wrong thing or to nothing, with no indication that the name was interpreted differently.",
        "When a pod reports that a hostname does not resolve, check the namespace before checking the network. Then check the pod's resolver configuration, because that is where the search domains that make short names work are defined.",
      ],
    },
    {
      heading: "Where the evidence lives",
      paragraphs: [
        "Four commands cover most investigations. Get for the current state and whether objects exist, describe for events and probe failures and the reasons behind a state, logs for what the application itself said, and exec for testing from inside the pod's own network namespace.",
        "Describe is underused and is usually the highest-yield of the four, because the events section records scheduling failures, image pull errors, probe failures, and mount problems in plain language, with timestamps.",
      ],
    },
  ],

  commands: [
    {
      command: "kubectl version --client 2>/dev/null || echo 'kubectl not installed - read the commands and the expected output instead'",
      purpose:
        "Check whether you have a client available. A cluster is not required to learn the investigation order.",
      lookFor:
        "If you have no cluster, treat every command below as a reading exercise: know what each one answers.",
      caution:
        "This day is deliberately runnable without a cluster. Do not install one just for these exercises.",
    },
    {
      command: "kubectl get pods -o wide",
      purpose: "List pods with their addresses, nodes, and restart counts.",
      lookFor:
        "Restart counts and ages. A high restart count with Running status means a crash loop that has recovered for now.",
    },
    {
      command: "kubectl get svc,endpoints -n default",
      purpose:
        "List Services alongside their endpoints, which is the fastest way to see whether a Service has any backends.",
      lookFor:
        "An endpoints entry with no addresses. That is a label, port, or readiness problem, not a network problem.",
    },
    {
      command: "kubectl describe svc my-service",
      purpose: "Read a Service's selector, ports, and target ports.",
      lookFor:
        "Whether the target port matches the port the container actually listens on, and whether the selector matches real pod labels.",
    },
    {
      command: "kubectl describe pod my-pod | sed -n '/Events/,$p'",
      purpose: "Read the event history for a pod, which explains most failures in words.",
      lookFor:
        "Probe failures, image pull errors, scheduling failures, and mount errors with timestamps.",
    },
    {
      command: "kubectl logs my-pod --tail=50 --timestamps",
      purpose: "Read what the application itself reported.",
      lookFor:
        "Startup lines confirming the port it bound to, and the exact text of its connection failures.",
    },
    {
      command: "kubectl logs my-pod --previous --tail=50",
      purpose: "Read the logs of the previous container instance after a restart.",
      lookFor:
        "The reason for the crash. The current container's logs will not contain it.",
    },
    {
      command:
        "kubectl exec -it my-pod -- sh -c 'cat /etc/resolv.conf; nslookup my-service; nc -vz my-service 80'",
      purpose:
        "Test resolution and connectivity from inside the pod's own network namespace.",
      lookFor:
        "The search domains in resolv.conf, whether the Service name resolves, and whether the port accepts a connection.",
    },
    {
      command:
        "kubectl run psl-debug --rm -it --image=alpine --restart=Never -- sh -c 'nslookup my-service.default.svc.cluster.local; exit'",
      purpose:
        "Use a temporary debug pod when the target image has no diagnostic tools.",
      lookFor:
        "Resolution of the fully qualified name, which distinguishes a DNS problem from a search domain problem.",
      caution:
        "Clean up temporary pods. The --rm flag handles it here, but confirm with kubectl get pods.",
    },
    {
      command: "kubectl get events --sort-by=.lastTimestamp | tail -20",
      purpose: "See recent cluster events in order, across objects.",
      lookFor:
        "Correlation between an event timestamp and the start of the problem.",
    },
  ],

  exercises: [
    {
      id: "d09-e1",
      title: "Write the request path and the question at each hop",
      steps: [
        "Write the path from an external client to a container, naming every object.",
        "For each hop, write the one question that decides whether traffic passes.",
        "For each hop, write the command that answers that question.",
        "Mark which hops exist for pod-to-pod traffic and which do not.",
      ],
      successCriteria:
        "You have a hop-question-command table covering at least five hops.",
    },
    {
      id: "d09-e2",
      title: "Explain an empty endpoint list four ways",
      steps: [
        "Write four distinct causes of a Service with no endpoints.",
        "For each, write the command that would confirm it.",
        "Order them by how quickly they can be checked.",
        "Write one sentence on why this check comes before any network investigation.",
      ],
      successCriteria:
        "Your four causes include a label mismatch, a port mismatch, readiness failures, and no running pods.",
    },
    {
      id: "d09-e3",
      title: "Resolve the same Service three ways",
      steps: [
        "Write the three forms: short name, service.namespace, and the fully qualified cluster name.",
        "Write which of the three work from a pod in the same namespace, and which from another namespace.",
        "Explain the role of search domains in the pod resolver configuration.",
        "Write the failure a configuration copied to a different namespace would produce.",
      ],
      successCriteria:
        "You can predict resolution success for all three forms from both namespaces without looking it up.",
    },
  ],

  scenario: {
    title: "The pod is running but cannot reach a backend",
    situation: [
      "An API pod is Running with no restarts. Its logs show that every call to the user service fails. The team deployed a change to the user service an hour ago, which included renaming some labels to match a new naming convention.",
      "Someone has already confirmed that the user service pods are Running and that the Service object exists. The cluster network team has been asked to investigate a possible network problem.",
      "The API pod reports a connection timeout to the user service, not a resolution failure.",
    ],
    known: [
      "The API pod is Running with no restarts.",
      "User service pods are Running and the Service object exists.",
      "The failure is a connection timeout, not a resolution failure.",
      "Labels on the user service were renamed an hour ago as part of a convention change.",
    ],
    unknown: [
      "Whether the Service has any endpoints behind it.",
      "Whether the Service selector still matches the renamed pod labels.",
      "Whether the Service target port matches the container port.",
      "Whether the user service pods are passing readiness probes.",
      "Whether both workloads are in the same namespace.",
    ],
    task: "Write the investigation plan. The name resolves but the connection times out, so state what that combination tells you. Name the single command you would run first and exactly what you would conclude from each possible result. Explain why involving the network team now is probably premature.",
    guidance: {
      strongPlanIncludes: [
        "Checking Service endpoints before anything else.",
        "Using the fact that resolution succeeds to eliminate cluster DNS and namespace naming.",
        "Connecting the label rename to the Service selector explicitly.",
        "Checking target port against container port as an independent cause.",
        "Checking readiness, since a failing probe removes a Running pod from endpoints.",
      ],
      commonlyMissed: [
        "Checking endpoints at all. Running pods plus an existing Service feels like proof and is not.",
        "Linking the reported change to the symptom. A label rename is exactly what breaks a selector.",
        "Noticing that resolution succeeding means the Service exists and DNS works, which is a large elimination.",
        "Reading the pod events for probe failures rather than only the pod phase.",
        "Verifying namespace alignment before escalating to another team.",
      ],
      systematicSequence: [
        {
          action: "Get the Service and its endpoints together.",
          reason:
            "An empty endpoint list explains the entire symptom and takes one command.",
        },
        {
          action: "Compare the Service selector against the current pod labels.",
          reason:
            "The reported label rename makes a selector mismatch the leading hypothesis.",
        },
        {
          action: "Compare the Service target port against the container port.",
          reason:
            "A port mismatch produces timeouts with healthy-looking objects on both sides.",
        },
        {
          action: "Describe a backend pod and read its events and probe status.",
          reason:
            "Readiness failures remove pods from endpoints while leaving them Running.",
        },
        {
          action: "From inside the API pod, resolve the Service and attempt a raw connection.",
          reason:
            "Testing from the pod's namespace confirms the client's actual view rather than yours.",
        },
        {
          action: "Only then consider cluster networking, with the endpoint evidence attached.",
          reason:
            "Escalating with evidence is fast; escalating a guess consumes another team's day.",
        },
      ],
      conceptsToReview: [
        "Label selectors and endpoint population",
        "Readiness probes and traffic eligibility",
        "Service port versus target port versus container port",
        "Cluster DNS naming and namespace scope",
      ],
    },
  },

  communication: {
    prompt:
      "The network team has been pulled in already. Write the update that redirects the investigation without blaming whoever escalated, and gives the user service team a specific thing to check.",
    questions: [
      "What was the symptom, and what made a network problem a reasonable first guess?",
      "What evidence changes the direction, and how certain is it?",
      "What specific object do you want checked, and by whom?",
      "What would you expect to see if your hypothesis is right?",
      "How would you summarise this for a non-engineer stakeholder asking about user impact?",
    ],
    examplePhrases: [
      "A timeout to a Service is a reasonable thing to read as a network issue, so this was a fair first call.",
      "At this point, we know the Service name resolves, which means cluster DNS and the Service object are fine.",
      "My next step would be to check whether the Service has any endpoints, which would explain the timeout entirely.",
      "The label rename an hour ago lines up with the start of the failures, so I would compare the selector against the current pod labels.",
      "For a non-technical summary: the front door has the right address, but the list of staff behind it is empty, so nobody answers.",
    ],
    tips: [
      "Validate the original escalation briefly. It keeps people willing to escalate next time.",
      "Tie the change to the timeline explicitly. Correlation is the fastest honest argument you have.",
      "Ask for one named check rather than a general look into it.",
    ],
  },
};
