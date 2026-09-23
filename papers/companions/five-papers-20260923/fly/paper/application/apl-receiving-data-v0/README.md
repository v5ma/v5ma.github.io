# Local inhibitory-response reanalysis

20 September 2026. Published component evidence; not a new animal experiment.

## What was actually done

The [exact-cell plan](EXACT-ANALYSIS-PLAN.md) selected two vertical-branch
profiles from Amin et al., *Localized inhibition in the Drosophila mushroom
body* ([article](https://doi.org/10.7554/eLife.56954)). The source is the
[unaltered Figure 7 workbook](../../../access/803d998b68ab9ee7.md),
acquired directly from the publisher. All 280 selected cells were read; the
primary comparison retains ten paired records in each condition at 200 and
260 micrometers along the standardized backbone. No values were excluded.

Define d as the exported response at 260 minus that at 200 micrometers.
Positive d means the response is more negative at 200. These are two
different exported response measures, not interchangeable physical units.

| Condition | Positive / all records | Mean d | Median d | Unknown fly-pair assignment mean range |
|---|---:|---:|---:|---:|
| A2: KC response to APL stimulation, no odor | 9/10 | 0.395047 | 0.433796 | 0.364528–0.437357 |
| A4: normalized inhibitory effect during odor | 10/10 | 0.353374 | 0.254592 | 0.305050–0.379009 |

The opposite-direction A2 record is retained (d = -0.021885). Each condition
contains ten neuron records from nine flies according to the article. The
workbook supplies no fly identity mapping. Each range above enumerates the
45 possible assignments of the one two-record fly, averages that fly's two
values first, then weights nine flies equally. It is a cluster-assignment
sensitivity range, **not** a confidence interval. We do not pool conditions
as twenty independent neurons or eighteen independent flies.

![Every selected pair, including the exception](figures-01/apl-spatial-pairs.png)

## Full record and verification

- [Numerical results and limitations](run-01/RESULTS.json), [all paired records](run-01/PAIRS.csv),
  [profile summaries](run-01/PROFILE-SUMMARIES.csv), and [all cluster assignments](run-01/CLUSTER-ASSIGNMENTS.csv).
- [Separate same-agent decimal checker](checks-01/CHECKS.json): 124 scalar
  comparisons, 90 cluster assignments recomputed, maximum discrepancy
  1.05e-16, and five deliberately wrong records rejected. This is not
  independent scientific review. Source-cell schema/finiteness was checked
  for the 280 selected values; the checker’s scalar comparisons concern the
  declared paired estimands, not a replay of original imaging preprocessing.
- [Source selection](AMIN-DATA-SELECTION.md), [acquisition receipt](../../../access/e74bcc7b132aa306.md),
  [schema inspection](inspection-01/SCHEMA.json), [figure receipt](figures-01/FIGURE-RECEIPT.json),
  and [visual readback](VISUAL-READBACK.md).
- [Physiological interpretation and exact joining boundary](../../research/APL-LOCAL-INHIBITION-AND-RECEIVING-CONTRACT-20260920.md).

The first producer attempt stopped before writing results because its header
assertion used shorthand instead of the workbook's exact `Top panel A2` and
`Vertical branch (green)` labels. The literal assertions were corrected; no
numeric cells, selected rows or estimands changed. Both completed tools
verified below-normal priority. There was one foreground worker and no
background numerical process.

## Mathematical check and its limits

For paired values a,b and a spatially equal prediction c,

`(a-c)^2 + (b-c)^2 = 2(c-(a+b)/2)^2 + (a-b)^2/2`.

Thus the least-squares equal-response fit is their mean, with residual
`(a-b)^2/2`. Summed over ten records, the residuals are 1.066305 for A2 and
0.982254 for A4 in their respective squared source scales. A description with
one parameter for each observed value has zero residual by construction.
That saturated description is not penalized, held out, or a fitted circuit.
This identity describes the mismatch of an equal-observed-response
restriction, not rejection of a common-gain mechanism with unequal baselines.
Measurement noise is not modeled by the identity. It is elementary algebra,
not a new named theorem family or a new Lean proof.

For contrasts d_1,...,d_10, let S be their sum. If records i,j are from the
same fly and all others each represent one fly, the equal-fly mean is
`(S-(d_i+d_j)/2)/9`. This proves the enumeration formula. The range relies
on the published ten-neuron/nine-fly count and no additional missing records;
it does not recover the unknown pairing or a population sampling distribution.

## What the result does and does not support

This reanalysis preserves the already published evidence for local,
spatially nonuniform inhibitory consequences. It does not reproduce the
article's figure normalization or inferential statistics. A2 calcium and A4
normalized inhibitory-effect values are neither measured conductances nor
estimates of the independent receiving-port controls used in Draft 19.

Prisco et al. provides a complementary microglomerular, pre-KC-integration
route. The four selected small Dryad files were subsequently acquired and
[hash-verified on 22 September](../../../access/51a5760223194112.md).
Their [separate Figure 4 source audit](../../reviews/FIGURE-4B-4D-SUPPLEMENT-DEPENDENCY-AUDIT-20260922.md)
does not alter or reproduce this Amin reanalysis. The older
[browser continuation](../../../access/21d617c604329eca.md)
records the earlier access boundary only. Nothing is estimated from figure pixels.
The Amin dataset is not relabeled as a Prisco reproduction.

All earlier visual-memory query results, comparator ties, hue-export
discrepancies and sealed-session boundaries remain unchanged. Actual native
input-state control, the visual-to-memory identity map, temporal PWD/NAPOT,
multimodal integration and learning still need a connected construction.
