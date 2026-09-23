# Hue recording processing and the observation contract

19 September 2026, Phoenix date. This source readback advances the fly paper's biological component. It preserves all earlier model results and does not make calcium response amplitude a direct measure of fast phase, a whole SAN reconstruction, or experience.

## What has now been read and verified

At the authors' pinned repository commit `91cf92581d2abaea72b96a994d69ed6d83ae05f9`, three additional files have been read completely as text and their Git blob identities independently checked:

| File | Bytes | Git blob SHA-1 | Local preserved source |
|---|---:|---|---|
| `processing.py` | 25,711 | `3168c5aad446f7d79efb800b3fb79cf9bdd50ee9` | [intake 30](../../access/504d03b5b6693410.md) |
| `figure_utils.py` | 11,079 | `4a95cb855850815bea3ac1f39d4be0351e2c85f4` | [intake 31](../../access/a38365b5e225e736.md) |
| `__init__.py` | 3,116 | `6af955e5f3efe51483437f186dc36c046c925b25` | [intake 32](../../access/062f348c9a52c648.md) |

All 1,500 lines of the already pinned [analysis.py](../../access/4790ce665ca3d5c1.md) have now been read, completing the previously partial coverage recorded in the older component audit. These are repository-source findings, not proof of the exact live database configuration used for every figure. None of these author modules was imported or executed: package initialization configures a database and creates plot directories; processing/analysis include table insertion and computation operations. The plotting helper supplies no final circuit checkpoint.

Primary paper: Christenson et al. (2024), [Hue selectivity from recurrent circuitry in Drosophila](https://doi.org/10.1038/s41593-024-01640-4). Source repository: [pinned chreyesees tree](https://gitlab.com/rbehnialab/chreyesees/-/tree/91cf92581d2abaea72b96a994d69ed6d83ae05f9).

## From recorded fluorescence to the modeled endpoint

The source retains distinct levels of data. `Recording` carries a subject, recording, cell/ROI, timing, background and stimulation context. `Stats` acts on the recorded fluorescence-change traces. `AllDataset` collects per-ROI response summaries. `AllRegression.GroupedMeans` collects grouped responses. `AllModelsCV` fits those grouped outputs. A later export cannot be assigned to one of these levels from its filename alone.

In `Stats.make` (processing lines 628–783), ROI identities are sorted, each trace is smoothed with a third-order Savitzky–Golay filter, and event-relative samples are obtained by interpolation. The window length is the odd integer derived from `floor(0.5 * recording_rate)`. Out-of-range interpolation is explicitly filled with zero; it is not treated as missing data by that routine.

The settings define a 100-sample interpolation grid from -500 through 1975 in 25 ms steps. The amplitude mask includes 350–500 ms (seven samples), the baseline mask includes -350 through -100 ms (eleven samples), and the off-response mask includes 700–850 ms (seven samples). The stored on-amplitude is the mean under the amplitude mask minus the mean under the baseline mask; the off-amplitude uses the corresponding off mask. A comment in `processing.py` says “seconds,” whereas the settings label the interpolation values as milliseconds and separately define `TINTERP_S = TINTERP / 1000`. An executable ingestion must therefore check actual time units and metadata instead of following that isolated comment.

The null threshold is the 95th percentile of absolute null amplitudes for each ROI. Significance is evaluated against that threshold. The source null-power estimate is a sum of squared amplitudes divided by sample count minus one; it is not a demeaned variance formula. These implementation choices must be reproduced explicitly when claiming source parity.

## Pooling, normalization and transformed inputs

`AllDataset.make` (analysis lines 290–339) forms a stimulus-by-ROI array. With its default normalization enabled, each ROI is divided by the square root of its finite-response squared-power estimate. The same divisor is used for its PSTH. This precedes the later model splits. The existence of this path does not establish the exact normalization setting of an export whose generating call has not been recovered.

`AllCaptures.make` (343–382) groups capture values by LED settings, checks their ordering against the LED inputs, and divides by background captures bounded below at one. `AllRegression.make` (425–561) uses excitation-contrast coordinates for response grouping, including a minimum group fraction, and computes grouped mean PSTHs. It subtracts the baseline before the amplitude average and bootstraps over the selected ROI axis. ROI bootstrap samples are not automatically independent-animal bootstrap samples.

`AllModelsCV.make` (1015–1119) applies the configured input transformation, fits four repetitions of four-fold splits over the grouped rows, and retains ordinary and noise-corrected score variants. It also refits a final model on all those rows. Its generic model settings include a logarithmic transform with threshold 0.001, but no reviewed line in this file establishes the creation of the small `compiled_data.parquet` export or the optimized twelve-unit recurrent circuit's final parameter values.

The earlier coordinate-level diagnostic consequently remains correctly labeled: supplied signed coordinates, ordinary count-weighted R², within-table partitions, and separately fitted mutant labels. It is not retroactively promoted to a native circuit reproduction or animal-held-out evaluation. A good score would not establish the missing export transform.

## New exact publisher-data route

The article's Source Data Figure 3 archive is explicitly labeled data for modeling. A separately recorded, bounded [ZIP-directory intake](../../access/f7676405768f24ee.md) found a single member, `Figure 3.parquet`, rather than a directory of independently selectable small files. The [frozen first-pass plan](../application/hue-recording-readback-v0/PLAN.md) governs its table-identity, time-window, endpoint, export-bridge and unit-of-inference checks.

The first transfer reached its time limit and remains [unaccepted intake 34](../../access/61be4a796579eefc.md). It does not count as acquired scientific data. The [single retry](../../access/8d99756bf85eff8f.md) completed in 233.25 seconds under the same byte limits and a longer transfer allowance. The archive MD5 `1cafffdcbdbc86c1511376847661e781` agrees with the article XML; member CRC `160074b1` and size agree with the earlier directory. The actual extracted table is SHA-256 `7971711b5283e674f7007c47246b542b6e4f62425c718baa38f7992088eacaf9`. No author database access or project-module execution occurred.

The [metadata and executable readback](../application/hue-recording-readback-v0/README.md) now establish that this table has 1,322,829 rows and 100 explicitly millisecond-labeled time columns. Of these, 115,356 have complete values in the required amplitude/baseline windows, yielding 4,137 type/LED-value groups across eight types. All exported SNR values already exceed two; the two declared SNR policies therefore agree. The 1,207,473 incomplete-window rows remain counted as missing, not zero responses. Anonymous indices are not assigned animal/recording/ROI identities. Those fields and a stored amplitude reference are absent.

A SQL implementation and a separate batched NumPy implementation agree on all group counts and derived summaries, with a maximum absolute field difference of 5.684341886080802 × 10⁻¹⁴. This checks our source-window readback over published event-aligned samples, not the preceding fluorescence processing or the authors' final fit. The [measured figure](../application/hue-recording-readback-v0/figures-02/publisher-data-coverage-and-amplitudes.png) reports data coverage and descriptive amplitude distributions with unequal stimulus sets and unverified scaling explicit. No new model was fitted.

## Consequence for the paper

The source now supplies a concrete observation interface with an executed, checked readback over published data. It does not yet supply a final fitted circuit, native temporal constants or a unique interpretation of the small export's signed input coordinates. The next substantive step is to recover the export and parameter configuration and verify a named native observable, with all discrepancies retained. Only then should a new model comparison be specified. The whole learned-receiver, tonic/PWD, NAPOT, multimodal body-world construction remains the target; this observation contract is a necessary component, not a replacement theory.
