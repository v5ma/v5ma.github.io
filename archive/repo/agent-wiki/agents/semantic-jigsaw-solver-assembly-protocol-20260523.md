---
title: Semantic Jigsaw Solver Assembly Protocol - 2026-05-23
created: 2026-05-23
updated: 2026-05-23
type: protocol
tags: [semantic-jigsaw, puzzle-sorting, compatibility-scoring, fan-out, fan-in, nine-wiki, production-canon]
summary: Top-priority protocol for applying jigsaw-solver phases to wiki/product graph assembly across code, demos, sources, proof, tasks, and concepts.
---

# Semantic Jigsaw Solver Assembly Protocol - 2026-05-23

## Priority

This is now a top-priority operating pattern for wiki/product graph work.

The project should treat the recovered files, task outputs, wiki pages, source roots, code demos, proof packets, product plans, domains, and concept cards as jigsaw pieces. The goal is not to find one missing file. The goal is to repeatedly segment, vectorize, score, and assemble the pieces into product clusters.

## Worker Tool Pass Clarification - 2026-05-26

Do not treat `semantic-jigsaw-rank-routing` as a vague label for a whole assignment. In worker prompts it must be one discrete pass in a sequence.

For June 5 fan-in and similar tray workers, the sequence is:

1. TurboVec fast-rank clue pass.
2. Runnable Jigsaw CLI pass, using `python -m jigsaw` commands.
3. JigsawRank clue pass.
4. Bridge-rank clue pass.
5. Existing-cluster fit pass against Agent Wiki, Product Canon, the production folder, and wiki surfaces.
6. Source-root provenance pass across Product Canon, nested `v5ma2026`, Impossible, Carousel, Impossible wiki, backups, and external business-lane roots.
7. Weighted key-anchor pass against `v5ma2026/vision.md`, `v5ma2026/prd.md`, `v5ma2026/impossible/impossible-spaces-master-plan.md`, and milestone/backup/baseline/landmark neighbors.
8. Nine-wiki fit matrix across Agent Wiki, SAN, v5ma, Impossible, NerveGear, Theology, Comparisons, SVGN, and Riemann.
9. Business-lane fit matrix against lane checklists, states, scope contracts, stop conditions, and handoff files.
10. Vision/PRD/business/domain fit pass across the strategic product surfaces and 13 registered domains.
11. Product Canon daily-demo, June 5, and proof-row fit pass.
12. Privacy/publication/live-side-effect gate.
13. Duplicate/variant/backup/archive assessment.
14. Dependency/runtime readiness pass.
15. Supercluster bridge scan against existing bridge-candidate and assembly-state surfaces.
16. Final assembly decision.

The repo has runnable Jigsaw tooling. Workers should run bounded commands such as `python -m jigsaw turbovec-neighbors`, `python -m jigsaw batch`, and `python -m jigsaw neighbors`, then write the outputs under their worker leaf. Rank and neighbor outputs remain candidate evidence, not verdict authority.

For these workers, "all possible fits" means every plausible fit inside the bounded worker universe: exact tray, selected TurboVec neighbors, source-root matrix, weighted key anchors, fixed nine-wiki matrix, business-lane matrix, fixed 13-domain matrix, strategic Vision/PRD/business surfaces, Product Canon proof/demo surfaces, and known bridge-candidate surfaces. It does not mean brute-forcing every tracked file against every other tracked file.

For the current June 5 worker contract, read `agent-wiki/agents/june5-fanin-worker-pilot-tuning-continuity-20260526.md` first.

## Original Design Correction - Operational Equivalence

This was Micah's original design, not a later upgrade: vector or word similarity is only a retrieval-pressure layer. TurboVec finds candidate pieces and feeds the Theater. The Theater hands off candidate paths while stripping TurboVec score/order as verdict authority. Blind Jigsaw then performs the slower fit test without seeing TurboVec's opinion.

The compatibility test is architectural narrative mapping, not word matching. A worker should extract operational atoms such as actor, operation, operand, bounded context, dependency, state transition, proof constraint, product role, and failure condition. It should then ask whether two pieces have an operationally equivalent role in the WebXR SaaS Factory, whether they bridge larger cluster objects, and whether a bounded normal-form gap remains.

For corpus-scale work, this is signature-cluster-first. Extract many small operational atom rows, compile each row to a row-invariant signature, and bucket matching rows before any pairwise scoring. Synonyms and functionally isomorphic substitutions can share a signature when the Scope Lens maps them to the same actor, operation, operand, context, role, and state-transition structure. All-pairs comparison is only for tiny proof fixtures or debugging; broad runs should use the signature clusters, TurboVec candidates, or explicit candidate-pair files as the feeder into deeper Jigsaw review.

The first fast pass is exact row-invariant signature clusters. The second fast pass is ranked partial-signature clusters: actor-operation, operation-context, product-transition, narrative-role, and behavior-form profiles. Those partial signatures are ranked by membership, source count, field coverage, and profile weight, then used to surface architectural narrative similes. This lets the system see "same role in the story" without requiring a full exact row match.

Do not treat architectural narrative mismatch as negative evidence against an atomic abstraction match. Narrative fit is additive: it can strengthen a partial isomorphism when the story/context also matches. When the atoms match and the story does not, preserve the row as a cross-domain transfer candidate for product, code, design, or generation analogy review.

Reason: narrative architecture includes the spaces between explicit terms: omission, ordering, timing, cadence, pacing, and contextual rhythm. A changed narrative cadence is different evidence, not automatic counterevidence. Since every candidate pair has differences, difference alone cannot discount an atomic signature match; only a declared Scope Lens contradiction can.

Contradiction handling must be atomized, not intuitive. If the operation behavior or function is fundamentally incompatible with the active lane, keep the signature evidence visible and emit `inhibitoryFilterTriggered=true` plus `contradictionLensHits[]` rows with `lensId`, `ruleId`, `severity=disqualifier`, `sourcePath`, `atomId`, `reason`, and `evidenceSpan`. That is how "this looked unqualified" becomes repeatable census logic: same atom, disqualified function.

The abstraction is modality-neutral. A piece can be a text file, source module, route, proof packet, screenshot, image label set, video shot summary, 3D scene, behavior trace, or generation prompt/output. The same operational row and architectural narrative profiles can be used for search retrieval and for conditioning image/video/scene generation by structure rather than prompt-word overlap.

## Patent-First Search Engine Gate - 2026-05-27

The operational-equivalence census layer is now also a patent route for a new search engine, not merely an internal routing helper. Any agent working on Jigsaw as a corpus-scale operational-equivalence search system must read `agent-wiki/agents/operational-equivalence-search-engine-patent-continuity-20260527.md` before drafting public papers, product pages, demos, or external disclosures.

The required sequence is:

1. patent filing first;
2. paper filing second;
3. product third.

The search-engine framing is: index and rank artifacts by operational equivalence, architectural narrative isomorphism, and normal-form gap under a declared Scope Lens. Lexical and vector retrieval remain candidate pressure only.

Required ordering:

1. Census extraction creates operational atom rows, row-invariant signature clusters, partial signature clusters, and architectural narrative signatures.
2. Exact signature clusters perform the first fast corpus lookup.
3. Ranked partial signatures perform the second fast lookup for architectural narrative similes.
4. Vector/search/census pressure finds possible pieces and cluster-adjacent candidates.
5. Theater packages candidate paths and removes upstream score/order influence.
6. Blind Jigsaw reads the pieces and extracts or verifies operational atoms.
7. Jigsaw scores architectural narrative fit, operational equivalence, cross-domain transfer value, proof fit, privacy fit, and normal-form gap for bounded candidate pairs or small clusters.
8. Verdict/proof records, not rank order, decide whether anything becomes accepted truth.

## Graph-Backed Read-Next Links

The NorthStar document relevance graph classifies this protocol as `connected-reviewed`, with strong C09 `3D Wiki / concept_card / concept_edge / spatial wikilinks` evidence plus many cross-supercluster method edges. This page is a method companion, not proof truth for any single product lane.

Query command:

```powershell
python production-canon/scripts/query-northstar62-related-docs.py --path "agent-wiki/agents/semantic-jigsaw-solver-assembly-protocol-20260523.md" --limit 20
```

Reviewed read-next anchors:

- `agent-wiki\agents\three-d-wiki-concept-card-schema-contract-20260524.md` - C09 schema anchor for turning wiki pages/slices into concept cards and edges.
- `agent-wiki\agents\june5-fanin-worker-pilot-tuning-continuity-20260526.md` - worker/fan-in context companion for applying this protocol to June 5 product graph work.
- `production-canon\scripts\run-june5-supercluster-corpus-sweep.py` - runnable sweep implementation companion; route evidence only, not verdict authority.
- `production-canon\indices\june5-dedicated-supercluster-workers-20260526.json` - worker manifest companion for bounded supercluster lanes.

Complementary candidate families to review next:

- C09 to C45: all nine wikis need 3D interface link repair using complementary concept edges, not same-word link stuffing.
- C09 to C62: Notes.js objects can become concept cards, annotations, proof comments, and object labels when schema-gated.
- C09 to C59/C60: NerveGear maze and SVGN orb interfaces are candidate consumers of concept-card/portal-preview route behavior.
- C09 to C32: first 3D Wiki demo failure evidence should be mined as caution signatures before new runtime promotion.

## Four-Phase Translation

### 1. Segmentation

Turn the file haystack into bounded pieces.

Piece types:

- `wiki_page`
- `wiki_section`
- `source_root`
- `source_note`
- `code_file`
- `runtime_demo`
- `proof_packet`
- `task_card`
- `worker_output`
- `domain_or_route`
- `product_surface`
- `concept_card`
- `media_asset`

Every piece needs:

- stable piece id;
- exact path or route;
- owner wiki/lane;
- privacy/publication state;
- artifact type;
- current proof status;
- last verified date;
- allowed write surface.

### 2. Border Vectorization

Extract edges from each piece. These are the semantic equivalent of puzzle borders.

Required edge families:

- `source_edge`: source roots, citations, transcript/chat roots, provenance.
- `concept_edge`: nouns, terms, headings, wikilinks, semantic neighbors.
- `operational_atom_edge`: actor, operation, operand, bounded context, dependency, state transition, proof constraint, product role, failure condition.
- `architectural_narrative_edge`: customer path, assembly-line role, product cluster, bridge role, moat/security role, runtime role, publication/proof role.
- `code_edge`: module names, exports, routes, runtime IDs, dependencies.
- `demo_edge`: HTML route, screenshots, browser proof, WebXR/3D runtime tags.
- `proof_edge`: proof packet id, tests, screenshots, acceptance gate.
- `product_edge`: product name, moat, service, domain, customer surface.
- `task_edge`: lane, dependency group, worker output, blocker, next leaf.
- `privacy_edge`: public, internal, private, blocked, unknown.

Do not use broad scans as the default vectorizer. Prefer existing manifests, source maps, frontmatter, task metadata, route matrices, and bounded line-window reads.

### 3. Compatibility Scoring

Each comparison leaf scores a pair or small cluster.

Minimum score fields:

```json
{
  "structuralFit": 0.0,
  "semanticFit": 0.0,
  "lexicalRetrievalScore": 0.0,
  "operationalEquivalenceFit": 0.0,
  "architecturalNarrativeFit": 0.0,
  "normalFormGap": 0.0,
  "proofFit": 0.0,
  "privacyFit": "safe|private|blocked|unknown",
  "compatibilityScore": 0.0,
  "confidence": 0.0,
  "relationship": "same|adjacent|dependency|duplicate_variant|blocker|no_join|second_review"
}
```

Score interpretation:

- `structuralFit`: same route, same module, same proof id, same lane, same file family, same source root.
- `semanticFit`: retained legacy field; for new workers it should reflect architectural narrative fit, not plain word overlap.
- `lexicalRetrievalScore`: word/vector similarity pressure that helped find the candidate; it is not compatibility authority.
- `operationalEquivalenceFit`: whether the pieces perform compatible actor/operation/operand/context roles under the same scope lens.
- `architecturalNarrativeFit`: whether the pieces occupy compatible roles in the product story, customer path, proof path, security path, runtime path, or wiki/product cluster.
- `normalFormGap`: how much alignment work remains after reducing each piece to operational atoms and architectural role.
- `proofFit`: matching proof exists, proof is missing, proof is stale, or proof contradicts.
- `privacyFit`: whether the join is allowed to surface publicly or must remain private/internal.
- `compatibilityScore`: weighted summary for fan-in ranking.
- `confidence`: how sure the worker is.

Do not let `lexicalRetrievalScore`, TurboVec order, or word overlap decide a join. They can explain why the worker looked at a piece. They cannot explain why the piece belongs.

### 4. Global Assembly

Fan-in reducers grow clusters from scored joins.

Assembly strategy:

1. Start with highest-score, high-confidence, privacy-safe joins.
2. Grow clusters around product moats and wiki concepts.
3. Keep `blocker` and `second_review` joins out of public surfaces.
4. Require single-writer fan-in for shared wiki pages, manifests, readers, and production-canon docs.
5. Produce new leaves from missing proof, missing wikilinks, stale source, reader gaps, privacy gates, and duplicate variants.

Avoid a pure greedy lock-in when risk is high. For ambiguous clusters, keep multiple hypotheses and send them to second review instead of hard-joining early.

## Worker Leaf Contract

Each semantic-jigsaw worker should read at most a bounded pair or small cluster and return:

- `pieceA`;
- `pieceB` or `clusterB`;
- `pathsRead`;
- extracted `edgeVectors`;
- all score fields;
- `relationship`;
- `belongsWith`;
- `joinCandidate`;
- `proofNeeded`;
- `wikilinksToAdd`;
- `conceptCardsToCreate`;
- `productSurfaceCandidate`;
- `assemblyAction`;
- `nextLeaf`;
- `risks`.

Do not mutate shared surfaces from a discovery-only worker leaf. Write a handoff only.

## Fan-In Contract

Fan-in reducers sort handoffs by:

1. privacy safety;
2. compatibility score;
3. confidence;
4. proof availability;
5. cluster importance to launch/revenue/wiki completion.

Allowed fan-in outputs:

- accepted join;
- rejected join;
- blocker;
- second-review;
- duplicate/archive recommendation;
- new source-ingest leaf;
- new quality/wikilink leaf;
- production-canon bridge row;
- 3D Concept Wiki card/edge candidate.

## Application To The Nine Wikis

The nine-wiki semantic product graph task tree should use this protocol as its scoring layer:

- `agent-wiki/agents/nine-wiki-semantic-product-graph-task-tree-20260523.md`
- `production-canon/docs/nine-wiki-semantic-product-graph-surface-20260523.md`
- `production-canon/tasks/nine-wiki-semantic-product-graph-20260523T0635Z/leaf-pack.json`

Every future wiki/product puzzle-sorting task should produce compatibility scores, not just prose.

## Application To Product-Cannon

The same protocol applies to code/product integration:

- recover code/demo/proof pieces;
- compare variants and stubs;
- connect demos to domains and product surfaces;
- connect product surfaces to proof gates;
- connect proof gates to daily demos and launch blockers.

## Failure Modes

- Treating this as more documentation instead of an assembly algorithm.
- Letting the Chief/operator agent become the compatibility scorer for everything.
- Merging low-confidence joins too early.
- Ignoring privacy/publication fit.
- Using broad scans instead of bounded edge extraction.
- Treating task count as quality.
- Sending fan-out workers to mutate shared surfaces directly.

## Memory-Wipe Restart

If chat memory disappears, restart from this statement:

The work is semantic jigsaw assembly. Segment artifacts into pieces, extract edge vectors, score pairwise compatibility, then fan-in accepted joins into wiki/product clusters, proof gates, 3D concept cards, Kanban rows, and next leaves.
<!-- NINE-WIKI-NO-OUTGOING-REPAIR:START 20260601 -->

## Outgoing Reader Routes

- Candidate outgoing route: [[agent-wiki-agents-nine-wiki-semantic-product-graph-task-tree-20260523|Nine Wiki Semantic Product Graph Task Tree - 2026-05-23]] (same-folder-sibling; score 199). same-folder-sibling; score 199; shared tokens 15; shared tags 4; target backlinks 0; target outgoing 0
- Candidate outgoing route: [[agent-wiki-agents-intra-project-jigsaw-clustering-protocol-20260523|Intra-Project Jigsaw Clustering Protocol - 2026-05-23]] (same-folder-sibling; score 154). same-folder-sibling; score 154; shared tokens 8; shared tags 1; target backlinks 1; target outgoing 1
- Candidate outgoing route: [[agent-wiki-agents-micahone-source-universe-jigsaw-atlas-20260523|Micahone Source Universe Jigsaw Atlas - 2026-05-23]] (same-folder-sibling; score 153). same-folder-sibling; score 153; shared tokens 7; shared tags 2; target backlinks 1; target outgoing 1
- Candidate outgoing route: [[agent-wiki-agents-nine-wiki-intra-cluster-map-20260523|Nine-Wiki Intra-Cluster Map - 2026-05-23]] (same-folder-sibling; score 152). same-folder-sibling; score 152; shared tokens 8; shared tags 2; target backlinks 0; target outgoing 0
- Candidate outgoing route: [[agent-wiki-agents-northstar62-fit-leaf-review-results-20260528|NorthStar 62 Fit-Leaf Review Results - 2026-05-28]] (same-folder-sibling; score 148). same-folder-sibling; score 148; shared tokens 10; shared tags 1; target backlinks 1; target outgoing 1
- Review state: same-wiki repair candidates only; these links improve reader navigation and do not accept proof, publication, product, or cluster truth.
- Repair surface: http://127.0.0.1:8732/v5ma.github.io/wiki/nine-wiki-no-outgoing-body-links.html

<!-- NINE-WIKI-NO-OUTGOING-REPAIR:END -->
