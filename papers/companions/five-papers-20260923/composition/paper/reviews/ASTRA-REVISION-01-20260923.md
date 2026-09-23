# Composition paper: Astra revision 1 receipt

23 September 2026. Private, bounded correction pass owned by the Composition paper worker. No publication, PDF rebuild, new training, book edit, provider action or mutation of the frozen experiment was performed.

## New manuscript and scope

[Revision 1 manuscript](../../access/afa572c8d94f7c86.md) addresses C01/C02/C04 and the bounded C03 literature route in the [five-paper review](../../access/22e56579b414f9dd.md). It was created by a guarded byte-preserving copy of the private final, then edited separately. The historical final remains the source of the frozen evidence, not an implicitly replaced file.

The author's scope is retained: composition includes multimodal, remembered, bodily, imagined and prospective relations. No criticism or comparator is used to redefine the paper as visual acuity alone. Original author intake was read directly at `AUTHOR-INTAKE-AND-TITLE.md`. The source-recovery method guided full-argument preservation and primary-source attribution; this pass did not attempt an exhaustive new genealogy or priority audit.

## C01: actual sequential-query contract

The manuscript now distinguishes planning a two-view node from executing both requests. `Agent.query` attempts features in order and aborts acquisition immediately on an unavailable view. Its subsequent readout can use compatible branches without obtaining another observation. The original protocol remains frozen; the new [protocol addendum](../applications/astra-contract-diagnostics-v01/PROTOCOL-ADDENDUM.md) clarifies its ambiguous pair-selection sentence without pretending the correction was prespecified before the September 8 runs.

The [new diagnostic](../applications/astra-contract-diagnostics-v01/check_contracts.py) imports the original policy and three frozen mixed trees. All six fixtures pass:

- Missing earlier focal observation: only `(8, 2, -1)` is logged, zero sensor calls and zero new acquisition bits; feature 21 is not attempted.
- Coarse earlier focal observation present: feature 8 is retrieved, then feature 21 is sampled; one new sensor call, two new nominal bits.

The historical evaluation archive independently confirms 240 unavailable-first-view cases among 384 mixed-policy second-query temporal records. Those 240 make no later request and acquire zero new bits. The archive also reproduces query-two accuracy 0.8567708333333334 for both mixed and fine-only, with mean acquired widths 1.9609375 and 2.5 respectively over 3,072 records per condition. These are readbacks, not a new evaluation sample.

The corrected estimand counts category widths of completed new acquisitions, excluding unavailable attempts and retrievals. It charges a new fine sample two bits even when a coarse observation was previously acquired. The training heuristic's extra view charge and actual operation counts are separate. The old results are preserved; they describe an availability-aborting policy, not an unconditional-pair policy.

## C02: fixed-weight additive equivalence, including zero-role tokens

Section 5.16 now gives the exact gate transformation. For physical rows P, role rows R, bias b, a0 = 0.5 tanh(b_A), and ag = 0.5 tanh(A[g,:]+b_A), fold:

    b' = b + a0 @ P
    R'[g,:] = R[g,:] + (ag-a0) @ P

This proves preactivation equality on zero and one-hot roles; induction through the unchanged GRU gives state and prediction equality. Zero-role coverage requires the bias correction. The claim is not extended to arbitrary soft or multi-hot roles. The trained dataset's roles are one-hot; zero-role checks are additional controlled inputs.

All three selected additive fits (seeds 1729, 3253 and 7919) pass 18 bounded forward comparisons: eight training episodes, three role-token fixtures and two reset settings per fit. Maximum probability difference is **1.4988010832439613e-15**; maximum hidden-snapshot difference is **9.575673587391975e-16**. Every tested class decision agrees. The fold removes 77 redundant parameters, from 14,141 stored parameters to a 14,064-parameter ordinary core. It does not claim that training the latter from scratch would follow the same optimization path or performance trajectory.

The original additive and multiplicative results remain untouched, including temporal failure and seed-dependent comparisons. Multiplicative input adaptation introduces role-by-feature products; this additive fold does not eliminate them, nor does that observation prove strict separation of entire nonlinear recurrent function classes. A separately trained no-adapter baseline is still needed for a training/optimization claim.

## C03: two close primary comparators added

The manuscript adds references 29–30 and two short comparisons in Section 2.5. These were read from primary sources, not accepted from an earlier assistant's summary:

| Source identity | Access and exact inspected locations | Manuscript use |
|---|---|---|
| Franklin NT, Norman KA, Ranganath C, Zacks JM, Gershman SJ. *Structured Event Memory: A Neuro-Symbolic Model of Event Cognition*. Psychological Review 127(3), 327–361 (2020). DOI 10.1037/rev0000177 | [Author-hosted primary PDF](https://gershmanlab.com/pubs/Franklin20.pdf), title/abstract, pp. 330–331 model overview, pp. 335–336 inference passage, pp. 342–343 role/filler comparison and Figure 8. Targeted methods access, not a claim to audit every page or replicate SEM. | Explicit coordinate correspondence and residual joint-reconfiguration question. |
| Hassabis D, Kumaran D, Vann SD, Maguire EA. *Patients with hippocampal amnesia cannot imagine new experiences*. PNAS 104(5), 1726–1731 (2007). DOI 10.1073/pnas.0610561104 | [Primary full-text article](https://pmc.ncbi.nlm.nih.gov/articles/PMC1773058/), Results: Content, Spatial Coherence Index, P01; Discussion; Methods: Participants and Scoring. | Constituent-access versus coherent-construction comparison with sample, lesion, scoring and task limitations. |

The finite partition and biological configuration are not attributed to either prior. Neither paper is called confirmation of SAN. Source publication dates and current access date remain distinct. This is a bounded enrichment, not an exhaustive literature or novelty verdict.

## C04: one operational joint test now specified, not executed

New Section 6.8 specifies a relational-memory arena task in which an earlier auditory commitment, its speaker, present visible routes and self-location jointly matter to a later action. It defines measurable slot/graph C, B, Pi and H, encounter and reset rules, an unchanged archive versus active assembly boundary, costs, frozen readout, intervention checks, coordinate dependencies, ordinary recurrent and unchanged-episode countermodels, a fresh split and clustered analysis.

The prospective primary interaction measures how a binding swap's route consequence depends on retained fine-token distinctions and earlier-history access. Its constituent terms, engineering thresholds, inverse restoration and failure interpretations are explicit. A tie is underidentification, not falsification of a biological implementation. A training failure is not an animal result. The typed symbolic input is explicitly a relational-memory first instance, not a learned raw audiovisual system or measured experience.

**C04's specification gap is addressed; its empirical construction is not complete.** No candidate, new task generator or new held-out study was trained or run. The broader learned joint-control and biological applications remain future work. The manuscript retains a synthesis-and-diagnostic-methods genre rather than claiming an identified joint-control law.

## Reproduction, preservation and resource use

- [First result](../applications/astra-contract-diagnostics-v01/RESULT-01.json): 0.905 seconds.
- [Replay](../applications/astra-contract-diagnostics-v01/RESULT-02.json): 0.473 seconds.
- [Preservation/replay validator](../applications/astra-contract-diagnostics-v01/validate_revision.py) and [validation result](../applications/astra-contract-diagnostics-v01/VALIDATION-01.json).

One below-normal-priority CPU process, one numeric thread. Only explicit fixed paths were read. No regex, `rg`, recursive search, model training, new biological data download or heavy background job. The diagnostics compare source and selected-weight hashes with original freeze receipts, then verify every read original before/after execution. The original final PDF is unchanged; this worker did not rebuild it.

Pinned SHA-256 identities:

| Artifact | SHA-256 |
|---|---|
| Original private final manuscript | `30cc7e27a74863d5fbcd8be8805a96baa7a090fa18f87be01c9bfb26ed997756` |
| Original final PDF | `29ece22c901a6c7c075f82fca8a25f4bd7336c00cfef6d530e443f2be9f48c53` |
| Astra revision 1 manuscript | `773ff9ba414367490f6caf9e78329040525ce7a3f21fb52f7fe34a0f9d193b29` |
| Original active agent | `898822e7ea0e26643cdcf1d319df324fc1aa7e880233ba1bbb6ffbe8f5017a4a` |
| Original context adapter | `df75c1145c3ccf6508a4fe6904dfb3f13e14e70b4c019370757b1f55cd6cb9c9` |
| Original GRU core | `8cc58515ebb283749069e91493410b44aaf4fac21273f4ddb73b8e15ffb463d4` |

The complete read-input hash set is in the result JSON. The preservation validator separately checks that only three old prose blocks were replaced (status, pair policy, bit-cost definition); all other old blocks, the thirteen figure lines, analytic section and first 28 references remain verbatim. Added material is not counted as evidence of an executed experiment.

## Remaining work for the integrating owner

Review the new operational experiment and its thresholds; decide whether to execute it as a new, separately frozen application. Add a trained ordinary no-adapter baseline only if claiming an optimization/capacity result. Perform the serialized approved-format PDF rebuild and its visual review, then repair portable supporting-material navigation. No full-paper publication readiness or completion of the user's broader empirical program is claimed by this correction receipt.
