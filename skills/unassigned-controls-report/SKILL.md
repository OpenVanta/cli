---
name: unassigned-controls-report
version: 1.0.0
description: >
  Identify controls with no owner and recommend a new active owner for each
  from domain-level ownership patterns, delivering a flagged CSV of
  recommendations. Use when a user asks who should own an unowned control,
  wants orphaned or ownerless controls found, asks for an ownership gap scan
  or audit, or names someone who has left and asks what they were on the
  hook for or to clean it up — including when they never say "orphaned",
  "control", or "owner". This skill only recommends: it never edits
  ownership itself, so "clean up" and "fix" phrasings belong here rather
  than being excluded as edits. Do NOT use for writing controls or mapping
  controls to frameworks.
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["vanta"]
---

# Control Owner Reassignment

## What this skill does

Finds every control that currently has no owner and proposes exactly one active
person to take each one, inferred from who already owns the neighboring controls
in the same domain. The failure mode this exists to fix is stale ownership — a
control whose listed owner left the company months ago — so a recommendation
that lands on an inactive user recreates the exact problem it was run to solve.
Done means a GRC lead can accept the high-confidence rows without checking them,
and knows precisely which rows they still have to look at and why.

## Inputs

- **Framework scope** (optional) — restrict the scan to controls mapped to one
  or more frameworks. Default: the whole control library.
- **Recipient** (optional) — who receives the report. Default: the requesting
  user, in the conversation.

## Data access

Requires the `vanta` CLI on `$PATH` and a completed `vanta login`. See the
`vanta` skill for auth and global flags.

| Need | Command |
|---|---|
| The org's controls, each with its owner and domains | `vanta controls list --page-size 100` |
| Controls for one framework only | `vanta controls list --framework-matches-any <frameworkId> --page-size 100` |
| Framework IDs, when the user scoped by name | `vanta frameworks list --page-size 100` |
| Vanta users, each with an active flag — the active-user gate | `vanta users list --page-size 100` |
| Personnel roster, to corroborate employment status | `vanta people list --page-size 100` |

Ownership counts and active status must come from the same run — a roster
pulled at a different time than the control list will silently reintroduce
stale owners. Match owners to users on email address, not on id — control
owner ids and person ids are drawn from different namespaces and will not
reliably join. If neither the user listing nor the personnel roster can be
retrieved, the active-user gate cannot run and the scan should not be
delivered; say so rather than shipping unverified recommendations.

Pagination: pass `--page-size 100` and follow `nextCursor` into
`--page-cursor` until `pageInfo.hasNextPage` is false. The API allows 50
requests per minute — pace the paging loop.

Read-only: never run the command that sets a control owner. This skill
produces recommendations for a human to apply.

## Steps

1. **Run the availability preflight.** Inspect the data and record which signals
   are real before recommending anything. Every fallback taken here becomes a
   disclosure later, so record it now rather than reconstructing it at the end.

   | Signal | Ideal field | Fallback if absent |
   |---|---|---|
   | Orphaned state | `owner` null | — (a null owner is the only orphan signal the API exposes) |
   | Active user | the user record's active flag, joined on email | employment status on the personnel roster (`CURRENT` or `ON_LEAVE` = active) |
   | Domain | canonical `domains` list | infer from control name + description |

2. **Filter to orphaned controls.** Use the strongest signal available from the
   preflight. A control with one or more active owners is out of scope. A
   control whose only owner is inactive is effectively orphaned and belongs in
   scope — that stale owner is never a candidate for anything downstream.

3. **Determine each control's domain.** Canonical where the `domains` list is
   populated — a control may carry more than one, and it belongs to each of
   them for candidate-pool purposes; otherwise infer from name and description by matching to the closest standard
   category (Access Control, Change Management, Risk Assessment, and so on). An
   inferred domain caps the row's confidence at `low` no matter how clean the
   ownership counts look beneath it, because the counts are only as good as the
   bucket they were drawn from.

4. **Build and filter the candidate pool.** Take the owners of other controls in
   that domain, then drop every candidate who is not currently active —
   terminated, deactivated, offboarded, or otherwise removed. Filter before
   counting, not after: an offboarded person is often the *most* common owner in
   a domain, which is precisely why the domain has orphans in it.

5. **Pick one owner.** Recommend the active candidate owning the most controls
   in the domain. Every recommended owner must also own at least one
   non-orphaned control, which keeps the work landing on people already doing
   it. On a tie, break on total controls owned across all domains, flag `low`,
   and name the tie in the reason. Where no active candidate remains, set
   `unresolved` and `low` rather than inventing one — a blank cell or a
   fabricated name both cost more review time than an honest `unresolved`.

6. **Flag confidence honestly.** Mark `low` for anything below roughly 80%
   certainty: inferred domains, ties, and unresolved rows. Low-confidence rows
   stay in the deliverable, flagged. Dropping them makes the report look cleaner
   than the underlying data is.

7. **Validate before returning.** Row count equals the orphaned count in the
   source. No control with an active owner appears. Every row has exactly one
   `Recommended Owner` or an explicit `unresolved`, with no blanks. Every
   recommended owner is a real person in the current personnel data *and* passes
   the active-user gate — check this last, against the roster, on every row,
   including rows that felt obvious. Every inferred domain is disclosed in
   `Reason` and flagged `low`.

## Output format

Deliver a CSV, one row per orphaned control, with these columns in order:

`Control ID`, `Control Name`, `Control Description`, `Domain`,
`Current Owner`, `Recommended Owner`, `Reason`, `Confidence`

Write it to the working directory (or a path the user names) and report that
path. Sort by `Control ID` ascending, using the control's external ID where it
has one and its Vanta ID otherwise. `Current Owner` is blank for an orphaned
control. `Reason` is one sentence and states whether the domain was inferred:

```
Most common active owner in canonical Access Control domain (owns 7 of 12).
Most common active owner in inferred Access Control domain; domain inferred from name and description.
Tie between two active owners in Change Management; broken on total controls owned.
No active owners remain in Vendor Management; prior owner was offboarded.
```

Alongside the file, summarize only what the recipient needs to act on: the total
orphaned count, how many rows are `low` and need human review, and the data
limitations of the run — which orphaned signal was used and whether domains were
inferred. Keep it under roughly 100 words and point to control IDs rather than
restating rows; the file is the deliverable. The recipient should finish the
summary knowing which signals were real and which were inferred.

## Guardrails

- Never recommend a user who is not active as of this run, even where they still
  appear as owner on existing controls. Stale ownership records are the input to
  this scan, never its output.
- Never invent an owner to avoid an empty cell; `unresolved` with a stated
  reason is the correct answer when no active candidate exists.
- Never silently drop or downgrade a low-confidence row to make the report read
  more cleanly.
- Do not deliver a scan where the active-user data was unavailable or stale —
  the active-user gate is the whole value of the run, and an unverified report
  reassigns controls to people who have left.
