# Exact-cell descriptive analysis plan

20 September 2026. Frozen after schema inspection and before calculation of
the following summaries. This is a selected, published-result reanalysis,
not preregistration before the original experiment or a held-out SAN test.

## Source and selection

Use only the pinned Amin et al. Figure 7 source workbook (SHA-256
`ba1d7c4dfaa2007aa3e71f668b72ee81845ea20094012f44450117a3a2165e9c`).
Sheet `Fig 7`, vertical-branch columns M through V, ten records per condition:

- A2: header row 20; distances A21:A34; values M21:V34.
  Primary pair: row 31 (200 micrometers), row 34 (260 micrometers).
- A4: header row 54; distances A55:A68; values M55:V68.
  Primary pair: row 65 (200 micrometers), row 68 (260 micrometers).

Require all 280 selected cells finite, both distance series equal to
0,20,...,260, and the A2/A4 and vert labels intact. No exclusions, clipping,
interpolation, absolute-value conversion, or inferred animal identities.

The within-column pairing uses the exported spatial profile; column names
are **record identifiers, not animal identifiers**. Do not correlate A2 with
A4 by column or pair KC recordings with the separately recorded APL data.

## Declared measures and units

A2 is the KC calcium response to horizontal-lobe APL stimulation, without
odor. A4 is the published normalized inhibitory-effect measure during odor
stimulation. Analyze the exported values in their respective source scales.
The article describes an additional shared maximum normalization for its
plotted Figure 7 curves. This slice does not reconstruct that plotting
normalization or claim numerical reproduction of the figure or its p-values.
Do not translate the data into conductance, inhibitory synaptic weights,
membrane potential, a percent inhibition, or an oscillation time constant.

## Estimands and sensitivity

For each condition and record, calculate d = response(260) - response(200).
A positive d indicates a more negative response at 200 than at 260 in the
exported measure. Report every pair, every d, mean, median, range and sign
counts. Summarize each of the 14 distances descriptively, retaining all values.

Report the range of means when each record is omitted in turn as a record
sensitivity calculation, **not** an animal confidence interval. The article
reports ten neurons from nine flies. With no supplied fly-to-record mapping,
enumerate all 45 possible assignments of the sole two-record fly. In each
assignment, average its two contrasts first, then average the nine fly-level
values equally. Report the resulting mean range as an unknown-cluster
assignment sensitivity range, not a sampling interval or test.

Do not calculate independent-animal p-values, confidence intervals or a
bootstrap that silently treats all ten records as independent flies.

## Explicit restricted comparison

For one record's two observed values a,b, the least-squares spatially equal
prediction c has c=(a+b)/2 and residual (a-b)^2/2. Sum that residual across
records and compare it with the exact two-value description. This is an
algebraic measure of descriptive mismatch for an **equal-observed-response**
restriction. The flexible description is saturated, unpenalized and has no
held-out evidence. The comparison is not model selection, causal circuit
identification, or rejection of common gain with unequal regional baselines.
Noise and regional calcium measurement differences remain possible sources
of mismatch. The paper must keep these restrictions adjacent to any number.

## Verification and permitted conclusion

The producer reads the workbook directly as inert XML; a separate checker
reads it independently and recomputes selected-cell contrasts and the 45
cluster assignments using decimal arithmetic. Add controlled wrong-cell,
wrong-sign, wrong-n and changed-result checks. Plot all ten paired records in
each condition, not only means or a favorable subset.

This can substantiate a spatially nonuniform inhibitory-response component
already reported by Amin et al. It cannot establish independently addressable
PN-to-KC input ports, the visual-memory join, PWD phase coding, experience, or
the complete SAN architecture. Prisco et al. remains a distinct source with
numerical data pending; no Prisco values are inferred from its figures.
