from pathlib import Path
import hashlib,json,subprocess,os
root=Path(__file__).resolve().parents[3];q=root/'qualification/root4626';base='413bdc648d3b45d52ed9a2d5a27146e9685f9d7c';accepted='5ea45e2fce4cc3e57f053f6864e525a87e12fb4c'
def git(*args,cwd=root):return subprocess.check_output(['git',*args],cwd=cwd).decode().strip()
assert git('rev-parse','HEAD')=='6e2a0c8cab5bb94817173fff43dbf67a1f834c61'
assert git('branch','--show-current')=='codex/root4551-mendr-safety-integration-20261023'
raw=[('recovery',['233b362a4834a7100fcf2a015100345fc11500a6'],['src/assurance/recovery.ts','src/assurance/assurance.test.ts'],{'src/assurance/root4410-recovery.test.ts':'src/assurance/recovery-schedule.test.ts'},'fix: qualify recovery advice using known retirement schedules'),('request-spreads',['0c94fb98471b3093f78feb3d2504c970aa3ef4d2','9f166d9f1a70fc9c10e9ec0cb30d6259057b97e9','6584ea126657b4bfb00d85e8f72ade00094d7a64','5ea45e2fce4cc3e57f053f6864e525a87e12fb4c'],['src/usage/scanLiterals.ts','src/usage/tsSurface.ts','src/usage/requestObjectFlow.test.ts'],{'src/usage/root4410-request-spread.test.ts':'src/usage/request-spreads.test.ts','src/migrate/root4410-second-check-write.test.ts':'src/migrate/write-revalidation.test.ts'},'fix: hold opaque request spreads before automatic model migration'),('telemetry',['ed6ddc85a1990de782edb55fdd9021c934ceb820'],['src/assurance/telemetry.ts','src/runtime/evidence.ts'],{'src/assurance/root4410-telemetry-evidence.test.ts':'src/assurance/telemetry-evidence.test.ts'},'fix: keep unknown telemetry outcomes and measurements unmeasured')]
transforms=[['ROOT4410 recovery evidence boundary','recovery schedule evidence'],['ROOT4410 opaque request spread cannot earn automatic migration','opaque request spreads cannot earn automatic migration'],['ROOT4410 telemetry keeps missing evidence unknown','telemetry keeps missing evidence unknown'],['// ROOT4551 additions below retain the exact received direct-request controls.','// Inline, fallback and conditional requests use the same safety controls.'],['root4410-spread-','mendr-request-spreads-'],['root4410-second-write-','mendr-write-revalidation-']]
records=[]
for key,commits,plain,renames,title in raw:
 branch='codex/root4626-mendr-'+key+'-20261023';wt=q/'.scratch'/key
 assert not git('ls-remote','--heads','origin',branch),'same-name remote already exists'
 subprocess.run(['git','worktree','add','-b',branch,str(wt),base],cwd=root,check=True,stdout=subprocess.DEVNULL)
 mapping=[]
 for src in plain+list(renames):
  dst=renames.get(src,src);before=subprocess.check_output(['git','show',accepted+':'+src],cwd=root);after=before;applied=[]
  if src in renames:
   for old,new in transforms:
    if old.encode() in after:after=after.replace(old.encode(),new.encode());applied.append([old,new])
  p=wt/dst;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(after)
  undo=after
  for old,new in reversed(applied):undo=undo.replace(new.encode(),old.encode())
  assert undo==before
  mapping.append({'acceptedCommit':accepted,'sourcePath':src,'projectedPath':dst,'sourceSha256':hashlib.sha256(before).hexdigest(),'projectedSha256':hashlib.sha256(after).hexdigest(),'labelOnlyReplacements':applied,'assertionsPreservedByInverseByteEquality':True})
 (wt/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
 assert (wt/'package-lock.json').read_bytes()==(root/'package-lock.json').read_bytes()
 subprocess.run(['git','add','--','src'],cwd=wt,check=True);subprocess.run(['git','diff','--cached','--check'],cwd=wt,check=True)
 author=git('show','-s','--format=%an%n%ae%n%aI',commits[0]).splitlines();env=os.environ.copy();env.update(GIT_AUTHOR_NAME=author[0],GIT_AUTHOR_EMAIL=author[1],GIT_AUTHOR_DATE=author[2])
 message=title+'\n\n'+ '\n'.join('Source-commit: '+c for c in commits)
 subprocess.run(['git','commit','--quiet','-m',message],cwd=wt,env=env,check=True)
 assert git('rev-list','--count',base+'..HEAD',cwd=wt)=='1'
 diff=git('diff','--name-only',base,'HEAD',cwd=wt).splitlines();assert set(diff)=={m['projectedPath'] for m in mapping}
 assert git('rev-parse','HEAD^',cwd=wt)==base
 records.append({'key':key,'ref':branch,'worktree':str(wt),'head':git('rev-parse','HEAD',cwd=wt),'tree':git('rev-parse','HEAD^{tree}',cwd=wt),'base':base,'acceptedCommits':commits,'author':author,'files':mapping,'allowedDiff':diff,'ancestorCommitsAboveBase':1,'qualificationInHistory':False})
 (q/'PROJECTIONS.json').write_text(json.dumps(records,indent=2)+'\n')
 print(key,records[-1]['head'])
