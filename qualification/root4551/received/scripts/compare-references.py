#!/usr/bin/env python3
"""Compare a frozen, manually checked locator list with received mendr reports."""
import argparse
from collections import Counter
import json
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('--expected',required=True)
p.add_argument('--eventcatalog-report',required=True)
p.add_argument('--yolo-report',required=True)
p.add_argument('--output',required=True)
a=p.parse_args()
expected=json.loads(Path(a.expected).read_text())['references']
result={}
for repo, file in [('eventcatalog',a.eventcatalog_report),('yolo',a.yolo_report)]:
    report=json.loads(Path(file).read_text())
    actual=[{**loc,'bucket':bucket} for inv in report['investigations'] for bucket,ls in inv['locations'].items() for loc in ls]
    comparisons=[]
    for ref in [r for r in expected if r['repo']==repo]:
        hits=[loc for loc in actual if loc['file']==ref['file'] and loc['line']==ref['line'] and loc['value'] in (ref['value'],ref['value'].removeprefix('openai/'))]
        comparisons.append({**ref,'reported':bool(hits),'canonicalized':any(h['value']!=ref['value'] for h in hits),
            'actual':[{k:h.get(k) for k in ['bucket','tier','role','reason','patchEligible','value']} for h in hits]})
    result[repo]={'expected':len(comparisons),'reported':sum(r['reported'] for r in comparisons),
        'byRole':dict(Counter(r['role'] for r in comparisons)), 'coverage':report['coverage'],
        'conclusion':report['conclusion'],'comparisons':comparisons,
        'totalReportedLocationsAllModels':len(actual),
        'limits':['Recall denominator is the frozen three-family list, not all model references in these repositories.',
                  'Canonicalized provider prefixes are joined by checked file/line; this is observable report information loss.',
                  'No config reader tie-back, provider invocation, persisted-selection resolution or semantic equivalence was received.']}
Path(a.output).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:{'reported':v['reported'],'expected':v['expected']} for k,v in result.items()}))
assert all(v['reported']==v['expected'] for v in result.values())
assert all(not x.get('patchEligible') for v in result.values() for r in v['comparisons'] for x in r['actual'])
