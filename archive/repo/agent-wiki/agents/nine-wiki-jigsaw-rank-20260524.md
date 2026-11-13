---
title: Nine-Wiki JigsawRank - 2026-05-24
created: 2026-05-24
updated: 2026-06-01
type: nine-wiki-jigsaw-rank
tags: [agent-wiki, nine-wiki, semantic-jigsaw, pagerank, worker-routing, wiki-lanes]
summary: Low-cost PageRank-like routing layer that ranks wiki edges, source clusters, pages, and next worker seeds before expensive LLM repair assignments.
---

# Nine-Wiki JigsawRank - 2026-05-24

## Contract

JigsawRank is the cheap ranking layer for the [nine-wiki jigsaw assembly state](/v5ma.github.io/agent-wiki/agents/nine-wiki-jigsaw-assembly-state-20260523.md) and the [intra-cluster map](/v5ma.github.io/agent-wiki/agents/nine-wiki-intra-cluster-map-20260523.md).

It does not decide truth, publish pages, or ingest private note bodies. It ranks which candidate wiki edge, [source cluster](/v5ma.github.io/agent-wiki/agents/micahone-source-universe-jigsaw-atlas-20260523.md), [page gap](/v5ma.github.io/agent-wiki/agents/nine-wiki-public-page-quality-audit-20260524.md), or bridge should be inspected next so the governor does not spend workers on low-yield comparisons, while privacy-sensitive inputs remain bounded by the [private-note quarantine review](/v5ma.github.io/agent-wiki/agents/notes-private-sensitive-quarantine-review-20260524.md).

The routing contract is downstream of the [semantic jigsaw solver assembly protocol](/v5ma.github.io/agent-wiki/agents/semantic-jigsaw-solver-assembly-protocol-20260523.md), the [intra-project jigsaw clustering protocol](/v5ma.github.io/agent-wiki/agents/intra-project-jigsaw-clustering-protocol-20260523.md), and the [jigsaw cluster bridge candidates](/v5ma.github.io/agent-wiki/agents/jigsaw-cluster-bridge-candidates-20260523.md). It also stays aligned with the [wiki lane worker contract redesign](/v5ma.github.io/agent-wiki/agents/wiki-lane-worker-contract-redesign-20260524.md), so rankings can seed bounded worker repairs without turning JigsawRank into a publisher.

## Generated Artifacts

These artifacts bind the [jigsaw assembly state](/v5ma.github.io/agent-wiki/agents/nine-wiki-jigsaw-assembly-state-20260523.md), [intra-cluster map](/v5ma.github.io/agent-wiki/agents/nine-wiki-intra-cluster-map-20260523.md), [sparse jigsaw canvasing pass](/v5ma.github.io/agent-wiki/agents/nine-wiki-sparse-jigsaw-canvasing-20260524.md), and [presort strategy benchmark](/v5ma.github.io/agent-wiki/agents/nine-wiki-presort-strategy-benchmark-20260524.md) into one controller-readable routing surface.

| Artifact | Purpose |
|---|---|
| `agent-wiki/data/nine-wiki-jigsaw-rank-20260524.json` | Full JigsawRank payload for controllers and future agents. |
| `agent-wiki/data/nine-wiki-jigsaw-rank-edges-20260524.csv` | Ranked candidate edge list. |
| `agent-wiki/data/nine-wiki-jigsaw-rank-wikis-20260524.csv` | Ranked wiki queue pressure list. |
| `agent-wiki/data/nine-wiki-jigsaw-rank-sources-20260524.csv` | Ranked source-cluster list, metadata only. |
| `agent-wiki/data/nine-wiki-jigsaw-rank-task-seeds-20260524.json` | Seed-only worker prompts; not loaded into a dispatcher by this script. |
| `agent-wiki/data/jigsaw-feedback-events.jsonl` | Append-only accepted/rejected/deferred/proof/blocker event ledger consumed before scoring. |

## Scoring Model

- Edge score: `0.72*intraEdgeScore + relationshipBonus + gapBonus + sourceBonus + bridgeBonus + feedbackDelta - privacyPenalty - dedupePenalty`, with intra-edge context coming from the [nine-wiki intra-cluster map](/v5ma.github.io/agent-wiki/agents/nine-wiki-intra-cluster-map-20260523.md), gap pressure checked against the [nine-wiki public page quality audit](/v5ma.github.io/agent-wiki/agents/nine-wiki-public-page-quality-audit-20260524.md), bridge pressure checked against the [jigsaw cluster bridge candidates](/v5ma.github.io/agent-wiki/agents/jigsaw-cluster-bridge-candidates-20260523.md), and feedback deltas aligned to the [Atlas agentic feedback loop continuity](/v5ma.github.io/agent-wiki/agents/atlas-agentic-feedback-loop-continuity-20260522.md).
- Wiki score: `topEdgeScore + meanTop3Edges + eligibleSourceFood + sourceBridgePressure + saturationGap + cappedFeedbackDelta - held/private penalties`, using source-food pressure from the [Micahone source universe jigsaw atlas](/v5ma.github.io/agent-wiki/agents/micahone-source-universe-jigsaw-atlas-20260523.md) while held/private penalties follow the [private-note quarantine review](/v5ma.github.io/agent-wiki/agents/notes-private-sensitive-quarantine-review-20260524.md) and source dedupe checks follow the [personal archive source candidates](/v5ma.github.io/agent-wiki/agents/nine-wiki-personal-archive-source-candidates-20260523.md).
- Source score: `metadata-only source-cluster score plus confidence, privacy, current-note quarantine gates, and feedbackDelta`, with private-note gates checked against the [current notes signature index](/v5ma.github.io/agent-wiki/agents/nine-wiki-current-notes-signature-index-20260523.md).
- Page score: `wikilink related-field PageRank when available; metadata fallback when related graph is empty`, with sparse graph candidates coming from [nine-wiki sparse jigsaw canvasing](/v5ma.github.io/agent-wiki/agents/nine-wiki-sparse-jigsaw-canvasing-20260524.md).
- Feedback score: `append-only JSONL events with typed weights; workers append accepted/rejected/deferred/proof/blocker evidence and the next rebuild reranks from that evidence`.

## Feedback Loop

The rank builder now consumes `agent-wiki/data/jigsaw-feedback-events.jsonl` before scoring, keeping the feedback cycle aligned with the [Atlas agentic feedback loop continuity](/v5ma.github.io/agent-wiki/agents/atlas-agentic-feedback-loop-continuity-20260522.md). Workers and fan-in reviewers should append one compact JSON object per finding:

`eventType`, `wikiId`, optional `edgeId`, optional `sourceClusterId`, optional `rankDelta`, optional `statusOverride`, optional `proofPaths`, and a short `note`.

Accepted joins, proof paths, and cleared dedupe gates raise rank. Rejections, blockers, stale paths, source exhaustion, sensitive holds, and dedupe holds lower rank. This makes the next controller cycle select from the updated [jigsaw assembly state](/v5ma.github.io/agent-wiki/agents/nine-wiki-jigsaw-assembly-state-20260523.md) instead of old assumptions.

Source-side pressure should be interpreted against the [Micahone source universe jigsaw atlas](/v5ma.github.io/agent-wiki/agents/micahone-source-universe-jigsaw-atlas-20260523.md), the [current notes signature index](/v5ma.github.io/agent-wiki/agents/nine-wiki-current-notes-signature-index-20260523.md), and the [personal archive source candidates](/v5ma.github.io/agent-wiki/agents/nine-wiki-personal-archive-source-candidates-20260523.md), not as permission to expose private content. Page-side pressure should be cross-checked with the [nine-wiki public page quality audit](/v5ma.github.io/agent-wiki/agents/nine-wiki-public-page-quality-audit-20260524.md), the [public page quality contract](/v5ma.github.io/agent-wiki/agents/nine-wiki-public-page-quality-contract-20260524.md), the [sparse jigsaw canvasing pass](/v5ma.github.io/agent-wiki/agents/nine-wiki-sparse-jigsaw-canvasing-20260524.md), and the [presort strategy benchmark](/v5ma.github.io/agent-wiki/agents/nine-wiki-presort-strategy-benchmark-20260524.md) before a worker treats a high score as a repair order. Product-graph pressure remains a routing input from the [semantic product graph task tree](/v5ma.github.io/agent-wiki/agents/nine-wiki-semantic-product-graph-task-tree-20260523.md), not a replacement for evidence.

Current feedback events: `1201`. Ledger parse errors: `0`.

## Reviewed Worker-Routing Hub

The accepted wave-01 hub for the Agent Wiki semantic routing worker lane is [Jigsaw Nine Semantic Routing Worker Cluster](./jigsaw-nine-semantic-routing-worker-cluster.md).

Use that hub when a future worker needs the compact route from JigsawRank pressure to the Bridge Index, Worker Contract, Completeness Audit, and Link Resolution Repair surfaces. This link is a routing acceptance from the wave-01 fan-in, not proof, publication, deployment, or product-completion truth.

## Top Wiki Pressure

| rank | wiki | score | top edge | eligible notes | source joins | status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | san | 164.99 | san:toc-to-page-corpus, san:home-to-page-corpus | 87 | 20 | partial-assembly |
| 2 | comparisons | 147.87 | comparisons:home-to-page-corpus, comparisons:page-corpus-to-link-graph | 107 | 4 | partial-assembly |
| 3 | nervegear | 143.55 | nervegear:recover-page-index, nervegear:home-to-page-corpus | 35 | 5 | needs-source-or-reader-recovery |
| 4 | agent-wiki | 141.04 | agent-wiki:home-to-page-corpus, agent-wiki:page-corpus-to-link-graph | 19 | 13 | sorting-tray |
| 5 | impossible | 138.47 | impossible:home-to-page-corpus, impossible:page-corpus-to-link-graph | 286 | 13 | partial-assembly |
| 6 | v5ma | 137.08 | v5ma:home-to-page-corpus, v5ma:page-corpus-to-link-graph | 49 | 15 | partial-assembly |
| 7 | svgn | 125.01 | svgn:home-to-page-corpus, svgn:page-corpus-to-link-graph | 103 | 35 | partial-assembly |
| 8 | riemann | 102.68 | riemann:quality-gate-to-page-corpus, riemann:home-to-page-corpus | 83 | 7 | partial-assembly |
| 9 | theology | 96.23 | theology:quality-gate-to-page-corpus, theology:home-to-page-corpus | 139 | 4 | partial-assembly |

## Top Candidate Edges

| rank | edge | wiki | score | lane | status |
| --- | --- | --- | --- | --- | --- |
| 1 | san:toc-to-page-corpus | san | 165.6 | C+/D | ranked-ready-seed |
| 2 | nervegear:recover-page-index | nervegear | 144.04 | W/reader-recovery | ranked-ready-seed |
| 3 | nervegear:home-to-page-corpus | nervegear | 138.87 | C+/D | ranked-ready-seed |
| 4 | nervegear:page-corpus-to-link-graph | nervegear | 136.55 | D/Q-link | ranked-ready-seed |
| 5 | comparisons:home-to-page-corpus | comparisons | 129.36 | C+/D | ranked-ready-seed |
| 6 | nervegear:toc-to-page-corpus | nervegear | 129.35 | C+/D | ranked-ready-seed |
| 7 | comparisons:page-corpus-to-link-graph | comparisons | 127.04 | D/Q-link | ranked-ready-seed |
| 8 | comparisons:toc-to-page-corpus | comparisons | 127.04 | C+/D | ranked-ready-seed |
| 9 | nervegear:quality-gate-to-page-corpus | nervegear | 126.95 | Q/Q-fix | ranked-ready-seed |
| 10 | san:home-to-page-corpus | san | 126.16 | C+/D | ranked-ready-seed |
| 11 | agent-wiki:home-to-page-corpus | agent-wiki | 125.03 | C+/D | ranked-ready-seed |
| 12 | nervegear:page-corpus-to-source-corpus | nervegear | 123.96 | source-feeder/Q/C+ | ranked-ready-seed |
| 13 | comparisons:quality-gate-to-page-corpus | comparisons | 123.92 | Q/Q-fix | ranked-ready-seed |
| 14 | san:page-corpus-to-link-graph | san | 123.84 | D/Q-link | ranked-ready-seed |
| 15 | impossible:home-to-page-corpus | impossible | 123.03 | C+/D | ranked-ready-seed |
| 16 | agent-wiki:page-corpus-to-link-graph | agent-wiki | 122.71 | D/Q-link | ranked-ready-seed |
| 17 | v5ma:home-to-page-corpus | v5ma | 122.43 | C+/D | ranked-ready-seed |
| 18 | comparisons:reader-to-page-index | comparisons | 121.92 | W/reader | ranked-ready-seed |
| 19 | agent-wiki:reader-to-page-index | agent-wiki | 121.91 | W/reader | ranked-ready-seed |
| 20 | impossible:page-corpus-to-link-graph | impossible | 120.71 | D/Q-link | ranked-ready-seed |

## Top Source Clusters

| rank | source cluster | wiki | score | status |
| --- | --- | --- | --- | --- |
| 1 | self-aware-networks-source | san | 117.06 | ranked-source-candidate |
| 2 | v5ma-active-workspace | agent-wiki | 92 | ranked-source-candidate |
| 3 | v5ma-active-workspace | v5ma | 91.74 | ranked-source-candidate |
| 4 | v5ma-active-workspace | impossible | 87.49 | ranked-source-candidate |
| 5 | vscode-v5ma-workspace | v5ma | 83.25 | ranked-source-candidate |
| 6 | top-obs | impossible | 82.52 | ranked-source-candidate |
| 7 | runtime-and-control-planes | agent-wiki | 82 | review-before-worker-assignment |
| 8 | vscode-v5ma-workspace | agent-wiki | 81.71 | ranked-source-candidate |
| 9 | top-obs | v5ma | 81.13 | ranked-source-candidate |
| 10 | top-obs | svgn | 79.82 | ranked-source-candidate |
| 11 | private-git-backups | agent-wiki | 78.88 | review-before-worker-assignment |
| 12 | v5ma-active-workspace | comparisons | 78.22 | ranked-source-candidate |
| 13 | vscode-v5ma-workspace | san | 77.65 | ranked-source-candidate |
| 14 | private-git-backups | v5ma | 77.15 | review-before-worker-assignment |
| 15 | vscode-v5ma-workspace | impossible | 77.05 | ranked-source-candidate |

## Lane Translation

Statistical prefilter lanes use [SourceRank and source-supports-page edges](/v5ma.github.io/agent-wiki/agents/micahone-source-universe-jigsaw-atlas-20260523.md) to create better source-food candidates, with candidate ordering checked against the [presort strategy benchmark](/v5ma.github.io/agent-wiki/agents/nine-wiki-presort-strategy-benchmark-20260524.md) before workers compare pages under the [semantic jigsaw solver assembly protocol](/v5ma.github.io/agent-wiki/agents/semantic-jigsaw-solver-assembly-protocol-20260523.md).

Q lanes use JigsawRank to review high-risk or high-leverage fits first, then hold the resulting public article changes to the [nine-wiki public page quality audit](/v5ma.github.io/agent-wiki/agents/nine-wiki-public-page-quality-audit-20260524.md) and [quality contract](/v5ma.github.io/agent-wiki/agents/nine-wiki-public-page-quality-contract-20260524.md).

C+ and NWBQ lanes consume bounded ranked bundles after gates as integration-quality repair tasks under the [Wiki Lane Worker Contract Redesign - 2026-05-24](/v5ma.github.io/agent-wiki/agents/wiki-lane-worker-contract-redesign-20260524.md).

D/link lanes use [missing-link, home-coverage, and TOC edge ranks](/v5ma.github.io/agent-wiki/agents/nine-wiki-sparse-jigsaw-canvasing-20260524.md) to strengthen accepted wiki edges, with public-page outcomes held to the [Nine-Wiki Public Page Quality Contract - 2026-05-24](/v5ma.github.io/agent-wiki/agents/nine-wiki-public-page-quality-contract-20260524.md).

Lane E stays single-flight and only promotes accepted assemblies.

## Privacy And Dedupe Gates

Current-note data is represented only by [quarantine counts](/v5ma.github.io/agent-wiki/agents/notes-private-sensitive-quarantine-review-20260524.md). This document and the public JSON do not include current-note filenames, paths, snippets, or bodies; the metadata boundary follows the [current notes signature index](/v5ma.github.io/agent-wiki/agents/nine-wiki-current-notes-signature-index-20260523.md).

SAN source-supports-page work remains gated until [SAN overlap dedupe](/v5ma.github.io/agent-wiki/agents/nine-wiki-personal-archive-source-candidates-20260523.md) confirms that a note/source is not already present through the 2022 SAN GitHub/wiki path, with source-candidate handling aligned to the [personal archive source candidates](/v5ma.github.io/agent-wiki/agents/nine-wiki-personal-archive-source-candidates-20260523.md).

## Controller Use

The demand controller should use `agent-wiki/data/nine-wiki-jigsaw-rank-20260524.json` as a ranking input, not as proof. A [worker card](/v5ma.github.io/agent-wiki/agents/wiki-lane-worker-contract-redesign-20260524.md) should name one ranked edge, one wiki, one lane contract, and one bounded output, then route back through the [Agent Wiki home](/v5ma.github.io/agent-wiki/home.md) when a fresh session needs orientation. The controller should prefer `ranked-ready-seed` edges before private/review edges unless the user explicitly changes the priority.

The isolated nine-wiki controller at `production-canon/runtime/governor-dispatcher-bundles/wiki-lane-ohm-cron-vendacitor-nine-wiki-planning-20260522T171409Z/isolated-cap19-control-plane/WIKI-LANE-DEMAND-CONTROLLER-V4.js` now reads this rank file, orders active lane programs by wiki/edge rank under budget pressure, and embeds the selected JigsawRank edge in generated worker cards governed by the [wiki lane worker contract redesign](/v5ma.github.io/agent-wiki/agents/wiki-lane-worker-contract-redesign-20260524.md). It does not resume or launch workers by itself.

## Memory-Wipe Restart

Restart from `agent-wiki/data/nine-wiki-jigsaw-rank-20260524.json`. Pick the highest ranked edge whose status is safe for the current privacy and dedupe gates, using the [sparse jigsaw canvasing](/v5ma.github.io/agent-wiki/agents/nine-wiki-sparse-jigsaw-canvasing-20260524.md) page when bridge coverage needs a bounded candidate source. Then emit a bounded [worker card](/v5ma.github.io/agent-wiki/agents/wiki-lane-worker-contract-redesign-20260524.md) that preserves the lane contract listed on that edge.
<!-- NINE-WIKI-FIT-JIGSAW-ROUTES:START 20260601 -->

## Related Graph Routes

- Fit/Jigsaw cluster hub: [[agent-wiki-nine-jigsaw-memory-import-cluster-cluster|Nine Jigsaw Memory Import Cluster]]
- Prior graph target: [[agent-wiki-nine-map-dsr-memory-pipv-cluster|Nine Map Dsr Memory Pipv]]
- Nearby candidate pages: [[agent-wiki-agents-two-d-three-d-nine-wiki-governor-branch-20260524|2D/3D Hercules-Owned Nine Wiki Branch - 2026-05-24]], [[agent-wiki-agents-intra-project-jigsaw-clustering-protocol-20260523|Intra-Project Jigsaw Clustering Protocol - 2026-05-23]], [[agent-wiki-agents-nine-wiki-sparse-jigsaw-canvasing-20260524|Nine-Wiki Sparse Jigsaw Canvasing - 2026-05-24]]
- Review state: candidate routing only; source role still needs owner review before merge, proof promotion, publication, or product claim.
- Local route: http://127.0.0.1:8732/v5ma.github.io/agent-wiki.html?page=agent-wiki-nine-jigsaw-memory-import-cluster-cluster

<!-- NINE-WIKI-FIT-JIGSAW-ROUTES:END -->
