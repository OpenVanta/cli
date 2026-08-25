# How-to-fix writing standard

The full standard for the fix instructions this skill hands to engineers.
Every rule here has caught a real error in customer-facing fix instructions.

## Structure

- Open with one brief sentence describing the failure scenario being
  addressed, so the engineer knows which state they are remediating.
- Then a numbered step-by-step list. Each step is a **single, concrete
  action** referencing actual console paths, button labels, or CLI
  commands — never "configure logging appropriately."
- Maximum 12 steps. If the fix differs by root cause (e.g., missing
  permissions vs. feature never enabled), separate into clearly labeled
  groups, each with its own numbered steps.
- If the fix depends on another test or configuration passing first (e.g.,
  logging must be enabled before log freshness can pass), state that
  dependency clearly at the top of the instructions.
- Do not include post-fix verification steps — Vanta's test re-run is the
  verification.

## Formatting

- **Bold** for UI labels (menu names, button labels, page titles).
- `Code formatting` for resource names, field values, permission names, and
  CLI commands.
- Placeholders in angle brackets for the engineer's own values:
  `<bucket-name>`, `<project-id>` — never wildcards or account-wide flags.
- Hyperlink console destinations when the URL is stable and official.

## Accuracy rules (each has burned someone)

- **Scope to what the test evaluates.** Instructions fix exactly the
  property the test checks — nothing broader. If the test checks only that
  `LoggingEnabled` is true, do not instruct the engineer to also configure
  delivery, retention, or alerting.
- **Never recommend broad managed policies.** No `AmazonS3FullAccess`,
  `AdministratorAccess`, or similar. Always the scoped permissions actually
  required (e.g., a bucket policy granting `s3:PutObject` and
  `s3:GetBucketAcl` to the logging service principal).
- **Resource-based policy vs. IAM role.** Permissions for log delivery to
  destinations like S3 buckets and CloudWatch log groups are typically
  controlled by resource-based policies on the **destination** (bucket
  policy, log group resource policy) — not IAM roles attached to the source
  service. Redshift and OpenSearch follow this pattern. Do not direct an
  engineer to create or attach an IAM role for this unless provider
  documentation explicitly requires it.
- **Exact permission names.** Permission/action names must be exact and
  case-correct (`s3:PutObject`, `logs:CreateLogStream`). If unsure, write
  "Unknown — requires validation."
- **Button labels must exist.** Some consoles show **Set up** on first
  configuration and **Edit** thereafter — a standalone **Enable** button may
  not exist. If the current label cannot be confirmed, write "Unknown —
  requires validation against the current console UI."
- **CLI commands must run.** Any included command must be syntactically
  correct and scoped to the specific resource.
- **No copy-paste drift.** Every service name, resource type, and threshold
  in the instructions must match *this* test — not the sibling test the
  wording came from.
- **Name the failing resources.** Instructions reference the actual
  resources the test flagged, as returned by the failing-entity listing, so
  the engineer never has to work out which bucket, repo, or account is meant.

## Worked example (synthetic)

Failing test: *S3 bucket access logging enabled* at the fictional company
Acme Corp; failing resources `analytics-exports` and `billing-archive`.

> Server access logging is disabled on the buckets listed below, so requests
> against them are not being recorded.
>
> 1. Open the [S3 console](https://console.aws.amazon.com/s3/) and select
>    the bucket `analytics-exports`.
> 2. Open the **Properties** tab and scroll to **Server access logging**.
> 3. Select **Edit**, then choose **Enable**.
> 4. Under **Target bucket**, enter your logging bucket (e.g.,
>    `<logging-bucket-name>`), using a prefix such as
>    `logs/analytics-exports/`.
> 5. Select **Save changes**.
> 6. Repeat steps 1–5 for `billing-archive`.
>
> **If saving fails with a permissions error:** the target bucket's policy
> must allow the S3 logging service principal `logging.s3.amazonaws.com` the
> `s3:PutObject` action on the log prefix. Add a scoped statement to the
> target bucket policy — do not attach a broad managed policy.

Why this example passes the standard: single concrete actions; real console
path and current UI labels; scoped bucket-policy fix in a labeled root-cause
group rather than a broad policy; placeholders for the engineer's values;
actual failing resource names; no post-fix verification step; scoped
strictly to the property the test checks (logging enabled — not delivery
freshness).
