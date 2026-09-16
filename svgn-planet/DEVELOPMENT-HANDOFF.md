# Working Quay v0.12.1 candidate

Read lantern/WORKING-QUAY.md and release.json first. LEVEL-01 now includes a local loading crossing, continuous cart routine and useful north-loop recovery on existing geography. All 220 local model tests pass; CI browser and separate public checks remain required. Save keys, layout 1, rewards, controls and the 102-file legacy layout remain unchanged. Physical devices and human comprehension remain open. Do not treat historical v0.12.0 acceptance below as new-release acceptance.

# Lantern Ward / v0.12.0 published handoff

Lantern Ward is implemented, normally merged and published. Runtime: e7dbca0282ffbd8f1bc3506ecedc25e8e8923a85. Master acceptance: https://github.com/v5ma/v5ma.github.io/actions/runs/35017262121. Publication: https://github.com/v5ma/v5ma.github.io/actions/runs/35017262097 (attempt 2). Pages: https://github.com/v5ma/v5ma.github.io/actions/runs/35017260230. Read production/evidence/lantern-0.12.0/published.json and its raw master/live reports. Candidate records are historical.

The runtime passed 208 model tests, 132 checks across nine browser suites, all 186 public file hashes, and 27 live default-entry street/hoist and native synthetic XR checks. The first publication check raced Pages; retrying after deployment passed without changing game code.

Read lantern/README.md and design/PLACE-MASTERY-REBUILD.md. This first authored graybox chapter has real street, roof and canal routes, a far-side blue-door shortcut, reversible water, a moving goods hoist and one-time approach-independent rewards. It is not a whole-world replacement or finished production art.

First-person VR and diorama VR/AR render per-eye geometry. Top/front/both never closes both apertures. Display scale/cutaways do not alter collision or progress. Tracked-controller play hides the action panel; hands use a small side panel. Placement is manual, not room-scanned anchoring. Physical Quest 3, Touch Plus, hands, Xbox, comfort and hardware performance remain untested.

The original game remains at legacy.html with 102 files pinned by legacy-layout.json. Original keys, rewards, Homecoming, Tidewater and flat theater remain unchanged. New chapter progress has its own key and layout; never reinterpret old coordinates or rewards silently.

Next work: unfamiliar first-visit/replay comprehension, camera/character intersections, raised-floor contacts, named-device measurements, and deliberate art refinement. Do not add another unstructured map expansion. Richer conversations/audio, broader chapter replacement and extended soak remain open.

Run node --test svgn-planet/tests/*.test.mjs svgn-planet/design/chapter-contract.test.mjs svgn-planet/lantern/*.test.mjs and all nine browser suites in neighborhood-lantern.yml. Preserve direct actions, neutral rearm, backups and sibling games. Regenerate AAA_ROADMAP.md using production/render-roadmap.py. Merge normally and verify deployed bytes; never force-push shared master.
