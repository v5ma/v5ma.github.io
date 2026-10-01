# Startup dependency correction

The first launch stopped at import because SciPy is not present in the selected
bundled Python runtime. It exited before opening the data or creating results.
No dependency was installed. The executable now uses exact, deduplicated,
64-query-block NumPy comparisons, with a maximum eight million distinct point
pairs per comparison. Numerical definitions and the frozen source/case plan
are unchanged. This receipt is not a successful scientific result.
