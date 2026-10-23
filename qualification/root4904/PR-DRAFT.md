Title: Reconcile supplied Models retirement metadata in rollout recovery advice

`rollout --migration` can now accept an optional offline `--models-metadata FILE` capture. It reconciles exact direct OpenAI source-model schedules while retaining null, omitted, missing-model, provenance, freshness and conflict facts. Supported dates feed the existing recovery planner; measured rollout verdicts and default output remain unchanged. Captures are caller-supplied and unauthenticated.

Depends on #79 (unknown schedules must not assure revert) and #81 (missing telemetry must remain unmeasured). The feature is one commit, `fe4cf6d6114d206ddf37e28409472388d77cc746`, above an exact merge of their received heads. Apply that feature commit after those dependencies land; the current comparison against main includes the pending dependency commits. #80 remains separate.

Validation on this projection: locked Node 22 build, 107 focused and 118 related tests, 10 shipped-CLI cases plus malformed-input refusal/restoration, and four byte-equal default-parity controls against the exact dependency base. Full serial suite: 2321 tests/128 files, zero failures/skips. AI-assisted implementation and packaging; synthetic offline captures, no live provider evaluation.
