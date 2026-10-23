"""Consolidate completed receipts only; never manufactures a successful check."""
from pathlib import Path
import datetime
import json
import re
import subprocess

q = Path('qualification/root4648')
out = q / 'outputs'
required = ['full-facts-final', 'terminal-build', 'network-controls', 'consumer-replay', 'default-parity-final']
for name in required:
    receipt = json.loads((out / (name + '.json')).read_text())
    assert receipt['exitCode'] == 0 and receipt['stopReason'] is None, name
commands = []
for p in out.glob('*.json'):
    value = json.loads(p.read_text())
    if isinstance(value, dict) and 'command' in value and 'exitCode' in value:
        commands.append(dict(receipt='outputs/' + p.name, **value))
commands.sort(key=lambda r: r['startedAt'])
(out / 'COMMANDS.json').write_text(json.dumps(commands, indent=2) + '\n')
source = json.loads((out / 'SOURCE-MANIFEST.json').read_text())
assert source['testedSourceHead'] == subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip()
assert not subprocess.check_output(['git', 'diff', '--name-only']).decode().strip(), 'tracked source drift'
full = (out / 'full-facts-final.log').read_text()
count = int(re.search(r'Tests\s+(\d+) passed', full).group(1))
files = int(re.search(r'Test Files\s+(\d+) passed', full).group(1))
assert not re.search(r'\d+ (failed|skipped)', full)
peak = max(r['peakAggregateRssKiB'] for r in commands)
assert all(r['reservationKiB'] == 2097152 for r in commands)
assert not any(r['stopReason'] for r in commands)
result = dict(
    schema='root4648-worker-result/v1', status='source_qualified_ready_for_root_receiving',
    completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    repository=source['origin'], branch=source['branch'], base=source['base'],
    testedSourceHead=source['testedSourceHead'], testedSourceTree=source['testedSourceTree'],
    exportIdentity='Final qualification-only HEAD/tree are supplied in the native final response; this file cannot embed its own commit hash.',
    sourceHashes=source['sourceHashes'],
    inputSchema='mendr-models-metadata/v1', evidenceSchema='mendr-model-retirement/v1', contract='CONTRACT.md',
    checks=dict(fullSerial=dict(passed=count, files=files, failed=0, skipped=0, receipt='outputs/full-facts-final.json'),
                focused=dict(passed=107, files=2, failed=0, skipped=0, receipt='outputs/focused-facts-final.json'),
                relatedExisting=dict(passed=118, failed=0, skipped=0, receipt='outputs/related-safety-recovery.json'),
                defaultParity=dict(controls=4, stdoutByteEqual=True, stderrByteEqual=True, exitsEqual=True, receipt='outputs/default-parity-final.json'),
                build='outputs/terminal-build.json', networkControls='outputs/network-controls.json', consumerReplay='outputs/consumer-cases.json'),
    firstFailuresRetained=['focused-built-cli', 'related-safety', 'full-serial', 'malformed-utf8-red', 'fact-retention-red'],
    targetedSelectionSkips=dict(malformedUtf8Red=31, factRetentionRed=99),
    resources=dict(totalReserveKiB=2097152, peakSampledAggregateRssKiB=peak, sampleMs=100, reserveStops=0,
                   modelChildren=0, heavyCommands='serial', accounting='Final commands include the positively identified same-task launch/native/supervisor tree and all owned command descendants; earlier receipts label their narrower supervisor root. RSS is sampled, not a kernel high-water mark.'),
    preservation=dict(unchangedBaseFiles=source['unchangedBaseFiles'], originalQualificationFiles=source['originalQualificationFilesPreserved'],
                      packageAndLockUnchanged=True, registryAndMigrationAndCustomerSourceUnchanged=True),
    policy=dict(maxCaptureBytes=1048576, maxRecords=2048, maxCaptureAgeHours=24, futureToleranceSeconds=0,
                authentication='caller_supplied_unverified', clock='existing MENDR_EVALUATED_AT convention on opt-in only',
                exactBinding='provider/from and declared direct OpenAI scope; serving endpoint not recorded in artifact',
                unsupported='partner/proxy scope and fine-tunes; no alias/snapshot/base-model inheritance'),
    limits=['Synthetic offline fixtures, not real account responses or endpoint accessibility.',
            'Schedule advice only; no replacement, semantic quality, measured billing or write assurance.',
            'No registry promotion/freshening, lifecycle change, verification-switch change or new write authority.',
            'Existing --record schema retains original artifact/rollout facts; save JSON for reconciliation.',
            'No live Models/provider API/key/account action, installation, public PR/comment/release, deployment, upstream adoption, customer or revenue.'],
    handback='WORKER-HANDBACK.md', recipe='RECIPE.md', selfReview='SELF-REVIEW.md', commands='outputs/COMMANDS.json',
)
(q / 'WORKER-RESULT.json').write_text(json.dumps(result, indent=2) + '\n')
handback = f'''# ROOT4648 handback

Ready for Root's independent receiving. The offline `rollout --models-metadata`
input reconciles supplied Models fields with exact migration provider/from facts
and passes only supported schedule dates to the existing recovery planner.
Measured rollout judgment and no-flag behavior are preserved. Only admitted
branch `{source['branch']}` on `{source['origin']}` is exported.
Root owns adoption, integration, PR and any later release.

Base: `{source['base']}`. Tested product/test HEAD:
`{source['testedSourceHead']}`; tree `{source['testedSourceTree']}`.
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

- **{count} tests/{files} files**, zero failures/skips, on final source.
- **107 focused tests** and **118 related existing tests** pass.
- Final build, six negative no-network controls and real built-consumer replay pass.
- Four exact-base built controls (JSON/human, with/without migration) preserve
  raw stdout, stderr and exits byte-for-byte, including default clock behavior.
- Missing outcomes/costs remain unmeasured; actual measured failure exits 1,
  explicit success/zero recovers, insufficient evidence exits 3. Metadata unknown
  or conflict can coexist with a measured healthy rollout (exit 0); invalid
  opt-in inputs exit 2. Metadata never manufactures measured signals.
- Every base file outside the allowed README/CLI edits is byte-preserved:
  **{source['unchangedBaseFiles']} files**, including all **{source['originalQualificationFilesPreserved']} original qualification files**.

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
RSS is **{peak:,} KiB**, with 100ms samples and a guard below the reserve; no reserve
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
'''
(q / 'WORKER-HANDBACK.md').write_text(handback)
print(json.dumps(dict(status=result['status'], passed=count, files=files, peakRssKiB=peak)))
