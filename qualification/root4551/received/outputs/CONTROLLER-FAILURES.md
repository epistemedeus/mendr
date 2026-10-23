# Retained controller and fixture corrections

These are receiving-harness findings, separate from the reproduced mendr defects.

- The first invocation put the positional command name before argparse options.
  `run-command.py install --cwd ... --outputs ... -- npm ci ...` exited 2 with
  `the following arguments are required: --cwd, --outputs`. Options precede the
  name in the working recipe. Dependency acquisition subsequently exited 0.
- `qualify-baseline` exited 1: a build fixture failed both before and after the
  patch, so mendr correctly returned `inconclusive`, while the harness expected
  `failed`. `qualification-first-attempt.json` and the original log retain the
  useful completed cases. The corrected fixture fails only after the model swap.
- `qualify-corrected-fixture` exited 1 on an unexpected write through opaque
  spread parameters. This is a real mendr gap, not a reason to weaken the assertion.
  Its exact source shapes are preserved in `upstream/root4410-request-spread.test.ts`,
  with separate baseline-red and repaired-green receipts. The main receiving
  corpus now independently checks the existing explicit incompatible-parameter
  hold using `prompt_cache_retention`.
- The first YOLO audit command exited 0, but the controller bounded its raw JSON
  log before parsing it. Parsing then failed at character 131073. This log is
  retained as `audit-yolo.log`, not a usable report. The runner now parses JSON
  first, retains a structured artifact without source snippets, and records the
  original output SHA-256. `audit-yolo-receive` is the intact rerun.
- `upstream-regressions-green` exited 1: one inherited assertion expected the old
  reason for an already-held spread case. Both outcomes were Tier B. Its owning
  test now expects the new specific spread reason; the subsequent receiving
  passes. The failed receipt remains unchanged.
- The first install/build resource receipts conservatively included the command
  launcher in descendant bookkeeping; ownership expansion was corrected before
  the full baseline suite. Original receipts remain. Surviving test PIDs were
  inspected as zero-RSS zombies under the native host parent, not live workers.
- `agent-status --json` ran once and returned attention/exit 2 because the cloud
  checkout lacks browser-health/session-health executables. Neither surface is
  used by this task; no component polling, model child or unrelated repair ran.
- The repository's `tools/ops/doc-hygiene --json` wrapper exited 127 because its
  `/bin/zsh` interpreter is unavailable here. The existing model-free owning
  entrypoint `node tools/ops/doc-hygiene.mjs --json` runs successfully; no sibling
  operating file was amended to change the host-specific wrapper.
- The first staged `git diff --check` flagged preserved log EOFs, unified-diff
  context spaces and the upstream licence's Markdown hard breaks. These bytes
  are evidence, not edited source. Scoped attributes exempt only captured logs,
  patch files and copied notices; ordinary source and documentation retain the
  whitespace check. The original evidence bytes remain unchanged.
