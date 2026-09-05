# Draft 4 active-learning and transformer review

September 4, 2026. Authoring-agent review and separate-code audit; **not independent scientific review**.

## What changed

Both papers now have the explicit AI titles requested by the author, an active learning experiment, a real authenticated-feedback interface, a current transformer mapping, and new cumulative Draft 4 manuscripts. No earlier draft, compiler record, model weight or canonical source was overwritten.

The laboratory runs a two-context, three-action adaptive controller around the three previously trained MLPs. It learns which input-editing wire restores a stale selected grant, then faces reversed wiring. Internal probe feedback, native task feedback, opposite-wiring replay, constant feedback, fixed wiring, a wiring oracle and an identical external controller are retained. All learning uses the existing training worlds; evaluations use the existing donor-closed test worlds. These are shared development data, not an independent new corpus.

## Principal results

Each budget/policy/checkpoint aggregate contains six paired conditions: three saved networks and two starting wirings. There are 48 eligible virtual export opportunities. The 12- and 48-query budgets are per context per phase, not total experiment costs.

| Second-phase policy | Useful / eligible, 12 queries | Exact restoration, 12 queries | Useful / eligible, 48 queries | Exact restoration, 48 queries |
| --- | --- | --- | --- | --- |
| Internal feedback | 26/48 | 93.75% | 26/48 | 100% |
| Ordinary task feedback | 12/48 | 31.25% | 26/48 | 100% |
| Matched external controller | 26/48 | 93.75% | 26/48 | 100% |
| Yoked feedback | 2/48 | 6.25% | 2/48 | 0% |
| Constant feedback | 2/48 | 0% | 2/48 | 0% |
| Fixed identity wiring | 14/48 | 50% | 14/48 | 50% |
| Actual-wiring oracle | 26/48 | 100% | 26/48 | 100% |

The smaller-budget difference does not establish equal-information superiority: probe training and intermediate grant targets are supplied to one instrument, while another uses downstream task targets. At the larger budget ordinary task feedback ties internal feedback. The matched external controller produces exactly identical learner states. Neither comparison supports privileged endogenous access.

Exact input restoration leaves 22 of 48 eligible tasks incomplete because the fixed native model is imperfect. The internal learner still proposes 18 prohibited actions at the larger budget; the trusted final monitor rejects them. A zero mediated-violation count must not conceal these proposal failures.

After the wiring flips, the learned internal controller initially edits the wrong grant; useful completion returns to two. Continued feedback repairs its control. Saved-state reload preserves the table, but resetting the learned state removes the repair. No conversation history, transformer KV cache, weight update or autonomous language reasoning is modeled.

## Actual attack path and mathematical interpretation

The experiment sends a replayed authentic message and 72 forged messages through each of two receiver implementations for every internal-feedback condition. The signature-verifying receiver rejects all attempted messages and leaves its state unchanged. The unverified receiver rejects stale nonces but accepts the 72 fresh invalid-signature messages. At the larger budget those accepted messages reduce useful execution from 26 to two and induce off-target edits on every test input.

The attack is a constructed instrument imitation, not a production exploit. Its mechanism can be derived directly from the update. For a targeted action repeatedly rewarded with one, after n accepted updates the value is 1 - (3/4)^n (1 - Q0); for an alternative repeatedly rewarded with zero it is (3/4)^n Q0. The formulas follow by induction from the affine update. Initial values and accepted rewards lie in [0,1], so after twelve such updates the wrong action necessarily outranks the alternatives. This is an elementary application-level derivation, **not an additional Lean-checked statement**. Rejected messages cause no update at all.

Authentication uses a public test key under a simulated trusted-instrument boundary. It does not establish ethical reward correctness, prevent a holder of that key from forging messages, or formally verify the Python implementation. The source-paper composition and update-preservation theorems retain those assumptions.

The previous encoder assay's forged-origin field remains an unexecuted control in that historical run. A new attack on a different receiver interface does not retroactively certify the older experiment.

## Audit and reproducibility

- [Frozen protocol](../../applications/PROTOCOL-ACTIVE-RECEIVER-04.json) and [pre-run input hashes](../../results/active-receiver-04/INPUT-FREEZE.json).
- [Execution receipt](../../results/active-receiver-04/EXECUTION-RECEIPT.json): 84 conditions, 7,200 feedback events, 33,792 test decisions, 1,752 receiver-level attack events; about two seconds on one numerical thread, 9,063,109 data bytes before the small execution receipt.
- [Separate-code audit](AUDIT.json): every feedback transition, signature decision, native model probability, evaluation outcome and all 528 metric rows recomputed. Twenty-seven cumulative tests pass in [the test log](APPLICATION-TESTS.log).
- [Complete aggregates](AGGREGATES.json), [all metrics](../../results/active-receiver-04/metrics.csv), and [inspected result figure](figures/active-calibration-results.png).
- [Exact seven-artifact replay](../../results/active-receiver-04-replay-01/REPLAY-RECEIPT.json). Same code and machine; not independent replication.

One PNG/SVG result figure was visually inspected at native display size: both panels, labels, control arms and the denominator are visible without clipping. This is not final PDF or browser UI acceptance.

## Transformer obligation

The [architecture/acceptance contract](../../sources/TRANSFORMER-BRIDGE-AND-ACCEPTANCE-04.md) includes GPT-2, version-specific DeepSeek V3/V4 mechanisms and the R1-distill distinction. The new active learner is an MLP-based calibration test, not GPT-2 or DeepSeek. Original-model decoder interventions, stronger task semantics and modern-model replication remain open. RAVEL and ReFT are identified as substantive existing comparators; no reproduction of them is claimed.

## Remaining works gates

Ten substantive drafts are not complete. Independent source/science, statistical, code and formal review; generative transformer experiments; meaningful human/oversight evaluation for any claim requiring it; approved-format PDFs; rights checks; and author readback remain open. The 26 previously compiled statements remain the current formal count. No publication, commit, push, deployment, Book 2 or source-original mutation occurred.
