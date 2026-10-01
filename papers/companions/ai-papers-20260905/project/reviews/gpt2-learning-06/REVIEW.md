# Draft 6: learned GPT-2 correction, matched feedback, and adverse controls

## Outcome

A small correction layer learns edits that change outputs on newly specified names and templates without reading a clean donor state during evaluation. However, it does **not** demonstrate paired-role recovery or an advantage from live internal feedback. Internal and yoked feedback each produce four of sixteen correct native outputs; ordinary task feedback produces five and supervised fitting nine. Every active learner's successful answer occurs in a family where it returns the same name under both opposite roles. None gets both roles correct in any held-out family. Clean-text correction yields fourteen correct outputs, and the current-state donor oracle twelve. These are distinct controls with different information and computation costs, not equally informed competitors.

This advances the application from static donor replacement to explicit learned parameters. It does not complete the full SAN/NMC self-regulation claim, establish a new interpretability algorithm, or validate frontier AI alignment. The two papers share this experiment and must not count it as two independent replications.

## Frozen design and actual learning

The [protocol](../../applications/PROTOCOL-GPT2-LEARNING-06.json) precedes training. The same pinned GPT-2 export and graph adapter are used; no additional weights or framework were downloaded. Eight cases from the four original development families supply clean/corrupted paired states. A rank-four subspace, center and scales are fitted only from those training states. All policies share this teacher-derived infrastructure. Sixteen new evaluation cases use eight new template/name families, all defined before training; evaluation begins after parameter hashes are saved. The grammar/task remains related to training, so this is not task-domain transfer.

Each learner owns a 4-by-5 parameter matrix, initially zero. It maps standardized corrupted-state coordinates plus a constant to an edit within the fixed residual subspace. Twenty coefficients are adapted online, but 3,845 common preprocessing scalars are also fitted/supplied; the basis is not free information. An edit-norm cap and parameter-norm cap bound interventions. In the uncapped region this is a restricted form of an established representation edit; [the ReFT comparison](../../sources/REFT-AND-LEARNED-CORRECTION-06.md) provides the algebra and credit.

At each of eighty training steps, one coefficient is perturbed by +0.25 and −0.25. Both candidates run through the original decoder. Their received reward difference selects a +0.5, zero or −0.5 update, followed by parameter projection. This is a simple coordinate search, not a newly invented optimizer or a reproduction of LoReFT's full training procedure.

Internal feedback measures actual downstream attention-9 value-tensor error relative to the corresponding clean training tensor. Task feedback uses the native full-vocabulary log probability of the intended name. The yoked arm receives the internal arm's pair from the opposite-giver case within the same epoch, not a reward for its own current intervention. Constant feedback is zero for both candidates. A separately instantiated external controller receives exactly the internal controller's scalar pairs and matches its complete parameter history. Reuse of those measurements is explicit: it is not a second independent set of decoder inferences.

Training produces 640 actual candidate measurements, 400 accepted receiver-update records across five controllers, and 82 subsequent attack attempts. Four measured policy trajectories use 748 decoder steps in 35.44 seconds. The separately run evaluation uses 656 steps in 33.16 seconds. Both use one numerical thread. No long-running helper remains necessary between stages.

## Full held-out outcomes

| Condition | Correct native output / 16 | Invalid task token | Mean target probability | Relative downstream error |
| --- | ---: | ---: | ---: | ---: |
| Clean text | 14 | 2 | 0.4018 | 0.0000 |
| Corrupted, no edit | 0 | 2 | 0.0122 | 1.0000 |
| Internal feedback | 4 | 4 | 0.0940 | 0.7055 |
| Matched external | 4 | 4 | 0.0940 | 0.7055 |
| Task feedback | 5 | 3 | 0.1346 | 0.7117 |
| Yoked feedback | 4 | 5 | 0.0939 | 0.5697 |
| Constant / reset / mean delta | 0 | 2 | 0.0122 | 1.0000 |
| Supervised ridge | 9 | 6 | 0.1744 | 0.1627 |
| Current clean donor oracle | 12 | 4 | 0.2473 | 0.1042 |
| Internal learner, forged feedback accepted | 4 | 1 | 0.1285 | 1.0521 |

All thirty split/condition aggregate rows and all individual cases remain available in [the data](../../results/gpt2-learning-eval-06/metrics.csv). Each family has two paired orientations; there is one checkpoint, not sixteen independent learned models. No p-value or population generalization is claimed. The new cases differ from Draft 5's evaluation, so its seven-of-sixteen donor result is not a directly comparable learning baseline.

The supervised comparator has richer training information: it directly fits projected clean-minus-corrupted targets. Its result is not an equal-query victory for one feedback signal. Similarly, the clean-text and donor-oracle controls know the correction that the primary adapter must approximate. The matched external and yoked controls answer different questions: the former matches information and update policy; the latter removes action-contingent feedback but can retain task-related structure. The yoked tie prevents a claim that useful transfer here uniquely depends on live internal feedback.

The mean training delta cancels because both directions of every paired role reversal are included. That is a design property, not evidence that fixed steering can never work. The learned adapter still makes substantial errors. The later-state measurement is not a sufficient proxy for useful native action: yoked feedback has lower average downstream error than internal feedback while yielding the same number of correct outputs.

## Post-hoc paired-role diagnostic

The [pair summary](ROLE-PAIR-SUMMARY.csv), [individual pairs](ROLE-PAIR-DETAIL.csv) and [analysis receipt](ROLE-PAIR-RECEIPT.json) add a post-hoc diagnostic without replacing frozen endpoints. Each held-out family has two opposite target roles. Clean text gets both right in seven of eight families, the donor oracle five, supervised ridge three, and every active-feedback learner zero. All four internal successes, five task-feedback successes and four yoked successes arise in same-name collapsed families. Thus the individual accuracy increase does not demonstrate recovery of the intended relation. A yoked tie is not the only limit: the more basic relational outcome fails.

[Five finite Lean statements](../../formal/paired-role-06/PairedRoleMetric.lean) explain why a constant named prediction can improve aggregate accuracy yet never recover both opposite roles. The [compiler receipt](../../formal/paired-role-06/verification-attempt-01/RECEIPT.json) reports no axioms or admitted proofs. A [nine-case executable bridge](../../formal/paired-role-06/EXECUTABLE-BRIDGE.json) also reconciles 120 experimental pairs. This is a tested finite correspondence, not formal Python refinement or an independent scientific result. These findings constrain the present implementation and reporting, not a compressed substitute for the entire SAN/NMC argument.

## Actual authentication, poisoning, persistence and revocation

Feedback messages include the training step, coordinate, current parameter digest and both measured rewards. The receiver checks freshness, source-state agreement and signature before changing its coefficients; finite numeric and coordinate controls are tested. The signing key is public fixture material. This is a typed local research interface, not a hardened untrusted network API or a cryptographic security proof; malformed arbitrary Python objects are outside the tested protocol.

After training, each guarded/unverified internal-controller clone receives a replay and forty invalid-signature parameter-driving messages. Attack envelopes are built against each clone's actual current state; after divergence they are not falsely described as byte-identical messages. Guarded parameters remain unchanged. The unverified clone accepts the fresh forgeries. On held-out cases its correct-output count remains four, but prohibited recipient proposals increase from eight to eleven and downstream error exceeds the original corrupted baseline. Mean target probability increases despite this worse prohibited-proposal count. Success count alone would conceal the damage; the experiment must not falsely claim that held-out accuracy decreased.

Persisted internal parameters match the last live training digest and their reloaded outputs match exactly. Setting coefficients to zero reproduces the unedited model. Revoking permission to edit actually removes the intervention from the decoder call; the learned matrix remains stored but no longer changes that output. These are distinct state manipulations. They do not show GPT-2 forgetting or autonomously understanding revocation.

The companion virtual-action monitor receives five actual authority stages per model readout, yielding 1,800 events. It rejects all prohibited virtual execution under trusted scope labels. After legitimate narrowing, useful-action counts match correct-name counts. No real send/export occurs. The signed scope and semantic target remain supplied fixtures, not independently interpreted human instructions.

## Verification and remaining gates

The [trace audit](TRACE-AUDIT.json) reconstructs all 400 parameter updates and 82 attacks and passes 42 cumulative application tests. The [native training audit](NATIVE-TRAINING-AUDIT.json) recomputes all 640 candidate measurements with separate reconstruction code in the actual decoder. The [native evaluation audit](NATIVE-EVALUATION-AUDIT.json) similarly recomputes all 360 readouts, their saved downstream tensors and 1,800 authority transitions. The [complete metric audit](METRIC-AUDIT.json) checks every field in thirty aggregate rows. These are same-authoring-agent checks using the shared validated decoder interface, not independent review.

The existing 26 Lean statements remain unchanged; the separate paired-role kernel adds five, for 31 accepted statements across four files. The affine-map derivation and numerical equivalence test clarify the existing-method relationship but add no formal theorem count. Future experiments need independently varied correction intents, paired-role endpoints, stronger teacher-free/equal-information baselines where appropriate, broader tasks and models, and actual DeepSeek/modern instruction-tuned evaluation. Independent source, scientific, statistical, code and formal review remain required, followed by remaining substantive drafts, house-style PDF production and author readback. Nothing has been published or sent to another task.
