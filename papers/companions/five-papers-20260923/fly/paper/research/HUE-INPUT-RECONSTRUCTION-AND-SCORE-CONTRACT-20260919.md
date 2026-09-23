# Hue input reconstruction, response selection and score contract

19 September 2026. This audit extends the preserved Draft 15 readback. It
establishes a numerical bridge between two published data representations,
while keeping missing acquisition identities and final circuit parameters
explicit. [Complete application and evidence](../application/hue-input-contract-v0/README.md).

## Sources and exact configuration boundary

The underlying study is Christenson et al. (2024),
[Hue selectivity from recurrent circuitry in Drosophila](https://doi.org/10.1038/s41593-024-01640-4).
The author code remains pinned to
[commit 91cf92581d2abaea72b96a994d69ed6d83ae05f9](https://gitlab.com/rbehnialab/chreyesees/-/tree/91cf92581d2abaea72b96a994d69ed6d83ae05f9).
New sources are the completely read `utils.py`, its LED spectral table, a
13-entry sensitivity-file inventory, and six exact sensitivity CSVs. Their
[first intake](../../access/bf7a0280f753f211.md) and
[sensitivity intake](../../access/652b5b9f049f2ddf.md) record
bytes, SHA-256s and verified Git object identities. CSV schemas and every
numeric sensitivity/grid value were parsed and checked computationally, not
claimed as a human scientific review of each number.

The six named spectral channels are duv, uv, violet, rblue, lime and orange.
The saved LED spectra have 1,200 wavelengths, 200–799.5 nm in 0.5 nm steps.
The source loader interpolates to the configured 300–699 nm integer grid and
normalizes each LED spectrum by its integral. The inspected sensitivity files
already contain all 400 required wavelengths. The reconstruction uses explicit
composite trapezoidal integration and nonnegative sensitivities. The repository
environment does not pin `dreye`; therefore this calculation is not presented
as a complete replay of an identified installed library version.

Two sensitivity sets were specified before comparison: `standard`, the default
of `calculate_capture`, and `govardoskii`, the default of the receptor-estimator
loader. The latter uses the supplied four-opsin Govardovskii-template file; the
spelling `govardoskii` is retained as the actual repository key. No later sets
were searched for a better fit. The fifth `rh1_standard` file was identity and
schema checked but was not added as an unplanned predictor.

The article's Stimulus design section gives rounded background values of
10, 60, 100, 250, 330 and 250 nE. `Recording.make` instead loads exact values
from `stimulus_metadata.json` and stores integer background channels in its
database. That metadata file has not been recovered. The recording schema
explicitly states milliseconds for time values, resolving the isolated
“seconds” comment noted in the previous audit against the schema and exported
millisecond headers.

## Conditional calibration and complete shared-type coordinate agreement

Given the source's LED-contrast definition `c = I/max(b,1)-1` and integer
intensities, the analysis enumerated every integer background from 1 to
1,000 nE per channel. Values were accepted only if every reconstructed
intensity `(c+1)b` was within 1e-7 nE of an integer. The minimum compatible
vector is `[10,61,102,255,327,245]` nE, summing to 1,000. The respective candidate
list lengths are 100, 16, 9, 3, 3 and 4; all lists are saved. Multiples can
also satisfy the grid, so this is not proof of unique absolute illumination.
Common rescaling of the background cancels in relative captures.

For a source spectral overlap M from LED l to opsin j, the tested mapping is

`q_j = Σ_l (c_l+1)b_l M_lj / Σ_l b_l M_lj`,

followed once by the article's `X_j = log((q_j+0.001)/1.001)` in the fixed
rh3, rh4, rh5, rh6 order. No fitted affine alignment, label permutation,
rescaling of responses or second logarithm was used. The full signed compiled
table is retained, including its 2,231 rows with a negative input coordinate.
Those signed values are not misclassified as negative physical photon captures.

| Sensitivity set | Background case | Shared-type input matches / 3,961 |
|---|---|---:|
| standard | published rounded | 0 |
| standard | minimum integer-grid reconstruction | 0 |
| govardoskii | published rounded | 0 |
| govardoskii | minimum integer-grid reconstruction | 3,961 |

The fixed tolerance is maximum absolute coordinate difference at most 1e-6.
In the last case the separate scalar reconstruction's worst shared-type
distance is only 1.5987211554602254 × 10⁻¹⁴. All 575 Tm20, 646 Tm5a, 733 Tm5b,
490 Tm5c, 373 pR7, 367 pR8, 241 yR7 and 536 yR8 compiled rows match. Each has
exactly one same-type LED group within tolerance. The four mutant labels and
two Dm8 labels have no same-type Figure 3 rows and are not relabeled to inflate
coverage. Ignoring type identity yields 4,680/6,205 coordinate matches, but
that weaker cross-type count is not substituted for a biological pairing.

The input report contains all four cases in both signed-log and inverse-capture
domains. These domains are two views of the same test, not two independent
replications. The separate implementation checks 49,640 global-row comparisons
and 31,688 available same-type comparisons; 219 interface/numerical assertions
pass and six deliberate corruptions are rejected. This establishes the
numerical compatibility of the specified transformation, not the missing
database key, export command, animal identities or full final circuit.

## Response agreement and the unresolved selector

A separately frozen follow-on plan compares the unchanged Draft 15
complete-window means with the compiled `r` field, without calibration.
All 3,961 input joins have one eligible LED group, so no outcome-dependent
choice or ambiguous pooled case occurs. The remaining 2,244 compiled rows
are preserved as unavailable same-type comparisons.

Exactly 2,167 response amplitudes agree under the fixed tolerance
`1e-10 + 1e-10*abs(r)`; their largest actual difference is
1.9984014443252818 × 10⁻¹⁵. Their observation counts also agree. All 1,794 other
amplitudes differ, with a maximum absolute difference of 2.831232372051946.
Every one has a larger complete-window count in the Figure 3 aggregate than
the corresponding exported `counts`. No row has a smaller count. The amplitude
and count agreement tests select exactly the same subset.

This points to an observation-selection/pooling boundary. It does not establish
which observations were selected. The source `AllRegression.make` assigns PLS
labels, selects `label_bool`, enforces a minimum label fraction, and computes
group-specific means/counts over the selected ROI axis (analysis lines
425–561). That is a relevant candidate route, not a verified reconstruction of
the particular export. The reviewed `transform.py` also calls an
`excitation_contrast` function that is not defined/imported in that module;
the actual original dependency/version context remains necessary. No guessed
replacement or response-based subset search is used here.

The [separate response checker](../application/hue-input-contract-v0/response-checks-01/CHECKS.json)
recomputes every join using scalar sums and first-coordinate interval lookup,
not the builder's dense comparison routine. It accounts for all 6,205 rows,
checks all 3,961 comparable amplitudes/counts, and rejects five deliberately
altered records. These are separate same-agent checks, not external review.

## Four score meanings, not one interchangeable R-squared

The exact source call sites distinguish:

1. Ordinary count-weighted R²: prediction error relative to a centered mean
   baseline. This remains the score of the earlier diagnostic.
2. `nan_r2er_score`: a sign-preserving, uncentered squared-cosine quantity, with
   explicit small-denominator/covariance floors. It is **not itself noise
   corrected**. Its scale invariance holds away from those floors, not at every
   arbitrary tiny amplitude.
3. `r2er_n2m`: a noise-corrected ratio requiring a separately supplied variance.
   The generic CV code uses a weighted average of stored bootstrap SD squared.
   A 95% interval's endpoints do not alone determine that SD or noise variance.
4. The recurrent circuit's training objective: the negative sum of weighted,
   uncentered cosines across populations, not ordinary R² and not a squared
   correlation objective.

Five reviewed pure function definitions were isolated from `utils.py`; no
author package initialization, database access or project import occurred.
Seven explicitly synthetic unit-test cases give 14 source-versus-scalar
agreements and six additional distinction checks. With target `[1,2]` and
prediction `[2,4]`, the source signed-cosine score is 1 while ordinary R² is -9.
Negating an exact prediction gives -1 for the signed score but +1 for the
zero-noise squared score. These are interface tests, not measured neurons or
evidence for any theory.

There is also a specific source representation difference: recovered publisher
equation 7 TeX/XML places the squared product inside the weighted sum; pinned
`r2er_n2m` squares the weighted sum of products. For identical vectors `[1,2]`,
unit counts and zero noise, those literal expressions give 0.68 and 1.0,
respectively. The exact XML and test are preserved. The PDF equation typography
was not newly inspected, and the original fitting call is not recovered, so
this is reported as an equation/code discrepancy rather than a judgment about
which implementation generated every published result.

## What this advances—and what is next

The sensory input coordinates are no longer merely an unspecified signed
four-dimensional export for the eight shared types: a source-shaped calibration
reproduces them, and a substantial response subset is directly reproduced.
The response mismatch narrows the next dependency to the original group/ROI
selector and export settings. A subsequent fitted comparison must also recover
the final recurrent weights, optimized signs, parameter vector and declared
score/noise inputs. No corrected biological score is reported here.

The full SAN object remains history-shaped receiving, tonic/PWD operation
throughout NAPOT, multimodal relations, internally used reconstruction, choice,
actual action return and learning, including the separate experience hypothesis.
This input/output contract supports that construction; it neither replaces it
with a color-classification task nor confirms its full physiology. No new
theorem, compiled Lean proof, simulated episode, final PDF or publication is
counted by this audit.
