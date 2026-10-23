#!/usr/bin/env python3
"""Replay the baseline adoption on already acquired exact source/dependencies."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import shutil

HERE=Path(__file__).resolve().parent
p=argparse.ArgumentParser()
p.add_argument('--mendr',type=Path,required=True)
p.add_argument('--eventcatalog',type=Path,required=True)
p.add_argument('--yolo',type=Path,required=True)
p.add_argument('--outputs',type=Path,required=True)
a=p.parse_args()
a.outputs.mkdir(parents=True,exist_ok=False)
pins={'mendr':'413bdc648d3b45d52ed9a2d5a27146e9685f9d7c','eventcatalog':'d721c06b0142c55cd23c461734c1423bf95cedb2','yolo':'f5470e7ea1e3fcf5d972fc826b263e2fb0469f25'}
for name,pin in pins.items():
    path=getattr(a,name).resolve()
    assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=path,text=True).strip()==pin
    assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=normal'],cwd=path,text=True), f'{name} must be a clean disposable pinned checkout'

def run(name,cmd,expected=0):
    r=subprocess.run([sys.executable,str(HERE/'run-command.py'),'--cwd',str(a.mendr.resolve()),'--outputs',str(a.outputs.resolve()),'--offline',name,'--',*map(str,cmd)])
    assert r.returncode==expected, f'{name}: expected {expected}, got {r.returncode}'

run('build',['npm','run','build'])
run('baseline-tests',['npm','test','--','--maxWorkers=1','--no-file-parallelism'])
run('qualification',['node',HERE/'qualify.mjs',a.mendr.resolve(),a.outputs.resolve()])
run('audit-eventcatalog',['node','dist/cli.js','audit',a.eventcatalog.resolve(),'--offline','--json'])
run('audit-yolo',['node','dist/cli.js','audit',a.yolo.resolve(),'--offline','--json'])
subprocess.run([sys.executable,str(HERE/'compare-references.py'),'--expected',str(HERE.parent/'fixtures/expected-references.json'),'--eventcatalog-report',str(a.outputs/'audit-eventcatalog.report.json'),'--yolo-report',str(a.outputs/'audit-yolo.report.json'),'--output',str(a.outputs/'reference-comparison.json')],check=True)
run('guard-control',['node',HERE/'network-guard-control.cjs'])
run('registry-validation',['node','dist/cli.js','validate-registry'])
run('workflow-tests',['node','--test','--test-concurrency=1',HERE/'workflow-report.test.mjs'])
for name in ['n8n','make']:
    run('workflow-'+name,['node',HERE/'workflow-report.mjs',a.mendr.resolve(),name,HERE.parent/'fixtures'/f'{name}.json','--json'])
with tempfile.TemporaryDirectory(prefix='root4410-exports-') as scratch:
    for name in ['n8n','make']:
        shutil.copyfile(HERE.parent/'fixtures'/f'{name}.json',Path(scratch)/f'{name}.json')
    run('audit-generic-workflows',['node','dist/cli.js','audit',scratch,'--offline','--json'])
for name in pins:
    assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=normal'],cwd=getattr(a,name),text=True),f'{name}: source preservation failed'
print(json.dumps({'status':'baseline adoption received','liveProviderEvaluation':False,'sourcePreserved':True,'pins':pins}))
