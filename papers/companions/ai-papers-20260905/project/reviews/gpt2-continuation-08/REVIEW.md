# Draft 8: carried context, actual restoration and an inadequate semantic probe

Review date: September 5, 2026. Local development, same authoring agent. This is not independent review or a modern-model replication. Final packet certification requires all eight native-audit receipts to pass; no passing aggregate receipt substitutes for those readout checks.

## What was tested

The [protocol](../../applications/PROTOCOL-GPT2-CONTINUATION-08.json) and [prepared cases](../../results/gpt2-continuation-08-prepared/FAMILIES.json) were fixed before the new continuation runs. All thirty-two recipient prompts from the previously exposed Draft 7 set are used: eight families, both giver roles and two book colors. This is diagnostic follow-up, not a newly untouched test set or new fitting.

One root residual edit is followed by two branches from its retained KV cache. The fixed continuations are “ someone. The giver was” and “ someone. The color of the book was.” No generated name or correct target is fed back. The branches share a root state but are not one uninterrupted generated conversation. Later-token computation receives no additional residual patch.

Ten arms include no edit, four frozen learned matrices, reflection, residual donor, complete prefix donor, and upper-/lower-cache restoration of the internal edit. The full prefix donor carries a differently computed source history and richer information. Restoration changes future state, not the already produced root answer. The [primary-source/implementation check](../../sources/CACHE-CONTINUATION-METHODS-08.md) credits established autoregressive caching and exact GPT-2 computation rather than claiming a new cache mechanism.

## What the data establish

All 4,608 support rows conform to the specified graph: a final-token edit after block 8 changes neither prior-token cache entries nor current-token key/value entries in layers 0–8. Effects are confined to the later layer entries at that root boundary. Replacing layers 9–11 with their original cache entries restores the complete original root cache. Replacing layers 0–8, which were unchanged, preserves the edited cache.

The corresponding future decoder outputs agree exactly with these controls. Upper restoration reproduces the original continuation; lower restoration reproduces the internal-edited continuation. The internal edit's mean maximum vocabulary-logit change is 0.4210 for the giver branch and 0.5537 for the color branch. It changes no giver top token and two color top tokens. A nonzero numerical effect and a changed native answer are distinct observations.

For color, no edit answers 21/32 correctly; internal editing 20, task 21, yoked 21, ridge 20, reflection 21, residual donor 20 and complete prefix donor 21. All [thirty aggregate rows](METRICS.csv), [480 paired rows](PAIRED-DETAIL.csv) and [160 complete-contract rows](CONTRACT-DETAIL.csv) are retained. These color results cannot be interpreted as a direct improvement over Draft 7: the continuation text and intervention history differ.

## Baseline defect: do not turn a floor into a theory verdict

The unedited model answers the natural giver correctly in **0/32** cases. It produces an unrelated vocabulary token in 29 and the other person's name in three. Those three wrong natural answers coincide with the nominal swapped target even without an intervention. Counting them as successful controlled role reversal would be a causal error. The complete-prefix donor also gives zero correct swapped-giver answers, despite providing the correctly reversed textual source history.

Every arm consequently has zero complete six-readout groups under the nominal swap target. These zeros cannot distinguish a deficient semantic intervention from a model/prompt pairing that lacks baseline competence. [Baseline adequacy](BASELINE-ADEQUACY.json) is an explicitly post-hoc diagnostic, not a threshold secretly added to the original protocol. No cases are filtered, changed or rerun with easier wording inside this experiment.

The valid conclusions concern executed cache support, persistence and restoration under controlled inputs. The assay does not demonstrate a coherent edited world model, useful continued role reversal, or failure of SAN's complete receiver-relative proposal. A stronger follow-up must establish baseline task competence on development-only prompts before freezing untouched evaluation wording and cases. A contemporary instruction-capable model is a materially relevant next target, not something this GPT-2 baseline can stand in for.

## Actual authority workflow

The first family adds four explicit signed-request workflows. Each first authorizes and executes the internal root edit, then accepts stop_future_edits, rejects a forged restore request, accepts restore_original and rejects an old signed replay. Twenty real store events are retained. After each accepted stop/restore request, both continuations run anew: sixteen actual post-event model readouts, not reused observations.

Stopping future edits retains the already modified cache and reproduces the carried-edit continuation. Restoring the original source-conditioned cache reproduces the unedited continuation. These are different requested operations, not evidence that stopping future edits violated its own definition. The explicit restoration requirement is not silently substituted for prospective revocation. Restoring the cache cannot undo a previously displayed answer or an already executed external action.

The fixture uses a public signing key and known source caches. It does not learn natural-language instruction meaning, recover unknown original state, provide cryptographic deployment security or change GPT-2's weights. This supplies an actual temporal counterpart to Draft 7's disclosed readout-reuse authority test; it does not retroactively change what that older experiment executed.

## Verification and resources

Eight serial one-thread batches took 234.08 seconds total, with individual runs of 27.61–33.17 seconds. There were 5,252 incremental decoder steps, 228 actual root readouts including four fresh authorized roots, and 656 actual continuation readouts including sixteen post-request probes: 884 actual measured outputs. The 320 tabulated primary root rows include repeated controls and donors; they are not 320 independent root computations.

The trace/metric audit reconstructs every target, outcome, event signature and state-selection record. All 61 cumulative application tests pass. All eight native reconstruction checks now pass, with zero discrepancy in compared logits and matching saved states/cache digests. These bounded family checks share the already validated adapter and a frozen prior reconstruction formula. It is same-author verification, not independent implementation or independent scientific review. No full-pipeline byte-identical replay is claimed.

No new training, model download, persistent full-cache copies, theorem-count increase, source-original edit, publication or other-task message occurred. The current formal total remains 31 previously accepted Lean statements. The new deterministic-continuation argument is ordinary conditional mathematics, not a newly compiled proof or evidence of privileged self-access.
