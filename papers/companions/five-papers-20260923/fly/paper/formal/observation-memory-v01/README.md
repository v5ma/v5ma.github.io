# Observation history and retained-memory proof leaf

19 September 2026. **Seven abstract state/reset lemmas compiled with Lean 4.30.0; no axiom dependencies.** The metric half-separation bound remains analytic: its separate Lean source did not finish within the runtime budget. Independent review and Python refinement are not complete.

## Readable result

[M7](../../MATHEMATICAL-SUPPLEMENT-04.md) says that equal complete initial state and equal permitted sensory/body-return histories produce equal states and actions in a deterministic controller. The formal result is not limited to the application's two sample worlds. It covers the displayed abstract functions and every finite horizon.

[M8](../../MATHEMATICAL-SUPPLEMENT-05.md) specifies a reset that clears temporary episode state without changing retained learned state. That reset is idempotent, preserves retained-only predictions, and commutes with a learned update **only under the stated dependency assumptions**. It does not preserve every action or commute with the whole body-feedback method.

The existing two-world test has now been replayed using every controller field, not merely the compact status display. All **394 interface checks** pass. This is runtime correspondence evidence, not a compiler-verified translation from Python into Lean.

## Evidence map

- [Exact Lean state/reset source](ObservationMemory.lean)
- [Successful compiler receipt](check-03/CHECK.json) and [kernel dependency reports](check-03/stdout.txt)
- [Claim signature](claim-signature.json) and [human-readable scope](claim-signature.md)
- [Assumption/challenge readback](ASSUMPTION-AND-CHALLENGE-READBACK.md)
- [45-check proof/log/finite-witness audit](AUDIT.json)
- [Claim-schema validation](SIGNATURE-VALIDATION.json)
- [Application interface and reset mapping](APPLICATION-INTERFACE-MAP.md)
- [394-check application receipt](interface-audit-01/EXECUTION.json)
- [Complete-state replay snapshots](interface-audit-01/FULL-STATE-REPLAYS.json)
- [Reset controls](interface-audit-01/RESET-CONTROLS.json)
- [Metric source, NOT certified](MetricBound.lean)

## Attempts and resource boundary

| Attempt | Target | Result |
|---|---|---|
| [01](check-01/CHECK.json) | Combined initial source | Process-safety query denied by sandbox; compiler not reached |
| [02](check-02/CHECK.json) | Combined initial source | Stopped at 45 seconds; no proof result |
| [03](check-03/CHECK.json) | Standard-library state/reset source | Exit 0, 19.390 seconds; seven dependency reports, each empty |
| [04](check-04/CHECK.json) | Separate metric source using broad imports/tactic | Stopped at 45 seconds; no proof result |
| [05](check-05/CHECK.json) | Smaller metric import and explicit inequality proof | Stopped at 45 seconds; no proof result |

Every attempt preserves its input, runner, output and hashes. The timeouts do not establish a proof defect or a particular performance cause. All compiler children were limited to one CPU at below-normal priority and stopped by the runner's own process-tree guard. The shared lease gate was retained. No aggregate build, library installation or source change in the shared proof project occurred; only the compiler's transient lease/schedule records were updated. The separate finite audit took 0.615 seconds, and the 48-event input replay took 0.019 seconds.

The runner was adapted from the existing NRCT paper's single-target check harness. Its first combined check also constrained Lean's thread-pool setting; the later checks retain one-CPU affinity but leave that orchestration pool at its default. Because the source/dependencies changed too, this sequence does not isolate the reason the successful check finished. No performance-causality claim is made.

## What was checked mathematically

The successful source imports only `Std`. Kernel output reports no axiom dependencies for `stateAt_eq_of_history`, `history_equivalence`, `decoded_state_eq`, `reset_preserves_learned`, `reset_is_idempotent`, `reset_update_commute`, and `reset_preserves_retained_prediction`. The named theorem inventory, source bytes and requested/returned dependency reports match exactly.

A separate finite implementation checks 768 prefix-equivalence cases, 729 exact-rational metric cases and 125 reset configurations, with explicit premise-violation witnesses. These are supplemental checks, not substitutes for universal proofs. In particular, the metric examples do **not** turn the timed-out metric compilation into a success.

## Remaining boundaries

These are elementary conditional results, not novel general mathematics. Compilation checks the displayed definitions, not whether an entire Python process is free of undeclared channels, whether a sensor measures the claimed variable, or whether a fly has the modeled state partition. Current status remains `yellow`: same-agent audits complete for the listed scope; independent mathematical, software and scientific review open. The SAN-specific joined application, physiological fidelity, calibrated uncertainty and experience claims remain separate.
