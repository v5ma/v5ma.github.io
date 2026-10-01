# Learned hybrid-cache repair: prospective development design

This follows the native hybrid-state intervention in Draft 9. The earlier oracle donor is a causal probe, not a learned correction. Here a standard linear kernel-ridge map and a nonlinear RBF kernel-ridge map predict a cache change from the receiving prefix's own state. Both receive identical paired training states. A fixed scrambled-target fit tests whether correspondence matters. No test counterfactual state enters any learned policy.

## Strong-method comparison and source scope

[ReFT, version 1, Sections 3.1–3.3](https://arxiv.org/html/2404.03592v1) already learns representation interventions on a frozen language model. Its trainable subspaces, objectives and position/layer choices are substantive existing methods. This study does not reproduce its optimization or compare fairly with its benchmark scores. A learned cache map is not a new representation-editing family.

[RAVEL, version 1, Sections 2–3](https://arxiv.org/html/2402.17700v1) already requires intended causal changes, unrelated-attribute isolation and generalization. Its entity and context splits and baseline-correctness treatment motivate explicit evaluation boundaries here. Our small constructed role/color assay is not RAVEL, and all specified failures remain in the denominator. Relevant methods were reread; the entire benchmark implementation and appendices were not independently reproduced.

## Mathematics and information access

Let x_i be a flattened 9-token window across twelve native KV tensors. The opposite-role training prefix provides t_i. Each directed case has its reverse, so sum_i(t_i - x_i) = 0 before floating-point reduction. A constant mean-delta steering vector is therefore an inadequate model of this balanced operation, not evidence that the operation is absent.

Use training mean mu and positive block scales S to set z_i = S^{-1}(x_i-mu) and y_i = S^{-1}(t_i-x_i). With K_ij = k(z_i,z_j), fit A = (K + lambda I)^{-1}Y. On a new original prefix, predict delta(x) = S k(z,Z) A and cap its standardized norm using only training deltas. The linear kernel is a dot product divided by the feature dimension; the RBF kernel uses a training-distance median. Both choices and lambda are fixed before outcomes. The linear uncapped map is affine in x; the RBF map is context-dependent and nonlinear. Neither property guarantees a correct semantic operation.

The residual update changes only the declared attention window. Convolution/recurrent states and earlier attention positions remain original. Training uses privileged paired counterfactual prefixes, but inference does not. This is supervised state repair, not autonomous introspection, online self-discovered intent, or an equal-human-effort experiment. All three fits have the same teacher information, data and test features; their algorithmic expressivity differs.

A role-slot swap is a limited structural control, not a complete RoPE-aware edit. The fixed natural-language correction sees the original story, not a donor, but adds tokens. Attention-donor and complete-donor arms are privileged oracle bounds. Their access and computational costs must not be silently called matched.

## Prospective acceptance and operating scope

The [protocol](../applications/PROTOCOL-QWEN35-LEARNING-10.json) fixes 24 training prefixes and 16 test prefixes before fitting. Names/settings/colors do not cross that split. One test context retains training syntax; the other jointly changes opening and verb. Four families and eight bidirectional groups are small, crossed, constructed samples. Report every stratum and all six role/color outcomes per group. Case-folded scoring is prospectively fixed from the disclosed prior development capitalization result, not newly chosen after test outcomes.

No selection or hyperparameter adjustment follows held-out results. Baseline adequacy, full-vocabulary generation, changed-logit versus changed-answer distinctions, and off-manifold limitations remain explicit. The two original model graphs, runtime and earlier studies remain frozen. New runs use one numerical thread, a 75-second own-process watchdog, a 5.5 GB hard limit and at least 8 GB initially available RAM; expected usage is much smaller. No full recurrent-cache histories are saved.

Preparation note: the first tokenization-only console preview encountered Windows cp1252's inability to print a tokenizer whitespace symbol. Repeating the same read-only preview with JSON ASCII escaping succeeded. No model inference, data fitting, outcome selection or authored-source change occurred during that preview.
