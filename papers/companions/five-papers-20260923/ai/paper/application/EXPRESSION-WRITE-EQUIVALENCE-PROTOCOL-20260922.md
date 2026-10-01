# Frozen protocol: expression versus parameter-write equivalence

Date: 22 September 2026. Owner: the artificial Selective Dissipation paper. This protocol was written before executing the accompanying finite diagnostic. It tests an **identification limit**, not selective-dissipation performance.

## Models and theorem target

One-dimensional inputs are `x ∈ {-1,+1}` and observations follow the declared comparison likelihood `y | s,x ~ Normal(s*x, sigma^2)`, where the hidden sign `s ∈ {-1,+1}`. The likelihood and `sigma` are supplied to both implementations. No learned SAN receiver or biological oscillation is represented.

- Route implementation `R`: immutable expert coefficients `e_plus=+1`, `e_minus=-1`; mutable log posterior odds `L_0=0`. Predict `x*tanh(L_t/2)`, then update `L_(t+1)=L_t+2*x*y/sigma^2` after feedback. Count expert-parameter writes separately from posterior-state updates.
- Write implementation `W`: one mutable scalar model parameter `w_0=0`. Predict `x*w_t`, then durably write `w_(t+1)=tanh(atanh(w_t)+x*y/sigma^2)` after the same feedback. There is no mixture or hidden route in this implementation.

**Predeclared result:** for any finite shared input/feedback sequence in exact real arithmetic, `w_t=tanh(L_t/2)` by induction, so all pre-feedback predictions are equal. R has no expert-parameter writes; W has a parameter write whenever its value changes. Input/output behavior alone, without a targeted reset or internal-state/write audit, does not identify these implementation mechanisms. The result does **not** say there is no state change in R: `L` changes, and could itself be stored persistently. It does not establish biological plasticity, learning superiority, or a conscious process.

## Finite numerical diagnostic, fixed before execution

Use pure Python standard library, no data download and no model job. For seeds `2701,2702,2703,2704` and `sigma ∈ {1.25,2.0}`, generate exactly twelve events per stream: hidden signs `++++----++++`, independently randomized `x ∈ {-1,+1}`, and Gaussian observation noise with that sigma. Run R and W on the identical stream, with feedback arriving only after each prediction. Record maximum absolute prediction/state differences, number of posterior updates, expert writes and scalar writes. Require differences at most `1e-12`, zero expert writes and at least one scalar write per stream. Check the separate noiseless two-event example at `sigma ∈ {0.75,1.25,2.0}`: after `x=y=1`, the second prediction is `tanh(1/sigma^2)` and its squared error against the true +1 sign is strictly below the initial error of 1.

Output a JSON receipt with exact protocol/script SHA-256 values and every Boolean check. Re-run once and compare exact bytes. These numerical checks illustrate the theorem and catch implementation mistakes; they do not prove the universal real-arithmetic claim or validate the application domain.
