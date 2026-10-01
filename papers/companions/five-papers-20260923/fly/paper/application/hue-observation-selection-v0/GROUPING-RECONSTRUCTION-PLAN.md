# Frozen grouping reconstruction and comparison plan

Freeze this plan before computing response-group labels or inspecting their
agreement with compiled responses. The earlier anonymous-layout results and
archived transformation readback have already been inspected; neither used
compiled response values to choose a transformation or arrangement.

## Inputs and declared reconstruction

- Use the validated stimulus-major rectangles for all eight Figure 3 types.
  Each column remains anonymous; none is assigned a fly, recording or ROI ID.
- Read only the 18 declared baseline/amplitude samples, type and integer index.
  Baseline is -350 through -100 ms inclusive; amplitude is 350 through 500 ms
  inclusive, on the existing 25-ms grid. Do not resmooth or interpolate.
- Verify each observation has either all 18 samples finite or all 18 absent.
  If partially present windows exist, stop this numerical branch and document
  the issue rather than silently changing the missing-data policy.
- Construct Y = mean(amplitude window) - mean(baseline window). NaNs become
  zero only in the PLS fitting copy, as the reviewed AllRegression code does.
  Preserve missing values when computing group means and counts.
- Use five source-shaped capture dimensions in order rh1, rh3, rh4, rh5, rh6:
  rh1_standard plus the four govardoskii curves. Preserve Draft 16's conditional
  integer-grid background [10,61,102,255,327,245] and its 300..699-nm trapezoid
  convention. No other sensitivity set, exponent or background is searched.
- The archived cache statically recovers excitation(X,n)=X^n/(X^n+1) and
  excitation_contrast=excitation-0.5, with default n=1. The reviewed source call
  multiplies this by 2. Use exactly that formula. The cache's embedded source
  timestamp and larger source size are provenance metadata, not proof of the
  original runtime or the missing original export call.
- Implement a local NumPy PLS2 reconstruction of the reviewed NIPALS algorithm:
  two components, regression deflation, no demeaning/scaling, tolerance 1e-6,
  maximum 500 iterations per component. Stop/report degeneracy or nonconvergence.
  Check the power iteration against the isolated reviewed source function on
  synthetic inputs first. Do not import chreyesees, SciPy, sklearn or its database.
- Record NumPy SVD/pseudoinverse use and singular values. The original numerical
  library versions are unpinned; this is not installed-library parity.
- Use the explicit 2-D angle convention atan2(factor_2,factor_1) modulo 2*pi.
  Find the first maximum among 24 equal histogram bins. Four grouping bins are
  centered at that modal-bin midpoint plus multiples of pi/2, with the source's
  wrapped half-open intervals. BINSIZE is pi/2 (90 degrees); the source's nearby
  45-degree comment is not the parameter.
- Primary selector is modal-centered group 0, declared now, not the group with
  the best exported-response agreement. Save all four labels and proportions;
  apply the source's minimum fraction 0.1. The source retains multiple groups;
  its exact compiled-export choice remains unknown.

## Before opening compiled responses

Save and hash the complete matrices, group labels, group means and counts, plus
source, plan and tool hashes. The producing tool must not open compiled_data,
Draft 16 row comparisons or aggregate response targets. Synthetic method tests
must pass before this producer runs. A separate tool performs the comparison.

## Fixed comparison and adverse controls

Use the already verified same-type signed-input mapping, tolerance 1e-6, to
compare the primary group with all 3,961 shared-type compiled rows. Amplitude
agreement tolerance is 1e-10; counts must agree exactly. Preserve unmatched,
empty and disagreeing rows, per-type totals and maximum absolute residual.
Also retain the earlier unselected-all-columns comparison as a named baseline;
do not retroactively overwrite its 1,794 differences. Other groups are exported
for inspection, not chosen post hoc as replacement primary selectors.

Numerical/data checks must cover full rectangle counts, missingness, grouping
partition, minimum fraction, modal-bin boundaries, signed factor reflections,
response/count calculations and deliberately corrupted inputs. Do not bootstrap
confidence intervals over unidentified biological units or claim held-out
prediction from this in-sample selection reconstruction.

## Scope and resources

One below-normal-priority foreground process; one BLAS/DuckDB thread; DuckDB
memory cap 64 MB; bounded batch reads. No installation, background worker,
regex, recursive search or source-tree expansion. No Book/wiki/catalog/provider
mutation. No final circuit fitting or SAN confirmation is implied. The shippable
slice is an auditable observation-selection reconstruction, with unresolved
native-runtime, biological-identity and export-choice boundaries retained.
