---
name: personnel-report
version: 1.0.0
description: "Produce a prioritized digest and audit CSV of every Vanta personnel task (policy acceptance, security training, background check, device monitoring, custom tasks) that is overdue or due within a horizon. Use when asked for the personnel report, personnel task digest, or overdue personnel items."
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["vanta"]
---

# Daily Personnel Report - Prioritized

## Arguments

**`HORIZON`** — scope window in calendar days. Default **10** unless the invocation specifies another value. All scope rules, labels, and checks derive from it.

## Objective

Your data source is the personnel roster in Vanta. Produce a prioritized digest and audit CSV of every personnel task that is overdue or due within `HORIZON` calendar days, most urgent first.

## Data access

Requires the `vanta` CLI on `$PATH` and a completed `vanta login`. See the `vanta` skill for auth and global flags.

| Need | Command |
|---|---|
| Full roster, each record carrying its task summary | `vanta people list --page-size 100` |
| A single person, if a record needs re-reading | `vanta people get --id <personId>` |

The roster listing returns each person's complete task summary inline — every task's own `status`, `dueDate`, `completionDate`, and `disabled` block. **One full pass over the roster is all the data this report needs**; never fetch per-person records to fill in task detail.

Pagination: pass `--page-size 100` and follow `nextCursor` into `--page-cursor` until `pageInfo.hasNextPage` is false. The API allows 50 requests per minute — pace the paging loop. Add `--agent-mode` for compact output on large rosters.

Read-only: this report never writes to Vanta. Do not call any command that offboards, updates, or sets leave.

## Process

### Run Contract (obey first)
- RESET: Start empty every run. Count only THIS run's records. NEVER carry rows or counts forward.
- GROUND: Use only values Vanta returns. NEVER infer that a task is overdue.
- A row is Overdue ONLY IF `Days to Due` is a negative integer from a non-null `dueDate`.

### Run in order.

1. **Pull the roster.** Page to the end and capture every record with its task summary. Record the total count of ALL records evaluated before any exclusions. There is no server-side employment-status filter, so apply the scoping yourself: from each record's employment status, retain only `CURRENT` and `ON_LEAVE`. Exclude and count everyone else — `UPCOMING` (not yet started), `FORMER` (departed), `INACTIVE` (deactivated) — along with service accounts. Default to exclude: any employment status you cannot confidently read as current or on-leave is excluded and recorded as an integrity exception. Never assume in-scope.

2. **Filter to candidates.** Keep only in-scope people whose overall task-summary status is `OVERDUE` or `DUE_SOON`. Record the count of in-scope people whose overall status is `COMPLETE`, and the count whose status is `PAUSED` or `NONE`. If there are no in-scope people with `OVERDUE` or `DUE_SOON`, skip steps 3 and 4 and proceed to Step 5.

3. **Score the candidate set.** Process each task in a candidate's summary as its own isolated pass — policy acceptance, security training, background check, device monitoring, and custom tasks. Skip any task carrying a `disabled` block; count those as "disabled tasks skipped." Offboarding custom tasks are out of scope by definition (they belong to departing people, who are already excluded) — ignore them without counting.

   Compute `Days to Due` from each task's own `dueDate` (UTC calendar date). Select rows where `Days to Due` is less than 0, or 0 through `HORIZON`. Exclude and count null-date tasks that do not signal past-due. Classify null-date tasks that do signal past-due as Exception rows. For null-date tasks only, apply the Status Derivation Rule: use the task's own status field solely to detect a past-due signal and classify the row as Exception - never as Overdue or Coming Due.

**Execute all remaining steps using only the data retrieved above.**

4. **Gravity sort.** Group all of a person's rows together, anchored to their single worst item: 1. Sort by Status: Overdue -> Coming Due -> Exception, 2. sort by ascending `Days to Due` (most overdue first), 3. Tiebreak: name A-Z, then person ID
5. **Validate** per Validation Steps.
6. **Output** per Output Format (All-Clear gate first, then digest + CSV if in scope). If the All-Clear Gate did not execute, confirm the CSV file was written to disk and state its path before ending. If it cannot be written, state this explicitly; do not output a placeholder path.

## Definitions

**`Status Derivation Rule`** - Derive overdue/upcoming status from `dueDate` whenever it is non-null. When `dueDate` is null, classify the row as Exception only if the task's own status is `OVERDUE` - never as Overdue or Coming Due. This is the only permitted use of the status field for status determination. Never infer a specific `Days to Due` value from a null-date task.

**`Days to Due`** - `dueDate` minus today, UTC calendar dates only (drop time), whole days. Negative = overdue, 0 = due today, positive = remaining. Example (illustrative only, HORIZON=10, today 2026-06-26): 06-25 -> -1 Overdue; 06-26 -> 0 Coming Due; 07-10 -> +14 out of scope; null -> excluded.

**Scope** - `Days to Due` less than 0 (Overdue) or 0 through `HORIZON` inclusive (Coming Due). Greater than `HORIZON` is out of scope. Null-date tasks with no past-due signal are excluded and counted as "incomplete without a due date."

**Null-date** - A null `dueDate` is NEVER Overdue or Coming Due. When the task's own status signals past-due, classify as Exception per the Status Derivation Rule. Otherwise EXCLUDE and count as "incomplete without a due date." NEVER assign `Days to Due` to a null-date task.

**In-scope personnel** - Current personnel, and any personnel on leave (on-leave items route to Exception). Upcoming, former, inactive, and service accounts are out of scope. Unclassifiable personnel states are excluded and flagged, never assumed in-scope.

**Personnel tasks** - Read each task's own `dueDate` and `status` from the person's task summary: policy acceptance, security training, background check, device monitoring, and custom tasks. Only these produce rows. Offboarding custom tasks are out of scope. Any other task type returned by Vanta is logged as a SYSTEM integrity flag and ignored. Use the person's overall task-summary status as a cross-check only.

**Status (per row):**
- **Overdue** - `Days to Due` less than 0
- **Coming Due** - `Days to Due` 0 through `HORIZON` inclusive
- **Exception** - status conflict on a real task, or a person flagged overdue with no enumerable task. Use SYSTEM in the Employee column if not tied to a person. For validation-generated Exception rows, use the person's name and ID if the failure is traceable to a specific record; use SYSTEM with a brief description if the failure is structural or not attributable to a single record.

**No fabrication** - report only what Vanta returns. Use Unknown + integrity flag rather than inventing a value.

## Output Format

### All-Clear Gate
After running all process steps, compute the total output rows (Overdue, Coming Due, and Exception).

**If the output count equals 0**, output only the line below and stop. Do not produce a digest or CSV.

> ✅ **All clear.** 0 of [A] in-scope personnel have items overdue or due within `HORIZON` calendar days. Records evaluated: [N]. Out-of-scope personnel and service accounts excluded: [E]. COMPLETE records: [C]. Integrity flags: duplicate emails [x], duplicate person IDs [x], employment-status conflicts [x], current with end date populated [x].

### CSV
Filename: `[timestamp]_Personnel_Tasks_Report.csv` - timestamp is UTC `yyyymmdd`, e.g., `20260623_Personnel_Tasks_Report.csv`. Write it to the working directory (or a path the user names) and report that path.

One row per in-scope item. Columns:

| # | Column | Description |
|---|--------|-------------|
| 1 | Employee | Name only (or SYSTEM) |
| 2 | Action Required | Plain imperative, e.g., "Complete the policy acceptance." |
| 3 | Task & Detail | E.g., "Policy Acceptance," "Background Check" |
| 4 | Status | Overdue, Coming Due, or Exception |
| 5 | Days to Due | Signed integer, or blank for null-date items |
| 6 | Email | Employee email |
| 7 | Person ID | Vanta person ID |

<example>

```csv
Employee,Action Required,Task & Detail,Status,Days to Due,Email,Person ID
Tommy Tutone,Complete the policy acceptance,Policy Acceptance,Overdue,-94,tommy.tutone@company.com,8675e098e69c0d5d0442ca13
Michael Jones,Complete the policy acceptance,Policy Acceptance,Overdue,-55,michael.jones@company.com,28133080049c0d5d0442ca13
Michael Jones,Complete security training,Security Training,Coming Due,8,michael.jones@company.com,28133080049c0d5d0442ca13
```

</example>

### Digest
Three fixed sections in order: **OVERDUE**, **COMING DUE**, **EXCEPTION**.

Place each person in the section of their worst item; never split a person's rows across sections. Open with a stateless count line: `N items across M personnel: X overdue, Y coming due, Z exception.` (X, Y, Z are row counts by each row's own status, not by the section the person is grouped into. Section item counts will therefore not sum to X, Y, Z; do not adjust either to reconcile them.)

Per item show: Task & Detail | Status | Days to Due | Action Required.

**Section volume rule** (applied independently per section; an item is a row rendered in that section, including a grouped person's off-status rows):
- 0 items - print one inline line, e.g., `0 items.`
- 20 or fewer items - enumerate in full
- More than 20 items - print one summary line, e.g., `21 items across 15 personnel. See the CSV for the full list.`

After all three sections, write the CSV as defined above and state its path. If it cannot be written, say so plainly here. Do not write the CSV if the All-Clear gate fired.

Then end with a closing block titled Audit Summary on its own line, followed by one figure per line in this exact order:
- records evaluated
- current/on-leave personnel in scope
- former, upcoming, inactive personnel and service accounts excluded
- COMPLETE records
- PAUSED or NONE records
- candidates (roster-level OVERDUE plus DUE_SOON)
- candidates reclassified out of scope after due-date computation [candidates - Overdue rows - Coming Due rows - Exception rows - incomplete without a due date]
- incomplete without a due date
- disabled tasks skipped
- integrity-flag counts (duplicate emails, duplicate person IDs, employment-status conflicts, current personnel with an end date populated)

## Validation Steps

Run before finalizing output. These are logical checks on already-collected data. Record any failure as an Exception row (Status = Exception).

- **Coverage** - every in-scope task has exactly one row; none missing or duplicated. Confirm the roster was paged to the end and no further pages remained.
- **Horizon** - no Overdue or Coming Due row has `Days to Due` greater than `HORIZON`.
- **No null-date padding** - null-date tasks are excluded and counted, never listed as Coming Due.
- **COMPLETE anchor** - Confirm: COMPLETE + PAUSED/NONE + candidates = total in-scope personnel [A]. If not, flag as a SYSTEM Exception and stop.
- **Overdue ceiling** - Count distinct personnel in the OVERDUE section. This MUST be less than or equal to the Step 2 candidate count (OVERDUE + DUE_SOON combined). A DUE_SOON record at the roster level may legitimately reclassify to OVERDUE after per-task due-date computation; this is expected and is not a failure. If it exceeds that count, do NOT output. For each Overdue person, name the specific past `dueDate` that justifies them. Remove any person you cannot tie to a past, non-null `dueDate`. Re-count and only then proceed.
- **Gravity integrity** - a person's rows are contiguous under their worst item; no person splits across sections.
- **Integrity flags** - report counts only in the closing summary (not as task rows): duplicate emails, duplicate person IDs, employment-status conflicts, current personnel with an end date populated.
- **CSV written** - If the All-Clear Gate did not execute, confirm the CSV was created and is readable before ending. If it cannot be delivered, state this explicitly; do not output a placeholder path.

## Guardrails

- Never include personnel data in examples committed anywhere; runtime output names only what Vanta returned.
- Read-only. This report never offboards, updates, or sets leave on a person.
