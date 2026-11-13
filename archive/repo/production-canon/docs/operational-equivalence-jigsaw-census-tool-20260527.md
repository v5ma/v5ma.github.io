---
title: Operational Equivalence Jigsaw Census Tool - 2026-05-27
created: 2026-05-27
type: operating-note
tags: [jigsaw, turbovec, patent, operational-equivalence, census, product-graph]
summary: Defines the simple mass-scale Jigsaw census layer derived from the patent mechanism: fixed operational atoms, Scope Lens, Normal Form signatures, and architectural narrative correspondence instead of word matching.
---

# Operational Equivalence Jigsaw Census Tool - 2026-05-27

## Source Anchor

Primary concept source:

- `D:\micahone\D Documents\CORE\patent\PROVISIONAL PATENT APPLICATION 5.txt`

This note does not replace the patent file. It translates the core mechanism into a practical Product Canon/Jigsaw worker primitive.

## Core Correction

The intended Jigsaw search layer is not a better word search. It is a census-like operational correspondence tool.

The fast path is signature-cluster lookup, not pairwise comparison. The patent mechanism works by turning many small observations into canonical rows, then grouping rows that share the same invariant structure under a declared Scope Lens. More rows improve the chance of a real statistical cluster match because a single row can be weak, but repeated compatible rows across actor, operation, operand, context, product role, proof role, and state transition create a stronger architectural signal.

The second fast pass is ranked partial-signature and architectural-narrative lookup. Exact row signatures catch direct operational invariance. Partial signatures catch incomplete but meaningful overlap, such as the same operation-context, actor-operation-operand, actor-operation, behavioral-core, product-transition, narrative-role, or behavior-form even when the full row does not match. Those partial clusters are ranked by member count, source count, field coverage, and profile weight. Architectural narrative similes are then surfaced from narrative partial signatures without doing an O(n squared) comparison across every artifact.

Row invariance should initially increase the number of apparent mismatches because more artifacts can share an abstract row while still differing in surface topic, timing, cadence, medium, or local story. That is expected recall expansion. The ranking layer separates useful candidates from chaff by taking the highest matching signature-cluster evidence as the base rank, then adding positive-only bonus points for architectural narrative isomorphisms. The bonus can lift a partial match; it cannot subtract from the atomic signature match.

Architectural narrative is positive evidence, not a penalty. It examines the context of the signature cluster: how equivalent concept atoms relate to one another, how they sit in the surrounding narrative topic, and how they connect to the big-picture product/proof/wiki context. These context features can strengthen a partial-isomorphism claim. They must not weaken the underlying atomic abstraction match. A strong atom match in an apparently unrelated story should survive as a cross-domain transfer candidate, because that is often exactly where useful coding, product, image-generation, video-generation, or behavior-design analogies come from.

The reason is epistemic: narrative architecture includes more than visible words. Empty space, omission, ordering, timing, cadence, pacing, and surrounding expectations are part of meaning. A changed cadence, topic, or story is unresolved context, not automatic counterevidence; every candidate pair contains differences, and mere difference does not prove unrelatedness. Narrative architecture can add confidence when structure is preserved, but it cannot discount an atomic signature match. A subtract/block event requires a functional contradiction under the active Scope Lens: the operation behavior, causal role, state transition, proof boundary, privacy/safety posture, or allowed side effect is fundamentally incompatible with the target lane.

## Inhibitory Filter Examples

The inhibitory filter is not "different narrative means weaker match." It is "same or similar atoms, but the declared Scope Lens exposes a functional contradiction." The operation behavior or function is fundamentally incompatible with the target lane, so the candidate is disqualified or blocked rather than merely downranked.

At census scale, the inhibitor must be emitted as a small row, not a prose hunch:

| field | meaning |
| --- | --- |
| `lensId` | The active contradiction lens, such as `moat-safe-customer-authoring` or `live-side-effect-safety`. |
| `ruleId` | The repeatable rule that fired. |
| `severity` | `disqualifier` when the operation/function is incompatible with the lane. |
| `sourcePath` / `atomId` | The atom that triggered the lens. |
| `reason` | The functional contradiction, not a vague narrative mismatch. |
| `evidenceSpan` | The local span that made the trigger auditable. |

The correspondence row should keep `signatureRankScore`, `partialSignatureFit`, and `rankSeparationScore` visible even when `inhibitoryFilterTriggered=true` and `decision=blocked`. That is the important audit property: the atomic match was real, but a declared function/behavior contradiction disqualified the result.

## Reverse Signature Ranking

The same signature system works backwards from named superclusters. A supercluster should expose a small set of positive signatures that say "find more of this machine" and a small set of inhibitory signatures that say "find rows that would break this lane." Workers can then run those rows against the larger pool without starting with word similarity.

Positive backward search:

1. Pick a supercluster, such as SVGN, 3D Wiki, portal/impossible, carousel/server-demo, cybersecurity, SIT/Riemann, or MCP-simple customer authoring.
2. Extract its strongest row signatures, partial signatures, artifact signatures, architectural narrative signatures, and bridge signatures.
3. Send those signatures across the corpus as row queries.
4. Rank candidate files by exact signature rank first, then partial signature rank, then positive-only architectural narrative bonus.
5. Send only the best candidates to TurboVec-neighbor expansion, Theater isolation, Jigsaw CLI, or deep worker review.

Reverse/inhibitory search:

1. Turn each contradiction lens into a reverse signature family.
2. Emit one `inhibitorySignatures` row per atom that matches actor, operation, forbidden terms, or a complete disqualifier shape.
3. Group those rows into `reverseSignatureRank` clusters by rule, lens, and matched forbidden structure.
4. Use `disqualifier` rows to block unsafe joins or mark hard no-work zones.
5. Use weaker `graded-inhibitor` rows to shrink or triage the search area without subtracting from positive atomic signature evidence.

This is the census-scale form of an inhibitory filter. It does not say "these words are bad." It says a row has the operation/function shape that contradicts the declared lane. That makes it useful for cybersecurity, moat-safe customer authoring, live side-effect safety, proof-boundary enforcement, and future media labeling, where images, videos, behaviors, or scripts may contain the same operational contradiction with different surface vocabulary.

Moat-safe customer authoring example:

```text
actor: customer
operation: requests/downloads
operand: file
boundedContext: customer-authoring
stateTransition: request -> authorize -> serve
```

That row may correctly match both a customer downloading their published HTML page and a customer trying to download raw proprietary runtime scripts, source maps, build internals, `.env` files, private source trees, or entitlement bypass material. The atomic signature match is real, but the `moat-safe-customer-authoring` lens blocks the second case:

```text
If actor is customer/public
and operation is serves/downloads/exports
and operand class is private-source | source-map | secret | build-internal | entitlement-bypass,
then block under this lens.
```

Live-side-effect example:

```text
actor: agent
operation: edits
operand: document/config
stateTransition: draft -> modify -> publish
```

This can match a safe WYSIWYG document edit and an unsafe live DNS, billing, deployment, Stripe, Supabase, or secret mutation. The similarity should remain visible as an atom match. The inhibitory filter blocks only when the `live-side-effect-safety` lens declares the target class forbidden for the worker context.

The mass-scale pass must be simple, rigid, brief, and replayable:

1. Choose a declared `scopeLensId`.
2. Read a bounded file or segment.
3. Extract fixed operational atom rows.
4. Compile a compact normal-form signature.
5. Store row signature clusters, partial signature clusters, artifact signature clusters, architectural narrative signatures, and architectural narrative similes in queryable tables.
6. Use exact signature-cluster membership as the broad corpus lookup.
7. Use ranked partial-signature clusters as the fast second pass for architectural narrative similes.
8. Compare only cluster-adjacent or externally proposed candidates by operational equivalence and architectural narrative isomorphism.
9. Send only high-value candidates to slower Jigsaw/Theater/deep-worker review.

TurboVec remains useful as a fast vacuum cleaner and candidate feeder. It does not decide compatibility. Word/vector similarity explains why a candidate was inspected, not why it fits.

Surface vocabulary is intentionally non-authoritative. `customer creates WebXR scene for daily demo` and `client generates A-Frame room for demo packet` should land in the same row signature when the Scope Lens maps them to the same actor, operation, operand, and bounded context. The match is not a word match; it is a row-invariant functional-isomorphism match.

## Fixed Census Row

Each file segment should reduce to a small row set. A row is intentionally lossy:

```json
{
  "scopeLensId": "june5-webxr-saas-factory-v1",
  "sourcePath": "path/to/file",
  "segmentId": "path#window-or-line",
  "actor": "customer|agent|worker|runtime|publisher|admin|unknown",
  "operation": "creates|edits|routes|proves|protects|renders|bridges|indexes|serves|ships|unknown",
  "operand": "webxr-scene|wiki-page|proof-row|domain|asset|worker-output|unknown",
  "boundedContext": "daily-demo|june5-ship|product-canon|wiki|security|billing|unknown",
  "dependency": "none|named-path-or-cluster",
  "stateTransition": "input->transform->output",
  "proofConstraint": "required|missing|stale|not-applicable|unknown",
  "productRole": "customer-surface|runtime|control-plane|knowledge-surface|cash-path|unknown",
  "clusterRole": "seed|bridge|leaf|duplicate|baseline|variant|unknown",
  "artifactModality": "text|code|image|video|audio|3d-scene|runtime-event|unknown",
  "bigPictureContext": "webxr-saas-factory|daily-demo-ship-path|domain-template-network|svgn-media-product|security-moat|sit-riemann-proof|san-book-wiki|unknown",
  "failureCondition": "privacy|missing-proof|stale-source|dependency-gap|none|unknown"
}
```

That row is the operational equivalent of a census form: one small structured interaction, repeated across a huge corpus.

Rows should be extracted at sentence, line, or bounded segment scale. One file may produce many rows. The tool should prefer many cheap rows over one coarse summary row because clusters become statistically meaningful only when repeated operational atoms can accumulate.

## Search Model

The search order should be:

1. Row-invariant signature clusters: same normalized actor, operation, operand, bounded context, product role, cluster role, state transition, proof constraint, and failure condition after Scope Lens mapping.
2. Artifact signature clusters: files or segments with the same sorted set of row signature clusters.
3. Ranked partial signatures: partial atomic abstractions that match across full-row gaps.
4. Architectural narrative signatures and similes: surrounding narrative topic, causal-interface pattern, product/proof/wiki role, and big-picture context that can add evidence for partial isomorphism.
5. Cross-domain transfer candidates: high atomic abstraction match with weak narrative overlap, preserved for product/code/design analogy review instead of being downranked away.
6. Bridge signatures: source and candidate connect different major clusters through compatible operations.
7. Normal-form gap: small residual difference after row and role mapping.
8. Deep review: run Jigsaw CLI/Theater/deep worker only on candidates that survive the cheap operational filter.

This gives us a search primitive that can find "same kind of machine behavior" even when filenames, vocabulary, and surface wording differ.

Operational equivalence is not the whole fit problem. It finds "these parts do the same or similar kind of work." The real Jigsaw goal is assembly fit: "these parts work well together." A file like `sd0231` can contain partial matches and partial contradictions at the same time because different functions inside the same artifact may be complementary, polar, or intentionally opposed.

The peanut-butter-and-jelly rule is: do not treat polarity as automatic disqualification. A reverse signature can disqualify substitution, exposure, unsafe publication, or forbidden side effects, but a different operation may still be the right composition partner. `edits + renders`, `protects + serves`, `indexes + routes`, `proves + ships`, and `creates + protects` are not equivalent pairs; they are assembly-fit candidates when they share the same product context or state-transition story.

High-scoring operational-equivalence or analogy returns should also pull a local companion neighborhood. If one atom in a file matches a supercluster signature, nearby non-equivalent atoms in that same file may be exactly the missing component context: controls, safety gates, renderers, validators, adapters, proof gates, or state transitions that make the matched piece usable. These are not "same thing" matches. They are "this strong match came packaged with adjacent parts that may fit the assembly" rows.

Each major cluster should grow a small fit-pattern library from repeated assemblies already known to work. The library is not a pile of files; it is a set of abstract component-fit rows: operation pairs, operand pairs, shared context fields, complementarity type, source evidence, recurrence count, and major-cluster hints. Workers can then search outward for artifacts that match the known way a cluster's parts fit together.

Milestone hubs such as `ev0080` and portal `012` are expected positive-control candidates for `sd0200`/`sd0231`-style carousel and portal monoliths, but they must earn that rank through rows, not filenames. They should emerge when a tray exposes doorway signatures such as carousel state, media/object selection, slot/drop behavior, scene/runtime rendering, portal routing, customer surface, proof/demo gate, or domain-interface transition, and the milestone hub contributes the companion neighborhood that makes those rows assemble into a product surface. In practical terms, `sd0231` should not merely retrieve more carousel-like monoliths. A strong carousel/interaction atom should also pull companion rows for baseline demo shell, portal/interface routing, thirteen-domain bridge, proof path, and customer-visible runtime. If `ev0080` or `012` appears, the worker must say which rows made it a fit-pattern companion and which existing surface would absorb the relation after fan-in.

The same scoring also runs in reverse. A worker can hold one anchor fixed and ask which file in a family fits it best: `ev0080 -> sd0200-series`, `Vision/PRD -> sd0200-series`, `sd0231 -> sd0200-series`, or `best wiki link between two documents`. This is the same fit-census ranking, just with the query side declared. The output is not "this filename is famous"; it is a ranked edge with direct signature score, partial signature overlap, assembly-fit score, bridge-chain score, proof/provenance score, route/privacy gate, and candidate score. For wiki work, the edge becomes a candidate wikilink only after page-index and privacy review. For code/product work, the same edge becomes a best-fit-pair or best-version candidate for fan-in.

There are three separate reverse modes for the `sd0200` line:

1. Anchor-fit mode: which `sd02xx` file best fits `ev0080`, portal `012`, Vision, PRD, or another declared anchor?
2. Intrinsic version-health mode: which `sd02xx` files look like baselines, landmarks, ordinary variants, or dysfunction candidates from the inside of the files alone?
3. Historical defect-prior mode: which `sd02xx` files were repeatedly named by chat logs, proof notes, worker handoffs, or worklogs as glitching, broken, warning-caveated, missing routes, or console-error sources?

Historical defect-prior rows are not runtime proof. They are the static equivalent of a witness statement: "this file has been named as glitching before." The correct use is to join that prior with intrinsic fit-census evidence and current proof. The chat row must preserve user-experience flags rather than flattening everything into a defect score: `baseline-marker`, `landmark-marker`, `best-so-far-marker`, `advancing-file-with-known-defects`, `net-advance-with-regression-caveat`, `strong-regression-report`, `warning-caveat`, `missing-route-or-source`, and `glitch-experienced`. A file can be a new baseline or landmark and still have known defects. A file with "clear regression" language is a stronger backward-movement candidate than a file described as "two steps forward and one step back." The runner therefore emits `userExperienceFlags[]`, `userExperienceFlagTerms`, `versionExperienceClass`, and `contextualDefectPriorScore` so workers can read the witness context before using any numeric prior. This lets the system identify likely broken versions without executing them, while still requiring current proof before final verdict.

AI chat logs are a high-value source for this defect-prior layer because many prior assistants and users named the exact files that were glitching, improving, regressing, becoming baselines, or becoming landmarks. Workers should not treat those logs as broad prose to summarize. They should extract bounded named-glitch/version-experience witness rows: exact file name or path if present, speaker/source pointer, defect verb, regression/baseline/landmark wording, failure surface, date/session pointer, surrounding non-secret span, and whether the named file maps to current source, recovery copy, archive duplicate, unresolved bare name, or deleted/missing source. This turns chat history into a repair-seed and version-health index without copying private transcripts into product truth.

Named-glitch witness rows are useful because they can be joined with fit-pattern census rows. If `sd0231`, `_worker.js`, `server-demo.html`, a timeline editor, portal `012`, or another file is repeatedly named as glitching, the system should ask: was it experienced as a baseline with known defects, a landmark with residual defects, a net advancement with a regression caveat, a clear regression, a missing-route source, or stale chat-only evidence? Then ask whether the file also has high major-cluster landmark score, high companion-fit value, missing companion rows, contradictory state transitions, or stale proof links. The result is a prioritized source/proof readback card. It is not authorization to edit the source and it is not proof that the current file is still broken.

The deeper use is pattern learning. Repeated user-experience flags should be joined to repeated code signatures and assembly-fit signatures. A row can say "this follower-sequence pattern repeatedly appeared in baseline/landmark files," "this route/bootstrap pattern repeatedly appeared in clear regressions," or "this carousel-plus-notes assembly was best-so-far but carried warning caveats." Those joined rows become good-signature, bad-signature, and caution-signature evidence for future WebXR SaaS product/code design. They can seed narrow skills or workflow checks only after recurrence is proven and current source/proof review confirms the pattern is real.

Vision/PRD anchors work as assembly blueprints, not as ordinary files to summarize. The census should extract `demand rows` from `v5ma2026/vision.md`: desired object roles, state transitions, product contracts, proof gates, and safety constraints. It should then extract `supply rows` from code/docs/proofs across the corpus and score whether a leaf supplies, complements, blocks, or proves one of those Vision roles. For example, the Vision row `author content once -> structured data -> 2D HTML and A-Frame carousel surfaces` can pair a prose leaf about WYSIWYG blocks with a code leaf that loads JSON into carousel slots, plus a proof leaf that verifies the runtime route. Those leaves may not be equivalent to one another. They fit because each supplies a different adjacent role in the Vision assembly.

The Vision pairing pass should emit small rows such as `visionSegmentId`, `visionDemandSignature`, `sourcePath`, `supplySignature`, `fitRelation=supplies|complements|proves|blocks|duplicates`, `companionNeeded`, `companionFound`, `proofStatus`, and `nextFanInTarget`. This lets a worker ask not only "what matches the Vision wording?" but "which files fulfill, complete, or verify this part of the Vision, and which code/doc/proof companions should be paired together?"

Direct Vision matching is not enough. Different documents can write the same Vision component at different abstraction levels: Vision, PRD, business lanes, wiki pages, proof reviews, and implementation notes may each express the same target with different vocabulary and different operational precision. The census therefore also emits `vision bridge-chain` rows where a companion document translates a Vision demand into an operational row, and then a code/runtime/proof leaf fits that companion row. The intended chain is `Vision demand -> companion documentation -> implementation/proof leaf`. A code leaf can match Vision indirectly through PRD, business-lane, wiki, or proof documentation without being forced to match the exact wording of `vision.md`.

The bridge-chain pass should emit rows such as `visionBridgeChainId`, `bridgeDocPath`, `bridgeDocSignature`, `leafSourcePath`, `leafSignature`, `chainRelation=doc-to-runtime-leaf|doc-to-proof-leaf|doc-to-complement-leaf|doc-to-supply-leaf`, `chainScore`, `companionChain`, `directVisionFitBoundary`, `proofStatus`, and `nextFanInTarget`. This is the mechanism that makes companion documentation useful as translation tissue rather than extra prose.

The runner emits this first assembly-fit family as:

- `polarity-complementarity-signatures.jsonl`
- `assembly-fit-signatures.jsonl`
- `polarityComplementaritySignatures[]`
- `assemblyFitSignatures[]`
- `context-companion-signatures.jsonl`
- `assembly-context-companion-signatures.jsonl`
- `assembly-fit-pattern-library.jsonl`
- `major-cluster-fit-pattern-library.jsonl`
- `vision-demand-supply-assertions.jsonl`
- `vision-bridge-chain-assertions.jsonl`
- `wiki-link-candidate-assertions.jsonl`
- `historical-defect-mention-assertions.jsonl`
- `version-health-assertions.jsonl`
- `experience-code-signature-assertions.jsonl`
- `contextCompanionSignatures[]`
- `assemblyContextCompanionSignatures[]`
- `assemblyFitPatternLibrary[]`
- `majorClusterFitPatternLibrary[]`
- `visionDemandSupplyAssertions[]`
- `visionBridgeChainAssertions[]`
- `wikiLinkCandidateAssertions[]`
- `historicalDefectMentionAssertions[]`
- `versionHealthAssertions[]`
- `experienceCodeSignatureAssertions[]`

These rows are candidate evidence for composition/assembly only. They do not prove substitution, public-exposure safety, product readiness, or accepted truth. In the Jigsaw metaphor, these are the rows that start answering the actual question: not only "what is similar?" but "what parts fit together?"

## Companion-Fit Promotion Boundary

The companion-fit contract is now captured in `production-canon/docs/companion-fit-signature-worker-contract-20260527.md`. Use that note when a worker needs to decide whether a relation is ready for capability-canon packaging.

The short rule is:

- preserve low-pair-score/high-companion-evidence rows instead of deleting them;
- keep `equivalence-doorway`, `analogy-doorway`, `complementarity`, `context-companion`, `fit-pattern-companion`, `known-good-fit-pattern`, and `inhibitor` as separate relation types;
- emit `rowOverlapAnchor`, `overlapCount`, `signatureRowCount`, `companionRoleSignature`, `currentRouteRole`, `companionRouteRole`, `promotionBoundary`, and `nextFanInTarget`;
- promote only the worker contract unless an accepted proof, demo, wiki, Product Canon, or source/proof surface absorbs the exact relation.

The relation-specific inhibitor boundary is captured in `production-canon/docs/relation-specific-inhibitor-boundary-capability-20260527.md`. Use that note when a row has useful match evidence and a blocking relation at the same time. The short rule is: block only the unsafe relation, preserve allowed evidence, and name the exact proof gate that could narrow the blocker.

All-pairs scoring is not the normal corpus-scale mechanism. It is only acceptable for tiny samples, debugging, or proof fixtures. Broad runs should use `--skip-correspondences` to emit census rows and signature clusters, or `--candidate-pairs-file` when TurboVec, cluster adjacency, or another bounded feeder already proposed candidate pairs.

## Partial Signatures And Narrative Similes

Partial signatures are not weaker word matches. They are deliberately smaller normal forms over selected fields. Current profile families include:

- `operational-core`: actor, operation, operand, bounded context.
- `operation-context`: operation, operand, bounded context.
- `actor-operation-operand`: actor, operation, operand.
- `actor-operation`: actor and operation.
- `behavioral-core`: operation, operand, state transition.
- `narrative-role`: product role, cluster role, state transition, proof constraint.
- `product-transition`: product role, state transition, bounded context.
- `modality-behavior`: operation, operand, state transition, product role.

The rank score is a cheap corpus signal, not a verdict. It combines cluster membership, distinct source count, field coverage, and a profile weight. High-rank partial signatures tell the next pass where architectural narrative similarity is concentrated.

Architectural narrative similes are cluster-level matches such as "customer authoring surface goes edit->publish->serve inside daily-demo context" even when one artifact is a document, another is an image brief, another is a video segment, and another is a runtime behavior trace. This is the bridge between operational-equivalence search and multimodal retrieval/generation.

Narrative mismatch is not negative evidence against the atom match. It means the row should be kept as a possible cross-domain transfer: same useful abstract machine, different surface story. To reject or downrank, the worker must name a rule-bound contradiction, not just point to a difference, changed cadence, changed timing, or changed topic.

## Multimodal And Generation Scope

The row model is modality-neutral. The same fields can be extracted from:

- text documents and patent claims;
- source code and runtime logs;
- image labels, screenshots, scene descriptions, and thumbnails;
- video frame/shot/action summaries;
- audio transcripts or event annotations;
- 3D scenes, splats, meshes, room graphs, and interaction traces;
- image-generation or video-generation prompts and outputs.

For search retrieval, the system finds artifacts that share operational or narrative structure. For generation, the same mechanism can condition an image/video/scene generator on a desired architectural narrative signature: actor, operation, operand, context, transition, role, and constraints, rather than just a bag of prompt words.

## Store Boundary

The current best architecture is still a bridge, not a hidden merge:

- TurboVec stores fast vector/corpus retrieval.
- Operational Jigsaw Census stores atom rows and normal-form signatures.
- Jigsaw SQLite stores candidate pieces, edges, assemblies, and verdict-adjacent evidence.
- Product Canon and wiki proof records decide accepted truth.

The bridge key should be exact path plus segment id plus scope lens id. A candidate can have multiple rows under different lenses, and those rows should not be collapsed without preserving the lens.

The candidate-to-verdict row contract is now captured in `production-canon/docs/candidate-routing-verdict-authority-capability-20260527.md`. Census outputs should remain `rankIsProof: false` and `verdictAuthority: false` until a lane-owned fan-in surface writes `verdictState`, `proofPath` or `blockerPath`, `claimBoundary`, `absorbedSurface`, and `nextExactGate`.

## Worker Use

Runnable primitive:

- `production-canon\scripts\run-operational-equivalence-census.py`

Mass-scale command shape:

```powershell
python production-canon\scripts\run-operational-equivalence-census.py `
  --root D:\micahone\vscode v5ma\v5ma.github.io `
  --paths-file input-paths.txt `
  --out-dir output\operational-equivalence-census `
  --skip-correspondences
```

Candidate-fed command shape:

```powershell
python production-canon\scripts\run-operational-equivalence-census.py `
  --root D:\micahone\vscode v5ma\v5ma.github.io `
  --paths-file input-paths.txt `
  --candidate-pairs-file candidate-pairs.txt `
  --out-dir output\operational-equivalence-candidate-fit
```

Every June 5 worker should now produce:

- `fit-survey.json` with `operationalEquivalenceMapping`
- `operational-equivalence-map.json`
- `signature-clusters.jsonl`
- `partial-signature-clusters.jsonl`
- `artifact-signature-clusters.jsonl`
- `architectural-narrative-signatures.jsonl`
- `architectural-narrative-similes.jsonl`
- `polarity-complementarity-signatures.jsonl`
- `assembly-fit-signatures.jsonl`
- `context-companion-signatures.jsonl`
- `assembly-context-companion-signatures.jsonl`
- `assembly-fit-pattern-library.jsonl`
- `major-cluster-fit-pattern-library.jsonl`
- `inhibitory-signatures.jsonl`
- `reverse-signature-rank.jsonl`
- Theater isolation note proving TurboVec score/order did not become Jigsaw compatibility evidence
- normal-form gap or explicit non-equivalence reason

Workers are not asked to perform philosophical interpretation at scale. They are asked to fill many small operational census rows, compare the row signature clusters against known major cluster objects, and send only promising matches to deeper review.

## Why This Matters

The haystack is too large for context-window comprehension. A vector index can find word-near neighbors quickly, but the product problem requires finding operationally equivalent pieces across different vocabularies, domains, wikis, backups, source files, product clusters, and proof records.

The census-grade Jigsaw layer is the missing middle: cheap enough to run broadly, structured enough to beat word matching, and explicit enough to audit.
