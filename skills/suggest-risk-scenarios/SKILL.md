---
name: suggest-risk-scenarios
version: 1.0.0
description: >
  Evaluate active compliance frameworks, connected integrations, technical
  architecture, disclosed controls, and the existing risk register to find
  coverage gaps and recommend tailored risk scenarios. Trigger when a user asks
  to "recommend new risks based on my tech stack", "identify gaps in my risk
  register", "suggest risk scenarios for SOC 2", "suggest risk scenarios for
  data protection", "what risks should I add", or to build or expand their risk
  register. Do NOT use for listing existing risk scenarios without a gap
  analysis, for editing one specific scenario the user hands you, or for
  questions about risk scoring formulas and register settings.
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["vanta"]
---

# Recommend Tailored Risk Scenarios

Evaluate company context, active compliance frameworks, technical architecture, disclosed controls, and the current risk register to identify coverage gaps and recommend customized, highly grounded risk scenarios.

This skill has a **judgment step**: it reads company facts out of Vanta data and evaluates candidate scenarios to select and customize the most relevant ones. It suggests recommendations for human review and never writes to the risk register.

## Triggering & Activation Scenarios

- Activate when the user asks:
  - "Recommend new risks based on my tech stack"
  - "Identify gaps in my risk register"
  - "Suggest risk scenarios for my SOC 2 program"
  - "Suggest risk scenarios for data protection"
  - "What risks should I add to my risk register?"
  - "Find missing risk scenarios for my company"
- Do NOT activate for:
  - Simply listing existing risk scenarios without asking for recommendations or gap analysis.
  - Creating or editing a single specific risk scenario the user provides.
  - General questions about risk register settings or scoring formulas.

## Where candidate scenarios come from

The candidate set is `references/scenario-taxonomy.md`, bundled with this skill — neutral base scenarios organized by category, each with the CIA dimensions it threatens and the signals that make it relevant.

Read that file before selecting anything. It is the only permitted source of candidates: **never invent a scenario that is not in it.** The taxonomy is finite, so a register can genuinely exhaust it — when it does, say so rather than improvising to hit a number.

## Data access

Requires the `vanta` CLI on `$PATH` and a completed `vanta login`. See the `vanta` skill for auth and global flags.

| Signal | Command | What it establishes |
|---|---|---|
| Active frameworks | `vanta frameworks list --page-size 100` | Which obligations are in scope; drives the privacy and fraud coverage audits |
| Existing register | `vanta risk-scenarios list --include-ignored true --page-size 100` | What is already covered, including previously dismissed scenarios |
| Enterprise risks | `vanta risk-scenarios list --type "Enterprise Risk" --include-ignored true --page-size 100` | The rest of the register — the default listing returns only standard scenarios |
| Connected integrations | `vanta integrations list --page-size 100` | The technical stack, via each integration's display name and resource kinds |
| Architecture | `vanta vulnerable-assets list --page-size 100` | Asset types in use — servers, code repositories, container images, manifest files, serverless functions, workstations |
| Disclosed controls | `vanta controls list --page-size 100` | Practices the company already states it has, and their domains |
| Policy program | `vanta policies list --page-size 100` | Which governance areas are documented |
| Third-party surface | `vanta vendors list --page-size 100`, `vanta discovered-vendors list --page-size 100` | Managed vendors versus services adopted outside procurement |
| Workforce footprint | `vanta people list --page-size 100`, `vanta monitored-computers list --page-size 100` | Company stage, and device coverage relative to headcount |
| Customer commitments | `vanta contracts list --page-size 100` | Whether contractual obligations exist to track |

Not every command is needed on every run — pull what the user's scope calls for, and record which signals you actually retrieved. Pagination: pass `--page-size 100` and follow `nextCursor` into `--page-cursor` until `pageInfo.hasNextPage` is false. The API allows 50 requests per minute. Add `--agent-mode` for compact output.

**Read-only. Never create, update, archive, or submit a risk scenario.** This skill produces recommendations for a human to enter.

### Field naming trap

On a risk scenario, `description` is what the UI labels **Title** and `detailedDescription` is what the UI labels **Description**. The fields below are named after the API, so `customizedDescription` becomes the scenario's Title.

## Workflow & Execution Phases

### Phase A — Gather Context

Retrieve the signals above before selecting or drafting anything, and read the taxonomy. Record which commands succeeded — a signal you could not retrieve is unknown, never assumed absent. "No AI integration was found" and "the integration list could not be read" lead to different recommendations, and conflating them is how an unsupported scenario gets in.

### Phase B — Check for Terminal State

Compare the register — including archived and ignored scenarios — against the taxonomy scenarios whose applies-when signals are met.

If every applicable scenario is already represented, state clearly that the taxonomy holds nothing further for this company, name the categories already covered, and **STOP**. Do not invent scenarios to fill the gap.

If applicable scenarios remain but fewer than the user asked for, present what there is and say plainly that the taxonomy is exhausted at that number. Never pad.

### Phase C — Select & Customize

#### 1. Confirmed facts list

Open this phase by writing a `Confirmed facts` list:
- One short line per fact established from retrieved data.
- Name the exact source it came from (which command, which field) — active frameworks, asset types present, integrations connected, headcount band, vendor count, control domains covered.
- **Facts only; no inference.** Everything generated later in titles, descriptions, and reasons must trace to a line in this list.

#### 2. Step 1: Note disclosed controls

From the control list and policy list, note the security and privacy practices the company **already explicitly states it has** — encryption, access reviews, backup schedules, vendor review, and so on.

**Rule**: Do NOT select or phrase recommended scenarios so that these disclosed practices appear as **current gaps**, unless the retrieved data indicates partial coverage, exceptions, or a distinct scope. A control that exists on paper is a disclosed practice; treat forward-looking risk to it as a potential future condition, not a present deficiency.

#### 3. Step 2: Select the scenarios that materially cover this company (with coverage audit)

Select from the taxonomy's applicable scenarios, working toward the requested count. If the user's message doesn't specify a number, work toward at least 20.

20 is a practical starting point for a new register. It is **not** a requirement of SOC 2 or any other framework. No framework prescribes a specific amount, so never tell the user that one does. Do not mention a specific target amount to the user.

After your first pass, audit the retrieved context and adjust the selection so that, where applicable, the final set includes:

1. **Privacy / Data Governance** — set `privacyRequired` to `true` when any active framework governs personal data (for example GDPR, CCPA, US data privacy, HIPAA, ISO 27701, ISO 27018), or the user confirms personal, health, or individual financial data is handled. When `privacyRequired` is `true`, include at least one scenario from the **Privacy & data governance** category. Generic security scenarios do not satisfy this requirement. If that category's scenarios are all already in the register, recognize that privacy coverage was already complete — do not substitute a generic security scenario.
2. **Software Development Lifecycle (SDLC)** — if the company builds or ships software (engineering-heavy profile, CI/CD, repositories, product company), include at least one scenario from the **Software development lifecycle** category.
3. **Architecture & Stack** — prefer scenarios reflecting the company's actual technical setup (cloud infrastructure, multi-tenant architecture, AI/LLM usage, specific integration types) over generic checkbox gaps.

**CIA triad coverage** — the selected scenarios MUST collectively cover Confidentiality, Integrity, and Availability, using each scenario's CIA column. If a dimension is missing, swap scenarios until all three are represented.

**Grounding rule**
- *Source boundary*: company facts come from retrieved data only. The taxonomy establishes risk intent, not company architecture.
- *No assumptions*: do not infer vendors, data flows, systems, storage, integrations, credentials, roles, workflows, product capabilities, customer types, billing processes, or missing controls. If a scenario requires an unsupported assumption, select another.
- *Uncertainty*: use conditional language ("could", "may", "potential") for unconfirmed conditions. Use "Missing…" or "Absence of…" only when the data explicitly confirms the absence.

**Ongoing selection criteria**
- *Operational profile*: exclude scenarios that clearly don't apply — physical facility risks for a fully remote company, AI risks where AI use is not established, payment fraud where no payment processing is evident.
- *Company stage*: tailor to what is realistic for the company's maturity, using headcount and program depth as the signal.
- *Breadth*: prefer categories the existing register leaves underrepresented or absent.
- *SOC 2 fraud coverage*: when SOC 2 (or equivalent trust reporting) is in scope, you MUST include at least one scenario from the **Fraud & financial integrity** category — this is the coverage SOC 2's CC 3.3 fraud-risk criterion expects. Pick the fraud scenario that best fits the company's business model — how it charges customers, handles payments, manages assets, or processes records. For early-stage companies, prefer general scenarios like unauthorized record alteration or asset misuse over elaborate billing fraud.

**Low-count precedence** — if the selection is too small to satisfy every applicable requirement at once, prioritize:
1. Evidence fidelity and explicit customer requirements
2. Required SOC 2 fraud coverage
3. Privacy coverage where `privacyRequired`
4. CIA triad coverage, maximizing distinct dimensions when all three are impossible

Do not select an unsupported or clearly irrelevant scenario merely to satisfy a lower-priority requirement. If a requirement cannot be met, satisfy the higher-priority ones and say which requirement went unmet and why.

#### 4. Step 3: Deduplicate before finalizing

Deduplicate on two axes:
- **Against the register** — semantically, not by string match. An existing scenario worded differently but describing the same real-world incident already covers that candidate; drop it and count it as covered. Include archived and ignored scenarios: a previously dismissed scenario is a decision already made, and re-suggesting it wastes the reviewer's time.
- **Within the selection** — if two chosen scenarios describe the same failure mode for this company, replace one.

After any replacement, re-verify the Step 2 coverage requirements.

#### 5. Step 4: Customize (tone, length, neutrality)

For each selected scenario, produce:
- `customizedDescription` — concise risk-statement title, at most 200 characters. This is the scenario's **Title** in the UI.
- `customizedDetailedDescription` — expanded environmental context. This is the scenario's **Description** in the UI.
- `reason` — 1–2 grounded sentences explaining relevance.

##### Title structure (`customizedDescription`)

Format: **[Cause] leads to [Event], resulting in [Impact].** Max 200 characters.

##### Detailed description (`customizedDetailedDescription`)

Expand with context specific to this environment. Consider: what conditions make this likely, which assets, systems, or people are affected, what disclosed controls reduce likelihood or impact, and whether this is a known issue or a potential future risk.

##### Vocabulary & grounding rules

- **Non-technical founder tone**: plain language communicating business impact ("lost revenue", "customer trust", "operations stopped", "legal exposure"). Avoid unexplained jargon.
- **Vendor-neutral**: no specific vendor or product names in customer-facing fields. Use "third-party cloud provider", "identity provider". This holds even though you read the actual integration names — those inform selection, not wording.
- **Regulation-neutral**: no specific laws, standards, or control IDs in customer-facing fields. Use "regulatory penalties" or "compliance violations".
- **Data classification vocabulary**: use `Confidential`, `Restricted`, or `Public` rather than regulatory acronyms.
  - *Confidential*: highly sensitive — customer records, personal data, health data, financial data, credentials, source code.
  - *Restricted*: proprietary internal — internal reports, policies, contracts.
  - *Public*: approved for external distribution.
  - Map specific data: patient records → "confidential patient health data".
  - Match specificity to the scenario: use the minimum detail needed. Do not stack subtypes or parallel lists when one classification level is enough, and avoid overly generic terms like "company data".
- **Impact selection**: do not use breach-notification language as a generic compliance consequence. Confidential data, personal data, vendor involvement, encryption weaknesses, or privacy-process failures do not by themselves establish a notification event.
  - *Confidentiality-compromise scenarios* may create **potential notification obligations** when the event involves unauthorized access to, acquisition of, disclosure of, loss of, or compromise of confidential data and the facts support that possibility.
  - *Privacy-process scenarios* — inaccurate notices, consent gaps, records of processing, vendor terms, rights-request failures — more naturally create enforcement, complaints, remediation, contractual, or trust impacts, unless they also lead to a confidentiality compromise.
  - For security weaknesses with no known compromise, describe potential exposure, investigation, remediation, or future customer impact. For availability or integrity failures, describe service disruption, inaccurate records, operational loss, or recovery costs.
- **Avoid volatile details** — exact counts, team size, revenue, SLAs, dates.
- **Root-cause variety** — vary root-cause phrasing across the set while preserving Cause → Event → Impact order; avoid repeating opening words or adjective-led templates.
- **Brevity** — one clear idea per clause.

##### Examples

Base scenario: *A third-party provider is compromised, exposing the organization's systems or data held by that provider.*
- **Title**: "Weak oversight of third-party services leads to unauthorized access to confidential customer financial data, resulting in remediation costs and loss of customer trust."
- **Description**: "Where third-party services support systems containing confidential customer financial data, a compromise could expose that data. This is a forward-looking risk requiring appropriate third-party oversight."

Base scenario: *Records are created or altered without authorization because duties are not separated and changes are not supervised.*
- **Title**: "Potential gaps in record access lead to unauthorized alteration of financial records, resulting in inaccurate reporting and remediation costs."
- **Description**: "The company handles financial data, so unauthorized changes to financial records could affect the accuracy of reporting and related business decisions. This is a forward-looking risk requiring effective access controls and segregation of duties."

##### Reason structure (`reason`)

- **1–2 sentences**, second person ("you", "your").
- Tie directly to **concrete retrieved context** — what they run, store, connect, or sell — without citing framework IDs, regulations, or command names.
- *Good*: "You use external support and handle customer financial data, so a compromise involving a third-party service could create a direct trust and remediation risk for you."
- *Bad*: "Critical for Acme Corp because…" (third person) or "Required for CC6.7 and GDPR Article 32…" (framework/law names).

## Desired Outcome & Output Shape

Open with the `Confirmed facts` list so the reviewer can see the ground the recommendations stand on, then present each recommendation as a Markdown block:

- **Title** (`customizedDescription`)
  - **Description** (`customizedDetailedDescription`)
  - **Reason** (`reason`)
  - **Category / CIA** — the scenario's taxonomy category and CIA dimensions, so the reviewer can see the breadth of the set

Close with a short coverage note: which coverage requirements were satisfied, which were not and why, how many applicable scenarios remain unused, and which signals could not be retrieved this run. Keep it under roughly 100 words.

If the user asks for a file (CSV, JSON), write it to the working directory and report the path, keeping the same fields and rules.

## Validation Checklist (self-check before responding)

- [ ] Did every candidate come from `references/scenario-taxonomy.md`, with none invented?
- [ ] Listed `Confirmed facts` citing the source of each fact before selecting?
- [ ] Deduplicated against the register **including archived and ignored scenarios**, and against both scenario types?
- [ ] Checked disclosed controls so existing practices are not framed as missing gaps?
- [ ] Audited Step 2 coverage requirements (Privacy, SDLC, Architecture & Stack, Ongoing Selection Criteria incl. SOC 2 fraud, CIA triad) — each satisfied or explicitly reported as unmet?
- [ ] Distinguished "signal absent" from "signal not retrieved"?
- [ ] Avoided stating a target count or implying a framework requires one?
- [ ] Applied the grounding rule — no inferred vendors, data flows, systems, or missing controls?
- [ ] Titles formatted as `[Cause] leads to [Event], resulting in [Impact]`, at most 200 characters?
- [ ] Vendor-neutral, regulation-neutral, and classification vocabulary applied to customer-facing fields?
- [ ] `reason` written in 1–2 second-person sentences tied to concrete facts?
- [ ] Presented as recommendations only, with nothing written to the register?

## Guardrails

- Read-only. Never create, update, archive, or submit a risk scenario — the reviewer enters what they accept.
- Never invent a scenario outside the bundled taxonomy. An exhausted taxonomy is a finding to report, not a gap to fill.
- Never re-suggest a scenario the register shows as archived or ignored; that decision has already been made.
- Never name a real vendor, product, law, or control ID in a customer-facing field, even where the retrieved data named it.
- No customer data in examples committed anywhere; runtime output describes only what the retrieved data supports.
