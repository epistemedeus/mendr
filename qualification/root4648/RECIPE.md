# Offline receiving recipe

Use Node 22 and the unchanged lockfile. Dependency acquisition is the separate
locked setup, `npm ci --ignore-scripts --no-audit --no-fund`; do not run it under
the offline receiving preload. No key, account or Models read is needed.

All heavy commands are serial. `scripts/run.py` gives each command a short owned
temporary HOME/TMPDIR, an allowlisted environment with no provider/Git credentials,
a 640MiB Node heap, a timeout and a sampled aggregate 2GiB guard. `--offline`
loads the existing `scripts/no-network.cjs`. It is Node enforcement, not an OS
sandbox. Git export is a separate authenticated operation using enrolled Git.

Example (substitute this run's positively identified task supervisor/launch PID
and use a **fresh** receipt directory/names; options precede the receipt name):

```sh
python3 qualification/root4648/scripts/run.py \
  --cwd "$PWD" --outputs /tmp/root4648-receipts --native-root ACTUAL_TASK_ROOT_PID \
  --offline build -- npm run build
```

Then run these commands through the same wrapper, with distinct receipt names.
The full suite must use `npm test`, which supplies the local executable PATH
required by existing tests that spawn unqualified `tsx`:

```sh
node node_modules/vitest/vitest.mjs run src/recon/modelRetirement.test.ts src/cli.modelRetirement.test.ts --maxWorkers 1 --no-file-parallelism
node node_modules/vitest/vitest.mjs run src/audit/evaluatedAt.test.ts src/assurance src/runtime/evidence.test.ts src/cli.evidence.test.ts src/registry/evidence.test.ts src/registry/freshRegistry.test.ts --maxWorkers 1 --no-file-parallelism
npm test -- --maxWorkers=1 --no-file-parallelism
npm run build
node qualification/root4551/received/scripts/network-guard-control.cjs
```

Default parity is received against the exact base's built CLI, not a modeled
expected result. `build-baseline.py` temporarily restores only the owned CLI
source from the exact base, emits to qualification/root4648/.scratch/baseline-dist,
and restores candidate source in `finally`. Run it serially with no concurrent
build/test/source edit. This is a disposable local receiving build, not an export:

```sh
python3 qualification/root4648/scripts/build-baseline.py
node qualification/root4648/scripts/receive-defaults.mjs
node qualification/root4648/scripts/qualify-consumer.mjs
python3 qualification/root4648/scripts/receive-source.py
```

`receive-defaults.mjs` freezes synthetic system time only for default parity and
compares raw stdout, stderr and status for JSON/human, with/without migration.
`qualify-consumer.mjs` receives exact-base refusal of the new flag, old undated
recovery versus new bounded schedule advice, corroboration, null/omission/missing,
conflict/stale and current-capture recovery. It saves compact actual command
results and full synthetic examples. `receive-source.py` checks every unchanged
base file's Git blob, including all original qualification, and captures owning
source/lock hashes. It allows only the declared scope.

For a single opt-in example, use the existing preload plus the evaluation pin:

```sh
MENDR_EVALUATED_AT=2026-10-23T12:00:00Z \
NODE_OPTIONS="--require $PWD/scripts/no-network.cjs" \
node dist/cli.js rollout qualification/root4648/fixtures/numbers.json \
  --migration qualification/root4648/fixtures/migration-undated.json \
  --models-metadata qualification/root4648/fixtures/list-date.json --json
```

The output's measured verdict is `verified`; reconciliation is `metadata_schedule`
and recovery describes only the schedule window, with unobserved accessibility.
Replacing capture with list-null.json leaves recovery unestablished; list-conflict
against the dated migration conflicts. Default exit conventions remain measured
0/1/3; malformed capture/clock/envelope input refuses with 2. No new --write exists.
`--record` retains the pre-existing outcome schema and artifact facts, not the
metadata reconciliation; save the JSON output when retaining this evidence.
