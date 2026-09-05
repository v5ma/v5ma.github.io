# Native Qwen learned-correction review — research stage 10

**Outcome:** the bounded research tranche is complete. Both integrated papers remain Draft 9; the new [shared supplement](../../paper-revision/STAGE-10-LEARNED-HYBRID-CORRECTION.md) is ready for incorporation into their tenth manuscripts. Neither paper is final, independently reviewed or uploaded.

## Main finding

The unedited model answers all 72 training and 48 test questions correctly. Linear and nonlinear RBF corrections, trained on identical paired states, each reverse only 5/32 individual role answers. Neither gets both roles correct in any of sixteen test stories, and neither passes any of eight complete bidirectional role/color groups. All ten successes across those two methods occur in same-name collapsed stories. Counterfactual attention and complete-state donors pass all sixteen stories and all eight groups, with privileged test-state access.

The [full metrics](METRICS.json), [individual stories](INDIVIDUAL-STORY-DETAIL.json), [groups](GROUPS.json), [four-family strata](STRATA.json), and [figure](../../figures/qwen35-learning-10/learned-repair-results.png) retain the unfavorable and null results. Every fixed case remains in the denominator. No test-driven parameter adjustment or second selected run occurred.

## Exact evidence and acceptance

- [Completion receipt](COMPLETION.json): 24 training prefixes, 16 test prefixes, 72 training answers, 384 primary test answers and nine fresh workflow answers.
- [Prospective protocol](../../applications/PROTOCOL-QWEN35-LEARNING-10.json) and [preparation freeze](../../results/qwen35-learning-10-prepared/PREPARATION-RECEIPT.json): method, information access, scoring, split, resource bounds and controls precede training and test inference.
- [Fit receipt](../../results/qwen35-learning-10-fit/RECEIPT.json): three maps frozen before held-out inference. No model query occurs during the matrix fit. The fit uses training feature/target data only; the test case file's hash is checked for custody, but its semantic contents and outcomes are not used in fitting.
- [Separate equation check](FIT-EQUATION-AUDIT.json): saved linear, RBF and scrambled-target coefficient equations have maximum absolute residuals below 1.1e-11. This checks numerical fitting, not generalization.
- [Trace audit](TRACE-AUDIT.json): all 384 primary answers, nine fresh workflow answers, five known-sequence authority events and 6,144 state-support records are checked. All edited conditions change all 48 first-logit hashes relative to the original state.
- [Native audit index](NATIVE-AUDIT-INDEX.json): all 22 batches pass. Separate code reconstructs all 465 complete generated token sequences and first-step full logits, 24 training windows, test original/donor/instruction states, and all three learned policy-state identities. The reconstruction uses the same pinned native adapter and underlying ONNX graph. It is not independent review or a new independent sample.
- [84 tests](TEST-RECEIPT.json): 61 legacy and 23 Qwen tests ran in separate fresh processes, avoiding mixed ONNX-runtime imports. Eight tests are new to this stage.
- [Mathematical obligations](../../formal/LEARNED-CACHE-REPAIR-OBLIGATIONS-10.md): paired cancellation, uniqueness of the regularized fit and a conditional output-margin argument. These are not new compiled Lean statements; the prior accepted total stays 31.
- [Screen-image review](../../figures/qwen35-learning-10/VISUAL-REVIEW.md): one new accepted result figure; sixteen current screen-inspected figures in total. PDF placement and full-page inspection remain open.

## Important controls and limitations

The learned policies predict a 55,296-dimensional attention-window change. They do not modify or reconstruct the entire hybrid state, learn linguistic span boundaries, infer who has authority, or acquire a human's intended meaning from arbitrary language. All training counterfactuals are supplied. The standard kernel methods are not a new algorithm, a full ReFT replication or a RAVEL benchmark result.

The [additional descriptive summary](ADDITIONAL-DESCRIPTIVE-SUMMARY.json) reports mean raw window error to the test donor: 0.37880 original, 0.36211 linear, 0.35175 RBF, 0.91610 scrambled, and 0.26553 role-row swap. The simple row swap has lower error than either learned method but retains every original answer. These post-run aggregates strengthen the distinction between partial-state reconstruction error and the requested semantic operation; they are not extra prespecified success criteria.

The shared cap activates in zero linear edits, zero RBF edits and all sixteen scrambled edits. The scrambled condition is therefore the predefined combination of shuffled supervision, resulting predictor and common clipping rule, not an isolated estimate of the effect of labels at identical realized intervention norms. The learned failures cannot be attributed to their own cap activating because it never does. No superiority to an optimized nonlinear, position-aware or full-state method is claimed.

The fixed textual correction also gets 5/32 role answers and no complete story. It is one instruction, not a prompt-optimization benchmark. The role-row swap includes stored positional coding and is not a RoPE-aware optimum. Donor controls have extra test information. Four crossed synthetic families cannot establish robust model-population performance or isolate the contribution of each simultaneously changed test factor.

The actual learned-edit workflow distinguishes acceptance, stop and restore. Its known event sequence is checked against fresh outputs, but raw signatures are not saved in this new event log. Prior signed-store tests and the frozen caller are separate evidence; do not call the new log a complete arbitrary-message signature audit. Authorization does not repair an incompetent edit. Restoration uses a retained original state and does not retract external consequences.

## Resource and preservation record

Original collection and evaluation use 1,096 native calls: 176 for training and 920 for test/workflow execution. Reconstruction adds another 1,096 calls but no independent sample. Original model processes total 380.389 seconds; reconstruction processes total 374.487 seconds. Each numerical process is single-threaded and bounded. The largest original process commitment is 694,616,064 bytes. The saved fitted model is 42,912,216 bytes, including shared preprocessing and three dual solutions; it must not be described as a few-scalar edit.

No additional model download, base-weight change, full recurrent-cache history, compiler run, background swarm, broad search, Book 2 edit, source-original edit, commit, push or deployment occurred. All previous frozen drafts, results and model dependencies remain distinct from the new artifacts. The [packet check](../../PACKAGE-VALIDATION-RESEARCH-10.json) verifies the prior manifest and new exact file set; [the manifest](../../PACKAGE-MANIFEST-RESEARCH-10.json) is an inventory, not publication clearance.

One tokenization-only preview failed because the Windows console could not display a tokenizer whitespace symbol; the same read-only preview succeeded with ASCII-escaped JSON. This preceded inference. The preparation code also received a pre-freeze wording correction so custody hashing of the test file was not falsely described as no file access. Neither involved outcome selection. The new experiment and native audits had no failed model run.

The current README had a duplicated heading and two stale Draft 8 status claims. They were repaired in the mutable front door; historical manuscripts were not changed. This illustrates why the previous mechanical link/hash check was not full editorial acceptance. Independent source, scientific, code, statistical and proof reviews, coherent final prose, approved-format PDFs, interactive-app acceptance and author readback remain open. The full goal remains active.
