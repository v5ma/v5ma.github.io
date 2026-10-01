# Exact anatomical register for the hue component

19 September 2026. This register makes a small published anatomical neighborhood usable and auditable. It is **not a fitted hue circuit, a whole connectome, or the connected SAN application**.

## What was recovered

Exactly 22 author CSVs, totaling 17,053 bytes, from [chreyesees commit 91cf92581d2abaea72b96a994d69ed6d83ae05f9](https://gitlab.com/rbehnialab/chreyesees/-/tree/91cf92581d2abaea72b96a994d69ed6d83ae05f9): two seed summaries and input/output tables for ten sampled cells. The publication identifies an adult female *Drosophila melanogaster* brain from the Zheng et al. EM dataset. The reported identifiers are FlyWire IDs, but these sources do not pin a materialization release. No current-release replacement has been made.

| Cell label | Reported identifier |
|---|---|
| pDm8 | 720575940638634960 |
| yDm8 | 720575940638424895 |
| Tm5a | 720575940639473998 |
| Tm5a | 720575940614902495 |
| Tm5b | 720575940627282584 |
| Tm5b | 720575940660846721 |
| Tm5c | 720575940619252603 |
| Tm5c | 720575940627314521 |
| Tm20 | 720575940635252890 |
| Tm20 | 720575940628559366 |

The generated register preserves **538 row-level connection observations**, **528 identified ordered neuron pairs**, and **347 distinct identified nodes**. These quantities are not synapse totals, independent biological samples, or twelve fitted population units. Two observations have unidentified partner IDs and remain separate observations rather than a fabricated shared node.

Inputs are directed partner → seed; outputs seed → partner. Raw headers, rows, compartment count columns, file/line locations and hashes remain attached. The first two headings of one Tm5b output table are reversed relative to its values; the exception is explicit. No sign, fitted weight, delay or time constant has been inferred from a count. Missing rows are unreported, not established zero-strength connections.

## Differences retained, not silently repaired

Eight identified routes appear in both input and output views. Six have matching reported counts. Two do not:

| Ordered route | Input view | Output view |
|---|---:|---:|
| yDm8 720575940638424895 → Tm5a 720575940639473998 | 13 | 22 |
| pDm8 720575940638634960 → Tm5b 720575940627282584 | 16 | 34 |

The detailed pDm8 input rows sum to 221, versus 217 in its summary. The detailed yDm8 output rows sum to 369, versus 375. The article and repository summaries also differ in output-site/partner totals and one yDm8 input total. Twenty node IDs have more than one recorded label; this includes case/specificity variants and some distinct type names, not twenty proven classification errors. See the [full source and model audit](../../research/HUE-ANATOMY-AND-MODEL-BOUNDARY-20260919.md).

These are unresolved source/version/counting differences. Neither view is silently preferred, averaged or added to its duplicate. Resolving them is a prerequisite for any definitive route-count reconstruction using these entries. It does not invalidate the authors' broader experiment or license an unsupported negative verdict.

## Evidence and checks

- [Analysis plan and interpretation rules](ANALYSIS-PLAN.json).
- [Seed identities, specimen and source summaries](results-01/SEED-REGISTER.json).
- [Every source row, counts and direction](results-01/EDGE-OBSERVATIONS.json).
- [Ordered routes with all views preserved](results-01/ROUTE-REGISTER.json).
- [Every node label observation](results-01/NODE-LABEL-OBSERVATIONS.json).
- [Source reconciliation](results-01/SOURCE-RECONCILIATION.json).
- [Build receipt: 1,767 checks](results-01/EXECUTION.json).
- [Separate recomputation: 1,224 checks and eight rejected corruption cases](results-01/SEPARATE-CHECKS.json).
- [Twelve-population model contract and unresolved fitted fields](CIRCUIT-REPRODUCTION-CONTRACT.json).

The build took 0.071 seconds and the separate check 0.038 seconds, each as one low-priority process using only small local inputs. These are observed execution times, not a performance guarantee. The second checker parses the original CSVs without importing the builder. Its deliberately corrupted in-memory cases cover reversed direction, numeric identifier loss, invented sign/timing, collapsed unknown IDs, concealed header exception, double-counting and silent count selection. No original source or accepted result was changed. Both checks belong to the same authoring workflow; neither is independent scientific review.

## Exact route onward

The twelve-population published model needs an explicit cell-to-population and direct/disynaptic aggregation map, additional cited photoreceptor circuitry, final signed/normalized weights, 29 fitted parameters, preprocessing, and intervention configuration. Its pooled Tm20 readout weights pale/yellow populations by one-third/two-thirds. Its TeNT comparison refits an offset and gain for each perturbed Tm population. Those details must survive reproduction.

The paper fits equilibrium amplitudes, not neural time constants or oscillatory phase. Any temporal or SAN receiving-state extension must therefore carry its own parameter provenance, tests and claim label. The memory reproduction and engineering episode remain intact as separate components; this register does not silently connect them. Next work is a source-constrained receiving implementation with explicit unknowns, followed by the declared internal-use and action-return tests.

No large archive, private database, external executable, sealed session, Book 2 edit or publication action was involved. Repository code's MIT notice is preserved; data redistribution and complete release licensing still require explicit review.
