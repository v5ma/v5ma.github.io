# Draft 9: original-model hybrid transfer and restoration

Both AI papers now have a measured small contemporary-model extension. This is one shared experiment, not two independent replications. Development and fresh follow-up results are distinct; all prior GPT-2 findings and manuscripts remain frozen.

## What actually ran

- Pinned text-only community q4 conversion of Qwen3.5-0.8B, using original graph state interfaces, not a substituted random model or a reimplemented recurrence.
- Initial development: one three-call split-prefix check and twelve bounded answers in four serial batches. Exact-case score 8/12; color capitalization explains the explicit post-hoc 12/12 diagnostic. The original gate failed. See [the preserved scoring decision](../qwen35-baseline-09/BASELINE-DECISION.md).
- Separate follow-up: new names, settings and colors; sixteen roots in four crossed descriptive strata; six state conditions and three question continuations, giving **288 answers**. Case-folded scoring was fixed before these model calls. There is no new fitting or post-exposure condition selection.
- First-root authority workflow: **six real update events**, four accepted and two rejected; **twelve fresh subsequent answers**, not reused outputs substituted for new inference.
- **776 decoder calls**, including 32 prefix readouts and generation steps; 300 condition/workflow answers must not be confused with 300 total forward calls. Development's 29 calls are additional and separate. The native audit performs another 776 calls; it does not double the experimental sample.
- All original execution used one numerical thread, 13.75–21.03 seconds per case process, 244.36 seconds total, maximum process commit **588,591,104 bytes**. The exact runtime and model stay on D:. No vision weights, base-weight training or persistent full caches were introduced.

## Complete results

The original model answers **48/48** new source-fact questions correctly. The complete reversed-role prefix control answers **48/48** counterfactual questions correctly. These include 16 capitalized color outputs, so exact-case equality alone remains 32/48. Report the declared scoring rule rather than silently presenting these as exact-case scores.

| State selection | Reversed giver /16 | Reversed recipient /16 | Color retained /16 | All six outputs /8 groups |
| --- | ---: | ---: | ---: | ---: |
| Original | 0 | 0 | 16 | 0 |
| Complete donor | 16 | 16 | 16 | 8 |
| Convolution donor | 0 | 0 | 16 | 0 |
| Recurrent donor | 0 | 2 | 16 | 0 |
| Attention KV donor | 16 | 15 | 16 | 7 |
| Convolution + recurrent donor | 0 | 1 | 16 | 0 |

The original row above is deliberately scored against the requested *reversal*, not its own source facts. It is not an unedited competence failure. Each group includes both giver directions and their three outputs. Two settings crossed with two name pairs do not supply independent population samples; [family-level counts](FAMILY-STRATA.json) are descriptive, without a misleading population confidence interval.

The attention-only exception is `garden-pair-0/green/1`: Emma is predicted for both giver and recipient after transplant. The complementary equal-KV counterexample is `garden-pair-0/green/0`: convolution-plus-recurrent donor state changes recipient from Liam to Emma while every attention KV tensor retains its original hash. The latter is a measured counterexample to a universal KV-only sufficiency claim over this intervention domain, not a claim about all naturally reachable model states.

All non-original conditions change full first-step logit hashes on all 48 queries, including convolution-only transfer, whose decoded answers never change. An unchanged top word is weaker than unchanged computation. Partial-transfer successes do not establish unique semantic localization: groups have different size, layers and function; donors contain privileged counterfactual information; mixed states can be off-manifold.

## Authority and mathematical scope

The event sequence is signed swap → signed stop → forged complete restore → signed KV restore → signed complete restore → old stop replay. Acceptance is true, true, false, true, true, false. Each accepted event is followed by three fresh question/answer calls. Stop selects the donor state without further intervention; KV restore selects donor convolution/recurrent state with original attention; complete restore selects complete known original state. The twelve results match the appropriate same-state controls at full first-step-logit hash and complete generated-token sequence.

For the one actual workflow root, partial restoration recovers the original words but not exact logits. The recipient failure in another root belongs to the broader intervention assay, not to an additional signed workflow that was never executed. Command interpretation, original state and authentication are supplied by a typed local fixture. This is neither natural-language intent learning nor production security.

CA equation (12) states distinct state operations. MI equation (16) gives behavioral sufficiency of a state projection and a short factorization argument. Existing 31 Lean statements are preserved; no new compiler verification or Python-to-Lean refinement is implied. The mathematical facts constrain an inference, not the truth of a biological analogy.

## Verification and retained defects

[Trace/metric audit](TRACE-AND-METRIC-AUDIT.json) checks all 300 answer rows, 4,608 state-origin rows, complete donor/opposite-original equivalence, the real authority trace and resource limits. The original 61 tests run separately from the new 15 tests, avoiding a mixed-runtime import session. All **76** pass.

All sixteen `native-case-0` through `native-case-15` receipts pass. Separate interchange/generation code reconstructs every condition/workflow answer, every first-step full-logit hash and every initial prefix state. It shares the frozen adapter and original native model. It is **same-authoring-agent reconstruction, not independent review, an independently implemented model, or upstream full-precision equivalence**.

The first preparation attempt stopped before inference because text EOS and message EOS were conflated; the pinned generation configuration supplies both IDs. That pre-freeze error and repair are [preserved](../qwen35-baseline-09/PREPARATION-ATTEMPT-01.md). The first diagram's missing three-way branch was also preserved and fixed in a separately named figure version; [screen acceptance](../../figures/qwen35-hybrid-09-v2/VISUAL-REVIEW.md) covers two current figures, not final PDF formatting.

## Remaining work

The manuscripts still need a stronger learned, matched-information modern-model comparison if they claim useful correction learning beyond known donor transfers; broader language/intent/long-horizon tests; independent source, science, statistics, code and formal review; editorial integration into a coherent final narrative; approved-format PDFs and author readback. Original DeepSeek remains unexecuted. No publication, provider mutation, commit, push, Book 2 edit or other-task message occurred in this stage.
