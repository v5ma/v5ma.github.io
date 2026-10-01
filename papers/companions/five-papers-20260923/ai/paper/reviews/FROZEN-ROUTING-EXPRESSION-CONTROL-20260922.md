# Frozen-parameter expression control: result and limitation

22 September 2026 · private application readback for *Selective Dissipation for Continual Learning*

## Frozen question and execution

The [pre-run protocol](../application/FROZEN-ROUTING-CONTROL-PROTOCOL-20260922.md) asked whether later behavior can improve with **zero writes to stored expert coefficients**. The [standard-library application](../application/frozen_routing_control.py) generated eight seeded streams, each with eight 24-event phases and a hidden per-phase sign. All routes saw the same x and noisy y stream for a given seed. Boundaries were visible but context identity was not. The frozen route updated only a two-expert posterior after feedback; coefficients -1 and +1 were preloaded and immutable. The fixed mixture did not update; the single-weight SGD route wrote a coefficient after each feedback. The sign oracle knew the hidden context and is an unfair lower-bound reference.

Across all eight seeds, the frozen route had lower prequential MSE than the fixed mixture. Mean MSEs were 0.16655 (frozen route), 1.11893 (fixed mixture), 0.23608 (phase-reset SGD), and 0.12395 (sign oracle). The first-event MSE was identical for the two equally initialized mixture routes, 1.08422, whereas their later-event MSE was 0.12665 versus 1.12044. The frozen route made **zero expert-parameter writes** and 192 belief updates per 192-event stream. SGD made 192 coefficient writes. The 96 finite/code-contract checks passed. The [full per-seed JSON](../application/results/FROZEN-ROUTING-CONTROL-20260922.json) preserves scores, phase signs and stream hashes; an immediate rerun was byte-identical.

| Seed | Frozen route MSE | Fixed mixture MSE | Phase-reset SGD MSE |
|---|---:|---:|---:|
| 73101 | 0.190699 | 1.061481 | 0.246883 |
| 73102 | 0.146178 | 1.077831 | 0.212925 |
| 73103 | 0.176126 | 1.134907 | 0.253987 |
| 73104 | 0.161916 | 1.103859 | 0.235497 |
| 73105 | 0.161412 | 1.116926 | 0.220535 |
| 73106 | 0.174479 | 1.172773 | 0.241941 |
| 73107 | 0.123430 | 1.124477 | 0.201932 |
| 73108 | 0.198171 | 1.159164 | 0.274918 |

SHA-256: protocol `BE716C81FF2F91326875C7DE86211ADCECC3AA6CD4D11484585BF2DDE34CF1A0`; script `FC96810EE164F9E0AD689825995961438815AA55F17DF6C6AE27FE812E392A1C`; result `27AB96EA637FB41E2413D3DD2DDB606F14015D1E09CDCC3D02FC06C1FD9D8985`.

## What the result proves and does not prove

For the specified Gaussian generator, the log likelihood ratio after each observed x,y is exactly 2xy/sigma²; the mixture prediction is x*tanh(L/2). Thus the model's *stored* expert coefficients can stay fixed while current predictions and behavior change through context inference. This is a constructive counterexample to the inference “performance improved, therefore the stored model was rewritten.” It is not a claim that the system made no state update: its posterior/belief changed after every feedback. Heald, Lengyel and Wolpert's [contextual-inference study](https://pubmed.ncbi.nlm.nih.gov/34819674/) is the relevant biological and behavioral analogy, not a validation of this artificial generator.

The frozen route was handed the **correct two experts and true noise scale** in advance; SGD had to estimate one coefficient from scratch after each visible phase boundary. Their numeric ordering is therefore not an equal-capability benchmark or a selective-dissipation win. The synthetic sign task has neither conflicting lifelong tasks nor protected-set acceptance, rollback, learned receiver dynamics, phase-qualified PWDs, or future-plasticity evaluation. The 96 checks are local consistency checks, not independent review. This result tightens the paper's later-probe interpretation: a changed response needs a control separating durable parameter/structure change from changed routing or expression.

## Consequence for the decisive application

Log separately: (1) durable accepted writes; (2) transient controller and context-belief updates; (3) readout routing; (4) old-task retention after transient state reset; and (5) new-task and later-unrelated-task acquisition. Run a matched frozen-parameter routing model with the same feedback and task-boundary information. A claimed retained-write benefit must persist under the relevant reset and exceed what routing of pre-existing knowledge can explain. This control sits alongside, not instead of, strong same-history gates and published continual-learning comparators.
