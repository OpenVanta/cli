---
name: test-remediation-digest
version: 1.0.0
description: >
  Translate failing Vanta tests into per-engineer remediation instructions
  covering what to fix, how to fix it, and by when — so the compliance owner
  never translates test-by-test. Trigger when the user asks: "turn failing
  tests into remediation instructions", "remediation digest", "what do my
  engineers need to fix", "assign failing tests to engineers", "engineer
  handoff for failing tests", "who needs to fix what", "draft remediation
  asks for failing tests", or any request to group, assign, or hand off
  failing test remediation by owner. This skill is on-demand only — it runs
  when a user asks, never on a schedule or as an unprompted reminder. Do NOT trigger for: a lookup of one specific test (answer
  directly), actually executing a fix or marking a test remediated (this
  skill only drafts instructions), or vulnerability/CVE triage (use
  weekly-vulnerability-triage instead).
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["vanta"]
---

# Test Remediation Digest

## What this skill does

Pulls every failing test in scope, resolves who owns each fix, and produces
handoff-ready remediation instructions grouped per owning engineer: **what** is
failing in plain language, **how** to fix it as concrete numbered steps, and
**by when** with a labeled deadline source. Done means the compliance owner
can forward each engineer's section as-is — no per-test translation, no
follow-up questions about which resource or console page is meant.

## Inputs

- **`frameworkScope`** *(optional, default: all frameworks)* — limit to tests
  mapped to controls in one framework (e.g., SOC 2, ISO 27001).
- **`ownerScope`** *(optional, default: org-wide)* — limit to tests owned by
  one person.
- **`defaultWindow`** *(optional, default: 30 days)* — fallback remediation
  window applied when Vanta returns no remediation date, counted from the
  test's most recent status flip. The user can override it.

## Data access

Requires the `vanta` CLI on `$PATH` and a completed `vanta login`. See the
`vanta` skill for auth and global flags. Bundled reference:
`references/how-to-fix-style.md` — the full writing standard for fix
instructions.

| Need | Command |
|---|---|
| Failing tests | `vanta tests list --status-filter NEEDS_ATTENTION --page-size 100` |
| Failing tests, scoped | add `--framework-filter <id>`, `--owner-filter <id>`, `--control-filter <id>`, or `--category-filter <category>` |
| Deactivated tests, for the exclusion count | `vanta tests list --status-filter DEACTIVATED --page-size 100` |
| The specific resources a test is failing on | `vanta tests list-entities --id <testId> --entity-status FAILING --page-size 100` |
| Controls, for the owner fallback | `vanta controls list --page-size 100` |
| The tests mapped to one control | `vanta controls list-tests --id <controlId> --page-size 100` |
| Framework IDs, when the user scoped by name | `vanta frameworks list --page-size 100` |

Each test in the listing already carries everything the digest needs about
the test itself: its owner, its failure description, its remediation
description, its category, its most recent status-flip date, and a
remediation block giving the soonest remediate-by date and the count of
items needing remediation. Do not fetch per-test detail for fields the
listing already returned.

Pagination: pass `--page-size 100` and follow `nextCursor` into
`--page-cursor` until `pageInfo.hasNextPage` is false. The API allows 50
requests per minute — the per-test entity lookups in step 2 are the
expensive part, so pace them and say so if you have to stop short. Add
`--agent-mode` for compact output on large test suites.

Read-only: never deactivate or reactivate a test or an entity, and never
change an owner. This skill drafts instructions for a human to send.

## Run contract (obey first)

- **RESET**: Start empty every run. Count only this run's records; never
  carry rows, owners, or deadlines forward from a prior run.
- **GROUND**: Every test name, status, owner, resource identifier,
  and date must come from a command response in this run. Never fabricate an
  owner, a deadline, a failing resource, or a fix detail.
- **LABEL**: Anything derived rather than returned is labeled — a defaulted
  deadline reads `(default — override as needed)`, an unresolved owner
  becomes an `Unassigned — needs owner` row. Unknown never becomes a guess.

## Steps

1. **Fetch failing tests.** Pull all tests whose status is needs attention
   within `frameworkScope` and `ownerScope`, fetching every page to the end.
   Record the total evaluated count before any exclusion. Separately pull
   the deactivated tests and record that count — deactivation is how a test
   is exempted, and a deactivated test is already outside the failing set,
   but the reader needs the number. A deactivated test whose deactivation
   reason reads as an open-ended exemption is flagged in the summary as
   "Indefinite exemption — needs review."

2. **Pull the failing resources per test.** Retrieve the specific failing
   resources/entities (bucket names, repo names, user accounts — whatever
   the test enumerates) only for the failing tests identified in step 1. In
   large environments, pace the per-test lookups against the rate limit; if
   the failing-test count makes full coverage impractical, state the number
   covered and which tests were left at category level — never imply full
   coverage. If an entity lookup fails for one test, do not fail the run —
   record it in a "resources unavailable" count and continue. The fix
   instructions must name the actual failing resources, not the resource
   category.

3. **Resolve the owner.** In order: (a) the test's assigned owner; (b) if
   none, the owner of a control the test is mapped to — if multiple mapped
   controls have different owners, pick the first deterministically (sorted
   by control ID) and note the ambiguity on the item; (c) otherwise the
   item goes to the **Unassigned — needs owner** bucket. The API has no
   test-to-controls lookup, so rung (b) needs a reverse index built by
   walking the control listing and reading each control's tests — one
   request per control. Build it only when there are ownerless tests to
   resolve, pace it against the rate limit, and if the control count makes
   it impractical, say so and route the ownerless tests straight to
   Unassigned rather than guessing. Record which rung resolved each item
   (`test owner`, `control owner`, `unassigned`).

4. **Compute the deadline.** If the test's remediation block carries a
   soonest remediate-by date, use it, labeled `(Vanta due date)`. Otherwise
   add `defaultWindow` to the test's most recent status-flip date, labeled
   `(default — override as needed)` — that flip date is the most recent
   transition, not necessarily the first failure, so never present it as
   "failing since." If the flip date is also unavailable, write `No
   deadline set — assign one` rather than inventing an anchor. A computed date in the past
   is shown as overdue, never silently advanced.

5. **Write the fix instructions.** For each item, draft what/how/by-when
   following the style rules below, grounded in the test's own remediation
   and failure descriptions and scoped to the failing resources found in
   step 2.

6. **Group and order.** Group items by owner; within each owner, order by
   deadline (soonest first), then by the count of items needing remediation
   (largest first), then test name. The Unassigned bucket comes last.

7. **Validate, then output.** Confirm: total failing fetched = items
   assigned + unassigned; report deactivated and resources-unavailable
   counts alongside rather than subtracting them. If the
   counts do not reconcile, state the discrepancy in the summary instead of
   silently dropping records. Then apply the output format.

## Fix-instruction style (summary)

Full standard with known pitfalls: `references/how-to-fix-style.md`. Read it
before drafting. The load-bearing rules:

- One brief sentence describing the failure scenario, then numbered steps —
  each a single concrete action naming actual console paths, button labels,
  or CLI commands. Maximum 12 steps; root-cause variants split into labeled
  groups with their own steps.
- **Bold** for UI labels, `code` for resource names, field values, and CLI
  commands; placeholders like `<bucket-name>`, never wildcards or
  account-wide flags.
- If the fix depends on another test or configuration passing first, state
  that dependency at the top.
- No post-fix verification steps.
- Never recommend broad managed policies; always the scoped permissions
  actually required, with exact, case-correct permission names.
- When a console label, permission name, or field name cannot be confirmed,
  write "Unknown — requires validation" — never guess.
- Instructions address only what the test actually evaluates; do not tell an
  engineer to fix behavior the test does not check.

## Output format

**All-clear gate.** If the in-scope failing count is 0, output only:
"✅ All clear. No failing tests in scope. Tests evaluated: [N];
deactivated: [D]." Skip everything else.

Otherwise produce, in order:

### 1. Summary

- Failing tests in scope, owners affected, unassigned items
- Overdue items (deadline in the past) and items due within 7 days
- Deactivated and resources-unavailable counts and any
  indefinite-exemption or reconciliation flags

### 2. Per-owner sections (the digest)

One section per owner, written as a ready-to-send message: no greeting, but
self-contained enough to paste into a ticket, email, or Slack thread
unedited. Per section:

```markdown
### 📩 [Owner Name] — [N] item(s), earliest deadline [date]

**1. [Test name]** (`[test ID]`)
- **What's failing:** [Plain-language description naming the actual failing
  resource(s), e.g., `analytics-exports` and `billing-archive` buckets]
- **Items to remediate:** [N] · **Fix by:** [date] ([Vanta due date |
  default — override as needed | No deadline set — assign one])
- **How to fix:**
  1. [Concrete step per the style rules]
  2. ...
- [Owner note, only when applicable: "Assigned via control owner of
  [control] — reassign if wrong" or ambiguity note from step 3]

*No manual verification needed — Vanta re-checks these tests automatically
and they will move to passing once the fix is in place.*
```

Each owner section (and each handoff file) ends with that closing line,
once per section — never per item, and never expanded into verification
steps.

The **Unassigned — needs owner** section uses the same item shape, addressed
to the compliance owner with the single ask: assign an owner for each item.

**Section volume rule** (per owner section): 10 or fewer items — enumerate
in full; more than 10 — show the 5 most urgent inline and state "Remaining
[N] items in the handoff file."

### 3. Handoff files

One markdown file per owner (plus one for the Unassigned bucket),
containing that owner's full section with every item enumerated. Filename:
`[yyyymmdd]_remediation_[owner-name-kebab].md` (UTC date; kebab-case the
owner name the same way). Write them to the working directory (or a path
the user names) and confirm they were created before ending; if a file
cannot be written, say so plainly — never output a placeholder path.

## Guardrails

- No customer data or credentials in skill examples; runtime output names
  only the resources Vanta returned.
- Read-only: this skill never marks a test remediated, never deactivates or
  reactivates a test or entity, never edits owners, and never sends
  messages — it drafts instructions for a human to send.
- Every defaulted or derived value is labeled as such; every unresolved
  owner is surfaced as Unassigned, never guessed.
- Fix steps are grounded in the test's own remediation guidance plus
  the bundled style standard; anything unconfirmed is written as "Unknown —
  requires validation," never invented.
