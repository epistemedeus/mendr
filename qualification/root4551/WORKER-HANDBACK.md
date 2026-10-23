# ROOT4551 handback

Ready for Root's independent source receiving. The three exact ROOT4410-C
corrections are integrated, followed by one red/green spread amendment and an
exact-source second-check recovery assertion. Only the admitted branch
`codex/root4551-mendr-safety-integration-20261023` on `https://github.com/epistemedeus/mendr.git`
is exported. Root owns any later upstream PR or release.

Tested product/test HEAD: `5ea45e2fce4cc3e57f053f6864e525a87e12fb4c`. Tree:
`f1553e8186dd6c4a54b2836712f0101ec3d2da88`. The final qualification-only export
commit and tree are returned in the native final response; this document cannot
embed its own commit hash. Base: `413bdc648d3b45d52ed9a2d5a27146e9685f9d7c`; base tree
`601dc96f4658585058cdd06df23e6a2728e4a9d2`.

| Commit | Change | Focused evidence |
| --- | --- | --- |
| `233b362a4834` | fix: qualify recovery advice by known retirement schedules | `outputs/green-recovery.json` |
| `0c94fb98471b` | fix: hold opaque request spreads for model and parameter review | `outputs/green-spread.json` |
| `ed6ddc85a199` | fix: preserve unknown telemetry outcomes and measurements | `outputs/green-telemetry.json` |
| `6584ea126657` | test: receive second-check write refusal and recovery | `outputs/second-check-received.json` |
| `9f166d9f1a70` | fix: hold opaque request spreads in fallback and conditional branches | `outputs/amendment-spread-green.json` |
| `5ea45e2fce4c` | test: assert exact source after second-check recovery | `outputs/second-check-source-bytes.json` |

The original three patches match their supplied SHA-256 and apply checks.
All ten received product/test hashes match the original application receipt at
the pre-amendment checkpoint. The complete 131-file, 1,854,886-byte Pilot export
at `79aa03ac668e712825db5947d05c4c560d0951d2` is preserved under [received/](received/).
Original owners, contexts, first failures and reports remain unchanged.
[Source manifest](SOURCE-MANIFEST.json) records Git blobs, byte sizes, digests,
operating inputs and final scoped source hashes. [Self-review](SELF-REVIEW.md)
records the causal finding and every failed/redundant receiving attempt.

The untouched base builds and passes 2,207 tests/124 files. Exact new test hunks
then reproduce 3 recovery failures, 6/7 spread failures and 3/4 telemetry failures.
The baseline built rollout probe exits 1 and retains all five cases. A separate
actual write receipt records type/eval passed, verified/prReady true and changed
bytes for an opaque request. The received spread guard still allowed fallback
and conditional request objects to verify and write; eight new regressions and
built type/eval-passing writes receive that bypass before the small owning amendment.

The final combined candidate passes **2,230 tests/128 files**, the final build,
all five supplied built rollout cases, both direct/wrapped disposable write
probes, all 22 existing migration corpus cases and offline registry validation.
Unknown outcomes are inconclusive; actual HTTP failure regresses; explicit
success/zero recovers. Malformed cost is not measured. Opaque requests stay held
with exact unchanged bytes; explicit requests still verify and write exact source.
The supplied second-check rejection refuses a write while type/eval pass, then
its real healthy check writes the exact expected source. Type/build/test/eval
failure and timeout refusal/recovery, repeat report-only byte preservation,
proxy/parameter holds and a real disposable successful write also pass.

[Commands and exits](outputs/COMMANDS.json) link bounded logs and source bindings;
[boundary results](outputs/BOUNDARY-RESULTS.json) retain positive, adverse and
recovery outcomes. All heavy commands were serial with 640 MiB Node heaps and an
aggregate guard. Highest sampled whole-job RSS: **1,284,936 KiB** of 2,097,152 KiB;
100 ms samples, not a kernel high-water mark. No reserve stop, OOM, larger reserve,
model child, other job ownership or owned PostgreSQL was needed. Only zero-RSS
command zombies under the native supervisor remained in command receipts.

Actual runtime is Node 22.23.4/npm 10.9.9; package 0.5.11-alpha and resolved locked
dependencies are in [BASELINE-IDENTITY.json](BASELINE-IDENTITY.json). Package/locks,
registries and public docs are unchanged. Qualification commands use an isolated
HOME, an allowlisted credential-free environment and the existing no-network
preload. Six negative controls pass. This is Node enforcement, not an OS sandbox;
source/dependency acquisition and Git export are separate.

Reuse the existing commands from COMMANDS.json on disposable fixtures. On a new
receiver, pass its actual native supervisor PID to scripts/run.py, with options
before the positional receipt name, and a fresh output directory. The original
baseline test-only patch recipe remains in received/README.md. The exact original
CLI probes are in received/scripts/; additional write probes and the bounded
runner are in scripts/. Source amendments are exported separately in amendments/.

No deployment, provider-backed evaluation, live API/account/Models operation,
telemetry upload, real-workspace migration, installation, external PR or public
human-copy change ran. These are synthetic/local source safety results, not live
availability, semantic parity, measured billing, adoption, customer or revenue.
The separate hosted app suite was not run. The existing locate-only nested
satisfies boundary remains documented. Finite admission checkpoint is
13:34:06.713 UTC and required horizon 13:49:06.713 UTC; source export precedes both.
