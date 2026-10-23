# ROOT4648 handback

Ready for Root's independent receiving. The offline `rollout --models-metadata`
input reconciles supplied Models fields with exact migration provider/from facts
and passes only supported schedule dates to the existing recovery planner.
Measured rollout judgment and no-flag behavior are preserved. Only admitted
branch `codex/root4648-mendr-provider-retirement-metadata-20261023` on `https://github.com/epistemedeus/mendr.git` is exported.
Root owns adoption, integration, PR and any later release.

Base: `6e2a0c8cab5bb94817173fff43dbf67a1f834c61`. Tested product/test HEAD:
`3fae0d61de2ed5bbc14468dde491a3c2a1203a22`; tree `86f455456edd4656424a86dba0ebf6a29435087e`.
The final qualification-only export HEAD/tree are returned in the native final
response. [Source manifest](outputs/SOURCE-MANIFEST.json) records exact byte/Git
hashes and unchanged-base receiving. Product commits are 3a4ca315 (implementation),
4f587503 (strict original-byte provenance), and 3fae0d61 (fact/grade separation).

[CONTRACT.md](CONTRACT.md) freezes the versioned envelope, explicit list/retrieve
scope, endpoint, retrieval timestamp and raw body. Caller-supplied bytes, URLs
and timestamps are unauthenticated. **Date, null, omitted and missing-model facts
remain distinct even when stale/conflicted.** Reconciliation/effective schedule
eligibility is separate. Exact matching only; fine-tunes and partner/proxy scope
are unsupported. A migration does not record its serving endpoint, so direct
scope remains a caller declaration. Capture age is independently bounded to 24
hours inclusive, with no future tolerance. The existing evaluation pin/UTC rule
is used only on the opt-in path. Raw digests do not change EvidenceRef semantics.

Useful consumer results: matching dates corroborate; a fresh date supplies bounded
schedule advice to an undated artifact. Null against a dated artifact conflicts.
Omission/missing rows leave a valid date explicitly artifact-only. Stale, future,
malformed, conflicting and unsupported evidence withhold target schedule input.
Unrelated swaps retain their original evidence. Dates, including past dates,
never establish observed shutdown or availability. No replacement, registry age,
lifecycle, verification switch or write authority is promoted. `--record` keeps
its existing outcome schema; save JSON to retain the reconciliation.

Final Node 22.23.4/locked verification is serial and offline:

- **2337 tests/130 files**, zero failures/skips, on final source.
- **107 focused tests** and **118 related existing tests** pass.
- Final build, six negative no-network controls and real built-consumer replay pass.
- Four exact-base built controls (JSON/human, with/without migration) preserve
  raw stdout, stderr and exits byte-for-byte, including default clock behavior.
- Missing outcomes/costs remain unmeasured; actual measured failure exits 1,
  explicit success/zero recovers, insufficient evidence exits 3. Metadata unknown
  or conflict can coexist with a measured healthy rollout (exit 0); invalid
  opt-in inputs exit 2. Metadata never manufactures measured signals.
- Every base file outside the allowed README/CLI edits is byte-preserved:
  **1054 files**, including all **253 original qualification files**.

[Consumer cases](outputs/consumer-cases.json) receive exact-base flag refusal,
old undated versus supplied schedule advice, adverse cases and deterministic
current-capture recovery. [Corroborated](outputs/example-corroborated.json) and
[supplied schedule](outputs/example-supplied-schedule.json) are full synthetic
CLI outputs. [Recipe](RECIPE.md), [commands](outputs/COMMANDS.json) and
[self-review](SELF-REVIEW.md) retain exact commands, sources and first failures.
Initial harness timeouts, long Unix socket path, direct-Vitest PATH failure,
and both real reporting/provenance red cases remain recorded. Targeted red runs
intentionally skipped 31 and 99 unselected cases; final full/focused runs skip none.
No required positive count was invented.

Total reserve remains 2,097,152 KiB, zero model children. Highest sampled whole-task
RSS is **1,468,656 KiB**, with 100ms samples and a guard below the reserve; no reserve
stop/OOM or extra reserve was needed. Final commands include the same-task launch,
runner, native/supervisor and command descendants. This is sampled RSS, not a
kernel peak. Only zero-RSS command zombies may remain in receipts; no live test
worker is retained. Dependencies were acquired once via the unchanged lock;
receiving uses an isolated short temporary HOME, credential-free allowlist and
the existing Node no-network preload. It is not an OS network sandbox.

Actual manifest checkpoint: 14:01:50.356 UTC; required horizon: 14:16:50.356 UTC,
2026-10-23. The native final response supplies the actual export identity. No live Models/provider API or
provider key/account action, installation, public PR/comment/release, deployment,
upstream adoption, outside customer, billing or revenue is established. Official
field documentation was checked, not an account response:
https://developers.openai.com/api/docs/deprecations#overview
