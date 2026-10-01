# Learned episode application — development specification v0.1

September 8, 2026. **Specified, not implemented or executed.** This document is the next implementation contract, not another successful application result. Record its hash before the first run and preserve any subsequent change as a new version. Expected effects described here are design expectations, not discoveries or preregistered biological predictions.

## Purpose and smallest meaningful implementation

Build a small agent that actually acquires associations, maintains an encountered episode, selects observations, and changes its temporary assembly when its task changes. The two existing finite diagnostics remain unchanged. The new system must not merely rename their hand-coded selection as learning or receive the hidden true world as a prior-state estimate.

The initial world is symbolic: three identifiable entities, two sensor channels, and four possible values per entity/channel. Labels can illustrate visual, auditory or bodily roles, but no sensory realism or model of conscious experience is claimed. The six coordinates define 4,096 possible instantaneous configurations. An opaque codebook maps channel/value combinations to observation symbols; labeled training encounters teach a receiver decoder that codebook. Initial evaluation concerns new combinations of already encountered symbols, not unseen sensory categories.

There are two persistent records with different meanings. **Acquired associations** store learned symbol meanings and task-conditioned action values. **Episodic memory** stores only actually encountered, entity-bound observations and their order. A third, temporary assembly makes selected parts of that record available at a declared granularity to a downstream query. Keeping a complete archive is not equivalent to recruiting all of it into that assembly.

## Interaction and information boundary

1. A seeded environment owns the hidden state, event schedule and target answers. Agent methods receive only a task cue, their own previous actions, and returned observations. The task cue must be independent of target values.
2. Actions request an entity/channel observation at coarse or fine granularity, revise the temporary assembly from accessible memory, or commit a response. A request changes the next observation. The environment must not give all channels to an adaptive agent merely to let it pretend to sample selectively.
3. A coarse observation merges adjacent values; a fine observation preserves the four-valued distinction. Physical source bits, acquisition operations, controller operations and stored record size are logged separately. No bit count is presented as a metabolic cost.
4. A task switch occurs within a continuing episode. At least one later task requires an earlier encountered relation or event order, and at least one requires new sampling because the world has changed. Recurrent memory must therefore do actual work.
5. The action-selection policy is learned from reward and observation history. A small tabular learner is acceptable for this development stage. Giving it a correct role cue is allowed but must not be described as discovering human intent. Hard-coding which sensor answers each role is an oracle control, not the learned policy.
6. Responses receive task feedback during training only. During frozen evaluation, reward is logged for scoring and is not fed back into learned parameters. Episodic state may update from observations; parameter learning and episodic acquisition remain separate.

The four demand families are focused fine discrimination, broad coarse context, correctly bound entity-feature relations, and delayed/order-sensitive episode reconstruction. Factorial task combinations and role order must be fixed in the eventual run configuration before outcomes are inspected. A preliminary action budget is six sampling/assembly steps per query. If that makes a target inaccessible, report the failure; do not silently supply missing input.

## Training, development and evaluation

- Partition the finite instantaneous configurations before training using a deterministic, recorded assignment. Confirm that every individual symbol occurs in training while held-out combinations remain absent. Also separate full episode seeds and sequences; marginal novelty and sequence novelty are different tests.
- Fit symbol associations and policy only on the training portion. Use a declared development portion for hyperparameters and stopping. Hash frozen parameters before touching the evaluation portion.
- Begin with three recorded seeds and a small bounded episode budget, set in an exact configuration file. Do not choose a successful seed after viewing results. If a first run is used for debugging, label it development and do not later reclassify it as untouched evaluation.
- Keep an event ledger of calibration, training, parameter freeze, first evaluation access, sampling, retrieval, role switches and responses. Hashes must bind actual loaded inputs, not merely prove that a log message was emitted before scoring.
- Unit tests may access oracle state to verify the environment. The agent may not. Include an interface test that changes unobserved world values while holding the supplied history fixed: the agent must receive identical inputs and produce the same deterministic action under a fixed random stream.

This is still a synthetic problem designed around the proposed variables. Held-out combinations within it do not establish biological validity, broad out-of-distribution transfer, or superiority over realistic recurrent models.

## Mandatory comparisons and interventions

| Condition | What it tests | Fairness boundary |
|---|---|---|
| Learned sampling plus episodic assembly | Whether the declared operations can work together | No privileged hidden state; all costs and role information recorded |
| Ordinary learned attention with the same memory and decoder | Whether the new label adds any behavior beyond an equivalent mechanism | Preserve a possible exact tie; do not weaken the comparator by removing its memory |
| Full record with a task-conditioned decoder | Changed readout versus changed temporary assembly | If all observations are supplied, identify this as an information-rich upper bound, not a cost-matched competitor |
| Fixed sampling/granularity with matched operation budget | Whether adaptive acquisition matters in this environment | Match allowed evidence and steps; report unused or redundant samples |
| Episodic-state reset at the switch | Whether a delayed target needs encountered history | Keep the symbol decoder and learned policy intact; no wholesale reset of every mechanism |
| Binding permutation plus inverse restoration | Whether a declared interface preserves entity roles | Invertible reassignment does not destroy information; score fixed and compensated readouts separately |
| Forced coarse assembly, with fine source observations unchanged | Whether a particular distinction is lost at retention rather than acquisition | Prevent renewed fine retrieval during a readout-only probe |
| No new sampling after a world change | Whether returned evidence is necessary | Keep old memory accessible; separate stale information from a learned decoding failure |

A small tabular attention learner is not a substitute for the stronger recurrent gating model discussed in the manuscript. Comparison to modern learned recurrent systems remains a later gate. The first application establishes executable scope and informative failure modes, not a win against those systems.

## Measurements, replay and acceptance

Report primary accuracy by demand family; which channels and relations were retained; fine/coarse confusion; binding and order errors; recovery following switches; confidence/calibration only if the model produces genuine declared probabilities; sampling and retrieval counts; record size; and separately measured controller work. Include per-episode results and an inspectable example of a successful and a failed sequence, not only means.

Auxiliary readouts use a frozen copy of the temporary assembly, with no access to the archive, world or policy. A separate re-retrieval condition may reopen the archive, but must be labeled as a new state transition. This implements the distinction established by Proposition 4 instead of assuming that every human probe has the same intervention semantics.

Before the prototype counts as implemented, checks must establish learned parameters differ from initialization, the agent cannot access hidden targets, training/evaluation separation is respected, episode memory changes from encountered evidence, selected actions alter returned observations, and a deterministic replay matches the stored outputs. Failed or tied comparisons are valid results; a unit-test pass is not an efficacy threshold. Acceptance of implementation does not imply acceptance of the scientific hypothesis.

## Resource and scope limits

One local CPU process, no model download, no GPU, no remote service and no recursive search. Save only compact configurations, parameters, event summaries and plots under this paper folder. First smoke run target: under 10 seconds; any longer planned run must be explicitly bounded before execution. No substance, medical, participant or animal data are included. The BICA paper, other existing manuscripts, Book 2, public providers and catalog are outside this application's write scope.
