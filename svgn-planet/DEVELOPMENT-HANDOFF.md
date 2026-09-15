# Neighborhood Missions development handoff

Grounded Neighborhood v0.11.0 is accepted by automated tests on commit 86d0346c93b95b8ea9dae65b2815a717dd9375b0. Acceptance run: https://github.com/v5ma/v5ma.github.io/actions/runs/35000416468. This checkpoint still requires a normal merge, Pages publication and live verification; read production/evidence/v0.11.0-published.json when present. Do not report a candidate as published.

Read GROUNDED-NEIGHBORHOOD.md, release.json, production/roadmap.json and production/evidence/v0.11.0.json. SAVE-02 now has narrow automated evidence. ART-01/02 remain partial. XR-01 needs physical playtesting: this release is a flat comfort theater with tracked controller and hand UI, not stereo game-world rendering.

Never change the v1 key or historical IDs, remove old missions, force-push over sibling games, or close physical hardware/art gates from synthetic results. The next engineering priority is PERF-03: bounded world streaming and stable frame pacing. PERF-02 and QA-02 require a named desktop and real Xbox sessions; Quest 3 requires actual Touch Plus and hand-tracking sessions. Production hero art, animation, interior gameplay and the 30-minute soak remain open.

Run node --test svgn-planet/tests/*.test.mjs plus all five browser suites in .github/workflows/neighborhood-grounded.yml. The waterfront driver waits for actual simulation steps and does not teleport the player except for its documented canal-start save fixture. Rebuild AAA_ROADMAP.md using production/render-roadmap.py after editing the JSON. Archive exact source, test results and live hashes. Roll back only this game with a new scoped revert commit; never reset the shared master branch.
