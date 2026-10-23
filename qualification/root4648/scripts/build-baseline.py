"""Build exact admitted base CLI into disposable qualification output, restoring candidate source."""
from pathlib import Path
import subprocess
p = Path('src/cli.ts')
candidate = p.read_bytes()
try:
    p.write_bytes(subprocess.check_output(['git', 'show', '6e2a0c8cab5bb94817173fff43dbf67a1f834c61:src/cli.ts']))
    subprocess.run(['node', 'node_modules/typescript/bin/tsc', '--outDir', 'qualification/root4648/.scratch/baseline-dist'], check=True)
finally:
    p.write_bytes(candidate)
