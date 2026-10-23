# Self-review

One native source owner, zero model children. New branch from accepted
6e2a0c8cab5bb94817173fff43dbf67a1f834c61; not a repackaging of ROOT4551/4626.
Staged Pilot role files/assignment at 658a37002f59df0b449b4f0c7d07842875350a48
and the actual SPEC/RUN/admission were read. The actual manifest preserves this
writer and admits the rollout-only CLI change. Frozen STATE distinguishes the
existing same-context mendr packaging owner from this independent metadata task.
Only the rollout imports/options/action are amended in the existing CLI. No
other product paths, registry/authority fields or original qualification change.

The frozen contract predates implementation. Official deprecations overview was
searched and opened independently; both List and Retrieve support the optional
field according to that documentation. All supplied responses here are synthetic.
No account, endpoint accessibility or authenticated capture is inferred.

Reviewed boundaries:

- Exact provider, direct surface, locator, operation and model binding. No
  trimming, case folding, registry lookup, ID substring or base-model inference.
  Fine-tunes are explicitly unsupported. Exact snapshots can bind to themselves.
- Migration schema has provider/from, but no serving-endpoint field. Caller
  declaration of direct OpenAI scope is unverified. The report exposes this
  limitation and blocks non-OpenAI artifact document sources from direct-scope
  reconciliation. It cannot prove how the workload was routed.
- All list rows are checked, including unrelated malformed/conflicting rows.
  Partial/truncated captures and HTTP failures cannot provide schedule assurance.
  Duplicate JSON keys are rejected instead of parser last-wins; identical model
  rows are visible duplicates, differing values conflict.
- Independent 24-hour inclusive age limit; any future retrieval is unknown.
  One shared evaluation instant on the opt-in path. Retrieval timestamps require
  real calendar fields and explicit timezone. Dates remain schedules before/on/
  after the UTC day; accessibility and workload behavior remain unobserved.
- Both artifact/metadata facts, raw-byte digests, capture scope and retrieval
  facts survive reconciliation. Raw response extras, error bodies, keys and
  headers never enter diagnostics. Invalid JSON errors use fixed reason codes.
  Raw file digests never use or alter normalized EvidenceRef document semantics.
- RecoverySwap projections feed the existing recoveryPlan. Unknown/conflicting
  target dates are withheld there, while original facts stay in the report.
  Unrelated swaps retain artifact-only schedules. No replacement, verification,
  lifecycle, registry freshness or write gate is changed. judgeRollout still
  owns measured signals, verdict and 0/1/3 exits; input refusal is exit 2.
- The new flag has no write operation. Existing --record semantics remain the
  original outcome record (artifact schedules, measured rollout), not a metadata
  history or rewritten artifact. Save JSON output to retain reconciliation.
- Default path remains unchanged, including ignoring MENDR_EVALUATED_AT. Four
  actual built base/candidate stdout+stderr+exit parity controls are byte equal.

First failures retained, not rewritten:

1. `focused-built-cli`: 27 pass, two grouped scenarios exceed Vitest's default
   five-second timeout. No product assertion failed. Bounded explicit timeouts
   and a 20-second child-command timeout fix the receiving harness. Recovery:
   all 29 pass, then final 98 unit/built-consumer cases pass after added cases.
2. `related-safety`: 113 pass, five existing `tsx` CLI-evidence cases fail to
   launch. `diagnose-cli-evidence` retains Linux EADDRINUSE on the overlong Unix
   socket pathname under qualification/.scratch. New runner now gives each
   command a short owned /tmp/r4648-* tree and removes it on completion.
   `related-safety-recovery` passes all 118 cases. Product tsx/network guard is
   unchanged. No test skip, provider call or credential inheritance was used.
3. `full-serial`: direct `node vitest` invocation passes 2,272 but fails 56
   existing CLI cases across six files. Unlike the established `npm test`
   command, it does not supply node_modules/.bin on PATH for unqualified tsx
   spawns. `diagnose-local-path` retains the exact ENOENT. The recipe now uses
   the owning npm test command; no package, product, dependency or test change
   is needed for that receiving correction. `full-serial-recovery` then passes
   all 2,328 tests/130 files without skips on 3a4ca315. The later UTF-8 source
   amendment receives a separate full-final run.
4. Self-review found metadata validation originally ran after telemetry could
   inspect malformed migration rows. Validation now runs first. New built CLI
   cases refuse null rows with exit 2 for both numbers and telemetry inputs.
   This was a review finding, not an observed production failure.


5. `malformed-utf8-red`: a focused built-consumer regression reproduces exit 0
   for invalid UTF-8 inside an otherwise parseable migration artifact. Node's
   permissive decode replaced those bytes, so a re-encoded digest would not bind
   the supplied file. Opt-in JSON reads now use fatal UTF-8 decoding and the
   artifact digest hashes the original Buffer. Default decoding stays the same.
   The targeted red run intentionally selected one case and skipped 31 others;
   `focused-amended` passes all 99 cases without selection skips; full-final
   receives the committed amendment 4f587503 separately.


6. `fact-retention-red`: eight targeted unit/built-CLI regressions fail (99
   intentionally unselected) because stale/future grading replaced null,
   omission and missing-model facts with a generic unusable state; early artifact
   rejection also hid otherwise exact supplied metadata. Field facts now bind
   before independent artifact/capture grading and remain visible. Reconciliation
   stays unknown/conflict and effective schedules remain withheld. HTTP failure
   still has no model/date fact. This changes evidence reporting, not authority
   or measured rollout judgment. Full-final at 4f587503 had already passed 2,329;
   `focused-facts-final` passes all 107 cases with no skips. The final
   fact-retention source 3fae0d61 receives its own committed full run.

Exploratory wrong-path reads were corrected using rg; they are not verification
passes. The runner's receipt records failures and exact source bindings. Early
receipts count the admitted supervisor/native subtree (394133) and owned command
children. Later checks count the positively identified same-task launch ancestor
393571 as well, including its runner/launcher/native descendants, for broader
whole-task accounting. No unrelated process tree is owned or terminated.
100ms RSS sampling is not a kernel/cgroup high-water guarantee. Zero-RSS zombies
may be listed as surviving owned PIDs; this does not mean a live worker survives.

Full-suite/build, no-network controls, protected-base receiving and final export
results belong in WORKER-HANDBACK.md and WORKER-RESULT.json after completion.
No external reviewer, real provider metadata, installation, public PR/release,
upstream adoption, customer, billing or revenue is established.

Final source 3fae0d61 passes full-facts-final: 2,337 tests/130 files, zero failures/skips. Terminal build, six no-network controls, actual built consumer replay and four exact-base default byte-parity controls pass. Protected-base receiving is unchanged. WORKER-HANDBACK.md/WORKER-RESULT.json consolidate final facts; no further product edit follows.

The first export shell invocation was rejected before execution because it included rm -f cleanup of a task-created temporary summary. Cleanup was omitted and the authorized Git export was run separately; no source or export command had run in that rejected invocation.

Git whitespace checking flags the unmodified raw command logs (Vitest/npm trailing blank lines and one rendered empty test value). Logs are preserved byte-for-byte against their output SHA-256 receipts; whitespace checking passes for all non-log export files.
