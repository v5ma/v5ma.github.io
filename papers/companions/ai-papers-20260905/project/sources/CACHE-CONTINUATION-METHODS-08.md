# Cache continuation: implementation-level source check

Date: 2026-09-04. Two exact public primary sources were read, alongside the frozen local GPT-2 adapter. No model download or filesystem search was needed.

## Established mechanism

[Hugging Face's cache explanation](https://huggingface.co/docs/transformers/main/en/cache_explanation) describes per-layer key/value storage and reuse in autoregressive inference, including prefix/suffix attention-mask consistency. Cached context avoids recomputing earlier token states; a cache is not a newly trained parameter set. Read scope: the complete explanatory sections and example on this page, not every linked implementation or cache strategy. The mutable `main` documentation was inspected on the date above; this application uses its already pinned ONNX adapter rather than claiming to reproduce that version's Python cache classes.

[OpenAI's GPT-2 reference implementation](https://raw.githubusercontent.com/openai/gpt-2/master/src/model.py) computes a layer's key/value projections before its attention output and feed-forward residual updates. It combines incoming past key/value state with new entries and uses past length to establish token positions. The complete source file was inspected. This supplies an architectural route check, not proof that a separately converted quantized model is numerically identical to the TensorFlow reference.

## Concrete deduction for the pinned experiment

The existing local hook replaces the final-token residual after zero-indexed block 8. At that point the current token's key/value entries for layers 0–8 have already been computed; all previous-token entries were supplied as past context. The replacement can influence layers 9–11 and their new cache entries. This is a prediction from the execution graph, not a new invention of activation patching or caching. The new application checks the support of that change numerically rather than relying only on a schematic.

If the intervention's changed cache entries are replaced by their original values, subsequent deterministic decoding with the same suffix tokens should reproduce the original computation. Restoring entries that never changed should leave the edited computation intact. Neither conditional statement predicts whether the surviving intervention correctly transforms a semantic relationship.

## Scope of the new assay

The [protocol](../applications/PROTOCOL-GPT2-CONTINUATION-08.json) uses every recipient prompt from the already exposed Draft 7 families; it is a diagnostic follow-up, not a newly untouched test set. It edits one root state, then forks two fixed-text continuations from that retained cache. The fixed word “someone” avoids feeding the model's own recipient prediction or the desired answer back into the next query. The probes ask about the giver and the book color. They measure consequences through reused neural context, not guaranteed shared-world understanding or free-running dialogue.

The richer full-prefix donor has an explicitly different source history and information budget. Upper/lower cache restorations are causal route controls, not competitive learned policies. An actual signed-request workflow distinguishes stopping further edits from restoring the original source-conditioned cache. Those requests are supplied structured operations; the model does not infer their meaning from natural language. Restoring state cannot retroactively undo an already displayed answer or an external action.

DeepSeek and other current architectures require their own residual/cache maps. Compressed or sliding-window caches and routed experts cannot be treated as this twelve-layer GPT-2 array layout. No transfer result is inferred from this source check.
