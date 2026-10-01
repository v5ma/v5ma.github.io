# Full-pipeline reproduction addendum

September 5, 2026. This supplement records work completed after the integrated Draft 10 manuscripts. It does not change their scientific conclusions or their PDF bytes.

All 49 fixed steps completed in a fresh Windows workspace: the 23 Qwen-specific application tests; preparation; six native training batches; the original fit and separate equation audit; sixteen native test cases; trace audit; and twenty-two native reconstruction batches. The original application generated 465 answers and a separate code path reconstructed all 465, including token identities and first-logit hashes. Across 44 native processes, 2,192 model calls were recorded. Seventy-eight deterministic files, including freshly collected training windows, fitted arrays and score tables, matched the original study byte for byte.

Primary evidence:

- [Execution receipt](project/pipeline-replay-16/workspace-01/control/FINAL-RECEIPT.json).
- [Post-run audit](project/pipeline-replay-16/AUDIT.json).
- [Controller guard tests](project/pipeline-replay-16/CONTROLLER-TEST-RECEIPT.json).
- [Reproduced fitting-equation audit](project/pipeline-replay-16/workspace-01/reviews/qwen35-learning-10/FIT-EQUATION-AUDIT.json).
- [Reproduced metrics](project/pipeline-replay-16/workspace-01/reviews/qwen35-learning-10/METRICS.json) and [group outcomes](project/pipeline-replay-16/workspace-01/reviews/qwen35-learning-10/GROUPS.json).

The result is a successful reproduction of an **unsuccessful learned correction**. Each learned map still achieved 5/32 requested role answers and zero complete groups. Privileged donor controls remained successful. No new independent test cases, parameter search, model download, manuscript draft or Lean compilation occurred.

Execution used one numerical thread and serial, bounded processes. The controller rechecked recorded inputs and the actual ancestry of new timing/receipt fields. It retained reference artifacts separately from fresh output destinations, but it was a trusted workflow, not adversarial operating-system isolation. The separate auditor shares the original model adapter and was produced within the same authoring-agent workflow: it is not independent scientific review or an independently developed model implementation.

This closes the fixed learned-Qwen preparation/training/fit/test/audit replay on the recorded host. It does not establish cross-platform identity, portability of every earlier experiment or formal build, general semantic learning, a production security system, or the broader biological and alignment hypotheses. See [reproduction instructions](REPRODUCIBILITY.md) for the distinction between saved-result checks and actual neural execution.
