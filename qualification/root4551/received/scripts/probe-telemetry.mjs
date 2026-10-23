#!/usr/bin/env node
// Receive the actual built rollout --from path, not just precomputed windows.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const [mendrArg,outputArg]=process.argv.slice(2);
const mendr=resolve(mendrArg), output=resolve(outputArg);
const scratch=mkdtempSync(join(tmpdir(),'root4410-rollout-'));
const deployedAt=new Date('2026-10-20T12:00:00Z');
const results=[];
function rows(count,status) {
  return [-1,1].flatMap(side=>Array.from({length:count},(_,i)=>({
    timestamp:new Date(deployedAt.getTime()+side*(i+1)*1000).toISOString(),
    model:side<0?'o4-mini':'gpt-5.6-terra',requests:1,
    ...(status===undefined?{}:{status:status===500&&side<0?200:status}),
  })));
}
try {
  for(const [name,raw,want] of [
    ['healthy',rows(120,200),'verified'],
    ['degraded',rows(120,500),'regression'],
    ['insufficient',rows(3,200),'inconclusive'],
    ['missing-cost',rows(120,200).map(x=>({...x,cost:'unknown'})),'verified'],
    ['missing-outcome',rows(120,undefined),'inconclusive'],
  ]) {
    const file=join(scratch,name+'.json'); writeFileSync(file,JSON.stringify(raw));
    const args=[join(mendr,'dist/cli.js'),'rollout','--repo',scratch,'--from',file,'--deployed-at',deployedAt.toISOString(),'--workflow','Synthetic','--json'];
    const r=spawnSync(process.execPath,args,{encoding:'utf8'});
    const report=JSON.parse(r.stdout);
    results.push({name,expectedVerdict:want,exitCode:r.status,report});
  }
} finally {
  mkdirSync(output,{recursive:true});
  writeFileSync(join(output,'telemetry-cli-cases.json'),JSON.stringify({results},null,2)+'\n');
  rmSync(scratch,{recursive:true,force:true});
}
for(const {name,expectedVerdict,report} of results) {
  assert.equal(report.verdict,expectedVerdict,name);
  if(name==='missing-cost') assert.equal(report.signals.find(x=>x.signal==='costPer1k').state,'not_measured');
}
console.log('PASS built rollout --from: healthy/degraded/insufficient/missing cost/missing outcome');
