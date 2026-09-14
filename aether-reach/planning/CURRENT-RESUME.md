# Aether Reach current resume checklist

Updated 2026-09-13. Release target: 0.11.0 Tideglass Reservoir. Detailed handoff: `HANDOFF-2026-09-13.md`.

Current work is backed up on GitHub in PR #139 / branch `feat/aether-tideglass-reservoir-20260912`. The Tideglass gameplay/source work is committed. Do not reconstruct it from chat history.

Validation already established before this note: 226/226 Node regressions pass. Native arsenal and rail jobs both passed Actions run 34759798958 after repairing stale browser-test assumptions. The sniper check now converges using ordinary keyboard look; the rail transfer check waits for a genuinely hookable live target; the new-expedition test honors the intentional saved-progress confirmation. Foundry also passed in the current Tideglass review.

Immediate resume action: inspect PR #139 and workflows for the latest head. Require the final Tideglass browser scenario and other required release checks to be green. If a planning commit retriggered workflows, use the newest run rather than an older green run.

When green: merge PR #139 to master, then verify GitHub Pages serves 0.11.0 and verify the published file set/hashes using the release-manifest contract. Do not stop at a prepared PR or local candidate.

Keep these gates open after publication until physically/player tested: Xbox USB/Bluetooth full-controller UI and gameplay QA; Quest 3 acceptance; real-device frame-time/memory; extended audio listening; subjective water/shader/art review; combat/reward/rail-transfer fun and balance review.

Development direction after publication: preserve saves and existing content while deepening interconnected interiors/rooftops, traversal, humanoid encounters, missions, art/audio production and controller completeness. The project goal remains routine gameplay and UI operation without needing the mouse. Multiplayer and advanced tracked XR optics remain separate future gates, not current-release claims.

Canonical roadmap remains `../roadmap.json`, with `../roadmap.html` as the searchable board and `AAA-ROADMAP.md` as its generated human-readable checklist. The old XLSX workbook is archival only.