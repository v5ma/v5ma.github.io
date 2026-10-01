# Intent and selectivity: primary-methods intake for Draft 7

Date: 2026-09-04. Scope: two exact primary papers; no repository scan, benchmark download, or new checkpoint. This note precedes analysis of the new GPT-2 assay. It does not claim a full technical review of either entire paper.

## RAVEL is a strong comparator, not a missing prior idea

[RAVEL: Evaluating Interpretability Methods on Disentangling Language Model Representations](https://aclanthology.org/2024.acl-long.470/) explicitly combines causing an intended attribute change with isolating other attributes from that change. Its entity and context evaluations separate different forms of generalization. The methods include an intervention-only baseline, established representation methods, and multi-task distributed alignment search with both cause and isolation objectives. Relevant instances are generally selected for baseline model correctness. These are existing operational tests of selective causal editing, not merely static feature labels.

Read scope: abstract and introductory framing, Sections 2 and 3, Section 4.1, and the opening of Section 4.2 in the [primary PDF](https://aclanthology.org/2024.acl-long.470.pdf). Later results and appendices were not comprehensively read. Extracted text was inspected; an attempted browser PDF screenshot did not return a usable image and supplies no visual-review evidence.

Implication for our paper: the new assay must report both role changes and a color-preservation test, and must not claim that SAN invented selective intervention, causal steering, or multi-objective alignment search. Our tiny fixture is not a RAVEL/MDAS replication. We retain all fixed cases, including baseline failures, so its denominator differs from correctness-filtered benchmarks.

## Causal abstraction already addresses high-/low-level correspondence

[Causal Abstraction: A Theoretical Foundation for Mechanistic Interpretability](https://jmlr.org/papers/v26/23-0058.html) formalizes relations between higher- and lower-level causal systems, including approximate transformations and interchange interventions. Faithfulness depends on specified state and intervention mappings and an evaluation distribution. A nominal alignment can fail to be well-defined when it maps the same partial low-level state to incompatible high-level values. Interchange-intervention accuracy is evidence on the tested interventions, not an unrestricted exact-equivalence theorem.

Read scope: abstract, contents, parts of the introduction, complete Sections 2.4 and 2.5, and the start of the equality example in Section 2.6 in the [primary PDF](https://jmlr.org/papers/volume26/23-0058/23-0058.pdf). The entire 64-page paper was not reviewed. These pages were read as extracted text, not certified by image inspection.

Implication for our paper: define the requested high-level operation separately from the residual-state edit, then test their correspondence. Invertibility of the residual map cannot establish correctness of a semantic role swap. We claim neither a universal commuting diagram nor successful disentanglement from a small count of interventions.

## Prospective follow-up

The [frozen protocol](../applications/PROTOCOL-GPT2-INTENT-07.json) uses a structured keep/swap cue, opposite giver roles, two colors, two query types, eight new constructed families, and the previously frozen GPT-2 checkpoint and learned matrices. It adds a standard subspace reflection and intent-blind/wrong-intent controls. The same edit is applied to both query types under an authorized swap; the color test is not bypassed by a query-specific gate. Keep remains an engineered no-op, not demonstrated learned understanding.

There is no new fitting, external preregistration, human-oversight measurement, or inference about frontier-model performance. Algebraic reversibility, selective model behavior, legitimacy of a request, and enforcement at a virtual action boundary remain separate claims. Native full-vocabulary failures and unchanged unrelated outputs will both be retained. No positive result is assumed by the construction.
