# Frozen-parameter expression control · pre-run protocol

22 September 2026 · private diagnostic for the AI selective-dissipation paper

## Question

Can apparent post-switch performance improvement occur with **no change to the stored expert parameters**? If yes, an observed later-response gain cannot by itself establish a retained write. This is an adversarial control motivated by Heald, Lengyel and Wolpert's distinction between memory updating and context-dependent expression (Nature 2021, DOI 10.1038/s41586-021-04129-3). It does not import their biological model into this artificial toy.

## Frozen design

- Use eight fixed random seeds. For each seed, generate eight 24-event phases. The hidden binary sign for each phase is independently sampled; each method sees the same scalar input x in {-1,+1} and noisy feedback y = sign*x + Gaussian noise with known sigma=0.35. Phase boundaries are visible, phase identity is not.
- The frozen-route model starts every phase with equal belief in two **preloaded, fixed** expert coefficients +1 and -1. It predicts from the posterior mixture. After each feedback, it updates only the log posterior odds; the two coefficients never change.
- The fixed-mixture control retains equal belief and never updates any state. The same-feedback single-weight SGD control starts each phase at zero and makes parameter writes. A sign oracle is an information-advantaged lower bound, not a fair competitor.
- Score prequential squared error before seeing that event's feedback, for all events and separately for first and later events. Count parameter writes and belief updates separately. Record individual seeds and the exact script/protocol hashes. The fixed-mixture and frozen-route runs share the same generated stream for each seed.
- Verify deterministic replay, finite values, no current-outcome leakage into prediction, and exact nonmutation of the frozen coefficients. Report any seed/phase where the frozen route does not improve over fixed mixture; do not suppress adverse cases.

With Gaussian noise, the exact log-likelihood-ratio increment after observing an event is 2xy/sigma^2. For log odds L, the posterior-mixture prediction is x*tanh(L/2). This algebra is a proof about this specified synthetic model only. Improvement with fixed coefficients would be a counterexample to inferring a parameter write from behavior alone. It would **not** prove SAN, biological gating, long-horizon continual learning, or a selective-dissipation advantage.

## Release boundary

This diagnostic does not replace the paper's unmet gates: source-grade recovery of the SAN-Cycle proposal, learned receiving dynamics, retained acceptance/rollback, held-out task families, strong published CL baselines, independent review, author readback, and approved final PDF.
