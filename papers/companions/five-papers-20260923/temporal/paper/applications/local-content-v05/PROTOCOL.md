# Local content and downstream-use diagnostic, version 5

23 September 2026. Fixed before generating results. A small synthetic construction, not a fitted dendritic model, a discovery of endogenous biological oscillation, or a test of experience. All historical applications remain unchanged.

## Question and mechanism

Separate continuous fast activation, adaptation-dependent readiness, and local content traces. For n = 2, 3, 4 components, activation is a rectified rate attracted toward constant drive minus local adaptation and pairwise inhibition. Adaptation integrates recent activation. Fixed small asymmetric initial conditions avoid exact permutation symmetry. Numerical time steps approximate these differential equations; no branch index schedules events and no winner-take-one operator chooses a branch. The parameters below are invented dimensionless test parameters, not measurements.

Let tau_a = 0.05, tau_q = 0.8, drive = 1, adaptation strength = 1.7, mutual inhibition = 2, and dt = 0.002. Set a_i(0) = 0.05 + 0.01 i and q_i(0) = 0. Each step updates a toward max(0, 1 - q - 2(sum(a)-a)), then q toward 1.7 a. Controls remove adaptation or coupling, and one variant changes component recovery constants by factors 0.8 to 1.2. A fixed 12-unit settling run is followed by 6 observation units. Report dominance changes, simultaneous participation and amplitudes; a rate-dominance switch is not a spike or proof of periodicity.

At each externally presented event, the current nonnegative activation determines normalized receiving weights w_i. Their sum is one; they specify allocation, not an extra input-activity budget. The two local content banks h_i,fast and h_i,slow have time constants 0.4 and 1.6. Between events they decay exponentially; each event adds w_i x to both banks. The event x encodes the currently given object-feature pair as an outer product of one-hot object and one-hot feature. This preserves provided ownership; it does not infer ownership from an ambiguous sensory scene. Content resides in these numerical matrices, not a global timestamped list. Readout sums the compartments separately for each time constant.

## Fixed endpoints and controls

1. Order-to-action: first and second labeled contents are AB or BA, with identical counts. A fixed linear readout compares the fast-minus-slow score of B with that of A, orientated from the exact two-event decay equation. It selects one of two action ports. After a delay l and gap d the older trace has age l+d. Restrict this elementary readout to the declared d/l regime; do not claim a general learned sequence decoder.
2. Ownership-to-action: two inputs give either object0-feature0 plus object1-feature1, or the crossed pair. Readout compares diagonal versus off-diagonal trace mass. A deliberately impoverished independent-marginals control loses these assignments; it is not a strong recurrent comparator.
3. The strong control is an ordinary nonoscillatory two-timescale state bank with the same supplied pair coding and total injected trace. It has the same aggregate recurrence. It must agree with the summed-local model up to floating-point tolerance. This is a mathematical equivalence control, not an independent performance contest.
4. Selectively erase content immediately before readout, disconnect readout from retained state, and restore the saved local state. Report errors and exact rescue. Remove adaptation and coupling with the same external event contents, times and total writes. If their action predictions remain identical, the current readout does not establish a functional requirement for alternation.

The exhaustive grid uses two orders, two ownership assignments, gaps {0, 0.15, 0.3, 0.6, 0.9}, post-event delays {0, 0.1, 0.2}, n in {2,3,4}, and four dynamical variants (baseline, no adaptation, no coupling, heterogeneous). Simultaneous stimuli (gap zero) lack order by design: report ambiguity separately, not as a failure to reconstruct an actually supplied order. The fixed equal total event count/content rules control trace injection, not wall-clock cost or physiological spike count. No noise, training, model selection or empirical fit is claimed. A later noisy task must be a new version, not a reinterpretation of this diagnostic as held-out science.

## Mathematical prediction

For each time constant tau, h_i' = -h_i/tau between events and h_i^+ = h_i^- + w_i x at an event. Since sum_i w_i = 1, H=sum_i h_i obeys H'=-H/tau and H^+=H^-+x. Induction over event times proves equality to a single state bank initialized at zero. Thus any downstream readout of these sums alone is incapable of identifying or requiring the allocation/alternation mechanism. Removing content changes the sufficient state; removing allocation dynamics need not.

This is an explicit boundary on this implementation, not a refutation of the physical hypothesis. To obtain a positive alternation-dependent result, one would need a separately justified non-additive, capacity-limited, heterogeneous-trace or branch-sensitive receiving/readout operation, then compare an equally informed state-based alternative. The current diagnostic will not add such a dependency merely to force a positive result.

## Execution and acceptance

NumPy only, one CPU thread, no network, at most 180 seconds and 5 MiB output, explicit output directory, no overwrite. Archive parameters, source hash, all cases and an independently computed aggregate prediction. Run twice and compare complete result bytes. The model's equations and input contract are the premises; passing assertions validates those premises' implementation, not neuronal consciousness.
