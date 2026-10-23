# ROOT4904 handback

Tested minimal maintainer projection exported to the admitted fork. Original
native session 01a168b6-d156-7051-a126-69c32e0e42a6 and canonical writer are preserved.
Original source `7cb956dd0f4b1b8d8b9b1d763a4065a4c3202380` / tree `93906d64afd416c02c3b94ac8142790f86795b92` remains unchanged;
canonical continuation commits change only qualification/root4904.

Feature: `fe4cf6d6114d206ddf37e28409472388d77cc746`, tree `9a6593a9efc1fb5dd4fb755053edde9c0c9579ac`, branch
`codex/mendr-provider-metadata-20261023`. **One feature commit, 15 files**, no qualification corpus.
Exact dependency base: `e74fa18d16592eb47c6c70920732df2ffc7de717`, tree `bd212a16a3e3dae9379e6c826444107923492830`,
branch `codex/mendr-provider-metadata-20261023-dependencies`. It merges the existing exact PR79 head
10b4ed4b65908bf9cca421174562524902f2c189 and PR81 head
55e4a3499a0330aa8de4e36c9a7659202635af4d without replaying safety patches.
Upstream main: `413bdc648d3b45d52ed9a2d5a27146e9685f9d7c`, tree `601dc96f4658585058cdd06df23e6a2728e4a9d2`.
PR80 remains separate. Full source inventories, source hashes, parents and all
base/head/tree bindings are in [PROJECTION.json](PROJECTION.json).

**Submission hold:** PR79/81 are still open. Apply only feature commit fe4cf6d
once they land, or explicitly arrange that stack with the maintainer. The current
main-based comparison contains the dependencies (21 files), so it is not a
standalone feature-only PR. Root alone receives/submits. [PR-DRAFT.md](PR-DRAFT.md)
is recipient-scoped and discloses AI assistance/offline captures.

The runtime module and rollout integration are byte-identical to the accepted
feature. Tests/required fixtures and synthetic clock now live in ordinary src
paths; the contract is MODELS-METADATA.md. README points there. No original
qualification history, package/lock change, registry mutation, duplicated scanner
family or new write/network authority is in the feature commit. Original canonical
source retains all safety families; this projection does not newly qualify PR80.

Actual projection verification: Node22 locked build, **107 focused** and **118
related** tests; full serial suite **2321 tests/128 files**, zero failures/skips.
These are new fe4cf6d runs, not 7cb/Root4836 counts. Actual built consumer passes
**10 cases**, malformed-input refusal exit2 and restoration;
four raw stdout/stderr/exit controls match the separately built exact dependency
base. Six attempted outbound primitives are blocked before network I/O. Actual
built main adverse controls show why PR79 (unknown-date revert) and PR81
(missing-outcome false health) are needed. All commands/exits/source bindings are
in receipts/COMMANDS.json; raw outputs are retained unchanged.

All heavy commands were serial within 2,097,152 KiB total, zero model children.
Peak sampled launch/native/supervisor/owned-command RSS: **1,424,792 KiB** at100ms;
no reserve stop/OOM/extra reserve. This is not a kernel peak. Isolated short HOME,
credential-free allowlist, unchanged Node preload; no OS whole-family egress claim.
Completed command descendants are gone except recorded zero-RSS zombies. Three
owned source/baseline worktrees are retained for receiving; shared dependencies
and every other job/enrollment are untouched. Root receives own admission/native
termination and external controller cleanup separately.

The checkpoint was recorded15:03:11UTC and admitted fork heads verified15:03:50UTC,
before15:04:10.529. New horizon is16:28:41.750UTC; no old deadline was inherited.
Original successful/first-failed receipts and Root4836 observations remain labelled.
No product/test failure occurred in projection receiving. Packaging observations
(raw patch whitespace and an initially incorrect handback receipt-count assertion)
are recorded in SELF-REVIEW.md, with original logs intact.

No live Models/provider API, inference, provider key/account, billing/payment,
external PR/comment/release, installation/deployment, human publication or adoption
is established. Final canonical export identity is supplied in the native final
response; controller handbacks use ROOT4904-WORKER-* separately from runner files.
