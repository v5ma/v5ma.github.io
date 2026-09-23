# Hue anatomy: source recovery and the fitted-model boundary

19 September 2026. Follow-on to the [earlier hue source audit](HUE-COMPONENT-SOURCE-AUDIT-20260919.md). This records a bounded source recovery and a new local register, not new animal measurements or reproduction of the fitted circuit.

## Sources actually read

Primary source: [Christenson et al., Hue selectivity from recurrent circuitry in Drosophila](https://doi.org/10.1038/s41593-024-01640-4), *Nature Neuroscience* 27, 1137–1147 (2024). The preserved [article XML](../../access/617913ba16156ab7.md) has SHA-256 `5ae837f2d0d95cf015f2886256eb0ea41a1b12bba0628ec03fdf40ca6e2cbe42`. This pass read Sec7 including the complete Figure 4 caption, Sec28 (circuit model), Sec35 (EM reconstructions), and reread Sec13 (two-photon imaging). The prior audit records other sections already read. This is not a claim of complete article/supplement or visual PDF inspection.

All 22 CSVs in [intake 09](../../access/fb65c3e2e8d59f74.md), [intake 10](../../access/d1e81370a29c356e.md) and [intake 11](../../access/63cc220d50e61e61.md) were read in full. Every accepted CSV matches its Git blob at commit `91cf92581d2abaea72b96a994d69ed6d83ae05f9` of the [authors' repository](https://gitlab.com/rbehnialab/chreyesees/-/tree/91cf92581d2abaea72b96a994d69ed6d83ae05f9). The pre-existing fixed directory inventory, not a new recursive search, selected these inputs. Two duplicate-name/root aliases were excluded from the census, not deleted from the source repository.

The current reread also covered all of `together.py` and `transform.py`, and `analysis.py` lines 986–1122. Its `AllModelsCV` table stores fitted values for single-neuron encoding models; it must not be cited as proof that the final twelve-population recurrent checkpoint was located. Generic fitting and database-storage code do not identify the exact published fitted configuration. No author module or private database was executed or accessed.

## Anatomical identity and counting unit

Sec35 describes the adult female brain EM dataset of Zheng et al. Eight seed Tm cells—two each of Tm5a, Tm5b, Tm5c and Tm20—plus pDm8/yDm8 were identified in FlyWire. Their exact reported IDs are in the [seed register](../application/anatomical-register-v0/results-01/SEED-REGISTER.json). No materialization version is established by the inspected sources. A new FlyWire release, MaleCNS, or the entire current connectome must not be substituted without a separately documented mapping.

Each table row is a reported partner/count observation. Inputs point into the seed; outputs point away. Compartment-labelled counts remain separate columns. Their sum is explicitly descriptive, not automatically the physiological coupling strength. Two pDm8 output rows lack partner identifiers and remain unmerged. One Tm5b output header reverses its identifier/type labels; parsing follows the row values while retaining the header and recording the exception.

The resulting **538 observations, 528 identified directed pairs, 347 identified nodes and ten seeds** are distinct counting units. Eight pairs occur in both views. The overlap does not license summing two reports as additional synapses. Absence from these incomplete/thresholded tables does not prove that an anatomical connection is absent.

## Exact unresolved discrepancies

| Quantity | Article Sec35 | Pinned repository summary | Detailed tables |
|---|---:|---:|---:|
| Total input sites across seeds | 2,754 | 2,754 | Not a complete-site inventory |
| Identified input sites | 2,084 | 2,084 | pDm8 rows differ from its own summary |
| Input partner count text | 296 | `296 (293)` | Not silently converted to one pooled unique count |
| Total output sites across seeds | 6,162 | 6,162 | Not a complete-site inventory |
| Identified output sites | 2,132 | 2,155 | yDm8 rows differ from its own summary |
| Output partner count text | 270 | `274 (243)` | Counting conventions not resolved |
| yDm8 input-site statement/summary total | 487 | 462 | Identified rows sum to 379, a different quantity |

Two detail-versus-summary differences are localized: pDm8 inputs sum to 221 versus 217 identified in the summary; yDm8 outputs sum to 369 versus 375. Two between-view pairs differ:

- yDm8 → Tm5a: `inputs_tm5a_720575940639473998.csv`, row 5, reports 13; `outputs_yDm8_720575940638424895.csv`, row 3, reports 22.
- pDm8 → Tm5b: `inputs_tm5b_720575940627282584.csv`, row 6, reports 16; `outputs_pDm8_720575940638634960.csv`, row 2, reports 34.

The complete provenance is in [SOURCE-RECONCILIATION.json](../application/anatomical-register-v0/results-01/SOURCE-RECONCILIATION.json). Twenty IDs have label variants; some differ only in case or specificity, others have distinct type names. No automatic taxonomy merge or accusation of incorrect classification follows. Sec35 describes >2-synapse input and >4-synapse output inclusion, but several detailed input rows contain one or two sites. Previously identified photoreceptor inputs are described separately; whether that explains every low-count entry remains unverified. Preserve the rows instead of silently enforcing a threshold after the fact.

These differences may reflect counting, compartment or source-version conventions. This audit does not determine the cause, choose an authoritative count, or establish that a published conclusion changes. Any numerical reconstruction must state how it handles these exact ambiguities and test the consequence of admissible alternatives.

## Ten anatomical seeds are not twelve dynamical populations

Sec28 orders the model as pR7, yR7, pR8, yR8, Dm9, pDm8, yDm8, Tm5a, Tm5b, Tm5c, pTm20 and yTm20. Its weights include additional photoreceptor/Dm9 circuitry from Heath et al., direct and disynaptic Tm contributions, sign constraints from prior work, and optimized effective signs. Dm8-to-Dm8 interactions were not reconstructed and are fitted. Consequently, these 22 tables alone do not define the published 12 × 12 signed matrix.

The 29 free parameters are eleven nonlinearity asymmetries (Dm9 fixed at zero), eight gains (four photoreceptors share one; Dm8s share one), one shared receptor-input weight, seven nonchromatic input weights, and two Dm8 interaction parameters. Incoming recurrent absolute weights plus receptor-input weights are normalized together. The nonchromatic term is separately specified in the equation. Simply normalizing every raw input count would not reproduce this model.

The model equation is transformed to a fixed-point problem. Anderson acceleration is run to a stated tolerance below 10^-4; fitting uses implicit differentiation, staged photoreceptor/Dm9 → Dm8 → Tm optimization, batch size 64, at most 100 epochs per stage, and learning rate 0.001. The source loss is a specified weighted normalized response agreement, described by the authors as correlation. Do not silently substitute a different centered correlation or the diagnostic's weighted R². The 10,000-random-weight null is an additional published analysis and has not been rerun here.

Figure 4 maps pTm20 and yTm20 to the pooled Tm20 response with weights **one-third and two-thirds**. For the TeNT output-blocking comparison, offset and gain—two parameters for each perturbed Tm population—are refitted. It is therefore not a zero-refit prediction. Recorded cells retain their inputs/state while their outputs are blocked. The generic engine's orientation and post-block normalization behavior were checked in the earlier audit; the final fitted call still needs recovery.

The [machine-readable reproduction contract](../application/anatomical-register-v0/CIRCUIT-REPRODUCTION-CONTRACT.json) keeps these requirements explicit and fitted values unknown. This is a specification extracted from sources, not a runnable reproduction certificate.

## Timing and SAN interpretation

Equilibrium responses cannot determine the time constants in the stated differential equation. Sec13 reports calcium recordings at 15–30 Hz, and the local export contains pooled amplitude summaries, not the original time-series/animal/session observations. No oscillatory phase, membrane time constant, synaptic delay, phase-of-firing code or SAN PWD reference follows from this register or export.

The strongest relevant SAN proposal is the continuing history-shaped receiving and body-world construction, with typed differentials throughout NAPOT—not the generic claim that a connection count predicts a response. Anatomy usefully constrains available routes; receiving physiology and temporal reference still require sources or explicitly proposed model assumptions. A SAN extension must retain that distinction while implementing internal use, returned evidence, and scoped learning. Ordinary rate-model recurrence cannot be renamed a full oscillatory SAN mechanism merely because its output is useful.

## New execution evidence and remaining gates

The [build](../application/anatomical-register-v0/results-01/EXECUTION.json) passes 1,767 checks. A [separate same-agent recomputation](../application/anatomical-register-v0/results-01/SEPARATE-CHECKS.json) passes 1,224 checks and rejects eight deliberately corrupted in-memory variants. It rereads raw CSVs through a different parsing path, checks direction and exact identity, and verifies hashes and all declared differences. These checks establish software/provenance consistency, not independent scientific review.

Small supplementary PDF recovery remains unsuccessful: [intake 08](../../access/0034188489f4c177.md) preserves two failed CDN paths and the accepted pinned repository-root listing; intake 09 records the publisher PDF host-resolution failure. No failed response is counted as a read PDF. The CSVs are verified repository files, not a newly verified byte-identical copy of the unavailable publisher supplement.

Next: resolve the population aggregation and missing fitted configuration/preprocessing, or implement a separately labelled, source-constrained candidate whose free assumptions are explicitly tested. Keep the two routes distinct. Neither route may borrow timing certainty from equilibrium fits. The saved memory-model reproduction, conventional embodied application, formal proofs and adverse results remain unchanged. No Book 2/wiki/provider/catalog/Git action or whole-connectome run was taken.
