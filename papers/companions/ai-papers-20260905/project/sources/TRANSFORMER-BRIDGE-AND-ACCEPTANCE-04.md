# Modern transformer bridge and acceptance contract

September 4, 2026. Author-directed addition during active development. This is a research/implementation contract, not a claim that the named models have been tested. It augments, rather than replaces, the SAN genealogy, full argument, applications, mathematics, ten-draft process and independent review in [GOAL.md](../GOAL.md).

## Titles

1. **AI Core Alignment Across Scales: Human-Guided Co-Regulation in Self-Aware Artificial Networks.**
2. **AI Mechanistic Interpretability and Self-Aware Networks: From Neural Decoding to Causal Self-Regulation.**

AI relevance must appear in the abstracts, keywords, methods, measurements and discussion, not merely the titles. Do not promise that particular organizations will endorse or read a paper. The useful audience is researchers who can reproduce a mechanism, test a prediction or use a clearly delimited negative result.

## Model-specific mapping

These are proposed operational correspondences, not anatomical identities or historical priority claims.

| SAN research question | Concrete transformer target | Required discriminating test |
| --- | --- | --- |
| Why does a signal's consequence depend on its receiver? | A specified token-position residual state and its actual downstream attention, value/output and feed-forward routes | Predict held-out original-model intervention effects; compare local, averaged and wrong-context estimates, including nonlinear baselines |
| How does a small cue recruit a larger learned organization? | Prompt/token input interacting with learned weights and current context | Hold content and tokenization controls explicit; distinguish retrieval of learned organization from information supplied by the cue |
| Does a decoded feature participate in behavior? | A feature or subspace at a named hook, not an unspecified embedding | Patch or suppress it in the original model; test target and unrelated behaviors, matched damage, wrong-location rescue and exact restoration |
| Does control depend on the receiving route? | Attention head outputs, output projections, residual branches; expert routing where present | Separate signal changes from route changes; record recomputed versus artificially frozen routing |
| What carries a continuing commitment? | Trusted message provenance, contextual representations, external memory, KV state and any trained adapter | Revise/revoke commitments; test each state store separately and measure actual virtual actions |
| Does feedback improve useful regulation? | A learner with specified observations and writable state | Compare internal feedback, task feedback, replay, no feedback and an equal-information external controller; score an endpoint not used as the feedback reward |
| How does guidance survive adaptation? | Online policy/adapter updates or explicit memory updates | Track legitimate corrections and untrusted imitations through the real update interface, with persistence and drift controls |

A residual vector is not a brainwave; a token index is not oscillatory phase; attention weight is not a measured cortical connection; expert routing is not a thalamus. A shared abstract operation needs its own explicit implementation and validation on each substrate. This protects the full receiver-relative argument from both overstatement and strawman compression.

## GPT-2 baseline

The inspected OpenAI implementation specifies causal multi-head attention, value aggregation and output projection, residual additions around attention/MLP branches, learned token/position embeddings, and a key/value `past` interface. These supply concrete intervention locations. Its smaller default configuration has 12 layers, 12 heads and width 768 [T1]. GPT-2 is a tractable historical decoder-only reference, not a current frontier instruction-following system.

The baseline experiment must freeze an exact checkpoint/tokenizer revision, package versions, precision and license. First establish unmodified forward equivalence and token-position alignment. Then compare clean/corrupted inputs, activation patching, matched-norm unrelated patches, wrong-route patches and exact restoration. Candidate features, probe fits and thresholds come only from development families; all donor/corruption variants stay in one partition. Native next-token logit/probability effects and independently defined task behavior are the primary outcomes, not labels assigned to a probe.

For Core Alignment, put model proposals through the same virtual-action monitor as every competing proposer. Report unguarded proposals, mediated executions, useful completion, invalid output, clarification count and correction latency separately. A completion model's failure to follow an instruction is not by itself evidence that a modern instruction-tuned model would fail. Do not silently replace GPT-2 weights with a random tiny transformer while claiming a GPT-2 experiment.

## DeepSeek and modern transfer

The September 4 primary-source check finds V4 in DeepSeek's current release documentation [T2]. Its technical report describes changed residual transport, compressed attention and expert computation [T3]. Consequently, a conventional GPT-2 head/cache intervention cannot simply be renamed a V4 intervention. In particular, the receiving state may have several residual streams; a compressed cache entry may summarize multiple earlier tokens; and router changes may alter which expert computes an output. The proposed transfer assay must distinguish each of these intervention sites and recompute downstream mechanisms unless a deliberately frozen-route control is being tested.

V3 remains a useful version-specific comparison: its official documentation identifies Multi-head Latent Attention and DeepSeekMoE [T4]. R1-distilled Qwen/Llama variants require their own base-architecture label; a distillation lineage is not architectural identity [T5]. A smaller dense open-weight model can supply an intermediate replication, but its result does not certify MoE, long-context compression, or V4 behavior.

No DeepSeek weights, remote service or paid compute have been used here. API behavior would support black-box tests only; mechanistic claims require internal access or a separately validated intervention interface. Model size and resource requirements must be checked before execution, not after a large download has started.

## Mathematics-to-implementation obligation

The existing authority composition theorem permits an arbitrary proposer. It can therefore encompass a transformer proposer under its assumptions, but it proves no competence, ethical alignment, semantic parsing, or absence of monitor bypass. The existing observational and feedback non-identification results also do not depend on a particular architecture. Their application to an actual experiment requires verifying what the observer, controller and model can see and change.

New transformer mathematics must address a consequential obligation: for example, intervention composition, representation/route equivalence under specified transformations, or information access sufficient to distinguish competing mechanisms. Do not add unrelated theorems merely to increase a proof count. Standard chain rules, residual decompositions and established causal-abstraction results receive proper credit.

## Acceptance and resource gates

- **Already measured:** small trained MLPs and a cached six-layer bidirectional text encoder. Neither is GPT-2 or DeepSeek; the encoder is non-generative.
- **Required next:** original-model decoder-only intervention and independent behavioral evaluation; an active feedback learner; meaning/provenance-sensitive correction through a real update path.
- **Modern-model transfer:** exact architecture mapping plus appropriately scoped empirical replication before any positive claim about that model. If resources or access prevent it, retain an explicit untested boundary and narrow the publication claim.
- **Controls:** baseline competence; split closure; target/off-target effects; route damage/rescue; equal observation and feedback accounting; matched external controller; context/KV, external memory and parameter resets separately; forged/replayed updates actually submitted to the receiver.
- **Resource rule:** one numerical thread, bounded exact paths and runs, no bulk downloads or large local jobs, no paid service without specific authority, and no private manuscripts submitted to external inference services.

## Primary-source read ledger

- **T1:** [OpenAI GPT-2 model implementation](https://raw.githubusercontent.com/openai/gpt-2/master/src/model.py). All 158 displayed lines read, including attention, block, cache and output definitions. Current branch view; immutable revision pinning remains required for execution.
- **T2:** [DeepSeek V4 official release overview](https://deepseek.com/en/news/v4-preview/) and [current transparency page](https://www.deepseek.com/en/transparency/). Read release/architecture summaries, not independently verified marketing performance comparisons.
- **T3:** [DeepSeek V4 technical report](https://arxiv.org/html/2606.19348v1). Read introduction and sections 2.1, 2.2 and the displayed portion of 2.3.1 through the core-attention equation. Later methods, kernels, complete evaluation and checkpoint identity remain open. The returned bibliographic identifier/month and displayed April submission date are not reconciled; do not use this intake to establish exact priority chronology.
- **T4:** [DeepSeek V3 official README](https://raw.githubusercontent.com/deepseek-ai/DeepSeek-V3/main/README.md). Architecture introduction and model-summary portion read; not a full inference-code audit.
- **T5:** [DeepSeek R1 official README](https://raw.githubusercontent.com/deepseek-ai/DeepSeek-R1/main/README.md). Targeted read of the distillation description and base-model table confirms that the smaller checkpoints use Qwen2.5/Llama3-family bases. Exact selected configs/tokenizers still require pinning before execution.
- **T6:** [RAVEL primary ACL record](https://aclanthology.org/2024.acl-long.470/) and [ReFT primary preprint record](https://arxiv.org/abs/2404.03592). Abstract-level intake establishes controlled causal-disentanglement evaluation and learned interventions on frozen representations as existing comparators. Full technical reproduction remains open.
- **T7:** [Sutton and Barto, Reinforcement Learning, second edition](https://mitpress.mit.edu/9780262039246/reinforcement-learning/). Publisher record used for bibliographic verification and established learning background. No claim of a new bandit algorithm or of having reread the complete textbook in this intake.

This mapping is authoring-agent research, not independent technical review. Earlier frozen manuscripts, source originals and provider records remain unchanged.
