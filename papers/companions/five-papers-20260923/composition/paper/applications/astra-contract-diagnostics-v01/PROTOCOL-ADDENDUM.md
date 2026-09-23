# Revision addendum: request costs and additive-adapter equivalence

23 September 2026. Applies to the separately named Astra manuscript revision. This is a post-review clarification and new diagnostic protocol, **not** a replacement for the frozen September 8 protocols or a retrospectively preregistered experiment. Original source, models, results and protocols remain unchanged.

## A. Active-query contract (C01)

Authoritative implementation: `../active-episode-tree-v01/agent.py`, `Agent.query`, the `for f in fs` request loop. The original protocol's sentence that a two-view node selects both views before branching describes a planned pair, not an unconditional two-call transaction. The actual policy attempts the selected feature IDs in order and aborts acquisition on the first unavailable view. Only a completely returned pair supplies the next branch key. Readout can traverse compatible alternatives using existing evidence after acquisition stops; that traversal is not a new sensor request.

The new diagnostic calls the existing frozen models directly. It changes no action policy:

| Relation-root fixture | Expected request trace | New sensor calls | Nominal acquisition bits |
|---|---|---:|---:|
| No earlier focal observation | feature 8 unavailable; feature 21 not attempted | 0 | 0 |
| Earlier coarse focal value 0 present; current fine value 3 | feature 8 retrieved, then feature 21 sampled | 1 | 2 |

The source IDs are 0 for a new sample, 1 for stored retrieval and 2 for unavailability. An unavailable action has value -1. The diagnostic checks every trace and all sampling/retrieval/unavailable counters for each of the three frozen mixed trees. It also directly inspects the original held-out compact records, rather than regenerating or selecting cases.

The cost estimand is the sum of nominal category widths for completed new acquisitions: coarse = 1, fine = 2. A coarse-to-fine resample is charged 2 more, not 1. Planned-but-unattempted views, unavailable attempts and retrievals incur no *new sampling-bit* charge. They have separately logged operations and are not free in a claim about total computational or biological cost. The training score's 0.1-per-view charge is a separate heuristic; it is not part of the recorded sampling-bit total. Future unconditional-pair experiments must have a new policy/version and cannot silently replace the archived results.

## B. Exact additive fold (C02)

For one gate, write physical rows of its input matrix as P, role rows as R and bias as b. The token consists of physical vector v and a role r that is either zero or one of six one-hot vectors. The additive adapter gives a(r) = 0.5 tanh(r A + b_A). Define a0 = 0.5 tanh(b_A) and ag = 0.5 tanh(A[g,:] + b_A).

Delete the adapter, keep P and all recurrent/head parameters, and set:

    b_folded = b + a0 @ P
    R_folded[g,:] = R[g,:] + (ag - a0) @ P

This preserves `(v+a(r)) @ P + r @ R + b` for zero and one-hot roles. Apply the transformation independently to update, reset and candidate gates. Equal prior hidden states give equal update/reset gates, then equal candidates and next hidden states; induction proves the complete trajectory equality under the same resets. The subtract-a0 term and folded bias are required to cover zero-role tokens. The result does not hold as stated for arbitrary soft or multi-hot role mixtures.

An ordinary role-conditioned core can represent every such frozen additive function, and the additive family includes the ordinary core when its adapter is zero. Thus these two fixed-size functional families coincide on the declared domain. Additional trainable coordinates can still change optimization, implicit regularization or fitting difficulty; this is not an identity of learning algorithms. Multiplicative adaptation has role-by-feature products and is not eliminated by this fold, but a claim about the entire nonlinear GRU family's strict expressive inclusion would require a separate argument.

The new diagnostic loads only the three selected frozen additive archives. It compares each with an in-memory folded ordinary core on the first eight training episodes under recorded one-hot roles, all-zero encoder roles, and alternating zero/one-hot encoder roles, with and without the same scene-switch reset. The branching answer-head role cues stay identical between each compared pair. It checks both probability/state differences and discrete class decisions. No fitted weights are saved and no test-set training occurs. This is 18 forward comparisons, not 18 independent learning experiments.

## C. Resource and preservation contract

One below-normal-priority process and one numeric thread; bounded fixed files only; no training, network, subprocess or recursive search. Source/weight hashes must match original freeze receipts before running. The original manuscript, PDF and read inputs are hashed before and after. An output must use a new filename; existing diagnostic JSON is never overwritten. Run:

    python check_contracts.py RESULT-01.json

Use `RESULT-02.json` for a replay. Runtime seconds are excluded from scientific equality; source identities, fixtures, arrays' comparison statistics and archival metrics must reproduce. The result validates the inspected contracts only, not the full SAN model or the prospective joint-configuration experiment in Section 6.8.
