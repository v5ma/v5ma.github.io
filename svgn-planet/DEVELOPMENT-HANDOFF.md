# Neighborhood Missions development handoff

Grounded Neighborhood v0.11.0 is merged and published. Final runtime commit: 83965798b63974232e82b7678e5bdd2fb8ea34a2. Exact-source acceptance: https://github.com/v5ma/v5ma.github.io/actions/runs/35003203550. Live byte/browser verification: https://github.com/v5ma/v5ma.github.io/actions/runs/35003202995. Read production/evidence/v0.11.0-published.json and its permanent raw reports. The earlier v0.11.0.json is the historical pre-hardening candidate receipt, not the latest status.

The final runtime passed 162 model tests, 81 browser checks across five suites, exact deployed source/asset/license hashes and 15 live desktop/synthetic Xbox/XR checks. A partial analog-trigger leak after closing menus was fixed without remapping primary actions. The full waterfront controller tour now waits for actual simulation progress, not repeated reads of one slow WebGL frame; no gameplay speed or reward changes were needed.

SAVE-02 is verified for its narrow automated acceptance. ART-01/02 and physical ACCESS/QA gates remain open. XR-01 needs physical Quest 3 playtesting: this release is a world-anchored flat-screen comfort theater with tracked controllers and hand-joint pinch UI, not a stereo game world. Human art, physical Xbox USB/Bluetooth, Touch Plus, actual hand tracking, comfort and GPU/headset frame targets are not certified.

Next engineering item: PERF-03, bounded world streaming and stable frame pacing. Preserve existing v1 save keys and historical IDs, delivery/Homecoming/Tidewater systems, rewards, unlimited cruise and familiar direct controller actions. Continue production hero art, useful interiors and the 30-minute soak only with explicit measured acceptance; do not label a checklist AAA quality.

Run node --test svgn-planet/tests/*.test.mjs plus all five suites in .github/workflows/neighborhood-grounded.yml. Regenerate AAA_ROADMAP.md with production/render-roadmap.py after editing the canonical JSON. Merge normally, preserve concurrent sibling-game work, verify public bytes and run the live browser gate. For rollback use a new scoped revert commit; never reset or force-push the shared master branch.
