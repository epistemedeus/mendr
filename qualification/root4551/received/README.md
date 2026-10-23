# Offline mendr receiving

Adopt the pinned foundation for bounded offline reports. Read [RESULT.md](RESULT.md)
for measured limits before allowing writes. This subtree is a source qualification,
not an installed service or a model-quality evaluation.

Use Node >=22 and isolated, clean checkouts at these exact commits:

| Local argument | Repository | Commit |
| --- | --- | --- |
| `--mendr` | `https://github.com/ajitheee/mendr.git` | `413bdc648d3b45d52ed9a2d5a27146e9685f9d7c` |
| `--eventcatalog` | `https://github.com/event-catalog/github-action.git` | `d721c06b0142c55cd23c461734c1423bf95cedb2` |
| `--yolo` | `https://github.com/Lapis0x0/obsidian-yolo.git` | `f5470e7ea1e3fcf5d972fc826b263e2fb0469f25` |

Dependency acquisition is separate preparation. In the mendr checkout run
`npm ci --ignore-scripts --no-audit --no-fund` using its unchanged lockfile.
No dependency installation is needed in A/B. The receiver strips credentials,
preloads mendr's existing no-network guard, runs heavy commands serially, limits
Node heaps to 640 MiB, and samples aggregate RSS against the 2 GiB reservation.
It uses a fresh output directory and refuses dirty or wrong-pin inputs.

From this Pilot checkout:

```sh
python3 experiments/oct23-deadline-compatibility/mendr-adoption/scripts/receive.py \
  --mendr /path/to/mendr --eventcatalog /path/to/eventcatalog --yolo /path/to/yolo \
  --outputs /tmp/root4410-fresh-receiving
```

For a single report, with no Pilot adapter:

```sh
cd /path/to/mendr
node --require ./scripts/no-network.cjs dist/cli.js audit /path/to/repo --offline --json
```

The narrow workflow adapter handles only two synthetic-qualified export shapes:
`@n8n/n8n-nodes-langchain.lmChatOpenAi` and
`openai-gpt-3:CreateCompletion`. It passes extracted selectors to mendr's
`scanConfigText` and bundled registry. It supplies JSON pointers, not migrations,
SDK request verification, workflow execution or a general workflow scanner.
Unsupported nodes remain counted and unassessed. Use the same preload:

```sh
node --require /path/to/mendr/scripts/no-network.cjs \
  experiments/oct23-deadline-compatibility/mendr-adoption/scripts/workflow-report.mjs \
  /path/to/mendr n8n experiments/oct23-deadline-compatibility/mendr-adoption/fixtures/n8n.json
```

For Root's separate upstream receiving, the three self-contained patches under
[upstream/](upstream/) apply to the exact mendr pin. In a disposable mendr clone,
first apply only each patch's new `root4410-*.test.ts` file with
`git apply --include='src/**/root4410-*.test.ts' PATCH`; run those tests and expect
failure on the pin. Apply the rest with
`git apply --exclude='src/**/root4410-*.test.ts' PATCH`, then rebuild and run the
serial suite. The standalone second-check write test can also be copied to
`src/migrate/` to receive the already implemented fail/recovery boundary.
The MIT notice accompanies all substantial copied material. No upstream issue,
comment, PR, publication, workflow installation or live provider call is authorized
by this recipe; Root owns the next receiving decision.

The telemetry boundary also has a built-CLI probe. Run under the same preload:
`node scripts/probe-telemetry.mjs MENDR_ROOT OUTPUT_DIRECTORY` from this subtree.
It exits 1 on the baseline, preserving all five case results, and exits 0 after
patch 0003. The ordinary baseline receiver remains a report-only adoption check;
a passing receiver does not erase these separately reproduced source defects.
