# Learned receiving and protected transactions — prospective v1 protocol

23 September 2026. Written before generating development or final evaluation streams for this version. This is a synthetic neural construction, not physiological dissipation, a transformer benchmark, or proof of continual-learning superiority. The old 800-case gate evaluation and all historical results are untouched.

## Full author mechanism and scope

The exact 14 September concept at `D:/micahone/D Documents/SAN-Selective-Dissipation-Continual-Learning-Concept.txt` requires history-shaped receiving, diagnosis without a retained write, a learned proposal policy, a separate acceptance decision, retained benefit after working-state reset, and later learning. These are distinct targets. This application must not reduce them to an engineered decay constant. The earlier named SAN-Cycle proposal remains source-gated; this experiment makes no first-in-SAN or public-priority claim. The concept's date is internal to the private document, not newly verified public fixation. Its current bytes will be hashed in the run freeze.

## Receiver, state and chronology

A fixed-capacity eight-unit tanh recurrent receiver takes four observable coordinates: two continuous primitives and two visible context cues. Cues are part of the observations, not hidden task IDs. Its initial transient state is learned from the last four verified input/outcome events; four learned recurrent steps follow. All 273 receiver parameters are shared across stages. A separate 16-event recent buffer and 16 fixed protected examples are equally available to every controller. The buffers are bounded and their storage is reported.

The receiver predicts before the current outcome is supplied. Its five intermediate predictions (initial state plus four steps) are recorded while the retained parameter vector is fixed. Only after the verified synthetic outcome arrives is an outcome-residual trace computed. No hidden mean, future outcome, stage identity, rule identity or update-benefit label enters the deployed controller. Real computation need not monotonically dissipate: initial residual, subsequent normalized magnitude, reactivation and final error are reported separately. Calling these dynamics a measured neural settling process would be unjustified.

The model is trained by backpropagation through its four steps. A development-only shared pretraining phase learns history-conditioned linear relations. Each new stream then receives the same base-skill warmup for every arm, using only its warmup samples. Optimizers are stateless SGD for the receiver; accepted or rejected parameter changes cannot hide persistent optimizer moments.

## Streams and frozen partitions

Each stream has 220 encounters: mastered base (24), new combination in a second visible context (36), correction of that familiar relationship (36), irreducible noise in a third context (24), old-context revisits (36), a later new relationship in a fourth context (40), and final revisits (24). Stage names are evaluator metadata only. Boundaries are not supplied to learners. Every arm receives identical observations and outcomes.

Development uses seeds 100–111 and polynomial target families. Seeds 200–203 are a separate development-validation partition. Final seeds 1000–1003 use new polynomial coefficients/observations; seeds 2000–2003 use new sinusoidal interaction rules. The latter are a structural distribution-shift challenge, not a whole real-world benchmark. The held-out streams are generated only after the fitted controllers and code are sealed. No seed/threshold/epoch is selected using final results.

## Proposal and retained transaction

A candidate is one clipped-gradient SGD step: learning rate 0.04, gradient norm at most 1.0. The gate threshold is fixed at 0.5. Acceptance requires a strictly lower loss on the current verified encounter, increase in loss on the same protected set of at most 0.0002, total protected-set increase from the stream's initial trained model of at most 0.02, finite fixed-capacity parameters and bounded step size. The 0.02 cap is cumulative; it is not refreshed at task boundaries. The current encounter is used to propose and accept, so this is not independent validation of new-task generalization. That is evaluated using separate queries and future observations. Repeated use of the same protected set is also not a generalization guarantee.

Development counterfactual labels compare a candidate's effect on new synthetic draws from the current generating rule and the base rule, weighted 0.8/0.2, with a 0.0001 write cost. They use simulator truth during **development supervision only**. Acceptance itself uses only observed examples. This privileged synthetic meta-training signal must not be described as an available unlabelled deployment signal or external validation. A randomized development behavior policy supplies both accepted-update and skipped-update histories. The gate learns from those consequences; gate weights are frozen during final evaluation.

Four 24-hidden-unit MLP gates share dimensions, initialization, standardization rules, 40 fixed training epochs and the same development labels: full state/history plus ordered trajectory; full state/history without intermediate trajectory; full state/history with independently permuted trajectory coordinates; and instantaneous prediction/loss only as a restricted ablation. The full-history features include the exact receiver parameters, current input/outcome, all retained buffers and intermediate-state initial context; they contain enough to reconstruct the deterministic trajectory. Thus there is no extra-Shannon-information claim. Effective feature access differs, despite matched stored parameter counts.

Other arms: always propose with the same acceptance rule; replay-gradient proposal with the same rule; A-GEM-style projected proposal with the same rule; and frozen receiver parameters with normal temporary-history updates. The projection uses the average gradient on the same fixed protected memory. This is an explicit task-free regression adaptation of one published update rule, not reproduction of the original classification results, memory management or hyperparameter sweep. EATA and GPM remain literature comparisons rather than falsely labeled numerical reproductions.

## Outcomes and causal diagnostics

Primary: encountered-stream squared error **before** feedback, with paired seed differences against the full-history gate, always-protected, replay-protected and projection-protected controls, separately for the two final families. Report all eight seed-level outcomes; no p-value or broad superiority conclusion is promised. Secondary: writes/proposals/rejections, phase-wise errors including noise and familiar corrections, final and maximum protected-set loss, separate held-out base-skill loss, acquisition error on the later relationship, and its comparison with a fresh-from-warmup learner given the same later observations and rule.

Every final learner is probed on unseen examples after clearing transient context. The final retained vector is compared with the initial warmup vector under the same zero-context probes. A last-accepted-write removal/rescue check compares the exact pre/post vectors and declares the affected endpoints; a beneficial change is not assumed. Clearing only temporary state is distinct from rolling back retained parameters. Fixed buffers, receiver and gate counts, logical forward/backward work and gate invocations are recorded. Wall-clock durations are separate non-deterministic execution metadata, not evidence that fewer writes save end-to-end compute.

Engineering checks precede final evaluation: finite-difference BPTT gradients; current-input/outcome contract; frozen diagnostic weights; exact rollback/version behavior; finite candidate rejection; projection halfspace; a finite-step counterexample showing why projection alone is not a retention proof; feature/label separation; true parameter changes after training; evidence partitions; and byte-identical deterministic replay. Performance failure is a valid result, not a failed engineering assertion.

## Run bounds and interpretation

One CPU thread; BelowNormal priority on Windows; no GPU/network or recursive search. Each invocation has a 180-second self-imposed deadline and bounded data counts. The program refuses to overwrite sealed development or evaluation results. A repeat writes a different replay directory and compares deterministic result bytes, excluding timing. Maximum intended output 32 MiB. Any code/protocol repair after final exposure requires preserving the first run and declaring later use exploratory.

## Prior and mathematics

Chaudhry et al., *Efficient Lifelong Learning with A-GEM*, ICLR 2019, [version 2, section 4 and appendix C](https://arxiv.org/html/1812.00420v2): the projection subtracts the negative component along the memory gradient. Its first-order constraint is not an exact finite-step loss bound. The source also motivates keeping hyperparameter development apart from final learning streams. This application uses regression, visible cues, fixed protected memory and an extra acceptance check; those adaptations limit the comparison.

[Mathematical boundary note](MATHEMATICAL-BOUNDARY.md) binds the protected-set result to the actual transaction. No new Lean certification is claimed here.
