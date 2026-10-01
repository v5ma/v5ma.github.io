# Third-party materials and dependency identity

This archive does not bundle base-model graphs/weights, tokenizers or runtime binaries. Original saved experiment outputs and locally fitted small correction models are research artifacts, not redistributed copies of the base language-model parameters. Public test authentication keys in the original scripts are fixtures, not real provider credentials or production authentication.

## Qwen

- Upstream: [Qwen/Qwen3.5-0.8B](https://huggingface.co/Qwen/Qwen3.5-0.8B/tree/2fc06364715b967f1860aea9cf38778875588b17).
- Executed export: [onnx-community/Qwen3.5-0.8B-ONNX-OPT](https://huggingface.co/onnx-community/Qwen3.5-0.8B-ONNX-OPT/tree/fafab72d87a9e6be3925b38caf48286d2838f2d0).
- [Pinned upstream license](https://huggingface.co/Qwen/Qwen3.5-0.8B/blob/2fc06364715b967f1860aea9cf38778875588b17/LICENSE): Apache-2.0; an [unchanged copy](project/model-dependencies/qwen35-onnx-opt-fafab72d/upstream-LICENSE) is retained.
- [Graph intake](project/model-dependencies/qwen35-onnx-opt-fafab72d/GRAPH-INTAKE-RECEIPT.json) and [weight intake](project/model-dependencies/qwen35-onnx-opt-fafab72d/WEIGHTS-INTAKE-RECEIPT.json) identify the executed selected files. The study uses quantized text processing, not a vision or MoE execution claim.

## GPT-2 and MiniLM

- Executed historical baseline: [Xenova/gpt2](https://huggingface.co/Xenova/gpt2/tree/bf2c7f02e0b826c60d03af341171bde20893da66), with [local intake identity](project/model-dependencies/gpt2-xenova-bf2c7f02/LOCAL-INTAKE-RECEIPT.json). Consult the model card and upstream notices when obtaining dependencies.
- Cached encoder: [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2). The upstream card lists Apache-2.0, but the local Chroma ONNX export's precise upstream revision was not independently established. Its recorded byte identities, configuration and this limitation remain part of the methods.

## Runtime, mathematics and references

- [ONNX Runtime](https://github.com/microsoft/onnxruntime) is separately obtained under its upstream license and third-party notices. The [1.29.0 intake receipt](project/runtime-dependencies/onnxruntime-1.29.0/INTAKE-RECEIPT.json) names the wheel, hash and extracted closure used here. Merely mentioning those dependencies does not redistribute or relicense them.
- [Lean](https://github.com/leanprover/lean4) and [Mathlib](https://github.com/leanprover-community/mathlib4) remain separate dependencies with their own licenses. Included proof source and diagnostic output are not a copy of the compiler/library distribution.
- Cited papers, source quotations, model names and trademarks remain attributable to their respective owners. Citations do not imply endorsement. No blanket license in this archive supersedes third-party rights.

The [original-material license](LICENSE.md) is separate from these notices. This inventory explains the distribution boundary; it is not a claim to have resolved every conceivable legal or scientific provenance issue.
