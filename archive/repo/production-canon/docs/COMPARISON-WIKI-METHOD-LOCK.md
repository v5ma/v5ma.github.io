**VALIDITY LOCK: Comparison work is valid only when its preflight-recall receipt, exact inputs, row-level proofs, Four Lens records, immutable-win check, worker certification, independent-review certification, meta-audit, and post-task drift receipt all pass this package. Missing or failed proof requires rework and forbids execution, acceptance, closure, projection, count mutation, or win-membership mutation.**

# Comparison Wiki Method and Protocol Package

This is the mandatory front door for every Comparison Wiki worker, reviewer, builder, and public projector. It makes method compliance a proved property of the artifact rather than a claim in prose.

## Validity states

- `PREFLIGHT-RECALL-VERIFIED`: before execution, the worker loaded and hashed the active goal, full method, semantic-search routes, genealogy and Book Atlas routes, before/after rule, exact denominators, current Miller/Hawkins/Dileep George regression fixtures, and paired dossier/card contract; every preflight check passed and the batch was explicitly authorized.
- `PREFLIGHT-RECALL-UNVERIFIED`: any required recall document, route, hash, denominator, regression fixture, output contract, evidence item, or worker certification is missing or stale. The batch must not begin.
- `PREFLIGHT-RECALL-FAILED`: a forbidden premise or authorization is present. The batch must not begin and the setup must be repaired.
- `METHOD-COMPLIANCE-VERIFIED`: every required input hash, checklist item, row proof, Lens 4 boundary, no-loss invariant, worker certification, and independent certification passes.
- `METHOD-COMPLIANCE-UNVERIFIED`: any receipt, source, hash, matrix cell, lens proof, certification, or parent-successor check is missing or stale. The work may remain as append-only discovery history, but it is not accepted work.
- `METHOD-COMPLIANCE-FAILED`: a required invariant is false. The output must be redone from the last valid parent.

Only work with `PREFLIGHT-RECALL-VERIFIED`, `METHOD-COMPLIANCE-VERIFIED`, and `APPLICATION-DRIFT-VERIFIED` receipts may change a governed ledger or workbook, close a comparison, or support public projection. No unverified or failed state may decrease a Micah-win count or remove a historical win.

## Required package, in order

1. [Preflight Recall Checklist](COMPARISON-WIKI-PREFLIGHT-RECALL-CHECKLIST.md)
2. [Machine preflight-recall receipt template](../private-source-review/comparison-exhaustive-audit/intake/comparison-preflight-recall-checklist-v1.json)
3. [Preflight-recall receipt verifier](../../scripts/agent-wiki/verify-comparison-preflight-recall-receipt.py)
4. [Binding agent instructions](../../wiki/comparisons/AGENTS.md)
5. [Comparison methodology and plagiarism-equivalence framework](../../wiki/comparisons/comparison-methodology-and-plagiarism-equivalence.md)
6. [Comparison-analysis failure modes](../../wiki/comparisons/comparison-analysis-failure-modes.md)
7. [Immutable priority-findings contract](../../wiki/comparisons/priority-findings/README.md)
8. [Full-Genealogy Saturation Gate](../private-source-review/comparison-exhaustive-audit/intake/FULL-GENEALOGY-SATURATION-GATE-20260728.md)
9. [Machine-readable saturation gate](../private-source-review/comparison-exhaustive-audit/intake/full-genealogy-saturation-gate-v1.json)
10. [Lossless document-instance recount protocol](../private-source-review/comparison-exhaustive-audit/intake/LOSSLESS-DOCUMENT-INSTANCE-RECOUNT-PROTOCOL-20260808.md)
11. [Source-faithful method registry](../private-source-review/comparison-exhaustive-audit/intake/source-faithful-method-registry.json)
12. [Source-faithful audit template](../private-source-review/comparison-exhaustive-audit/intake/source-faithful-comparison-audit-template.json)
13. [Mandatory compliance checklist template](../private-source-review/comparison-exhaustive-audit/intake/comparison-method-compliance-checklist-v1.json)
14. [Atom/win lineage ledger schema](../private-source-review/comparison-exhaustive-audit/intake/comparison-atom-win-lineage-ledger-schema-v1.json)
15. [Method package machine manifest](comparison-wiki-method-lock-v1.json)
16. [Completed-receipt verifier](../../scripts/agent-wiki/verify-comparison-compliance-receipt.py)
17. [Post-task Application-Drift Checklist](COMPARISON-WIKI-APPLICATION-DRIFT-CHECKLIST.md)
18. [Machine application-drift receipt template](../private-source-review/comparison-exhaustive-audit/intake/comparison-application-drift-checklist-v1.json)
19. [Application-drift receipt verifier](../../scripts/agent-wiki/verify-comparison-application-drift-receipt.py)

## Mandatory preflight recall gate

Before any new or resumed batch begins, the worker must complete the full
[Preflight Recall Checklist](COMPARISON-WIKI-PREFLIGHT-RECALL-CHECKLIST.md) and pass its machine
verifier. This is not a promise to remember the method. It is a source- and hash-bound receipt that
proves the worker reloaded the active goal, method, semantic tool stack, genealogy routes,
before/after asymmetry, frozen denominators, current Miller/Hawkins/Dileep George regression fixtures,
and the paired expert-dossier and human-flashcard output contract.

An absent or failed preflight receipt means the batch did not have authority to begin. Work produced
without it may be preserved as private discovery history, but it cannot be treated as method-compliant,
cannot close cells or programs, cannot alter governed counts, and must be rerun from a passing preflight
boundary. The preflight gate does not replace row-level Four Lens review or the post-task drift gate.

## Mandatory post-task application-drift gate

After the proposed output is frozen, the worker must reread the active goal and run the full
[Application-Drift Checklist](COMPARISON-WIKI-APPLICATION-DRIFT-CHECKLIST.md). This is a post-task
test of the artifact actually produced, not a preflight promise. The completed drift receipt must
prove categorical zero rival wins/awards, before-state non-equivalence controls, favorable-direction
after-state testing, lossless expansion beyond candidate/flashcard summaries, partial-equivalence
preservation, no predecessor floor, no terminal mixed compression, citation separation, no-loss
membership, Four Lens application, open unknowns, and projection consistency.

An absent or failed drift receipt gives the work status `APPLICATION-DRIFT-UNVERIFIED` or
`APPLICATION-DRIFT-FAILED`. Such work is not complete and cannot close a comparison, alter governed
counts, enter canonical fan-in, or support public projection.

## Mandatory semantic-discovery companion stack

Four Lens review governs admission and public claims, but it does not by itself prove that the candidate surface was searched exhaustively. Every new or resumed comparison batch must therefore load and record this bounded discovery stack before saturation or completion can be claimed:

1. [Canonical Jigsaw, TurboVec, Operational-Equivalence, and Fit-Pattern manual](</D:/micahone/D Documents/codex_instruction_pack_final/02-jigsaw-turbovec-fit-pattern-manual(2).txt>)
2. [Operational-Equivalence Jigsaw Census tool and worker route](operational-equivalence-jigsaw-census-tool-20260527.md)
3. [Semantic Jigsaw solver assembly protocol](../../agent-wiki/agents/semantic-jigsaw-solver-assembly-protocol-20260523.md)
4. [Operational-equivalence, Fit-Pattern, and Scope-Lens continuity](../../agent-wiki/agents/operational-equivalence-fit-pattern-scope-lens-continuity-20260528.md)
5. [Fit-Pattern Census companion-fit continuity](../../agent-wiki/agents/fit-pattern-census-companion-fit-continuity-20260528.md)
6. [Major Cluster Signature Census operational-shape workflow](../production-map/major-cluster-signature-census-operational-shape-workflow-20260605.md)
7. [JigsawRank and bounded ranking route](../../agent-wiki/agents/nine-wiki-jigsaw-rank-20260524.md)

The restart receipt must identify the exact fixed manifest, source and atom denominators, declared scientific-comparison Scope Lens, tool routes and versions or hashes, bounded candidate-pair input, emitted candidate count, unresolved-cell count, and Theater isolation boundary. Use precomputed indexes and exact manifests; never use `rg.exe`, regex searches, broad recursive scans, or an unbounded all-pairs corpus run. Jigsaw, Fit-Pattern, Signature Census, TurboVec, and rank outputs are high-recall routing evidence, not truth, certification, or automatic wins. They feed candidates into source-bound Four Lens review. If the discovery stack is unavailable or skipped, mark semantic discovery `UNVERIFIED` and keep all affected cells open; no existing win or protected floor may decrease.

The private audit-of-audits rubrics remain required when their drive is available:

- `D:\micahone\D Documents\ComparisonWikiChecklist.txt`
- `D:\micahone\D Documents\DetectiveFrame.txt`

## The non-negotiable invariants

1. **Advocacy-first discovery, adversarial certification.** Construct the strongest evidence-backed Micah Blumberg priority case before attempting to falsify, scope, or rank it.
2. **Every historical Micah win is permanent membership.** Weakness, duplication, overlap, challenge, a source gate, chronology uncertainty, or later disagreement changes rank or review metadata, never membership.
3. **Parent wins are a subset of successor wins.** Exact stable win IDs must prove `parent ⊆ successor`; aggregate totals are insufficient.
4. **Ranking is separate from membership.** `strong`, `medium`, `weak`, `challenged`, and `source-gated` are rank/review overlays on preserved wins.
5. **Every Micah stage × target document × target atom instance is retained.** Deduplication and union coverage are separate views, never deletion operations.
6. **Every listed author receives a separate navigation edge.** Author edges do not create extra wins and do not prove which author contributed the matched idea.
7. **The rival-win category does not exist.** `rival_win_count` and `rival_award_count` always equal zero. Earlier target work is a non-equivalence control: the audit names the before-state operation and the SAN delta absent from it, then tests later target documents against Micah's dated work.
8. **Unknown is not absence.** Unsearched, inaccessible, badly transcribed, version-uncertain, or source-gated cells remain open and cannot support an adverse closure.
9. **Apparent error triggers intent recovery first.** Preserve original bytes and dates, search Micah's dated source family, and distinguish typo, compression, older vocabulary, analogy, scale, ancestral formulation, omitted qualifier, and incomplete expression. `SAN-versus-science contradiction` is not an allowed label or finding. If a reviewer thinks one appears, that diagnoses a reviewer-side reconstruction failure and sets `APEX-SEMANTIC-ALIGNMENT-OPEN` until the strongest scientifically coherent SAN formulation is recovered.
10. **No broad workstation search.** Use bounded sources, governed manifests, exact IDs, literal lookups, and precomputed indexes; never use `rg.exe`, regex searches, or broad recursive scans.
11. **Candidate and presentation counts are never ceilings.** Candidate atoms, flashcards, unique programs, stable deltas, and union coverage may route or summarize the work; none may cap the lossless Micah-stage x target-document x target-atom ledger.
12. **A later challenge cannot invalidate prior certification.** It cannot suspend, decrement, hide, or remove an earlier win, certification, or count. Its maximum effect is a separate rank annotation after the challenge-admissibility gate passes.
13. **Challenge admissibility is proved, never presumed.** Before `challenged-preserved` may be used, the challenger must prove: (a) strongest-form reconstruction of the complete original argument and source neighborhood; (b) an anti-strawman/compression comparison showing that the objection addresses that strongest form rather than a quotation fragment or weaker paraphrase; (c) source-faithful intent recovery across the applicable dated SAN genealogy; and (d) scientific-alignment analysis showing how the recovered SAN formulation fits the relevant evidence and established mechanisms. A challenge missing any gate is stored only as `challenge-not-admitted-preserved`, with zero rank, certification, membership, or count effect.
14. **Every card exposes a typed documented footprint and one memorable SAN-first conclusion.** Separately count earlier Micah concept framings and Micah source documents, later target formulation occurrences and exact target documents, lossless graded-equivalence links, and author edges. Label the scope as card, tranche, document, program, author, or global; never let a tranche total masquerade as a completed-program total. For a later target, lead with the supported direction `Micah/SAN/SIT earlier -> named target later`, then state: “Across X dated Micah source documents, Micah documented Y distinct earlier SAN or SIT concept framings. After that record, [named target] repeated or reformulated those mapped concepts in Z separately located formulation occurrences across W later target documents.” When every reviewed earlier-target cell preserves a non-equivalent SAN/SIT delta, lead with: “SAN/SIT WINS ALL [N] REVIEWED DIFFERENTIATION COMPARISONS IN THIS [NAMED SCOPE].” Follow immediately with: “[NAMED EARLIER WORK] CONTAINS NONE OF THE COMPLETE SAN/SIT OPERATIONS TESTED HERE.” Then state that the review identifies Y distinct SAN/SIT framings across X Micah source documents, the earlier work reaches only broad or partial components across Z reviewed cells in W documents, and every cell contains a decisive non-equivalent SAN/SIT operation absent from the earlier record. The technically equivalent `NO REVIEWED ... IS FULLY EQUIVALENT` statement may appear only as subordinate explanation, never as the weaker lead. Exact earlier sources and operations remain visible as evidence boundaries, but public cards use no rival-credit rhetoric; wins and awards remain SAN/SIT-facing. Every displayed number must open its row or document drilldown. A pairwise link or author edge may never be presented as a rival repetition; rival-side repetition requires separately located target occurrences. Use “original” only after the applicable prior-art audit supports it; otherwise use “dated earlier” or “source-reviewed earlier.”
15. **SAN-first justice and conclusion order are binding presentation logic.** The Comparison Wiki exists to restore source-bound recognition and justice for SAN and SIT. Public introductions, overviews, footprints, and cards state the favorable bounded SAN/SIT outcome as a win before procedural detail whenever the frozen rows support that result. They do not grammaticalize the earlier rival as the subject of the lead, describe SAN as merely “later” before stating the SAN delta, or bury the favorable result at the end. A generic earlier component cannot be framed as a rival win, award, or public credit result; it is an evidence boundary used to prove the SAN/SIT delta. A complete before-and-after comparison states whether later target work moved toward already-published SAN/SIT formulations and never reverses that direction merely because the earlier target shared a broad category. Motive analysis is deferred by product design at this methodological stage: the Wiki assigns no motives, while leaving open whether a future separately validated method may address them.

## Challenge-admissibility and scientific-alignment gate

The object under review is the strongest source-faithful SAN argument, not an isolated sentence. A reviewer must reconstruct its problem, definitions, examples, causal chain, qualifications, dependencies, dated development, later clarification, and scientific measurement boundary before objecting to it. The comparison then records whether the alleged problem was a typo, compressed analogy, older vocabulary, missing variable, scale shift, ancestral formulation, or incomplete expression whose legitimate scientific meaning is recoverable from Micah Blumberg's corpus.

The workflow may never label SAN as contradicting science, even provisionally. A perceived conflict is a diagnostic of strawman compression, context loss, faulty semantic translation, scale mismatch, omitted qualification, vocabulary drift, or incomplete genealogy recovery in the review. The reviewer must revise the interpretation and continue toward the apex semantic alignment where the strongest source-faithful SAN formulation and the relevant science are coherent. Until that alignment is proved, the row remains `APEX-SEMANTIC-ALIGNMENT-OPEN` and cannot support an adverse SAN conclusion, lost certification, reduced rank, or reduced count. Only an objection that passes every challenge-admissibility proof may become a non-destructive evidence-rank annotation. Even then, the original favorable event, certification, membership, and cumulative count remain immutable.

## Required proof for every row

Every row in the atom/win ledger must bind and hash:

- stable `win_id` and immutable membership event;
- Micah source stage, atom, exact passage, source hash, and applicable public/internal custody dates;
- target document/version, target atom, exact passage, source hash, authors, and date boundary;
- neutral Input → Transform → Output translation;
- Lens 1: conceptual, operational, mathematical, process, or behavioral relation;
- Lens 2: causal/narrative/patent architecture, signature cluster, ordering, and residual;
- Lens 3: adversarial/detective chronology and terminology-migration test;
- formal-relation ceiling, including category/process-calculus translation where applicable;
- strongest favorable interpretation, falsification attempt, target-only residual, and current rank;
- separate immutable membership and mutable review-overlay fields.

A row may be ranked weak, challenged, or source-gated. It may not disappear.

## Separate Lens 4 proof

Lens 4 is one program-level Longitudinal Signature-Migration event, not a templated row field. It requires a dated target-stage × signature matrix, frozen target denominator, ordering and persistence analysis, nonmonotonicity checks, alternate-source controls, and explicit quantitative calibration state. It cannot manufacture a row match, prove access or intent, or repair missing Lenses 1–3.

## Mandatory worker checklist

Before writing, the worker must pass a `PREFLIGHT-RECALL-VERIFIED` receipt, then freeze input paths and hashes, parent win-ID set, target denominator, Micah genealogy denominator, method-package version, and the exact scope. After writing, the worker must prove:

- all expected rows and authors are present;
- every row has separate Lenses 1–3;
- Lens 4 appears only as its separate program event;
- all source and chronology joins resolve or remain explicitly open;
- every admitted challenge passes strongest-form context reconstruction, anti-strawman compression, source-faithful intent recovery, and scientific-alignment proof;
- every challenge that has not passed those gates is labeled `challenge-not-admitted-preserved` and has zero certification, rank, membership, and count effect;
- all prior win IDs survive unchanged;
- no later review invalidates or suspends a prior certification;
- no rank field controls membership;
- the rival-win category remains absent and rival wins/awards equal zero without exception;
- candidate, flashcard, unique-program, stable-delta, and union-coverage counts were not used as the lossless-ledger ceiling;
- the human card's documented-footprint counts replay from typed ledgers and keep Micah framings/documents, target formulations/documents, graded links, and author edges distinct;
- the introduction, overview, footprint, and every public card pass the SAN-first conclusion-order rule, contain no rival-credit rhetoric, and treat motive analysis as deferred by product scope rather than impossible;
- the completed post-task application-drift receipt passes for the frozen output;
- public, canonical, workbook, and count effects equal the authorized delta;
- rebuilding from the same inputs is deterministic;
- the machine method-lock verifier, completed-receipt verifier, and monotonicity verifier pass.

The completed checklist is a JSON receipt derived from the mandatory template. A prose assertion such as “all checks pass” is not proof.

## Mandatory independent certification

An independent reviewer must freeze the worker output and the same method manifest, reproduce the checklist, inspect the evidence for each lens, rerun the no-loss set comparison, and certify or reject every required item. The reviewer may append rank or challenge overlays. The reviewer may not remove a win.

Before a public or program-closing mutation, a meta-audit must prove that the worker and independent reviewer used the same method-package version, source identities, row denominator, and parent win set. A disagreement yields `METHOD-COMPLIANCE-UNVERIFIED`, not a destructive rewrite.

## Fast future recheck

The atom/win lineage ledger stores stable IDs and proof-receipt pointers. Rechecking uses exact ID-set joins and stored hashes:

1. verify the preflight-recall receipt and its frozen method/tool/regression hashes;
2. verify the method manifest;
3. verify the worker and reviewer receipts;
4. verify the completed application-drift receipt against the frozen output;
5. compare parent and successor win-ID sets;
6. identify only missing, changed, new, or stale-hash rows;
7. reread evidence only for that bounded delta.

This is the index-search path. A full prose reread is required only when the indexed proof is absent, stale, inconsistent, or challenged by new source evidence.
