# Review-ready source notes

`rollout --migration` recomputes recovery advice from a saved artifact, so it
cannot account for a newly supplied Models retirement schedule or a contradiction
between that capture and the artifact. Add `--models-metadata FILE` to reconcile
exact direct OpenAI source IDs, preserve caller-supplied provenance and scope,
and pass only supported schedule dates to the existing recovery planner.
Measured rollout judgment and default output stay unchanged.

The versioned offline envelope carries provider/surface, exact list/retrieve
locator, retrieval time, explicit capture scope and raw response JSON. Date,
null, omitted field and missing model are distinct. The fixed capture age limit
is 24 hours; future, stale, malformed, partial, conflicting and unsupported
captures cannot establish recovery assurance. Official URLs and byte digests
are not authentication. An artifact does not record its workload serving
endpoint; the report exposes that missing observation. No registry freshness,
replacement, lifecycle, verification field or write gate is promoted.

The product change is limited to the new recon module and optional rollout
imports/options/action. Original safety implementations and qualification remain
byte-preserved. Fixtures/tests exercise the built CLI and real recovery and
telemetry consumers under the existing no-network preload. Saved baseline
stdout/stderr/exit controls receive the default path byte-for-byte. WORKER-RESULT
and command receipts own final validation counts, failures, recoveries and limits.

Product commits are separate from the final qualification export, so Root can
review/adopt the bounded implementation and its necessary tests/fixtures as a
coherent source batch. ROOT4626's newer projections and any shared CLI integration
remain Root-owned; no refs from that family were fetched or repackaged. Do not
infer adoption, release, installation, live availability or customer use from
these local synthetic results. No PR or upstream action was opened.
