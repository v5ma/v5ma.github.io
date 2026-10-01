# Mathematical obligations for learned cache repair

These are explicit mathematical arguments supporting the current experimental interpretation. They are not new algorithmic inventions, newly compiled Lean statements, or a proof of the complete application. The previously accepted Lean count remains 31. In particular, an algebraically well-defined correction need not implement the requested change of meaning.

## 1. Balanced counterfactual pairs do not define a useful constant steering vector

Let p be an involutive permutation of the n training indices, and let the desired state change be d_i = x_{p(i)} - x_i. Because p is a permutation,

    sum_i d_i = sum_i x_{p(i)} - sum_i x_i = 0.

Thus the least-squares constant predictor of d is zero. This holds even when each individual d_i is nonzero and behaviorally consequential. It is a statement about the paired sampling scheme, not about whether the model represents roles. The present training set includes both directions of every pair and records the numerical cancellation. A one-direction training set would not justify this conclusion.

## 2. Kernel fitting has a unique solution under the stated regularization

For a positive-semidefinite kernel Gram matrix K and lambda > 0, every nonzero vector v satisfies

    v^T (K + lambda I) v = v^T K v + lambda ||v||^2 > 0.

Consequently K + lambda I is invertible, and A = (K + lambda I)^{-1}Y is uniquely defined. The linear dot-product and Gaussian RBF kernels used here are standard positive-semidefinite kernels. For the latter, the usual finite-set argument expands exp(x dot y / sigma^2) into its convergent series of tensor-power inner products and multiplies by the positive diagonal factors exp(-||x||^2/(2 sigma^2)). The experiment's dimension and bandwidth normalization merely rescales the positive bandwidth.

The separate equation audit checks the saved coefficients against (K + lambda I)A = Y, training-only centering/scaling, the bandwidth, and the target permutation. A small floating-point equation residual is a numerical implementation check, not a proof that the learned correction generalizes.

## 3. A sufficient output-margin certificate requires more than state reconstruction loss

Fix a particular query and a desired full model state t. Let L(t) be its full-vocabulary logit vector, with a unique winning token a and positive margin

    m = L_a(t) - max_{b != a} L_b(t).

If a proposed state s satisfies ||L(s) - L(t)||_infinity < m/2, then a is also its unique winner. Indeed, for every b != a,

    L_a(s) - L_b(s) >= L_a(t) - L_b(t) - 2 ||L(s)-L(t)||_infinity > 0.

This is an elementary argmax-stability condition, not a newly discovered theorem. A suitable Lipschitz bound on the complete downstream map could convert a full-state distance into such a logit bound. No such global bound is established here. Training-average error on one attention window is neither a held-out error bound nor a distance bound on the complete hybrid state, and it supplies no known downstream Lipschitz constant or token margin.

For an entire generated answer, apply the condition at every generation step along the same already-matched token history, including termination. First-token agreement alone does not prove full-answer agreement. Our experimental scoring therefore uses the complete generated answer; the native reconstruction audit additionally checks its token sequence and first-step full logit hash. This study does not report empirical margin certificates.

## 4. Authorization, intervention support, and semantic success are different obligations

The learned-policy function receives only its fitted parameters, the original attention window, and the selected method. It receives no query, test donor or expected answer. This interface and the pre-donor policy-state commitment make the declared information boundary inspectable; they are not a hardware isolation or malicious-code noninterference proof.

Changing only a declared attention window can be checked by exact state hashes and unchanged-prefix bytes. That support check does not guarantee preservation of color, binding of either role, or generalization to another prefix. Those remain measured outcomes. Likewise, acceptance of a properly authorized edit does not imply that the edit is useful. Stopping future edits does not undo a change already made; complete restoration relies on a retained original state and cannot retract prior external actions.

## Scope of the current proof/application bridge

The eight new construction tests exercise split separation, the query-free interface, kernel arithmetic, clipping, known-sample fitting, and unchanged native-state support. The separate fit audit checks all saved numerical parameters. None formally refines the Python/ONNX system into Lean, verifies arbitrary human-language intent, or certifies global AI alignment. Further formal work should target an additional necessary obligation, not increase the theorem count without strengthening a claim.
