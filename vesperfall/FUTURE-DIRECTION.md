# Vesperfall future direction and resumption contract

Updated 2026-09-22. This file is the durable design record beside the actual game. Update it and DEVELOPMENT-HANDOFF.md at each substantial pass. Record implemented behavior, exact tests, failed observations, remaining work and the next concrete action. Do not infer completion from this document or lose unfinished requests between chats.

## Approved direction

Grow Vesperfall from an archery demonstration into a physical dungeon adventure. Use the owner's Dungeons of Eternity reference for dependable handling, useful equipment, purposeful dungeon situations, exploration rewards and eventual cooperation. Keep Vesperfall's own cathedral, Last Lantern fiction, precision archery and Goldwind/Sureflight teleportation. Do not copy franchise assets, names, maps or fiction. Do not replace the working game with a separate prototype.

Interaction should honor plausible player intent under pressure. Grabbing, stowing, throwing, drinking, blocking, reading, operating mechanisms and teleporting need readable results and recovery. Earned upgrades must never be prerequisites for basic tracking or control reliability. More geometry or enemies alone is not better level design.

Develop one complete expedition loop: prepare in a refuge, observe ground/gallery/service alternatives, spend tools for a reason, discover a useful connection, recover supplies, accomplish an objective and return to a visibly changed place. The upper route trades exposure and traversal for observation and useful supplies; the sheltered route supports recovery. All mandatory progression must remain possible alone. Preserve meaningful ordinary paths beside expert teleport shortcuts.

## Recovered implementation, not work to recreate

Current source was recovered at master 8ee642005f647644e8e8025a9912f91d333cd9a1. Goldwind default, golden A/B arrows, rail-aware long-distance Sureflight, two-second floor feedback, six Last Lantern readings, two Pilgrimage chapter families, old mission access, Wayfinder mechanisms/exits and the local Threshold desk/foyer already exist.

Pilgrim's Kit was implemented at d2c563a7e01326f0fe1144a265ca9d6c933d744e with input ownership corrected at 92871871042ebc9078eae276a16477afa2c00d02. It adds finite healing/frost bottles, physical waist slots, stow/throw/drink actions, arrival/refuge/gallery caches, keyboard/Xbox equivalents and an additive saved fieldkit state. Read FIELD-KIT.md and tests/evidence/field-kit-0.17.0/runtime-publication.json. Its runtime was published; full new-feature input acceptance was not finished at that checkpoint.

The recovered hosted test 35780846097 passed initial keyboard, waist-slot, stow and full-health drink checks, but the physical throw failed. Its trace contains valid motion at 0, 0.1167 and 0.28 seconds. The short rolling sample window discarded one observation, leaving two valid points that the old three-point release rule rejected. This is a real low-sample robustness problem, not permission to fake a successful throw or assign inventory. Keep stationary-drop, discontinuous-pose, stale-input and no-accidental-disk protections.

## Current playable pass

Finish the physical-supplies loop already started. Repair evidence-backed input failures, exercise actual finite consumption and nearby resupply, preserve all old bow/teleport controls, and make the field-kit instructions and purpose understandable without leaving the experience. Use existing architecture and caches rather than introducing another untested world generator. Record hosted/public acceptance separately from model fixtures. The primary observation is whether a player can grab, stow, deliberately throw, recover at a cache and resume the saved expedition with exactly the right stock.

## Next content and systems passes

Next, build a more substantial Last Lantern objective that changes a familiar refuge or route: teach the physical rule safely, vary it in an exposed gallery, combine it with a mechanism or enemy, then show a persistent consequence. Reusable lanterns/power objects should have multiple coherent uses rather than becoming another collectible counter. Define ownership, release, interruption, save state and solo recovery before adding them.

Larger and longer chapters remain requested. Introduce new versioned layout identities for changed geography; never silently alter an old checkpoint's world. Extend purposeful exploration, traps, puzzles, enemy roles, secrets and a satisfying objective or guardian sequence, with optional mastery and recovery. Validate real movement, stairs, shot lines, collision, enemies, resources, saves and each supported input path before final decoration.

A dependable close-range weapon and expressive shield can follow trusted object handling. Preserve a viable archery approach; do not bury frequent actions in menus or steal the golden-arrow controls. Useful loot should change tactical choices, not just inflate numbers. Cosmetics and a coherent equipment economy can follow a good core loop.

Co-op is a later explicit milestone, not currently implemented. Plan authority, ownership transfer, shared mechanisms, revival, rewards, disconnect recovery and compatibility before networking. Start with a reliable two-player expedition; four-player/cross-platform service work follows measured success. No remote account or private SaaS infrastructure is authorized for public disclosure.

## Outstanding owner requests that remain open

First-person AR should play the same expedition as VR, with sparse wire/brick architecture and virtual occlusion: passthrough remains visible while game objects behind solid walls remain hidden. Keep real openings, stairs and drop boundaries legible. This is not the paused Architect's Table or a replacement arena. No room scanning or physical-floor guarantees.

Easy, Normal, Hard and Ultra Hard should deliberately change encounter population, detection distance, elevated threats and feasible patrol routes, with walls still blocking perception. Preserve legacy encounter identities and saved runs. Never advertise upstairs navigation that the AI cannot perform.

Upgrade monster appearance using license-verified, appropriately animated assets with original hitboxes/readable attacks and fallbacks. Validate the public Prism environment modules against Vesperfall's existing renderer before adapting water, fire and trees; do not load another engine or modify Prism. Coherent landmarks and sightlines matter more than decoration count.

Keep scene-rendered menus, controller-local information, adjustable world-anchored desk and fading floor confirmations. Larger rotunda animation and directly grabbed/resizable panels remain future work. The public local foyer is not the private WebXR SaaS hub. Do not publish private hub code or add sphere portals.

## Preservation, release and evidence

Write directly to current master after reconciling concurrent work. No new PRs, staging branches, source-writing workflows or sibling-game changes. Keep the optional existing Vinci visit/return hook. Preserve saved preferences, all five immutable layout readers, existing rewards, save/profile keys, authored content and licenses. Never clear localStorage or force-reset the remote branch.

Current work maps to existing V30, V41, V53, V57, V65 and V68. The 76-task canonical roadmap and six-sheet workbook keep their existing statuses until their actual broad gates are met. New notes do not manufacture an improved completion score.

Separate source/model tests, input-driven rendered tests, public served-byte checks and physical Quest/Xbox approval. Retain failed traces and explain any fixture correction. Never assign actor positions, health, inventory, time or mission state to manufacture an end-to-end pass. A screenshot is not a completed journey; publication is not proof of enjoyment. A published regression must be fixed, not hidden by a test rewrite.

For additive save features, rollback must retain their reader. Disable a new interaction/render path rather than rejecting newly created saves. Stop only at a truthful, recorded state with the next unfinished action clear. Store final per-pass receipts under tests/evidence/ and link their exact tested source in DEVELOPMENT-HANDOFF.md.
