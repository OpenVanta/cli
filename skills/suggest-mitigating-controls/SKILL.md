---
name: suggest-mitigating-controls
version: 1.0.0
description: "Analyze a specific risk scenario to suggest mitigating controls from the customer's control library. Use when the user asks which controls cover or reduce a risk, asks for suggested controls for a risk scenario, or wants to map existing controls to a risk (e.g. \"Which controls cover risk R-123?\", \"Suggest mitigating controls for this risk scenario\", \"What controls reduce this risk?\"). Do NOT use for listing controls without a risk, checking a control's status, or modifying risk scores."
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["vanta"]
---

# Suggest Mitigating Controls for Risk Scenario

This skill evaluates a customer's existing control library against a specific risk scenario to identify controls that reduce the likelihood or impact of the risk, or enhance detection, response, recovery, or governance.

Flags recommended controls for human review; does not directly alter risk scenario mappings without user confirmation.

## Triggering & Activation Scenarios
- Activate when the user asks:
  - "Which controls cover risk R-123?"
  - "Suggest mitigating controls for this risk scenario : <risk scenario>"
- Do NOT activate for:
  - Querying or listing controls without a specific risk scenario context.
  - Updating or editing risk scores, residual risk levels, or risk descriptions.
  - Suggesting third-party integrations or data sources for a risk scenario.

## Data access

Requires the `vanta` CLI on `$PATH` and a completed `vanta login`. See the `vanta` skill for auth and global flags.

| Need | Command |
|---|---|
| The risk scenario under analysis | `vanta risk-scenarios get --id <riskId>` |
| Finding the risk when the user gave a phrase, not an ID | `vanta risk-scenarios list --search-string "<text>" --page-size 100` |
| The org's control library | `vanta controls list --page-size 100` |
| Controls already linked to this risk | `vanta risk-scenarios list-controls --id <riskId> --page-size 100` |

**Field naming trap.** On a risk scenario, `description` is what the UI labels **Title** and `detailedDescription` is what the UI labels **Description**. Read both; the detailed field carries the context this analysis needs.

**Which controls are in scope.** `vanta controls list` returns the controls the organization has adopted — that is the population. `vanta controls list-library` returns Vanta's catalog of controls *not yet adopted*; those are out of scope, because this skill suggests coverage from what the customer already has. The API exposes no retired or draft state on a control, so do not claim to have filtered for one.

**Already-linked controls.** The linked-controls listing identifies each control by its shorthand identifier where it has one, falling back to the Vanta control ID — join on that same field. Controls already linked to the risk are still evaluated; they are marked so the reader can tell a confirmation from a new suggestion.

Pagination: pass `--page-size 100` and follow `nextCursor` into `--page-cursor` until `pageInfo.hasNextPage` is false. The API allows 50 requests per minute. Add `--agent-mode` for compact output on large control libraries.

Recommend first, write only on confirmation: never call the commands that add, update, or delete a control on the risk scenario unless the user explicitly confirms they want a recommendation applied.

## Grounding & Exclusion Rules
- **Grounding**: Judge each control strictly by its stated text — never give a vaguely worded control the benefit of the doubt. If a control's behavior, scope, or effectiveness is not stated, treat it as unknown.
- **Framework Scope Disclaimer**: Framework mappings and compliance scope are context only, never the primary basis for matching a control to a risk.
- **No Inferred Detail**: Never infer or assume facts or capabilities beyond what is explicitly stated in the control's name and description.

## Evaluation & Decision Logic

### Step 1 — Decompose the Risk
Before evaluating controls, internally decompose the risk scenario into:
- **Asset**: What is at risk.
- **Threat**: The adverse event or actor.
- **Vulnerability**: The weakness or root cause.
- **Impact**: The consequence.
- **Mitigation Objective**: What must be true to reduce this risk.

*(Do NOT display this risk decomposition section to the user in the final output).*

### Step 2 — Evaluate Each Control
Evaluate every control on its own merits, independently of other controls already matched. Never discard a control as redundant because another control in the same domain was already selected — a foundational control that mandates an obligation and a specific control that defines how can both be valid High matches for the same risk.

For each candidate control, determine:

A. Control Type — pick ONE (no mixed; secondary effects go in the rationale): Preventive | Detective | Corrective | Recovery | Compensating | Governance

B. Match Strength:
* High     — Directly addresses the core vulnerability, threat, or mitigation objective
* Medium   — Partially mitigates or supports a primary control
* Low      — Same domain but doesn't materially mitigate this risk
* No Match — Doesn't reduce likelihood or impact, or improve detection, response, recovery, or governance for this risk

C. Role — the control's structural position in mitigating this risk, independent of how strongly it matches:
* Primary    — directly carries the mitigation
* Supporting — assists or backstops a primary control

A High-strength control can still be Supporting (e.g. a strong logging standard that backstops the primary detective control). Role and match strength are orthogonal — do not just mirror one onto the other.

D. Mitigation Logic (required for every High and Medium) — complete without unstated assumptions:
   This control <action> → which <mechanism> → reduces <likelihood/impact> OR improves <detection/response/recovery/governance> of <the specific threat or vulnerability>.
   If the logic requires unstated assumptions or breaks at any step, downgrade or exclude.

E. Limitation (required for every control you recommend) — one sentence on what the control does NOT cover for this specific risk (gaps in scope, coverage, or effectiveness).

### Step 3 — Elimination Gate
For every `Medium` match, confirm before including in recommendations:
1. Would removing this control meaningfully weaken mitigation of this specific risk?
2. Does it address the same threat model as the risk (not a different threat in the same domain)?

If either answer is **No**, exclude the control.
**Final Output List** = All `High` matches + `Medium` matches that pass the Elimination Gate.

## Desired Outcome & Output Shape

Present the results as control blocks — one block per recommended control, sorted `High` matches first, then `Medium`:

**Risk Scenario**: `<RISK_ID>` — *<risk title>*

- **Control**: `<EXTERNAL_ID>: <CONTROL_NAME>` (`<CONTROL_ID>`) — *already linked to this risk* / *new suggestion*
  - **Control Type**: `<TYPE>`
  - **Match Strength**: `<High/Medium>`
  - **Role**: `<Primary/Supporting>`
  - **Rationale**: This control <action> → which <mechanism> → reduces <likelihood/impact> OR improves <detection/response/recovery/governance> of <threat/vulnerability>.
  - **Limitation**: <what this control does NOT cover for this specific risk>

Use the control's external ID where it has one and always include the Vanta control ID in parentheses, so the reader can act on the row. IDs must come from retrieved records — never constructed.

- If no control qualifies, state plainly that no controls met the mitigation criteria (no control blocks).
- If the user explicitly asks for a specific format (e.g. CSV, JSON, export file), write that file to the working directory and report the path, keeping the same fields and rules.

After the outputs, include:

**Confidence**: `High` / `Medium` / `Low`
- `High`: At least one `High` match with complete Mitigation Logic and clear risk/control text.
- `Medium`: Only `Medium` matches, or a `High` match has minor uncertainty due to limited scope/detail.
- `Low`: No `High` match, vague risk text, or selections depend on unverified behavior.

*Justification* (one sentence, plain language): why this confidence level applies.

*What's Missing*: one piece of information that would raise Confidence by one level.

## Validation Checklist
- [ ] Was the population the org's adopted controls, with library-only controls excluded?
- [ ] Is each rationale (mitigation logic) formatted as a single line (`Action → Mechanism → reduces <likelihood/impact> OR improves <detection/response/recovery/governance>`)?
- [ ] Did every `Medium` match pass both Elimination Gate checks?
- [ ] Are risk decomposition details hidden from the final user response?
- [ ] Is every control ID and risk ID taken verbatim from a retrieved record?
- [ ] Is each recommendation marked as already-linked or a new suggestion?
- [ ] Does each control block contain Control ID & Name, Control Type, Match Strength, Role, Rationale, and Limitation — no extra fields?
- [ ] Is Confidence assigned with justification and a "What's Missing" note?
