# Hue observation-selection reconstruction

19 September 2026. A source-shaped, in-sample preprocessing reconstruction over
published data. It is not the native fitted circuit or a new SAN confirmation.

## Result first

The predeclared modal group matches **2,508 of 3,961** shared-type compiled
amplitudes and counts. Compared with the earlier all-column calculation, 607
rows newly match but **266 lose their prior match**. There are 1,453 unmatched
rows, including 34 empty selected pools. The original dataset/group/export
configuration has not been recovered. No alternative group was chosen after
seeing these results.

- [Frozen grouping plan](GROUPING-RECONSTRUCTION-PLAN.md)
- [All grouping outputs and provenance](grouping-01/GROUPING-RECONSTRUCTION.json)
- [Frozen numerical arrays](../../../access/78eea648919e2461.md)
- [Comparison report](comparison-01/GROUPING-COMPARISON.json)
- [Every comparison row, including six unavailable types](comparison-01/ROW-COMPARISONS.csv)
- [Separate calculation checks](checks-01/CHECKS.json)
- [Measured figure and visual inspection](VISUAL-READBACK.md)

## What was recovered

The [metadata-only plan](PLAN.md) tests two explicitly declared orientations.
The [layout check](layout-01/LAYOUT-CHECKS.json) verifies unique complete index
coverage and consistent LED/SNR fields for all 1,322,829 rows. Stimulus-major
passes for all eight types; column-major fails. The
[saved axes](../../../access/566e81e77dd9aead.md) contain 2,450 anonymous columns,
not identified animals, recordings or individual cells.

A [single-directory source extension](SOURCE-EXTENSION-01.md) locates a tracked
transform cache. The [non-executing readback plan](CACHE-READBACK-PLAN.md) and
[static readback](../../../access/231b250d704baf6d.md) recover the missing
excitation transformation and its default exponent. No archived code was
imported or executed. The embedded source timestamp and size are distinct from
the current plain source and do not prove which runtime produced the article.
See the [complete source audit](../../research/HUE-ARCHIVED-TRANSFORM-AND-GROUPING-AUDIT-20260919.md).

## Method and checks

The endpoint is unchanged: mean response at 350–500 ms minus the -350 through
-100 ms baseline. The [window readback](grouping-01/WINDOW-READBACK.json) finds
115,356 complete windows, 1,207,473 wholly absent windows and no partial windows
among these 18 required samples. Missing entries become zero only for the PLS
fit, as in the source, never in the reported response means/counts.

The source-shaped five-capture input uses the previously declared conditional
background and recovered `2*(q/(q+1)-0.5)` transformation. The two-component
NIPALS implementation has no centering/scaling. Its maximum iterations are 500
per component; actual fits take three to seven. Source BINSIZE is pi/2, or 90°,
despite the nearby 45° comment. Group zero is centered on the first modal
histogram bin and declared as primary before compiled-response comparison.
The original export may have used a different dataset/group configuration.

[Method checks](method-checks-01/CHECKS.json) compare a local implementation with
one isolated, reviewed source function on eight synthetic cases. The full
checker separately recalculates 115,356 windows, 16 actual source-helper
components, 2,450 angles, 24 actual sign-reflection cases and 23,630 group
count/finite-mean fields. It accounts for all 6,205 comparison rows. Its checks
also reject changed counts, changed means and erased adverse transitions.
These are same-agent computational checks, not independent scientific review.

## Reproducibility and limits

The exact producing/checking tools and hashes are recorded in the linked
receipts. All result directories refuse overwrite. The producer freezes and
hashes group labels and means before a separate tool opens compiled responses.
NumPy SVD/pseudoinversion are declared local numerical choices; historical
SciPy/dreye parity is not established. The local numerical code is
[here](../../tools/hue_grouping_math.py); source-function provenance remains
attributed, including the original file's BSD-3-clause header.

The layout pass took 4.156 seconds, grouping 1.953 seconds, comparison 6.140
seconds and the separate data checks 1.609 seconds. Numerical runs used one
below-normal-priority foreground process and one numerical/reader thread;
DuckDB's memory cap was 64 MB. No dependency or model was installed.

The [Draft 16 application](../hue-input-contract-v0/README.md), its 1,794
disagreements and all earlier applications remain untouched. The present
comparison is not held out: PLS is fitted to the source response matrix to
reconstruct selection. No original observation identity, confidence interval,
noise variance, final recurrent parameter, new Lean theorem, synthetic episode
or phenomenal-experience conclusion is invented. No Book/wiki/public record
changed. No background work remains running.
