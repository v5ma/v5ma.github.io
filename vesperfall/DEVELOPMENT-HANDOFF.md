## September 13 source audit and synchronized workbook

Read [CONTINUATION-AUDIT.md](./CONTINUATION-AUDIT.md) before the next upgrade. It records the actual minimal Tidelight scope versus the interrupted larger draft, the missing Quest water controls, water lifecycle/budget findings, exact controller contracts, historical failed acceptance, and the ordered next actions mapped to V01-V76. The canonical roadmap and six-sheet workbook are now aligned to 0.12.0; the stale core diagnostic VERSION label is synchronized without changing mechanics or save formats. [PLANNING-VERIFICATION.json](./PLANNING-VERIFICATION.json) records this repair separately from gameplay and physical-device acceptance.

The established handoff below is retained, including concurrent September 13 prose updates. Where broad feature descriptions conflict with the source audit, the inspected current implementation and explicit remaining gates take precedence.

# Vesperfall: Arrows Unchained / development handoff

Current public release: 0.12.0 Tidelight.
Maintained project: `vesperfall/` in `v5ma/v5ma.github.io`.
Public game: `https://v5ma.github.io/vesperfall/`.

This file is the cross-chat continuation record. Read it together with `AAA-ROADMAP.md`, `roadmap.json`, `AAA-PRODUCTION.xlsx`, `FIRST-BELL.md`, `ROSEFIRE.md` and `TIDELIGHT.md` before starting the next upgrade. Do not create a replacement game when the task is to continue Vesperfall.

## Product direction

Vesperfall is an original browser/WebXR precision-archery roguelite built around physical bow use, spatial awareness, Blink-arrow traversal, shard-step repositioning, Wardglass defense, bow/crossbow weapon choice, special arrows and run-based progression.

The long-term target is premium/AAA-level finish, treated as a quality aspiration rather than a claim about current budget, staffing or certification. The near-term objective remains one unusually polished, reliable vertical slice with strong combat readability, memorable routes, coherent art, excellent sound and complete controller usability.

The visual direction is gothic cathedral/castle architecture with dramatic vertical routes, cloisters, bridges, arches, reliquaries, rose windows, atmospheric sky treatment, stained light, wet stone and selected flooded spaces. The reference images used during this development emphasized layered medieval spaces, ranged combat across height changes, knights/humanoids, statues, arches, towers, large interiors and multiple traversal routes. References are design inspiration, not assets to copy.

## Non-negotiable preservation rules

Upgrade the existing game in place. Preserve player saves/profiles, Chronicle progression, deterministic world behavior and existing playable modes unless a release explicitly includes a tested migration.

Do not replace the game with a new prototype. Do not discard functioning combat, First Bell, Bellkeeper Oath, Rosefire, Tidelight, Pilgrim's Rest or existing route systems merely to add a new feature.

New presentation systems must not silently take authority over gameplay collision, teleport validation, damage, progression or saves.

Publication is part of completion. When an upgrade is finished, commit and merge it and verify the public GitHub Pages game. If GitHub access is intermittent, retry. Do not stop with a local candidate or unpublished branch and describe the work as finished.

## Controller requirement

Xbox support is a first-class gameplay and UI path, not a secondary convenience. The goal is to play and operate the entire interface without grabbing a mouse. Any new panel, alert, modal, settings page, inventory screen, confirmation or release-note overlay must be focusable, navigable, actionable and dismissible from the controller.

Preserve the existing gameplay contract: sticks for movement/look, trigger-based firing, interact, arrow selection/Blink access, cancel, pause, Wardglass, reload, shard-step and weapon switch. Exact mappings live in current source/README and must be checked before changing them.

A future full remapping/calibration pass is still required. Physical wired/Bluetooth Xbox reconnect, suspend/resume and long-session verification remain hardware gates; browser-generated button events are not a substitute.

## Quest 3, VR and AR requirement

Quest is also a first-class path. Preserve physical draw behavior, two tracked controllers, bow-hand/draw-hand role selection, spatial pause/settings UI, reload/weapon/shield/shard actions and an in-headset Exit VR path.

VR and AR are distinct modes. AR should preserve passthrough and must not place fictional world surfaces such as Tidelight water over the real floor. New graphics should have explicit Quest budgets and AR exclusions rather than assuming desktop effects are safe in immersive modes.

Physical Quest 3 bow alignment, comfort, sustained frame time, thermal behavior, battery behavior, seated/standing reach and real-controller lifecycle testing remain open hardware acceptance work.

## Shipped upgrade sequence to preserve

Pilgrim's Rest added local saved expeditions and continuation/recovery behavior.

First Bell added ten playable onboarding lessons, the scored Bellkeeper Oath, three staged courts and a three-phase Bellkeeper duel while keeping Endless and other modes separate.

Rosefire 0.11.0 added wet-stone PBR response, stained-glass floor illumination, twilight sky treatment, woven Wardglass effects and pooled successful-teleport echoes. It also established the shader policy pattern: Off/Balanced/Cinematic, reduced-effects behavior, Quest caps and AR exclusions.

Tidelight 0.12.0 added selected flooded cloister/chapel spaces with translucent water, submerged stone visibility, caustic/specular motion and bounded movement/projectile/teleport ripple effects. It is intentionally a presentation layer: existing collision floors, save state, generation and scoring remain authoritative.

## Visual lessons from Rosefire and Tidelight

Shaders should enhance the authored environment rather than cover it. Wet stone should still read as stone. Stained light should illuminate rather than turn floors into self-lit color fields. Water should show submerged architecture rather than become an opaque blue plane.

Effects should be selective. Flooded destinations work best as landmarks or tactical/exploration spaces, not as a universal skin on every room.

Quest/WebXR needs bounded source counts, ripple pools and detail levels. Desktop Cinematic quality is not evidence of physical-headset performance.

Visual regression testing should check what was added, not merely that pixels changed. Human art review remains necessary even when automated image gates pass.

## Audio and music: next major quality pass

The user explicitly wants the next rounds to maximize in-game sound effects and music. Treat audio as a production system, not an afterthought.

Priorities include stronger bow draw/release/transient detail, arrow material impacts, shield hits and breaks, crossbow mechanism/reload layers, enemy telegraph identity, spatial footsteps, water splashes and shallow footsteps, environmental drips, bells, wind and distant architectural ambience.

Music should support exploration, mounting pressure, recovery and boss phases without becoming tiring or constantly loud. Flooded spaces can have their own restrained sonic palette. Transitions should be musical rather than abrupt. Long-session headphone review, repeated-notification fatigue and simultaneous-threat intelligibility need human listening evidence.

## World/content priorities still open

Continue expanding route variety and reasons to explore rather than only increasing room count. Strong candidates include more authored loops, upper/lower alternatives, secret reliquaries, water-adjacent shortcuts, ranged sightline choices, recoverable escape paths and visually distinct destinations.

Enemy variety should continue toward the original request for roughly a dozen clearly differentiated new enemy types, but quality and readable counterplay matter more than raw count. Humanoid/knight-like enemies fit the visual direction. Each archetype should have a distinct silhouette, audio telegraph, attack commitment, weakness/counter and fair interaction with ranged/melee overlap.

The encounter director, broad fixed-seed/human balance evaluation, run-build identities, production character rigs/animation, three differentiated biome packages, environmental narrative, accessibility work and physical-device QA remain high-value roadmap items.

## Water continuation opportunities

Keep Tidelight's current water as non-authoritative presentation unless a later design explicitly promotes water to gameplay.

Good next steps include additional distinctive flooded destinations, chapel fonts/cisterns, partially submerged reliquaries, water-specific exploration rewards, arrow-impact audio, reflected architecture and route choices around flooded courts.

Do not introduce swimming casually. If swimming/deeper traversal is added later, it requires its own locomotion/comfort rules, controller mapping, save behavior, collision model, oxygen/surface decisions if applicable, accessibility review and AR policy.

## Resume checklist

Before changing code, confirm the current `release.json`, public version and latest master commit.

Read the current controller documentation/source before assigning any new Xbox or Quest button.

Check the canonical roadmap and do not mark human/hardware gates complete based only on software tests.

Preserve save compatibility and deterministic world contracts unless the planned release includes migration coverage.

For visual work, create explicit desktop, Quest/WebXR, reduced-effects and AR policies.

For UI work, verify every new screen can be operated and closed from Xbox and Quest without a mouse.

For audio work, preserve independent volume/settings behavior and add human listening review to the acceptance plan.

Run relevant model, browser, controller, XR and publication checks.

Commit actual source, merge it, verify GitHub Pages deployment and launch the public game path before calling the upgrade published.

Update this handoff and `AAA-ROADMAP.md` whenever a release materially changes future priorities or established contracts.

## Current source-of-truth hierarchy

`roadmap.json` remains the canonical 76-task structured production backlog. `AAA-PRODUCTION.xlsx` is its six-sheet generated snapshot and should only be regenerated when canonical task data changes.

`AAA-ROADMAP.md` explains the quality-gated milestone strategy.

`DEVELOPMENT-HANDOFF.md` records cross-chat continuation context, user requirements and release-to-release lessons that should survive even when they are not new canonical task rows.

Release-specific files (`FIRST-BELL.md`, `ROSEFIRE.md`, `TIDELIGHT.md` and earlier notes) preserve implementation scope and limitations.
