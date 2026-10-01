# First reference run stopped safely

19 September 2026. Exit code 1. The initial plan assumed that the four named receptor columns contained nonnegative physical capture ratios and applied the article's log transform. The first cell encountered negative values, triggering `ValueError: Invalid capture` before fitting. No results directory or scores were produced.

The subsequent input-only audit found 2,231 of 6,205 rows with at least one negative value among `rh3`, `rh4`, `rh5`, `rh6`. `rh3` ranges from -3.6114524316444983 to 2.703460861362. This is consistent with already transformed inputs but does not, on its own, prove their exact encoding. The schema has names, not transformation lineage. The preserved script and plan here are the exact failed versions. Do not retry a logarithm, clip negative values, or relabel an as-provided regression as an equation-faithful reproduction without resolving that lineage.

Published code's `AllCaptures.make` produces nonnegative capture ratios, whereas the downloaded compiled export contains negative coordinates. The reviewed export helpers do not establish which transformation was applied between these artifacts. This is a source-interface question, not a biological negative result or a demonstrated error in the original experiment.
