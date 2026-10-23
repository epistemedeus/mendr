from pathlib import Path
import datetime,hashlib,json,subprocess,re
root=Path(__file__).resolve().parents[3];q=root/'qualification/root4626';out=q/'outputs';projects=json.loads((q/'PROJECTIONS.json').read_text());base=projects[0]['base'];receipts=[]
def git(*args):return subprocess.check_output(['git',*args],cwd=root).decode().strip()
for p in sorted(out.glob('*.json')):
 r=json.loads(p.read_text())
 if isinstance(r,dict) and 'command' in r and 'peakAggregateRssKiB' in r:receipts.append(r)
assert len(receipts)==11 and sum(r['exitCode']!=0 for r in receipts)==1
assert next(r for r in receipts if r['name']=='renamed-exact-base-red')['exitCode']==1
assert not any(r['stopReason'] for r in receipts)
peak=max(r['peakAggregateRssKiB'] for r in receipts)
(out/'COMMANDS.json').write_text(json.dumps(receipts,indent=2)+'\n')
for p in projects:
 key=p['key'];log=(out/(key+'-tests.log')).read_text();p['focusedTestsPassed']=int(re.search(r'Tests\s+(\d+) passed',log).group(1));p['focusedFilesPassed']=int(re.search(r'Test Files\s+(\d+) passed',log).group(1))
 assert not git('ls-tree','-r','--name-only',p['head'],'qualification')
 assert not any('root4410' in f['projectedPath'] or 'root4551' in f['projectedPath'] for f in p['files'])
 p['buildReceipt']='outputs/'+key+'-build.json';p['testReceipt']='outputs/'+key+'-tests.json'
 p['builtControls']=['outputs/recovery-cli.json'] if key=='recovery' else ['outputs/request-spreads-direct.json','outputs/request-spreads-wrapped.json'] if key=='request-spreads' else ['outputs/telemetry-cli.json']
 p['baseTree']=git('rev-parse',base+'^{tree}')
 p['fileInventory']=[{'path':f['projectedPath'],'blob':git('rev-parse',p['head']+':'+f['projectedPath']),'bytes':(Path(p['worktree'])/f['projectedPath']).stat().st_size,'sha256':f['projectedSha256']} for f in p['files']]
(q/'PROJECTIONS.json').write_text(json.dumps(projects,indent=2)+'\n')
# Preserve all evidence before deleting only the four explicitly owned disposable worktrees.
cleanup=[]
for key in [p['key'] for p in projects]+['red-base']:
 wt=q/'.scratch'/key;assert wt.parent==q/'.scratch'
 subprocess.run(['git','worktree','remove','--force',str(wt)],cwd=root,check=True)
 cleanup.append({'path':str(wt),'removed':True,'scope':'owned disposable worktree; candidate refs and compact evidence preserved'})
(out/'cleanup.json').write_text(json.dumps(cleanup,indent=2)+'\n')
assert git('branch','--show-current')=='codex/root4551-mendr-safety-integration-20261023'
assert not git('diff','6e2a0c8cab5bb94817173fff43dbf67a1f834c61','--','src','qualification/root4551')
for r in receipts:
 for pid in r['survivingOwnedPids']:
  stat=Path('/proc')/str(pid)/'stat'
  assert not stat.exists() or stat.read_text().rsplit(')',1)[1].split()[0]=='Z'
notes={
'recovery':('Qualify recovery using known retirement schedules','Empty, unknown or mixed schedules cannot establish revert eligibility. Known dates preserve qualified pre-date advice and close the window on the UTC date, without claiming an observed outage or replacement quality.','28 tests/2 files and build pass. Five normal built rollout consumers cover empty/unknown/mixed and known pre/post schedules using actual clock and producer-shaped migration artifacts. Unit clocks retain UTC/offset boundaries.'),
'request-spreads':('Hold opaque request spreads before automatic migration','Spreads can change the effective model or coupled parameters. Hold inline, named, const/shorthand, fallback and conditional forms for review. Explicit unambiguous requests remain eligible. Retain existing second-check refusal and exact-source recovery.','234 tests/7 existing files and build pass. Both accepted built write probes pass against this projection: opaque sources remain byte-identical and explicit requests write exact expected bytes. The second-check injection and healthy recovery pass.'),
 'telemetry':('Keep unknown telemetry evidence unmeasured','Missing, malformed, unrecognized or partial outcomes do not become a healthy error rate. Invalid optional cost/latency remains unknown; valid zero remains measured. Legacy explicitly constructed samples stay compatible.','50 tests/4 files and build pass. All five accepted built rollout predicates pass: healthy, degraded, insufficient, missing-cost and missing-outcome. No billing or provider availability is measured.')}
pr=[];summary=[]
for p in projects:
 title,motivation,checks=notes[p['key']]
 pr.append(f"## {title}\n\n{motivation}\n\n{checks}\n\nBase: `{base}`. Head: `{p['head']}`. Ref: `{p['ref']}`.\n\nLocal synthetic checks only; no live provider evaluation or semantic parity claim.\n")
 summary.append(f"| {p['key']} | `{p['ref']}` | `{p['head']}` | {p['focusedTestsPassed']} / {p['focusedFilesPassed']} |")
(q/'PR-NOTES.md').write_text('# Candidate descriptions\n\n'+'\n'.join(pr))
result={'schema':'root4626.worker-result/v1','owner':'ROOT4626 same original ROOT4551 continuation','status':'three_isolated_candidates_ready_for_root_receiving','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalSession':'01a1687a-9d7d-79c0-a9b7-40b7d07e89a8','model':'gpt-6.1-sol','effort':'xhigh','modelChildren':0,'canonicalOrigin':'https://github.com/epistemedeus/mendr.git','canonicalBranch':git('branch','--show-current'),'acceptedExport':'6e2a0c8cab5bb94817173fff43dbf67a1f834c61','acceptedProduct':'5ea45e2fce4cc3e57f053f6864e525a87e12fb4c','base':base,'operatingPilotPin':'829965c8b84eddaad67a46352ff7d7b967cdb3e8','inputReceiptSha256':'c5450f6ae68de2297713265c3c3301d5d7b8d4bcc2d10627c4396be8939abcb5','checkpointBy':'2026-10-23T12:11:40.035Z','requiredUntil':'2026-10-23T13:56:06.713Z','actualNativeSupervisorPid':115737,'projections':projects,'withheldRefs':[],'commands':'outputs/COMMANDS.json','candidatePushes':'outputs/candidate-exports.json','redControls':{'receipt':'outputs/renamed-exact-base-red.json','base':base,'tests':22,'failed':20,'passed':2,'meaning':'Actual renamed regression bytes, exact base production; expected nonzero semantic failures. Existing old evidence remains unchanged.'},'selectedFileCorrection':json.loads((out/'selected-file-preflight.json').read_text()),'resource':{'reservationKiB':2097152,'highestSampledAggregateRssKiB':peak,'sampleMs':100,'nodeHeapMiB':640,'accounting':'actual resumed native/supervisor plus owned command descendants; sampled RSS, not kernel high-water','commandsSerial':True,'stopReasons':[],'modelChildren':0,'otherJobsOwned':0,'ownedPostgreSQL':0},'cleanup':cleanup,'originalEvidenceUnchanged':True,'canonicalProductUnchanged':True,'upstreamSubmitted':False,'installed':False,'limits':['No new production behavior; accepted source projected with label-only test renames.','Each candidate is one commit directly above the exact upstream base; no qualification evidence in candidate history.','The suggested sinkParamGuard.test.ts is absent from the pinned source; selected-file preflight records it and the actual owning coupledParams controls. No fabricated or empty test counted.','Node no-network preload is not an OS sandbox; Git export separate. No live API, provider-backed evaluation, external PR/comment/release or installation.','No repeated full suites; exact isolated focused groups and built consumers were executed.'],'nextRootAction':'Independently receive the three exact refs and open suitable upstream PRs directly if accepted.','canonicalExportIdentity':'Following qualification-only commit; exact clean/pushed HEAD/tree is recorded in the controller handback and native final response.'}
(q/'WORKER-RESULT.json').write_text(json.dumps(result,indent=2)+'\n')
text='''# ROOT4626 packaging handback

All three isolated candidates are pushed and read back. Nothing is withheld.
Each candidate has one commit directly on the exact upstream base, contains only
its declared production/tests, and excludes qualification evidence from history.
Attribution is preserved; source commit trailers and exact file/rename mappings,
blob/SHA-256 inventories and inverse byte-equivalence checks are in PROJECTIONS.json.

| Candidate | Fork ref | Exact head | Tests / files |
| --- | --- | --- | --- |
'''+ '\n'.join(summary)+f'''

Each ref has its own passing build and actual built consumer controls. Recovery
uses five normal rollout NUMBERS --migration --repo --json invocations with the
actual clock. Request spreads use both accepted direct/wrapped probes against
this projection's built modules, with held byte preservation and exact eligible
writes. Telemetry retains all five accepted rollout predicates and exit meanings.
Renamed tests on a disposable exact base reproduce 20 failures/2 passes; no safety
assertion or negative control was removed. Source/test mappings preserve all
accepted assertions while removing internal labels and temporary fixture names.

The suggested src/usage/sinkParamGuard.test.ts does not exist at the pinned base
or accepted source. The preflight retains that failure explicitly; the actual
owning coupledParams.test.ts contains 110 sink/const/shorthand/fallback parameter
controls and runs in full. The seven existing request files were each confirmed
in Vitest output; no absent/empty file was counted.

All 11 monitored commands ran serially with 640 MiB heaps. Highest sampled whole-
job RSS: {peak:,} KiB of 2,097,152 KiB (100 ms sampling, not kernel high-water).
No model children, larger reserve, stop, provider operation or other job ownership.
The current supervisor PID was observed from this resumed native ancestry rather
than inherited from the predecessor. All four owned disposable worktrees were
removed after preserving candidate refs and evidence; no live test child remains.

The canonical branch stays codex/root4551-mendr-safety-integration-20261023.
All accepted product and qualification/root4551 bytes remain unchanged. Only
qualification/root4626 is added to the canonical history. The source result and
controller handback record this same session and the new finite horizon:
checkpoint 12:11:40.035 UTC; required-until 13:56:06.713 UTC.

Root should independently receive these heads and open appropriate upstream PRs.
PR-NOTES.md has recipient-scoped motivation, checks and limits per candidate.
No upstream PR/comment, release, deployment, installation, live provider call,
telemetry upload or credential work ran. These are local source safety results,
not availability, semantic parity, measured billing, adoption or revenue evidence.
The exact canonical qualification export HEAD/tree is in the native final response
and controller handback; it cannot be embedded in its own commit.
'''
(q/'WORKER-HANDBACK.md').write_text(text)
print(json.dumps({'heads':{p['key']:p['head'] for p in projects},'peakKiB':peak,'cleanup':'four owned worktrees removed','tests':[p['focusedTestsPassed'] for p in projects]}))
