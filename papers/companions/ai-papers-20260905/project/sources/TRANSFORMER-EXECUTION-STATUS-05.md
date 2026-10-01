# Current transformer status after Draft 5

This supersedes only the execution-status statements in the dated [Draft 4 bridge](TRANSFORMER-BRIDGE-AND-ACCEPTANCE-04.md); its architecture and acceptance obligations remain in force.

| Target | What is established locally | What remains open |
| --- | --- | --- |
| Small trained MLP | Causal effect prediction, active feedback calibration, useful virtual behavior, saved learner state and attacks | General semantic scope, advanced architecture or human oversight |
| Cached MiniLM | Pretrained bidirectional encoder input/provenance controls | Generative-model equivalence; upstream export identity fully certified |
| Pinned quantized GPT-2 | Original-model conditional tensor replacements; native 50,257-token output; held-out name/template families; norm/address controls; cache save/reload/reset; real virtual monitor updates | Active feedback learning, feature-level selectivity, stronger comparator gains, FP32 equivalence, general permission interpretation |
| Modern instruction-tuned open-weight model | Required transfer experiment and resource gate | No selected checkpoint or experiment yet |
| DeepSeek | Version-specific documented residual, attention/cache and routing map; dense distill versus original MoE distinction | No executed checkpoint or causal intervention; complete technical and bibliographic verification before transfer |

The [GPT-2 review](../reviews/gpt2-receiver-05/REVIEW.md), [protocol](../applications/PROTOCOL-GPT2-05.json), [adapter receipt](../results/gpt2-adapter-05/RECEIPT.json) and [model intake](../model-dependencies/gpt2-xenova-bf2c7f02/LOCAL-INTAKE-RECEIPT.json) provide direct evidence. The community model card identifies a conversion of the smallest GPT-2; local pinning does not prove equivalence to the upstream FP32 weights. Only public synthetic strings were used. No inference API or paid service was called.

The exact graph sites are residual after zero-indexed blocks 7 and 8 and concatenated attention values before block 9's output projection. The model, hook position, cache and readout are therefore specified implementation objects, not brainwave metaphors. Full-residual transplantation does not establish single-feature meaning or an entire IOI circuit.

The constrained-output versus full-vocabulary distinction in Draft 5 gives a practical evaluation requirement for future models. The controlled patch raises the mean target-name contrast and yields seven correct unrestricted held-out outputs, but clean prompts yield eleven and nine patched outputs remain invalid for the virtual task. This is neither complete repair nor proof of improved alignment.

The named reference monitor receives actual updates and actual GPT-2-derived proposals; its permissions remain trusted fixture data. Its complete-mediation theorem is architecture-independent under assumptions. Such a theorem is not evidence that a transformer learns or ethically endorses the restriction.

The new primary comparator is [Wang et al., 2022](https://arxiv.org/html/2211.00593v1), read through the early task, knockout and circuit-method discussion. Activation patching, causal routing and positional distinctions are existing methods. Full circuit replication and complete technical comparison remain open; SAN's proposed contribution must be distinguished by additional evidence, not by omitting that prior work.

Base [GPT-2 metadata](https://huggingface.co/openai-community/gpt2/raw/main/README.md) lists MIT. The [community export](https://huggingface.co/Xenova/gpt2/tree/bf2c7f02e0b826c60d03af341171bde20893da66) is separately identified; the local package has not cleared redistribution of that conversion's weights. Retrieval instructions and dependency hashes remain separate from authored release files.
