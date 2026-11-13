---
title: Major Cluster Signature Census Operational Shape Workflow - 2026-06-05
created: 2026-06-05
type: production-workflow-map
tags: [major-clusters, signature-census, fit-census, jigsaw, product-graph, workflow]
summary: Workflow for turning one operational signature community or underanchored NorthStar row into owner fan-in, anchor repair, product-code planning, wiki-source routing, or candidate-only state.
---

# Major Cluster Signature Census Operational Shape Workflow

## Trigger

Use this workflow when the Major Cluster Signature Census names a signature community, split NorthStar cluster, merged signature community, missing or underanchored NorthStar row, or novel signature community that may need owner routing.

## Workflow

| Step | Action | Gate | Output |
| --- | --- | --- | --- |
| 1. Select one row | Open one signature community or one underanchored NorthStar row. | Do not process the whole census as closure. | `selectedSignatureRow`. |
| 2. Preserve row fields | Record actor, operation, operand, product role, proof role, runtime role, privacy gate, source pointer, and evidence family. | Missing fields stop as anchor repair. | `signatureShape`. |
| 3. Overlay labels | Compare to NorthStar or product labels after signature clustering. | Labels are coverage audit only. | `knownLabelOverlay`. |
| 4. Classify state | Mark aligned, split, merged, missing, underanchored, novel, owner-needed, candidate-only, or skip. | State is routing evidence, not truth. | `shapeState`. |
| 5. Choose owner route | Route to graph fast/slow boundary, source-universe triage, graph-to-runtime atom promotion, wiki/source review, capability/workflow/skill update, fit-pattern library, or anchor repair. | If no owner can decide, stop candidate-only. | `ownerRoute`. |
| 6. Emit terminal row | Name allowed write surface, no-touch set, blocked claims, proof/readback boundary, rollback if mutation is possible, and stop condition. | Worker validity requires product code/assets/surfaces or a concrete product-code plan. | terminal state. |

## Terminal States

- `aligned-signature-community`
- `split-northstar-signature`
- `merged-signature-community`
- `missing-or-underanchored-northstar`
- `novel-or-unmapped-signature-community`
- `owner-fanin-needed`
- `anchor-repair-needed`
- `runtime-atom-candidate`
- `wiki-source-route-candidate`
- `capability-workflow-skill-update-ready`
- `candidate-only`
- `skip-no-fit`

## Owner Routes

- Runtime/product-code leaf: use `graph-to-runtime-atom-promotion-workflow-20260604.md`.
- Source-universe action row: use `source-universe-action-ready-row-triage-workflow-20260604.md`.
- Graph routing/coverage row: use `graph-tool-fast-slow-mode-boundary-workflow-20260605.md`.
- Seedless page/path overlay row: use `seedless-community-label-overlay-workflow-20260605.md`.
- Wiki link/source route row: use `nine-wiki-reader-link-verdict-applier-workflow-20260605.md` or the owning wiki workflow.
- Repeated assembly pattern: use `major-cluster-fit-pattern-library` or `workflow-pattern-mining`.
- Missing anchors: emit `anchor-repair-needed`, not a Worker task.

## Blocked Moves

- Treating signature community membership as product truth, proof truth, wiki truth, source truth, accepted recurrence, customer readiness, public readiness, source mutation authority, queue closure, deploy authority, billing authority, DNS authority, secrets authority, customer-data authority, generated-index mutation authority, or archive authority.
- Generating worker cards from aligned/split/merged/missing/novel states unless the card builds product code/assets/surfaces or plans a concrete product-code change.
- Mutating Agent Wiki, generated graph files, Product Canon, nine-wiki source, runtime source, queues, proof packets, deploy state, DNS, billing, secrets, customer data, or archives from this workflow without the downstream owner route explicitly accepting that action.

## Evidence

- Capability note: `production-canon/docs/major-cluster-signature-census-operational-shape-capability-20260605.md`.
- Agent Wiki census: `agent-wiki/agents/agent-wiki-major-cluster-signature-census-20260531.md`.
- Machine output: `agent-wiki/data/agent-wiki-major-cluster-signature-census-20260531.json`.
