---
name: control-testing-procedures
version: 1.0.0
description: >
  Write internal-audit-grade Test of Design (TOD) and Test of Operating
  Effectiveness (TOE) procedures for an organization's controls, covering audit
  objective, test steps, population and sampling, and evidence to obtain. Use
  when a user asks how to test a control, wants a test plan, test script, or
  audit program, asks what evidence proves a control is operating, or uploads a
  control list to be made auditable — including when they never say "TOD" or
  "test of design". Do NOT use for writing the controls themselves, mapping
  controls to frameworks, or drafting policies.
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["vanta"]
---

# Control Testing Procedures

## What this skill does

Turns a control statement into a defensible two-layer test program: a Test of
Design confirming the control is built to meet its intent at a point in time,
and a Test of Operating Effectiveness confirming it actually operated across the
audit period. The two layers fail independently — a control can be well designed
and never run, or run constantly while testing the wrong thing — so every
control gets both. Done means the control owner could execute the test from the
text alone, and an auditor would accept the resulting evidence.

## Inputs

- **Control statement** (required) — control ID, name, and description.
  Supplied by the user, or pulled from Vanta.
- **Framework mapping** (optional) — SOC 2, ISO 27001/42001, HIPAA, PCI, NIST,
  or internal. Sets the assertion the test must support. Default: infer from the
  control language and label the inference.
- **Audit period** (optional) — TOE steps are meaningless without one. Default:
  use `[audit period]` as a placeholder rather than inventing dates.
- **Implementation detail** (optional) — who runs the control, how often, in
  which system, and whether it is monitored automatically. Default: infer a
  likely implementation and flag the assumption so the user can correct it.

## Data access

None required — this skill works from a control statement the user pastes in.
Where the `vanta` CLI is available and authenticated, use it to confirm which
evidence already exists. See the `vanta` skill for auth and global flags.

| Need | Command |
|---|---|
| The org's controls, with descriptions, domains, and owners | `vanta controls list --page-size 100` |
| Controls for one framework | `vanta controls list --framework-matches-any <frameworkId> --page-size 100` |
| One control | `vanta controls get --id <controlId>` |
| Framework IDs, when the user scoped by name | `vanta frameworks list --page-size 100` |
| Automated tests already covering a control | `vanta controls list-tests --id <controlId> --page-size 100` |
| Evidence documents already attached to a control | `vanta controls list-documents --id <controlId> --page-size 100` |
| Personnel, policy, computer, and vendor records as evidence sources | `vanta people list`, `vanta policies list`, `vanta monitored-computers list`, `vanta vendors list` |

Pagination: pass `--page-size 100` and follow `nextCursor` into `--page-cursor`
until `pageInfo.hasNextPage` is false. The API allows 50 requests per minute —
pace per-control lookups across a large library.

Read-only: this skill drafts test procedures and never modifies a control, its
tests, or its documents.

## Steps

1. **Classify the control.** Two axes, both stated in one line at the top of the
   output.
   - *Orientation*: **operational** (recurring activity leaving discrete
     instances — access reviews, onboarding, vendor reviews, training,
     incidents; has a real population, so TOE is population + sampling);
     **capability** (a built or configured property — encryption, a sandbox, a
     kill switch; no recurring population, so TOE leans on functional re-test);
     or **hybrid** (a configured capability that also emits countable runtime
     instances — test both layers).
   - *Evidence source*: **automated/system-generated** (prefer full-population
     testing; sampling is a fallback, not a default) or **manual** (sampling
     applies, and the test must confirm judgment was exercised, not just that a
     box was ticked).

2. **Write the audit objective.** One sentence, phrased as what the test must
   *verify* rather than what the control *says*, naming the assertion:
   existence, completeness, accuracy, authorization, timeliness, or restriction.
   Weak: "Verify that access reviews are performed." Strong: "Verify that access
   to in-scope production systems is reviewed at the defined frequency by an
   independent reviewer, that inappropriate access identified was revoked, and
   that the review covered the complete population of users."

3. **Draft Test of Design steps.** Two to four numbered, imperative steps
   answering whether the control as built addresses the risk. Cover: the
   governing artifact and whether it defines frequency, scope, ownership, and
   thresholds rather than gesturing at them; the enforcing mechanism and whether
   it is non-bypassable; scope across the full in-scope population; and the
   failure path, since a control with no defined consequence for an exception
   detects and nothing more. If the design is broken, report a design deficiency
   and say that effectiveness testing on it is not worth performing.

4. **Draft Test of Operating Effectiveness steps.** Select strategies from the
   Step 1 classification — most controls need two or three together:
   - *Full-population testing* — analyze every instance, report exception counts
     rather than a sample. Preferred wherever the data supports it.
   - *Attribute sampling* — define population, select, test against attributes.
   - *Functional re-test* — exercise the control including at least one negative
     case that should be blocked. A control never observed refusing something
     has not been tested.
   - *Completeness reconciliation* — reconcile against an independent source
     (HRIS, IdP, asset inventory, change records). Catches items that never
     entered the process; sampling can never substitute for it.
   - *Timeliness testing* — trigger date vs. action date vs. defined SLA.

5. **Define population and sampling.** State what an item is, where the listing
   comes from, and how its completeness was established — an untested population
   listing invalidates the sample drawn from it. Sample size by frequency,
   adjusted upward for risk or known exceptions:

   | Control frequency | Population | Typical minimum sample |
   |---|---|---|
   | Annual | 1 | 1 (test all) |
   | Quarterly | 4 | 2 |
   | Monthly | 12 | 2–5 |
   | Weekly | ~52 | 5–15 |
   | Daily | ~250 | 15–40 |
   | Many times daily / event-driven | large | 25–60 |

   Test the full population when it is small (roughly 10 or fewer) or every item
   is high-risk. Stratify so privileged accounts, emergency changes, exceptions,
   and terminated users are represented rather than left to chance.

6. **List evidence to obtain.** Name each artifact and its source system, so the
   control owner knows exactly what to pull. Favor system-generated, timestamped
   evidence over attestations and screenshots. Distinguish evidence that already
   exists continuously from evidence requiring a new process — that distinction
   is the practical payoff of the whole exercise.

7. **Check against the quality bar before returning.** Does the TOE step test
   the control, or just re-inspect the document the TOD step already inspected?
   Is there a completeness assertion? At least one negative case? Is the
   population defined precisely enough that two auditors would pull the same
   listing? Could the owner execute this without a follow-up question? Is
   anything asserted about the user's tooling that they did not confirm?

8. **For a full control library, generate in one pass.** Classify every control,
   then write all test programs without pausing for sign-off. Because
   misclassification is the error that invalidates everything downstream, carry
   the reasoning forward instead: state the classification in every row, and
   name in the `assumptions` column any control whose orientation or evidence
   source was a close call, along with what the test would become if the other
   reading is right. Cross-reference shared tests — one inventory-completeness
   test referenced by five controls — rather than duplicating them, which hides
   the dependency.

## Output format

**For 1–3 controls**, deliver in the conversation using this structure per
control:

```
## [Control ID] — [Control Name]

**Classification.** [Operational | Capability | Hybrid]; [automated | manual |
hybrid] evidence. Framework: [mapping]. Test = [strategy].

**Audit objective.** [One sentence.]

### Test of Design (point-in-time)
1. ...

### Test of Operating Effectiveness ([audit period])
1. ...

**Population and sampling.** [Definition, completeness source, sample size and
rationale, stratification.]

**Evidence to obtain.** [Artifact — source system; ...]

**Exception handling.** [What counts as a deviation and what to do on finding
one — omit where it would only restate the standard expansion rule.]
```

**For 4 or more controls**, deliver as a CSV written to the working directory
(or a path the user names), one row per control, with these columns in order:

`control_id`, `control_name`, `framework_mapping`, `classification`,
`evidence_source`, `audit_objective`, `test_of_design`,
`test_of_operating_effectiveness`, `population_and_sampling`,
`evidence_to_obtain`, `exception_handling`, `assumptions`

Number multi-step procedures inline within the cell ("1. … 2. …") so each row
stays a single record. Report the file path; do not reproduce the CSV contents
in the conversation. Alongside the file, summarize only what the user needs to
act on, since nothing was confirmed before generating: close-call
classifications and what changes if they are wrong, controls with no evidence
source available today, and assumptions that would alter the test. Keep that
summary under roughly 150 words and point to the affected control IDs rather
than restating their rows — the file is the deliverable.

## Guardrails

- Never include customer data, credentials, system identifiers, or sampled
  record contents in output.
- Never assert that a specific automated test or Vanta check covers a control
  unless you confirmed it — from the control's own test listing or from the
  user. Otherwise describe the evidence type and let them confirm the mapping.
- Label every inferred implementation detail as an assumption, in the
  `assumptions` column or inline, so a wrong inference is visible rather than
  silently baked into the test.
- Do not write effectiveness tests for a control whose design is deficient —
  report the design gap first.
