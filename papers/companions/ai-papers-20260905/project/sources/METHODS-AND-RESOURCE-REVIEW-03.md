# Methods and bounded resource review

September 4, 2026. These are explicit read boundaries, not a claim to have exhausted the fields.

## Primary comparison

[Aoki et al., 2026, v1](https://arxiv.org/html/2609.00904v1) constrain response text, feed back activation-probe scores, compare reversed and random scoring, and assess self-reports separately. Their reported effects are small and inconsistent. Sections 3.3, 4, 5 and 6 and Appendix D were read. Code was not inspected and results were not replicated. Their distinction between functional access and phenomenology is preserved.

[Ji-An et al., 2025, v2](https://arxiv.org/html/2505.13763v2) distinguishes reporting, explicit control and implicit control using in-context activation-derived labels. Sections 2.1–2.4 were read directly in this continuation, supplementing earlier selected context. Full technical implementation and appendix review remains open. Neither paper is characterized as merely unconstrained neuron labeling.

The new question is a logical identification issue: returned scores are themselves input. A passive input-sensitive map can yield a paired hidden-state contrast with unchanged text. The rational countermodel establishes that possibility; the cached encoder shows a small finite example in a different architecture. Neither establishes the cause of the published LLM findings. Active policy selection, latent access, learned control and useful transfer need separately discriminating tests.

[Geiger et al., JMLR 2025](https://jmlr.org/papers/v26/23-0058.html) already supplies a general causal-abstraction foundation for mechanistic interpretability. Its primary abstract was checked; the complete 64-page technical comparison is not done. No novelty for generic causal intervention or receiver-state derivatives is inferred from that partial read.

[Denning, 1976](https://doi.org/10.1145/360051.360056) supplies the foundational information-flow lattice reference. The primary bibliographic record and abstract were read; this is not a completed security-literature review. The new ancestry conjunction is an application specification, not a new security calculus.

## Existing pretrained model

The exact already-cached directory is C:/Users/micah/.cache/chroma/onnx_models/all-MiniLM-L6-v2/onnx. Only its six named files were inspected and hashed. The ONNX model is 90,387,606 bytes. Its configuration specifies six layers and 384 hidden dimensions; its runtime exposes last_hidden_state. The [upstream model card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) lists Apache-2.0 and sentence-similarity use. No model weights were downloaded or copied into this paper package.

The local export has no embedded upstream-revision metadata. Its operational identity is the saved SHA-256, not an independently verified claim that it equals the current Hugging Face checkpoint. The package must carry this limitation and the external weight dependency through release.

Inference used Python 3.12.14, NumPy 2.4.6 and ONNX Runtime 1.20.1, CPU only, one numerical thread, batches of eight, and an explicit 128-token ceiling without silent truncation. Eighteen small batches completed both assays in approximately one second. The output was about 0.55 MB. No generative language-model runtime, download, API call or human intervention was used.

## Review observations that constrain interpretation

- Sixteen synthetic probe-training sentences and eight neutral evaluation sentences are a development fixture, not a validated ethics dataset. Training accuracy is not held-out semantic accuracy.
- Pooling excludes feedback tokens; fixed-sentence token identities and positions match across all numerical prefixes. The resulting state change is not simply direct pooling of the changed number.
- The passive model has no learning policy or action choice. Its fixed sentence is a construction constraint, not a successful instruction-following result.
- The provenance experiment tests an explicit ancestry-sensitive policy. It does not infer ethical rights from ancestry or claim that identical public text is intrinsically private.
- The forged-origin field is only logged, not delivered to the policy. The intended input-injection control is a protocol deviation, not a completed experimental check. No injection-resistance claim is supported by this run.
- The stale-authority arm intentionally lacks a current authority store. Its violations do not refute a theorem whose premise requires the current store.
- Clarification answers come from a declared fixture oracle, cost two queries per revision, and do not establish reduced human oversight burden.

The two new plots were inspected at full readable size: labels and values match the audit, all six policy arms and all eight fixed sentences are retained, and no inferential confidence bars are invented. The middle encoder panel is eight per-sentence curves, not an aggregate or a fitted scaling law.
