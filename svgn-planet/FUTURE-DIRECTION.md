# Neighborhood Missions: continuing direction

Owner decision, September 22, 2026: make the Watch Dogs 2 / Uncharted / Batman Arkham direction playable, including genuinely taller buildings. Keep these notes beside the game and update them at implementation, verification and handoff checkpoints so another chat can resume. This document records design intent, not proof that every feature exists.

## Currentworks and upper archive / 0.18.0

Current request adds the owner's Prism environment library to the playable Highline direction. ENVIRONMENT-INTEGRATION.md records the pinned modules, r177/r184 compatibility boundary, settings, first-entry preparation and actual limits. The main district now uses Water/Optics, Trees and Cloudlets plus selective Toon materials. No new renderer, sibling-game runtime dependency or opaque AR world is introduced. Fire and Islands remain unintegrated in Neighborhood Missions.

The next planned room is now an actual 10.8 m Print Exchange reading-room annex with shared collision/render geometry. After Highline, Archive: The Unsent Call continues Sal's recording through Ada, a crossfeed control, a recovered service log and return to Sal for 120 credits once. South Cable Exchange is the newly revealed future lead, not an implemented destination. Original Highline, five previous cases, city and reward ledgers remain. Highline launch is moved onto the first welcome screen without scrolling.

The complete local suite passes 462 tests, including a fresh-input Highline-plus-archive journey. Read tests/environment-evidence/status.json and public-receipt.json for separate hosted, rendered and publication outcomes. Local WebGL2 is unavailable; physical Quest/Xbox/hand, comfort, sustained performance and unfamiliar-player approval stay open. Continue from current master, preserve failed traces and never reconstruct completed features from an older handoff.

Next priority is owner review of the integrated graphics and upper-room route, then a stronger systemic archive encounter and a properly built South Cable Exchange story chapter. Keep these notes, ENVIRONMENT-INTEGRATION.md and DEVELOPMENT-HANDOFF.md updated after meaningful passes.

## Previous Highline implementation checkpoint

Highline is implemented in this source revision and passes 452 local tests. Read HIGHLINE.md for the actual six-step mission, controls, 17.2 m Print Exchange, 23.6 m Radio Tower, two crossings, ten switchback stair flights and five added grapple anchors. It is available immediately through Play Highline on the main welcome or pause screen, without erasing saves or completing old cases for the player. Source implementation, served publication, rendered acceptance and physical approval are distinct; the latest observed results belong in tests/highline-evidence/status.json and public-receipt.json. Do not call pending jobs passed.

The first notes checkpoint was dae0860960e62d56aaea579628aca19c31201590. The upload/recovery checkpoint was 4279592bd950f9882b50d6e167928515512157ad. The integrated code is committed on freshly reconciled master with no sibling changes. DEVELOPMENT-HANDOFF.md gives the current resume task. Keep updating these records rather than relying on this chat being available.

## Identity and priorities

Build an original neighborhood adventure. Watch Dogs 2 is a lens for manipulating a living city's infrastructure and choosing approaches. Arkham is a lens for useful verticality, observation, grappling, gliding, readable stealth and counters. Uncharted is a lens for character relationships, discovery, traversal pacing and authored payoffs. Do not copy franchise characters, dialogue, maps, assets or branding. Preserve peaceful resident work and optional action rather than turning all streets into combat.

Height must create gameplay, not taller empty boxes. Retain low shops and street-level routines; introduce mid-height roof connections and a few recognizable tall landmarks. Each major vertical route needs a supported entrance, traversable landings, a useful vantage or mechanism, a descent and a recoverable missed transfer. Street, roof, upper-roof and interior paths should reconnect. Keep the player in control; first-person XR must not inherit cinematic forced camera movement.

Longer-term goals are multi-level functional interiors, better patrol/search behavior, environmental distractions and power controls, persistent shortcuts and visible neighborhood consequences, stronger dialogue while moving, and larger authored adventure sequences. These are priorities, not implemented claims. Cars, drone gameplay, fully voiced chapters, advanced climbing and a city-wide high-rise rebuild remain unimplemented unless a later checkpoint provides source and evidence.

## Highline: what exists and what comes next

Highline adds actual shared collision/render floors above the old Lantern Ward without replacing its streets, interiors, old 4.4 m route, residents or cases. Sal lends the kit; Ada's upper archive leads to a rooftop survey; either crossing reaches the Radio Tower; restoring the repeater stands down the sentries; the recording returns through Sal to Mara for 240 credits exactly once. The new case is additive in the existing campaign ledger. It does not complete Rooftop Run, Signal Hijack or the delivery chapter for the player.

Next, inspect the actual source and public Highline browser artifacts. Fix any control, route or save failure without assigning test progress or reducing acceptance to a boot check. Obtain the owner's feedback on vertical scale, route understanding and XR readability. Then deepen one upper interior into a meaningful systems encounter, add a new story payoff for the recording's unidentified sender, and give the lower and upper paths stronger distinct consequences. Those future chapters and interiors are not implemented by this checkpoint.

The current geometry is a playable graybox, not final production art. Two taller landmarks are not a whole-city rebuilding project. The old five-case campaign and previous Neighborhood Focus remain, with their own unresolved polish and physical acceptance requirements.

## Non-negotiable implementation contract

Read AGENTS.md and the current release/handoff before work. The main entry is index.html, main-app.mjs and main-hub.mjs; Lantern Ward is an integrated district. Never replace it with a separate demo or make a recovery entry the only way to try new content.

Preserve saves, stable old mission IDs, independent reward ledgers, the 102 frozen legacy hashes, Xbox controls, eight native AR/VR modes, controller and hand UI, hidden normal-play menus, floor feedback and independently adjustable diorama dimensions. The 32 m safety ceiling and supported high save positions are now necessary; do not restore the old 8 m parser. No localStorage clearing or invented test progress. No private hub, cross-site travel, A-Frame migration, sibling-game edits, new PR, staging branch or publication pipeline. Commit directly to freshly reconciled master without force.

## Checkpoint and evidence protocol

Before each code checkpoint, run source/model tests and record exact source hashes. After publication, independently inspect public bytes. Keep model fixtures, actual-input model journeys, DOM checks, rendered synthetic-device browser tests and physical Quest/Xbox/hand testing distinct. Preserve failed traces and explain actual remaining failures. A queued job is not a pass. Update the evidence status and DEVELOPMENT-HANDOFF.md with implementation SHA, test results, public evidence and the next concrete task before ending the session. Tests are not a self-awarded AAA quality score.
