# Export versions and count-conditioned observation support

19 September 2026. This extends, and does not replace, the
[Draft 17 audit](HUE-ARCHIVED-TRANSFORM-AND-GROUPING-AUDIT-20260919.md).

## Bounded source findings

Three exact plain files were acquired from the already pinned `chreyesees`
commit `91cf92581d2abaea72b96a994d69ed6d83ae05f9` and read completely:
[together.py](../../access/9329f9261cab9d51.md),
[datajoint_attributes.py](../../access/d6cd1e47267a53c5.md),
and [colormedulla.py](../../access/446889de76db71bc.md).
Their [receipt](../../access/9a2bf92fbef70404.md) preserves
Git blob identities and SHA-256 hashes. The latter two files are an adapter
and import surface, not recovered run settings. No adapter, pickle or database
was executed or opened.

`get_compiled_dataframes` takes the dataset key, `group_id` and an optional
output-field postfix. It can return both response summaries and original
`stimulus_set`, `recording_id`, `roi_id` metadata. Those fields are absent from
our Figure 3 table. Their presence in source code does not recover their values.
Lines 69–78 select `mean_outputs{postfix}`; line 95 selects `k['group_id']`.
This is the combining function, not a preserved final call creating the
specific `compiled_data.parquet` artifact.

The already inventoried cache directory then supplied exactly two additional
objects, with [verified identities](../../access/70bc0840391bfadd.md).
They were decoded as inert data by the bounded reader; no Python code object
was constructed or executed. The complete payloads contain 76 and 53 named
code-data objects, respectively. Inspection covered the complete cached
`AllRegression.make`, selected grouping/module instructions, the historical
key and cell list, and selected model-loading functions. It did not review all
129 archived function/module bodies. The
[static assertions](../../access/6f3433c04e3c8f1a.md)
pin the exact evidence used below.

| Source version | Grouping input | Response summary / model boundary |
|---|---|---|
| Current plain `analysis.py`, lines 425–561 | Original transformed capture rows; missing response entries become zero in the PLS copy | `mean_outputs` derives from unweighted `nanmean` of selected baseline-subtracted traces. This is the Draft 17 tested path. |
| Archived `analysis.cpython-38.pyc`, embedded source timestamp 2023-10-11 | When `cluster_method` is None, a common-hull/RBF route generates 1,000 samples with seed 11; each output is divided by its mean **square**, not its RMS, before PLS | Separately stores `mean_outputs` from `correlated_mean` and `mean_outputs_hard` from unweighted `nanmean`. These names do not denote the same estimator. |
| Archived `load_network_model.cpython-38.pyc`, embedded source timestamp 2023-03-08 | Default key: morning background, intensity 1000, Salcedo sensitivity set, group 0, saline-gamut-all condition | Defines **11** populations with one Tm20 class. The final article describes **12**, including separate pTm20/yTm20. This key is not a certified final-model/export configuration. |

The archived and current grouping definitions both retain `BINSIZE=pi/2`.
Nothing here justifies changing the 90-degree rule to the inline comment's
45 degrees. The earlier transform cache and these two caches have different
embedded source dates. Those dates are not authenticated public custody or
proof of which versions ran together. Default constants, optimization bounds
and loader functions are not a fitted final checkpoint.

The primary article's signal-extraction section separately describes an
SNR exclusion, response-window averaging and normalization by a zero-referenced
standard-deviation estimate. Its response-interpolation section describes a
modified thin-plate-spline RBF for spectral/response predictions. Its movie
denoising method also uses an RBF kernel in kernel PCA. These are distinct
operations; none supplies an explicit final PLS-grouping/export call. We do
not infer that the cached preprocessing was the method used in the article,
nor substitute the older 11-population simulation for its final circuit.

## New actual-data test

Rather than combine historical defaults or tune labels against the answers,
the [frozen plan](../../access/09a04a9846e2a4f5.md)
asks a necessary-condition question. Given all finite observations for the
already matched stimulus/type, and the compiled count k, what are the smallest
and largest possible unweighted k-observation means? The
[analytic proof](../MATHEMATICAL-SUPPLEMENT-11.md) establishes exact extrema
for real observations and states the separate numerical/measurement-error bound.

All **3,961/3,961** comparable compiled responses lie in these envelopes within
the predeclared absolute tolerance 1e-10. None has a count exceeding the
available pool. In 2,167 rows the reported count uses the entire available
pool; 1,794 permit a smaller subset. The largest envelope width is
5.662464744103893 in the supplied response units. A zero-tolerance comparison
flags 1,553 rows, but its largest outside distance is only
1.9984014443252818e-15; all such distances remain below the declared tolerance.
Every row is retained, including the **2,244** without same-type source data.

This does not rule out a selection-only explanation. It also does not recover
one. The attainable subset means are discrete, and a consistent column mask
across stimuli would impose further conditions. The counterexamples in M14
and the checker demonstrate both limits. The particular Draft 17 grouping
still leaves 1,453 joint mismatches and loses 266 prior agreements; this new
necessary-condition test does not erase either result.

## Verification and boundary for the SAN construction

A separate computation reads the exact 18 source time columns, verifies all
115,356 complete windows, uses heap-based extrema rather than the producer's
sort, and checks all 6,205 row records. Maximum source-window difference is
7.11e-15; maximum envelope-endpoint difference using the scalar source windows
is 3.55e-15. Twenty-one small cardinality cases are checked against 183
exhaustively enumerated subsets. Five invalid inputs and four deliberate
ledger mutations are rejected. These are separate same-agent calculations,
not independent scientific review. See the
[checks](../../access/fff78c4099a29109.md).

This result constrains how a proposed receiver model can be calibrated to an
observable. A calibration discrepancy must not be attributed to an omitted
SAN mechanism before selection, normalization and estimator versions are
resolved. Conversely, agreement with a broad support interval does not validate
the receiver mechanism. We preserve both requirements while continuing the
full history-shaped reception → tonic/PWD throughout NAPOT → multimodal
relation → action/actual return → learning construction. No new native sensory
timing, final hue fit, animal experiment, held-out outcome or experience result
is claimed. No database access, dependency installation or public action occurred.
