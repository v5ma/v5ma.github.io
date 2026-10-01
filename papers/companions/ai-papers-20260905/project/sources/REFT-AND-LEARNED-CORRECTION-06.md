# Learned correction: primary-method comparison and mathematical mapping

The [ReFT paper, version 1](https://arxiv.org/html/2404.03592v1), was read beyond its abstract: introduction and related work; complete sections 3.1–3.3 defining distributed interchange interventions, LoReFT, training objectives and position/layer intervention sets; experimental overview and section 4.1; and section 7 limitations. Benchmark-specific methods, all appendices and repository implementation remain open for full reproduction. This replaces the earlier abstract-only intake, not the underlying paper or historical receipt.

The important comparison is stronger than an isolated-neuron labeling baseline. ReFT connects causal-intervention ideas to task-specific learned edits on a frozen language model; it explicitly discusses contextual roles, learned steering, mechanistic uncertainty and evaluation-set isolation. Those are existing operations, not missing ideas that this SAN paper can claim to invent. No claim about ReFT's benchmark performance is independently reproduced here.

## Exact relationship to the present implementation

Our block-8 hidden state is h in R^768. Four rows R are fitted from paired training-state differences by SVD and remain fixed during feedback learning. With training center mu, positive diagonal scale S and the 4-by-5 adaptive matrix B = [A | b], the uncapped correction is:

    u = S^(-1) R (h - mu)
    h' = h + R^T S (A u + b).

Let W = R + S A S^(-1) R and beta = S b - S A S^(-1) R mu. Substitution gives:

    h' = h + R^T (W h + beta - R h).

This is a restricted affine instance of the LoReFT form, with a fixed teacher-derived R and further constraints on W. It is not a novel representation-editing family. When the norm cap activates, the edit becomes state-dependent and is no longer globally that affine map; it remains a representation intervention. The [numerical identity test](../applications/test_gpt2_learning_v6.py) checks the uncapped algebra, not semantic faithfulness or a full formal proof.

There are twenty online-adapted coefficients. That does not mean only twenty quantities were learned or supplied: the shared primary preprocessing stores 3,072 entries of R, 768 center entries, four scales and one cap (3,845 scalars). Paired clean training states construct this infrastructure for every policy. The task-score arm is therefore not a teacher-free or human-effort-matched baseline. The file also stores a 768-entry mean-delta control, which is not used by the primary adapter.

The optimizer is a fixed, bounded coordinate sign search with two actual decoder queries per step. It is not the source paper's backpropagated objective or its full trainable subspace. The present comparison therefore does not establish superiority to LoReFT, comparable tuning effort, or a complete ReFT replication.

## Consequential distinctions preserved

- Active learning now changes an explicit correction layer; the GPT-2 base weights remain fixed. External controller learning is not autonomous model introspection.
- A later-state measurement can guide adaptation without uniquely identifying the useful correction. Its value must be tested against native outputs, task feedback and replay controls.
- An identical external controller gets the same measured scalar pairs. Exact matching is expected under equal information and policy, not evidence for privileged access.
- A valid learning update and permission to apply a learned edit are different. The experiment checks both signed measurement acceptance and actual disabling of the graph edit after revocation.
- Newly specified name/template families do not constitute a new task domain, a new checkpoint or an independent scientific replication.

## Result-dependent next decision

The new [evaluation](../results/gpt2-learning-eval-06/metrics.csv) does not establish a live-internal-feedback advantage: internal and yoked feedback both yield four of sixteen correct native outputs; task feedback yields five and supervised fitting nine. The smaller internal error in some arms is not equivalent to greater usefulness. Preserve the full SAN/NMC learned-receiver question, but do not certify this restricted learner as its successful general solution.

The [post-hoc role diagnostic](../reviews/gpt2-learning-06/ROLE-PAIR-SUMMARY.csv) strengthens that limitation: none of the active learners gets both opposite roles right in any of eight held-out families. Every one of their successful answers occurs in a same-name collapsed pair. A rise in native accuracy here is not evidence of restored role binding. The new finite proof checks this metric distinction, not neural understanding.

The next experiment should isolate when a measured internal variable adds information useful for control beyond a stronger, equally informed baseline, or demonstrate an identification limitation. It should test independently varying correction intents and irrelevant task properties, rather than always asking for the same giver-role reversal. Paired-role success must be a prospective endpoint. Do not repeat site/seed/hyperparameter searches against these already exposed evaluation outcomes. Exact DeepSeek and contemporary instruction-tuned replication, complete causal-abstraction methods review and independent novelty review remain open.
