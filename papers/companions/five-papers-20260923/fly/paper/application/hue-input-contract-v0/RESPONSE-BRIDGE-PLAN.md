# Frozen second-stage response bridge

This plan follows the completed, separately checked input-only analysis. That
analysis used no response values and found 3,961/3,961 same-type matches for
the eight types present in Figure 3, under the source-named `govardoskii`
sensitivity set and the conditional minimum integer backgrounds. The other
three declared input configurations remain preserved, with no tolerance hits.
This is a follow-on exploratory comparison, not a held-out confirmation of a
model or a retrospectively preregistered experiment.

Now test whether the already-derived Figure 3 response amplitudes also agree
with the small compiled table. Use the unchanged Draft 15
`all_complete_windows` aggregate policy, whose independent checker has passed.
The SNR-filtered duplicate policy must not be counted again. Use only the eight
literal cell-type names present in that table; do not relabel mutant or Dm8
rows to create coverage.

For each compiled row, identify every same-type LED group whose reconstructed
four-dimensional input is within 1e-6 in maximum absolute coordinate distance.
If exactly one group qualifies, compare its derived mean amplitude directly
with the compiled `r` value. If several qualify, report their number and the
pooled complete-row mean as a separately identified, conditional pooling
calculation. Never choose a candidate because its amplitude matches. Record
the full range of individual candidate means as well. No multiplicative or
additive calibration, transform, smoothing, new missing-data filling or
post-outcome tolerance adjustment is allowed.

Report all absolute differences, and agreement using
`abs(derived-r) <= 1e-10 + 1e-10*abs(r)`. Independently compare summed complete
window counts with the exported `counts` field. Count equality does not prove
animal/ROI independence or establish the provenance of anonymous indices.
Do not convert `low`/`high` into a standard error or noise variance.

Preserve a row-level ledger, including unavailable and ambiguous cases. A
match can establish a numerical observable bridge between these two exports;
it does not recover the original export command, upstream fluorescence
processing, individual-animal identities, fitted recurrent circuit, native
fast timing or the full SAN architecture. The model remains unfitted here.
Run in one below-normal-priority numerical thread, without re-reading the
large time-series columns or accessing any new source.
