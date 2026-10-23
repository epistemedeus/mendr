// Actual built consumer with original synthetic evidence. Runs serially; no provider operation.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const q = resolve('qualification/root4648');
const cli = resolve('dist/cli.js');
const baseline = resolve(q, '.scratch/baseline-dist/cli.js');
const f = (name) => `${q}/fixtures/${name}.json`;
const env = { ...process.env, MENDR_EVALUATED_AT: '2026-10-23T12:00:00Z', ROOT4648_FIXED_NOW: '2026-10-23T12:00:00Z',
  NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --require ${q}/scripts/fixed-clock.cjs` };
const cases = [];
function run(name, metadata, migration = 'migration', binary = cli) {
  const args = [binary, 'rollout', f('numbers'), '--repo', `${q}/fixtures`, '--migration', f(migration), ...(metadata ? ['--models-metadata', f(metadata)] : []), '--json'];
  const result = spawnSync(process.execPath, args, { env, encoding: 'utf8', timeout: 20_000 });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  const swap = report.modelsMetadata?.swaps[0];
  const record = { name, command: [process.execPath, ...args], exitCode: result.status, measuredVerdict: report.verdict,
    metadataState: swap?.metadata.state ?? null, reconciliation: swap?.reconciliation ?? null,
    effectiveSchedule: swap?.effectiveSchedule ?? null, revertScheduleOption: report.recovery.options[0].available };
  cases.push(record);
  return report;
}
const old = run('exact-base-undated', null, 'migration-undated', baseline);
assert.equal(old.recovery.options[0].available, false);
const corroborated = run('current-exact-corroborated', 'list-date');
assert.equal(corroborated.modelsMetadata.swaps[0].reconciliation, 'corroborated');
const supplied = run('current-exact-undated', 'list-date', 'migration-undated');
assert.equal(supplied.recovery.options[0].available, true);
assert.equal(supplied.modelsMetadata.swaps[0].reconciliation, 'metadata_schedule');
assert.deepEqual(old.signals, supplied.signals);
for (const [name, expected] of [['null', 'conflict'], ['omitted', 'artifact_only'], ['missing', 'artifact_only'], ['conflict', 'conflict'], ['stale', 'unknown']]) {
  const r = run(name, `list-${name}`);
  assert.equal(r.modelsMetadata.swaps[0].reconciliation, expected);
  if (['null', 'conflict', 'stale'].includes(name)) assert.equal(r.recovery.options[0].available, false);
  assert.equal(r.verdict, 'verified');
}
const recovered = run('recovered-current', 'list-date');
assert.deepEqual(recovered, corroborated);
const baselineRefusal = spawnSync(process.execPath, [baseline, 'rollout', f('numbers'), '--migration', f('migration'), '--models-metadata', f('list-date'), '--json'], { env, encoding: 'utf8', timeout: 20_000 });
assert.notEqual(baselineRefusal.status, 0);
assert.match(baselineRefusal.stderr, /unknown option '--models-metadata'/);
const result = { cases, exactBaseFlagRefusal: { exitCode: baselineRefusal.status, stderr: baselineRefusal.stderr.trim() }, recoveredByteStructureEqual: true };
for (const [name, report] of [['corroborated', corroborated], ['supplied-schedule', supplied]]) {
  writeFileSync(`${q}/outputs/example-${name}.json`, JSON.stringify(report, null, 2) + '\n');
}
writeFileSync(`${q}/outputs/consumer-cases.json`, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
