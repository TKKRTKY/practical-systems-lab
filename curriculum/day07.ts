import type { Day } from "./types";

export const day07: Day = {
  id: 7,
  title: "OAuth, OIDC, and SSO fundamentals",
  focus: "Separate who you are from what you may do, and read token failures precisely.",
  estimatedMinutes: 60,
  objective:
    "Walk through an authorization code flow end to end, and diagnose why a successful sign-in can still be followed by a rejected API request.",
  tags: ["oauth", "oidc", "authentication", "authorization", "tokens"],

  keyConcepts: [
    {
      term: "Authentication versus authorization",
      summary:
        "Authentication establishes identity; authorization establishes permission. A 401 is about the first, a 403 about the second.",
    },
    {
      term: "Authorization code flow",
      summary:
        "Redirect the user to the provider, receive a short-lived code on a registered redirect URI, then exchange that code server-side for tokens. The code is not a token and is single use.",
    },
    {
      term: "Access token",
      summary:
        "A short-lived credential presented to an API. It carries audience, scopes, and an expiry, and the API is expected to validate all three.",
    },
    {
      term: "Refresh token",
      summary:
        "A longer-lived credential used only against the provider to obtain new access tokens. It must never be sent to an API.",
    },
    {
      term: "ID token",
      summary:
        "An OIDC token describing who signed in, intended for the client application. It is not an API credential, and using it as one is a frequent and confusing mistake.",
    },
    {
      term: "Audience",
      summary:
        "The intended recipient of a token. A valid, unexpired token for the wrong audience is correctly rejected, which produces the puzzling signed-in-but-denied report.",
    },
    {
      term: "Scope",
      summary:
        "The permissions the token was granted. Scopes are requested at authorization time, so a missing scope cannot be fixed at the API.",
    },
    {
      term: "Redirect URI",
      summary:
        "Must match a registered value exactly, including scheme, host, port, path, and trailing slash. Mismatches fail before any token exists.",
    },
    {
      term: "SAML",
      summary:
        "An older enterprise standard built on signed XML assertions posted through the browser. Conceptually similar in purpose to OIDC, with different mechanics and different failure modes.",
    },
    {
      term: "Clock skew",
      summary:
        "Token validity is time-based. A client or server clock that is wrong by minutes makes valid tokens appear expired or not yet valid.",
    },
  ],

  explanations: [
    {
      heading: "The flow, in the order the failures happen",
      paragraphs: [
        "The user is redirected to the provider with a client identifier, a redirect URI, requested scopes, and a state value. They authenticate. The provider redirects back to the registered URI with a code. The application exchanges that code, plus a client secret or proof key, for tokens. The application then calls the API presenting the access token.",
        "Each boundary has its own characteristic failure. A wrong redirect URI or client identifier fails at the provider, before any sign-in completes. A bad exchange fails server-side with a provider error and no token. A token problem fails at the API with a 401 or 403. Knowing which boundary produced the error narrows the cause to one of three configurations.",
      ],
    },
    {
      heading: "Why sign-in succeeding tells you almost nothing about the API",
      paragraphs: [
        "Signing in proves the identity leg worked. The API call is a separate exchange with its own requirements: the right token type, the right audience, unexpired, with the scopes that endpoint demands, and presented in the expected header format. Any one of those can be wrong while sign-in looks flawless.",
        "This is why the single most useful habit here is to decode the token you actually sent and compare its claims against what the API requires. Most investigations end within a minute of someone doing that, and drag on for hours when nobody does.",
      ],
    },
    {
      heading: "401 and 403 are not interchangeable",
      paragraphs: [
        "A 401 means the credential is missing, malformed, unverifiable, or expired. The fix lives in how the token was obtained or attached. A 403 means the credential was understood and the caller is not permitted. The fix lives in scopes, roles, or resource-level policy.",
        "Treating these as one error leads people to refresh tokens repeatedly against a permission problem. Read the status code and the error body, which for well-behaved APIs names the missing scope or the audience it expected.",
      ],
    },
    {
      heading: "Tokens are inspectable, and you should inspect them",
      paragraphs: [
        "A JWT is three base64url-encoded segments joined by dots: header, payload, signature. The payload can be decoded locally without any secret, which lets you read issuer, audience, subject, scopes, and expiry directly.",
        "Decoding is not verifying. Reading claims locally is a diagnostic act; it tells you what the token says, not whether it is trustworthy. Verification is the API's job and requires the provider's public keys.",
      ],
    },
  ],

  commands: [
    {
      command:
        "curl -sS https://accounts.google.com/.well-known/openid-configuration | python3 -m json.tool | head -25",
      purpose:
        "Read a real OIDC discovery document to see how a provider advertises its endpoints.",
      lookFor:
        "The authorization, token, and jwks endpoints, plus the supported response types and scopes. Every OIDC provider publishes this shape.",
    },
    {
      command:
        "python3 -c \"import json,urllib.request; d=json.load(urllib.request.urlopen('https://accounts.google.com/.well-known/openid-configuration')); print('\\n'.join(f'{k}: {d[k]}' for k in ['issuer','authorization_endpoint','token_endpoint','jwks_uri']))\"",
      purpose: "Extract just the endpoints that matter during an investigation.",
      lookFor:
        "The issuer value. A token whose issuer claim does not match this exactly will be rejected.",
    },
    {
      command:
        "python3 -c \"import base64,json; t='eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImsxIn0.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbS8iLCJhdWQiOiJodHRwczovL2FwaS5leGFtcGxlLmNvbSIsInN1YiI6InVzZXJfMTIzIiwic2NvcGUiOiJyZXBvcnRzLnJlYWQiLCJleHAiOjE3MDAwMDAwMDAsImlhdCI6MTY5OTk5NjQwMH0.c2lnbmF0dXJl'; h,p,s=t.split('.'); pad=lambda x: x+'='*(-len(x)%4); print(json.dumps(json.loads(base64.urlsafe_b64decode(pad(h))),indent=2)); print(json.dumps(json.loads(base64.urlsafe_b64decode(pad(p))),indent=2))\"",
      purpose:
        "Decode a sample token's header and payload locally, with no secret and no network.",
      lookFor:
        "The iss, aud, sub, scope, and exp claims. This sample token is fictional and its signature is not real.",
    },
    {
      command:
        "python3 -c \"import datetime; exp=1700000000; print('expires:', datetime.datetime.fromtimestamp(exp)); print('expired now:', exp < datetime.datetime.now().timestamp())\"",
      purpose: "Convert an exp claim into a human time and decide if it is expired.",
      lookFor:
        "Whether the token is expired, and by how much. Compare against your own clock being correct.",
    },
    {
      command: "date -u +%Y-%m-%dT%H:%M:%SZ; python3 -c \"import time; print('unix:', int(time.time()))\"",
      purpose: "Confirm your own clock, since token validation is time-based.",
      lookFor:
        "Agreement with a trusted source. Skew of a few minutes is enough to break validation.",
    },
    {
      command:
        "curl -sS -o /dev/null -w '%{http_code}\\n' -H 'Authorization: Bearer not-a-real-token' https://api.github.com/user",
      purpose:
        "Observe a genuine 401 from a real API when the credential cannot be verified.",
      lookFor:
        "A 401, not a 403. Compare with the body of the response to see what the API tells you.",
    },
    {
      command:
        "curl -sS -D - -o /dev/null -H 'Authorization: Bearer not-a-real-token' https://api.github.com/user | grep -i -E 'HTTP/|www-authenticate'",
      purpose: "Read the challenge headers that accompany an authentication failure.",
      lookFor:
        "The WWW-Authenticate header, which is where a well-behaved API tells you why it rejected you.",
    },
    {
      command:
        "python3 -c \"import urllib.parse as u; print(u.urlencode({'response_type':'code','client_id':'app-123','redirect_uri':'https://app.example.com/callback','scope':'openid profile reports.read','state':'xyz','code_challenge_method':'S256'}))\"",
      purpose:
        "Build an authorization request by hand to internalise which parameters exist.",
      lookFor:
        "That the redirect URI is part of the request and must match registration exactly, including the trailing path.",
    },
  ],

  exercises: [
    {
      id: "d07-e1",
      title: "Narrate the flow in eight steps or fewer",
      steps: [
        "Write the authorization code flow from first redirect to a successful API call.",
        "Mark which steps happen in the browser and which happen server-side.",
        "Mark where each of these appears for the first time: code, access token, refresh token, ID token.",
        "For each step, name one failure that would stop the flow there.",
      ],
      successCriteria:
        "You can narrate the flow without notes and correctly place every credential type.",
    },
    {
      id: "d07-e2",
      title: "Decode a token and judge it",
      steps: [
        "Decode the sample token using the command above.",
        "Write down its issuer, audience, subject, scopes, and expiry.",
        "Decide whether it would be accepted by an API at https://api.example.com requiring the reports.read scope.",
        "Decide what would change if the API required reports.write instead, and state the status code you would expect.",
      ],
      successCriteria:
        "You correctly predict acceptance or rejection and the status code, using only the claims.",
    },
    {
      id: "d07-e3",
      title: "Build the 401 versus 403 decision table",
      steps: [
        "List six causes: expired token, wrong audience, missing scope, ID token used as access token, missing Authorization header, user lacks a role.",
        "For each, record the status code you would expect and the layer that owns the fix.",
        "Produce a real 401 against a public API and read the WWW-Authenticate header.",
        "Note which two causes are hardest to tell apart from the status code alone, and what evidence separates them.",
      ],
      successCriteria:
        "Your table maps each cause to a status code and an owner, and you can name the evidence that disambiguates the ambiguous pair.",
    },
  ],

  scenario: {
    title: "Signed in successfully, API returns 401",
    situation: [
      "A new internal dashboard uses the company identity provider for sign-in. Users report that sign-in works: they see their name and avatar in the header. But every data panel shows an error, and the browser network tab shows the dashboard's API calls returning 401.",
      "The frontend team says authentication is clearly working because the user is signed in. The API team says the token they receive is not valid for them. Both teams are looking at different evidence and have stopped making progress.",
      "The dashboard was changed yesterday to add a second API, owned by another team, alongside the original one.",
    ],
    known: [
      "Sign-in completes and user identity is displayed in the application.",
      "API requests return 401, not 403.",
      "The API team reports the presented token is not valid for their service.",
      "A second API was added to the dashboard yesterday.",
    ],
    unknown: [
      "Which token the frontend is attaching to API requests, and in what header format.",
      "What audience the presented token carries, and what each API expects.",
      "Which scopes were requested at authorization time.",
      "Whether the token is expired by the time it reaches the API, and whether clocks agree.",
      "Whether both APIs expect tokens for the same audience.",
    ],
    task: "Write the investigation plan. The status code is 401 rather than 403, so state what that rules out immediately. Identify the single artefact you would ask for first, and what you would read from it. Then set out the order of checks and the handover point between the frontend and API teams.",
    guidance: {
      strongPlanIncludes: [
        "Using the 401 to rule out a pure permission problem and focus on the credential itself.",
        "Asking for one real failing request, including the Authorization header, rather than descriptions.",
        "Decoding the presented token and comparing its claims against what the API requires.",
        "Checking whether the ID token is being sent instead of an access token.",
        "Considering the newly added second API as a change that could have altered audience handling.",
      ],
      commonlyMissed: [
        "Distinguishing the ID token from the access token. This single confusion causes a large share of signed-in-but-401 reports.",
        "Checking the audience claim against each API's expected value, especially once two APIs are involved.",
        "Verifying the header format, since a missing Bearer prefix or a doubled prefix fails validation.",
        "Checking expiry and clock skew before redesigning anything.",
        "Confirming which scopes were actually requested, because scopes cannot be added at the API.",
      ],
      systematicSequence: [
        {
          action: "Capture one failing request with its Authorization header and the response body.",
          reason:
            "Everything else is inference. One real request usually contains the answer.",
        },
        {
          action: "Decode the presented token and list issuer, audience, scopes, and expiry.",
          reason:
            "These four claims determine acceptance, and reading them is free.",
        },
        {
          action: "Compare the audience claim against what each API expects.",
          reason:
            "With two APIs in play, one audience cannot satisfy both unless they were designed to share it.",
        },
        {
          action: "Confirm the token is an access token, not an ID token.",
          reason:
            "An ID token looks valid and is correctly rejected by APIs, which explains the disagreement between teams.",
        },
        {
          action: "Check expiry against both client and server clocks.",
          reason:
            "Skew produces intermittent 401s that look like random failures.",
        },
        {
          action: "If claims are correct, ask the API team which validation step failed.",
          reason:
            "Once the token is known good, the remaining question is on their side, and the handover is clean.",
        },
      ],
      conceptsToReview: [
        "The difference between ID tokens and access tokens",
        "Audience validation and multi-API designs",
        "401 versus 403 and who owns each",
        "Where scopes are granted, and why they cannot be fixed later",
      ],
    },
  },

  communication: {
    prompt:
      "Two teams are each convinced the other is wrong. Write a message that reframes the problem so both can act, asks for the one artefact you need, and avoids assigning fault before evidence.",
    questions: [
      "What is each team observing, and why are both observations compatible?",
      "What does the 401 tell you, and what does it not?",
      "What single artefact do you need, and from whom?",
      "What will you be able to conclude once you have it?",
      "How would you explain the difference between signing in and being allowed to read data, to a non-engineer?",
    ],
    examplePhrases: [
      "Both of these can be true: the user is signed in, and the token we send is not valid for that API.",
      "I would separate authentication from authorization here. A 401 points at the credential, not the permission.",
      "Could you send me one failing request including the Authorization header value? I would like to decode the token we actually presented.",
      "At this point, we know identity is established and the API is rejecting the credential before any permission check.",
      "In plain terms: the user has shown valid ID at the front desk, but we are handing the data team a pass that was issued for a different building.",
    ],
    tips: [
      "Validate both parties with a single sentence before proposing a direction. It ends the standoff fast.",
      "Ask for an artefact, not an opinion. One captured request outranks two confident summaries.",
      "Name the handover condition up front, so everyone knows what would move ownership.",
    ],
  },
};
