import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { recoveryPlan } from '../assurance/recovery.js';
import { MODELS_METADATA_MAX_BYTES, MODELS_METADATA_MAX_RECORDS, parseModelsMetadata, reconcileModelsMetadata } from './modelRetirement.js';

const NOW = new Date('2026-10-23T12:00:00Z');
const ROOT = new URL('../../qualification/root4648/fixtures/', import.meta.url);
const original = (name: string): any => JSON.parse(readFileSync(new URL(name, ROOT), 'utf8'));
const capture = (): any => original('list-date.json');
const migration = (): any => original('migration.json');
const row = (id = 'synthetic-source', value: unknown = '2026-10-24'): any => ({ object: 'model', id, shutdown_date: value });
function receive(c = capture(), m = migration(), now = NOW) {
  return reconcileModelsMetadata(parseModelsMetadata(JSON.stringify(c)), m, now, 'override', `sha256:${'a'.repeat(64)}`);
}
function first(c = capture(), m = migration(), now = NOW) { return receive(c, m, now).report.swaps[0]; }
function revert(c = capture(), m = migration(), now = NOW) { return recoveryPlan(receive(c, m, now).recoverySwaps, now).options[0]; }

describe('supplied Models metadata, exact scoped reconciliation', () => {
  it('corroborates an exact schedule and independently reports unauthenticated provenance and stale artifact registry', () => {
    const c = capture(); const m = migration(); const before = JSON.stringify(m);
    const { report } = receive(c, m);
    expect(report.capture).toMatchObject({ authentication: 'caller_supplied_unverified', freshness: 'fresh', ageHours: 0, maxAgeHours: 24, recordCount: 1 });
    expect(report.capture.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(report.artifact).toMatchObject({ ageDays: 22.5, registry: m.registry });
    expect(report.swaps[0]).toMatchObject({ reconciliation: 'corroborated', effectiveSchedule: { source: 'corroborated', shutdownDate: '2026-10-24' } });
    expect(JSON.stringify(m)).toBe(before);
    expect(revert(c, m)).toMatchObject({ available: true });
    expect(revert(c, m).detail).toContain('Verify current accessibility');
    expect(report.limits.join(' ')).toContain('do not authenticate');
  });
  it('supplies a bounded schedule to an undated artifact without changing verification, lifecycle or replacement', () => {
    const m = migration(); m.migrations[0].evidence.shutdownDate = null;
    const frozen = JSON.stringify(m);
    const r = first(capture(), m);
    expect(r).toMatchObject({ reconciliation: 'metadata_schedule', artifact: { shutdownDate: null, lifecycle: 'deprecated', replacementVerdict: 'unverified' }, effectiveSchedule: { source: 'metadata', shutdownDate: '2026-10-24' } });
    expect(JSON.stringify(m)).toBe(frozen);
    expect(revert(capture(), m).available).toBe(true);
  });
  it('agrees on equivalent list and retrieve objects without equating their scope provenance', () => {
    const list = receive(); const retrieve = receive(original('retrieve-date.json'));
    expect(list.recoverySwaps).toEqual(retrieve.recoverySwaps);
    expect(list.report.swaps).toEqual(retrieve.report.swaps);
    expect(list.report.capture.scope).not.toEqual(retrieve.report.capture.scope);
    expect(list.report.capture.digest).not.toBe(retrieve.report.capture.digest);
  });
  it.each([
    ['null', row('synthetic-source', null), 'no_announced_date', 'conflict', 'none'],
    ['omitted', { object: 'model', id: 'synthetic-source' }, 'not_reported', 'artifact_only', 'artifact'],
    ['missing', row('other-exact-model'), 'missing_model', 'artifact_only', 'artifact'],
  ])('keeps %s distinct against a dated artifact', (_, value, state, reconciliation, source) => {
    const c = capture(); c.response.body.data = [value];
    expect(first(c)).toMatchObject({ metadata: { state }, reconciliation, effectiveSchedule: { source } });
    if (state === 'no_announced_date') expect(revert(c).available).toBe(false);
  });
  it.each(['null', 'omitted', 'missing'])('%s alone never proves a safe revert', (kind) => {
    const c = capture(); const m = migration(); m.migrations[0].evidence.shutdownDate = null;
    c.response.body.data = kind === 'null' ? [row('synthetic-source', null)] : kind === 'omitted' ? [{ object: 'model', id: 'synthetic-source' }] : [];
    expect(revert(c, m).available).toBe(false);
    expect(first(c, m).metadata.state).toBe(kind === 'null' ? 'no_announced_date' : kind === 'omitted' ? 'not_reported' : 'missing_model');
  });
  it('null cannot erase an expired artifact date', () => {
    const c = capture(); const m = migration(); c.response.body.data = [row('synthetic-source', null)]; m.migrations[0].evidence.shutdownDate = '2026-10-22';
    expect(first(c, m)).toMatchObject({ reconciliation: 'conflict', artifact: { shutdownDate: '2026-10-22' }, metadata: { state: 'no_announced_date' } });
    expect(revert(c, m).available).toBe(false);
  });
  it('retains both differing dates and refuses to select either as recovery assurance', () => {
    const c = capture(); c.response.body.data = [row('synthetic-source', '2027-01-01')];
    expect(first(c)).toMatchObject({ reconciliation: 'conflict', artifact: { shutdownDate: '2026-10-24' }, metadata: { shutdownDate: '2027-01-01' }, effectiveSchedule: { source: 'none', shutdownDate: null }, reasons: ['different_shutdown_dates'] });
    expect(revert(c).available).toBe(false);
  });
  it.each([
    ['gpt-example', 'gpt-example-2026-10-01'], ['gpt-example-2026-10-01', 'gpt-example'],
    ['gpt-example', 'ft:gpt-example:customer:custom'], ['exact-model', 'EXACT-model'],
  ])('never cross-binds %s to %s', (from, id) => {
    const m = migration(); m.migrations[0].from = from; m.migrations[0].evidence.shutdownDate = null;
    const c = capture(); c.response.body.data = [row(id)];
    expect(first(c, m)).toMatchObject({ metadata: { state: 'missing_model' }, reconciliation: 'unknown', effectiveSchedule: { shutdownDate: null } });
  });
  it('allows only exact snapshot binding and refuses even exact fine-tune scope', () => {
    const m = migration(); m.migrations[0].from = 'gpt-example-2026-10-01';
    const c = capture(); c.response.body.data = [row(m.migrations[0].from)];
    expect(first(c, m).reconciliation).toBe('corroborated');
    for (const id of ['ft:gpt-example:owner:suffix', 'ft-gpt-example']) {
      m.migrations[0].from = id; c.response.body.data = [row(id)];
      expect(first(c, m).reasons).toContain('unsupported_fine_tune');
      expect(revert(c, m).available).toBe(false);
    }
  });
  it('preserves unrelated swaps and all target IDs without a replacement inference', () => {
    const m = migration();
    m.migrations.push({ ...structuredClone(m.migrations[0]), from: 'unrelated-openai' });
    m.migrations.push({ ...structuredClone(m.migrations[0]), provider: 'anthropic', from: 'synthetic-source' });
    const c = original('retrieve-date.json');
    const r = receive(c, m);
    expect(r.report.swaps.map((s) => s.reconciliation)).toEqual(['corroborated', 'artifact_only', 'artifact_only']);
    expect(r.recoverySwaps).toEqual(m.migrations.map((s: any) => ({ from: s.from, to: s.to, shutdownDate: s.evidence.shutdownDate })));
  });
  it('does not accept a retrieve body for the wrong declared exact model', () => {
    const c = original('retrieve-date.json'); c.response.body.id = 'other-model';
    expect(first(c).reasons).toContain('retrieve_model_mismatch');
    expect(revert(c).available).toBe(false);
  });
  it.each([404, 401, 429, 500])('retains HTTP %s as failure evidence without inventing a date', (status) => {
    const c = original('retrieve-date.json'); c.response = { status };
    const r = receive(c);
    expect(r.report.capture.responseStatus).toBe(status);
    expect(r.report.swaps[0]).toMatchObject({ reconciliation: 'unknown', metadata: { state: 'unusable' }, reasons: ['http_failure'] });
    expect(revert(c).available).toBe(false);
  });
  it.each([['provider', 'azure'], ['surface', 'azure'], ['surface', 'proxy']])('refuses %s=%s authority even with an official locator and exact ID', (field, value) => {
    const c = capture(); c[field] = value;
    expect(first(c).reconciliation).toBe('unknown');
    expect(revert(c).available).toBe(false);
  });
  it('keeps partner document facts separate from the direct schedule', () => {
    const m = migration(); m.migrations[0].evidence.sourceUrl = 'https://learn.microsoft.com/azure/ai-services/openai/concepts/model-retirements';
    expect(first(capture(), m).reasons).toContain('ambiguous_artifact_surface');
    expect(revert(capture(), m).available).toBe(false);
  });
  it.each([
    ['2026-10-22T12:00:00Z', 'fresh', true],
    ['2026-10-22T11:59:59Z', 'stale', false],
    ['2026-10-23T12:00:01Z', 'future', false],
    ['2026-10-23T14:00:00+02:00', 'fresh', true],
  ])('grades retrieval %s independently as %s', (time, freshness, available) => {
    const c = capture(); c.retrievedAt = time;
    const r = receive(c);
    expect(r.report.capture.freshness).toBe(freshness);
    expect(revert(c).available).toBe(available);
    expect(r.report.artifact.registry).toEqual(migration().registry);
    if (!available) expect(r.report.swaps[0].reasons).toContain(`${freshness}_capture`);
  });
  it.each([
    ['2026-10-23T23:59:59Z', true], ['2026-10-24T00:00:00Z', false],
    ['2026-10-24T00:00:01Z', false], ['2026-10-24T00:30:00+14:00', true],
    ['2026-10-23T23:30:00-12:00', false],
  ])('uses the existing UTC schedule rule at %s without observing accessibility', (clock, available) => {
    const now = new Date(clock); const c = capture(); c.retrievedAt = now.toISOString();
    expect(revert(c, migration(), now).available).toBe(available);
    expect(first(c, migration(), now).metadata.state).toBe('scheduled');
    expect(recoveryPlan(receive(c, migration(), now).recoverySwaps, now).caveats.join(' ')).toContain('accessibility was not observed');
  });
  it.each(['2026-02-30', '2025-02-29', '2026-13-01', '2026-00-12', '2026-10-24T00:00:00Z', '', 42, false])('does not normalize an invalid shutdown date %s', (date) => {
    const c = capture(); c.response.body.data = [row('synthetic-source', date)];
    expect(first(c).reasons).toContain('invalid_shutdown_date');
    expect(revert(c).available).toBe(false);
  });
  it.each([
    ['stale', 'null', 'no_announced_date'], ['stale', 'omitted', 'not_reported'], ['stale', 'missing', 'missing_model'],
    ['future', 'null', 'no_announced_date'], ['future', 'omitted', 'not_reported'], ['future', 'missing', 'missing_model'],
  ])('preserves supplied field facts under %s %s capture grading', (grade, kind, state) => {
    const c = capture(); c.retrievedAt = grade === 'stale' ? '2026-10-21T12:00:00Z' : '2026-10-23T12:00:01Z';
    if (kind === 'null') c.response.body.data[0].shutdown_date = null;
    if (kind === 'omitted') delete c.response.body.data[0].shutdown_date;
    if (kind === 'missing') c.response.body.data = [];
    expect(first(c)).toMatchObject({ metadata: { state }, reconciliation: 'unknown', effectiveSchedule: { source: 'none', shutdownDate: null } });
    expect(first(c).reasons).toContain(`${grade}_capture`);
    expect(revert(c).available).toBe(false);
  });
  it('preserves supplied field facts when artifact dates are invalid or conflicting', () => {
    const m = migration(); m.migrations[0].evidence.shutdownDate = 'not-a-date';
    expect(first(capture(), m)).toMatchObject({ metadata: { state: 'scheduled', shutdownDate: '2026-10-24' }, reconciliation: 'unknown' });
    m.migrations[0].evidence.shutdownDate = '2026-10-24'; m.migrations.push(structuredClone(m.migrations[0]));
    m.migrations[1].evidence.shutdownDate = '2026-10-25';
    for (const r of receive(capture(), m).report.swaps) expect(r).toMatchObject({ metadata: { state: 'scheduled', shutdownDate: '2026-10-24' }, reconciliation: 'conflict' });
  });
  it('accepts a real leap date as a schedule', () => {
    const c = capture(); const m = migration(); c.response.body.data = [row('synthetic-source', '2028-02-29')]; m.migrations[0].evidence.shutdownDate = null;
    expect(first(c, m).effectiveSchedule.shutdownDate).toBe('2028-02-29');
  });
  it.each(['2026-02-30T12:00:00Z', '2026-10-23T12:00:00', '2026-10-23', '2026-10-23T24:00:00Z', '2026-10-23T12:00:00+25:00'])('refuses ambiguous/invalid retrieval time %s', (time) => {
    const c = capture(); c.retrievedAt = time;
    expect(() => receive(c)).toThrow(/invalid_envelope/);
  });
  it('identical duplicates are visible; differing duplicates are conflicted regardless of order', () => {
    const c = capture(); c.response.body.data = [row(), row()];
    expect(receive(c).report.capture.duplicateCount).toBe(1);
    expect(first(c).reconciliation).toBe('corroborated');
    for (const values of [[row(), row('synthetic-source', null)], [row('synthetic-source', null), row()]]) {
      c.response.body.data = values;
      expect(first(c).reconciliation).toBe('conflict');
      expect(first(c).reasons).toContain('duplicate_conflicting_model');
      expect(revert(c).available).toBe(false);
    }
  });
  it.each(['partial', 'truncated', 'malformed-row', 'malformed-body'])('withholds assurance on %s evidence, even alongside an exact valid row', (kind) => {
    const c = capture();
    if (kind === 'partial') c.scope.coverage = 'partial';
    if (kind === 'truncated') c.response.body.has_more = true;
    if (kind === 'malformed-row') c.response.body.data.push({ error: 'PRIVATE_BODY_MARKER' });
    if (kind === 'malformed-body') c.response.body = [];
    expect(first(c).reconciliation).toBe('unknown');
    expect(revert(c).available).toBe(false);
    expect(JSON.stringify(receive(c).report)).not.toContain('PRIVATE_BODY_MARKER');
  });
  it('does not choose a convenient artifact date from conflicting duplicate migrations', () => {
    const m = migration(); m.migrations.push(structuredClone(m.migrations[0])); m.migrations[1].evidence.shutdownDate = '2026-10-25';
    expect(receive(capture(), m).report.swaps.every((s) => s.reconciliation === 'conflict')).toBe(true);
    expect(revert(capture(), m).available).toBe(false);
  });
  it('invalid artifact dates stay explicit unknown rather than lexical future dates', () => {
    const m = migration(); m.migrations[0].evidence.shutdownDate = 'not-a-date';
    expect(first(capture(), m)).toMatchObject({ artifact: { dateState: 'invalid' }, reconciliation: 'unknown', reasons: ['invalid_artifact_date'] });
    expect(revert(capture(), m).available).toBe(false);
  });
  it('recovers deterministically from stale and conflicting captures without cache or mutation', () => {
    const good = capture(); const bad = capture(); const expected = receive(good); bad.retrievedAt = '2026-10-01T00:00:00Z';
    expect(first(bad).reconciliation).toBe('unknown');
    expect(receive(good)).toEqual(expected);
    bad.retrievedAt = good.retrievedAt; bad.response.body.data = [row('synthetic-source', null)];
    expect(first(bad).reconciliation).toBe('conflict');
    expect(receive(good)).toEqual(expected);
  });
});

describe('bounded capture intake diagnostics', () => {
  it.each(['{PRIVATE_BODY_MARKER', 'null', '[]'])('refuses malformed JSON/envelope with safe errors: %s', (raw) => {
    try { parseModelsMetadata(raw); throw new Error('should refuse'); }
    catch (e) { expect(String(e)).toMatch(/malformed_json|invalid_envelope/); expect(String(e)).not.toContain('PRIVATE_BODY_MARKER'); }
  });
  it('refuses duplicate JSON keys including escaped equivalent keys', () => {
    for (const raw of ['{"schema":1,"schema":2}', '{"shutdown_date":null,"shutdown_\\u0064ate":"2026-10-24"}']) {
      expect(() => parseModelsMetadata(raw)).toThrow(/duplicate_json_key/);
    }
  });
  it('bounds bytes, depth, UTF-8 and record count', () => {
    expect(() => parseModelsMetadata(' '.repeat(MODELS_METADATA_MAX_BYTES + 1))).toThrow(/excessive_bytes/);
    expect(() => parseModelsMetadata('['.repeat(33))).toThrow(/excessive_json_depth/);
    expect(() => parseModelsMetadata(new Uint8Array([0xff]))).toThrow(/invalid_utf8/);
    const c = capture(); c.response.body.data = Array.from({ length: MODELS_METADATA_MAX_RECORDS + 1 }, () => row());
    expect(() => receive(c)).toThrow(/excessive_records/);
  });
  it.each(['https://proxy.example/v1/models', 'https://api.openai.com/v1/models?key=PRIVATE_BODY_MARKER', 'https://PRIVATE_BODY_MARKER@api.openai.com/v1/models', 'https://api.openai.com/v1/models/other'])('refuses an unbound locator without echoing it: %s', (url) => {
    const c = capture(); c.sourceUrl = url;
    expect(() => receive(c)).toThrow(/source_locator_mismatch/);
    try { receive(c); } catch (e) { expect(String(e)).not.toContain('PRIVATE_BODY_MARKER'); }
  });
  it('refuses error bodies, headers and unknown envelope keys without echoing private values', () => {
    const error = capture(); error.response = { status: 404, body: { message: 'PRIVATE_BODY_MARKER' } };
    const headers = capture(); headers.headers = { authorization: 'PRIVATE_BODY_MARKER' };
    const extra = capture(); extra.prompt = 'PRIVATE_BODY_MARKER';
    for (const c of [error, headers, extra]) {
      try { receive(c); throw new Error('should refuse'); }
      catch (e) { expect(String(e)).toMatch(/error_body_not_allowed|invalid_envelope/); expect(String(e)).not.toContain('PRIVATE_BODY_MARKER'); }
    }
  });
});
