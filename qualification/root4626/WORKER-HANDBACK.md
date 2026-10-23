# ROOT4626 packaging handback

All three isolated candidates are pushed and read back. Nothing is withheld.
Each candidate has one commit directly on the exact upstream base, contains only
its declared production/tests, and excludes qualification evidence from history.
Attribution is preserved; source commit trailers and exact file/rename mappings,
blob/SHA-256 inventories and inverse byte-equivalence checks are in PROJECTIONS.json.

| Candidate | Fork ref | Exact head | Tests / files |
| --- | --- | --- | --- |
| recovery | `codex/root4626-mendr-recovery-20261023` | `10b4ed4b65908bf9cca421174562524902f2c189` | 28 / 2 |
| request-spreads | `codex/root4626-mendr-request-spreads-20261023` | `8382a864fd5ef0334a8a803d52a40559126e3e3b` | 234 / 7 |
| telemetry | `codex/root4626-mendr-telemetry-20261023` | `55e4a3499a0330aa8de4e36c9a7659202635af4d` | 50 / 4 |

Each ref has its own passing build and actual built consumer controls. Recovery
uses five normal rollout NUMBERS --migration --repo --json invocations with the
actual clock. Request spreads use both accepted direct/wrapped probes against
this projection's built modules, with held byte preservation and exact eligible
writes. Telemetry retains all five accepted rollout predicates and exit meanings.
Renamed tests on a disposable exact base reproduce 20 failures/2 passes; no safety
assertion or negative control was removed. Source/test mappings preserve all
accepted assertions while removing internal labels and temporary fixture names.

The suggested src/usage/sinkParamGuard.test.ts does not exist at the pinned base
or accepted source. The preflight retains that failure explicitly; the actual
owning coupledParams.test.ts contains 110 sink/const/shorthand/fallback parameter
controls and runs in full. The seven existing request files were each confirmed
in Vitest output; no absent/empty file was counted.

All 11 monitored commands ran serially with 640 MiB heaps. Highest sampled whole-
job RSS: 1,043,996 KiB of 2,097,152 KiB (100 ms sampling, not kernel high-water).
No model children, larger reserve, stop, provider operation or other job ownership.
The current supervisor PID was observed from this resumed native ancestry rather
than inherited from the predecessor. All four owned disposable worktrees were
removed after preserving candidate refs and evidence; no live test child remains.

The canonical branch stays codex/root4551-mendr-safety-integration-20261023.
All accepted product and qualification/root4551 bytes remain unchanged. Only
qualification/root4626 is added to the canonical history. The source result and
controller handback record this same session and the new finite horizon:
checkpoint 12:11:40.035 UTC; required-until 13:56:06.713 UTC.

Root should independently receive these heads and open appropriate upstream PRs.
PR-NOTES.md has recipient-scoped motivation, checks and limits per candidate.
No upstream PR/comment, release, deployment, installation, live provider call,
telemetry upload or credential work ran. These are local source safety results,
not availability, semantic parity, measured billing, adoption or revenue evidence.
The exact canonical qualification export HEAD/tree is in the native final response
and controller handback; it cannot be embedded in its own commit.
