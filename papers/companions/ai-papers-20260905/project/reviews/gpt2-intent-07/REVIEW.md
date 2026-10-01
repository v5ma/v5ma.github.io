# Draft 7: intent, relational correctness and collateral behavior

Status: executed development assay with separate-code authoring-agent checks. Not independent review, external preregistration, a new editing algorithm, or a successful general self-regulation result.

## Prospective specification and provenance

[Protocol](../../applications/PROTOCOL-GPT2-INTENT-07.json), [preparation receipt](../../results/gpt2-intent-07-prepared/PREPARATION-RECEIPT.json), and [exact 64-prompt manifest](../../results/gpt2-intent-07-prepared/FAMILIES.json) were written and hashed before any new inference. Four templates, two new name pairs, both giver roles, two book colors and two query types form eight families. No baseline failure was filtered out, no new fitting occurred and no policy changed between the serial batches. The same pinned quantized GPT-2 model, rank-four basis and Draft 6 parameter matrices were reused.

Each of 64 prompts has eight actual original-model readouts. Two cues and twelve arms reuse those measurements to give 1,536 outcomes, not 1,536 distinct model calls. Per batch: 32 prompts, 256 readouts, 768 cue/arm outcomes, 256 request events and 816 incremental decoder steps. Execution took 35.203 and 35.328 seconds, on one numerical thread, without downloads or base-weight changes.

The structured cue chooses keep or swap independently of the two names. Recipient targets reverse under swap; color targets do not. The same residual edit is applied at each query's last token under an authorized swap. Keep is an engineered no-op. A standard subspace reflection and its capped variant use the pre-existing basis/center, not new output-dependent fitting. Reflection is an established orthogonal linear-algebra operation and an uncapped special case of the existing affine edit.

## Results retained in full

Swap recipient correctness out of 32: no edit 0, internal feedback 7, task feedback 8, yoked feedback 5, ridge 6, reflection 6, capped reflection 6, intent-blind reflection 6, wrong-intent reflection 0, current donor 12, textual update 24, revoked reflection 0.

The crucial relational result is zero complete opposite-role pairs for every learned and reflection arm out of sixteen family/color pairs under swap. The donor supplies four complete pairs and textual update twelve. Requiring both cues, both opposite giver roles and both queries yields zero complete groups for all learned/reflection arms, two for the donor and eight for textual update, out of sixteen. Under keep, intent-aware arms all reuse the unedited result and retain twelve complete recipient pairs. That is engineered routing, not learned cue interpretation.

Color correctness under swap is 24/32 without editing, 9 internal, 32 task, 21 yoked, 22 ridge, 17 reflection and 23 donor. All color rows remain in [METRICS.csv](METRICS.csv). In particular, the task arm's 32/32 color performance is retained alongside its zero complete swapped-role pairs. Internal editing loses fifteen baseline-correct color answers; reflection loses seven. Unchanged top-token counts and target probability are reported separately, since preserving a wrong answer is not preservation of a correct attribute.

The uncapped reflection returns to the original residual within maximum absolute error 1.90735e-6 and preserves the orthogonal complement within 1.84454e-6 in the measured float32 states. Its native role behavior nevertheless fails the complete-pair criterion. The capped reflection never reaches the existing cap in these cases and consequently duplicates the uncapped outputs; this is a null comparator, not independent corroboration.

## Authority and reuse boundary

The actual scope store accepts a signed current cue, rejects a forged opposite cue, accepts a signed revocation and rejects the old signed replay. All 512 event records are reconstructed, including 128 forged attempts and 128 stale replays. A separate supplied recipient scope mediates each virtual send. No unauthorized virtual execution occurs. Zero violations depend on that trusted interpretation and complete mediation; they are not evidence that the model learned legitimate scope.

The request-routing experiment reuses precomputed readouts. In particular, revocation selects the measured unedited readout; it does not trigger a new forward pass after each revocation event. The protocol shorthand “runs without a patch” must not be read as evidence of such an additional temporal model run. The earlier Draft 6 actual decoder-revocation test remains separate. Textual update likewise reuses an already executed complete opposite-role prompt and is explicitly a richer-information fixture control. Revoking an edit is not the same as revoking permission for every downstream action.

## Strongest-form interpretation and limitations

RAVEL already combines intended causal change and isolation of other attributes, and causal abstraction already specifies high-/low-level correspondence. [Methods intake and exact read scope](../../sources/INTENT-SELECTIVITY-METHODS-07.md) credits these approaches in their strongest relevant form. This is not their benchmark replication or a proof of an unrestricted causal abstraction.

The color query appends the natural recipient and a new sentence ending in “was,” whereas the recipient query ends in “to.” They therefore address different terminal positions and contexts. Every query starts from its own prefix cache. The assay tests cross-query collateral behavior of a frozen edit, not persistence of one edited latent world across questions or isolation of a single semantic feature. Failure can reflect a position/context-distribution mismatch as well as an inadequate learned role transformation. A query-sensitive controller or joint-state intervention remains a legitimate stronger alternative, not an objection this run rules out.

Likewise, the trusted keep/swap bit is not a human natural-language instruction. The controller's established recipient-reversal training task is now tested on new templates, names, colors and query types. A zero complete-contract score narrows claims about this frozen implementation; it cannot be generalized into a failure of SAN's full receiver-relative account. The purpose is to identify what an adequate implementation and evaluation must retain, without making its smallest fixture stand in for the source argument.

There is one checkpoint and eight constructed families. Cue, query, color and arm readouts are correlated. No population significance, human-oversight reduction, DeepSeek execution, secure production deployment, or ethical alignment is inferred. Full-precision equivalence, external review, contemporary-model replication and strongest-method comparison remain open.

## Verification

- [Trace/metric audit](TRACE-AND-METRIC-AUDIT.json): 1,536 outcomes, 512 actual authority events, 48 aggregate rows, 384 paired-role rows and 192 complete-contract rows reconstructed with separately written logic.
- [Native part 0](NATIVE-AUDIT-PART-0.json) and [part 1](NATIVE-AUDIT-PART-1.json): all 512 original-model readouts recomputed; compared logits have zero discrepancy and saved activation arrays match. The same validated decoder adapter is shared, so this is not independent implementation or independent review.
- [Application tests](APPLICATION-TESTS.log): all 51 cumulative tests pass. This includes nine new tests of reflection identities and limits, trusted cue routing and target definitions.
- [Figure readback](../../figures/gpt2-intent-07/VISUAL-REVIEW.md): inspected screen image, not final PDF approval.

No new training, new Lean theorem count, full-pipeline byte-identical replay, source mutation, public upload, other-task message or external action occurred. The previous 31 accepted Lean statements remain bounded mathematical results. The new reflection derivation is elementary mathematics, not an unrun formal-proof claim.
