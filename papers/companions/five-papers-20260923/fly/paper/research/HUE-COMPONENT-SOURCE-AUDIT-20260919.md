# Hue component: source audit and reproduction boundary

19 September 2026. The complete primary-article XML, pinned authors' code, MIT notice and small processed response export are local. A coordinate-level diagnostic now runs on all 6,205 summary rows. The exact export transformation and the final fitted recurrent configuration remain unresolved. This is not independent review of the whole manuscript or reproduction of the published circuit.

## Sources and actual reading coverage

Primary publication: Christenson et al., *Hue selectivity from recurrent circuitry in Drosophila*, *Nature Neuroscience* 27, 1137–1147 (2024), [doi:10.1038/s41593-024-01640-4](https://doi.org/10.1038/s41593-024-01640-4). The [full-text XML](../../access/617913ba16156ab7.md), retrieved from [Europe PMC](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11537989/fullTextXML), is SHA-256 `5ae837f2d0d95cf015f2886256eb0ea41a1b12bba0628ec03fdf40ca6e2cbe42`. Read completely for this component: Sec9 (recurrence results), Sec13 (imaging), Sec14 (stimulation), Sec18 (processing), Sec23 with its modeling subsections, and Sec30 (statistics). This is not a complete reading of every section or a visual PDF inspection.

Authors' repository: [chreyesees](https://gitlab.com/rbehnialab/chreyesees), commit `91cf92581d2abaea72b96a994d69ed6d83ae05f9`. Repository blobs were verified during download. Read in full: README, license, environment specification, `models.py`, `paccman.py`, `together.py`, `colormedulla.py`, and `transform.py`. For `analysis.py`, inspected its top-level structural inventory and read `AllCaptures` (343–382), model settings (895–982) and `AllModelsCV` (986–1119). Other bodies remain unread. Directory inventories are not full code or parameter audits. No authors' module was executed or database accessed.

The [MIT notice](../../access/34b8751ae6256e38.md) is preserved. The local diagnostic is an independent numerical implementation, not authors' fitted output. Data/figure redistribution requires its own license check before public release; this packet remains local.

## Reproduction-critical distinctions

| Question | Verified source finding | Required treatment |
|---|---|---|
| What is fitted? | The 12-unit circuit fits equilibrium responses. | Do not infer time constants or oscillatory phases from a steady-state fit. |
| How many units? | Four photoreceptors, Dm9, two Dm8 units and five Tm units. The export instead has ten nominal types plus four mutant labels; Tm20 is pooled. | Map modeled units to observed conditions explicitly. Fourteen labels are not fourteen neurons or independent experiments. |
| What is the intervention? | A Tm response is recorded while its outputs are blocked. | Block outgoing signals, not its inputs or recorded state. |
| Which matrix axis? | `paccman.py` uses pre-by-post weights and row-vector multiplication. | Zero source rows; zero source columns only in the transposed convention. |
| What happens after blocking? | `Circuit.forward` renormalizes incoming absolute weight totals after applying blocks. | Recover and match the fitted call configuration, including normalization. |
| Are all signs measured? | Some effective Tm recurrence signs are selected by optimization. | Separate anatomical contacts, measured constraints and fitted effective signs. |
| Do defaults identify the figure? | The article describes a 20-point concentration grid from 10^-2; inspected class defaults use 25 points from 10^-3. The inspected settings do not override that default. | Preserve this version/configuration question, not an unsupported verdict that a published result is wrong. |
| Is a nonlinearity sign difference a new mechanism? | Idealized code and paper branches map by `r0 = -gamma`; code also adds a small denominator stabilizer. | Map conventions and numerical stabilizers explicitly. |

The reported 29 free parameters comprise eleven nonlinearity asymmetries, eight gains, one shared receptor-input weight, seven nonchromatic-input weights and two Dm8 interaction weights. The inspected source supplies a generic circuit engine; the final fitted values, sign selection and exact call configuration have not been recovered. A training description is not a parameter checkpoint.

## Why raw-capture interpretation was rejected

The table has 2,231 rows with at least one negative value among `rh3`, `rh4`, `rh5`, `rh6`. The initial attempted raw-capture logarithm stopped before fitting. Those values are consistent with prior transformation, but do not prove a particular encoding.

The authors' `log_contrast` implements a stabilized logarithm; inspected model settings use threshold 0.001. `AllCaptures`, however, produces nonnegative ratios. The reviewed helpers and Pandas metadata do not establish the intervening export step. The file's returned history is a single initial “updates” commit. Accordingly, the amended plan uses the supplied coordinates unchanged, with no clipping, relabeling as raw captures, or second logarithm. No response score was examined before that amendment.

## Actual diagnostic

The [frozen amended plan and results](../application/hue-component-v0/README.md) specify four-coordinate weighted least squares and an equal-coordinate-sum control. The latter is not certified as physical luminance. All supplied rows enter both models. Four deterministic repetitions each have four folds; identical declared coordinate groups cannot straddle train and test. Nearby stimuli can, so this is within-table interpolation, not distribution-shift testing. Pooling and normalization precede these local splits.

Mean ordinary count-weighted out-of-fold R² spans 0.2521–0.7655 for the four-coordinate fit, versus -0.1713–0.0129 for the equal-sum control. These are not the article's noise-corrected scores. Bars show the min–max across partitions, not animal confidence intervals. The table lacks animal/session/trial identifiers for that inference. Mutant conditions are fitted separately: their scores do not predict a causal output-blocking effect.

This checks a local data-to-fit-to-score interface. It does not establish a need for recurrence, superiority over competent nonlinear methods, or support unique to SAN. The published 15–30 Hz calcium imaging, smoothing and amplitude averaging also do not make this export a direct assay of fast oscillatory phase. Raw traces, sensor kinetics and the relevant temporal protocol would be needed. No phenomenal-experience result is implied.

## Preserved access and implementation failures

The main article PDF exceeded the 15 MB retrieval cap; XML supplied the read methods. Supplement requests to Springer failed host resolution in [intake 04](../../access/8981d2ec836c6428.md). The PMC mirror returned HTTP-200 HTML challenge pages under requested PDF/CSV names in [intake 05](../../access/a2162d9b8d10ecdd.md). They are rejected as scientific PDF/CSV content and were not used to infer table contents. Large imaging/figure archives were not downloaded.

The failed raw-capture assumption and subsequent Boolean-serialization failure are preserved under the application attempts. Only `results-verified/EXECUTION.json` is accepted. Its numeric artifacts must match the completed calculations from the serialization-failed attempt by hash. The first score plot's legend overlapped data, so that unapproved render is preserved separately from `figures-reviewed/`.

## Next exact gate

Recover and pin the export-generation step, final neuron order, weights/signs, gains/asymmetries, observation mapping, target/input scaling and intervention configuration. Reproduce a named published observable with the original estimator and declared tolerance. Then evaluate a separately identified SAN receiver/history extension against competent alternatives. If the hue assets remain unavailable, the already-planned Huang–Luo memory-interaction component is an alternative entry point, not permission to call this diagnostic a full reproduction.

The goal remains the whole cellular-to-body-world construction. This intake does not redefine it as fitting color-response amplitudes. No Book 2, wiki, sealed final sessions, provider record or public catalog was altered.
