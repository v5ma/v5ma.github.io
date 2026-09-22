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
