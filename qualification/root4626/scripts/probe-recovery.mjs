import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const [projectionArg, outputArg, canonicalArg] = process.argv.slice(2);
const projection = resolve(projectionArg), output = resolve(outputArg);
// Start from an actual, typed MigrationResult emitted by the accepted producer.
const template = JSON.parse(readFileSync(join(canonicalArg, 'qualification/root4551/outputs/final-spread-write/spread-write-cases.json'), 'utf8')).results.find(x => x.name === 'explicit').report;
const scratch = mkdtempSync(join(tmpdir(), 'mendr-recovery-consumer-'));
const now = new Date();
const day = offset => new Date(now.getTime() + offset * 86400000).toISOString().slice(0,10);
const future = day(2), past = day(-2), results = [];
try {
  const numbers = { workflow: 'Synthetic', before: { calls: 120, errorRate: 0 }, after: { calls: 120, errorRate: 0 } };
  const numbersPath = join(scratch, 'numbers.json'); writeFileSync(numbersPath, JSON.stringify(numbers));
  for (const [name, dates, available] of [
    ['empty', [], false], ['unknown', [null], false], ['mixed', [future, null], false],
    ['known-before-date', [future], true], ['known-after-date', [past], false],
  ]) {
    const migration = structuredClone(template);
    migration.migrations = dates.map((shutdownDate, i) => ({ ...template.migrations[0], from: `synthetic-old-${i}`, to: `synthetic-new-${i}`, evidence: { ...template.migrations[0].evidence, shutdownDate } }));
    const migrationPath = join(scratch, 'migration.json');writeFileSync(migrationPath, JSON.stringify(migration));
    const args = [join(projection, 'dist/cli.js'), 'rollout', numbersPath, '--migration', migrationPath, '--repo', scratch, '--json'];
    const child = spawnSync(process.execPath, args, { encoding: 'utf8' });
    const report = JSON.parse(child.stdout);
    results.push({name, args, exitCode:child.status, numbers, migration, expectedRevertAvailable:available, report});
    assert.equal(child.status, 0, child.stderr);assert.equal(report.verdict, 'verified');
    assert.equal(report.recovery.options[0].available, available, name);
    assert.equal(report.recovery.asOf, new Date().toISOString().slice(0,10));
    assert.match(report.recovery.caveats.join(' '), /accessibility.*not observed/i);
    assert.match(report.recovery.caveats.join(' '), /quality.*not/i);
    assert.doesNotMatch(report.recovery.options[0].detail, /shut down on|no longer answers|no longer exists/);
    if (name === 'known-before-date' || name === 'known-after-date') assert.match(report.recovery.options[0].detail, /announced/);
    else assert.match(report.recovery.options[0].detail, /not established|unknown/i);
  }
} finally {
  mkdirSync(output,{recursive:true});writeFileSync(join(output,'recovery-cli-cases.json'),JSON.stringify({observedClock:now.toISOString(),future,past,results},null,2)+'\n');
  rmSync(scratch,{recursive:true,force:true});
}
console.log('PASS five built rollout recovery consumers with actual clock and well-typed producer artifacts');
