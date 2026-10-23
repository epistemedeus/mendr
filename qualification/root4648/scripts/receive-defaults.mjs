import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const dir = resolve('qualification/root4648');
const baseline = resolve(dir, '.scratch/baseline-dist/cli.js');
const env = { ...process.env, ROOT4648_FIXED_NOW: '2026-10-23T12:00:00Z', MENDR_EVALUATED_AT: 'invalid-ignored-by-default',
  NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --require ${dir}/scripts/fixed-clock.cjs` };
const cases = { 'numbers': [], 'migration': ['--migration', `${dir}/fixtures/migration.json`] };
const evidence = [];
for (const [name, extra] of Object.entries(cases)) {
  for (const format of ['json', 'text']) {
    const args = ['rollout', `${dir}/fixtures/numbers.json`, '--repo', `${dir}/fixtures`, ...extra, ...(format === 'json' ? ['--json'] : [])];
    const old = spawnSync(process.execPath, [baseline, ...args], { env, encoding: 'utf8' });
    const current = spawnSync(process.execPath, ['dist/cli.js', ...args], { env, encoding: 'utf8' });
    if (old.status !== 0 || old.status !== current.status || old.stdout !== current.stdout || old.stderr !== current.stderr) throw new Error(`default parity failed: ${name}/${format}`);
    writeFileSync(`${dir}/fixtures/default-${name}.${format === 'json' ? 'json' : 'txt'}`, old.stdout);
    evidence.push({ name, format, exit: current.status, stdoutByteEqual: true, stderrByteEqual: true, bytes: Buffer.byteLength(old.stdout) });
  }
}
writeFileSync(`${dir}/outputs/default-parity.json`, JSON.stringify({ base: '6e2a0c8cab5bb94817173fff43dbf67a1f834c61', cases: evidence }, null, 2) + '\n');
console.log(JSON.stringify(evidence));
