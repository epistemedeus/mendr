"""Read-only exact-base scope and preservation receipt. No credential access."""
import hashlib
import json
import os
from pathlib import Path
import subprocess

base = '6e2a0c8cab5bb94817173fff43dbf67a1f834c61'
root = Path.cwd()
def git(*args): return subprocess.check_output(['git', *args]).decode().strip()
changed = git('diff', '--name-only', base, 'HEAD').splitlines()
allowed = {'README.md', 'src/cli.ts', 'src/recon/modelRetirement.ts', 'src/recon/modelRetirement.test.ts', 'src/cli.modelRetirement.test.ts'}
assert all(p in allowed or p.startswith('qualification/root4648/') for p in changed), changed
preserved = []
for item in subprocess.check_output(['git', 'ls-tree', '-rz', base]).split(b'\0'):
    if not item: continue
    identity, name = item.split(b'\t', 1)
    mode, kind, blob = identity.decode().split()
    path = name.decode()
    if path in {'README.md', 'src/cli.ts'}: continue
    full = root / path
    data = os.readlink(full).encode() if mode == '120000' else full.read_bytes()
    actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    assert actual == blob, path
    preserved.append(path)
source = {}
for name in sorted(allowed | {'package.json', 'package-lock.json', 'qualification/root4648/CONTRACT.md'}):
    data = (root / name).read_bytes()
    source[name] = dict(bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), gitBlob=hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest())
result = dict(base=base, testedSourceHead=git('rev-parse', 'HEAD'), testedSourceTree=git('rev-parse', 'HEAD^{tree}'),
              branch=git('branch', '--show-current'), origin='https://github.com/epistemedeus/mendr.git',
              changedFiles=changed, unchangedBaseFiles=len(preserved),
              originalQualificationFilesPreserved=sum(p.startswith('qualification/root4551/') for p in preserved),
              sourceHashes=source)
Path('qualification/root4648/outputs/SOURCE-MANIFEST.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
