# A City With a Voice 0.16.0

The owner approved the public story of an engineer-courier reconnecting Iona's floating city after Registry route closures, then requested its integration into the game. This implements that story in the current expedition rather than importing private fiction, a new protagonist biography, an individual villain, a new world or the archived living-city experiment.

## Experience and scope

Hypothesis: when the opening names the role and conflict, each assignment explains its human purpose, and earned repairs leave readable narrative records, players can connect the existing objectives into a story rather than treat them as unrelated tasks. The primary human observation remains whether an unfamiliar player can explain why the courier is doing the work and what Bellwether's restoration changed. Automated completion does not establish that result.

The opening establishes the engineer-courier, Registry closures and Iona's need for a carried dispatch. It retains the immediate noticeboard action, optional shopping and floor-map guidance. No forced cinematic, new audio transport, extra gameplay button, automatic story pause or head-locked panel is added.

Story so far is reachable from title, pause, Adventures, What do I do? and the Silent Network completion screen. It opens on the current assignment and its purpose. Choose a chapter provides direct access to unlocked entries and recovered archive notes. Latest earned chapter jumps to the latest noticed milestone in the current session, or the furthest entry in narrative order after loading. The order is a reading order, not a fabricated chronology of player choices. Text pages are bounded to 235 characters before a short page label, comfortably within the existing spatial description budget. Existing fixed A/B, directional controls, tracked pointing and both-hand pinch interaction operate the same modal controls. Close returns to the parent dialog. Hands remain UI-only, not locomotion or combat.

Each of the 14 existing adventures gains a purpose paragraph in the desktop journal, with the same purpose available in the spatial story reader. For example, the ferry repair restores a crossing, the charter preserves public-route memory, and Lio's escort turns an open route into a completed rescue. Original task instructions, IDs, rewards and goal resolution remain.

Bellwether records the real dispatch, cleared street, working Arcade circuit, receiver attempt, synchronized signal and completed report as distinct stages. The three relays, Gannet repair, charter discovery, weather engine, Lio rescue, Solstice defense and Skyward Dispatch ending get corresponding earned chapters. Actual milestones can present one concise narrative notice through the existing two-second feed. Nothing is automatically read aloud. Longer text remains available in Story so far; ordinary messages remain in the existing session history.

## Truth and compatibility

story-core.mjs is read-only. It derives chapters from current version-1 expedition flags, Bellwether stage, relays and recovered records. The UI stores no new save key and cannot award money, advance an objective, move an actor, repair infrastructure or change a weapon. Starting or continuing primes the session observer so prior achievements are not announced as new. Reading at the title consults the existing saved expedition without starting it. A new expedition cannot inherit another expedition's story.

A recovered regulator is not a repaired ferry. Finding Lio is not rescuing Lio. Synchronizing Bellwether's receiver is not reporting for its reward. Three restored relays are not proof of pressing the final broadcast console. The original game does not persist its `won` flag, so the explicit broadcast-ending chapter is available while that actual completion state is active; loading three relays does not invent a prior broadcast receipt. Skyward Dispatch's saved completion flag does restore its ending. No false claim of Registry defeat or a finished campaign is introduced.

The story speaks about already-existing visual consequences, such as Bellwether's lamps and service shutter. It does not add city-wide NPC schedules, new lighting simulation, voice acting or bespoke cutscenes. All original combat, physical routes, saves, control remaps, licensed assets, room-space UI and the 0.15.2 weapon-aim fixes remain.

## Verification and remaining work

Twenty new isolated tests cover opening identity, all 14 purposes, progression gates, partial repairs, alternate mission order, archive text, lossless bounded pagination, frozen-state reads, save roundtrips, no rewards for reading, reload priming and one-notice batches. The full local suite passes 344 Node tests. These fixtures are not native gameplay acceptance.

The controller journey now reads the story using gamepad input, accepts Iona's dispatch at the actual noticeboard, delivers it by traveling the actual west streets, and reads the earned outcome without repeating its reward. The field-guide journey additionally operates Story, its index and pagination using tracked-hand input after the real noticeboard interaction, captures the actual stereo canvas, returns to the paused journal, and verifies earned-story recovery after reload. All previous criteria remain. No actor, time, health, inventory, mission or credit is assigned by these browser additions.

A local Chromium attempt was blocked at ordinary HTTP navigation by ERR_BLOCKED_BY_ADMINISTRATOR. Its trace is retained; no local browser pass is claimed. Use the existing seven native suites, existing public HTTPS journeys, live-file hash verification and versioned backup roundtrip. Record exact-source outcomes in release-receipts/aether-v0.16.0-20260922.json. Hardware flags remain false until an actual physical test is documented.

This work belongs to P01 and X12, not a new campaign-expansion task. The next unresolved question is human narrative comprehension and readability during real play. Revert with an Aether-only forward commit if necessary, never a master reset or storage clearing. Preserve every concurrent sibling update and every prior release tag.

## Native title-obstruction regression and repair

The first native field-guide run on 4d98b795f55b6306258207978cea7096c014e885 passed 50 checks, including real noticeboard interaction, hand-operated Story/index/pagination, no save changes, returning to the paused journal and reading earned story after reload. It then failed to click the title's XR presentation button: the absolutely positioned footer covered that button when the saved Continue action and new Story action were present. This was a real title-layout defect, not a missing story unlock or a reason to force a test click. The full error and passed-check record are preserved in tests/evidence/story-title-obstruction-20260922.json; source artifact 10717411718 has SHA-256 732ac5ff028ab0ca4dc990f11eb458cd6cdab54e71869188177fb5ceb7ce05a9.

The desktop title now uses a scrollable grid with safe vertical centering and a top-aligned fallback. Its footer and controller help occupy normal content rows rather than overlapping action buttons. The narrow-screen title remains a scrollable single column. No input handler, simulated click, forced click, actor state or acceptance timeout was changed. The same original failing browser journey must pass normally against the repaired source. A new layout-contract fixture brings the local suite to 345 tests, including 21 story/integration fixtures. Earlier source successes do not certify these new CSS bytes; native, public and archive gates must recheck the final source.


## Stereo text-panel culling repair

Review of the actual story-dispatch-hand-canvas.png exposed a second bug that the initial DOM/input assertions did not detect: raised menu buttons appeared but the underlying story title/body panel was absent. A CPU rendering fixture using the pinned Three implementation reproduces it. At the default inverse diorama scale of 1 / 0.03, both real eye frusta include the panel, but the combined stereo culling frustum rejects its thin PlaneGeometry. The wider unit-cube bounds of the separately scaled button geometry can still intersect that incorrect combined volume. At smaller world scale the buttons can disappear too. A readable DOM paragraph alone was therefore insufficient acceptance.

Only the explicit room-space panel and its bounded set of raised button meshes bypass that combined-frustum optimization. Visibility, open/closed state, neutral-input rearming, raycast targets, per-eye rendering, game-world culling, depth aperture, saves and camera/head independence are unchanged. The panel reports an actual onAfterRender draw count, and the existing hand-story journey now requires that count to advance while viewing the story, then retains the real stereo canvas for inspection. It does not force the panel's visibility in the test or alter actor/progression state. Three additional CPU rendering fixtures bring the complete local suite to 348 passing tests. Physical readability and comfort remain independent checks.
