# Small contemporary-model bridge: exact Qwen3.5 text execution

September 5, 2026. This extends the model-specific [transformer contract](TRANSFORMER-BRIDGE-AND-ACCEPTANCE-04.md), not the historical SAN originals. It does not rename a GPT-2 result as a modern-model replication.

## Selected model and inspected evidence

**Upstream:** [Qwen/Qwen3.5-0.8B at revision 2fc06364715b967f1860aea9cf38778875588b17](https://huggingface.co/Qwen/Qwen3.5-0.8B/tree/2fc06364715b967f1860aea9cf38778875588b17). **Executed conversion:** [onnx-community/Qwen3.5-0.8B-ONNX-OPT at fafab72d87a9e6be3925b38caf48286d2838f2d0](https://huggingface.co/onnx-community/Qwen3.5-0.8B-ONNX-OPT/tree/fafab72d87a9e6be3925b38caf48286d2838f2d0). This is a small 2026 post-trained hybrid model, not the latest flagship or an original DeepSeek model. Its dense feed-forward sublayers must not be mislabeled MoE because a family-wide introductory paragraph mentions sparse experts.

The [pinned publisher model overview](https://huggingface.co/Qwen/Qwen3.5-0.8B/blob/2fc06364715b967f1860aea9cf38778875588b17/README.md) and exact downloaded configuration specify 24 text layers: six repetitions of three Gated DeltaNet layers followed by one gated full-attention layer. Hidden width is 1,024. The linear path has sixteen heads of dimension 128; the attention path uses eight query and two key/value heads of dimension 256. The local vocabulary readout is 248,320 wide. The source checkpoint also has a vision encoder, which is not downloaded or used.

The exact local graph inventory provides the implementation facts used by the experiment: 18 convolution buffers, 18 recurrent-state tensors and 12 attention key/value tensors, for 48 state inputs and outputs. The optimized decoder has 1,411 nodes; the separate embedding graph has one quantized gather node. State transfer uses these native interfaces without graph editing. The [graph inspection](../model-dependencies/qwen35-onnx-opt-fafab72d/GRAPH-INSPECTION.json) is actual file inspection, not a paraphrase of model marketing. A full-prefix/split-prefix smoke fixture gives identical logits and all state tensors for one 56-token development prompt; it does not establish every-context equivalence.

## Established mechanisms receive credit

Yang, Kautz and Hatamizadeh's [Gated Delta Networks](https://arxiv.org/html/2412.06464v1) combines adaptive decay with targeted associative updates. Its sections 2–3 describe recurrent matrix state, the delta-rule update, short convolutions and hybrids with attention. The fast-weight interpretation concerns changing recurrent state during inference; it is not synonymous with updating the trained base parameters. This paper uses an existing implementation of that architectural family, not a new invention of gating, recurrence or state interchange. Read scope: displayed sections 2.1–3.3 and the beginning of experimental setup; complete benchmark and appendix review is not claimed.

The 2026 [Gated DeltaNet-2 follow-up](https://arxiv.org/html/2605.22791v1) explicitly separates key-side erasure and value-side writing and reports controlled gate ablations. Those operations are already active research topics. They are not evidence that this Qwen checkpoint implements DeltaNet-2, and they do not turn an authenticated human instruction into a learned internal gate. Read scope: abstract, displayed formulation in section 3.1, gate-ablation discussion and related-work/conclusion excerpts; not the full derivation, code or training replication.

The versioned [Transformers Qwen3.5 documentation](https://huggingface.co/docs/transformers/v5.13.0/en/model_doc/qwen3_5) confirms the distinction between dense hybrid and MoE variants and the text-only loading route. Its generic cache API descriptions must not replace inspection of the selected export's actual state interfaces. The local experiment uses ONNX, not the documented PyTorch or GPU path. Read scope: architecture and usage notes plus cache-related API excerpts.

## Runtime, resources and rights

The shared ONNX Runtime 1.20.1 lacks the selected export's `LinearAttention` and `CausalConvWithState` operations. [ONNX Runtime 1.29.0](https://github.com/microsoft/onnxruntime/releases/tag/v1.29.0) was installed only in this paper's isolated D: runtime directory. Its actual CPU operator registry supplies those operations; the prior GPT-2 runtime remains unchanged. The exact 14,001,407-byte wheel hash and extracted-file hashes are in the [runtime receipt](../runtime-dependencies/onnxruntime-1.29.0/INTAKE-RECEIPT.json).

The model intake fetched 19,886,335 bytes of exact graph/configuration/tokenizer/license files, then 646,553,600 bytes of text weights, with one connection and fixed hashes. No vision weights, full repository, Torch installation, paid inference service or private prompt upload was used. All experimental processes use one numerical thread and an own-process 75-second/5.5-GB watchdog; a failure would stop that process and preserve its result directory. Complete model caches are not saved per case.

The upstream license is preserved in [upstream-LICENSE](../model-dependencies/qwen35-onnx-opt-fafab72d/upstream-LICENSE). Source/conversion license identification is not a complete redistribution review. Release rights and complete model provenance still require final review. Native results concern this quantized community export, not byte- or accuracy-equivalence to upstream bfloat16 weights.

## Why this changes the two-paper argument

For **AI Core Alignment**, revocation must name the operation: stopping future interventions, restoring a selected store, or reconstructing complete prior state. A valid signature can select any of these; it cannot make them equivalent. The current fixture supplies command interpretation and known original state, so it does not measure learned human-intent interpretation or reduced oversight.

For **AI Mechanistic Interpretability**, the receiving computation spans unlike state stores. An unchanged answer can conceal changed full-vocabulary scores, and a largely successful group transfer can still fail paired-role consistency. Recurrent, convolutional and attention states are concrete intervention sites, not anatomical equivalents of PWD, thalamus or a biological learning loop. Group size, privileged donor access and mixed-state plausibility remain explicit confounds.

The existing GPT-2 and current DeepSeek V4/V3/R1 architecture mapping is preserved. Qwen execution supplies one measured modern hybrid bridge; it does not close original DeepSeek execution, expert-router interventions, long-context compression or an empirical intelligence-gap claim.
