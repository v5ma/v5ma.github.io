# Persistent-stream synthetic pilot readback

22 September 2026 · sequential post-result follow-up, not the original gate preregistration.

## Design and integrity

The [protocol](../application/PERSISTENT-STREAM-PILOT-PROTOCOL-20260922.md) was saved before the first execution of [the application](../application/persistent_stream_pilot.py). Four fitted gates use the unchanged 2,400-episode development generator from Draft 4; the fixed analytic, always-update and never-update controls require no fit. Each route then processes the same exogenous 210-event stream per seed: 50 old-context visits, 100 new-context visits and 60 revisits across six contexts. All routes have one persistent shared three-coordinate weight vector and the same candidate step, input observations, four-prior-observation warmup and fixed decision threshold. Five test seeds were fixed in advance. Hidden target weights are used only to generate observations and score noiseless error, not as gate inputs.

The run passed **247/247 finite checks**, including per-route prior-history and weight-transition checks. Immediate rerun produced byte-identical [result JSON](../application/results/PERSISTENT-STREAM-PILOT.json), SHA-256 `618930A537DB9BC14EC05761300AEA6DF651EE217375ABE358918346648BA3AE`. These checks verify this implementation, not a broad scientific result. The script includes all seed-level outputs, not merely the means below.

## Five-seed arithmetic means

| Route | Writes out of 186 eligible visits | Final noiseless MSE, six contexts | Cumulative pre-update MSE through 210 visits |
|---|---:|---:|---:|
| Never update | 0.0 | 2.3333 | 2.3333 |
| Always update | 186.0 | 0.4675 | 0.9204 |
| Scalar logistic | 186.0 | 0.4675 | 0.9204 |
| Raw-history linear logistic | 186.0 | 0.4675 | 0.9204 |
| Trajectory logistic | 163.6 | **0.1091** | 0.8428 |
| History-interaction logistic | 45.8 | 0.1403 | 0.7978 |
| Fixed analytic history rule | 69.4 | 0.2012 | **0.7226** |

These endpoints order routes differently. The trajectory route has the lowest **mean final error** in this small fixed pilot, but the analytic rule has the lowest **mean cumulative error**, and the history-interaction route has lower cumulative error and far fewer writes than the trajectory route. In the earlier independent-episode gate-classification test, the history-based controls also outperform trajectory features. One endpoint cannot be substituted for another after viewing the result.

Per-seed final errors are heterogeneous: the trajectory route ranges from approximately 0.0148 to 0.3353; the analytic route from 0.0479 to 0.5705; and always-update from 0.0227 to 1.8058. The five-seed mean is especially sensitive to a large always-update outcome in seed 62104. No inferential interval, external replication or new test-seed selection was planned. Report the full five-seed table from JSON when making a formal comparison.

## What this pilot does and does not establish

Unlike the prior proposal-classifier preflight, this program **does** make retained writes and tests after task switches. It therefore closes one narrow implementation gap. It does not implement the paper's complete transaction acceptance rule, a learned recurrent receiving mechanism, actual phase-qualified PWDs, a high-capacity model, published continual-learning comparators, an independent held-out family of environments or a later unrelated-task plasticity test. The task is linearly realizable by one small weight vector; the synthetic contexts are not evidence about hippocampal or cortical plasticity. The four fitted gates are transferred from a different independent-episode distribution, so their threshold behavior can shift severely; the scalar and raw-history linear gates commit every eligible proposal here. The result is best read as an engineering probe of endpoint tradeoffs and distribution shift, not a special trajectory superiority claim.

The prospective next study should train all candidate gates on *development streams of the same sequential task family*, freeze them, then test on held-out stream families with broader latent structures, return visits, contradictory/corrected relations, equalized compute and memory, and a strong published continual-learning method. Both final error and cumulative error, plus old/new retention and write cost, must remain primary or explicitly ordered outcomes before that run.
