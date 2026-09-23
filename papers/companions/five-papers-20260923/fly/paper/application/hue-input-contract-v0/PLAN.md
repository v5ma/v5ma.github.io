# Frozen input-reconstruction and score contract

19 September 2026. This plan precedes numeric comparison of reconstructed
receptor inputs with the small compiled table. It follows the completed Draft 15
publisher-trace readback. It is an exploratory source-reconciliation analysis,
not a preregistered biological experiment or a new SAN model comparison.

## Exact objects and stopping rules

Use only the checked Figure 3 Parquet table, the checked small compiled table,
the previously read processing/analysis/transform modules, the newly pinned
`utils.py` and LED spectra, and six named sensitivity CSVs at the same commit.
The CSVs are the five members of the explicitly defined `standard` sensitivity
set and the four-opsin `govardoskii_morning` file used by the receptor-loader
default. These two source-named sets are declared before comparison. Do not
search other sensitivity sets for a better match or fit a sensitivity curve.

The article's Methods, Stimulus design, gives rounded background intensities
of 10, 60, 100, 250, 330 and 250 nE in the ordered six LED channels. The source
`Recording` schema stores integer LED intensities and obtains exact background
values from recording metadata, which has not been recovered. Test the
conditional interpretation `c = I/max(b,1)-1` of the Figure 3 LED columns.
For each channel, enumerate integer backgrounds 1 through 1,000 nE and report
every background for which all reconstructed intensities `(c+1)b` are within
1e-7 nE of an integer. This identifies grid-compatible candidates, not the
original recording configuration. Use the smallest compatible value only as a
clearly labeled reconstruction; retain the rounded published vector as a
separate case. Neither is selected using response values or a fit score.

Project only the six LED columns, cell-type label and small compiled-coordinate
table. Limit distinct LED rows to 10,000. Do not rescan time-series columns,
fit a model, alter sealed sessions, access a database, install packages or
execute the author project's initialization. One foreground process, one
numerical thread, DuckDB memory limit 64 MB; no recursive file or web search.

## Declared numerical test

Inspect each sensitivity file's schema first. If it supports the source's
interpolation-and-clipping route, reconstruct the spectral overlap on the
source wavelength grid, 300 through 699 nm. Normalize the interpolated LED
spectra. Report the integration convention rather than claiming library parity
without checking it. For positive background capture, the background-relative
mapping is

`q_j = sum_l ((c_l+1) b_l M_lj) / sum_l (b_l M_lj)`.

This is conditional on the linear spectral-capture and relative-normalization
interface. It does not establish the precise `ReceptorEstimator` version,
adaptation settings, variance calculation or export call. Apply the article's
declared coordinate function `X_j = log((q_j+0.001)/1.001)` exactly once to the
reconstructed captures. Compare these candidate coordinates to the compiled
table both as supplied and after an inverse log transform, but never apply a
second log to already signed compiled coordinates. Record nearest-neighbor
distances and unique matches under a fixed 1e-6 absolute coordinate tolerance.
No arbitrary affine alignment, relabeling of opsins, parameter fitting or
response-based choice is permitted. All candidate cases and unmatched points
remain visible. Matching coordinates do not automatically pair independent
animals or reproduce normalized amplitudes.

## Score contract

Distinguish the source's ordinary weighted coefficient of determination,
sign-preserving non-centered squared-cosine score, genuinely noise-corrected
`r2er_n2m`, and circuit-training negative sum of weighted uncentered cosines.
Check exact implementation against the article equations and retain any
source/code difference. A confidence-interval width is not automatically the
noise variance required by the corrected score. Do not calculate or report a
noise-corrected biological fit until its necessary variance is available.

## Acceptance and limits

Save source hashes, all cases, arithmetic checks and deliberate failure cases.
An independent implementation means a separate same-agent calculation, not an
independent reviewer. A failed match is an informative source boundary, not
permission to modify the data. Integrate only verified results into a new draft
after preserving Draft 15 and its front-door identities. No Book, wiki,
provider, public catalog, Git or deployment change is part of this step.
