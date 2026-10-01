# Learned active episode classifier

This application learns which coarse or fine observation to request and which response to make from labeled examples. It keeps only evidence encountered during evaluation. A three-query episode separates the earlier scene, a changed scene and a later role change in that same new scene. It is a conventional supervised query-tree comparator with a structured episodic store, not a neural SAN implementation, a reinforcement-learning agent or a model of experienced multimodal content.

All twelve seed/family models, containing 96 task trees, are frozen before development or held-out cases are constructed. The 41 current pre-fit checks pass. A post-result implementing-assistant audit passes 52 checks, reconstructs all 101,376 held-out query-condition records and verifies the training counts of 2,676 learned nodes. The entire held-out numeric archive, case archive and bounded example file replay byte for byte. Counts describe repeated queries across conditions, not independent participants: there are three fitted seeds and 16 held-out background blocks per seed. No independent human review is claimed.

## Main result

| Condition | Query 2 accuracy | Query 3 accuracy | New source bits at query 2 | Source bits across all three queries |
| --- | ---: | ---: | ---: | ---: |
| Mixed coarse/fine, paired lookahead | 0.856771 | 0.832031 | 1.960938 | 6.291667 |
| Exactly equivalent attention interpretation | 0.856771 | 0.832031 | 1.960938 | 6.291667 |
| Single-view learner | 0.833333 | 0.820313 | 1.867188 | 6.151042 |
| Fine-only learner | 0.856771 | 0.834635 | 2.500000 | 7.927083 |
| Coarse-only learner | 0.526042 | 0.518229 | 1.710938 | 6.169271 |
| Complete record, explicitly sampled | 1.000000 | 1.000000 | 12.000000 | 24.000000 |
| Reference memory reset | 0.820313 | 0.820313 | 1.867188 | 6.151042 |
| No new samples after world change | 0.263021 | 0.250000 | 0.000000 | 2.541667 |
| Assembly coarsened after acquisition | 0.533854 | 0.531250 | 1.960938 | 6.291667 |
| Assembly bindings permuted | 0.622396 | 0.608073 | 1.960938 | 6.291667 |
| Inverse binding restoration | 0.856771 | 0.832031 | 1.960938 | 6.291667 |

Query 2 and query 3 contain equal counts for each of eight tasks. Source bits are nominal category widths, not Shannon entropy, energy or total computation. The complete-record condition is an information-rich control, not cost matched. Fine-only is slightly better at query 3; there is no uniform mixed-granularity dominance. The attention interpretation is the same algorithm, not a separately trained strong alternative.

For the mixed learner's second-query temporal relation, 144 repeated queries have a retained coarse or fine earlier focal observation and score 1.000; the other 240 score 0.500. The agent cannot recover an observation it never encountered. For the conditional task, a learned coarse gate requests one bit when another observation is unnecessary and three bits when a fine value is needed; both branches answer correctly. The original recurrent neural failures are preserved elsewhere and have not been repaired by this different comparator.

## Inspect and reproduce

- [Prospective protocol](PROTOCOL.md), [configuration](CONFIG.json), [current pre-fit tests](TESTS-02.json) and [initial test correction](pre-fit-test-review-01/README.md).
- [Training freeze](fit-01/FROZEN.json), [original training data](fit-01/training-data.npz) and the twelve exact model paths in that freeze.
- [Development result](development-01/RESULT.json), [held-out result](heldout-01/RESULT.json), [held-out full traces](heldout-01/predictions.npz) and [replay result](heldout-replay-01/RESULT.json).
- [Readable success and failure traces](heldout-01/EXAMPLES.json), [audited summaries and conditional intervals](SUMMARY-02.json), [current audit](AUDIT-02.json) and [audit source](audit.py).
- [Mixed-granularity mathematical witness](MATHEMATICAL-WITNESS.md).
- [Architecture diagram](../../figures/active-episode-architecture-v02.png) and [result graph](../../figures/active-episode-results-v02.png).

To reproduce without overwriting evidence, use a new empty directory containing the nine source files listed in `common.py` plus `audit.py`. With Python and NumPy already installed, run `test_application.py`, `train.py`, `evaluate.py development-01 development`, `evaluate.py heldout-01 heldout`, `evaluate.py heldout-replay-01 heldout`, then `audit.py 02`. Existing targets are refused. Recorded durations are not expected to reproduce, but held-out predictions and traces from each frozen fit must reproduce exactly. The plotting entry point belongs to the wider paper package. This is local source, not an installed service or background job.

All execution uses one numeric thread and below-normal Windows priority. Training took approximately 1.6 seconds, each evaluation approximately four seconds, and the complete trace audit approximately ten seconds. No GPU, new dependency, model download or parallel worker was used. Source labels, query grammar, memory format and learning objective are supplied; sensor choices and answer distributions are learned. The offline learner sees complete training examples. It does not learn long-horizon retention, task inference or a physiological mechanism. Licensing and independent review remain open.

The initial audit source and 50-check receipt remain preserved as `audit-initial-01.py` and `AUDIT-01.json`. Audit 02 adds explicit equal-task-count and target-independent role-sequence verification; it does not alter training, inference or results. Figure version 01 is preserved but is not the current display: version 02 repairs footer overlap and explicitly diagrams returned observations. These are review corrections, not performance selection.
