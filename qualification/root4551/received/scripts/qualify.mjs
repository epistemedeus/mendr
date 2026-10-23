#!/usr/bin/env node
// Exercises the pinned built implementation. No provider, SDK, or private payload.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const [mendrArg, outputArg] = process.argv.slice(2);
const mendr = resolve(mendrArg);
const output = resolve(outputArg);
const gitRead = args => {
  const r=spawnSync('git',['-C',mendr,...args],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  return r.stdout;
};
const sourceIdentity={head:gitRead(['rev-parse','HEAD']).trim(),
  trackedDiffSha256:createHash('sha256').update(gitRead(['diff','--binary'])).digest('hex'),
  statusPorcelain:gitRead(['status','--porcelain'])};
const load = rel => import(pathToFileURL(join(mendr, 'dist', rel)).href);
const { loadLlmRegistry } = await load('usage/llmRegistry.js');
const { runMigration, computeVerdict } = await load('migrate/migrate.js');
const { runRepoEval } = await load('gates/runEval.js');
const { runSecondCheck } = await load('gates/secondCheck.js');
const { loadProject } = await load('usage/scanRepo.js');
const { recoveryPlan } = await load('assurance/recovery.js');
const { parseRolloutInput, judgeRollout } = await load('assurance/rollout.js');
const { toObservation, loadRuntimeEvidenceFile } = await load('runtime/evidence.js');
const { loadRegistryWithFreshness } = await load('registry/freshRegistry.js');
const registry = loadLlmRegistry();
const root = mkdtempSync(join(tmpdir(), 'root4410-contracts-'));
const results = [];
const call = 'import OpenAI from "openai";\nconst client = new OpenAI();\nexport async function ask(){ return client.chat.completions.create({ model: "gpt-4-0613", messages: [] }); }\n';
const put = (dir, rel, text) => { mkdirSync(join(dir, rel, '..'), { recursive: true }); writeFileSync(join(dir, rel), text); };
function hashTree(dir) {
  const h = createHash('sha256');
  function walk(p, rel = '') {
    for (const e of readdirSync(p, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name))) {
      const r = join(rel, e.name);
      if (e.isDirectory()) walk(join(p,e.name),r);
      else if (e.isFile()) h.update(r).update(readFileSync(join(p,e.name)));
    }
  }
  walk(dir);
  return h.digest('hex');
}
function repo(name, { typeFail = false, testFail = false, buildFail = false, evalFail = false, source = call } = {}) {
  const dir = join(root, name);
  put(dir, 'package.json', JSON.stringify({ name: 'root4410-synthetic', scripts: { build: 'node build.cjs', test: 'node test.cjs' } }));
  put(dir, 'src/client.ts', source);
  put(dir, 'node_modules/openai/package.json', JSON.stringify({ name: 'openai', version: '0.0.0-synthetic', types: 'index.d.ts' }));
  put(dir, 'node_modules/openai/index.d.ts', `declare class OpenAI { chat: { completions: { create(body: { model: ${typeFail ? '"gpt-4-0613"' : 'string'}; messages: unknown[] }): Promise<unknown> } } }; export default OpenAI;\n`);
  put(dir, 'build.cjs', buildFail
    ? `require('node:assert/strict').match(require('node:fs').readFileSync('src/client.ts','utf8'), /gpt-4-0613/);\n`
    : `require('node:assert/strict').equal(false, false);\n`);
  put(dir, 'test.cjs', `require('node:assert/strict').equal(${testFail}, false); console.log('1 passing');\n`);
  put(dir, 'eval.cjs', `const a = require('node:assert/strict'); a.equal(${evalFail}, false); a.match(require('node:fs').readFileSync('src/client.ts','utf8'), /gpt-5\\.6-sol/); console.log('synthetic patched-source check passed');\n`);
  put(dir, 'sleep.cjs', 'setTimeout(() => {}, 30000);\n');
  return dir;
}
const remember = (name, value) => { results.push({ name, ...value }); console.log('PASS', name); };
try {
  const positive = repo('positive');
  const before = hashTree(positive);
  const planned = await runMigration(positive, registry, { evalCommand: 'node eval.cjs', now: new Date('2026-10-22T12:00:00Z') });
  assert.equal(planned.verification.verdict, 'verified');
  for (const key of ['typeCheck','build','tests','eval','secondCheck']) assert.equal(planned.verification[key].status,'passed');
  assert.match(planned.diff, /gpt-5\.6-sol/);
  assert.equal(hashTree(positive), before);
  remember('verified print-only migration', planned);

  const audits = [];
  for (let i = 0; i < 2; i++) {
    const r = spawnSync(process.execPath, ['--require', join(mendr,'scripts/no-network.cjs'), join(mendr,'dist/cli.js'),'audit',positive,'--offline','--json'], { encoding:'utf8' });
    assert.equal(r.status, 0, r.stderr);
    audits.push(JSON.parse(r.stdout));
    assert.equal(hashTree(positive),before);
  }
  remember('repeated audit preserves all fixture bytes', { beforeSha256:before, afterSha256:hashTree(positive), audits });

  for (const [name, flags, gate] of [['type-failure',{typeFail:true},'typeCheck'],['test-failure',{testFail:true},'tests'],['build-failure',{buildFail:true},'build'],['eval-failure',{evalFail:true},'eval']]) {
    const dir = repo(name,flags);
    const initial = hashTree(dir);
    const r = await runMigration(dir,registry,{write:true,evalCommand:'node eval.cjs'});
    assert.equal(r.verification[gate].status,'failed');
    assert.equal(r.verification.verdict,'failed');
    assert.equal(r.prReady,false);
    assert.deepEqual(r.applied,[]);
    assert.equal(hashTree(dir),initial);
    remember(name+' refuses write',r);
  }

  const timeout = await runRepoEval(positive,[],{command:'node sleep.cjs',timeoutMs:400});
  assert.equal(timeout.status,'inconclusive');
  assert.equal(timeout.exitCode,undefined);
  const passAfterTimeout = await runRepoEval(positive,[{absPath:join(positive,'src/client.ts'),newText:call.replace('gpt-4-0613','gpt-5.6-sol')}],{command:'node eval.cjs',timeoutMs:2000});
  assert.equal(passAfterTimeout.status,'passed');
  remember('external eval timeout then recovery',{timeout,passAfterTimeout});

  const cliTimeout = repo('cli-timeout');
  put(cliTimeout,'mendr.config.json',JSON.stringify({evalCommand:'node sleep.cjs',evalTimeoutMs:400}));
  const cliBefore=hashTree(cliTimeout);
  const invoke = extra => spawnSync(process.execPath,[join(mendr,'dist/cli.js'),'fix-llm',cliTimeout,'--write','--json',...extra],{encoding:'utf8'});
  const timed=invoke([]);
  assert.equal(timed.status,1,timed.stderr);
  assert.equal(hashTree(cliTimeout),cliBefore);
  const timedReport=JSON.parse(timed.stdout);
  assert.equal(timedReport.eval.status,'inconclusive');
  const recovered=invoke(['--eval-command','node eval.cjs']);
  assert.equal(recovered.status,0,recovered.stderr);
  assert.match(readFileSync(join(cliTimeout,'src/client.ts'),'utf8'),/gpt-5\.6-sol/);
  remember('CLI eval timeout refuses write then healthy command recovers',{timedExit:timed.status,timedReport,recoveredExit:recovered.status,recoveredReport:JSON.parse(recovered.stdout)});

  const sourcePath = join(positive,'src/client.ts');
  const second = await runSecondCheck({repoPath:positive,registry,freshTs:loadProject(positive),tsFiles:[{absPath:sourcePath,newText:call.replace('gpt-4-0613','gpt-5.6-sol').replace('messages: []','messages: ["unapproved edit"]')}],pyFiles:[]});
  assert.equal(second.status,'failed');
  const g = {status:'passed'};
  assert.equal(computeVerdict(g,g,g,g,second),'failed');
  const validSecond = await runSecondCheck({repoPath:positive,registry,freshTs:loadProject(positive),tsFiles:[{absPath:sourcePath,newText:call.replace('gpt-4-0613','gpt-5.6-sol')}],pyFiles:[]});
  assert.equal(validSecond.status,'passed');
  remember('second check rejects out-of-scope edit then recovers',{second,validSecond,sourcePreserved:hashTree(positive)===before});

  const written = await runMigration(positive,registry,{write:true,evalCommand:'node eval.cjs'});
  assert.equal(written.verification.verdict,'verified');
  assert.deepEqual(written.applied,['src/client.ts']);
  const again = await runMigration(positive,registry,{write:true,evalCommand:'node eval.cjs'});
  assert.equal(again.verification.verdict,'no_migration');
  remember('verified explicit write and repeat-load recovery',{written,again});

  for (const [name, source] of [
    ['proxy',call.replace('new OpenAI()','new OpenAI({ baseURL: "https://proxy.invalid/v1" })')],
    ['gateway-prefix',call.replace('"gpt-4-0613"','"openai/gpt-4-0613"')],
    ['incompatible-parameter',call.replace('messages: []','messages: [], prompt_cache_retention: "24h"')],
  ]) {
    const dir = repo(name,{source});
    const initial = hashTree(dir);
    const r = await runMigration(dir,registry,{write:true,evalCommand:'node eval.cjs'});
    assert.equal(hashTree(dir),initial);
    assert.equal(r.prReady,false);
    assert.equal(r.migrated,false);
    assert.equal(r.verification.verdict,'held_for_review');
    remember(name+' held without writing',r);
  }

  const window = {calls:1000,errorRate:0.001,latencyP95Ms:100,costPer1k:1,quality:'passed'};
  const workflow = {name:'Synthetic reply',paths:['src/**'],signals:{qualityRequired:true}};
  for (const [name,after,want] of [
    ['healthy',window,'verified'],['degraded',{...window,errorRate:0.2},'regression'],
    ['insufficient',{...window,calls:3},'inconclusive'],['missing',{},'inconclusive'],
    ['missing-cost',{calls:1000,errorRate:0.001,quality:'passed'},'verified'],
    ['missing-quality',{calls:1000,errorRate:0.001},'inconclusive'],
  ]) {
    const parsed = parseRolloutInput({workflow:workflow.name,before:window,after});
    const r = judgeRollout(parsed,workflow);
    assert.equal(r.verdict,want);
    if (name==='missing-cost') assert.equal(r.signals.find(x=>x.signal==='costPer1k').state,'not_measured');
    remember('rollout '+name,r);
  }
  const observation = toObservation({model:'o4-mini',timestamp:'2026-10-22T00:00:00Z',requests:5});
  assert.equal(observation.costUsd,null);
  remember('runtime missing cost stays null',{observation});
  const fresh = await loadRegistryWithFreshness({offline:true,env:{},now:new Date('2026-10-23T00:00:00Z')});
  const stale = await loadRegistryWithFreshness({offline:true,env:{},now:new Date('2027-01-01T00:00:00Z')});
  assert.equal(stale.freshness.state,'stale');
  remember('dated registry freshness',{current:fresh.freshness,stale:stale.freshness});

  const metadata = JSON.parse(readFileSync(new URL('../fixtures/models-responses.json',import.meta.url),'utf8'));
  const scheduled = registry.find(x=>x.kind==='model_id'&&x.deprecated==='o4-mini');
  assert.ok(scheduled);
  const registryHash = createHash('sha256').update(JSON.stringify(registry)).digest('hex');
  const modelCases=[];
  for (const fixture of metadata.cases) {
    const file=join(root,fixture.name+'-models.json');
    writeFileSync(file,JSON.stringify(fixture.response));
    // The current usage-export seam must not turn a Models object into calls.
    assert.throws(()=>loadRuntimeEvidenceFile(file));
    modelCases.push({name:fixture.name,observedMetadata:fixture.response,observedAt:fixture.observedAt,publishedSchedule:scheduled.shutdownDate,modelAccessibility:'not measured',semanticQualification:'not measured',nativeModelsImporter:'absent at pin; usage-export seam rejects response'});
  }
  assert.equal(createHash('sha256').update(JSON.stringify(registry)).digest('hex'),registryHash);
  const boundaries=metadata.boundaryInstants.map(instant=>({instant,recovery:recoveryPlan([{from:scheduled.deprecated,to:scheduled.replacement,shutdownDate:scheduled.shutdownDate}],new Date(instant))}));
  assert.deepEqual(boundaries.map(x=>x.recovery.options[0].available),[true,false,false,true,false]);
  remember('Models seam preserves schedule, access and semantics separately',{modelCases,boundaries,registryUnchanged:true});
} finally {
  mkdirSync(output,{recursive:true});
  writeFileSync(join(output,'qualification-cases.json'),JSON.stringify({mendrBaseCommit:'413bdc648d3b45d52ed9a2d5a27146e9685f9d7c',sourceIdentity,completedCases:results.length,results},null,2)+'\n');
  rmSync(root,{recursive:true,force:true});
}
