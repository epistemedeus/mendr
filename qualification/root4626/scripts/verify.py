from pathlib import Path
import subprocess,json,re
root=Path(__file__).resolve().parents[3];q=root/'qualification/root4626';out=q/'outputs';native=115737
# This PID was selected from the current supervisor/native ancestry, not reused from the predecessor.
assert Path(f'/proc/{native}/comm').read_text().strip()=='python3'
projects=json.loads((q/'PROJECTIONS.json').read_text())
files={
'recovery':['src/assurance/recovery-schedule.test.ts','src/assurance/assurance.test.ts'],
'request-spreads':['src/usage/request-spreads.test.ts','src/usage/requestObjectFlow.test.ts','src/usage/tsGuards.test.ts','src/usage/sinkParamGuard.test.ts','src/usage/coupledParams.test.ts','src/migrate/write-revalidation.test.ts','src/gates/secondCheck.test.ts','src/migrate/heldCalls.test.ts'],
 'telemetry':['src/assurance/telemetry-evidence.test.ts','src/assurance/telemetry.test.ts','src/runtime/evidence.test.ts','src/assurance/assurance.test.ts']}
checks=[]
for p in projects:
 wt=Path(p['worktree']);key=p['key'];missing=[x for x in files[key] if not (wt/x).is_file()]
 if missing:
  assert missing==['src/usage/sinkParamGuard.test.ts']
  checks.append({'projection':key,'selectedFilePreflightExit':1,'missing':missing,'resolution':'Absent at exact baseline and accepted source. No fabricated file or empty test counted. The existing coupledParams.test.ts owns const/shorthand/fallback sink parameter regressions; retain its full 110 tests and other named existing files.'})
 else:checks.append({'projection':key,'selectedFilePreflightExit':0,'missing':[]})
 (out/'selected-file-preflight.json').write_text(json.dumps(checks,indent=2)+'\n')
 tests=[x for x in files[key] if x not in missing]
 def run(name,args):
  cmd=['python3',str(q/'scripts/run.py'),'--cwd',str(wt),'--outputs',str(out),'--native-root',str(native),'--offline',key+'-'+name,'--',*args]
  result=subprocess.run(cmd,cwd=root);assert result.returncode==0,(key,name,result.returncode)
 run('build',['npm','run','build'])
 run('tests',['npm','test','--',*tests,'--maxWorkers=1','--no-file-parallelism'])
 log=(out/(key+'-tests.log')).read_text();assert 'Tests  ' in log and 'Test Files  ' in log
 for path in tests:assert path in log,('selected test did not run',path)
 if key=='recovery':
  run('cli',['node',str(q/'scripts/probe-recovery.mjs'),str(wt),str(out/'recovery-cli'),str(root)])
 elif key=='request-spreads':
  for label,file in [('direct','probe-spread-write.mjs'),('wrapped','probe-wrapped-spread-write.mjs')]:
   run(label,['node',str(root/'qualification/root4551/scripts'/file),str(wt),str(out/('request-spreads-'+label))])
 else:
  run('cli',['node',str(root/'qualification/root4551/received/scripts/probe-telemetry.mjs'),str(wt),str(out/'telemetry-cli')])
 print('QUALIFIED',key,p['head'],flush=True)
