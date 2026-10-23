import { afterEach, describe, expect, it } from 'vitest';
import { execa } from 'execa';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Receiving must run `npm run build` first: this exercises the shipped JS entry point.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUAL = join(ROOT, 'qualification/root4648');
const CLI = join(ROOT, 'dist/cli.js');
const NOW = '2026-10-23T12:00:00Z';
const created: string[] = [];
afterEach(() => { for (const path of created.splice(0)) rmSync(path, { recursive: true, force: true }); });
function tmp() { const dir = mkdtempSync(join(tmpdir(), 'mendr-models-')); created.push(dir); return dir; }
const fixtureText = (name: string) => readFileSync(join(QUAL, 'fixtures', name), 'utf8');
const fixture = (name: string): any => JSON.parse(fixtureText(name));
const digest = (text: string) => `sha256:${createHash('sha256').update(text).digest('hex')}`;
async function run(options: {
  capture?: any; rawCapture?: string | Buffer; migration?: any; rawMigration?: string; noMigration?: boolean;
  noMetadata?: boolean; noJson?: boolean; extra?: string[]; now?: string; telemetry?: any[];
  numbers?: any; fixedClock?: boolean;
} = {}) {
  expect(existsSync(CLI), 'build the shipped CLI before receiving').toBe(true);
  const dir = tmp();
  const numbers = join(dir, 'numbers.json');
  const migration = join(dir, 'migration.json');
  const capture = join(dir, 'capture.json');
  const telemetry = join(dir, 'telemetry.json');
  const migrationText = options.rawMigration ?? (options.migration ? JSON.stringify(options.migration) : fixtureText('migration.json'));
  const captureText = options.rawCapture ?? JSON.stringify(options.capture ?? fixture('list-date.json'));
  writeFileSync(numbers, JSON.stringify(options.numbers ?? fixture('numbers.json')));
  writeFileSync(migration, migrationText);
  writeFileSync(capture, captureText);
  writeFileSync(telemetry, JSON.stringify(options.telemetry ?? []));
  writeFileSync(join(dir, 'client.ts'), 'export const untouched = "customer source sentinel";\n');
  const paths = [numbers, migration, capture, telemetry, join(dir, 'client.ts'), join(ROOT, 'registries/llm-deprecations.json')];
  const before = paths.map((p) => readFileSync(p));
  const args = [CLI, 'rollout', ...(options.telemetry ? ['--from', telemetry, '--deployed-at', '2026-10-20T12:00:00Z', '--workflow', 'Synthetic support'] : [numbers]),
    '--repo', dir, ...(options.noMigration ? [] : ['--migration', migration]),
    ...(options.noMetadata ? [] : ['--models-metadata', capture]), ...(options.noJson ? [] : ['--json']), ...(options.extra ?? [])];
  const r = await execa(process.execPath, args, {
    cwd: ROOT, reject: false, extendEnv: false, timeout: 20_000,
    env: {
      PATH: process.env.PATH, HOME: dir, TMPDIR: dir, LANG: 'C.UTF-8', NO_COLOR: '1',
      MENDR_EVALUATED_AT: options.now ?? NOW, MENDR_REGISTRY_REFRESH: 'on',
      NODE_OPTIONS: `--max-old-space-size=640 --require ${join(ROOT, 'scripts/no-network.cjs')}${options.fixedClock ? ` --require ${join(QUAL, 'scripts/fixed-clock.cjs')}` : ''}`,
      ...(options.fixedClock ? { ROOT4648_FIXED_NOW: NOW } : {}),
    },
  });
  expect(paths.map((p) => readFileSync(p))).toEqual(before);
  return { ...r, report: r.stdout.startsWith('{') ? JSON.parse(r.stdout) : null, captureText, migrationText };
}
const revert = (r: any) => r.report.recovery.options.find((o: any) => o.kind === 'revert');
const swap = (r: any) => r.report.modelsMetadata.swaps[0];

describe('built rollout --models-metadata, no network or input writes', () => {
  it('preserves frozen base stdout/stderr/exits with no new flag, including an ignored invalid evaluation pin', async () => {
    for (const noMigration of [true, false]) {
      for (const noJson of [false, true]) {
        const r = await run({ noMetadata: true, noMigration, noJson, fixedClock: true, now: 'ignored-invalid-pin' });
        expect(r.exitCode).toBe(0); expect(r.stderr).toBe('');
        const file = `default-${noMigration ? 'numbers' : 'migration'}.${noJson ? 'txt' : 'json'}`;
        expect(r.stdout + '\n').toBe(fixtureText(file));
        if (!noJson) expect(r.report).not.toHaveProperty('modelsMetadata');
      }
    }
  }, 30_000);
  it('requires --migration and refuses new write flags', async () => {
    const missing = await run({ noMigration: true });
    expect(missing.exitCode).toBe(2); expect(missing.stderr).toContain('--models-metadata requires --migration');
    const write = await run({ extra: ['--write'] });
    expect(write.exitCode).not.toBe(0); expect(write.stderr).toContain("unknown option '--write'");
  });
  it('corroborates date-only evidence and retains both digests, artifact age and stale registry facts', async () => {
    const r = await run();
    expect(r.exitCode).toBe(0); expect(r.report.verdict).toBe('verified');
    expect(swap(r)).toMatchObject({ reconciliation: 'corroborated', artifact: { lifecycle: 'deprecated', replacementVerdict: 'unverified' } });
    expect(revert(r).available).toBe(true); expect(revert(r).detail).toContain('Verify current accessibility');
    expect(r.report.modelsMetadata.capture).toMatchObject({ digest: digest(r.captureText as string), authentication: 'caller_supplied_unverified', freshness: 'fresh' });
    expect(r.report.modelsMetadata.artifact).toMatchObject({ digest: digest(r.migrationText), ageDays: 22.5, registry: fixture('migration.json').registry });
    expect(JSON.stringify(r.report)).not.toContain('autoApplyAllowed');
    expect(r.report).not.toHaveProperty('prReady');
  });
  it('changes the existing recovery consumer for an undated artifact while measured verdict and signals stay identical', async () => {
    const migration = fixture('migration.json'); migration.migrations[0].evidence.shutdownDate = null;
    const before = await run({ migration, noMetadata: true }); const after = await run({ migration });
    expect(revert(before).available).toBe(false); expect(revert(after).available).toBe(true);
    expect(after.report.signals).toEqual(before.report.signals); expect(after.report.verdict).toBe(before.report.verdict);
    expect(swap(after)).toMatchObject({ reconciliation: 'metadata_schedule', effectiveSchedule: { source: 'metadata', shutdownDate: '2026-10-24' } });
  });
  it('keeps null, omitted field and missing model distinct; null cannot clear an artifact warning', async () => {
    const outputs = [];
    for (const kind of ['null', 'omitted', 'missing']) {
      const capture = fixture('list-date.json'); const migration = fixture('migration.json');
      migration.migrations[0].evidence.shutdownDate = '2026-10-22';
      if (kind === 'null') capture.response.body.data[0].shutdown_date = null;
      if (kind === 'omitted') delete capture.response.body.data[0].shutdown_date;
      if (kind === 'missing') capture.response.body.data = [];
      const r = await run({ capture, migration }); outputs.push(swap(r));
      expect(r.exitCode).toBe(0); expect(r.report.verdict).toBe('verified'); expect(revert(r).available).toBe(false);
    }
    expect(outputs.map((s) => s.metadata.state)).toEqual(['no_announced_date', 'not_reported', 'missing_model']);
    expect(outputs.map((s) => s.reconciliation)).toEqual(['conflict', 'artifact_only', 'artifact_only']);
    expect(outputs.map((s) => s.artifact.shutdownDate)).toEqual(['2026-10-22', '2026-10-22', '2026-10-22']);
  });
  it('list/retrieve agree and preserve unrelated provider/model swaps', async () => {
    const migration = fixture('migration.json');
    migration.migrations.push({ ...structuredClone(migration.migrations[0]), from: 'unrelated-openai' });
    migration.migrations.push({ ...structuredClone(migration.migrations[0]), provider: 'anthropic' });
    const list = await run({ migration }); const retrieve = await run({ capture: fixture('retrieve-date.json'), migration });
    expect(list.report.recovery).toEqual(retrieve.report.recovery);
    expect(list.report.modelsMetadata.swaps.map((s: any) => s.reconciliation)).toEqual(['corroborated', 'artifact_only', 'artifact_only']);
    expect(retrieve.report.modelsMetadata.swaps.map((s: any) => s.reconciliation)).toEqual(['corroborated', 'artifact_only', 'artifact_only']);
    expect(retrieve.report.modelsMetadata.capture.scope).toEqual({ kind: 'retrieve', model: 'synthetic-source' });
  });
  it.each(['wrong-model', 'duplicate', 'azure-provider', 'proxy-surface', 'partner-document', 'fine-tune'])('cannot cross-bind %s evidence', async (kind) => {
    const capture = fixture(kind === 'wrong-model' ? 'retrieve-date.json' : 'list-date.json'); const migration = fixture('migration.json');
    if (kind === 'wrong-model') capture.response.body.id = 'another-model';
    if (kind === 'duplicate') capture.response.body.data.push({ ...capture.response.body.data[0], shutdown_date: null });
    if (kind === 'azure-provider') capture.provider = 'azure';
    if (kind === 'proxy-surface') capture.surface = 'proxy';
    if (kind === 'partner-document') migration.migrations[0].evidence.sourceUrl = 'https://learn.microsoft.com/azure/model-retirements';
    if (kind === 'fine-tune') {
      migration.migrations[0].from = 'ft:synthetic-source:owner:suffix'; capture.response.body.data[0].id = migration.migrations[0].from;
    }
    const r = await run({ capture, migration });
    expect(r.exitCode).toBe(0); expect(['unknown', 'conflict']).toContain(swap(r).reconciliation); expect(revert(r).available).toBe(false);
    expect(r.report.verdict).toBe('verified');
  });
  it.each(['2026-10-23T23:59:59Z', '2026-10-24T00:00:00Z', '2026-10-24T00:00:01Z', '2026-10-24T00:30:00+14:00', '2026-10-23T23:30:00-12:00'])('honors UTC schedule boundaries at %s without declaring observed shutdown', async (now) => {
    const capture = fixture('list-date.json'); capture.retrievedAt = new Date(now).toISOString();
    const r = await run({ capture, now });
    expect(r.exitCode).toBe(0); expect(swap(r).reconciliation).toBe('corroborated');
    expect(revert(r).available).toBe(new Date(now).toISOString().slice(0, 10) < '2026-10-24');
    expect(r.report.recovery.caveats.join(' ')).toContain('accessibility was not observed');
    expect(r.report.modelsMetadata.evaluatedAt).toBe(new Date(now).toISOString());
  });
  it('independently withholds stale/future/conflicting captures and recovers with valid current evidence', async () => {
    for (const kind of ['stale', 'future', 'conflict', 'invalid-date', 'partial', 'truncated', 'http-failure']) {
      const capture = fixture('list-date.json');
      if (kind === 'stale') capture.retrievedAt = '2026-10-21T12:00:00Z';
      if (kind === 'future') capture.retrievedAt = '2026-10-23T12:00:01Z';
      if (kind === 'conflict') capture.response.body.data[0].shutdown_date = '2026-10-25';
      if (kind === 'invalid-date') capture.response.body.data[0].shutdown_date = '2026-02-30';
      if (kind === 'partial') capture.scope.coverage = 'partial';
      if (kind === 'truncated') capture.response.body.has_more = true;
      if (kind === 'http-failure') capture.response = { status: 404 };
      const bad = await run({ capture });
      expect(revert(bad).available, kind).toBe(false); expect(bad.exitCode, kind).toBe(0);
      expect(bad.report.modelsMetadata.artifact.registry).toEqual(fixture('migration.json').registry);
    }
    const recovered = await run(); const repeated = await run();
    expect(recovered.report).toEqual(repeated.report); expect(revert(recovered).available).toBe(true);
    expect(swap(recovered).reconciliation).toBe('corroborated');
  }, 120_000);
  it.each(['malformed', 'shape', 'bytes', 'records', 'locator', 'error-body', 'duplicate-key', 'clock', 'migration'])('refuses %s input with exit 2 and no private marker', async (kind) => {
    const capture = fixture('list-date.json'); const opts: Parameters<typeof run>[0] = { capture };
    if (kind === 'malformed') opts.rawCapture = '{"PRIVATE_BODY_MARKER":';
    if (kind === 'shape') opts.rawCapture = JSON.stringify({ schema: 'PRIVATE_BODY_MARKER' });
    if (kind === 'bytes') opts.rawCapture = ' '.repeat(1_048_577) + 'PRIVATE_BODY_MARKER';
    if (kind === 'records') capture.response.body.data = Array.from({ length: 2049 }, () => capture.response.body.data[0]);
    if (kind === 'locator') capture.sourceUrl += '?PRIVATE_BODY_MARKER';
    if (kind === 'error-body') capture.response = { status: 404, body: { error: 'PRIVATE_BODY_MARKER' } };
    if (kind === 'duplicate-key') opts.rawCapture = '{"shutdown_date":null,"shutdown_date":"PRIVATE_BODY_MARKER"}';
    if (kind === 'clock') opts.now = 'PRIVATE_BODY_MARKER';
    if (kind === 'migration') opts.rawMigration = '{"PRIVATE_BODY_MARKER":';
    const r = await run(opts);
    expect(r.exitCode).toBe(2); expect(r.stdout).toBe(''); expect(r.stderr).toContain('models metadata:');
    expect(r.stderr).not.toContain('PRIVATE_BODY_MARKER');
  });
  it.each([false, true])('refuses malformed migration rows before consuming telemetry=%s', async (fromTelemetry) => {
    const migration = fixture('migration.json'); migration.migrations = [null];
    const r = await run({ migration, ...(fromTelemetry ? { telemetry: [] } : {}) });
    expect(r.exitCode).toBe(2); expect(r.stdout).toBe('');
    expect(r.stderr).toContain('invalid_migration_swap');
  });
  it('renders a scoped human result including provenance, conflict and unauthenticated evidence', async () => {
    const capture = fixture('list-date.json'); capture.response.body.data[0].shutdown_date = null;
    const r = await run({ capture, noJson: true });
    expect(r.exitCode).toBe(0); expect(r.stdout).toContain('VERIFIED:');
    expect(r.stdout).toContain('no_announced_date → conflict'); expect(r.stdout).toContain('caller_supplied_unverified');
    expect(r.stdout).toContain('sha256:'); expect(r.stdout).toContain('do not authenticate');
    expect(r.stdout).toContain('endpoint accessibility was not observed');
  });
  it('keeps missing outcomes and malformed costs unknown, actual measured failure regressed, success/zero recovered', async () => {
    const deployedAt = Date.parse('2026-10-20T12:00:00Z');
    const rows = (fields: any, unhealthy = false) => [-1, 1].flatMap((side) => Array.from({ length: 120 }, (_, i) => ({
      timestamp: new Date(deployedAt + side * (i + 1) * 1000).toISOString(),
      model: side < 0 ? 'synthetic-source' : 'synthetic-target', requests: 1, ...fields,
      ...(unhealthy ? { status: side < 0 ? 200 : 500 } : {}),
    })));
    for (const [fields, unhealthy, expected, exit] of [
      [{ cost: '12garbage' }, false, 'inconclusive', 3],
      [{ status: 200, cost: 'unknown' }, false, 'verified', 0],
      [{ status: 200, cost: 0 }, true, 'regression', 1],
      [{ status: 200, cost: 0 }, false, 'verified', 0],
      [{ failures: 0, cost: 0 }, false, 'verified', 0],
    ] as const) {
      const telemetry = rows(fields, unhealthy);
      const control = await run({ telemetry, noMetadata: true }); const received = await run({ telemetry });
      expect(received.report.verdict).toBe(expected); expect(received.exitCode).toBe(exit);
      expect(received.report.signals).toEqual(control.report.signals); expect(control.exitCode).toBe(exit);
      const cost = received.report.signals.find((s: any) => s.signal === 'costPer1k');
      expect(cost.state).toBe(typeof fields.cost === 'number' ? 'ok' : 'not_measured');
      expect(received.report.signals.find((s: any) => s.signal === 'quality').state).toBe('not_measured');
    }
  }, 120_000);
});
