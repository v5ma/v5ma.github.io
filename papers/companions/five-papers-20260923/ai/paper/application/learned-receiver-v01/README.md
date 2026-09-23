# Learned receiver with protected retained updates — v1 result

23 September 2026 · private synthetic application · **mixed/adverse comparative result**

This application replaces the earlier prescribed decay with a trained recurrent receiver and connects it to a development-trained proposal gate, exact protected-set acceptance, durable writes, later acquisition and explicit state interventions. It is a substantial construction beyond the earlier scaffold. It does **not** establish a general advantage of trajectory control, strong recent-history use, complete self-regulated lifelong learning, or a biological mechanism.

## Read and reproduce

- [Pre-run protocol](PROTOCOL.md), [frozen experiment](experiment.py), [run freeze](RUN-FREEZE.json), and [development seal](development/SEAL.json).
- [All eight-stream results](evaluation/RESULT.json), [independent event audit](AUDIT.json), and [exact replay receipt](../../../access/0e512bef3455ddd1.md).
- [Exact parameter states and reset/removal/restoration results](state-interventions/RESULT.json).
- [Finite empirical protection and projection boundary](MATHEMATICAL-BOUNDARY.md).
- [Corrected work accounting](COST-ACCOUNTING-CORRECTION.json), described below.
- [Seed-level figure](figures-v2/LEARNED-RECEIVER-HELDOUT.png).

The four producer phases are `python experiment.py check`, `develop`, `evaluate`, and `replay`; they refuse to overwrite existing results. A fresh reproduction requires a new scoped output copy, not deleting this record. `audit.py` independently checks the 64 fixed event ledgers. `state_interventions.py` reconstructs every retained parameter vector from accepted writes. No external dataset/model download is involved.

## Main result

The receiver has 273 trained parameters; each of four fitted gates has 11,209 parameters plus 930 standardization floats. Development used 12 streams (2,640 candidate labels); four other streams (880 labels) were used only for descriptive validation, not hyperparameter selection. The fixed 40 epochs and 0.5 threshold were retained. Eight new final streams comprise four polynomial-family and four sinusoidal-shift streams. Each arm receives the same 220 observations per stream. All gates were fitted before those streams were opened.

| Method | Polynomial pre-feedback MSE | Shifted-rule pre-feedback MSE | Mean accepted writes, polynomial / shifted |
|---|---:|---:|---:|
| Ordered trajectory gate | 0.40837 | 0.49686 | 19.00 / 14.00 |
| Complete-history gate | 0.41427 | 0.49426 | 19.00 / 13.75 |
| Permuted-trajectory gate | 0.40388 | 0.49780 | 20.50 / 18.00 |
| Scalar gate | 0.40795 | 0.48782 | 0 / 0 |
| Always propose + protection | 0.40365 | 0.49071 | 66.50 / 61.25 |
| Replay-gradient + protection | 0.40161 | 0.49195 | 101.75 / 98.25 |
| A-GEM-style projection + protection | 0.39361 | 0.47014 | 113.00 / 104.50 |
| Frozen receiver, changing temporary history | 0.40795 | 0.48782 | 0 / 0 |

These are means of four specified synthetic streams per column, not results on independent real datasets. The paired ordered-trajectory minus history differences are -0.00590 in the polynomial family (lower error on 4/4 streams) and +0.00260 under the sinusoidal shift (lower on 2/4). The A-GEM-style arm has lower average error in both families. Permuting trace coordinates does not produce a consistent impairment: it improves the polynomial mean and slightly worsens the shifted mean. Thus neither general trajectory superiority nor a necessary ordered-trace contribution is demonstrated. Small seed counts, one architecture and one protocol do not justify a universal negative conclusion either.

The scalar classifier's development-validation accuracy is 0.86818 while it proposes no writes, and its final predictions equal the frozen control exactly. Development has a low positive-label prevalence. Accuracy without proposal/retention/acquisition outcomes is misleading here; it must not be presented as a successful selective learner.

## Retained competence and later acquisition

All accepted changes satisfy the actual fixed-set check; maximum allowed total increase is 0.02 above the trained initial receiver. The same-set incremental limit is 0.0002. This protection does not prove population-level retention and does not cover every later-acquired relation. Independent base probes and every phase's results are retained in the result JSON.

For the ordered-trajectory arm, mean later-task error is 0.27365 after the preceding stream versus 0.25994 when starting that later phase directly from the warmup state; under shift those values are 0.46114 and 0.44893. This comparison does **not** show preserved-or-improved future learning: the preceding stream is slightly adverse on this endpoint. It is not by itself evidence of intrinsic neural loss of plasticity, because parameters, recent context and consumed protection allowance differ.

After temporary context is zeroed, the trajectory arm's mean later-task probe loss changes from 0.27298 to 0.25536 in the polynomial family and from 0.34629 to 0.32568 under shift. There is therefore a bounded retained parameter effect that is not solely expression of temporary history. Last-write removal and exact vector restoration are reported separately for every seed and endpoint; individual effects need not be beneficial. This is a software parameter intervention, not physiological lesion/rescue.

An important qualification is the weak direct recent-history effect in the fitted receiver: replacing the final four-event context by zeros changes later-probe predictions by mean RMS only 0.00061 and 0.00092 across the two families. Long-term learned weights affect reception, but the existence of a history input alone is not evidence of a strong carried-state mechanism. The next architecture study must test a task where retained recent context is genuinely required, rather than claiming this dependency from the wiring diagram.

## Checks, resources and an exposed counter correction

All 273 analytic derivatives match central finite differences; maximum error is 7.12e-10. The initial suite passes 12/12 contract checks. The separate ledger audit passes 417/417 checks across 14,080 final encounters, including observed-stream identity, accepted/rejected state chains, exact metrics, protection and two mutation tests. The full result and all 64 event ledgers replay byte-for-byte. Post-result state reconstruction/restoration passes 256/256 bounded checks. These are software evidence counts, not biological replications or statistical sample sizes.

Single-threaded execution used approximately 6.42 seconds for development, 8.58 seconds for final evaluation and 10.84 seconds for replay in this run, excluding process launch. These are illustrative whole-phase timings under this machine's load, not matched per-arm speed measurements. Gate weights are much larger than receiver weights, and different arms have different actual work. No efficiency or equal-FLOP superiority claim is justified.

Review after execution found one **accounting-only error**: the frozen forward-MAC counter charged the input projection four times although it is computed once. Its 584 count per receiver example should be 488. The separate correction receipt recomputes all 64 rows and adds the previously uncounted gate forward products (11,184 per invocation). It excludes backward/nonlinear/normalization/data-movement costs and must not be called a complete FLOP estimate. Original code and receipts are preserved; no fit, event, prediction, ranking or parameter intervention changes.

## Prior-work and source boundaries

The protected projection arm uses the halfspace formula from Chaudhry et al., [A-GEM section 4 and appendix C](https://arxiv.org/html/1812.00420v2). It changes their classification/task-memory setup to regression with a fixed protected base and an additional exact acceptance check. It is a transparent adaptation, not reproduction of their published benchmark. The replay control is a simple same-memory gradient mixture, not an exhaustive survey of modern continual-learning systems.

The original author's complete mechanism remains the target. This version adds learned receiving, gate fitting, protected durable change, a later-task test and state-location checks. It still lacks a learned location/timescale mask, a controller that continues learning during final deployment, a context-dependent task demonstrating strong carried-state use, broad architectures and published benchmark datasets, and resolved earlier SAN-Cycle source ownership. Its current evidence supports a constructive synthetic methods result with adverse comparisons, not the complete stronger hypothesis. The 14 September source is preserved as a private, date-labeled working concept; this implementation does not establish its public priority.
