# Assembly information: formal supplement v01

For **Neural Rendering Composition and Granularity Tuning**, Draft 2C working.

## Result and boundaries

The [Lean source](AssemblyInformation.lean) was checked with the installed Lean
4.30.0 compiler through the existing serialized compiler wrapper. The
[successful receipt](check-04/CHECK.json) records exit code 0, unchanged source,
and a 3.8-second run. The [compiler output](check-04/stdout.txt) includes an axiom
report for all twenty statements. None depends on an admitted proof or a
domain-specific axiom. Some use the standard foundations `Classical.choice`,
`propext`, and `Quot.sound`. One non-failing simplification-style warning is
recorded. There is no claim of twenty new mathematical discoveries.

These statements concern a declared deterministic representation model and
simple finite examples. They do **not** verify the Python application, stochastic
neural dynamics, learned optimization, biological mechanisms, or experience.
Independent mathematical and scientific review remains pending. The claim
signature therefore retains a review-pending status even though the compiler
check succeeds.

## Mapping to the manuscript

| Manuscript item | Formal statement(s) | Exact coverage |
|---|---|---|
| Proposition 1 | `exact_iff_fiber_constant` | Factorization iff constant on representation fibers, generalized to arbitrary types and readout on the attainable image |
| Collision consequence | `collision_prevents_exact`, `collision_forces_one_error` | No exact decoder can separate a pair whose code is identical but whose target differs |
| Proposition 2 | `refinement_simulates`, `refinement_risk_of_attained_minimum` | Every coarse decoder is simulated by a fine one; risk inequality **assumes** the fine minimum is attained |
| Recoding boundary | `left_inverse_preserves_fibers`, `left_inverse_preserves_exact_access` | A left-invertible postprocessing preserves distinctions and exact task access |
| Proposition 3 | `x_does_not_determine_y`, `y_does_not_determine_x` | Both directions of binary-coordinate incomparability |
| Binding/readout example | `flipped_identity_readout_fails`, `inverse_readout_rescues` | Fixed Boolean readout fails after inversion, while a compensating inverse recovers exactly |
| Proposition 4 | `same_primary_behavior`, `same_primary_sequences`, `selective_cannot_answer_z`, `full_can_answer_z` | Identical declared primary outputs for all finite sequences, but different auxiliary information access |
| Proposition 5 | `all_binary_queries_iff_injective` | Exact answers to **all binary queries on the declared state space**, without changing the representation, iff injective encoding |
| Equation 10 consequence | `sixteen_fine_pairs`, `coarse_order_attains_twelve`, `every_table_at_most_twelve`, `every_coarse_decoder_at_most_twelve` | The finite optimal count is 12/16; all 81 deterministic maps from four coarse pairs to three labels are bounded |

The temporal-order result is an optimum for the stated uniform sixteen-state
model. It is not a ceiling on a finite evaluation sample, a learned decoder's
performance, or a biological task. The observed 38/48 post-hoc sample accuracy
does not conflict with the model expectation 12/16.

The formal risk result treats risk as a common functional of predictions and
supplies the existence of a minimum as an explicit premise. It does not prove
the manuscript's separate finite attainment argument. The general
maximum-frequency error formula, Gaussian example, total-cost inequality, and
uniform-probability auxiliary accuracy discussion remain analytic rather than
formally verified. Their scope has not silently been expanded.

## Reproduction

Run the [guarded runner](run_check.py) with an unused literal attempt name, using
the installed local Python interpreter. It refuses to overwrite an earlier
attempt. It pins the already installed compiler's bin directory ahead of
launcher shims in this process only, submits one exact `Check` target through
`Invoke-LeanWithLease.ps1`, and uses a below-normal-priority Windows process job
with a 45-second timeout. Closing that owned job terminates its descendants,
not other owners' processes. No model, Lean toolchain or Mathlib download is
requested. It imports only `Std`; it does not build the shared aggregate target.

The wrapper's transient compiler lease and schedule are the only expected
coordination writes outside this paper. No shared proof source, other paper,
Book, wiki content, catalog or provider record was edited.

The result is tied to source and runner hashes, pinned toolchain bytes and the
wrapper hash. A portable licensed release with its own environment setup is
still a later task. Checking this file is not the same as building a dependency
graph of reusable `.olean` modules.

## Attempt history

1. [check-01](check-01/CHECK.json): sandbox denied the wrapper's filtered Windows
   process query; the Lean check did not run.
2. [check-02](check-02/TIMEOUT-NOTE.md): the initial runner timed out after 55
   seconds and did not preserve partial output. The source and before-receipt
   survive. A subsequent filtered check found no surviving Lean/Lake/Elan
   process. The stale lease was reclaimed by the next normal wrapper run.
3. [check-03](check-03/CHECK.json): the pinned executable path returned an actual
   Lean error for an unavailable tactic. That unsuccessful elaboration's axiom
   output contains an error placeholder and is **not** certification. The
   runner also encountered a console encoding error after saving the receipt.
4. [check-04](check-04/CHECK.json): the exact tactic and console handling were
   corrected; exit 0, twenty audited statements, no admitted proof. The one
   stylistic warning remains visible.

All failed sources, available outputs and before-receipts are preserved. The
missing check-02 partial output is a recorded evidence gap, not fabricated.

## Review package

- [Typed claim signature](claim-signature.json)
- [Assumption and challenge readback](ASSUMPTION-AND-CHALLENGE-READBACK.md)
- [Exact evidence audit](AUDIT.json)
- [Audit implementation](audit.py)

The readback is the same assistant's explicit self-audit. It is not an
independent expert or human review.
