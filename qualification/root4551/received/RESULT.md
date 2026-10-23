# ROOT4410-C: adopt the foundation, retain measured boundaries

**Decision:** adopt mendr `413bdc648d3b45d52ed9a2d5a27146e9685f9d7c`
for bounded offline source/config qualification. Keep its registry, classifiers,
parameter rules, migration engine and gates. Do not enable unattended writes from
this pin: the opaque-request-spread regression can reach a verified write. Three
small owning-source corrections are exported for Root's separate upstream receiving.
Do not rely on a healthy telemetry verdict without the missing-evidence correction.
Retain the thin workflow report adapter because executed controls show a useful
classification and locator improvement. No installed service or buyer was established.

Pilot origin remains `github.com/epistemedeus/pilot.git`, admitted branch
`codex/root4410-c-mendr-adoption-20261023`, base
`8aded3ca3bb5f22b32454f962091ef3750715a76`. Only this adoption subtree changes.
Exact source commits/trees, package scripts, lock hashes and resolved dependencies
are in [source-identities.json](outputs/source-identities.json). Commit identities
for the implementation checkpoint are in [WORKER-RESULT.json](WORKER-RESULT.json);
the final terminal receipt identifies the report-only export commit.

## Adoption matrix

“Implemented and executed” means local synthetic or pinned-source execution,
not provider acceptance or installed behavior. Paths below belong to the pinned
mendr source unless explicitly identified as Pilot.

| Status | Capability and source | Executed evidence / useful consequence |
| --- | --- | --- |
| **Implemented and executed** | TS/JS/Python source and config classification: `src/usage/scanRepo.ts`, `src/python/`, `src/config/scanConfig.ts` | Actual root build and all 2,207 tests/124 files pass offline. Exact A/B audits locate the 54 checked references, with coverage and role limits below. Reuse this scanner. |
| **Implemented and executed** | Registry dating, evidence and verification: `src/registry/`, `src/usage/llmRegistry.ts` | Bundled snapshot `sha256:e0464cc70ab44d9d`, published October 11, is graded fresh at this observation (14-day policy). Future-clock stale case and existing freshness/evidence/contradiction tests pass. No refresh or new calendar. |
| **Implemented and executed** | Parameter rules and holds: `src/usage/coupledParams.ts`, `src/fix/paramFix.ts`, `src/gates/secondCheck.ts` | Existing groups plus explicit `prompt_cache_retention` hold pass. Proxy and gateway-prefix calls remain held. Parameter rename/removal and failed second-check handling already exist. Unknown object spreads are a separate proved gap. |
| **Implemented and executed** | Patch, migration, explicit write and failure/recovery: `src/fix/`, `src/migrate/migrate.ts`, `src/gates/` | Built-path corpus verifies exact diff, type/build/test/eval failure refusal, timeout then recovery, valid write, repeat no-migration, and repeated print-only byte preservation. Injected second-check rejection on the real migration path refuses writing even while type/eval pass, then a real second check recovers. |
| **Implemented and executed** | External-command eval: `src/gates/runEval.ts`, `src/cli.evalGate.test.ts` | Deterministic local commands pass/fail/timeout; the built CLI refuses a timed-out `--write` and succeeds after a healthy command override. This proves command plumbing only. |
| **Implemented and executed** | Supplied telemetry, rollout and date-bound recovery: `src/runtime/evidence.ts`, `src/assurance/` | Healthy, degraded, low coverage, missing signals and required-quality cases pass. Missing cost stays null/not-measured. UTC boundary cases execute before/on/after retirement. The recovery correction removes unsupported availability claims. Direct-window tests alone did not receive missing-outcome telemetry; patch 0003 closes the producer gap below. |
| **Implemented and executed** | Narrow workflow ingest/report, **Pilot** `scripts/workflow-report.mjs` | Three expected selector pointers reported; notes and credential-like controls excluded. Five adapter tests include custom endpoints, expression/missing/unknown values, duplicate ids, unsupported nodes and failure/recovery. Registry matching/classification remains mendr's. |
| **Present but unreceived** | Provider-backed eval cases: `src/gates/evalCases.ts` | Existing unit tests use injected responses; no built-in provider-backed eval command was run. Answer quality, cost, latency and equivalence remain unreceived. |
| **Present but unreceived** | Provider usage reads, signed network refresh, hosted App/watch workflows | Source exists; no authenticated API read, refresh service, watch installation, hosted build or deployment was exercised. Root suite covers `src/`, not the separate hosted `app/` suite. |
| **Genuine gap** | Models-response `shutdown_date` ingestion | No authenticated Models importer exists at this pin. Supplied date/null/missing/conflict/stale fixtures cannot be consumed as runtime usage; the existing seam rejects them. Published registry schedule is preserved, accessibility and semantics remain unknown. Conflict reconciliation is not claimed. Do not add API reads or treat absence/null as clearance. |
| **Genuine gap, correction exported** | Opaque request spread: shared `src/usage/tsSurface.ts` and stored-request flow in `src/usage/scanLiterals.ts` | Baseline: six of seven regression cases fail, including an actual unintended verified write. Patch 0002 caps inline, named-request, const and shorthand forms at review; explicit requests remain eligible. |
| **Genuine gap, correction exported** | Recovery evidence: `src/assurance/recovery.ts` | Baseline: all three new tests fail. Unknown/mixed/empty evidence can offer a revert; an announced date is described as an observed outage. Patch 0001 refuses unproved reverts and keeps UTC date-based refusal without inventing endpoint observations. |
| **Genuine gap, correction exported** | Missing telemetry evidence: `src/runtime/evidence.ts`, `src/assurance/telemetry.ts` | Baseline: 3/4 new tests fail. The actual built `rollout --from` returns verified without outcomes and treats malformed cost as measured zero. Patch 0003 retains rollout outcome coverage, omits unproved error rates and parses optional cost/latency without manufacturing zeros. Real HTTP-status success/failure and explicit zero recover. |
| **Out of scope** | Live SDK/model semantic qualification, persisted YOLO installation, customer workflows, publishing and new services | No real keys, customer payloads, private Felix export, paid API, telemetry upload, issue/comment/PR, release, installer, scanner census or hosted runtime. Upstream scaffolding tests use disposable fixtures only. Root owns upstream receiving/integration. |

## A/B reference denominator and coverage

[expected-references.json](fixtures/expected-references.json) is a frozen list
whose file roles were manually checked against the exact pre-fix pins. The
comparison covers the three named retiring families and their exact dated
snapshot literals in authored JS/TS/YAML, not every model in either repository.
Markdown/prose, comments, generated dist, locks and routed suffix variants are
outside this exact-literal denominator. The full reports retain other findings;
no recall estimate is made for those unlabelled references.

| Pin | Checked references | Roles | Scanner coverage |
| --- | --- | --- | --- |
| EventCatalog `d721c06…` | **11/11 located** | 1 action config default; 2 indirect runtime defaults; 6 catalog literals; 2 fixture literals; no direct endpoint call with these literal model args | 16 source + 13 config files; 4 test files excluded from the main source scan; 2 docs counted; 0 parse failures/unreadable files |
| YOLO `f5470e7…` | **43/43 located** | 10 current catalog/price/capability literals; 17 historical migration literals; 16 fixture literals; no direct endpoint call with these literal model args | 1,365 source + 41 config files; 628 test files; 63 docs counted; 0 parse failures/unreadable files |

All 54 are **not patch-eligible**. EventCatalog's action default and factory
fallback are informational while its `src/lib/ai.ts` default is held for review:
location recall is not complete selector-role inference. YOLO's catalog model
fields and five historical-migration references are conservatively reviewable;
others are informational. This does not receive its v89 persisted settings or
prove a missed live-call repair. Four YOLO identity references are emitted without
their `openai/` prefix; comparison joins the checked file/line and explicitly
records this information loss. Reader tie-back and runtime usage are unproved.

[reference-comparison.json](outputs/replay/reference-comparison.json) retains
each expected locator, returned role/tier and normalization. A/B remain byte-equal
to their pinned Git trees with no untracked output; see
[source-preservation.json](outputs/source-preservation.json) and the fresh receiver's
final clean-input checks.

## Why this adapter is justified

The owner-authored [n8n](fixtures/n8n.json) and [Make](fixtures/make.json) controls
contain three true selectors. Generic audit locates their strings but labels only
two as selectors: n8n's resource-locator `model.value` is informational. It emits
five selector candidates overall, including three benign utility/note/credential
controls, and supplies file/line rather than node pointers. This is **2/3 selector
role recall and 2/5 candidate precision on this small synthetic corpus**, not a
population estimate or a failure to locate YOLO's catalog.

The adapter reports exactly `/nodes/0/parameters/model/value`,
`/nodes/1/parameters/model`, and `/flow/0/mapper/model`, plus the actual sampling/
token parameter pointers. It ignores other nodes and credential values, counts
unsupported nodes, and sends extracted scalars to the unchanged `scanConfigText`
and bundled registry. It never patches, evaluates, executes a workflow or grades
semantic compatibility. Custom endpoints receive no direct-provider replacement.
The next source-closed workflow receiver can now choose the exact selector to
review without treating the notes as live usage. These two shapes are
synthetic-qualified; real connector versions and vendor export compatibility are
not established. No general parser, migration engine or maintained service was added.

## Corrections to the proposed missing-work list

Do not rebuild code/config/Python scanning, dated registry/evidence, parameter
checks, model/parameter rewriting, command eval, second checking, rollout or
recovery planning. They already exist and now have executed receiving. Parameter
verification is bounded by encoded rules and visible requests; it is not SDK
capture or semantic parity. The actual residuals are the three exported source
corrections, Models metadata ingestion, incomplete role/tie-back inference, and
the narrow workflow ingest seam. A general scanner, deadline registry, watch
service or no-code migration engine is unjustified by this result.

## Verification, provenance and remaining release boundary

Baseline `npm run build` and `npm test -- --maxWorkers=1 --no-file-parallelism`
pass; the correction patches plus the second-check receiving fixture pass
**2,222 tests/128 files** and the patched build. All three patches apply cleanly to
the pin and reproduce the tested source bytes. [patch-application.json](outputs/patch-application.json)
and the baseline-red/green command receipts preserve this separation. The source
pin itself has not been published with these corrections.

[README.md](README.md) gives the working offline command. The complete exported
`receive.py` is replayed against a second clean pinned worktree with the same
lock-resolved dependencies. Every command has argv, exit code, elapsed time,
output hash/log and sampled resource receipt in [outputs/](outputs/). First
failures and corrections remain in [CONTROLLER-FAILURES.md](outputs/CONTROLLER-FAILURES.md).
No unrun gate is reported as passed.

Node **22.23.4**, npm **10.9.9**, mendr **0.5.11-alpha**, TypeScript **5.9.3**,
Vitest **4.1.10** and ts-morph **28.0.0** were resolved locally. No lockfile or
registry bytes changed. All qualification Node commands run under the existing
no-network preload with provider/Git credentials absent from the command
environment; explicit negative controls prove the guard rejects outbound
primitives. This is Node-level enforcement, not an OS network sandbox. Git/source
and dependency acquisition preceded it; the authorized final Pilot push is a
separate export. No provider accessibility or paid evaluation was observed.

Aggregate RSS includes this native controller and command descendants, sampled
at 100 ms; exact per-command maxima are in receipts and WORKER-RESULT. No 2 GiB
reserve stop, OOM, extra model child or larger reservation was needed. Zero-RSS
zombies left to the native host parent are distinguished from live jobs. No other
job was controlled. The `/bin/zsh` doc-hygiene wrapper is unavailable; its owning
Node entrypoint exits 0 with inherited review/link signals, without mutating
shared operating records. Export precedes SPEC checkpoint **13:34:06 UTC** and
host horizon **13:49:06 UTC**.

Root should receive the scoped branch, replay the semantic evidence once, and
choose upstream submission/adoption. Live installation, actual provider access,
maintainer acceptance, a buyer, repeat demand and revenue all remain unreceived.
