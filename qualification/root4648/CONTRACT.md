# Frozen offline capture contract (v1)

Frozen before implementation, 2026-10-23. Caller supplies a UTF-8 JSON file,
maximum 1,048,576 bytes, with exactly these envelope keys:

```json
{
  "schema": "mendr-models-metadata/v1",
  "provider": "openai",
  "surface": "direct",
  "sourceUrl": "https://api.openai.com/v1/models",
  "retrievedAt": "2026-10-23T12:00:00Z",
  "scope": { "kind": "list", "coverage": "complete" },
  "response": {
    "status": 200,
    "body": {
      "object": "list",
      "data": [{ "object": "model", "id": "synthetic-source", "shutdown_date": "2026-10-24" }]
    }
  }
}
```

Retrieve uses `scope: {"kind":"retrieve","model":"synthetic-source"}`,
`sourceUrl: "https://api.openai.com/v1/models/synthetic-source"`, and the
single raw model object as body. The locator must exactly match the declared
operation/model, with no credentials, query, fragment or alternative host.
Response status is an integer HTTP status. Non-200 responses carry status only,
no error body. No headers, credentials or prompts belong in this input.
Provider/surface strings are retained as unsupported scope when not exactly
`openai` / `direct`; they never acquire authority through an official URL.

List coverage is caller-declared `complete` or `partial`, referring only to that
capture's account/visibility scope, never all models globally. Partial captures,
pagination/truncation indicators, malformed rows and excessive records (maximum
2,048) are unusable. Ordinary additional Models body fields are ignored and never
printed. All rows are checked before using any; duplicate IDs with differing
shutdown values conflict. Identical duplicate rows are counted and reported.
JSON duplicate object keys are refused rather than accepting parser last-wins.

Only exact IDs bind to migration provider/from. No ID trimming, case folding,
alias/snapshot/base-model resolution. Fine-tune IDs (`ft:`/`ft-`, colon IDs) are
unsupported. Exact snapshots may bind only to themselves. Direct OpenAI schedule
scope is declared by the caller, not observed on a workload. A migration does
not record its serving endpoint; this intake cannot establish one. Non-OpenAI
artifact document URLs are ambiguous for this direct schedule reconciliation.
Unrelated swaps retain their own artifact schedules.

Semantics frozen before code:

| Supplied fact | Reconciliation and recovery schedule input |
| --- | --- |
| Fresh exact date, same artifact date | corroborated, date retained |
| Fresh exact date, undated artifact | metadata schedule, date supplied |
| Date differs / null against artifact date | conflict, target date withheld |
| Null without artifact date | no announced date at capture, no revert assurance |
| Absent field | not reported; valid artifact date remains explicitly artifact-only |
| Missing model | missing in capture scope; valid artifact date remains artifact-only |
| Retrieve wrong model or HTTP error | unknown, target date withheld |
| Stale/future/partial/malformed/unbound | unknown/conflict, target date withheld |

A list missing an unrelated model does not invalidate its original artifact
schedule. No missing/null fact establishes availability or a safe revert.
Invalid artifact schedules and conflicting artifact dates for the same exact
provider/from are unknown/conflicted; no convenient date is selected.

Capture age is an independent fixed maximum of **24 hours**, inclusive, with
zero tolerance for future timestamps. Evaluate once using existing
`resolveEvaluationTime` (`MENDR_EVALUATED_AT`) only on the opt-in path; date pins
mean UTC midnight, offset timestamps normalize to UTC. Retrieval requires an
explicit RFC3339 timestamp with seconds and timezone and a real calendar date.
Retirement dates are real Gregorian `YYYY-MM-DD` dates. Before/on/after retirement
uses the existing recoveryPlan UTC-day rule, never observed shutdown.

Report schema `mendr-model-retirement/v1`: caller-supplied/unverified capture
provenance (raw-file SHA-256, endpoint, retrieval, independent age/grade), migration
artifact digest/generatedAt/unchanged registry facts, and per-swap artifact and
metadata facts, reason codes, reconciliation and effective schedule source.
Digests bind supplied bytes, not authenticity; they are separate from normalized
EvidenceRef document hashes. No registry freshness is recomputed or promoted.
Existing recoveryPlan owns advice; judgeRollout owns measured verdict and exits
0/1/3. Invalid file/envelope/clock is a sanitized configuration error, exit 2.
Metadata unknown/conflict never invents a measured regression. Human output
shows the same reconciliation and provenance caveat. No-flag output is unchanged.

Source contract: official OpenAI deprecations overview, searched and fetched
2026-10-23 via official documentation, explicitly describes optional shutdown_date
on both List and Retrieve as date or null. This is documentation, not an account
response: https://developers.openai.com/api/docs/deprecations#overview
