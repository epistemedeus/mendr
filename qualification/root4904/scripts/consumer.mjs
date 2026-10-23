import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const [candidateArg, baselineArg, outputArg] = process.argv.slice(2);
const candidate = resolve(candidateArg), baseline = resolve(baselineArg), output = resolve(outputArg);
const fixtures = join(candidate,'src/recon/__fixtures__/modelRetirement');
const scratch = mkdtempSync(join(tmpdir(),'mendr-projection-'));
const env = { ...process.env, MENDR_EVALUATED_AT:'2026-10-23T12:00:00Z', MENDR_TEST_NOW:'2026-10-23T12:00:00Z',
  NODE_OPTIONS:`${process.env.NODE_OPTIONS ?? ''} --require ${join(fixtures,'fixed-clock.cjs')}` };
const results = [], parity = [];
const read = name => JSON.parse(readFileSync(join(fixtures,name+'.json'),'utf8'));
const save = (name,value) => { const file=join(scratch,name+'.json');writeFileSync(file,JSON.stringify(value));return file; };
const numbers=save('numbers',read('numbers')), migration=save('migration',read('migration'));
const undated=read('migration');undated.migrations[0].evidence.shutdownDate=null;const noDate=save('undated',undated);
function exec(binary, args) { const r=spawnSync(process.execPath,[join(binary,'dist/cli.js'),'rollout',...args],{cwd:candidate,env,encoding:'utf8',timeout:20000});return r; }
function receive(name,metadata,migrationFile=migration,binary=candidate) {
  const args=[numbers,'--repo',scratch,'--migration',migrationFile,...(metadata?['--models-metadata',metadata]:[]),'--json'];
  const r=exec(binary,args);assert.equal(r.status,0,r.stderr);const report=JSON.parse(r.stdout);
  results.push({name,args,exit:r.status,report});return report;
}
try {
 const before=receive('dependency-base-undated',null,noDate,baseline);assert.equal(before.recovery.options[0].available,false);
 const dated=save('date',read('list-date'));
 const good=receive('corroborated',dated);assert.equal(good.modelsMetadata.swaps[0].reconciliation,'corroborated');
 const supplied=receive('undated-supplied-schedule',dated,noDate);assert.equal(supplied.recovery.options[0].available,true);assert.equal(supplied.modelsMetadata.swaps[0].reconciliation,'metadata_schedule');assert.deepEqual(supplied.signals,before.signals);
 for(const [kind,expected] of [['null','conflict'],['omitted','artifact_only'],['missing','artifact_only'],['conflict','conflict'],['stale','unknown']]) {
  const c=read('list-date');
  if(kind==='null')c.response.body.data[0].shutdown_date=null;
  if(kind==='omitted')delete c.response.body.data[0].shutdown_date;
  if(kind==='missing')c.response.body.data=[];
  if(kind==='conflict')c.response.body.data[0].shutdown_date='2026-10-25';
  if(kind==='stale')c.retrievedAt='2026-10-21T12:00:00Z';
  const r=receive(kind,save(kind,c));assert.equal(r.modelsMetadata.swaps[0].reconciliation,expected);
  if(['null','conflict','stale'].includes(kind))assert.equal(r.recovery.options[0].available,false);
 }
 const recovered=receive('restored-current',dated);assert.deepEqual(recovered,good);
 const malformed=join(scratch,'malformed.json');writeFileSync(malformed,'{"PRIVATE_CAPTURE_MARKER":');
 const refusal=exec(candidate,[numbers,'--repo',scratch,'--migration',migration,'--models-metadata',malformed,'--json']);assert.equal(refusal.status,2);assert.equal(refusal.stdout,'');assert.ok(!refusal.stderr.includes('PRIVATE_CAPTURE_MARKER'));
 const restored=receive('restored-after-refusal',dated);assert.deepEqual(restored,good);
 for(const useMigration of [false,true])for(const json of [false,true]) {
  const args=[numbers,'--repo',scratch,...(useMigration?['--migration',migration]:[]),...(json?['--json']:[])];
  const a=exec(baseline,args), b=exec(candidate,args);assert.equal(a.status,0,a.stderr);assert.equal(b.status,a.status);assert.equal(b.stdout,a.stdout);assert.equal(b.stderr,a.stderr);
  parity.push({useMigration,json,exit:b.status,stdoutByteEqual:true,stderrByteEqual:true});
 }
 writeFileSync(output,JSON.stringify({results,refusal:{exit:refusal.status,stderr:refusal.stderr},parity,restorationEqual:true},null,2)+'\n');
 console.log(JSON.stringify({builtCases:results.length,refusalExit:refusal.status,defaultParity:parity.length,restorationEqual:true}));
} finally { rmSync(scratch,{recursive:true,force:true}); }
