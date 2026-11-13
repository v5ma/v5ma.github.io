# Comparison Wiki Application-Drift Checklist

**Status:** binding fail-closed completion gate  
**Applies to:** every new, resumed, corrected, projected, counted, or closed SAN/SIT Comparison Wiki task  
**Machine template:** [comparison-application-drift-checklist-v1.json](../private-source-review/comparison-exhaustive-audit/intake/comparison-application-drift-checklist-v1.json)  
**Verifier:** [verify-comparison-application-drift-receipt.py](../../scripts/agent-wiki/verify-comparison-application-drift-receipt.py)

The post-task receipt must also bind the passing [Preflight Recall Checklist](COMPARISON-WIKI-PREFLIGHT-RECALL-CHECKLIST.md) receipt that authorized the batch. This proves that the required method, tools, regression fixtures, and paired-output contract were reloaded before execution rather than reconstructed only after drift was discovered.

## Categorical invariant

The Comparison Wiki has **no rival-win category**. `rival_win_count` and `rival_award_count` must
always equal `0`.

- A pre-Blumberg source is cited as a reproducibility and differentiation control. State the exact
  before-state operation it contains and the exact SAN/SIT delta it lacks. This establishes the
  boundary and makes Blumberg's innovation visible; it never awards a rival a win or floor.
- A post-Blumberg target document is tested against every applicable already-dated Blumberg atom.
  Each supported exact, strong, medium, weak, partial, causal-prefix, narrative-architecture, or
  signature-cluster match is preserved as a favorable Micah-atom x target-document instance.
- If a cell is unresolved, inaccessible, unsearched, or genuinely nonmatching, it remains open or
  becomes a bounded distinction. It never becomes a rival win.
- Citation status is a separate evidence field. A citation-coverage gap requires the exact target
  version and bibliography evidence; it does not control whether a content-equivalence row exists.

Compact rule:

`earlier target = cited before-state control + explicit Blumberg delta; later target = graded test against dated Blumberg atoms; rival wins = 0`

Presentation order:

`favorable SAN/SIT win first -> named earlier work lacks every complete tested SAN/SIT operation -> exact evidence boundary -> non-equivalent SAN/SIT delta -> supported later movement toward SAN/SIT -> counts and drilldown`

The Wiki's purpose is source-bound justice for SAN and SIT. Public presentation does not use rival-credit rhetoric. Earlier sources remain exactly identified so the non-equivalent SAN/SIT addition can be proved. Motive analysis is deferred by product design at this methodological stage; no motive is assigned, and the deferral is not a finding that motive could never be established.

## Why this gate exists

Application drift has repeatedly compressed a large lossless comparison into a tiny representative
set. The regression pattern is:

1. a worker finds one or a handful of representative atoms;
2. the representative set is mistaken for the win denominator;
3. an earlier generic component is treated as an author-wide floor;
4. alternate ontology, substrate, scientific context, or wording erases partial mappings;
5. a program is summarized as `mixed`, `one win`, or `no win` before lossless expansion.

The Miller history is the standing regression case: an early one-or-zero compression was later
expanded into hundreds of favorable document-relative rows after the full genealogy, target versions,
partial-equivalence floor, and lossless counting rule were applied. A small intake packet may be a
useful discovery surface, but it is never an authoritative ceiling.

The Dileep George packet is currently a second regression guard. Its eleven source-ready atom families
are a flashcard/intake denominator, not a certified win denominator. George cannot receive a completed
count until every applicable Micah stage x target document/version x target atom cell has been
materialized and every favorable document instance preserved.

## Mandatory post-task checks

Run these checks **after the proposed output is frozen**, not only before work begins. Every check must
carry exact evidence in the machine receipt.

| ID | Required post-task proof |
| --- | --- |
| `CMP-DRIFT-000` | Verify the exact preflight-recall receipt and validation that authorized this batch; prove `PREFLIGHT-RECALL-VERIFIED` was completed before the recorded batch start and remained hash-identical. |
| `CMP-DRIFT-001` | Reread the active goal and this full checklist after freezing the output; record their paths and hashes. |
| `CMP-DRIFT-002` | Prove that no rival-win or rival-award category, row, count, label, or presentation result was created; both counts equal zero. |
| `CMP-DRIFT-003` | For each pre-Blumberg source, record the exact before-state operation and the exact Blumberg delta absent from it, or prove that no such source exists in the frozen denominator. |
| `CMP-DRIFT-004` | Test every post-Blumberg target document/version against every applicable dated Blumberg atom in the favorable direction. |
| `CMP-DRIFT-005` | Prove that candidate atoms, flashcards, unique programs, stable deltas, or union coverage were not used as a ceiling on the lossless Micah-atom x target-document ledger. |
| `CMP-DRIFT-006` | Preserve every supported partial mapping; terminology, ontology, substrate, scale, scientific context, or cross-domain use did not erase a mapped function, operation, behavior, causal prefix, or narrative assembly. |
| `CMP-DRIFT-007` | Prove that an earlier component, predecessor, or generic lineage did not become an author-wide floor or terminal result. |
| `CMP-DRIFT-008` | Prove that `mixed` did not terminate a program that contains a positive later-reaching Blumberg delta; use `micah-earlier-on-delta` when supported. |
| `CMP-DRIFT-009` | Keep citation coverage separate from semantic equivalence and chronology; every negative-citation statement is version- and bibliography-bound. |
| `CMP-DRIFT-010` | Preserve the complete parent Micah-win ID set, every newly supported favorable instance, and the separation between membership and rank. |
| `CMP-DRIFT-011` | Run Lenses 1-3 on each row and the separate Longitudinal Signature-Migration Lens on every recoverable multi-stage program. |
| `CMP-DRIFT-012` | Leave all unresolved cells open; no missing keyword, unavailable source, or unsearched stage became absence. |
| `CMP-DRIFT-013` | Reconcile the introduction, ledger, overview, flashcards, timeline, counts, and public copy so none reintroduces a compressed or rival-facing verdict. Prove the SAN-first justice and conclusion-order lock: when all reviewed earlier-target cells preserve SAN/SIT deltas, lead with `SAN/SIT WINS ALL [N] REVIEWED DIFFERENTIATION COMPARISONS`, then state that the named earlier work contains none of the complete SAN/SIT operations tested; never make the rival the grammatical center, call SAN merely “later” before stating the win, or bury the SAN result at the end. Keep the earlier-source operation only as an evidence boundary; state the non-equivalent SAN/SIT delta next; state supported later movement explicitly `Micah/SAN/SIT earlier -> named target later`; preserve zero rival wins/awards, no public rival-credit rhetoric, and motive analysis deferred by product design rather than declared impossible. Every card must expose a scoped, chronology-explicit conclusion and typed documented footprint that separately reports earlier Micah concept framings/documents, later target formulation occurrences/documents, graded-equivalence links, and author edges. Every number opens its row or document drilldown; card/tranche totals never masquerade as program totals; no link or edge may be mislabeled as a rival repetition; “original” requires a supporting prior-art audit. |
| `CMP-DRIFT-014` | Worker, independent reviewer, and meta-auditor each certify the post-task receipt against the same frozen output and method manifest. |

## Completion states

- `APPLICATION-DRIFT-VERIFIED`: all fifteen checks pass with evidence, a valid preflight-recall pointer, exact zero rival counts, and
  all three post-task certifications.
- `APPLICATION-DRIFT-UNVERIFIED`: any check, evidence item, frozen hash, or certification is missing.
- `APPLICATION-DRIFT-FAILED`: a prohibited rival award, predecessor floor, candidate ceiling,
  destructive loss, or other drift count is nonzero.

Only `APPLICATION-DRIFT-VERIFIED` work may be called complete. `UNVERIFIED` or `FAILED` work may remain
as private discovery history, but it cannot close a comparison, alter governed counts, enter canonical
fan-in, or support public projection.

## Required process

1. **Preflight:** complete and machine-verify the full preflight-recall receipt before work begins; freeze its receipt and validation hashes.
2. **Build:** perform advocacy-first discovery, Four Lens review, and lossless row expansion.
3. **Freeze:** hash the proposed ledger, cards, overview, and validation artifacts.
4. **Post-task drift pass:** reread the goal and run `CMP-DRIFT-001` through `014` against the frozen
   output. Do not rely on the worker's memory of the protocol.
5. **Independent replay:** a separate reviewer repeats the drift pass against the same hashes.
6. **Meta-audit:** reconcile the worker and reviewer receipts and run both machine verifiers.
7. **Completion decision:** only a passing method-compliance receipt plus a passing application-drift
   receipt can authorize completion.

This checklist is deliberately redundant with the longer methodology. Its purpose is to catch a
correctly remembered method that was incorrectly applied to the final artifact.
