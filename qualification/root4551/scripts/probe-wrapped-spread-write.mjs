// ROOT4551 receiving of the real disposable write boundary. No live provider.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [mendrArg, outArg] = process.argv.slice(2);
const mendr = resolve(mendrArg), output = resolve(outArg);
const { runMigration } = await import(pathToFileURL(join(mendr, 'dist/migrate/migrate.js')));
const { autoApplyVerification } = await import(pathToFileURL(join(mendr, 'dist/usage/llmRegistry.js')));
const registry = [{ provider: 'openai', kind: 'model_id', deprecated: 'gpt-4-0613', replacement: 'gpt-5.6-sol', verification: autoApplyVerification() }];
const scratch = mkdtempSync(join(tmpdir(), 'root4551-spread-'));
const results = [];
const hash = text => createHash('sha256').update(text).digest('hex');
try {
  for (const name of ['fallback', 'conditional', 'explicit']) {
    const spread = name !== 'explicit';
    const dir = join(scratch, name);
    mkdirSync(join(dir, 'src'), { recursive: true });
    mkdirSync(join(dir, 'node_modules/openai'), { recursive: true });
    const body = '{ model: "gpt-4-0613", messages: []' + (spread ? ', ...options' : '') + ' }';
    const request = name === 'fallback' ? `override ?? ${body}` : name === 'conditional' ? `useOptions ? ${body} : { model: "gpt-5.6-sol", messages: [] }` : body;
    const source = 'import OpenAI from "openai"; const client = new OpenAI();\n' +
      `export async function ask(options: object, override?: {model: string; messages: unknown[]}, useOptions = true) { return client.chat.completions.create(${request}); }`;
    const file = join(dir, 'src/app.ts');
    writeFileSync(file, source);
    writeFileSync(join(dir, 'package.json'), '{"name":"root4551-synthetic"}');
    writeFileSync(join(dir, 'node_modules/openai/package.json'), '{"name":"openai","types":"index.d.ts"}');
    writeFileSync(join(dir, 'node_modules/openai/index.d.ts'), 'declare class OpenAI { chat: { completions: { create(body: {model: string; messages: unknown[]}): Promise<unknown> } } }; export default OpenAI;');
    writeFileSync(join(dir, 'eval.cjs'), 'require("node:assert/strict").ok(true);');
    const report = await runMigration(dir, registry, { write: true, evalCommand: 'node eval.cjs' });
    const after = readFileSync(file, 'utf8');
    results.push({ name, before: source, after,
      beforeSha256: hash(source), afterSha256: hash(after), unchanged: source === after, report });
  }
} finally {
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, 'spread-write-cases.json'), JSON.stringify({ results }, null, 2) + '\n');
  rmSync(scratch, { recursive: true, force: true });
}
const explicit = results.find(x => x.name === 'explicit');
assert.equal(explicit.report.verification.typeCheck.status, 'passed');
assert.equal(explicit.report.verification.eval.status, 'passed');
assert.equal(explicit.report.verification.verdict, 'verified');
assert.equal(explicit.report.prReady, true);
assert.equal(explicit.after, explicit.before.replace('gpt-4-0613', 'gpt-5.6-sol'));
for (const opaque of results.filter(x => x.name !== 'explicit')) {
assert.equal(opaque.report.verification.verdict, 'held_for_review');
assert.equal(opaque.report.prReady, false);
assert.equal(opaque.report.migrated, false);
assert.deepEqual(opaque.report.changedFiles, []);
assert.equal(opaque.report.diff, '');
assert.equal(opaque.report.applied, undefined);
assert.equal(opaque.unchanged, true);
}
console.log('PASS opaque request held byte-equal; explicit request verifies and writes exact source');
