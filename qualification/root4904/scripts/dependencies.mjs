import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [main,base,fixtures,out]=process.argv.slice(2);
const dir=mkdtempSync(join(tmpdir(),'mendr-dependencies-'));
const put=(name,v)=>{const p=join(dir,name+'.json');writeFileSync(p,JSON.stringify(v));return p;};
try {
 const m=JSON.parse(readFileSync(join(fixtures,'migration.json'),'utf8'));m.migrations[0].evidence.shutdownDate=null;
 const migration=put('migration',m), numbers=join(fixtures,'numbers.json');
 const deploy=Date.parse('2026-10-20T12:00:00Z');
 const telemetry=put('telemetry',[-1,1].flatMap(side=>Array.from({length:120},(_,i)=>({timestamp:new Date(deploy+side*(i+1)*1000).toISOString(),model:side<0?'synthetic-source':'synthetic-target',requests:1,cost:'unknown'}))));
 const rows=[];
 for(const [label,root]of [['upstream-main',main],['exact-safety-dependencies',base]]) {
  for(const [kind,args]of [['undated-recovery',[numbers]],['missing-outcome',['--from',telemetry,'--deployed-at',new Date(deploy).toISOString(),'--workflow','Synthetic support']]]) {
   const r=spawnSync(process.execPath,[join(root,'dist/cli.js'),'rollout',...args,'--repo',dir,'--migration',migration,'--json'],{encoding:'utf8',timeout:20000});
   const report=JSON.parse(r.stdout); rows.push({label,kind,exit:r.status,verdict:report.verdict,revertScheduleOption:report.recovery.options[0].available,signals:report.signals});
  }
 }
 assert.equal(rows[0].revertScheduleOption,true);assert.equal(rows[2].revertScheduleOption,false);
 assert.equal(rows[1].verdict,'verified');assert.equal(rows[3].verdict,'inconclusive');assert.equal(rows[3].exit,3);
 writeFileSync(out,JSON.stringify({rows,reason:'PR79 prevents unknown schedules from assuring revert; PR81 prevents missing outcomes from manufacturing a healthy measured rollout.'},null,2)+'\n');
 console.log(JSON.stringify(rows));
}finally{rmSync(dir,{recursive:true,force:true});}
