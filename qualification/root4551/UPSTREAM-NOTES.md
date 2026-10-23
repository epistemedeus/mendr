# Motivation and checks

Unknown retirement schedules must not authorize a revert, and an announced date
must not be described as an observed endpoint outage. Opaque request spreads
leave the effective model/parameters unknown, including through fallback and
conditional arguments, so those requests need review. Missing or malformed
telemetry outcomes and optional measurements must stay unknown rather than
silently becoming healthy or measured zero.

Preserve explicit requests and legacy constructed CallSample inputs. Reuse the
existing classifier, migration, second-check and rollout gates. The three received
corrections remain separate commits; the additional spread amendment has a
failing regression and actual type/eval-passing write reproduction.

Validation: baseline 2,207 tests/124 files; exact semantic reds reproduced; final
2,230 tests/128 files and build pass offline. Five built rollout cases, 22 existing
migration corpus cases, actual disposable held/eligible writes, and second-check
failure followed by exact-source recovery pass. No dependency, lock or registry
change. Detailed commands, first failures and limits are in WORKER-HANDBACK.md.

Prepared for Root receiving; no upstream issue/comment/PR or release was opened.
