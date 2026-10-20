\begin{center}
{\LARGE\bfseries Learning to Feel\par}
\vspace{0.35em}
{\large\itshape Technical supplement to public preprint v1.1\par}
\vspace{0.8em}
{\small\textbf{Micah Blumberg}\par}
{\small Self Aware Networks Research Institute\par}
{\small\url{https://selfawarenetworks.com}\par}
{\small ORCID: \url{https://orcid.org/0009-0004-5175-9532}\par}
{\small Public preprint v1.1 - October 18, 2026\par}
\end{center}

\begin{center}\small
Hypothesis/model preprint. Not peer reviewed.\\
No biological result, clinical benefit or conscious artificial system is established.
\end{center}

**Reading order for public preprint v1.1:** The cumulative supplement retains the original technical source and Appendices A-M; new Appendix N addresses state selection. The earlier reading history below is preserved. Appendix K qualifies feedback availability and retained state. The updated Appendix L specifies two-level retention, informative replay, task identity and decision-time readouts. Appendix M reports the completed finite common task, its conditional results and its calibration limits. The paired main adds Section 7.7. Earlier execution and current-version statements below describe their original stages. The calculations are computational results; independent scientific/statistical review remains open.

**Typesetting note:** Verbatim preservation refers to the unchanged Markdown source. This PDF transcribes its mathematical notation to LaTeX; the build receipt records the changes.

**Historical reading note for Draft 23:** The original technical source and its Section 6 are retained below. Appendices A, B, C and D reproduce the acquisition/expression, timing-specificity, feedback-credit and receiver-specificity refinements. Appendix E adds joint-measurement equations, three conditional propositions and Application 05 results. Appendix F adds post-result calibration bounds and recording-alias sensitivity, not a sixth application. Appendix G reproduces the phase-delivery annex integrated in Draft 18 and retained in Draft 23; its earlier status statements are historical and its M1-M3 sources correspond to main references 50-52. Its source section labels C1/C2 are retained; four typeset equations are labelled G1-G4. The sensorimotor bridge and reference 53 remain in the paired main manuscript. The added dendritic controls, learning-stage bridge and reference 54 appear in its Sections 3, 4 and 6. Appendix H adds the phase-relation and access-measurement analysis, with five displays H1-H5 and three elementary propositions. Appendix I adds six displays I1-I6 and three elementary allocation, presentation and missing-observation results. These are design refinements, not a sixth application. Appendix J adds eight displays J1-J8 and three elementary inference/reference/concentration results. Reference 46 now cites the qualified 2026 final article, retaining its earlier preprint route. No external model was executed or biological data analyzed in that comparison. Earlier technical content and numerical results are preserved. Read the experiment cumulatively with the amendments and current main Section 6. The historical integrated-manuscript link is redirected to the current paired main PDF; the original Draft 6 source remains unchanged. No amendment supplies a biological result.

This supplement accompanies the [integrated manuscript](Learning-to-Feel-v1.1.pdf). It preserves Draft 5 Sections 5-7 **verbatim**, including all 21 equations, eleven conditional proofs, full methods, numerical results, counterexamples and adverse comparisons. The source draft is unchanged.

The retained numbering belongs to this technical document: Section 5 contains mathematics, Section 6 contains the complete prospective study design, and Section 7 contains all four constructed applications. Internal references to these sections use this retained numbering, not the condensed sections of the main manuscript. Numbered literature references refer to the main manuscript's bibliography; references 1-35 retain their identities.

These are conditional mathematics, constructed-system results and a prospective protocol, not biological evidence or independent scientific validation. Historical development details are retained to expose amendments rather than imply preregistration of changes made after initial results.

# Supporting artifacts

- [Design derivation (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-10) and [Application 01 results](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/phase-learning-design-results.json).
- [Application 02 (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-2) and [full results](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/receiver-level-inference-results.json).
- [Application 03 (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-3), [original protocol (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-4), [code](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/learned-receiver-application.mjs) and [full results](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/learned-receiver-results.json).
- [Application 04 (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-8), [original protocol (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-7), [first amendment (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-5), [second amendment (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-6), [code](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/reciprocal-reconstruction.mjs) and [full results](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/reciprocal-reconstruction-results.json).
- [Acquisition-to-access protocol (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-1), [measurement fixtures](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/acquisition-access-check.mjs) and [full fixture results](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/acquisition-access-results.json).

# 5. A minimal quantitative discriminator

## 5.1 Define the downstream consequence before measuring it

Let X be an intervention-capable source variable, Y a declared receiver endpoint, s a pre-intervention state, and tau a specified lag. A finite causal influence is

\begin{equation}
\begin{aligned}\mathcal I_{XY}(s,\tau;\delta)=\delta^{-1}\bigl\{&\mathbb E[Y(t+\tau)\mid\operatorname{do}(X=x+\delta),s]\\ &-\mathbb E[Y(t+\tau)\mid\operatorname{do}(X=x),s]\bigr\}.\end{aligned}\tag{1}
\end{equation}

$\delta$ is nonzero and expressed in X's units; the result has Y-units/X-units. Equation (1) defines an estimand. Observational recordings do not automatically identify it. Conditioning on a state altered by the intervention could change the estimand or introduce selection bias; s must be defined beforehand.

A signed phasor sum can parameterize a candidate contribution to such influence, but it remains a model until amplitudes, transmission, reference, and receiver response are calibrated. This paper does not rename spectral coherence as an interventional effect.

## 5.2 First-harmonic response model

For stage l, before or after training, let the conditional endpoint on a declared response/link scale be

\begin{equation}
m_l(\phi)=a_l+b_l\cos\phi+c_l\sin\phi\tag{2}
\end{equation}

$\phi$ is measured against the same calibrated receiver reference. The coefficients have the units of the endpoint or link scale. For a logistic response model, m is log odds rather than probability. Let $v_l=(b_l,c_l)$; its norm describes modulation amplitude and its direction describes preferred phase when nonzero.

At phases 0, $\pi/2$, $\pi$, and $3\pi/2$, the exact model identifies

\begin{equation}
\begin{aligned}a&=(m_0+m_{90}+m_{180}+m_{270})/4,\\ b&=(m_0-m_{180})/2,\\ c&=(m_{90}-m_{270})/2.\end{aligned}\tag{3}
\end{equation}

**Proposition 1.** Equation (3) uniquely recovers the coefficients within the assumed first-harmonic family.

**Proof.** The four cosine/sine pairs are (1,0), (0,1), (-1,0), and (0,-1). Adding the four response equations eliminates b and c. Subtracting opposite equations recovers twice b or c. These operations identify all three coefficients. This proves identification only within the assumed family.

Higher harmonics can alias at those four phases. A real experiment needs additional phase sampling, model checks, uncertainty estimation, and held-out prediction; the algebra is not evidence that four bins are sufficient.

## 5.3 Why a learning-by-phase interaction does not reject gain

The half-opposite-phase contrast is

\begin{equation}
\begin{aligned}C_l(\phi)&=[m_l(\phi)-m_l(\phi+\pi)]/2\\ &=b_l\cos\phi+c_l\sin\phi.\end{aligned}\tag{4}
\end{equation}

An additive intercept shift cancels. However, a pure gain change $v_{\rm post}=g v_{\rm pre}$, $g>0$, generally changes (4). Therefore, a learning-by-phase interaction can occur without a changed phase preference.

Define

\begin{equation}
J=b_{\rm pre}c_{\rm post}-c_{\rm pre}b_{\rm post}\tag{5}
\end{equation}

**Proposition 2.** In this exact model, nonzero J is sufficient to reject uniform scalar gain. Zero J is not sufficient to establish positive gain.

**Proof.** Substituting $v_{\rm post}=g v_{\rm pre}$ into (5) yields two equal products, so J=0. Conversely, $v_{\rm post}=-v_{\rm pre}$ also gives zero J but reverses the preference. A zero baseline vector makes the direction comparison undefined.

For a nonzero baseline, a more inclusive null comparison is

\begin{equation}
\begin{aligned}\widehat g&=\max\{0,\langle v_{\rm pre},v_{\rm post}\rangle/\|v_{\rm pre}\|^2\},\\ E_{\rm gain}&=\|v_{\rm post}-\widehat g v_{\rm pre}\|.\end{aligned}\tag{6}
\end{equation}

**Proposition 3.** Equation (6) is the least-squares distance to the nonnegative-gain ray.

**Proof.** The squared distance equals
$\|v_{\rm post}\|^2-2g\langle v_{\rm pre},v_{\rm post}\rangle+g^2\|v_{\rm pre}\|^2$.
Its unconstrained minimizer is the displayed ratio; the restriction $g\geq0$ clips negative values to zero. The residual vanishes exactly on that ray.

These are elementary conditional results, not new physiological laws. In noisy data, a nonzero point estimate needs an uncertainty analysis and a prespecified meaningful departure. A changed reference or nonlinear response scale can also mimic retuning.

## 5.4 Scope of the discriminator

The model distinguishes a particular retuning claim from ordinary gain under stated assumptions. It does not identify the full biological architecture or consciousness. Learning might strengthen aligned recruitment while leaving preferred phase unchanged. Such a result could support the broader influence account while failing the retuning subhypothesis.

This prevents a design error in both directions: ordinary gain must not be mislabeled as phase retuning, and absence of retuning must not be presented as refutation of every learning-dependent recruitment mechanism.

## 5.5 Retained organization and current expression

A minimal extension keeps a current network state z separate from a relatively retained organization $\theta$:

\begin{equation}
z_{t+1}=F(z_t,u_t,a_t;\theta_t)\tag{7}
\end{equation}
\begin{equation}
\theta_{t+1}=\theta_t+\eta G(z_t,u_t,a_t,e_t;\theta_t)\tag{8}
\end{equation}

Here u is incoming evidence, a is action, e is returned evidence or a declared teaching signal, and G is a candidate learning update. The coordinates of z and $\theta$ must be specified in an implementation. With dimensionless $\eta$, each coordinate of G has the corresponding $\theta$ unit. A small $\eta$ can represent a timescale separation in a model, but is not a universal biological constant.

Equations (7)-(8) are a model specification, not a proved learning rule. With learning frozen during a probe, changed z can temporarily alter access while $\theta$ is retained. Across acquisition, changing $\theta$ can alter the response to a matched later input even after the immediate activity has dissipated. A familiar recurrent network can implement this distinction; its inclusion is explanatory discipline, not a novelty claim.

The earlier coefficients $a_l$, $b_l$, and $c_l$ may depend on both $\theta$ and the distribution of current states. A pre/post change cannot therefore be attributed to retained learning merely because it was measured after training. State controls, delayed tests, and a specified intervention are needed. The distinction also prevents storing all of the desired learning effect in an unexplained context variable and calling the model mechanistic.

## 5.6 Preserve the receiving unit before pooling

The unit of the phase claim must be declared. Suppose each of n units has baseline vector $v_i$ and undergoes only positive gain, $w_i=g_i v_i$. The determinant computed after averaging is

\begin{equation}
\det(\operatorname{mean}(v_i),\operatorname{mean}(w_i))=\frac{1}{n^2}\sum_{i<j}(g_j-g_i)\det(v_i,v_j)\tag{9}
\end{equation}

**Proposition 4.** Heterogeneous gains can produce nonzero pooled orientation change even when no unit retunes.

**Proof.** Expand the determinant of the two means bilinearly. The diagonal terms vanish; combining the i,j and j,i terms gives (9). For $v_1=(1,0),\ v_2=(0,1),\ g_1=2\ \text{and}\ g_2=1$, each individual determinant is zero but the pooled determinant is -1/4.

This does not invalidate Proposition 2. It changes which null was rejected: a single common gain at the aggregate level is not the same null as a separate gain for every unit. Across people, pooling can therefore manufacture an apparent common phase shift. Within an ensemble, changed component weighting could be a genuine recruitment mechanism without retuning the individual components. The experiment must distinguish those interpretations rather than label both as phase plasticity.

One candidate receiver-level summary uses two independent estimates of each unit's pre/post determinant:

\begin{equation}
T_i=\widehat J_{i,1}\widehat J_{i,2},\qquad\mathbb E[T_i]=J_i^2\tag{10}
\end{equation}

**Proposition 5.** Equation (10) is unbiased under conditionally independent splits with unbiased determinant estimates.

**Proof.** Independence gives $\mathbb E[\widehat J_{i,1}\widehat J_{i,2}]=\mathbb E[\widehat J_{i,1}]\mathbb E[\widehat J_{i,2}]=J_i^2$. In the accompanying additive-error construction, unbiased determinant estimates follow from zero-mean errors and independence between pre- and post-stage errors. These assumptions are not consequences of splitting a serially dependent recording into two files.

Squaring one noisy estimate instead produces $J_i^2$ plus its variance. Reusing the same trials can therefore yield positive apparent noncollinearity under pure gain. Negative cross-products from independent splits must be retained, not clipped to zero.

This statistic measures amplitude-weighted noncollinearity. It misses a half-cycle reversal and cannot identify orientation from a zero baseline. Phase-reference drift, changing mixed populations, correlated estimation errors, and unequal preprocessing can still defeat its interpretation. It supplements the gain-ray comparison; it is not a complete retuning detector or a measure of consciousness.

## 5.7 An implemented retained receiver

A small functional instantiation now makes the fast and retained coordinates explicit. For an eight-sample episode, let $x_t$ be a signed sensory-feature analogue, q a recorded exploratory action, c a supplied context sign, z an episode state initialized to zero, and $\theta$ a retained readout. For a receiving basis B(t),

\begin{equation}
\begin{aligned}z_{t+1}&=z_t+B(t)x_t,\qquad\psi=(1,cqz_T),\\ D&=\theta\mathbin{\cdot}\psi,\qquad a=\operatorname{sign}(D).\end{aligned}\tag{11}
\end{equation}

The constructed environment returns binary feedback r=a y after the decision, where y is the correct choice. Therefore a r=y in this special two-choice setting. The update is

\begin{equation}
\theta_{n+1}=\theta_n+\frac{\eta_n(ar-D)\psi}{1+\|\psi\|^2}\tag{12}
\end{equation}

All quantities are dimensionless. This normalized linear update is an explicit computational choice, not a derived biological plasticity law. It uses supervised-equivalent feedback, not a general reinforcement-learning solution. The multiplication by c q is supplied to every model rather than learned from raw experience.

The integrated receiver uses $B(t)=1/2$. The phase-feature receiver uses $B(t)=(1/2,\cos(2\pi t/8),\sin(2\pi t/8))$; its reference is supplied, not self-generated. A time-bin receiver instead retains every sample and learns an independent coefficient for each. Learned readout from transient state has substantial prior foundations [31]. This implementation is not a replication of a liquid-state circuit and does not inherit its general computational guarantees.

The model distinguishes persistent $\theta$ from resettable z, and makes later action depend on the learned readout. This temporal submodel does not implement content-bearing reciprocal reconstruction; Section 5.9 adds a separate, limited statistical realization of that operation.

## 5.8 What this application cannot identify from behavior alone

For phase weights $(b,w_0,w_c,w_s)$, define

\begin{equation}
\begin{aligned}K_t&=w_0/2+w_c\cos(2\pi t/8)+w_s\sin(2\pi t/8),\\ D&=b+cq\sum_tK_tx_t.\end{aligned}\tag{13}
\end{equation}

**Proposition 6.** Every decision-score function of this phase-feature receiver can be represented by the time-bin receiver on the declared finite window.

**Proof.** Substitute (11) into D and distribute the weighted sum over t. The coefficient of $x_t$ is exactly c q $K_t$. Assigning $K_t$ to the time-bin readout and retaining b gives equality for every input sequence. This is an input-output equivalence within the specified linear family, not an equivalence of all physical mechanisms or SAN architectures.

This supplies a strong alternative, not an assertion that brains lack oscillations. A positive phase-model result alone cannot identify oscillation when a nonoscillatory implementation produces the same map. The temporal reference, its physical realization and interventions that distinguish realizations need independent evidence.

**Proposition 7.** Identical informative replay produces identical retained learning under an identical initial state and deterministic update.

**Proof.** At the first update, the states, features and teaching targets agree. Equation (12) therefore gives equal next weights. Repeating the argument establishes equality at every update. This result does not apply when active and passive conditions differ in receiving state, information, engagement or other inputs to the learning rule.

Consequently, a control that removes the original action tag tests a changed information relation, not bodily action execution alone. A physiological experiment needs stronger matching than calling one condition replay.

Finally, the model supplies an explicitly declared influence endpoint:

\begin{equation}
\frac{D(x+\delta e_t)-D(x)}{\delta}=cqK_t\tag{14}
\end{equation}

Here $\delta$ is nonzero, $e_t$ selects one sample, and all other inputs and weights are held fixed. Equation (13) proves the identity. Learning can therefore change a source contribution's consequence for D while later test input remains fixed. This is an internally used decision variable, not electrical amplitude, experienced intensity or a measured neural effect.

## 5.9 A learned reciprocal reconstruction model

The finite-window learner above does not reconstruct missing content through reciprocal interaction. A second construction addresses that limited functional gap. Let z contain eight predefined cue coordinates and a ninth consequence score. Complete training episodes estimate a retained mean $\mu$ and covariance $\Sigma$; a positive diagonal ridge makes $\Sigma$ invertible. This is global statistical learning over supplied coordinates, not discovery of raw sensory features or a local plasticity rule.

At test, independent noisy observations of selected cues contribute precision $\Lambda$ and centered evidence b. For $\delta=z-\mu$,

\begin{equation}
H=\Sigma^{-1}+\Lambda,\qquad E(\delta)=\tfrac12\delta^{\mathsf T}H\delta-b^{\mathsf T}\delta\tag{15}
\end{equation}

Here $\Lambda$ adds $1/\sigma_m^2$ to each independently observed cue's diagonal; b adds $(o_j-\mu_j)/\sigma_m^2$ at that coordinate. H is positive definite. The objective is mathematical, not electrical or metabolic energy. Its learned statistical reference is not a tonic phase reference.

A recurrent implementation updates each coordinate using the others' current states:

\begin{equation}
\delta_i^{\rm new}=\frac{b_i-\sum_{j\ne i}H_{ij}\delta_j}{H_{ii}}\tag{16}
\end{equation}

**Proposition 8.** Cyclic exact coordinate updates of this positive-definite quadratic converge to the same unique solution as direct solving, $H\delta=b$.

**Proof.** Holding other coordinates fixed gives a strictly convex scalar quadratic. Completing its square gives the update (16) and the decrease $E(\mathrm{old})-E(\mathrm{new})=(H_{ii}/2)(\delta_i^{\rm old}-\delta_i^{\rm new})^2$. The objective is bounded below, so these squared changes have finite sum and each tends to zero. Positive definiteness also bounds the iterates in a compact sublevel set. At each coordinate's update its partial derivative becomes zero; subsequent changes within a finite sweep tend to zero, so the full gradient at sweep boundaries tends to zero. Every subsequential limit therefore solves $H\delta=b$. The solution is unique, so the bounded sequence converges to it. This is a conditional result for the ideal update; numerical stopping must be checked separately.

Reciprocal prediction already has major theoretical precedents. Rao and Ballard's model learned natural-image regularities through interacting prediction and error pathways [32]. The present joint-Gaussian coordinate model is not a replication or a novel discovery of feedback reconstruction.

**Proposition 9.** With learned parameters, mask and noise held fixed, changing observation j changes reconstructed coordinate k according to

\begin{equation}
\frac{\partial\mathbb E[z_k\mid\text{observations}]}{\partial o_j}=\frac{C_{kj}}{\sigma_m^2},\qquad C=H^{-1}\tag{17}
\end{equation}

**Proof.** The reconstructed mean is $\mu+H^{-1}b$. H remains fixed and the derivative of b with respect to $o_j$ is $e_j/\sigma_m^2$. Multiplication gives (17). This intervention is on the software's input; covariance learned from observation does not identify a physiological causal graph.

Thus learning changes a declared receiver's input-to-consequence map without requiring that a single local amplitude equal meaning. The biological interpretation still requires measured variables and interventions that connect this functional example to a nervous system.

## 5.10 New evidence versus repeated computation

**Proposition 10.** One new independent Gaussian observation of cue j, with variance $\sigma_m^2$, changes the current posterior covariance by

\begin{equation}
\begin{aligned}C^{\prime}&=C-\frac{C_{:j}C_{j:}}{\sigma_m^2+C_{jj}},\\ C_{yy}-C^{\prime}_{yy}&=\frac{C_{yj}^2}{\sigma_m^2+C_{jj}}.\end{aligned}\tag{18}
\end{equation}

**Proof.** The new precision is $C^{-1}+e_je_j^{\mathsf T}/\sigma_m^2$. Multiplying it by the stated C' gives the identity matrix, establishing the inverse. Reading its y,y element proves the reduction. The assumptions include independent measurement noise and a fixed Gaussian model; a correlated copy of an existing observation is not such an observation.

The implementation selects a still-unobserved cue maximizing (18), receives a fresh measurement, and reconstructs again. Under this model covariance depends on the observation mask, not its values. This policy is therefore uncertainty-directed feature selection, not demonstrated content-adaptive planning.

Repeated coordinate updates make already available relations usable without adding independent evidence. Treating an unchanged observation as several independent samples instead introduces an unwarranted precision increase. This distinction does not make feedback useless: feedback can perform inference, provide retained context not yet used, or carry genuinely new evidence. It prevents confusing internal iteration with repeated experimental confirmation.

# 6. A study that tests the connections together

## 6.1 Acquisition and controlled probes

The primary comparison has three randomized acquisition policies: active contingent training (C), informative yoked replay (R), and active noncontingent training (N). Replay should preserve the original action/context/outcome information as well as the physical stimulus sequence; removing the action tag changes the information available for learning. C versus R addresses what executing the contingent action adds beyond informative exposure. C versus N addresses contingency beyond matched activity. Neither contrast perfectly isolates one biological operation.

Randomize roles within prespecified yoke sets where feasible and retain those sets in the dependency structure. Matching movement trajectories does not guarantee matching forces or proprioception. Measure exposure, force, movement, reward, engagement, fatigue and receiving state, while distinguishing planned controls from residual differences. Do not adjust away post-training attention or arousal in the primary total-effect analysis merely because they differ: they may be consequences of training rather than pre-existing confounders. Secondary explanatory analyses need their own causal assumptions.

Probe the same calibrated sensory features before and after training, including a condition without active exploration. Use untrained features or sites to estimate specificity and transfer. Reverse a learned consequence where feasible, so that a changed response can follow significance rather than merely a fixed stimulus identity.

The acquisition, consolidation, probe, and report windows must be distinct. A manipulation during consolidation could change a later trace without controlling online access. A manipulation at report could change the answer without changing the preceding sensation.

## 6.2 Receiving-state measurements and intervention

Select the candidate source, receiver, lag, rhythm, and primary endpoint independently of the confirmatory outcome. Record rate/power and phase-related quantities separately. Address common input, source leakage, evoked waveform shape, unequal signal-to-noise, and movement before interpreting synchrony as communication.

Human EEG/MEG can assess candidate relations but cannot directly establish cell-specific dendritic influence. A biological circuit test and a human awareness test may require different preparations. Their bridge must be stated, not assumed.

If a reliable timing relationship exists, compare compatible, disrupted, control, and restoration conditions using a specialist-designed, ethically approved intervention. Verify both the intended neural change and remaining off-target changes. Random and sham interventions answer different questions. Actuator kinetics, entrainment, and stimulation artifacts require separate characterization. This paper supplies an experimental question, not instructions for unsupervised brain stimulation.

## 6.3 Six predictions and informative failures

| ID | Prediction | Result that would constrain the claim |
|---|---|---|
| P1: contingency | At matched probe input, contingent learning produces more feature-specific transfer or recruitment change than replay and active noncontingency. | Precise equivalence weakens the added-contingency claim; shared improvement favors exposure or practice. |
| P2: relative influence | Learning changes the prespecified phase-compatible source-receiver relation and its downstream consequence, with explanatory value beyond input, rate/power, and measured state. | No incremental held-out value weakens this phase-mediated formulation. An association alone does not identify a causal route. |
| P3: timing intervention | Verified disruption preferentially reduces the learned advantage, and compatible restoration recovers it more than control timing. | Timing-independent impairment favors nonspecific disruption; preserved benefit after effective selective perturbation challenges the specified causal step. |
| P4: conscious access | The supported training-by-timing effect also changes prespecified access outcomes after sensitivity, criterion, confidence, and reporting alternatives are addressed. | Changes confined to performance, reaction time, or task-bound reporting do not establish the added access relation. |
| P5: reciprocity | Learned expectation changes tactile recruitment, while tactile evidence changes the expectation's later influence. | A verified exclusively one-way effect constrains the proposed reciprocal route. Missing measurements do not establish either direction. |
| P6: value context | With tactile input controlled, learned appetitive/aversive context changes receiver-relative influence and behavior. | A complete explanation by measured arousal, criterion, or generic rate changes removes the claimed incremental mechanism. No universal voltage sign follows. |

These predictions are not claimed unique to SAN. P1 alone supports learning, P2 alone can remain correlational, and P3 without P4 identifies a processing contribution rather than conscious access. Failed manipulation checks are inconclusive about a mechanism never successfully perturbed.

## 6.4 Awareness and statistical interpretation

Measure sensitivity, false alarms, access reports, experienced intensity and confidence separately. Prestimulus-state findings motivate separating sensitivity from subjective evidence and strategy [23,33-35]. An unchanged sensitivity estimate does not by itself show that experience stayed unchanged; nor do additional “yes” responses prove stronger sensory representation. Sensorimotor prediction can also attenuate self-generated sensation [24], so learned significance need not increase every sensory magnitude.

Retain a calibrated physical intensity grid and catch trials across matched probes. Re-titrating every arm after training to identical performance would remove part of the effect being estimated. Use complementary interval/feature judgments and paired-magnitude comparisons with counterbalanced response mappings. Forced choice and subjective ratings each retain assumptions and possible biases; neither alone certifies consciousness. Changes in the fitted psychometric location and slope should not be given the same interpretation.

Prespecify primary contrasts and minimally important effects. Fit the appropriate participant/trial hierarchy and estimate dependence between pre/post observations. Do not infer exact matching from a nonsignificant difference. Do not select an optimal phase and evaluate it on the same trials. Learning-stage and intervention interactions need held-out confirmation.

Avoid post hoc matching on correct trials or reported awareness as though those were pre-existing covariates: selection on outcomes can distort the relation being studied. A joint response model and experimentally controlled report demands are preferable to unexplained residualization. No-report proxies can constrain reporting alternatives, but do not directly certify an experience.

Sample size must follow defensible reliability and variance estimates, not the number of electrodes or a convenient inherited animal count. Multiplicity, exclusions, phase-jitter sensitivity, dropout, and equivalence criteria require a frozen statistical plan.

## 6.5 Separate retention from expression

Add a delayed matched-input probe after the immediate training state has subsided, and report what is actually controlled rather than assuming a universal washout period. Ask whether the learned relation transfers to a new context or action while the physical feature remains comparable.

A conditional dissociation would be informative: a verified temporary disruption of coordination reduces present expression, but the acquired advantage returns when coordination is restored without retraining. In contrast, changing the learned contingency may produce a persistent revision in later recruitment. These possibilities are predictions of the specified retained-state model, not guarantees about any biological intervention.

The analogy example suggests a complementary human test of receiver history: manipulate prerequisite learning while holding an explanation constant, then measure transfer to a new problem. That would test whether a learned relation became usable, not establish a common cellular code between language and touch. It remains a prospective extension, not an additional result or a substitute for P1-P6.

## 6.6 Fix the estimand and analysis population

An action-contingency effect, a phase-intervention effect, and their relationship to conscious access are separate estimands. Randomized training comparisons should estimate change relative to replay and active controls, while independently randomized probe conditions estimate the timing contribution. The additional joint claim requires their interaction; observing each main effect in a different preparation does not identify that interaction.

For each declared receiver, fit pre/post phase-response functions on the appropriate response scale. Use independent calibration to select reference, lag, and candidate timing windows. Sensory transmission delay matters, and performance-based inclusion changes the analysis population [9]. Primary and sensitivity analyses should expose that dependence, not assume an engaged-trial result automatically generalizes to all trials.

Separate the training randomization unit, biological replication unit, recording unit, and trial. Multiple neurons from one animal are not additional independently assigned animals. Conversely, a group-averaged tuning change cannot establish retuning in each person's receiver. The aggregate counterexample in Section 5.6 makes this a substantive mechanism distinction, not merely a preference for one statistical test.

A candidate inference pipeline compares receiver-level summaries across randomized arms with variance-aware statistics and keeps all prespecified controls. Exchangeability under a sharp no-effect null is stronger than equality of a particular summary. Even pure gain can change the summary's noise distribution. Studentized permutation methods address related weak-null problems under assumptions, but do not automatically provide exact finite-sample guarantees for this assay [30].

The receiver-level inference simulation in Section 7.1 evaluates a two-arm contrast only. The accompanying Acquisition-to-Access Protocol 01 now specifies the third active-control arm, complementary access measures, retention probes and candidate missing-data rules. It is prospective and unregistered; its measurement checks are not simulated biological evidence, calibrated hypothesis tests or a sample-size calculation. Feasible measurement, pilot reliability, specialist ethics review and independent statistical review remain open.

## 6.7 A measurement ambiguity with an explicit proof

For an illustrative equal-variance Gaussian signal-detection model, let standardized internal evidence have mean S d/2 + b and unit variance, where $S=+1$ denotes signal, $S=-1$ denotes no signal, d is separation, b is a common evidence shift, and k is the decision threshold. With $\Phi$ the standard normal cumulative distribution,

\begin{equation}
\begin{aligned}\Pr(\mathrm{yes}\mid S)&=\Phi(Sd/2+b-k),\\ H&=\Phi(d/2-c),\quad F=\Phi(-d/2-c),\quad c=k-b.\end{aligned}\tag{19}
\end{equation}

H and F are population hit and false-alarm probabilities, not noisy sample proportions. This is an observation model, not a literal neural-voltage equation. For interior probabilities,

\begin{equation}
\begin{aligned}d&=\Phi^{-1}(H)-\Phi^{-1}(F),\\ c&=-[\Phi^{-1}(H)+\Phi^{-1}(F)]/2.\end{aligned}\tag{20}
\end{equation}

**Proposition 11.** Under (19), hit and false-alarm probabilities identify d and c, but do not separately identify b and k.

**Proof.** Inverting the two normal probabilities gives $d/2-c$ and $-d/2-c$. Their difference and negative half-sum give (20). For any real h, replacing $(b,k)\ \text{by}\ (b+h,k+h)$ preserves c and hence both response probabilities. Moreover, an increase of b by h at fixed k has the same effect on these probabilities as decreasing k by h at fixed b. Thus a measured criterion change alone cannot distinguish these two mechanisms. This is an elementary model-identifiability result, not a novel psychophysical law.

At d=1 and c=0.5, H=0.5 and F approximately 0.159. Changing c to zero gives H approximately 0.691 and F approximately 0.309, whether it arose through the specified evidence shift or threshold shift. The example demonstrates ambiguity, not which interpretation applies to a person. Unequal variances, non-Gaussian evidence, lapses and heterogeneous participants add further assumptions. Binary probabilities cannot themselves establish subjective experience.

The accompanying 13 deterministic checks verify this algebra, numerical inversion, participant-pooling distortion and planned contrast behavior. They use no participants or random trials. For example, averaging hit/false-alarm probabilities from two equal-weight participants with d values 0.5 and 3.5 yields a pooled d near 1.540, not their mean of 2. Individual variation therefore belongs in a joint hierarchical response model, not only in a pooled inverse-normal calculation. Sample boundary rates of zero or one require a prespecified estimation approach; the demonstration rejects them rather than inserting an unexplained correction.

## 6.8 Preserve both controls and distinguish two learning questions

P1 asks about an acquisition advantage under an appropriate ordinary-control probe: define $G_a=M_{a,\mathrm{post},\mathrm{control}}-M_{a,\mathrm{pre},\mathrm{control}}$, and compare $G_C-G_R$ and $G_C-G_N$ separately. Here M is a prespecified endpoint on a declared scale; sensitivity, perceived magnitude and receiver influence are separate endpoints, not interchangeable units.

P3-P4 additionally ask whether training changes a timing-dependent advantage. For compatible versus disrupted probe timing, define

\begin{equation}
\begin{aligned}L_a={}&[M_{a,\mathrm{post},\mathrm{compatible}}-M_{a,\mathrm{pre},\mathrm{compatible}}]\\ &-[M_{a,\mathrm{post},\mathrm{disrupted}}-M_{a,\mathrm{pre},\mathrm{disrupted}}],\\ \Theta_{CR}={}&L_C-L_R,\qquad\Theta_{CN}=L_C-L_N.\end{aligned}\tag{21}
\end{equation}

This is a pair of training-policy contrasts in pre/post timing effects. A learning gain identical at both timing conditions can support P1 while leaving (21) zero. Conversely, a timing interaction need not reject ordinary gain (Section 5.3), establish phase retuning, or identify mediation through the recorded receiver. Randomizing training and an intervention identifies their assignment effects under the usual assumptions; two such effects do not automatically identify a mediated fraction.

Pooling R and N can conceal failure against one relevant alternative. If $(L_C,L_R,L_N)=(1,1,0)$, C exceeds the pooled control by 0.5 while equaling informative replay. A claim of superiority to both controls requires each declared contrast to support that claim. For one endpoint and prespecified directional margins, an intersection-union test rejects the “not better than at least one control” null only when both valid component tests reject. If that null is true, at least one component null is true, and the probability of rejecting both is bounded by that component's type-I error. This argument needs no independence between contrasts, but it does require valid component tests and does not solve multiplicity across endpoints or selected analyses.

The protocol keeps timing-policy assignment distinct from achieved phase and timeout exclusions, retains valid behavior when only neural recordings fail, and calls for a participant/yoke-set hierarchy. A failed phase intervention cannot refute a mechanism it did not perturb. Pilot feasibility and defensible equivalence margins must precede confirmatory registration. No current numerical check provides those empirical quantities.

# 7. A bounded computational application

The accompanying design calculator implements equations (2)-(6) for explicit constructed responses. Fourteen assertions check identification, mean shifts, gain, retuning, a zero baseline, sign reversal, response-link artifacts, harmonic aliasing, and phase-reference drift. Repeated runs produced identical output.

One counterexample holds the latent binary-response phase coefficients fixed while changing only the intercept. Computing contrasts on raw probabilities suggests a tuning change; using the correct logit scale removes it. Another makes a stable native curve look retuned by shifting the phase reference. These examples expose errors a biological analysis could otherwise make.

This is an executable experimental-design aid, not a trained neural model, an animal experiment, or evidence that the proposed route explains real behavior. The artifact makes one part of the proposed assay inspectable. Section 7.2 adds a trained finite-window receiver comparison, and Section 7.3 adds learned reciprocal reconstruction with an exact direct alternative. These constructions clarify separate functional joins; neither is a qualified biological dataset supporting the declared access estimand.

An eventual sensory-feedback application would seek reliable learned use with bounded stimulation and information costs, rather than maximizing response magnitude. Clinical benefit and artificial consciousness are not established by this design application.

## 7.1 Receiver-level inference application

A second small program tests the aggregate-gain counterexample and the independent-split summary in Section 5.6. It simulates Gaussian coefficient estimates for balanced eight-phase sampling, with heterogeneous preferred phases, amplitudes, and gains. This is a measurement-model stress test, not a network that learns sensory meaning.

Across 128 constructed datasets per condition, the exchangeable null was rejected 6, 9, and 6 times at 16, 32, and 64 units per arm. A gain-only condition with unequal arm distributions was rejected 7 times at each size. These finite checks do not establish universal calibration. For an imposed 15-degree treatment rotation, rejections were 48, 66, and 100; for 30 degrees they were 116, 128, and 128. Monte Carlo intervals and every condition are retained in the companion results.

Those values are conditional sensitivity estimates, not biological power or a recommended sample size. The code assumes independent estimates, a correct first harmonic, fixed error scale, and a controlled reference. It omits binary reporting, temporal dependence, dropout and phase-estimation error. Its useful result is a more demanding analysis contract: preserve receiving units, compare heterogeneous-gain alternatives, use independent estimates, and expose the null under which a reported significance level is justified.

## 7.2 Learned receiving weights: constructive and limiting results

The third application implements equations (11)-(14). Two synthetic environments contain pulses at two fixed bins: either both carry the relevant feature, or one carries an independent distractor. Twelve fixed seeds, 384 training episodes and a separate 256-episode test stream per seed were specified before execution. Fits sharing a seed and environment share data and are not independent replications. All three learners receive the same sensory, context, action-tag and feedback-derived information. The time-bin learner has nine learned parameters, compared with four for the phase receiver and two for integration; this is not a capacity-matched efficiency comparison.

Mean accuracy across constructed instances is shown below. The companion report retains between-seed SD, ranges, every training arm and probe, all acquisition checkpoints and all 216 fitted instances. Seeds are not biological participants, and these values are not biological power estimates.

| Constructed environment | Integrated receiver | Phase-feature receiver | Time-bin receiver |
|---|---:|---:|---:|
| Both pulses informative | 96.78% | 96.55% | 97.88% |
| Timing distinguishes target from distractor | 73.76% | 91.80% | 93.42% |

The phase receiver learns a useful temporal selection: its timing-world mean absolute influence at the informative pulse is 0.743, versus 0.0248 at the distractor. However, the nonoscillatory time-bin learner equals or exceeds its test accuracy on every paired seed. That result agrees with Proposition 6 and prevents this benchmark from being used as evidence for a uniquely oscillatory solution. In the integrated environment, the phase learner has no observed advantage over ordinary integration.

Action-tagged replay produces exactly the same learned weights and decisions as contingent learning. Replay with an independent action tag transfers poorly and sometimes below chance in this small seed set; those adverse values remain reported. The latter comparison destroys an informative relationship and does not demonstrate a necessary role for physical action execution.

In the timing environment, a half-cycle reference misregistration reduces mean accuracy to 49.06% for the phase receiver and 49.64% for the time-bin receiver, while integration is unchanged. Because the input samples are unchanged, this is a causal software-state test; because either temporal representation is affected, it is not specific evidence for an endogenous oscillation. A corresponding sensory-shift probe changes input timing while preserving sample energy and is reported separately.

All weights begin at zero. The acquired temporal selectivity therefore does not establish rotation of an existing phase preference: its baseline direction was undefined. The gain-versus-retuning cautions in Section 5 remain applicable.

Retained weights survive a reset of episode state. Restoring the same receiving configuration and input restores the result exactly by construction. A separate reversal changes the feedback convention and retrains using new noise; the phase timing learner rises from 8.20% under the reversed target before relearning to 91.08% afterward. Its originally learned accuracy was 91.80%. This demonstrates a change in learned interpretation of fixed held-out input within the model, not a biological retention timescale or conscious revaluation.

Disconnecting the downstream decision leaves the learned latent score decodable but reduces actual choices to 50% accuracy. Thus information available to an analyst and information used by the system are distinct in the implementation. History erasure also impairs these receivers, but the benchmark does not establish that every capable architecture must use this particular history mechanism.

The constructive result is an executable learning-to-influence subchain with retained parameters, selective contribution and consequence reversal. Supplied context and references, linear temporal readout and supervised-equivalent feedback do not constitute the full recurrent construction of meaningful experience. The next application adds a limited learned reconstruction model; linking these functions to endogenous timing, independent tasks and biological access remains open.

## 7.3 Reciprocal reconstruction and an additional observation

Application 04 uses twelve fixed constructed instances, each with 512 complete training episodes and 128 held-out tests. Three Gaussian causes generate eight noisy cue coordinates and a consequence score. Training estimates their joint moments directly from complete vectors; it does not execute an action/reward training loop. At test, two noisy cues are initially available. The remaining content is inferred through equations (15)-(17). A binary action follows the sign of the estimated consequence. The greedy and random sampling conditions then acquire one additional cue each, never the hidden consequence.

The protocol, constants, seeds and trace selection were specified before execution. Two post-result amendments are separately documented: an added marginal-preserving block control, and a common-coordinate reconstruction measure. Earlier code, results and endpoints remain available and reproduce. No performance-dependent parameter tuning was performed.

All conditions share test instances. Values below are equally weighted means over twelve seeds, not independent biological groups. Common cue error uses the same six initially unobserved coordinates in every condition, including any subsequently sampled coordinate. The companion report provides seed-level values, SD, ranges, every endpoint, confidence counts and numerical diagnostics.

| Condition | Decision accuracy | Consequence MSE | Common six-cue MSE |
|---|---:|---:|---:|
| reciprocal | 77.41% | 0.7540 | 0.6562 |
| direct | 77.41% | 0.7540 | 0.6562 |
| block_lesion | 65.69% | 1.2062 | 0.9130 |
| marginal_block_control | 69.73% | 0.9966 | 0.8013 |
| shuffled_target | 58.33% | 1.4729 | 0.6562 |
| reused_observations_x4 | 77.21% | 0.7856 | 0.6707 |
| greedy_extra | 83.72% | 0.4287 | 0.4686 |
| random_extra | 79.69% | 0.5935 | 0.4629 |

The reciprocal model converges in every evaluated inference. The exact direct solver produces the same binary decisions on all initial two-cue tests. Its maximum state difference from iterative inference across all evaluated conditions is 1.3720e-6. The comparison establishes an executable reconstruction, but not the necessity of recurrent realization for this map.

Greedy sampling lowers consequence MSE relative to random sampling in every paired seed. Its accuracy improves by 4.04 percentage points on average, with paired differences ranging from -1.56 to +10.94 points. It does not win every accuracy comparison. It also has slightly worse common six-cue reconstruction error than random sampling. Useful sampling for a consequence is not equivalent to globally maximizing detail or accuracy across every represented variable.

Shuffling learned cue-consequence relations damages consequence prediction while leaving cue reconstruction effectively unchanged. This distinguishes learned task use from generic reconstruction fidelity. Seed-specific consequence offsets permit class imbalance, so a shuffled learner is not guaranteed to achieve exactly 50%.

The initial block lesion removed cross-group precision entries. Its unexpectedly narrow uncertainty prompted a mathematical audit: a principal precision block's inverse is a conditional covariance, not the original marginal covariance. Therefore this lesion changes uncertainty as well as interaction. The added marginal-block control instead removes cross-group covariance while preserving both within-group marginal covariance matrices. Its worse average performance supports the importance of the constructed associations under this cleaner control. Neither intervention identifies a biological feedback pathway.

Repeating identical measurements four times as if independent contracts predicted variance without adding evidence. Consequence MSE and log loss worsen, but Brier score improves slightly; no claim that all calibration metrics deteriorate is justified. The high-confidence error fraction rises from 7/377 to 20/557, both below 10%. That threshold alone does not demonstrate empirical overconfidence. The error is unjustified precision relative to the correctly conditioned model.

This construction supplies learned content reconstruction and downstream use, including an additional observation. It does not establish biological reciprocal recruitment (P5), conscious access (P4), or a PWD mechanism. The coordinates and Gaussian family are supplied, covariance learning and uncertainty calculation are global, and the sampling policy is value-independent given a mask. Independent generators, raw representation learning, temporal-reference generation and physiological interventions remain prospective tests. Positive functioning and these limits belong to the same result.

# Reference key

Numbered citations use the bibliography in the [main manuscript](Learning-to-Feel-v1.1.pdf). The retained technical text preserves the original section and proposition numbering for reproducible comparison.

\clearpage
\begingroup\setlength{\parskip}{2pt plus 1pt minus 1pt}
\makeatletter
\renewcommand\subsection{\@startsection{subsection}{2}{\z@}{-1.5ex\@plus-.2ex\@minus-.2ex}{.7ex\@plus.2ex}{\normalfont\large\bfseries}}
\makeatother
\hypertarget{appendix-a}{}
# Appendix A. Acquisition-to-access protocol: source-methods amendment 01

7 October 2026. Prospective amendment to [protocol 01 (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-1), motivated by [primary-methods review 02 (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-11). No study has begun, no preregistration is claimed, and no original protocol text is overwritten. The original three-arm acquisition, information-preserving replay, receiver definitions, separate control contrasts, missing-data policies and six predictions remain operative. This is not a fifth computational application or a new consciousness result.

## 1. Name what awareness means in each claim

Keep four variables separate: presence of a sensation; identity of its diagnostic feature; knowledge of the action/cue/consequence mapping; and knowledge of any hidden delivery attribute. Record which, if any, must be unavailable during acquisition for a particular hypothesis. The main study of acquired tactile meaning does not require an unconscious participant or an unseen/unfelt training cue.

If a subsidiary claim requires lack of feature or contingency awareness, specify both the subjective question and an objective discrimination appropriate to that claim. A retrospective questionnaire can inform that analysis but cannot reconstruct every training trial. Missing reports are not automatically unaware trials. A failure to reject chance is not evidence of equivalence to chance: prespecify a scientifically meaningful bound and an interval or model-based assessment sensitive enough to address it. Report uncertainty at the participant level and respect the yoking hierarchy.

Awareness probes can themselves direct attention, disclose a hypothesis or teach a distinction. Choose sparse probes, independent calibration or a separate validation cohort during pilot design; report the resulting inference limit. A separate cohort's awareness result does not establish every main participant's state. Do not retrospectively discard participants or training trials because their reports favor one interpretation; any exclusion policy must precede outcomes and preserve an assignment-based sensitivity analysis.

## 2. Keep the reward-free endpoint separate from expression context

For the primary acquisition contrast in protocol 01, define an immediate and a delayed probe block with no feature-contingent reward or correctness feedback. Preserve ordinary compensation, fixed physical stimulus grids and all valid behavioral observations. Specify the interval, task, instructions and outcome before recruitment. A result here measures retained performance under this probe condition, not absence of every possible motivational influence.

Add a distinct, secondary context-expression comparison if feasibility permits. Select two perceptually balanced context cues before acquisition and counterbalance which is associated with the learned relationship. Both contexts must occur in calibration/baseline so their sensory differences can be estimated. After acquisition, compare their effects on a short, prespecified probe window **before any new differential feedback is delivered**. The context must not disclose the correct feature or current target. Actual promised incentives and instructions must be ethically accurate; no deceptive reward promise is authorized by this design.

The unit of context allocation and order must be fixed after piloting. Use randomized first-block context assignment for a clean first-window comparison where feasible; later crossover and reinstatement probes are secondary because the first block can change expectations or learning. Record block order, trial count, outcomes received, extinction exposure and fatigue. Analyze history-dependent carryover explicitly. Merely counterbalancing an A-B-A sequence does not remove it.

Do not restore the original contingent reinforcement, allow several new rewarded trials, and then call recovery proof of retained learning. That intervention permits reacquisition. If a separate reacquisition phase is included, name it separately and compare its learning curve with the prespecified alternatives. Even recovery before new feedback is not uniquely diagnostic of a dormant neural trace: retrieval, expectation, strategy and nonspecific state changes remain candidates.

## 3. Estimands and ordering of claims

Retain protocol 01's separate C-versus-R and C-versus-N contrasts. Let G(a,z) be the participant-standardized post-minus-baseline change for arm a under declared context z, for a single specified endpoint. Report these separately for sensitivity, effective criterion, subjective magnitude, access and receiver influence. The existing primary acquisition contrast uses the reward-free probe condition. For a secondary context interaction, define J(a)=G(a,trained-context)-G(a,comparison-context), then compare J(C)-J(R) and J(C)-J(N). This difference-in-differences is a contrast definition, not a theorem that context assignment isolates retained learning.

Freeze the endpoint, analysis window, standardization and multiplicity family before confirmatory outcomes. Include actual delivered context and feedback histories. A context randomization estimates that policy's effect under its design assumptions; it does not identify the fraction mediated by stored learning, motivation or a neural quantity. Do not adjust away post-assignment engagement in the primary total-effect analysis. A separate sensitivity analysis can address prespecified alternative pathways without being mislabeled the same estimand.

Do not cross every new context condition with every timing condition merely to increase the design's size. The original reward-free acquisition and learning-by-timing tests remain primary. Pilot measurement reliability and burden first; a context study can be a sequential, separately powered follow-up. No participant number is supplied here.

## 4. Interpretation rules fixed before outcomes

| Observation | Supported next inference | Not identified by that observation |
|---|---|---|
| Benefit during rewarded acquisition only | Acquisition performance is context-dependent | Durable reward-independent learning; erasure when reward ends |
| Feature-specific delayed reward-free benefit | A learned performance change is retained under that probe | Its cellular storage location; phase-specific causation; conscious access without an access assay |
| Benefit returns in the first context probe before differential feedback | Expression depends on reinstated context; renewed reinforcement is not required for this first-window result | Unique retrieval mechanism; absence of expectancy, strategy, carryover or previous learning |
| Return only after new contingent feedback | Reacquisition or feedback-dependent expression remains viable | Pure restoration of an unchanged stored trace |
| Precise lack of feature-specific benefit in both planned contexts | The stated retention/expression prediction is constrained under tested conditions | Universal impossibility of learning or experience |
| Inconclusive intervals or ineffective manipulation | More evidence or a better assay is needed | Confirmation by absence of a significant contradiction |

Finally, do not protect SAN by declaring every failure an inaccessible trace. Specify in advance the expected context dependence, minimum consequential effect and effective-intervention conditions. A well-powered, verified test that lacks the predicted feature-specific retention or recovery must count against that specified mechanism. Conversely, a learned access benefit without selective timing dependence can support the broader learned-recruitment account while weakening its phase-specific version.

All interventions remain prospective and require qualified investigators, full source review, feasibility testing, independent statistics and ethics approval. The amendment changes what the hypothesis must survive; it does not certify that it has survived it.


\clearpage
\endgroup
\hypertarget{appendix-b}{}
# Appendix B. Acquisition-to-access amendment 02: timing intervention specificity

7 October 2026. Prospective design refinement for Learning to Feel. Read with [protocol 01 (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-1) and [amendment 01](Learning-to-Feel-Technical-Supplement-v1.1.pdf#appendix-a); both predecessors remain unchanged. This is not an executed study, preregistration, stimulation recipe, dose recommendation or evidence of biological feasibility.

## The mechanistic fork

The source-methods basis is recorded in [review 03 (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-12). Here I distinguish three questions:

- Can one event create a receiving window that changes a later contribution's effect?
- Does coordinating repeated events add an explanatory or functional benefit beyond that window?
- Does a learned change in the specified relation alter access under the prespecified perceptual assay?

These are not synonyms. A stable phase-dependent benefit can reflect recovery after an event without establishing a necessary repeating carrier. Conversely, an isolated-event account must actually predict the compared outcome, not be asserted to explain any timing result. The stronger SAN phase-specific proposal must face both alternatives while the broader learned-recruitment claim remains separately testable.

## Primary randomized comparison remains an assigned policy

Keep the three acquisition roles and both distinct control contrasts in protocol 01. Assign a probe policy before eligibility is assessed and before the sensory response. Freeze the eligibility rule, candidate reference, timing targets, maximum wait, invalid-signal rule and timeout handling from independent calibration. The primary population is all assigned probe trials, not only successfully stimulated bursts. A timeout need not lose an otherwise valid behavioral observation.

Use the same pre-intervention eligibility algorithm across phase-targeted policies. “Same rule” does not mean the actual neural state is identical. Learning may change burst availability, waiting times or achievable phases. In particular, an eligibility measure taken before the probe intervention can still be **post-acquisition**. Conditioning a contingent-versus-replay learning contrast on eligibility can select different populations; it is not an unqualified total effect of acquisition.

Eligible-event analyses can be useful secondary contrasts for a declared state and randomized probe policy. State their target population and do not substitute them for the primary acquisition-by-policy contrast. If additional within-burst randomization is used, define that as a separate nested experiment rather than quietly changing the assignment rule.

## What the controls preserve

| Proposed control | What it addresses | What it does not establish |
|---|---|---|
| Independently calibrated compatible versus alternative phase policies, with one eligibility rule | Dependence on assigned timing relative to the declared receiver reference | Equal delivered phase accuracy, waiting time, exposure or post-intervention state |
| Phase-randomized policy within the same eligible-episode definition | A phase-specific advantage beyond the eligibility gate | Exact equality of all delays or realized burst populations |
| Fixed or replayed pulse schedule outside live phase tracking | Consequences of current state tracking versus a comparable input history | Equivalent contemporaneous receiving state |
| Sham/appropriate apparatus control | Non-neural cues, artifacts and procedure effects to the extent the sham reproduces them | Selectivity of the active neural perturbation |
| Isolated-event and repeated-event comparisons | Whether repeated organization adds to the immediately relevant receiving event | Equal dose between one event and many |
| Regular and irregular repeated histories with matched declared pulse budgets | An effect beyond gross event count or total delivered energy | Identical recovery, waveform, spectrum or neural state |

These are candidate contrasts to prioritize after feasibility review, not instructions to multiply every factor into one unaffordable experiment. First establish attainable measurement and a defensible matched-policy comparison. Add the event-history contrast only if the chosen preparation can support it.

For the repeated-history comparison, fix the immediate test event and its receiver-arrival relationship as closely as the apparatus allows, while changing earlier organization. Record residual differences rather than claiming a perfect isolation of periodicity. An irregular train changes inter-event intervals and therefore recovery; this is part of the competing mechanistic explanation, not a nuisance guaranteed removable by regression.

## Closed-loop feedback changes the exposure problem

A stimulation event can alter the activity that triggers the next event. Preserving a rule, maximum pulse budget or mean rate does not guarantee equal realized exposure. Log eligibility, attempted and delivered events, intervals, cumulative input, signal quality and timeouts. Report their joint distributions, not only their averages.

Use a capped single-event policy as a candidate diagnostic when feasible; its result identifies the effect of that policy, not the function of a whole continuing rhythm. For repeated stimulation, prespecify whether the estimand concerns the complete adaptive policy or a constrained input-history comparison.

Do not select a “matched” subset after observing treatment-induced pulse counts, power, burst length or behavior and call it randomized. Such variables can be consequences of treatment. The primary assigned-policy comparison stays intact; descriptive balance, independently justified equivalence margins and explicitly assumption-dependent secondary analyses supplement it. A nonsignificant rate difference is not proof that every relevant receiver state is matched. No arbitrary equivalence bound is set from a synthetic model.

## Receiver-arrival and actuator checks

Calibrate the full path from timing estimate through delivery to the receiver consequence. Retain the measured latency distribution and phase error, not just a nominal command time. Independent calibration must establish that an oscillatory reference is measurable over the intended window; a narrow-band trace alone is not a physiological oscillator certificate. The preferred target must not be selected from the same confirmatory outcomes used to test benefit.

For a circuit preparation, the actuator and native tissue can each have history-dependent responses. Separate artifacts and actuator recovery from the proposed native receiving mechanism; avoid deriving a prestimulus reference from a contaminated poststimulus signal. For human recordings, no selective dendritic intervention is assumed. The preparatory study must show what can actually be manipulated and measured before a causal claim is planned.

Record source activity, reference quality, receiver response and the system's later use separately. Equivalent local mean firing would not prove equal patterned recruitment. Conversely, a phase-preferred aggregate can change when differently tuned units are reweighted; the existing receiver-level supplement retains that distinction.

## Interpretation and prespecified failure

- A matched single event reproducing the repeated-history benefit within justified precision weakens the claim that repeated organization is necessary for that endpoint.
- An additional history-sensitive effect supports the tested temporal organization only to the extent that dose, recovery, state and other alternatives are addressed. It is not by itself a proof of phase-mediated consciousness.
- A benefit shared by phase-targeted and same-gate phase-randomized policies, with adequate precision, weakens the claim of a privileged phase and favors gating or another shared feature.
- A policy effect explained by changed waiting time or exposure is still a real policy effect, but does not identify a phase-only neural route.
- Preservation of the learned advantage after a verified, selective perturbation challenges the proposed mechanism. Failed delivery or an unreliable reference leaves that test inconclusive, not supportive.
- Receiver changes without the specified access outcomes do not complete P4. A human report effect without receiver-specific evidence does not complete P2/P3.

All six manuscript predictions are unchanged. Their interpretation is now more discriminating. The primary learning contrasts, reward-free probes, awareness-object distinctions and context-expression failure rules remain in force. No numerical power claim, new model benchmark, biological result, book edit or release is created by this amendment.


\clearpage
\hypertarget{appendix-c}{}
# Appendix C. Acquisition-to-access amendment 03: feedback, retained reception and present expression

7 October 2026. Prospective Learning to Feel extension, not a registered or executed study, medical advice, a drug/stimulation procedure or a biological result. Read with [protocol 01 (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-1), [amendment 01](Learning-to-Feel-Technical-Supplement-v1.1.pdf#appendix-a), [amendment 02](Learning-to-Feel-Technical-Supplement-v1.1.pdf#appendix-b) and [source review 04 (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-13). Those predecessors remain unchanged.

## The positive mechanism to test

I propose that returned task consequences can change which learned relations a later sensory contribution recruits. That requires separating the outcome response now, any retained receiving change, and the conditions under which the change is expressed later. An immediate response to feedback is not automatically its own storage mechanism.

The existing three-arm acquisition study, six predictions, reward-free retention probes and assigned timing-policy analysis remain primary and unchanged. The following is a **separate, limited feedback-credit follow-up**, initially using one standardized acquisition history. It is not an instruction to cross every new factor with all existing factors. Adding differential reinforcement to informative replay could change the information it preserves; such an integrated design would need its own pilot, yoking specification and frozen analysis.

## Minimal causal comparison

1. Fix an index judgment and its technical-validity rule before data collection. The index is not retrospectively chosen because it had favorable neural activity or was followed by success.
2. Give all participants the same disclosed bonus probabilities before that judgment and retain guaranteed ordinary compensation. Correctness feedback remains truthful and is separate from the bonus. Do not misrepresent a wrong answer as correct to manipulate value.
3. Define eligibility E before the bonus randomization: for example, a technically valid, correct index judgment. Randomize high versus low bonus within E=1 only after the response. Choose amounts and disclosure in specialist/ethics review, not from this manuscript.
4. Keep the subsequent probe input grid, timing policy and incentive schedule fixed across bonus assignments. Announce that probe accuracy produces no differential bonus. Preserve the first prespecified probe window and a delayed reward-free probe; do not add corrective feedback that silently retrains the mapping.
5. Counterbalance the presentation of the bonus and record sensory, motor, pupil/arousal and expectancy measures where feasible. This limits competing explanations; it does not make high and low outcomes psychologically or neurally identical.
6. Retain every randomized eligible participant for the assigned-bonus analysis and all valid prespecified probe outcomes, not only correct or reported-aware probes. Technical loss of neural data need not discard valid behavior. Report exclusions and missingness separately.

This does not assume every participant can enter E=1, or that eligibility is unaffected by prior training. It identifies an effect in the declared eligible population. Comparing such selected populations across acquisition arms would not identify the full contingent-versus-replay learning effect. Participants outside E=1 retain their ordinary treatment and are described without inventing a bonus assignment.

A single declared index event avoids interpreting many adaptively selected rewards as independent assignments. A future repeated-randomization design would require its own time-varying estimand, dependence model and carryover analysis.

## Conditional effect and an identification check

For a prespecified endpoint M, let M(high) and M(low) denote its potential outcomes under the two bonus policies. The target is

\[\Delta_M=\mathbb E[M(\mathrm{high})-M(\mathrm{low})\mid E=1].\]

Within E=1, randomized assignment with positive probabilities identifies this contrast from the difference of assigned-group means, assuming consistency, no cross-participant interference and an appropriate observation/missing-data model. The argument is conditional exchangeability from that new randomization, not independence of the earlier acquisition state. Analyze receiver response, perceived magnitude, detection, confidence and report endpoints separately. The effect of a disclosed bonus policy need not be the effect of a particular neural mediator.

Why is this needed? Consider an illustrative two-state system with equally likely persistent states H and L. Conditional on state, successive correct judgments are independent, with probabilities 0.8 and 0.2. Let a reward simply mark a correct first judgment and have **no causal effect**. Then

\[\begin{aligned}\Pr(\mathrm{next\ correct}\mid\mathrm{rewarded})&=\frac{0.8^2+0.2^2}{0.8+0.2}=0.68,\\\Pr(\mathrm{next\ correct}\mid\mathrm{not\ rewarded})&=\frac{0.8\cdot0.2+0.2\cdot0.8}{0.2+0.8}=0.32.\end{aligned}\]

The 0.36 conditional difference arises entirely from the persisting state. This is an elementary counterexample, not an estimate of bias in a published experiment. If the new bonus is randomized among eligible correct index judgments in this example, the state mixture is the same across bonus groups and both have next-trial success probability 0.68. Their expected bonus effect is zero, as constructed.

The manuscript's original 21 numbered equations and eleven propositions remain unchanged. These conditional identities are an added design illustration, not a new application benchmark, power analysis or claim of a novel probability theorem.

## Trace the proposed transition

| Pattern under adequate measurement | Interpretation for this extension |
|---|---|
| Immediate response to feedback without a later feature-specific effect | Outcome processing or current state change; no demonstrated retained receiving change |
| Specific advantage at matched immediate and delayed reward-free probes | Evidence consistent with retained influence; generic motivation, strategy and other alternatives still require comparison |
| Reward-free null with prespecified feature-specific recovery before renewed differential feedback | Context-dependent expression candidate, with order and expectation controls; not proof that every null hides a trace |
| Verified receiving-window perturbation changes expression and restoration recovers it | Supports a current receiving contribution to the tested endpoint; does not itself locate the original learning |
| Receiver change without the specified access or appearance effect | Functional processing result, not completion of P4 |
| Altered reports without the declared receiver relation | Leaves the proposed neural route unresolved |

A feedback-window intervention and a later receiving-window intervention answer different questions. If feasible, a separately randomized, adequately selective feedback-window intervention could test whether the returned contribution affects later learning; a receiving-window intervention tests its current use. Neither a failed delivery nor nonspecific impairment establishes the claimed dissociation. No human method is assumed to isolate a dendritic compartment.

The key retained-change claim would be constrained by adequately precise failure of the declared later specificity or recovery, not rescued by an unspecified invisible memory. A later benefit that is independent of the proposed timing relationship would favor a broader learned-recruitment explanation over the phase-specific version. Felt magnitude, discrimination and conscious access remain distinct even if several improve together.

## Gates before implementation

Independent calibration must determine the apparatus tolerances, bonus comprehension, endpoint reliability, justified effect-size target, delay and feasible recording/intervention. Sample size and multiplicity decisions need specialist statistical review. Ethics, consent and qualified investigators precede biological implementation. A neural mediation claim would need additional identification assumptions and intervention specificity; randomized bonus assignment alone does not supply them.

This extension sharpens the feedback and retention links of P5/P6 and their possible connection to P2-P4. It does not change those predictions after results, add evidence of a conscious artificial system, or authorize drug administration, recruitment, publication or Book 2 edits.


\clearpage
\hypertarget{appendix-d}{}
# Appendix D. Acquisition-to-access amendment 04: where feedback specificity resides

7 October 2026. Prospective clarification of [amendment 03](Learning-to-Feel-Technical-Supplement-v1.1.pdf#appendix-c), not a new biological experiment, preregistration or fifth computational application. The primary three-arm study and P1-P6 remain unchanged. This clarification stays within the separate feedback-credit follow-up; it does not cross every factor with the primary study.

## The positive SAN connection

I propose that a returned consequence changes a later sensation partly through the receiving organization left by earlier activity. The returned signal need not reproduce the full content to which credit is assigned. The receiver's history can supply specificity that is absent from the common signal. This makes three different things worth measuring: the arriving feedback, the receiving state that makes a relation modifiable, and the retained change expressed on a later encounter.

Activity-dependent eligibility and reward-modulated plasticity are existing mechanisms, not proposed SAN inventions. [Source review 05 (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-14) gives the biological and imaging comparisons. The further SAN proposal concerns their connection to recurrent, phase-dependent sensory use and access. An eligibility result alone would not establish that connection, a voltage-to-emotion identity, or experience.

Here **local synaptic eligibility** means a transient readiness for modification. It is not the participant/trial eligibility $E=1$ used to define the randomized population in amendment 03. Nor is it a retained memory, an oscillatory phase, a decision threshold or conscious access. Different timescales require measured bridges rather than interchangeable names.

## A conditional factorization, not a new theorem or mechanism

A deliberately simplified three-factor expression is

\[\begin{aligned}\Delta w_i&=\eta\,m\,e_i,\\\Delta w_i-\Delta w_j&=\eta\,m\,(e_i-e_j).\end{aligned}\]

$w_i$ is a declared connection parameter, $m$ a shared outcome-related modulation, $e_i$ a local activity-history factor at outcome time, and $\eta$ a scale factor. These are model variables, not measured molecules. The second identity follows by subtraction. Unequal local factors can produce unequal changes under the same modulation. In this restricted model an unchanged zero factor gives no update; a zero common factor gives no update; and equal local factors give equal updates. The factorization is sufficient for this example, not necessary for credit assignment, and omits other plasticity processes.

Two important nonidentifiabilities follow. If only the final update is observed, multiplying $m$ by any nonzero constant and dividing every $e_i$ by that constant preserves the update. A unit-specific feedback model can also reproduce the same update vector. Thus, observing specific retained change does not uniquely locate the specificity in the feedback or receiver. Independent measurements and adequately selective interventions are needed. No sign of this parameter change is identified with emotional valence or a membrane voltage sign.

The tiny deterministic check in [the Draft 10 validator (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-31) checks only these identities and a constructed contrast. It is not a fitted neural simulation, a new benchmark, statistical power or empirical confirmation. The original 21 numbered equations and eleven propositions are unchanged.

## A direct specificity contrast within the existing follow-up

Keep the disclosed randomized high/low bonus, truthful correctness feedback and pre-bonus eligibility from amendment 03. Select the credited cue $C$ and a matched credit-irrelevant comparison cue $U$ before outcomes; counterbalance their identities. Define their acquisition histories and why $U$ is a meaningful control, rather than treating an untrained cue as automatically interchangeable with a trained one. Bonus assignment remains after the declared index judgment. Everyone assigned a bonus receives the same prespecified reward-free probe schedule.

For one prespecified endpoint on a common scale, define a participant-level cue-specific change under bonus policy `b`:

\[\begin{aligned}D_i(b)={}&[Y_{i,C,\mathrm{post}}(b)-Y_{i,C,\mathrm{pre}}]\\&-[Y_{i,U,\mathrm{post}}(b)-Y_{i,U,\mathrm{pre}}],\\\theta={}&\mathbb E[D_i(\mathrm{high})-D_i(\mathrm{low})\mid E=1].\end{aligned}\]

The immediate and delayed windows are different prespecified endpoints. Use independent calibration/held-out data to define cue contrasts and neural regions; do not select the most favorable cue, voxel, phase or interval after seeing bonus effects. Preserve all assigned eligible participants and valid outcomes. Missing neural data must not silently remove valid behavior.

Randomized assignment within $E=1$ identifies $\theta$ by the assigned-group mean difference in `D`, under consistency, positive assignment probability, no cross-participant interference, and a justified observation/missingness model. The comparison uses the selected eligible population; it does not restore the total acquisition effect in everyone. Trial observations are not independent participants. Keep receiver response, sensitivity, experienced intensity and access outcomes separate, with their own declared scales, multiplicity policy and uncertainty.

This is an interaction, not two separate significance decisions. For example, high bonus causing a change of 0.3 on both cues and low bonus a change of 0.1 on both gives zero specificity contrast. High-bonus changes of 0.3 on $C$ and 0.1 on $U$, against low-bonus changes of 0.1 on each, give $\theta=0.2$ in that constructed example. These arbitrary units are not expected human effect sizes. A precise zero would constrain this bonus-specific acquisition route; an imprecise estimate would not establish absence.

## What patterns would and would not discriminate

| Observation or intervention | Allowed inference and remaining alternative |
|---|---|
| Broad outcome response followed by cue-specific retained change | Compatible with history-dependent local eligibility; unresolved fine-scale feedback specificity remains possible |
| Cue-specific outcome response | Compatible with targeted feedback, but not sufficient for retained learning or conscious access |
| Same region active for cue and outcome | Regional participation, not identity of the active cells or modified synapses |
| Negative cue/outcome spatial similarity | Not by itself inhibition, erasure, loss of meaning or absence of specific feedback; adaptation and measurement scale matter |
| Selectively altering a measured local eligibility process changes later cue-specific learning while verified feedback delivery and basic sensory function remain comparable | Supports a local credit-assignment contribution in that preparation, not exclusive mediation or human conscious experience |
| Altering the later receiving window changes expression without altering independently assayed retention | Supports an expression mechanism distinct from acquisition; failure to measure retention cannot establish the dissociation |
| Bonus affects access but not the specified receiving relation | Leaves this neural route unestablished; does not turn a reported experience into a nonexistent event |

A selective eligibility intervention is presently a circuit-assay requirement, not an available human method asserted here. Adequacy, off-target effects, cell type and timescale require specialist evaluation. Testing local eligibility and later phase-dependent expression may require different preparations; transporting their relationship to human touch remains a substantive inference.

A delay manipulation alone is not a selective trace intervention: it can change expectation, attention, working memory, intervening activity and the physical feedback schedule. Do not import a seconds-scale slice result as a human tactile delay constant or a gamma period. A null decoding result also cannot establish that no specific feedback exists below the measurement's resolution. Broad-signal and receiver-specific mechanisms can coexist.

## Gate and preservation boundary

This specifies how the feedback follow-up tests specificity, not an enrolled study or a complete statistical analysis plan. Independent reliability, minimally relevant effect, multiplicity, missingness, feasibility, investigator and ethics review remain required. No current measurement establishes the complete path from credit assignment to felt experience. Original P1-P6, all constructed results, adverse alternatives and the positive constitutive SAN hypothesis remain intact. Book 2 and publication surfaces are outside this edit.


\clearpage
\begingroup\setlength{\parskip}{2pt plus 1pt minus 1pt}
\hypertarget{appendix-e}{}
# Appendix E. Joint receiver and behavioral observations: Application 05

This appendix gives the measurement model, fitting procedure and conditional identification results for main Section 7.4. It extends the original technical supplement and Appendices A-D without replacing their arguments, equations or experiments. The construction is synthetic; it neither reproduces a complete external consciousness theory nor identifies a binary response with conscious experience.

## E.1 Acquired relation and supplied perturbation

Application 03's normalized update acquires four phase-feature weights from 384 episodes of its timing task. The teaching signal is supervised-equivalent, as explained in the original supplement. Freeze these weights throughout calibration and testing. For eight input samples, action tag q and signed context kappa, write the supplied-angle readout as

$$
\begin{aligned}
s_\theta(x)=w_0+\kappa q\bigg[&\frac{w_1}{2}\sum_{t=0}^{7}x_t
 +w_2\sum_{t=0}^{7}x_t\cos(2\pi t/8+\theta)\\
 &+w_3\sum_{t=0}^{7}x_t\sin(2\pi t/8+\theta)\bigg],\qquad s=s_0.
\end{aligned}\tag{E1}
$$

The context and action tags are each plus or minus one. Gain perturbation uses the contrast d=(g-1)s; registration perturbation uses d=s_theta-s. The externally supplied registration angle is not a measured endogenous oscillator. Input probes remain the same within the perturbation comparison. New stimulus-amplitude conditions alter the samples separately; they do not establish new semantic-context transfer.

Retained weights and current probe settings have different roles. The first records the acquired mapping in this model; the second changes its current expression. This is not a demonstration that biological memory occupies fixed coefficients, nor does this application retest active acquisition against informative replay. The exact replay equivalence already reported in Application 03 remains.

## E.2 Observation equations and generating cases

Let N be a scalar receiver observation and Y a binary response. The latent receiver mean and response drive are

$$
\begin{aligned}
\mu_N&=s+a d,& \eta&=\beta(s+b d)+\gamma,\\
N&=\mu_N+\sigma\epsilon,& \epsilon&\sim\mathcal N(0,1),\\
Y&\sim\operatorname{Bernoulli}(p),&p&=(1+e^{-\eta})^{-1}.
\end{aligned}\tag{E2}
$$

Receiver recording noise and response draws are conditionally independent given input and latent means. Recording noise therefore does not mediate the response. The generating slope is beta=2.5, intercept gamma=0.2 and recording-noise standard deviation sigma=0.35. These are design constants, not physiological estimates. Receiver offset/scale/noise are assumed known; response slope/intercept are estimated from baseline probes before intervention fitting.

| Generating case | a | b | Declared meaning |
|---|---:|---:|---|
| receiver | 1 | 1 | Receiver change and response drive share the perturbation. |
| policy | 0 | 1 | Recorded receiver mean is unchanged; later readout changes. |
| mixed | 1 | 0.35 | Receiver changes with partial downstream compensation. |
| null | 0 | 0 | Neither endpoint changes with the intervention label. |

The policy alternative can use the full temporal input and intervention label. It is not restricted to reading the measured scalar N. This is a capable bypass assumption, not evidence that a corresponding anatomical bypass exists. Emotional valence, membrane polarity, field energy and signs of these mathematical coefficients are not identified with one another.

## E.3 Calibration, fitted constraints and held-out scoring

Each of twelve seeds first supplies 384 acquisition episodes, followed by 384 separate baseline-calibration probes. Estimate beta and gamma by baseline Bernoulli maximum likelihood using predictors s and a constant. Freeze them thereafter. Intervention calibration uses 192 probes at each supplied level and amplitude multiplier 1. Fit the stage constraints below using the same receiver and response observations.

| Candidate | a | b | Intervention parameters |
|---|---|---|---:|
| receiver-only | alpha | alpha | 1 |
| policy-only | 0 | alpha | 1 |
| mixed | alpha_N | alpha_Y | 2 |

All have the same two baseline-calibration parameters and inherited acquired weights. The mixed candidate has greater capacity; no parameter-matching claim is made. Minimize the summed pointwise joint negative log score

$$
\begin{aligned}
\ell(N,Y\mid x,u)=&\log(\sigma\sqrt{2\pi})
 +\frac{(N-\mu_N)^2}{2\sigma^2}\\
 &+\log(1+e^\eta)-Y\eta.
\end{aligned}\tag{E3}
$$

The implementation evaluates the softplus term stably. Receiver-only fitting is a convex scalar optimization with neural and behavioral terms. Policy-only fitting has a constant neural term and scalar logistic optimization. Mixed fitting separates a least-squares receiver estimate from scalar logistic response fitting. The unconstrained receiver estimate is

$$
\widehat\alpha_N=\frac{\sum_i d_i(N_i-s_i)}{\sum_i d_i^2},
\qquad \sum_i d_i^2>0.\tag{E4}
$$

This is an ordinary least-squares coefficient, not a new learning rule.

Newton optimization uses analytic gradients/Hessians, at most 40 iterations and 20 line-search reductions, and gradient-per-observation tolerance 1e-8. The tiny diagonal addition 1e-12 stabilizes a linear solve rather than changing the objective. Every fit met the declared convergence tolerance. Failure would have been retained rather than triggering an undisclosed methodological change.

Also fit the response data alone. Receiver-only and policy-only then have exactly the same likelihood family. Jointly fitting the neural observation may yield different behavioral predictions, but those differences must not be mistaken for identification from behavior alone.

Calibration gain levels are 1, 0.6, 1.4 and 1.8; test gain levels are 1, 0.8, 1.2, 1.6 and 2. Calibration angles are 0, pi/4, -pi/4 and pi/2; test angles are 0, pi/8, -pi/8, 3pi/8, -3pi/8, pi and -pi/2. Every test level is crossed with amplitude multipliers 0.7 and 1.3 and 256 new probes. Baseline gain 1 and angle 0 are deliberately retained controls, so not every level is unseen; noncontrol levels and both amplitude conditions are held out. Reset is stateless restoration of a supplied setting, not biological recovery.

The same physical input sequence is reused across conditions and candidate generators. Observation noise/report uniforms are independent across distinct conditions but paired across generators. Seeds 101-112 are independent replicates of this synthetic procedure; repeated probes are not independent participants. The exact input seed offsets, noise streams, conditional scores and full results are fixed in the [pre-execution protocol (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-9) and [code](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/joint-receiver-comparison.mjs). No test labels or test outcomes select features, parameters or conditions.

## E.4 Conditional identification propositions

### Proposition E1. An added receiver observation can distinguish behaviorally identical distributions

For fixed s,d,beta,gamma,sigma with positive sigma, compare the receiver and policy generators in E.2. Their conditional distribution of Y is identical. Their conditional means for N differ by d. If d is nonzero, the joint distributions differ and the expected excess negative log score for the incorrect fixed receiver mean is d squared divided by twice sigma squared.

**Proof.** The response probability depends on b, which equals one in both cases. No statistic of responses and these supplied inputs can distinguish their identical conditional response distributions. Expanding the Gaussian squared residuals, the cross term has expectation zero because recording noise is mean zero. Thus only the squared difference of means remains. More generally, for any predicted mean and probability, expected excess score over the true conditional distribution is

$$
\begin{aligned}
\mathbb E[\ell_{\rm model}-\ell_{\rm true}\mid x,u]
 ={}&\frac{(\mu_{\rm model}-\mu_{\rm true})^2}{2\sigma^2}\\
 &+D_{\rm KL}\!\left(\operatorname{Bern}(p_{\rm true})\,|\,
                         \operatorname{Bern}(p_{\rm model})\right).
\end{aligned}\tag{E5}
$$

The Bernoulli term is nonnegative and vanishes for equal probabilities. This establishes the stated distributional distinction. It does not guarantee practical discrimination for an arbitrary finite dataset/noise level, or identify mediation. A fitted incorrect model can compromise between the two endpoints; its score is not obtained simply by substituting the generating coefficient into the fixed-mean special case.

### Proposition E2. Joint measurements cannot separate an exact reparameterization

The supplied-angle readout E1 has a nonoscillatory coefficient representation

$$
\begin{aligned}
K_\theta[t]&=\frac{w_1}{2}+w_2\cos(2\pi t/8+\theta)
                              +w_3\sin(2\pi t/8+\theta),\\
s_\theta(x)&=w_0+\kappa q\sum_{t=0}^{7}K_\theta[t]x_t.
\end{aligned}\tag{E6}
$$

**Proof.** Distribute the weighted sums in E1. This produces E6 for every input, tag, context and supplied angle. The two implementations therefore have identical baseline scores and perturbation contrasts, then identical neural means, response probabilities and fitting objectives in E2-E3. Their effective learned degrees of freedom are inherited from the same four weights. The time-bin coefficients are not an independently fitted eight-parameter learner.

The equality concerns this finite-window representation and its declared interventions. It does not establish equivalence between all physical oscillatory and nonoscillatory networks. It shows that these particular observations/interventions cannot identify their difference. Distinct dynamics, recovery or a selectively interpretable physical intervention would require an additional model.

### Proposition E3. Joint prediction and upstream manipulation do not generally identify mediation

Let U=s+d and M be a receiver state. Both explanations below use M=U and N=M+recording noise. They differ in the route generating the response probability:

$$
\begin{aligned}
M&=U,\qquad N=M+\sigma\epsilon,\\
p_{\rm mediated}&=(1+e^{-(\beta M+\gamma)})^{-1},\\
p_{\rm bypass}&=(1+e^{-(\beta U+\gamma)})^{-1}.
\end{aligned}\tag{E7}
$$

**Proof.** Substitution M=U makes the observational distributions identical, including when an upstream intervention changes d. Under an ideal intervention replacing M while keeping U fixed, however,

$$
\begin{aligned}
p_{\rm mediated}\mid\operatorname{do}(M=m^*)&=(1+e^{-(\beta m^*+\gamma)})^{-1},\\
p_{\rm bypass}\mid\operatorname{do}(M=m^*)&=(1+e^{-(\beta U+\gamma)})^{-1}.
\end{aligned}\tag{E8}
$$

For nonzero beta and m* different from U, strict monotonicity of the logistic link makes the probabilities different. Hence observational equality, even with the stated upstream manipulation, does not identify this mediation claim. Recording noise is not the mediator. This is an explicit counterexample, not a claim that the bypass exists in the intended biological preparation. A real selective intervention must justify its target and exclusion assumptions, including effects on parallel routes, state and measurement.

## E.5 Results, uncertainties and negative controls

All 288 fits and condition-level outcomes were retained. Joint negative log scores, averaged equally across twelve seeds, are reproduced in main Section 7.4. The correct restricted model beat the opposite restricted model on every paired seed in both receiver-only and policy-only generators. The paired policy-minus-receiver differences are:

| Perturbation | Generating case | Mean | Monte Carlo SE | Minimum | Maximum |
|---|---|---:|---:|---:|---:|
| Gain | receiver | 1.118682 | 0.033374 | 0.855747 | 1.230551 |
| Gain | policy | -0.017819 | 0.001310 | -0.025656 | -0.011111 |
| Gain | mixed | 1.110867 | 0.033928 | 0.839893 | 1.230683 |
| Gain | null | 0.000422 | 0.000827 | -0.003258 | 0.007838 |
| Registration | receiver | 1.786583 | 0.077114 | 1.074789 | 1.989787 |
| Registration | policy | -0.179748 | 0.008333 | -0.219396 | -0.124032 |
| Registration | mixed | 1.709189 | 0.075337 | 1.018191 | 1.910346 |
| Registration | null | 0.001215 | 0.001009 | -0.005373 | 0.007550 |

The Monte Carlo standard error is the seed sample standard deviation divided by the square root of twelve. This describes a finite collection of generated training/calibration/test replicates, not biological sample-size planning or a significance/equivalence test. The known sigma and observation scale determine the weighting of the neural endpoint and are not free claims about attainable experimental measurement.

Receiver and policy generators had exactly matching response probabilities and paired binary outcomes. Behavior-only fitted parameters were also identical. The largest phase/time-bin discrepancy in any aggregate metric was 1.11e-15; the largest underlying score/contrast discrepancy was 1.78e-15. These support the algebraic equivalence of the implementations, not an independent biological result.

For mixed generation, receiver-only minus mixed mean score was 0.007026 for gain, with Monte Carlo SE 0.001272 and range -0.000366 to 0.015501. Registration gave 0.076562, SE 0.004304, range 0.054224 to 0.093849. The gain result therefore favored receiver-only on one seed. Mixed did not always improve on correctly restricted models, and neither restricted model has a universal advantage in the null generator.

Coefficient recovery is finite-sample and imperfect. Mixed registration's mean fitted response coefficient was 0.288449 rather than its generating 0.35. Baseline slope/intercept uncertainty propagates into stage fitting, but is not integrated out in the plug-in predictive score. Every coefficient and seed-level result remains available. No post-result parameter change or favorable condition selection was used.

Expected excess scores use E5 conditional on the finite test inputs and fitted parameters. They integrate over fresh observation noise/response draws, not uncertainty in the fitted parameters. Realized scores use the actual held-out draws. Report both rather than converting one into a claim about biological predictive accuracy. Receiver mean prediction, receiver density, response probability and classification accuracy are distinct endpoints.

## E.6 Interpretation and reproducibility

This application makes a bounded constructive point: a calibrated receiver observation can add information to an otherwise ambiguous behavioral comparison. It also preserves a stronger alternative with partial compensation, an exact nonoscillatory representation and a mediation counterexample. These are conditions for testing the proposed connection, not a replacement for SAN's wider account of meaningful recurrent participation or its constitutive hypothesis.

An empirical study must supply an independently calibrated receiver measure, defensible observation/intervention mappings, appropriate hierarchy and complementary access measures. Generating cases are selected constructions, not an exhaustive mechanism census. Unmeasured alternative paths, uncertainty in measurement scale/noise and nonstationarity could change the conclusions. Recurrent reconstruction, affective significance and conscious access have not been implemented here.

The [complete result artifact](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/joint-receiver-comparison-results.json) contains all fits, condition scores, paired contrasts, optimization diagnostics and pre-execution source bindings. The [code](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/joint-receiver-comparison.mjs) uses only Node built-ins and the unchanged Application 03 module. Its replay mode checks exact experiment-object equality without overwriting results. Fifteen computational checks and a separate ten-check producing-agent readback passed; they do not substitute for independent mathematical, statistical or scientific review.



\clearpage
\endgroup
\begingroup\setlength{\parskip}{2pt plus 1pt minus 1pt}
\hypertarget{appendix-f}{}
# Appendix F. Calibration, receiving change and causal interpretation

This appendix expands Application 05's known-observation assumption. It is a post-result mathematical sensitivity analysis, not a sixth application, fitted biological model or retrospective alteration of the frozen experiment. Its coefficients and bounds have the synthetic score's units; none is estimated from a biological recording. The original conditional results in Appendix E remain valid within their declared observation model.

## F.1 What an additional neural measurement must distinguish

A receiving population can genuinely change while an instrument also changes how it records that population. These are different causal locations. Consider one deliberately restricted nuisance: an additive recording component aligned with the tested perturbation contrast. With the same supplied baseline s and contrast d as Appendix E, write

$$
\begin{aligned}
M&=s+a d, &N&=M+h d+\sigma\epsilon,\\
Y&\sim\operatorname{Bernoulli}\!\left((1+e^{-\beta(s+b d)-\gamma})^{-1}\right),
&\epsilon&\sim\mathcal N(0,1),\quad\sigma>0.
\end{aligned}\tag{F1}
$$

Here a changes the latent receiving quantity, h changes its recording, and b changes the response drive. Recording noise and response draws remain conditionally independent. These are mathematical locations, not identified biological pathways. The observation mean depends on tau=a+h. A genuine learning-related change in recruited cells, inhibition or timing belongs in the biological model; it must not be relabeled measurement error to remove the effect of interest.

### Proposition F1. Perturbation-aligned recording changes can preserve the entire joint distribution

For any real t, replacing (a,h) by (a+t,h-t), with all other quantities fixed, preserves the conditional distribution of (N,Y) for every supplied input and perturbation.

**Proof.** Their sum and therefore N's mean and variance are unchanged. Y depends on b, not on the split between a and h. Conditional independence gives the same joint distribution. In particular, (a,h,b)=(1,0,1) and (0,1,1) cannot be distinguished by these observations, even with held-out perturbation levels. At a control where d=0, the nuisance is invisible. Baseline calibration alone therefore cannot exclude this explicitly perturbation-aligned component. This is an identifiability example, not evidence that any particular recording contains that artifact.

## F.2 Calibration can give a useful partial answer

### Proposition F2. A justified nuisance bound yields a sharp receiving-change interval

Suppose the observation model holds, tau is identified by informative probes, and independent calibration justifies an applicable bound |h|<=H. Then

$$
\mathcal A(\tau,H)=[\tau-H,\tau+H].\tag{F2}
$$

**Proof.** Since a=tau-h, every admissible h gives an a in this interval; conversely every a in the interval corresponds to an admissible h. Thus the interval is sharp within this model. If tau-H>0, the receiving coefficient is positive for every allowed nuisance. This establishes neither mediation nor experience.

If [L,U] covers tau with probability at least 1-alpha and a possibly random calibration bound H covers |h| with probability at least 1-eta, then

$$
\Pr\{a\in[L-H,U+H]\}\ \geq\ 1-\alpha-\eta.\tag{F3}
$$

**Proof.** On the intersection of the two coverage events, interval containment follows from F2. The union bound gives the stated probability without requiring independent datasets. Actual coverage of either input is an assumption, not supplied by this algebra. A calibration dataset's independence does not by itself establish that its bound transports to learning, stimulation and recording conditions in the target study. No confidence interval or nuisance bound has been fitted here.

For example, tau=0.6 and H=0.2 imply a between 0.4 and 0.8; H=0.8 no longer excludes zero. These are explanatory numbers, not physiological thresholds. If separate arms have different nuisance components, their difference needs its own bound. A common component cancels only if its equality across the compared arms and measurements is justified.

## F.3 When two constrained receiving explanations remain separable

### Proposition F3. Worst-case separation depends on the calibration budget

Compare fixed coefficients a0 and a1 with the same b and known positive sigma. Allow a separate h in [-H,H] under each explanation. At a fixed probe with contrast d, the smallest conditional joint KL divergence is

$$
\inf_{|h_0|,|h_1|\leq H}
D_{\rm KL}(P_0\,\|\,P_1)
=\frac{d^2}{2\sigma^2}
\left[\max\{0,|a_1-a_0|-2H\}\right]^2.\tag{F4}
$$

**Proof.** The Bernoulli laws are identical. The Gaussian KL is the squared mean difference divided by twice sigma squared. The two admissible effective-coefficient intervals each have radius H; their smallest distance is max(0,|a1-a0|-2H), attained at their closest points. Multiplication by d gives the mean distance. For nonzero d, the two composite observation families are separated exactly when |a1-a0|>2H. Otherwise they overlap, not necessarily coincide. This is a distributional bound, not finite-sample power or a guarantee that a fitted model wins.

Changing recording units by N'=cN+k, for nonzero c, while transforming the predicted means and sigma to the same units leaves this Gaussian KL unchanged. An unknown, condition-dependent observation change is different from a correctly applied fixed unit conversion. Lowering a declared noise value without calibration can artificially increase apparent separation; sigma is not a free evidentiary weight.

## F.4 Consequences for the proposed test

Declare which recorded quantity measures the receiving operation, its scale, reference, reliability and plausible condition-dependent contamination. Use preparation-appropriate independent calibration and negative controls to constrain recording changes during the actual perturbation, not merely before it. A second readout adds useful evidence only to the extent that its error structure is separately justified; two channels sharing the same contaminant need not resolve the ambiguity.

Keep genuine treatment-induced receiving changes in the primary biological effect. Do not regress them away as an instrument correction. Where nuisance bounds are unavailable or fail to transport, report the observed joint effect and its remaining interpretations. Where justified bounds exclude the recording-only account, the measurement supports receiving change at the declared endpoint. A further selective intervention and downstream-use test remain necessary for the mediation claim in Appendix E.

The [small deterministic checks (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-23) test these identities and constructed boundary cases, not experimental calibration or statistical coverage. The [saved checks (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-24) do not alter the 288 original fits, seeds, numerical results, acquisition controls, source evidence or constitutive SAN hypothesis.



\clearpage
\endgroup
\hypertarget{appendix-g}{}
# Appendix G. Calibration feasibility and phase-delivery uncertainty


**Draft 23 integration note:** This is the complete, unchanged-content pre-integration methods annex, with four declared display-math transcriptions. Its references to Draft 17, a future insertion and the frozen older ZIP record its earlier status; they are not current routing. The current main incorporates that distinction and lists M1-M3 as references 50-52. No empirical calibration bounds, biological result or additional fitted application have been added.

Learning to Feel: post-packet methods annex, 8 October 2026. Producing-agent research and mathematical review, not independent approval. Read alongside Draft 17 Section 6.2 and Appendices E-F. This annex is **outside the frozen Draft 17 R1 ZIP**; its manuscript, PDFs, 49-reference list, five applications and seven earlier computational outputs are unchanged. No experiment, recruitment, stimulation, empirical calibration or upload was performed.

## Finding and consequence

Draft 17 correctly makes receiving-change identification conditional on an observation model and applicable calibration. A separate issue remains on the input side: intended timing is not necessarily achieved physiological phase. A training-by-assigned-phase interaction can change when phase delivery becomes more accurate, even if the underlying response-versus-true-phase function does not change. The interaction remains a potentially real effect of the assigned scheduling policy; it does not uniquely identify stronger intrinsic phase-sensitive reception.

This is not a reason to discard the positive SAN proposal. Learning might change phase-sensitive recruitment, oscillator organization, its accessibility to a controller, or more than one of these. Those possibilities concern different mechanisms within the proposed learning-to-significance-to-recruitment chain. A careful experiment should preserve genuine learned changes while identifying which operation changed. A scalp estimator becoming more reliable is not, on its own, evidence that the brain became more coherently organized.

Appendix F's additive recording term does not already solve phase-delivery error or off-target neural responses. Its conditional proofs remain valid; their experimental reach must not be extended without additional assumptions.

## Primary-methods evidence and exact review scope

The following are local annex source labels, **not new manuscript reference numbers**. No third-party article or dataset is bundled here. The PMC landing pages for M1/M2 returned a browser-security check on this pass; they were not retried. Institution-hosted primary PDFs supplied the selected text. Figure screenshot attempts did not yield inspectable pixels in this session (Gordon requests timed out); figure captions are not counted as visual review. No raw-data, source-code or supplement audit was performed.

### M1: phase estimation has a measurement boundary

Zrenner C, Galevska D, Nieminen JO, Baur D, Stefanou MI, Ziemann U (2020), *The shaky ground truth of real-time phase estimation*, NeuroImage 214:116761. [DOI](https://doi.org/10.1016/j.neuroimage.2020.116761), [institutional primary PDF](https://acris.aalto.fi/ws/portalfiles/portal/42216767/Zrenner_The_Shaky_Ground.1_s2.0_S1053811920302482_main.pdf).

Selected primary Methods 2.1-2.10, Results 3.1-3.4 and Discussion 4.1-4.2 text were inspected, with figure captions, not complete figure pixels. The study screened recordings from 140 people, analyzed 132 eligible datasets, and used a separate single-person motor-response illustration. Phase estimation depended on signal-to-noise ratio and momentary amplitude. Agreement among estimators did not guarantee accuracy against known synthetic phase. An offline physiological estimate was a benchmark, not an independently known latent phase. This supports assessing timing fidelity separately; it does not show learning-induced fidelity changes in the proposed touch study. Its sample and illustrative power calculation are not this study's enrollment plan.

### M2: a useful control can still change the biological system

Gordon PC, Jovellar DB, Song YF, Zrenner C, Belardinelli P, Siebner HR, Ziemann U (2021), *Recording brain responses to TMS of primary motor cortex by EEG - utility of an optimized sham procedure*, NeuroImage 245:118708. [DOI](https://doi.org/10.1016/j.neuroimage.2021.118708), [institutional primary PDF](https://iris.unitn.it/retrieve/handle/11572/325772/512900/Gordon_NI_2021.pdf).

The abstract, selected Methods, Figure 4/5 captions and Discussion 4.1-4.4 text were inspected. In 23 participants, matched sensory controls helped distinguish responses to subthreshold motor-cortex stimulation. The authors explicitly qualified linear subtraction: sensory inputs can interact with cortical responses, matching perception need not establish identical neural responses, and an early recording interval was unavailable. They restricted transfer to other targets and intensities. This supports preparation-specific controls, not a universal artifact-free receiving measure. TMS is a methodological comparison here, not a newly selected intervention for Learning to Feel.

### M3: sensory co-stimulation is neural activity, not merely amplifier error

Conde V et al. (2019), *The non-transcranial TMS-evoked potential is an inherent source of ambiguity in TMS-EEG studies*, NeuroImage 185:300-312. [Primary abstract](https://pubmed.ncbi.nlm.nih.gov/30347282/), [DOI](https://doi.org/10.1016/j.neuroimage.2018.10.052).

Only the primary abstract was inspected. In 17 participants, realistic multisensory sham responses resembled early and late real-stimulation potentials despite masking precautions. This motivates separating direct circuit activation from sensory pathways; it supplies no numerical bound on the present manuscript's recording nuisance and no direct result about conscious tactile learning.

## A conditional phase-delivery calculation

This is an elementary circular-averaging sensitivity calculation, not a claim of mathematical novelty, a fitted sixth application, or a physiological law. It addresses conditional means; it does **not** assert equality of complete observation distributions.

Let `u` be the assigned target phase relative to a declared reference, and let the actually reached phase be `phi = u + epsilon` modulo a full cycle. In one arm/session, assume:

- A declared endpoint has conditional mean `m(phi) = mu + kappa cos(phi - psi)`, with `kappa >= 0`.
- `mu`, `kappa` and preferred phase `psi` do not vary with the assignment except through `phi`. Timing-dependent waiting, history, amplitude or sensory differences are not hidden inside this assumption.
- The phase-error distribution is the same at every target `u` in that arm/session; it need not be symmetric. Its first circular moment is `z = E[exp(i epsilon)]`.
- Residual endpoint noise has zero conditional mean. The response is not assumed to be a conscious report or a particular membrane variable.

### C1. Delivered-phase averaging changes both magnitude and apparent preferred phase

By taking the expectation of the complex representation of the cosine,

\begin{equation}\mathbb E[m\mid u]=\mu+\kappa\operatorname{Re}\{\exp[i(u-\psi)]z\}.\tag{G1}\end{equation}

Writing `z = q exp(i b)` gives an assigned-phase harmonic amplitude `A = kappa q` and apparent preferred phase `psi - b`. For opposite targets `u` and `u + pi`,

\begin{equation}D(u)=2\kappa\operatorname{Re}\{\exp[i(u-\psi)]z\}.\tag{G2}\end{equation}

These identities follow by linearity of expectation and `cos(v + pi) = -cos(v)`. A change of error concentration or bias can therefore change an opposed-phase contrast without changing `kappa`. Conversely, a real receiving change can be obscured by worse delivery.

Constructed example: take `kappa = 1`, `psi = 0` and equally likely errors `+acos(q)` and `-acos(q)`. Increasing `q` from 0.5 to 0.9 raises `D(0)` from 1 to 1.8 with no receiving-amplitude change. The same assigned-phase mean curves arise if `q` stays 0.5 while `kappa` increases from 1 to 1.8. A multi-phase mean curve alone does not separate these two cases. Their higher moments or joint observations need not agree.

If only contingent arm C improves delivery in that way while informative replay R and active noncontingent N retain `q = 0.5`, the protocol's C-minus-R and C-minus-N learning-by-timing contrasts both become 0.8. That does not refute the randomized policy effect or prove that learning did nothing. It demonstrates that the conjunction alone does not locate the mechanism at increased intrinsic receiving modulation.

Concentration alone is also insufficient: a bias of a quarter-cycle can reduce a fixed opposed-phase contrast to zero even when `q` and `kappa` remain positive. Estimate or bound the complex error moment, not just unsigned accuracy. Re-estimating the best phase from confirmatory outcomes would introduce another selection problem.

### C2. Independently justified delivery bounds can identify a narrower conclusion

Under C1's assumptions, suppose `A` is the nonnegative amplitude of the assigned-phase mean curve and independent evidence justifies `0 < q_low <= q <= q_high <= 1`. Then

\begin{equation}\kappa\in[A/q_{\mathrm{high}},\,A/q_{\mathrm{low}}].\tag{G3}\end{equation}

The interval is sharp: choose any permitted `q` and set `kappa = A/q`; a symmetric two-point error law can attain any such `q`. If the mean-curve amplitude is instead covered by a simultaneous nonnegative interval `[L,U]`, the conditional bound becomes `[L/q_high, U/q_low]`. No input confidence coverage is established here.

A sufficient conditional criterion for increased modulation from pre to post is

\begin{equation}\frac{L_{\mathrm{post}}}{q_{\mathrm{high,post}}}-\frac{U_{\mathrm{pre}}}{q_{\mathrm{low,pre}}}>0.\tag{G4}\end{equation}

Both amplitude and delivery bounds must be jointly applicable across sessions; separate nominal intervals are not automatically a simultaneous confidence statement. If `q_low = 0`, there is generally no finite upper bound. At `q = 0`, the first-harmonic mean contains no information about `kappa`. Do not divide by a nearly zero estimate and call the result calibrated.

The bounds do not establish that an EEG-derived phase equals the local receiving phase in SAN, that a change mediates behavior, or that the endpoint measures experience. An offline estimator, even one that agrees with the online estimator, does not itself justify a biological `q_low`.

### Where the calculation stops

If errors depend on the target, baseline state covaries with waiting, or the relevant response includes higher harmonics, C1's one-moment formula is insufficient. A targeted implementation must check those conditions. Better targeting may arise from instrument improvement, altered oscillation amplitude, source mixtures or genuinely reorganized activity; those explanations are not interchangeable. Appendix F's `h` acts on an output recording, whereas this annex's `epsilon` acts on delivered/assigned phase. Combining them requires a joint model rather than renaming one nuisance as the other.

The [deterministic check (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-25) evaluates the identities and explicit adverse cases. Its [saved results (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-26) contain no participant data, noise calibration, power or effect-size estimate. They do not alter the earlier 288 fits.

## Preparation-specific additions to the prospective test

The following are proposed refinements to Protocol 01 and the Draft 17 review agenda, not an already registered study or authorization to use stimulation equipment. A qualified investigator and statistical reviewer must choose and assess the actual preparation.

| Component | Evidence needed before a mechanistic claim | Limit that remains |
|---|---|---|
| Instrument and delivered tactile input | A bench test with known signals, logged actual input, latency and drift across the intended session range; declared handling of saturation and missing windows. | A phantom or electronic injection does not reproduce biological state or validate a neural phase reference. |
| Phase estimator | Frozen pre-event-only estimator; latency measured against delivery; held-out no-event windows for benchmark uncertainty; error/bias diagnostics across arms, sessions, amplitude and task state. | Physiological latent phase is not known merely because two filters agree. Simulated truth checks the estimator under that simulator. |
| Scheduling policy | Randomize the intended target policy; retain timeouts and failure-to-deliver; log waiting time, prior events, target and available pre-event signals. Preserve valid behavior when a neural channel fails. | A policy contrast includes its sampling and waiting consequences. Achieved-phase conditioning is not the original randomization. |
| Neural endpoint | Declare the receiving population, reference, lag, units and endpoint before outcomes; assess acquisition and expression separately. | A larger signal or source label is not identified downstream influence. |
| Sensory and biological control effects | If an additional neural perturbation is chosen, assess its auditory, tactile, motor and state effects in that preparation; measure matching rather than infer it from a nonsignificant difference. | Real neural activity from a control is not electronic noise. Additive subtraction can fail when pathways interact. |
| Transport | Test whether calibration remains applicable after training and at delayed retention, with eligibility rules fixed beforehand. | Familiarity or retained learning can change the measured system; pretraining-only calibration does not prove invariance. |

Preserve two estimands. **Primary:** the total effect of randomized acquisition and scheduling policy, retaining assigned units and the protocol's separate C-versus-R and C-versus-N comparisons. **Secondary mechanistic:** receiving modulation under an explicitly comparable delivered-phase/reference distribution. The latter requires a justified measurement model, adequate overlap and a statistical identification argument; it is not recovered just by discarding low-amplitude, inaccurate or unaware trials.

Do not force equal post-training oscillation amplitudes by excluding data and then call that the full learning effect. Increased amplitude, coherence or recruitability could be part of the hypothesis. Report the total assignment effect and the narrower calibration sensitivity side by side. A null intrinsic-modulation result with improved delivery supports a different route than a positive calibrated intrinsic change; both deserve retention.

No numerical `H` from Appendix F or `q` bound from C2 is currently justified for the intended study. The reviewed methods demonstrate relevant problems and possible controls, not a transferable calibration certificate. Lowering synthetic noise, choosing an arbitrary bound or importing a motor-cortex threshold would not close this gate.

## Proposed insertion at the next substantive manuscript revision

The following text is ready for scientific/author review; it is not silently inserted into the frozen PDF:

> Intended timing, achieved physiological phase and the recorded receiving response require separate calibration. A larger training-by-assigned-phase contrast may reflect stronger phase-sensitive reception, improved delivery to the relevant phase, or both. The primary randomized scheduling-policy effect should be retained, while mechanistic attribution requires a declared reference, preparation-specific phase uncertainty and transport across training and retention. Recording contamination must also be distinguished from genuine neural responses induced by sensory controls. These distinctions preserve learning-induced organization as a possible causal mechanism while preventing a change in experimental access to that organization from being mistaken for the organization itself.

## Disposition and next gate

This pass strengthens feasibility and interpretation, not biological confirmation or novelty. Keep Draft 17, its PDFs and its portable packet frozen for review; circulate this annex only if separately authorized. Include C1/C2, the distinction between control-induced biology and recording error, and the lack of empirical bounds in the next independent methods/statistics review. Author readback, source gaps, investigator/site, feasibility and ethics gates remain open. No other paper, Book 2, Atlas, provider or public site was changed.



\clearpage
\hypertarget{appendix-h}{}
# Appendix H. Relative phase, directed influence and access measurements

The following elementary constructions distinguish three observation problems in the proposed acquisition-to-access experiment. They are not fitted neural models, new biological results, or proofs of experience. They supplement the learning and calibration analyses without replacing their observation assumptions. All phases are relative to a declared reference and are understood modulo a full cycle.

## H1. Relational organization is not individual event locking

At one declared frequency and event-relative time, let the nonzero complex coefficients for two measured populations have phases \(\phi_{A,k}\) and \(\phi_{B,k}\) on trial \(k\). Let \(a_{A,k}\) be the first coefficient's magnitude. Initially assume perfectly observed coefficients. Define

\begin{equation}
\begin{aligned}
I_A&=\left|\frac{1}{N}\sum_{k=1}^{N}e^{i\phi_{A,k}}\right|,\qquad
I_B=\left|\frac{1}{N}\sum_{k=1}^{N}e^{i\phi_{B,k}}\right|,\\
C_{AB}&=\left|\frac{1}{N}\sum_{k=1}^{N}e^{i(\phi_{A,k}-\phi_{B,k})}\right|,\qquad
G_A=\frac{1}{N}\sum_{k=1}^{N}a_{A,k}^{2}.
\end{aligned}\tag{H1}
\end{equation}

The first two quantities measure phase consistency across stimulus-aligned trials at each site; the third measures consistency of their phase difference across those trials. They are dimensionless. The last quantity has squared coefficient units: it is not automatically metabolic energy, emotional valence, meaning or experienced intensity. These definitions do not turn an event-relative estimate into a continuous-time or directed-coupling measurement.

**Proposition H1.** A shared, trial-specific phase rotation preserves the between-site statistic but need not preserve either individual statistic. Moreover, the individual marginal phase distributions and magnitudes do not determine the between-site statistic.

**Proof.** Adding \(\theta_k\) to both phases cancels in their difference, so every term defining \(C_{AB}\) remains unchanged. It need not cancel in either individual circular mean. For the second statement, use four trials, unit magnitudes and

\begin{equation}
u\in\{0,\pi/2,\pi,3\pi/2\},\qquad
\delta=\pi/3,\qquad \phi_A=u.
\tag{H2}
\end{equation}

First set \(\phi_B=u+\delta\). The four unit roots sum to zero, giving \(I_A=I_B=0\), while each phase difference is \(-\delta\), giving \(C_{AB}=1\). Next set \(\phi_B=-u+\delta\). Its marginal phase set is the same modulo a full cycle, but the relative phasors cancel in pairs, giving \(C_{AB}=0\). The magnitudes remain one. Finally, rotating the first construction by \(\theta=-u\) gives \(I_A=I_B=C_{AB}=1\). This proves both claims. Positive rescaling of a coefficient changes its squared magnitude without changing either phase statistic under perfect observation.

For SAN, this provides a precise reason to test relations rather than equating their organization with local activity or alignment to an external clock. It does not show that a biological recipient uses the relation. Finite-sample bias, nonstationarity, filtering, common signals and uncertain phases require separate treatment; the earlier calibration analyses remain relevant. Trial count and usable-signal selection must not differ silently across the compared conditions.

## H2. Observational coordination does not identify the direction of use

Consider two idealized structural models with the same four-valued exogenous \(U\), uniformly distributed over the set in H2, the same \(\delta\), and a downstream dimensionless response \(Y=\cos\phi_B\):

\begin{equation}
\begin{array}{ll}
\text{Shared drive:}&\phi_A=U,\quad\phi_B=U+\delta;\\
\text{Directed route:}&\phi_A=U,\quad\phi_B=\phi_A+\delta.
\end{array}\tag{H3}
\end{equation}

**Proposition H2.** The models have identical joint observations of the two phases and output, including perfect relative consistency at a nonzero phase offset, but different ideal controlled effects of the first phase on the output.

**Proof.** Substitution of \(\phi_A=U\) gives the same observed \(\phi_B\) and \(Y\) in both models. Define an ideal intervention that replaces only the equation for \(\phi_A\), retaining the other equations and exogenous distribution. Setting that phase to zero versus \(\pi\) leaves the shared-drive output unchanged. In the directed model the corresponding mean-output contrast is

\begin{equation}
\mathbb E[Y\mid\operatorname{do}(\phi_A=0)]-
\mathbb E[Y\mid\operatorname{do}(\phi_A=\pi)]
=2\cos\delta=1.
\tag{H4}
\end{equation}

Thus, a nonzero phase offset alone does not remove the common-drive explanation. The construction establishes nonidentifiability under this observation scheme, not absence of directed neural influence. Its ideal intervention is an assumption, not a claim that a physiological manipulation can alter one phase while leaving every other receiving condition intact. A real test must establish the relevant selectivity and observation mapping. Perturbation artifacts and bypass routes remain possible until appropriately controlled.

This distinction preserves the positive proposal: the important relationship is one that changes the system's own subsequent operation. Synchronization supplies a candidate observation; controlled downstream consequence supplies a different evidentiary requirement. A verified access change would still need the separate access assay and its alternatives.

## H3. A block report does not identify every trial's access

Let \(Z\) be a binary access label under a declared assay, \(p=\Pr(Z=1)\), and \(M\) a neural measurement in arbitrary declared units. With finite conditional means, the law of total expectation gives

\begin{equation}
\mathbb E[M]=p\mu_1+(1-p)\mu_0,\qquad
\mu_j=\mathbb E[M\mid Z=j].
\tag{H5}
\end{equation}

**Proposition H3.** Observing only a block neural mean and a perfectly accurate indication that at least one event was noticed does not identify either the event prevalence or the access-conditioned neural means.

**Proof.** In a four-event block, one event labelled accessible with measurement four and three events labelled inaccessible with measurement zero give \((p,\mu_1,\mu_0)=(1/4,4,0)\). Two accessible events with measurement two and two inaccessible events with measurement zero give \((1/2,2,0)\). Both blocks have a mean of one and an affirmative ever-noticed answer. Their prevalences and accessible-event means differ. These observations therefore do not identify those quantities.

The counterexample concerns the specified aggregate observation scheme. Additional observations or independently justified assumptions can add information; it does not claim that every richer trial-level dataset has the same ambiguity. The label is an operational assay result, not a derivation of phenomenology. Retrospective reports remain informative at their declared scale, while memory and report reliability require their own model.

The experiment should consequently declare whether it estimates trial-level access, block-level occurrence, reported magnitude, discrimination or later use. Sparse queries can change task set and expectancy. Reduced-report conditions cannot be interpreted as complete trial-wise awareness records merely by removing the overt response. Where labels are missing, use the stated aggregate endpoint or a justified sensitivity model instead of treating each block as uniformly aware or unaware.

## H4. Connecting the distinctions to the experiment

The proposed P2-P4 test should name the frequency, reference, averaging axis, recipient and downstream endpoint before confirmatory outcomes. State whether an effect concerns individual event locking, between-site phase relations or a validated intervention response. Preserve the prespecified metric after an adverse result rather than replacing it with whichever quantity changes most.

Vary task relevance and report demands separately where feasible; absence of an immediate motor response does not make a stimulus irrelevant to a decision. Report baseline responses and stimulus contrasts separately and test their interactions directly. Do not define the primary randomized learning effect only among trials subsequently reported as aware or correct. Validated timing-dependent downstream change and its relationship to the declared access outcome would strengthen the proposed connection; selection, retention or reporting alone would establish a more restricted operation.

The [deterministic implementation](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/access-metric-check.mjs) and [saved outputs](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/analysis/access-metric-results.json) check nine explicit constructions associated with these results. They are algebra fixtures, not a sixth application, a biological calibration, or independent review. The neural studies motivating the metric distinctions are main references 12 and 14; the present propositions are elementary analyses, not results attributed to those authors. The [main manuscript](Learning-to-Feel-v1.1.pdf) retains the full learned-recruitment argument and SAN's further constitutive hypothesis.



\clearpage
\hypertarget{appendix-i}{}
# Appendix I. Allocation, delivered events and incomplete observations

This appendix refines the prospective acquisition-to-access experiment. It supplies three elementary design results, not another learned application, a biological result or a proof of experience. The five applications, their saved outcomes and Appendices A-H retain their original scope. The examples concern policy interpretation and measurement; they do not deny that learning can change a receiver's consequential relations.

## I1. A yoking contrast concerns the complete allocation policy

In the three-arm design, the participant assigned active contingent training generates an input stream used by the replay and active noncontingent participants. Random assignment of roles remains useful, but changing the generator can change other participants' exposure. A yoke-set hierarchy accounts for dependence; it does not by itself turn this allocation into a direct effect of executing an action with everyone's input held fixed.

Let \(\mathbf R\) denote the complete role allocation in a set, \(k(\mathbf R)\) its generator, \(X_k\) the generated stream, and \(Y_j(\mathbf R)\) participant \(j\)'s outcome. A policy contrast averages over the prespecified random allocation:

\begin{equation}
\tau_{CR}^{\rm role}
=\mathbb E_{\mathbf R}\!\left[
Y_{j_C(\mathbf R)}(\mathbf R)-Y_{j_R(\mathbf R)}(\mathbf R)
\right].\tag{I1}
\end{equation}

This defines the within-set contrast for this allocation regime. Estimation and uncertainty still require the actual set-sampling and randomization design. It is distinct from a controlled own-role contrast at a fixed stream and fixed assignments of other people. The corresponding C-versus-N policy contrast must also be reported.

**Proposition I1. A positive role-policy contrast need not identify a direct benefit of action execution at fixed exposure.** Consider a pool of \(n\geq3\) participants with dimensionless prior profiles \(t_j\). Choose the generator uniformly and the comparison participant uniformly from the remaining participants. Let the generated stream index be \(X_k=t_k\), and let every participant's post-minus-baseline response be \(Y_j=t_jX_k\), irrespective of their own role once \(X_k\) is fixed. Then

\begin{equation}
\tau_{CR}^{\rm role}
=\frac{n}{n-1}\left[
\frac{1}{n}\sum_j t_j^2-\left(\frac{1}{n}\sum_jt_j\right)^2
\right]\geq0.\tag{I2}
\end{equation}

**Proof.** The generator's mean response is \(n^{-1}\sum_jt_j^2\). The comparison mean is \(\{(\sum_jt_j)^2-\sum_jt_j^2\}/\{n(n-1)\}\). Subtraction yields I2. There is no own-role term in the stipulated fixed-stream response. Thus nonzero profile variation can produce a positive allocation contrast through generator-response congruence alone. With three profiles \((1,2,3)\), the generator mean is \(14/3\), and each uniformly assigned control role's mean is \(11/3\); both contrasts equal one. These arbitrary score units are not expected human effects.

The construction is a counterexample to a mechanism attribution, not to the validity of the randomized policy effect. It does not claim that this mechanism occurs in the proposed tactile preparation. It explains why information matching and recording prior receiving history matter even when all members receive the generator's stream. Adjusting for the realized stream after assignment does not automatically recover a direct effect: its variation is produced by the allocation, and adequate overlap and causal assumptions must be justified.

For the primary study, prespecify the complete allocation, generation and replay rules and estimate the two role-policy contrasts at the yoke-set level or with an equivalent valid design. If a separate action-execution claim is sought, a companion design could freeze streams from independent calibration and then randomize exposure/role with adequate input matching. That companion addresses a different question and must retain agency, proprioception and receiver-state limits. It does not silently replace the contingent-learning study or add a fourth arm.

## I2. Timing delivery and sensory presentation are separate events

For every assigned probe, distinguish the assigned timing policy, actual tactile presentation, actual intervention delivery, usable neural recording and available behavioral response. A timing timeout is not an intentional catch trial, and a valid tactile response can survive a failed neural recording. The protocol must state whether a timeout leaves the tactile probe intact, presents it under a fallback schedule, or aborts it.

**Proposition I2. Changing presentation availability can create both learning-by-timing contrasts with unchanged responses to a delivered stimulus.** Suppose an illustrative assigned signal trial presents its tactile event with probability \(p\). The probability of a positive response is \(h\) when it is presented and \(f\) when it is absent, with both probabilities fixed across acquisition arms, sessions and timing policies. The all-assigned positive-response endpoint is

\begin{equation}
M(p)=p h+(1-p)f=f+p(h-f).\tag{I3}
\end{equation}

**Proof.** Condition on whether the tactile event was actually presented and apply total expectation. With \(h=0.8\), \(f=0.2\) and presentation probability 0.5 at every baseline cell, all baseline means are 0.5. If only the contingent arm's post-training compatible policy raises presentation probability to 0.9, that mean becomes 0.74. All other cells retain 0.5. Consequently,

\begin{equation}
\Theta_{CR}=\Theta_{CN}=0.24,\tag{I4}
\end{equation}

although the conditional response to the same delivered event remains 0.8 and the absent-event response remains 0.2. This example varies presentation availability, not physiological phase error or intrinsic receiving modulation. It therefore addresses a different ambiguity from Appendix G.

The positive policy effect in this example is real, but its endpoint is a response under an availability-changing policy. Calling it an improvement in detection of physically matched tactile events would be incorrect. Keeping only successful deliveries would introduce a different selection-sensitive comparison. Counting an aborted trial as an ordinary miss or catch without naming that endpoint would also conceal the changed assay.

A feasible implementation should retain the scheduled tactile stimulus and behavioral assay after a timing failure when the preparation permits this, using a prespecified fallback with logged force, waveform, timing and history. Actual presentation then remains distinct from whether the timing intervention succeeded. The all-assigned effect still includes intervention failure, fallback and waiting consequences; it is not automatically a phase-only effect. If the stimulus must be aborted, report availability and the prespecified policy-level composite separately from the sensory endpoint. A detected false alarm requires an intentional, delivered catch condition, not an unknown apparatus state.

These rules preserve the primary assigned-policy comparison. They do not authorize dropping failed deliveries, forcing a post-treatment match, or treating a neural failure as loss of otherwise valid behavior. Calibration must determine the attainable implementation before a biological study is registered.

## I3. Retaining assignments does not fill missing measurements

For a cell containing \(N\) assigned observations of a binary endpoint, suppose \(R>0\) responses are observed, their positive count is \(v\), and \(N-R\) responses are missing. Set \(p=R/N\) and \(r=v/R\). No assumption about missing responses is made.

**Proposition I3. The finite-cell endpoint mean and a linear contrast have sharp completion bounds.** The complete assigned-cell mean lies in

\begin{equation}
[L,U]=[p r,\ p r+1-p]=[v/N,\ (v+N-R)/N].\tag{I5}
\end{equation}

For a linear contrast \(T=\sum_c w_c M_c\), using these bounds separately in each cell gives

\begin{equation}
\begin{aligned}
T_{\min}&=\sum_{w_c>0}w_cL_c+\sum_{w_c<0}w_cU_c,\\
T_{\max}&=\sum_{w_c>0}w_cU_c+\sum_{w_c<0}w_cL_c.
\end{aligned}\tag{I6}
\end{equation}

**Proof.** A missing binary response contributes either zero or one to the full count. Setting them all to zero or all to one attains the I5 endpoints. The linear contrast is minimized by choosing each cell's endpoint according to its weight's sign, and maximized by the reverse choices. These endpoints are attainable when missing completions are otherwise unrestricted across cells. The bounds concern the realized finite assigned-cell means, not a confidence interval for a population effect. Randomization, sampling, hierarchy and additional cross-cell restrictions require their own analysis.

For a concrete eight-cell C-versus-R learning-by-timing contrast, let each cell contain ten assigned observations, nine observed. Let the C-post-compatible cell have five observed positive responses and the other seven cells have four each. The complete-case contrast is \(1/9\). I6 instead permits an assigned-cell contrast from -0.3 to 0.5. Exhaustively enumerating the 256 possible completions of the eight missing binary responses attains both limits. This is a constructed example, not a prediction of attrition or a biological effect size.

If behavior is fully observed and only a neural channel fails, behavior has no such recording-loss bound and should retain its complete outcome. Neural and access endpoints require their own availability records. For a bounded nonbinary endpoint, analogous bounds require a justified outcome range; they do not apply unchanged to unbounded voltage, log odds, sensitivity or an unbounded intensity scale. A physiological failure is not automatically a zero neural response.

The proposed analysis should report assignment, presentation, delivery, recording and response counts by the prespecified arm, session and policy. Freeze reasons and handling rules before confirmatory outcomes; distinguish no learning, no current expression, failed presentation and unobserved response. Uncertain intervals or missing observations do not establish equivalence. Sensitivity analysis or partial bounds can expose what remains identifiable while keeping the main policy effect and the narrower mechanism claim separate.

\enlargethispage{2\baselineskip}

## Checking and use

The [review implementation (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-32) checks I1 by exact enumeration of role assignments, I2 by exact rational mixtures, and I3 by exhaustive binary completions. It also checks selected earlier mathematical identities using independently written calculations. These are software and algebra checks, not new fits, statistical coverage or independent scientific review. The [main manuscript](Learning-to-Feel-v1.1.pdf) connects these refinements to the existing three-arm study and six predictions.



\clearpage
\hypertarget{appendix-j}{}
# Appendix J. Inference equivalence, reference and learning parameters

This appendix makes three conditional comparisons concrete. The existing reconstruction function can be shared by different inference descriptions; a latent neural-variable label needs a reference and measurement mapping; and the mean of a learned likelihood does not determine its learning or exploration properties. These elementary results refine comparison and calibration. They add no learned application, biological result or derivation of experience. Main reference 46 supplies the active-inference formulation being compared; the results below are independent calculations rather than claims attributed to its authors.

## J1. A shared Gaussian reconstruction function

Use the dimensionless feature coordinates of Application 04. Let the retained prior be Gaussian, with positive-definite covariance \(\Sigma\). A declared observation matrix \(S\) selects or linearly measures coordinates, with independent Gaussian noise having positive-definite covariance \(R\). Write

\begin{equation}
\begin{aligned}
z&\sim\mathcal N(\mu,\Sigma),\qquad o=Sz+\xi,\quad\xi\sim\mathcal N(0,R),\\
r&=o-S\mu,\quad\delta=z-\mu,\\
H&=\Sigma^{-1}+S^{\mathsf T}R^{-1}S,\qquad
b=S^{\mathsf T}R^{-1}r.
\end{aligned}\tag{J1}
\end{equation}

The retained prior, observation matrix, noise and observed values are fixed during inference. For a Gaussian approximation \(q(\delta)=\mathcal N(m,V)\), \(V\) positive definite, variational free energy is the expectation of log approximate density minus log joint density. Expanding the normalized densities gives

\begin{equation}
F[q]=K+\frac12m^{\mathsf T}Hm-b^{\mathsf T}m
       +\frac12\operatorname{tr}(HV)-\frac12\ln\det V.
\tag{J2}
\end{equation}

Here \(K\) does not depend on \(m\) or \(V\). All densities use one fixed reference measure. This is an information-theoretic objective, not membrane voltage, electromagnetic energy or a metabolic quantity. For Application 04's independent coordinate observations, \(S^{\mathsf T}R^{-1}S\) is its observation precision \(\Lambda\), and \(b\) is the same centered evidence as in original equation 15.

**Proposition J1.** Full-Gaussian variational inference and the existing quadratic reconstruction have the same unique optimal mean. Restricting the covariance to a diagonal matrix preserves that optimal mean under these linear-Gaussian assumptions, while generally changing uncertainty:

\begin{equation}
m^*=H^{-1}b,\qquad
V^*_{\mathrm{full}}=H^{-1},\qquad
V^*_{\mathrm{diagonal}}=\operatorname{diag}(1/H_{ii}).
\tag{J3}
\end{equation}

**Proof.** The Gaussian expectation of a quadratic equals its value at the mean plus the trace term in J2, while its entropy supplies the negative log determinant. Differentiating the mean part gives \(Hm-b\). Positive definiteness makes its zero the unique minimum. For unrestricted covariance the derivative is \((H-V^{-1})/2\); the covariance objective is strictly convex on the positive-definite cone, giving \(V=H^{-1}\). For diagonal \(V\), the covariance terms separate as \((H_{ii}V_{ii}-\ln V_{ii})/2\), each uniquely minimized at \(V_{ii}=1/H_{ii}\). None of these covariance choices changes the mean derivative.

A two-coordinate example illustrates the uncertainty distinction:

\begin{equation}
H=\begin{pmatrix}2&1\\1&2\end{pmatrix},\qquad
V^*_{\mathrm{full}}=\frac13\begin{pmatrix}2&-1\\-1&2\end{pmatrix},\qquad
V^*_{\mathrm{diagonal}}=\frac12 I.
\tag{J4}
\end{equation}

The means agree for any fixed \(b\), but the marginal variances and cross-coordinate covariance differ. Thus equality of reconstruction means does not establish equality of confidence, predictive density, observation selection or every decision. Those require the declared covariance approximation and policy. In particular, the existing extra-observation rule is not thereby proved equivalent to minimizing every expected-free-energy policy objective.

This is an exact shared subfunction, not equivalence of complete SAN and active-inference theories or their physical implementations. It strengthens the positive reconstruction example by identifying a concrete alternative realization. It also locates the additional experimental responsibility: the learned receiving relation, its intervention response and its relationship to access must supply constraints beyond successful Gaussian inference alone. Nonlinear likelihoods, state-dependent noise and differently restricted means need a separate derivation.

## J2. A latent depolarization variable needs a reference

In a softmax state readout, write \(p_i=\exp(v_i)/\sum_j\exp(v_j)\). Then

\begin{equation}
\operatorname{softmax}(v+c\mathbf1)=\operatorname{softmax}(v),\qquad
v_i-v_j=\ln(p_i/p_j).
\tag{J5}
\end{equation}

**Proposition J2.** Probabilities from this readout identify logit differences, not a common offset or the absolute sign of each unnormalized logit.

**Proof.** The common factor \(\exp(c)\) cancels from numerator and denominator. Dividing two probabilities gives \(\exp(v_i-v_j)\). A sufficiently large positive or negative common shift changes all individual signs while preserving the probabilities. Normalizing the logits as \(\ln p_i\) fixes one convention, but does not create a measured membrane-potential calibration.

The neural process theory in reference 46 gives such model variables a proposed neural interpretation. J5 does not rule out that interpretation. It requires a declared electrical reference, units and transformation before a latent sign or magnitude is treated as a physical observation. It also does not imply that changing an actual transmembrane voltage leaves a neuron unchanged: physical membrane and extracellular references, conductances and thresholds must be included in that intervention. Emotional valence, a signed software contribution and a measured electrical consequence still need a specified connecting mechanism.

For SAN, receiver-relative influence retains its independently defined endpoint and units from original equation 1. A calibrated receiving difference may become consequential through learning and recurrence; the fact that an inference variable has been named depolarization is not that calibration.

## J3. A normalized likelihood does not fix parameter learning

Let a positive categorical probability vector \(p\) sum to one, and parameterize a Dirichlet column as \(\alpha=\kappa p\), with concentration \(\kappa>0\). The column mean and the reciprocal-count novelty coefficient used in the source formulation satisfy

\begin{equation}
\frac{\alpha_j}{\sum_i\alpha_i}=p_j,\qquad
W_j(\alpha)=\frac12\left(\frac1{\alpha_j}-\frac1{\sum_i\alpha_i}\right)
           =\frac1{2\kappa}(p_j^{-1}-1).
\tag{J6}
\end{equation}

For a normalized nonnegative count contribution \(u\), with nonnegative update weight \(\eta\),

\begin{equation}
p'_j=\frac{\kappa p_j+\eta u_j}{\kappa+\eta},\qquad
p'_j-p_j=\frac{\eta}{\kappa+\eta}(u_j-p_j).
\tag{J7}
\end{equation}

**Proposition J3.** Changing concentration while preserving \(p\) preserves the initial likelihood mean but can change novelty weighting and the size of later updates. Finite large concentration is not identical to a disabled update.

**Proof.** Normalization cancels \(\kappa\) in the first identity of J6. Substitution yields its reciprocal scaling in the second. Normalizing \(\alpha+\eta u\) gives J7. If \(\eta>0\), \(u\ne p\) and \(\kappa\) is finite, at least one component changes. With \(\eta=0\), it does not. An inference algorithm using only the fixed normalized likelihood can ignore concentration, while an algorithm that also uses novelty or parameter updates need not.

For example, \(p=(0.7,0.3)\), \(u=(1,0)\) and \(\eta=1\) give first-component updates of 0.85 at concentration one and approximately 0.70297 at concentration 100. Both start at 0.7. These are mathematical examples, not trial counts, learning-rate estimates or neural effect sizes from a biological experiment. The source routines' masks, offsets and per-column contribution weights require their own execution analysis; J7 does not silently replace them with this simplified case.

This distinction matters when a purported precision manipulation also changes concentration. The qualified model comparison should record normalized likelihood shape, parameter concentration, learning updates, retained state and policy preferences separately. Otherwise a difference attributed to current reception could reflect different future learning or information seeking. Genuine learned changes remain outcomes of interest; they must not be removed by post-treatment matching merely to manufacture a precision-only contrast.

## J4. Independent sign and derivative check

The source review records internal inconsistencies in the published introductory Gaussian display. This appendix derives J2 from normalized densities rather than copying that display. A scalar check of the consistent objective, with observed value one, prior mean zero and variances one and four, is

\begin{equation}
E(s)=\frac12\left[(1-s)^2+\frac{s^2}{4}\right],\qquad
-E'(s)=1-\frac54s,\qquad s^*=\frac45.
\tag{J8}
\end{equation}

Negating the quadratic reverses the gradient direction; replacing the observation variance by the prior variance in the receiving-error term gives a different equilibrium. These checks concern the printed Gaussian derivation. They do not establish an error in the separate categorical simulations or invalidate their whole theory. The exact version and inspected source pages remain unchanged in the research cache.

The [small comparison checks (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-33) recompute the normalized-density identity, Gaussian means/covariances, logit shifts, count-scale examples and scalar derivative. They do not refit any of the five applications, execute the external MATLAB models, analyze biological data or independently review the paper. The [main manuscript](Learning-to-Feel-v1.1.pdf) retains the complete learned-recruitment argument and its constitutive SAN hypothesis.




\clearpage
\hypertarget{appendix-k}{}
# Appendix K. Retained parameters feedback availability and task utility

This appendix qualifies the executed report and no-report comparator [main reference 55]. It separates the original solver, a declared feedback-withholding adaptation and the controller that preserves an acquired parameter snapshot. The results concern computational state and observation rules, not physiological phase, electrical magnitude or experience. The full trained comparison and biological assay remain prospective.

## K1 Initial state counts can change at zero scalar learning rate

The inspected source scales likelihood, transition, preference and policy count increments by a scalar `eta` where those updates are enabled. Its initial-state count update does not use that scalar. For one factor, let the initial count vector be \(d\), the normalized posterior over its initial states be \(q\), and \(I_i=\mathbf 1\{d_i>0\}\). The source update is

\begin{equation}
d_i'=d_i+I_iq_i,\qquad q_i\ge0,\qquad\sum_iq_i=1.
\tag{K1}
\end{equation}

**Proposition K1.** A zero value of the source's scalar learning rate does not, by itself, freeze this register. The total increment is

\begin{equation}
\lVert d'-d\rVert_1=\sum_{i:d_i>0}q_i\in[0,1],
\tag{K2}
\end{equation}

and equals one when every initial count is positive.

**Proof.** Each increment in K1 is nonnegative. Summing it over the supported coordinates gives K2. Normalization bounds that sum by one. Full support includes every coordinate, so the sum is one. No factor of the scalar learning rate appears in K1. A zero increment is possible when the posterior assigns no mass to the supported coordinates; the result does not assert a positive increment in every conceivable setting.

The executed upper-register handoff copied `a`, `b` and `d` into fresh constructors while preserving the current process, task and lower-level template. At zero scalar rate, both recorded probes had zero likelihood/transition increments and a maximum initial-count change approximately one. The controller retained the acquisition snapshot and discarded all returned probe counts. Thus a fixed retained artifact is a controller property, not an assumption that every internal update ceased. Copying an entire returned result would also copy observation caches and transformed task quantities; it is not the same interface.

## K2 Unreceived evidence has a neutral likelihood factor

Let \(A_{os}=P(o\mid s)\) be nonnegative and normalized over the possible outcomes for each state. Let \(e_o\) be the evidence weight supplied by one observation channel, and \(p_s\) the incoming normalized state distribution. The channel contributes

\begin{equation}
\ell_s(e)=\sum_oA_{os}e_o,\qquad
p_s'=\frac{p_s\ell_s(e)}{\sum_rp_r\ell_r(e)}.
\tag{K3}
\end{equation}

**Proposition K2.** An all-ones evidence vector is neutral for this factor: \(\ell_s=1\) for every state and \(p'=p\).

**Proof.** Substitute \(e_o=1\) into K3. Column normalization gives \(\ell_s=\sum_oA_{os}=1\). The denominator then equals \(\sum_rp_r=1\), leaving the incoming distribution unchanged. This describes the contribution of that channel; other evidence and anticipated availability can still change the model's complete inference or policy.

For an exact two-state example,

\begin{equation}
A=\begin{pmatrix}3/5&1/5\\3/10&7/10\\1/10&1/10\end{pmatrix},\qquad
p=\begin{pmatrix}2/3\\1/3\end{pmatrix}.
\tag{K4}
\end{equation}

All-ones evidence leaves \(p\) unchanged. A one-hot observation of the first outcome instead gives \(p'=(6/7,1/7)^{\mathsf T}\). An unreceived channel cannot therefore be equated in general with a recorded null event, unseen response or incorrect answer; the outcome's actual likelihood must be specified.

The third outcome in this particular matrix has state-independent probability \(1/10\), so observing it also leaves \(p\) unchanged. This counterexample separates a semantic distinction from universal numerical nonequivalence. A null-coded outcome can be neutral in a specified model, but its name alone does not establish that property.

In the qualified adaptation, only upper-level terminal correctness feedback receives this mask. Its generated score remains available to an external evaluator but is not received teaching evidence. Masked acquisition learning is not implemented; the qualified probes use zero scalar rate and discard their returned parameter changes.

## K3 A task goal and anticipated information have different roles

For policy \(\pi\), let \(S\) denote the task state, \(C\) a correctness quantity, and \(O_J\) the observations from the declared available channels. A task utility and an information term can be written separately as

\begin{equation}
U_\pi=\sum_cP(c\mid\pi)u(c),\qquad
\mathcal I_\pi=I(S;O_J\mid\pi).
\tag{K5}
\end{equation}

**Proposition K3.** Withholding a correctness observation does not algebraically require deleting the task utility. If availability is known in advance, information expected from the unavailable channel must instead be removed from the relevant observation term.

**Proof.** The sum defining \(U_\pi\) contains a predicted correctness distribution and its declared utility, not a requirement that the agent later observe a correctness signal. Keeping those quantities fixed preserves that sum. Changing \(J\) changes the observation variable used for the information term. For a wholly absent observation channel, its observation is a constant missingness symbol, giving zero mutual information with the state. A known policy-dependent availability variable or an informative missingness event requires its own model; it is not neutral by assumption.

For a binary correctness goal with utility one for correct and zero for incorrect, two policies can retain

\begin{equation}
P(C=1\mid\pi_1)=4/5,\qquad P(C=1\mid\pi_2)=1/5,
\qquad U_{\pi_1}-U_{\pi_2}=3/5
\tag{K6}
\end{equation}

without receiving a correctness observation. This is an elementary utility example, not a numerical identification of the published model's latent variables with sensory magnitude or monetary reward.

The adaptation preserves the original correctness preferences as a task-goal interpretation while removing announced unavailable feedback from terminal receiving evidence and expected information at the corresponding future step. This semantic and computational extension is declared explicitly. Its resulting policy difference combines anticipated availability with subsequent receipt; it does not identify the isolated effect of deleting a late observation.

## K4 Executed controls and remaining comparison

Both report-preparation contexts load the same saved upper-level learning registers into fresh context-specific constructors. Native and zero-mask adapted outputs match exactly across twelve checked fields: state and policy beliefs, sampled states/actions/outcomes, evidence, retained counts and transformed utility. The two withholding conditions verify all-ones terminal evidence and preserved utility. The six completed probe receipts and all preceding failed attempts are retained in the [runtime qualification (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-39).

The source's internal report codes remain null, unseen and seen, while correctness codes remain null, incorrect and correct. A no-report internal state is not an administered awareness response. These fixed-seed checks establish source/adapter correspondence and a usable observation interface, not a detection rate, theory-wide advantage, complete hierarchical acquisition program or biological reward-free assay. Common acquisition policies, informative replay, a specified retention rule, held-out observations/interventions and independently calibrated access and physical receiving mappings remain required for the substantive comparison.



\clearpage
\hypertarget{appendix-l}{}
# Appendix L. Two level learning retention and informative replay

This appendix specifies the additional comparator calculation in Section 7.6, using main reference 55. Its purpose is to make the retained state and available evidence explicit before a larger acquisition comparison.

## L1 The retained state and episode boundary

The fresh source constructor defines a two-level model. Upper-level registers are likelihood counts \(a_U\), transition counts \(b_U\) and initial-state counts \(d_U\). The sensory child has a likelihood count register \(a_L\). The controller carries those registers into fresh episodes while preserving the current physical process, raw task preferences, policies and hierarchy links. It carries no cached inference or transformed utility.

The native source invokes six sensory children from its current template. Those children do not collectively become a new retained template automatically. We therefore declare an episode-boundary batch rule. If child \(t\) returns the count increment \(\Delta_t\) relative to the template from which it started,

\begin{equation}
a_L'=a_L+\sum_{t=1}^{6}\Delta_t,
\qquad \Delta_t=a_{L,t}^{\mathrm{return}}-a_L.
\tag{L1}
\end{equation}

All six children use the original episode template during inference. L1 adds their conditional posterior statistics after the episode. Sequentially updating the template between children would change their later inference and is a different algorithm. Neither L1 nor the source is being identified as a measured biological consolidation rule.

The source's sensory update has a normalized one-step observation vector, normalized state posteriors and unit scalar learning rate. It multiplies their outer product by the indicator of positive incoming counts. Thus each child adds nonnegative mass of at most one. Under these assumptions,

\begin{equation}
0\le\lVert a_L'-a_L\rVert_1
=\sum_{t=1}^{6}\lVert\Delta_t\rVert_1\le6.
\tag{L2}
\end{equation}

To verify this elementary bound, the sum of a normalized outer product is the product of its factor sums, which is one. Restricting that nonnegative product to supported coordinates cannot increase its mass. L1 sums six nonnegative increments. The recorded added mass is 5.999999986885216; the small difference from six is retained rather than rounded into an exact update rule. Unsupported coordinates remain zero. The independent check reconstructs every increment and the retained count matrix from the saved child returns.

## L2 What the recorded replay supplies

The replay receives the native episode's root process states, outcomes and actions through the source's existing process fields. Those state fields control the simulated environment; they are not supplied as a hidden-state posterior to the inference routine. In this source configuration the child physical observation mapping is deterministic, so the clamped root process regenerates the native child observations. Received evidence, child states/actions and beliefs are compared explicitly after execution.

Both runs begin with the same learned-count template, task utility and policy repertoire. Their twelve recorded root fields match exactly, as do the six inspected child traces. The active run uses seed zero; the replay uses seed 981. A deterministic inference/update function applied to the same usable history has the same retained output. This conditional statement does not assert that a human replay participant receives every state, bodily consequence or interpretation of an acting participant.

The source's child cache stores returned result structures. A schedule of fresh child inputs has different fields and cannot simply replace that cache. Here replay uses the native child constructor and validates the regenerated child traces, leaving the solver unchanged.

## L3 Probe construction and readout

Each probe starts from a fresh report-preparation constructor. Both conditions carry the same acquired upper registers; only the second also carries the acquired sensory counts. The source process represents left, right and blank stimuli by initial-state codes 1, 2 and 3. The same stimulus code and seed enter each paired retention comparison. Physical process arrays, raw task utility, policies and hierarchy links remain those of the fresh constructor.

The previously qualified adaptation withholds announced terminal correctness feedback, provides an all-ones received evidence factor and excludes that unavailable channel from anticipated information. It retains the task goal. Scalar learning rates are zero at both levels. Sensory likelihood and upper likelihood/transition counts are unchanged during probes; returned upper initial-state counts may change and are discarded. The retained acquisition artifact remains unchanged.

The main table reports maximum absolute differences between corresponding posterior entries. Its sensory comparison uses the two physical stimulus-presentation steps. Its upper comparison uses the final update's estimates for all four factors over six modeled steps. These are final trajectory estimates; the online states at their original computation times require the additional snapshots specified below. All six selected response codes are 2, denoting unseen. If a source response were null-coded, the readout would retain it as unavailable rather than classify it as an ordinary unseen response. Hits and false alarms refer to their signal and catch denominators separately.

One trained stimulus, one untrained stimulus and one catch, each in two retention conditions, do not estimate learning curves or reliable detection rates. Changes in internal probabilities do not identify conscious experience. The stronger SAN account requires receiving-specific, downstream-use and independently justified access observations beyond this computational assay.

## L4 Task identity and the time of a model observation

A current reconstruction can concern an earlier event. Denote a model's estimate of the state at represented step \(j\), after processing evidence through update \(t\), by \(\hat q_t(s_j)\). The source repeatedly recalculates the whole modeled trajectory. Its returned `X` therefore contains final-update estimates \(\hat q_T(s_j)\), while an online record of successive current states requires \(\hat q_t(s_t)\). These are different observations of the same computation.

Read-only state capture confirms the distinction in the source's existing left/right orientation branch [main reference 55]. A native-versus-instrumented control matches sixteen numerical fields and six child comparisons. At the first update of a left-stimulus case, the sequence-type belief is approximately `(1/3, 1/3, 1/3)`. After the full episode, the estimate of that same initial state is approximately `(0.860817, 0.069454, 0.069729)`. Reading the final array as the earlier online state would assign later information to an earlier computation. A neural observation mapping must specify both represented time and update time; neither axis has acquired a physiological time scale merely by being recorded.

Choice probabilities also require the actual decision record. Let \(r_t(\pi)\) be the source policy weights and \(V_t(\pi)\) the joint control tuple associated with policy \(\pi\). The source first accumulates policy mass for each joint action, applies its action precision \(\alpha>0\), then samples. For a response label \(y\),

\begin{equation}
\begin{aligned}
m_t(u)&=\sum_{\pi:V_t(\pi)=u}r_t(\pi),\\
p_t(u)&=\frac{m_t(u)^\alpha}{\sum_v m_t(v)^\alpha},\qquad
p_t(y)=\sum_{u:\operatorname{label}(u)=y}p_t(u).
\end{aligned}
\tag{L3}
\end{equation}

This is the inspected implementation rule, not a physiological response law. With normalized nonnegative policy weights, the joint masses sum to one. Their powered sum is positive for \(\alpha>0\), with zero mass contributing zero; marginalizing the normalized joint distribution gives a normalized response distribution. Applying precision to a response marginal before constructing the joint distribution need not perform this operation.

The controlled pair below holds the fresh model, stimulus, seed and predecision evidence fixed. It supplies different terminal feedback symbols at step 6, after response selection at step 5. Both runs select left. The software intervention deliberately forces an incorrect-coded symbol in one case despite the correct selected response; it checks observation timing and does not change the prospective human study's accurate-feedback requirement.

| Terminal feedback symbol | Left policy weight before choice | Left action probability at choice | Left policy weight after feedback |
|---|---:|---:|---:|
| Incorrect-coded 2 | 0.8785765882 | 0.9999998669 | 0.0594466985 |
| Correct-coded 3 | 0.8785765882 | 0.9999998669 | 0.9405533015 |

The action-precision value is eight. The actual choice distribution and earlier state snapshots agree exactly across the pair. The final policy weights differ by 0.881106603; they are later model quantities, not the probabilities used for the already completed choice. The general online-versus-final state differences also reflect later sensory evidence and further inference: the feedback contrast alone does not demonstrate a corresponding difference in the earlier stimulus-state estimates. These observations require accurate computation-time labels without implying a failure of ordinary retrospective inference.

The orientation branch assigns response codes 2 and 3 to left and right; the presence branch assigns them to unseen and seen. Their feedback-count arrays have equal dimensions but different mappings. Whole-bank transfer consequently requires an explicit semantic mapping; shared dimensions alone are insufficient. The blank orientation case remains without a left/right target even when a forced response occurs.

Four exported fixtures pass through the three existing Application 03 feature functions. The raw sensory codes before choice map invertibly to left `-1`, right `1` and blank `0`; three declared zeros pad the five observed steps for the eight-bin feature API. Fixed context/action tags use the identity convention. Cost codes and prior controls are exported separately and are unused by those existing sensory features. This qualifies an observation component and a feature-identity endpoint. Common acquisition policies, agency/context manipulations, trained models and calibrated neural/access readouts still require their substantive comparison. The [source and case records (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-41) preserve all five completed inversions, the native control and the chronology checks.



\clearpage
\begingroup\setlength{\parskip}{2pt plus 1pt minus 1pt}
\hypertarget{appendix-m}{}
# Appendix M. Common acquisition histories and partial feedback

This finite computational task tests whether a learner acquires a useful action-return relationship and preserves its temporal distinction in later choices. Three linear learners and two count settings of the source-derived orientation model receive a shared task. The construction separates current sensory information, retained learning, own-response knowledge and delivered correctness feedback. It does not assign neural or phenomenal meanings to the model scores.

The [frozen protocol (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-38) specified 32 acquisition episodes and probes before acquisition, after eight episodes and after 32 episodes. All 172 cases in the [manifest (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-37) completed: four qualification controls, 128 acquisition episodes and 40 baseline/checkpoint probes. Nine linear fits each completed 32 updates. Direct audits inspected all 128 saved acquisition states. Results and process receipts are stored separately for each case; these cases are not independent participants or replications of the entire training history.

## M1 Physical return and supplied receiving transform

Each episode has binary target \(y\), context \(c\), prescribed exploratory action \(q\), independent source tag \(u\), and raw distractor \(w\), all taking values in \(\{-1,+1\}\). All 32 combinations of these five variables occur once. The first raw pulse is \(qcy\) in the contingent role and \(ucy\) in the active noncontingent role. The second raw pulse is \(w\). Holding the exogenous variables fixed, changing \(q\) changes the contingent return but not the noncontingent return.

The known receiving transform multiplies both raw pulses by \(cq\). The two canonical pulse values are therefore

\begin{equation}
(x_1,x_2)=
\begin{cases}
(y,cqw), & \text{contingent},\\
(quy,cqw), & \text{active noncontingent}.
\end{cases}
\tag{M1}
\end{equation}

The learner receives the truthful action tag. Noncontingency is a change in the physical return rule, not a deliberately corrupted action record. Informative replay supplies the contingent observations and their original context/action tag without executing that exploratory action in the replay learner. The transform and exploration policy are supplied structure; this experiment does not show their acquisition.

Both generated roles have the same four raw pulse pairs, each appearing eight times. The pulses occupy source-model steps two and three. The first five sensory steps are observed; three final zeros provide the eight-element input expected by the existing feature functions. These padding slots do not add observations or extend the source model's six-step horizon.

The frozen order pairs opposite targets within the same exogenous setting and balances the noncontingent first-pulse correlation in every four-episode prefix. This is one structured training history, not independent identically distributed trials. Its ordering can influence learning. Statements about the information in a current observation tuple below do not assert that the complete sequential history contains no predictive information.

## M2 What the finite representation can distinguish

**Conditional result 1.** On the four equally weighted intact probe patterns, a learner using only the integrated feature \(z=(x_1+x_2)/2\) cannot exceed accuracy \(3/4\) when the target is \(x_1\). A linear time-bin receiver and a linear receiver using the stated phase features can each represent a perfect decision rule.

**Proof.** The patterns \((-1,+1)\) and \((+1,-1)\) both produce \(z=0\), but their targets differ. Any decision rule depending only on \(z\), including a randomized rule, is correct on at most half of these two equally weighted cases. The other two cases have distinct features and can both be answered correctly. The maximum average is therefore \((2+1)/4=3/4\). A time-bin receiver can select \(x_1\) directly. For the phase receiver, the cosine feature at bins one and two of an eight-bin cycle is \(\cos(\pi/4)x_1+\cos(\pi/2)x_2=x_1/\sqrt{2}\). Multiplying that feature by \(\sqrt{2}\) recovers \(x_1\). This is a representational result, not a guarantee that a particular training history finds those weights.

**Conditional result 2.** In the uniform distribution over the declared 32 settings, the current noncontingent raw observation together with \(c\) and \(q\) does not determine \(y\); its conditional target probability is \(1/2\). The contingent tuple determines \(y=cq\,\mathrm{raw}_1\).

**Proof.** In the noncontingent case, replacing \((u,y)\) by \((-u,-y)\) preserves both raw pulses, \(c\), and \(q\), while changing the target. Both settings occur with equal weight. Every current observation therefore has balanced target labels. In the contingent case, multiplication by \(cq\) inverts the return rule because \(c^2=q^2=1\). The result concerns the specified current tuple and distribution, not arbitrary learners with additional information about the fixed sequence.

**Conditional result 3.** If two learners start with the same retained state and receive the same observations, teaching signals and random draws through the same update rule, their retained states and outputs remain equal.

**Proof.** Write the update as \(\theta_{k+1}=F(\theta_k,o_k,f_k,\xi_k)\). Equal initial states and equal first-step arguments give equal next states. Induction gives equality at every subsequent step and for any shared readout. The linear contingent and replay histories are computed separately and checked for equality. The source-model replay result is explicitly an identical-input alias of its contingent calculation, not an independent run or a biological test of agency.

These results explain why accurate contingent performance would support preservation of a useful distinction without establishing a unique advantage of oscillatory coding. They also explain why an apparent advantage over this integrated receiver must not be generalized to all rate-based or recurrent alternatives.

## M3 Own response without delivered correctness

The source-derived task refines the original correctness channel into nine joint outcomes. Response codes are null, left and right; feedback codes are null, incorrect and correct. The joint code is \(f+3(r-1)\), where \(r\) is the response and \(f\) is feedback. The refined likelihood preserves the original feedback likelihood within the corresponding hidden response state.

During acquisition, the agent observes its response and accurate correctness feedback. For binary choices \(a\in\{-1,+1\}\) and feedback \(f=ay\), the pair determines \(y=af\). Thus the available teaching information is supervised-label-equivalent. The comparison does not show learning a previously unavailable label from unlabelled sensory activity.

During probes, the agent observes its own response but not correctness. Let \(A_{(r,f),s}\) denote the fine likelihood. Observing only response \(r_*\) contributes

\begin{equation}
\ell_s(r_*)=\sum_f A_{(r_*,f),s}.
\tag{M2}
\end{equation}

This follows by multiplying the fine likelihood by an indicator that is one for the three feedback outcomes compatible with \(r_*\) and zero otherwise. It is not an all-ones mask over all nine outcomes: that would remove the response as well. Expected information uses the correspondingly coarsened likelihood, while the utility of correct responding is retained on its declared fine domain. Partial-observation learning is not implemented; these probes use zero scalar learning rate and discard all returned parameter updates.

The qualification controls compare the map-off implementation with its predecessor across sixteen numerical fields. A separate hidden-target pair changes physical correctness while holding received evidence and the seed fixed. Equality of both predecision outputs and final inference in that pair tests that undisclosed correctness has not entered the learner. These controls qualify this interface rather than every possible adaptation of the source model.

## M4 Retained state and decision measurements

Both upper cue-to-target likelihoods start uniform. Lower perception, recurrence, memory operations, policies and preferences remain supplied structure. The two source settings scale all retained upper likelihood, transition and initial-state counts and lower likelihood counts by either one or one eighth. Their initial normalized count mappings agree; their learning sensitivity need not. The settings do not equate the source model's capacity or learning rate with those of the linear learners.

Upper likelihood, transition and initial-state registers pass to fresh trial constructors. Six sensory posterior-count increments are added to the lower template at each episode boundary. This is the declared batch-retention extension, not a claim that the published source implements this inter-episode rule unchanged. Probe updates never enter the retained acquisition bank.

Feature belief is recorded at update five about represented step five, before the choice. Its signed score is the probability of right minus the probability of left. The source action distribution is separately marginalized from the actual decision-time joint control distribution. Later feedback and final policy weights do not replace these decision-time quantities.

At each checkpoint, four update-free probes cover \((-1,-1),(-1,+1),(+1,-1),(+1,+1)\). Intact targets follow the first pulse. A swapped-timing target follows the second pulse; because the complete four-pattern alphabet is used, this reindexing evaluates the corresponding pulse-position swap without changing the observed input support. It tests a physical timing relationship, not a neural phase intervention. The probe alphabet overlaps acquisition support, so the results are not unseen-stimulus generalization.

For the source model, accuracy is the mean probability assigned to the correct action, with realized choices also reported. For deterministic linear readouts these quantities coincide. Squared error uses each learner's declared signed score and the target in \(\{-1,+1\}\); a linear regression score is not thereby a calibrated target probability. Scores and action probabilities are not interchangeable.

Finite input influence is summarized by the unique four-point expansion

\begin{equation}
s(x_1,x_2)=b+k_1x_1+k_2x_2+k_{12}x_1x_2,
\qquad
(b,k_1,k_2,k_{12})=\frac14\sum_{x_1,x_2}s(x_1,x_2)(1,x_1,x_2,x_1x_2).
\tag{M3}
\end{equation}

The identity follows from orthogonality of the four sign functions on the balanced alphabet. Holding \(x_2\) fixed, changing \(x_1\) from minus one to plus one changes the score by \(2(k_1+k_{12}x_2)\). These are finite task-specific influence coefficients, not global derivatives, synaptic weights or electrical measurements.

\par\ifdim\dimexpr\pagegoal-\pagetotal\relax<180pt\newpage\fi
## M5 Completed finite results

The table gives mean correct-action probability over the four intact probe patterns after 32 acquisition episodes. For deterministic linear choices this is the fraction correctly classified. The source-derived values score its actual decision-time stochastic policy, not a posterior likelihood for the target. Both source settings have baseline accuracy one half.

| Learner or count scale | Contingent | Informative replay | Active noncontingent |
| --- | ---: | ---: | ---: |
| Integrated linear | 0.75000000 | 0.75000000 | 0.50000000 |
| Phase-feature linear | 1.00000000 | 1.00000000 | 0.25000000 |
| Time-bin linear | 1.00000000 | 1.00000000 | 0.00000000 |
| Source-derived scale 1 | 0.50000142 | 0.50000142 | 0.50000120 |
| Source-derived scale 1/8 | 0.50000664 | 0.50000664 | 0.50000693 |

The source replay entries are derived identical-input aliases, not independently executed cases. All linear replay calculations were separately executed and exactly match their contingent counterparts. Native source controls and hidden-target checks qualify the declared observation interface; they do not make the nine-outcome constructor an unchanged published task.

Under the pulse-position swap, contingent integrated accuracy is 0.75 and both finer linear receivers have accuracy 0.50. The phase and time-bin feature families can distinguish the first pulse, but the learned first-pulse rule does not automatically follow a changed target relationship. The integrated rule's invariance follows from its summed representation. Source-derived contingent expected accuracies under the swap are 0.49999557 and 0.49992579 for count scales one and one eighth, respectively.

The active noncontingent linear outcomes are sensitive to the finite paired order and thresholded readout. Their 0.50, 0.25 and 0.00 accuracies are not population probabilities or a general prediction of inverse perception. All score errors, learning checkpoints and influence coefficients remain in the [complete numerical record (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-36).

Reducing source counts eightfold does not produce accurate discrimination within these 32 episodes. For the scale-one-eighth contingent setting, the four-pattern score bias is approximately -0.03434 and the first-pulse coefficient is approximately 0.000006139. Changed retained counts and changed internal scores therefore do not, by themselves, establish learned diagnostic selectivity. The near-chance outputs are a limitation of this uncalibrated task configuration, not a demonstrated limitation of active inference as a theory.

## M6 Scope of the completed comparison

The completed finite comparison retains all roles, source settings, checkpoints and probes, including weak performance and adverse timing outcomes. A single history cannot supply population error bars, a general ranking of architectures or a claim about conscious experience. In particular, weak learning in a source setting must not be used as a theory-wide defeat of active inference. A competitive benchmark would additionally need task-appropriate source-model calibration, justified training budgets, multiple histories and independently evaluated interventions.

At the recorded execution, the complete manifest and retained-state audits passed their declared checks. Six separately implemented finite calculations support the conditional arguments and observation rule. These producing-chat checks are reproducibility evidence, not independent scientific approval. The [comparison verifier (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-34) checks saved data and numerical identities without starting a model; the [methods verifier (availability)](https://github.com/v5ma/v5ma.github.io/blob/master/papers/companions/learning-to-feel-v1.0/ARTIFACT-AVAILABILITY.md#artifact-35) replays the six small calculations. The biological acquisition-to-access study remains prospective.


\endgroup


\clearpage

\hypertarget{appendix-n}{}

# Appendix N. State occupancy, content selectivity and learned receiving influence

This appendix is new in public v1.1; v1.0 remains unchanged. It contains elementary conditional results and exact constructed checks, not a new biological dataset, an HMM fit or an additional trained application. References 56-59 are in the paired successor main manuscript.

## N1. A pooled contrast has several possible origins

Let x be a declared scalar content contrast. Suppose its state-specific contributions to a scalar receiving endpoint are wC gC x and -wS gS x. Here g describes source encoding, w a stipulated linear receiving sensitivity, and p the probability of state C. A common baseline cancels in a contrast. The pooled coefficient is

\begin{equation}
\Theta=pw_Cg_C-(1-p)w_Sg_S.\tag{N1}
\end{equation}

This is an illustrative signed linear contrast, not a literal model of two faces being negatives of one another, a fitted neural mechanism, or a formula for subjective intensity. The weights are not identified by observing coherence or decodability.

**Proposition N1 (pooled nonidentification).** Even with nonnegative gains and sensitivities, a change in Θ alone does not identify whether occupancy, encoding or reception changed.

**Proof.** Begin at p=1/2 and wC=wS=gC=gS=1, so Θ=0. Changing only p to 3/5 gives Θ=1/5. Keeping p=1/2 and changing only gC to 7/5 also gives Θ=1/5. Alternatively changing only wC to 7/5 gives the same coefficient. The three parameter configurations differ but have the same stipulated contrast at every x. This is an equality of this observation rule, not equality of complete spike distributions or every possible receiver measurement. ∎

For unit sensitivities, the finite pre/post difference decomposes exactly as

\begin{equation}
\Theta_1-\Theta_0=(p_1-p_0)(g_{C0}+g_{S0})+p_1(g_{C1}-g_{C0})-(1-p_1)(g_{S1}-g_{S0}).\tag{N2}
\end{equation}

Expanding the right side and cancelling terms proves the identity. It is a descriptive decomposition under this chosen parameterization, not a causal allocation of credit to learning. Observing p and g would constrain two alternatives, but a claimed change in w still needs an intervention and suitable controls at the specified receiver. A nonoscillatory state-sensitive receiver can implement the same equation.

## N2. Represented information can be separable from a selected readout

Let two equally occupied states have nonnegative two-neuron means rC=(3,1) and rS=(1,3). Their pooled mean is (2,2), the same as a static mean vector, and their total conditional mean rate is four in both states; their observed Poisson spike counts still fluctuate. A state-specific signed contrast nevertheless differs. Independent Poisson noise conditioned on the state gives between-state off-diagonal covariance -1 and diagonal total variance 3, whereas independent Poisson activity at the static mean has zero off-diagonal covariance and diagonal variance 2. Averaged rates agree; full distributions do not. These values follow from the law of total covariance and are checked exactly in the shared fixture script. This explains why a good control must compare more than rates, while preserving the value of Hesse et al.'s held-out population controls.

Now let a downstream readout be Y=w1 r1+w2 r2 for a fixed source vector r. An intervention that changes the stipulated receiving vector from w to w' changes Y by (w'-w)·r while leaving every source-only decoder unchanged. Conversely, changing a source decoder's accuracy need not determine w. This elementary separation motivates simultaneous source and receiver measurement; it does not establish that such a weight change causes conscious experience. Real interventions can also change the source, other pathways and the organism's state, so those exclusions must be tested rather than inferred from this construction.

## N3. Pre-state randomization is different from post-state selection

Let Z0 be a state variable measured before randomized intervention A, and Y(a) the declared potential outcome. If randomization is independent of the potential outcomes within Z0, treatment probabilities are positive there, and the usual consistency and no-interference assumptions apply, then

\begin{equation}
\mathbb E[Y\mid A=1,Z_0=z]-\mathbb E[Y\mid A=0,Z_0=z]
=\mathbb E[Y(1)-Y(0)\mid Z_0=z].\tag{N3}
\end{equation}

**Proof.** Consistency replaces observed Y by Y(a) within each randomized arm. Conditional randomization equates the arm-specific mean of Y(a) with its mean in the pre-state stratum. Subtract the two equalities. ∎

Here A denotes the nested randomized probe perturbation, not the acquisition arm. Z0 can be before that probe while still being caused by earlier acquisition. Equation (N3) therefore does not identify an acquisition effect by conditioning on a post-acquisition state. An estimated Z0 defines an estimated-state stratum; without an error model the equation does not become an effect within the unknown true neural state. A retrospective state inferred using the later response is not Z0. In a repeated-probe design, the target history and treatment policy must also be specified; within-participant dependence is not removed by this algebra.

For a counterexample to post-state selection, let independent A and U be fair binary variables, let Y=U with no treatment effect, and define Z1=1 exactly when A=U. Among observations with Z1=1, the treated mean of Y is one and the control mean is zero, despite Y(1)=Y(0) for every unit. Conditioning on the treatment-dependent state manufactures an apparent effect of one. The exact four-case fixture demonstrates the selection artifact, not a claim that the Hesse study used this causal analysis.

## N4. Relation to the temporal mechanism

Temporal Ensembles' successor supplies two further constraints: a symmetric Markov switch can alternate without a nonzero-frequency spectral peak, and an exponentially retained functional trace survives a gap G only while G is no larger than τh log(H0/θ), under the declared refresh/readout assumptions. Neither result defines experience by a threshold. For Learning to Feel, the implication is to measure what was retained, what is expressed now and what is used next separately. Local alternation, an inferred content state and a phase-relative receiving mechanism must not be treated as interchangeable observations.

The shared fixtures use small exact rational calculations plus a bounded analytic exponential check. They do not run source model inversions, use the Hesse recordings, fit a dwell distribution, train a new learner or establish statistical power. Existing Applications 01-05, their adverse comparisons and their saved outputs are unchanged.
