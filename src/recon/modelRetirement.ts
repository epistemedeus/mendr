import { createHash } from 'node:crypto';
import { resolveEvaluationTime, type EvaluationTimeSource } from '../audit/evaluatedAt.js';
import type { RecoverySwap } from '../assurance/recovery.js';

export const MODELS_METADATA_SCHEMA = 'mendr-models-metadata/v1';
export const MODELS_METADATA_MAX_BYTES = 1_048_576;
export const MODELS_METADATA_MAX_RECORDS = 2_048;
export const MODELS_METADATA_MAX_AGE_HOURS = 24;
const DAY = 86_400_000;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const ENDPOINT = 'https://api.openai.com/v1/models';
type ObjectValue = Record<string, unknown>;
const object = (v: unknown): v is ObjectValue => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (v: ObjectValue, k: string): boolean => Object.hasOwn(v, k);
const hash = (v: Uint8Array | string): string => `sha256:${createHash('sha256').update(v).digest('hex')}`;

/** Diagnostics deliberately contain no parser text, supplied paths, body values or error bodies. */
export class ModelsMetadataError extends Error {
  constructor(public readonly code: string) {
    super(`models metadata: ${code}; use a bounded mendr-models-metadata/v1 capture and a mendr-migration/v1 artifact`);
  }
}
const refuse = (code: string): never => { throw new ModelsMetadataError(code); };
function exactKeys(v: ObjectValue, allowed: string[]): boolean {
  return Object.keys(v).every((k) => allowed.includes(k));
}
function calendarDate(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  try { return resolveEvaluationTime({ MENDR_EVALUATED_AT: v }).at.toISOString().slice(0, 10) === v; }
  catch { return false; }
}
function instant(v: unknown): Date | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(v)) return null;
  try { return resolveEvaluationTime({ MENDR_EVALUATED_AT: v }).at; }
  catch { return null; }
}

// JSON.parse accepts duplicate keys with last-wins semantics. Check keys before parsing;
// JSON.parse still owns the grammar. Depth and byte limits bound this lexical pass.
function checkJsonKeys(text: string): void {
  const stack: { keys: Set<string> | null; expectingKey: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      const start = i;
      for (i++; i < text.length; i++) {
        if (text[i] === '\\') { i++; continue; }
        if (text[i] === '"') break;
      }
      const top = stack.at(-1);
      if (top?.keys && top.expectingKey) {
        let key: string;
        try { key = JSON.parse(text.slice(start, i + 1)); } catch { return refuse('malformed_json'); }
        if (top.keys.has(key)) refuse('duplicate_json_key');
        top.keys.add(key);
        top.expectingKey = false;
      }
    } else if (ch === '{' || ch === '[') {
      stack.push({ keys: ch === '{' ? new Set() : null, expectingKey: ch === '{' });
      if (stack.length > 32) refuse('excessive_json_depth');
    } else if (ch === '}' || ch === ']') stack.pop();
    else if (ch === ',' && stack.at(-1)?.keys) stack.at(-1)!.expectingKey = true;
  }
}

type Field = { state: 'scheduled'; shutdownDate: string } | { state: 'no_announced_date' | 'not_reported' | 'invalid'; shutdownDate: null };
export interface ModelsCapture {
  digest: string;
  provider: string;
  surface: string;
  sourceUrl: string;
  retrievedAt: string;
  scope: { kind: 'list'; coverage: 'complete' | 'partial' } | { kind: 'retrieve'; model: string };
  responseStatus: number;
  recordCount: number;
  duplicateCount: number;
  reasons: string[];
  records: ReadonlyMap<string, Field>;
}

/** Parse supplied response bytes only. Does not fetch, authenticate or normalize IDs. */
export function parseModelsMetadata(bytes: Uint8Array | string): ModelsCapture {
  const raw = typeof bytes === 'string' ? Buffer.from(bytes, 'utf8') : bytes;
  if (raw.byteLength > MODELS_METADATA_MAX_BYTES) refuse('excessive_bytes');
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(raw); }
  catch { return refuse('invalid_utf8'); }
  checkJsonKeys(text);
  let v: unknown;
  try { v = JSON.parse(text); } catch { return refuse('malformed_json'); }
  if (!object(v) || !exactKeys(v, ['schema', 'provider', 'surface', 'sourceUrl', 'retrievedAt', 'scope', 'response']) ||
      v.schema !== MODELS_METADATA_SCHEMA || typeof v.provider !== 'string' || !ID.test(v.provider) ||
      typeof v.surface !== 'string' || !ID.test(v.surface) || !instant(v.retrievedAt) || !object(v.scope) || !object(v.response)) {
    return refuse('invalid_envelope');
  }
  let scope: ModelsCapture['scope'];
  if (v.scope.kind === 'list' && exactKeys(v.scope, ['kind', 'coverage']) && ['complete', 'partial'].includes(v.scope.coverage as string)) {
    scope = { kind: 'list', coverage: v.scope.coverage as 'complete' | 'partial' };
  } else if (v.scope.kind === 'retrieve' && exactKeys(v.scope, ['kind', 'model']) && typeof v.scope.model === 'string' && ID.test(v.scope.model)) {
    scope = { kind: 'retrieve', model: v.scope.model };
  } else return refuse('invalid_scope');
  const expectedUrl = scope.kind === 'list' ? ENDPOINT : `${ENDPOINT}/${encodeURIComponent(scope.model)}`;
  // Unsupported source locators never get echoed (userinfo/query could be private).
  if (v.sourceUrl !== expectedUrl) refuse('source_locator_mismatch');
  if (!exactKeys(v.response, ['status', 'body']) || !Number.isInteger(v.response.status) || (v.response.status as number) < 100 || (v.response.status as number) > 599) refuse('invalid_response');
  if (v.response.status !== 200 && own(v.response, 'body')) refuse('error_body_not_allowed');
  const reasons: string[] = [];
  if (v.provider !== 'openai') reasons.push('unsupported_provider');
  if (v.surface !== 'direct') reasons.push('unsupported_surface');
  if (scope.kind === 'list' && scope.coverage !== 'complete') reasons.push('partial_capture');
  const records = new Map<string, Field>();
  let rows: unknown[] = [];
  if (v.response.status !== 200) reasons.push('http_failure');
  else if (scope.kind === 'list') {
    const body = v.response.body;
    if (!object(body) || body.object !== 'list' || !Array.isArray(body.data)) reasons.push('invalid_list_body');
    else {
      if (body.data.length > MODELS_METADATA_MAX_RECORDS) refuse('excessive_records');
      rows = body.data;
      if ((own(body, 'has_more') && body.has_more !== false) ||
          (own(body, 'next') && body.next !== null) || (own(body, 'next_page') && body.next_page !== null) ||
          (own(body, 'next_cursor') && body.next_cursor !== null)) reasons.push('truncated_capture');
    }
  } else rows = [v.response.body];
  let duplicateCount = 0;
  for (const row of rows) {
    if (!object(row) || row.object !== 'model' || typeof row.id !== 'string' || !ID.test(row.id)) {
      reasons.push('invalid_model_record');
      continue;
    }
    if (scope.kind === 'retrieve' && row.id !== scope.model) reasons.push('retrieve_model_mismatch');
    const field: Field = !own(row, 'shutdown_date') ? { state: 'not_reported', shutdownDate: null }
      : row.shutdown_date === null ? { state: 'no_announced_date', shutdownDate: null }
      : calendarDate(row.shutdown_date) ? { state: 'scheduled', shutdownDate: row.shutdown_date }
      : { state: 'invalid', shutdownDate: null };
    if (field.state === 'invalid') reasons.push('invalid_shutdown_date');
    const previous = records.get(row.id);
    if (previous) {
      duplicateCount++;
      if (previous.state !== field.state || previous.shutdownDate !== field.shutdownDate) reasons.push('duplicate_conflicting_model');
    } else records.set(row.id, field);
  }
  return {
    digest: hash(raw), provider: v.provider, surface: v.surface, sourceUrl: expectedUrl,
    retrievedAt: v.retrievedAt as string, scope, responseStatus: v.response.status as number,
    recordCount: rows.length, duplicateCount, records, reasons: [...new Set(reasons)],
  };
}

interface ArtifactSwap {
  provider: string; from: string; to: string;
  evidence: { shutdownDate: unknown; sourceUrl: string | null; entryId: string | null; lifecycle: string | null; replacementVerdict: string | null };
}
export interface RetirementReconciliation {
  provider: string; from: string; to: string;
  artifact: ArtifactSwap['evidence'] & { dateState: 'scheduled' | 'undated' | 'invalid' };
  metadata: { state: Field['state'] | 'missing_model' | 'not_in_scope' | 'unusable'; shutdownDate: string | null };
  reconciliation: 'corroborated' | 'metadata_schedule' | 'artifact_only' | 'no_announced_date' | 'unknown' | 'conflict';
  reasons: string[];
  effectiveSchedule: { source: 'corroborated' | 'metadata' | 'artifact' | 'none'; shutdownDate: string | null };
}
export interface ModelRetirementReport {
  schema: 'mendr-model-retirement/v1';
  evaluatedAt: string;
  evaluationTimeSource: EvaluationTimeSource;
  capture: Omit<ModelsCapture, 'records'> & {
    authentication: 'caller_supplied_unverified'; ageHours: number; maxAgeHours: number;
    freshness: 'fresh' | 'stale' | 'future';
  };
  artifact: { digest: string; generatedAt: string | null; ageDays: number | null; registry: unknown };
  swaps: RetirementReconciliation[];
  limits: string[];
}

function safeUrl(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string' || v.length > 2048) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash ? v : null;
  } catch { return null; }
}
function directDocument(v: string | null): boolean {
  if (v === null) return true;
  return ['developers.openai.com', 'platform.openai.com', 'openai.com'].includes(new URL(v).hostname);
}
function artifactSwaps(v: unknown): { raw: ObjectValue; swaps: ArtifactSwap[] } {
  if (!object(v) || v.schema !== 'mendr-migration/v1' || !Array.isArray(v.migrations) || v.migrations.length > MODELS_METADATA_MAX_RECORDS) return refuse('invalid_migration');
  const swaps = v.migrations.map((m): ArtifactSwap => {
    if (!object(m) || typeof m.provider !== 'string' || !ID.test(m.provider) || typeof m.from !== 'string' || !ID.test(m.from) || typeof m.to !== 'string' || !ID.test(m.to) ||
        (m.evidence !== undefined && !object(m.evidence))) return refuse('invalid_migration_swap');
    const e = (m.evidence ?? {}) as ObjectValue;
    if (e.shutdownDate !== undefined && e.shutdownDate !== null && (typeof e.shutdownDate !== 'string' || e.shutdownDate.length > 40)) return refuse('invalid_artifact_date');
    if (e.sourceUrl !== undefined && e.sourceUrl !== null && safeUrl(e.sourceUrl) === null) return refuse('invalid_artifact_source');
    return {
      provider: m.provider, from: m.from, to: m.to,
      evidence: {
        shutdownDate: e.shutdownDate ?? null, sourceUrl: safeUrl(e.sourceUrl),
        entryId: typeof e.entryId === 'string' && ID.test(e.entryId) ? e.entryId : null,
        lifecycle: e.lifecycle === 'retired' || e.lifecycle === 'deprecated' ? e.lifecycle : null,
        replacementVerdict: ['verified', 'unverified', 'quarantined'].includes(e.replacementVerdict as string) ? e.replacementVerdict as string : null,
      },
    };
  });
  return { raw: v, swaps };
}

/** Reconcile only supplied facts. Returned swaps feed the existing recoveryPlan, never registry gates. */
export function reconcileModelsMetadata(
  capture: ModelsCapture, migration: unknown, now: Date, evaluationTimeSource: EvaluationTimeSource,
  artifactDigest: string,
): { report: ModelRetirementReport; recoverySwaps: RecoverySwap[] } {
  if (!Number.isFinite(now.getTime())) return refuse('invalid_evaluation_time');
  const { raw, swaps } = artifactSwaps(migration);
  const ageHours = (now.getTime() - instant(capture.retrievedAt)!.getTime()) / 3_600_000;
  const freshness = ageHours < 0 ? 'future' : ageHours > MODELS_METADATA_MAX_AGE_HOURS ? 'stale' : 'fresh';
  const captureReasons = [...capture.reasons, ...(freshness === 'fresh' ? [] : [`${freshness}_capture`])];
  const artifactDates = new Map<string, Set<unknown>>();
  for (const m of swaps) {
    const key = `${m.provider}\0${m.from}`;
    if (!artifactDates.has(key)) artifactDates.set(key, new Set());
    artifactDates.get(key)!.add(m.evidence.shutdownDate);
  }
  const reconciled = swaps.map((m): RetirementReconciliation => {
    const dateState = m.evidence.shutdownDate === null ? 'undated' : calendarDate(m.evidence.shutdownDate) ? 'scheduled' : 'invalid';
    const artifactDate = dateState === 'scheduled' ? m.evidence.shutdownDate as string : null;
    const r: RetirementReconciliation = {
      provider: m.provider, from: m.from, to: m.to, artifact: { ...m.evidence, dateState },
      metadata: { state: 'not_in_scope', shutdownDate: null },
      reconciliation: artifactDate ? 'artifact_only' : 'unknown', reasons: [],
      effectiveSchedule: { source: artifactDate ? 'artifact' : 'none', shutdownDate: artifactDate },
    };
    const block = (state: 'unknown' | 'conflict', reasons: string[]): RetirementReconciliation => {
      r.reconciliation = state;
      r.reasons.push(...reasons);
      r.effectiveSchedule = { source: 'none', shutdownDate: null };
      return r;
    };
    if (dateState === 'invalid') return block('unknown', ['invalid_artifact_date']);
    if (artifactDates.get(`${m.provider}\0${m.from}`)!.size > 1) return block('conflict', ['conflicting_artifact_dates']);
    // Metadata for one provider/retrieved model cannot change other swaps' artifact schedules.
    if (m.provider !== 'openai' || (capture.scope.kind === 'retrieve' && capture.scope.model !== m.from)) {
      r.reasons.push(m.provider !== 'openai' ? 'unsupported_migration_provider' : 'outside_retrieve_scope');
      return r;
    }
    const field = capture.records.get(m.from);
    r.metadata = field ? { ...field } : { state: 'missing_model', shutdownDate: null };
    if (captureReasons.length) {
      r.metadata.state = 'unusable';
      return block(captureReasons.includes('duplicate_conflicting_model') ? 'conflict' : 'unknown', captureReasons);
    }
    if (/^(?:ft:|ft-)/.test(m.from) || m.from.includes(':')) return block('unknown', ['unsupported_fine_tune']);
    if (!directDocument(m.evidence.sourceUrl)) return block('unknown', ['ambiguous_artifact_surface']);
    if (!field) { r.reasons.push('model_missing_in_capture_scope'); return r; }
    if (field.state === 'not_reported') { r.reasons.push('shutdown_field_not_reported'); return r; }
    if (field.state === 'no_announced_date') {
      if (artifactDate) return block('conflict', ['null_conflicts_with_artifact_date']);
      r.reconciliation = 'no_announced_date';
      r.reasons.push('no_announced_date_at_capture');
      return r;
    }
    if (field.state !== 'scheduled') return block('unknown', ['invalid_shutdown_date']);
    if (artifactDate && artifactDate !== field.shutdownDate) return block('conflict', ['different_shutdown_dates']);
    r.reconciliation = artifactDate ? 'corroborated' : 'metadata_schedule';
    r.effectiveSchedule = { source: artifactDate ? 'corroborated' : 'metadata', shutdownDate: field.shutdownDate };
    r.reasons.push(artifactDate ? 'same_shutdown_date' : 'fresh_exact_metadata_schedule');
    return r;
  });
  const { records: _records, ...provenance } = capture;
  const generatedAt = instant(raw.generatedAt)?.toISOString() ?? null;
  // Preserve the artifact's registry facts without treating capture age as registry age.
  const reg = raw.registry;
  const registry = object(reg) ? Object.fromEntries(
    ['source', 'version', 'publishedAt', 'ageDays', 'maxAgeDays', 'freshness']
      .filter((k) => ['string', 'number'].includes(typeof reg[k]) || reg[k] === null)
      .map((k) => [k, reg[k]]),
  ) : null;
  return {
    report: {
      schema: 'mendr-model-retirement/v1', evaluatedAt: now.toISOString(), evaluationTimeSource,
      capture: { ...provenance, authentication: 'caller_supplied_unverified', ageHours, maxAgeHours: MODELS_METADATA_MAX_AGE_HOURS, freshness },
      artifact: { digest: artifactDigest, generatedAt, ageDays: generatedAt ? (now.getTime() - Date.parse(generatedAt)) / DAY : null, registry },
      swaps: reconciled,
      limits: [
        'Caller-supplied capture; its official URL, digest and timestamp do not authenticate its contents.',
        'Direct OpenAI schedules for exact IDs only; migration artifacts do not record the serving endpoint. No partner, proxy, alias, snapshot or fine-tune authority is inherited.',
        'A date is a retirement schedule, including dates in the past; endpoint accessibility was not observed. Null, omission and missing models do not prove availability or a safe revert.',
        'Capture freshness is independent of the artifact and registry; artifact-only dates are not freshened.',
        'No replacement, workload quality, usage, cost, verification switch, lifecycle or write authority is established by Models metadata.',
      ],
    },
    recoverySwaps: reconciled.map((r) => ({ from: r.from, to: r.to, shutdownDate: r.effectiveSchedule.shutdownDate })),
  };
}

export function renderModelsMetadata(report: ModelRetirementReport): string[] {
  return [
    '', `Models metadata evidence (${report.capture.authentication}; ${report.capture.freshness}, max ${report.capture.maxAgeHours}h):`,
    `  ${report.capture.sourceUrl} retrieved ${report.capture.retrievedAt}; ${report.capture.digest}`,
    `  evaluated ${report.evaluatedAt} (${report.evaluationTimeSource}); capture age ${report.capture.ageHours}h`,
    `  migration ${report.artifact.digest}; generated ${report.artifact.generatedAt ?? 'unknown'}; registry facts retained in JSON`,
    ...report.swaps.map((r) => `  ${r.provider}:${r.from}: ${r.metadata.state} → ${r.reconciliation}; artifact ${r.artifact.shutdownDate ?? 'undated'}, metadata ${r.metadata.shutdownDate ?? 'undated'}; recovery schedule ${r.effectiveSchedule.shutdownDate ?? 'unknown'} (${r.effectiveSchedule.source}); ${r.reasons.join(', ')}`),
    ...report.limits.map((l) => `  note: ${l}`),
  ];
}
