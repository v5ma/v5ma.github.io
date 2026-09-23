# Publisher hue-trace readback

19 September 2026. **Executed secondary-data readback, not the authors' complete preprocessing replay, a fitted recurrent-circuit reproduction, or a SAN-specific prediction test.** No animal, recording or ROI identities were inferred from anonymous row indices.

## Review the evidence

- [Plan fixed before source-table values were read](PLAN.md)
- [Accepted publisher acquisition](../../../access/8d99756bf85eff8f.md) and [publisher checksum match](../../../access/8880ba9d34a1461a.md)
- [Exact schema and metadata](../../research/hue-recording-readback-01/metadata-01/TABLE-METADATA.json)
- [All cell-type coverage and source-window results](results-01/PROFILE.json)
- [Every derived stimulus summary under both declared policies](results-01/AMPLITUDE-AGGREGATES.json)
- [Separate batched-array recomputation and deliberate-corruption checks](checks-01/CHECKS.json)
- [Measured figure](figures-02/publisher-data-coverage-and-amplitudes.png), [vector copy](../../../access/a665798e0ad7dd52.md) and [visual readback](VISUAL-READBACK.md)
- [Source processing and observation contract](../../research/HUE-RECORDING-PROCESSING-AND-OBSERVATION-CONTRACT-20260919.md)

## What was recovered

Christenson et al.'s publisher archive for Figure 3 contains one 124,714,328-byte Parquet table. The archive's MD5 matches the preserved article XML; the member's size and CRC match a separately retrieved ZIP directory. The complete extracted table is SHA-256 `7971711b5283e674f7007c47246b542b6e4f62425c718baa38f7992088eacaf9`. The compressed archive was hashed in transit rather than retained as a second full copy.

Its 1,322,829 rows contain six LED-named input fields, SNR, 100 time-sample columns from -500 through 1975 ms, a cell-type label and an anonymous index. These are published event-aligned samples, not raw imaging movies or an independently verified untouched acquisition stream. The exact export-generation/normalization call remains missing. The index starts at zero separately within each type's range; it is not labeled as a subject, recording or ROI identifier. No such biological identity was manufactured from its value or from SNR.

## Actual usable windows

The declared endpoint is the mean of seven samples at 350–500 ms minus the mean of eleven samples at -350 through -100 ms. Every required value must be finite. No trace was smoothed, resampled, baseline-normalized twice, clipped or log-transformed during this readback.

| Cell type | Table rows | Complete endpoint windows |
|---|---:|---:|
| Tm20 | 173,689 | 13,661 |
| Tm5a | 184,012 | 11,987 |
| Tm5b | 267,270 | 16,690 |
| Tm5c | 266,112 | 25,032 |
| pR7 | 96,363 | 11,805 |
| pR8 | 68,614 | 8,636 |
| yR7 | 47,385 | 8,927 |
| yR8 | 219,384 | 18,618 |
| **Total** | **1,322,829** | **115,356** |

The other 1,207,473 rows lack at least one required sample. They remain in the source and coverage count; they are not converted into zero responses. This missingness is compatible with a sparse stimulus/ROI layout, but the exact generating reshape is not established here. It is not evidence that the publication fabricated measurements or that each table row was intended as an independent experiment.

Both declared policies—complete windows, and complete windows with finite SNR above two—give the same result because all SNR values in this export already exceed two. There are 4,137 distinct type/LED-value groups, represented twice in the 8,274 policy records. Their counts are contributing rows, not animal sample sizes. This Figure 3 table contains eight types, not the two Dm8 types and four mutant labels also present in the smaller combined export.

## Recalculation and interpretation

The first implementation derives endpoints and grouped summaries in SQL. A second implementation reads bounded batches from the original source and independently computes the two means using NumPy. It does not import the first implementation. Every row is accounted for. All group counts and derived fields agree within the declared tolerance; the largest absolute field difference is **5.684341886080802 × 10⁻¹⁴**. The check records 37 interface assertions, 57,918 field/identity comparisons and four rejected deliberate corruptions. These are same-agent computational checks, not human review, independent scientific review, or tens of thousands of experiments.

The measured figure describes coverage and the distribution of derived stimulus means. Its boxes are medians/quartiles with 1.5×IQR whiskers, not confidence intervals. Different types have different sampled stimulus sets, so the figure is not a matched comparison of selectivity. The trace scaling has not been independently reconstructed.

The source table contains no saved amplitude column against which to claim native endpoint parity. Recomputing a source-defined functional from published traces is genuine secondary-data processing, but does not certify the preceding fluorescence extraction, smoothing, interpolation, ROI selection, normalization or response grouping. Nor does the table contain the final twelve-unit weight/parameter checkpoint. The signed LED-named inputs also do not establish the signed receptor-coordinate transformation of the smaller export.

No new model score, anatomical route, theorem, Lean proof, held-out biological conclusion or phenomenal-experience result is added. All Draft 14 observations and all earlier applications remain unchanged. The new contribution is a verified, executable observation interface over real published data that can support the next properly specified component test.

## Resource and failure record

Metadata inspection took 2.422 seconds; the first profile/aggregation took 1.688 seconds; the separate full-row recalculation took 10.625 seconds. Analysis used one numerical/reader thread, a 64 MB DuckDB memory limit and bounded batches. No dependency was installed. The initial unavailable PyArrow reader was replaced with the already installed DuckDB reader, before any table values were accessed.

The first transfer exceeded a three-minute time allowance and is preserved as unaccepted [intake 34](../../../access/61be4a796579eefc.md). The single retry completed in 233.25 seconds under a longer allowance and the unchanged byte limits. Its result is the only accepted table. The first figure's title/legend overlap is preserved in `figures-01`; only `figures-02` passed visual readback.

## Next gate

Recover the exact LED/background-to-receptor-coordinate and export-generation route; confirm normalization and any response-based grouping. Recover the published circuit's final aggregation, parameters and intervention configuration. Only then freeze and perform the appropriate native response/perturbation comparison. Additional Dm8 and mutant data have explicitly named publisher archives, but are not silently treated as acquired here. Raw recording identities and the separate sensory timing constraints remain missing. The full receiving–PWD/NAPOT–multimodal reconstruction–action-return–learning program remains active.
