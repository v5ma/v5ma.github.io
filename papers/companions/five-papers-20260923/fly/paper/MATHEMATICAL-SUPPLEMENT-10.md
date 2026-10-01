# M13 extension: reconstructing input from terminal-output history

19 September 2026. This extends the existing M13 result family; it does not add a fourteenth family or a newly compiled Lean theorem. The model is the declared engineered receiving component, not Heath's fitted model or an identified fly circuit.

## 1. Assumptions and available information

Write the four-substep map as

\[
\begin{bmatrix}p_{n+1}\\d_{n+1}\end{bmatrix}
=\begin{bmatrix}F_{pp}&F_{pd}\\F_{dp}&F_{dd}\end{bmatrix}
\begin{bmatrix}p_n\\d_n\end{bmatrix}
+\begin{bmatrix}H\\J\end{bmatrix}q_n.
\]

Here \(p\in\mathbb R^4\) is the terminal-output vector, \(d\in\mathbb R\) the physical pooled state, and \(q\in\mathbb R^4\) the drive held over the four engineered integration substeps. The map is derived from the unchanged Draft 12 receiver: \(F=T^4\), \(G=\delta\sum_{j=0}^3T^j B\), and \(G=(H^T,J^T)^T\). All coefficients and the sample interval are assumed known to the observer. In the initial matched case, \(p_0\) and \(d_0\) are known to be zero. In the unknown-initial-state case only the latter assumption is deliberately false.

The observer receives every current \(p\), including the model's zero-drive absence samples. It retains its own previous output and scalar estimate \(\hat d\). It does not receive current or previous physical \(d\), \(q\), object labels, world state or future schedule. Continuous terminal measurements and instrument-supplied range/presence/view are generous engineering assumptions, not demonstrated downstream biological access. No noise, calcium filtering or dropped terminal sample is present in the main grid.

## 2. Conditional reconstruction and proof

If \(H\) is invertible, define

\[
\hat q_n=H^{-1}(p_{n+1}-F_{pp}p_n-F_{pd}\hat d_n),
\qquad
\hat d_{n+1}=F_{dp}p_n+F_{dd}\hat d_n+J\hat q_n.
\]

Let \(\epsilon_n=\hat d_n-d_n\). Subtracting the physical input and state equations gives, without a statistical assumption about the drive,

\[
\hat q_n-q_n=-H^{-1}F_{pd}\epsilon_n,
\qquad
\epsilon_{n+1}=\alpha\epsilon_n,
\qquad
\alpha=F_{dd}-JH^{-1}F_{pd}.
\]

Thus known initialization gives exact input reconstruction by induction: \(\epsilon_0=0\Rightarrow\epsilon_n=0\) and \(\hat q_n=q_n\) for every subsequent sample. Unknown initialization converges geometrically if \(|\alpha|<1\): \(\epsilon_n=\alpha^n\epsilon_0\), with input error bounded by \(\lVert H^{-1}F_{pd}\rVert_\infty |\alpha|^n|\epsilon_0|\). If that stability condition fails, this conclusion is unavailable. Invertibility alone does not prove convergence. Incorrect model coefficients also invalidate this exact error recurrence.

This is an elementary unknown-input observer construction. It is not a newly discovered general observer algorithm. It extends M13's direct-prior-state inverse by exposing an implementable alternative and its information assumptions. A nonlinear or partially observed biological system need not satisfy the same algebra.

## 3. Numerical specialization, not physiological calibration

The preserved model has rank-four \(H\), singular values approximately 0.351829, 0.351829, 0.336138 and 0.335662, condition number 1.048165, and \(\lVert H^{-1}\rVert_\infty=2.979184\). The scalar contraction coefficient is \(\alpha=0.7430473138221343\). Each component of \(H^{-1}F_{pd}\) is approximately 0.5325911782.

With actual initial \(d_0=0.25\) but observer initialization zero, \(\epsilon_0=-0.25\). Its magnitude after the first observation is 0.1857618285 and after 24 observations is 0.0002006020. These are sample-index quantities, not seconds or measured rates of adaptation. The saved trajectories satisfy the derived recursion under the matched coefficients. Changing the observer's assumed time constant to 1.5 times the physical value produces nonzero input-estimation error; no claim of exact recurrence is made for that case.

The [separate scalar audit](application/observable-receiver-v0/checks-01/CHECKS.json) constructs \(F,G\) by applying an independently written scalar recurrence to basis states/inputs and uses scalar elimination for \(H^{-1}\), rather than importing the experiment's matrix helper. This is same-agent software checking, not an independent mathematical review. Small differences between scalar and matrix floating-point residuals are retained: the application reports a matched maximum drive error of 3.89×10⁻¹⁶, while scalar recomputation is also below 4×10⁻¹⁶. Neither is a biological error bar.

## 4. Output-noise sensitivity

Suppose the measured outputs instead satisfy \(y_n=p_n+\nu_n\), and the observer retains measured \(y_n\). With the same known coefficients, subtraction gives

\[
\hat q_n-q_n=H^{-1}(\nu_{n+1}-F_{pp}\nu_n-F_{pd}\epsilon_n),
\]

\[
\epsilon_{n+1}=\alpha\epsilon_n+JH^{-1}\nu_{n+1}
+(F_{dp}-JH^{-1}F_{pp})\nu_n.
\]

This follows by substituting the first error equation into the observer-state equation; the \(F_{dp}p_n\) terms cancel. It shows why exact noiseless reconstruction cannot be advertised as robustness to calcium-indicator dynamics or noise. If \(\lVert\nu_n\rVert_\infty\le\eta\) uniformly, then

\[
|\epsilon_{n+1}|\le |\alpha||\epsilon_n|
+\bigl(\lVert JH^{-1}\rVert_1+\lVert F_{dp}-JH^{-1}F_{pp}\rVert_1\bigr)\eta.
\]

The parenthesized coefficient is 0.0770858059 for this model. Thirty-two bounded algebra checks confirm the identity to maximum residual 3.67×10⁻¹⁶ in the [interface controls](application/observable-receiver-v0/controls-01/CONTROLS.json). These checks are not additional noisy closed-loop experiments; no physiological noise distribution has been fitted.

## 5. What does not follow

Terminal-history access is less privileged than reading a physical hidden state, but known coefficients, initialization, unfiltered continuous outputs and an invertible input map remain substantial assumptions. The matched observer reproduces all 576 reference actions in the declared grid; it does not outperform the direct comparator. A current-only linear readout is a temporal-access ablation, not a strong equally informed competitor to all SAN mechanisms. A 50% error in the assumed pooled time constant changes reconstructed drives without changing any action here. This finite example reinforces the distinction between behavioral success and parameter identification; it does not prove that arbitrary kinetic differences are unobservable.

Heath's recovered steady-state model makes the paper's existing M1 clock-identification limit especially relevant. That source does not add native sensory timing to this construction. Neither M1 nor the M13 extension establishes PWD throughout NAPOT, biological consciousness, physiological state accessibility, native dynamics or a SAN-specific comparative advantage. The analytic inventory remains thirteen result families and seven earlier Lean-compiled M7a/M8 supporting lemmas.
