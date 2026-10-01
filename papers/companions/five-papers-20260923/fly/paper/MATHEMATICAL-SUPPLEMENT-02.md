# Coordinate changes do not create predictive information

Additional elementary proposition for Draft 2; 19 September 2026. This is an analytic proof with numerical checks, **not a Lean-verified theorem or a novel general mathematical result**. The original four propositions remain in [Mathematical foundations](MATHEMATICAL-FOUNDATIONS.md).

## M5. Weighted linear-fit invariance under an invertible coordinate change

Let X be an n-by-d real design matrix of full column rank, W a positive diagonal n-by-n matrix, and y an n-vector. Let B be an invertible d-by-d matrix. Define beta as the unique minimizer of

    (y - X beta)^T W (y - X beta).

Fit theta instead using the transformed design X B with the same W and y. Then theta = B^{-1} beta. For any held-out design T with d columns, T beta = (T B) theta. Hence identical weighted or unweighted prediction metrics result on a fixed evaluation set.

**Proof.** The substitution beta = B theta is a bijection. Substitution makes the two objectives identical for corresponding parameters. Positive W and full column rank make X^T W X positive definite, giving a unique minimizer. Apply the inverse substitution to that minimizer. The held-out identity follows by multiplication. No distributional or biological assumption is required.

An orthonormal basis with one equal-coordinate direction and three perpendicular directions therefore cannot, by itself, improve a full four-coordinate linear fit. This does not prove that biological coding, nonlinear transformations, noise, regularization or restrictions on receivers are equivalent. Those alter the model or the measurement assumptions and must be tested separately. Dropping three directions to form the equal-coordinate-sum control is not an invertible coordinate change.

The hue diagnostic checked full-data prediction equivalence for every supplied cell/condition label. Its maximum absolute difference was 1.24345e-14. Integer-weight least squares was also checked against explicit row replication. These numerical checks illustrate the analytic result; finite tests do not prove it universally.

## Intervention convention check

In the authors' code, W[i,j] is a presynaptic-i to postsynaptic-j weight, and a batch of row-vector states uses Y W. Blocking outgoing signals from i zeros **row i**. With a transposed postsynaptic-by-presynaptic convention, the same operation zeros **column i**. Neither operation zeros all inputs to the measured cell or deletes that cell's response.

This follows entry-by-entry from W_post,pre = W_pre,post^T. The numerical test preserves incoming off-diagonal connections while verifying the transposed zeroing identity. It does not validate the fitted anatomical weights or certify how a living fly responds to a particular intervention.

The published generic `Circuit.forward` additionally renormalizes incoming weights after applying the selected output block. The exact fitted call configuration is required before treating that code path as the intervention used in a figure. Matrix orientation is settled by source code; the full fitted experimental mapping remains open.
