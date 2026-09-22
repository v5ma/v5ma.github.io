# Dino Atlas future direction

Last reviewed: 2026-09-22 16:54 PT. This is the durable campaign brief requested by the user. Update it and the current handoff after each meaningful development checkpoint so another conversation can continue without reconstructing intent from chat. Distinguish shipped source, verified public play, proposals and remaining work. Preserve historical failure evidence.

## User-approved identity and origin

Dino Atlas: The Living Reserve is an original dinosaur expedition, investigation and rescue adventure. You are a field ranger learning a living place; that knowledge lets you help people, understand animals and repair useful connections. Aim for wonder, suspense, memorable colleagues and meaningful mastery rather than a list of maintenance errands or a dinosaur-shooting gallery. Jurassic Park is an emotional reference, not a source of copied story, characters, dialogue or assets.

The user's fictional origin is an AI Singularity capable of designing and recombining DNA to produce any creature, including living animals that look and act like dinosaurs. Atlas evaluates its animals against known dinosaur fossil data above the 99th percentile. This is an explicitly in-world fossil-fit benchmark; do not change it to ancient blood/amber cloning, 99% original dinosaur DNA, or a real-world scientific capability claim. Keep fossil constraints, inferred/synthesized behavior and observed living behavior distinct. Do not turn the Singularity into an evil-AI villain by default. The accepted mystery concerns people trusting an outdated operational model and ignoring field evidence.

## Published opening: First Light

Runtime living-reserve-20260922.1, source commit 6f1e4bdcae98dd4b4e81e43dd8e039d93b7a303f, implements one optional opening chapter inside full Classic Reserve. It is not the whole campaign. The completed public job 106941580415 in run 35778122352 matched all 77 served runtime files and passed all 152 declared public checks, including screen and mocked-XR story completion. See verification/living-reserve/publication-20260922.json. Regular Start, free exploration, First-person VR, VR diorama and AR diorama remain. Use Play story: The Living Reserve in the introduction or Story: The Living Reserve / First Light in the pause menu.

The seven physical beats are meeting Mara, observing an actually visible living plant-eater, reaching Ivo by the existing ramp bypass, inspecting the relay record, restoring the controller, entering the reopened research passage to retrieve a field recording, and returning to Dr. Leena Rao. The recording points to Tidegate. Persistent conversations and their replayable journal supply the story; two-second notifications remain action feedback, not the only place to read essential dialogue. NPCs currently use the existing original ranger model as a graybox representation. Voice acting, facial performance, individualized production art and full schedules are not implemented.

The story owns only dino-atlas.living-reserve.v1. Starting/resuming must not teleport the ranger, reset earlier missions, clear storage or discard carried field-operation cargo. Suspending retains progress. Restoring the corridor remains effective after suspension, completion and reload, including saves inside the passage. Preserve the original campaign's power contribution and do not add duplicate currency rewards. Observation requires actual resident visibility, not an assigned success flag.

## Future campaign, not yet implemented

Chapter two: The Missing Survey. Use Tidegate's existing pump house, observation point, herd apron, boat landings, reversible lock and service-loop shortcut. Give distinct reasons to choose a walking observation approach or a faster harbor approach. Reaching a colleague or extracting the missing team must produce an observable consequence. Do not recreate the existing bridge/sluice mechanics or add another area solely for size. Recognize existing completed district progress rather than resetting it.

Before adding later progress, specify a separate chapter record or an explicit forward-safe migration. The current version-1 opening sanitizer bounds progress to seven steps. Blindly appending ordinal stages would risk reinterpreting completed saves. Preserve stable chapter IDs, dialogue history, restored gates and cargo-carrier identity; do not take over an already occupied rescue carrier.

Middle campaign: the storm divides familiar places and exposes discrepancies in the official atlas. A displaced herd, interrupted water supply and conflicting maintenance records build an investigation through actions. Mara is capable and teaches observation; Ivo gives expeditions mechanical and human continuity; Leena connects field evidence while acknowledging her earlier assumptions. The proposed operations chief favors sector closures to protect people, but field evidence reveals that one closure would trap animals against an evacuation route. Keep motives understandable rather than adding a generic evil-corporation speech.

Climax: carry out an evacuation through routes the player has learned and improved. Vehicle staging, shelter, animal corridors, restored utilities and knowledge of alternate approaches should decide success. A predator can create tension without becoming a compulsory health-bar boss. Restored routes, rescued colleagues and a changed home base should provide the payoff. Continued optional ranger work after the ending should represent recovery and stewardship, not a catastrophe replayed indefinitely.

These chapters and outcomes remain proposals under AL-01/AL-05. Do not report them as playable until implemented and verified. First Light is the current bounded playable chapter.

## Gameplay and pacing rules

Each mission needs a person or practical consequence worth caring about, an understandable immediate goal, a purposeful approach, a likely mistake and a recovery path. Show the world changing when work succeeds. Let animals feed, rest, move, warn and pass without requiring a tool response every time. Alternate awe, quiet observation, discovery, travel, careful work and urgency. A scanner observation should reveal useful information or improve a decision, not merely fill a counter.

Ground vehicles, boat and helicopter retain complementary roles. Do not claim stealth, cargo capacity, weather sensitivity or alternate-route advantages until those systems exist. Preserve mounted water/pulse/scanner/recovery origins, real occlusion, ammunition, safe-work checks and secured-carrier identity. Express remains optional 2x/4x/8x for unlimited duration with existing brake/pause/input-loss disarming. No new biological or genetic-engineering simulator is required by the fictional origin.

## UI, XR and compatibility

One selected objective should own the primary marker and explanation. Keep the live floor map, HERE interaction line, current step and profile-correct Help. Temporary messages fade after two wall-clock seconds; essential conversations wait for deliberate continuation and remain replayable. Preserve independent menu/floor/box sizing and the 2 m default tall character-centered portal. The box is a full-depth window into the same game, not a finite miniature map. Never close both top and front. Keep head-locked full menus out of normal play.

Preserve Xbox Familiar/Active and Quest Active/Legacy preferences. Quest Active uses grips for interaction and LT/RT for aim/tool use. Do not advertise physical Quest, hand tracking, passthrough, stereo or comfort acceptance from synthetic input. Keep the accessible screen fallback until its replacement is proven. No private WebXR hub code, private review assets, mandatory A-Frame conversion or new cross-game portals belongs in Dino without a later explicit request.

## Recovery and delivery procedure

Read AGENTS.md, HANDOFF.md, LIVING-RESERVE-HANDOFF.md, LIVING-RESERVE.md, INTEGRATION-AUDIT.md and the newest verification/living-reserve receipts. Inspect actual current master, exact edited blobs and the established workflow. Direct master writes only; no new PRs, staging branches, transport payloads or temporary source-integration workflows. Reconcile concurrent siblings without force. Do not re-merge historical branches or replace current saves, reward sanitizers or renderers with old packages.

Run the complete npm test/check commands and real-input story journeys, plus retained UI/control checks relevant to the change. Archive accurate source IDs, downloaded artifact hashes, failed tests and unverified scope. Verify served bytes and a public story journey separately from source success. A release archive is separate from website deployment; do not increase permissions or modify shared Pages just to create an archival success.

The completed First Light recovery verified the source and public archives independently, matched all 77 runtime hashes, and reran 297 model/physics/source tests with zero failures or skips. Public story checks passed screen16 and XR-mock18; the retained public UI/portal checks bring the total to152. The first public attempt failed on five not-yet-updated files before gameplay; its unchanged retry passed. The separate release job returned HTTP403 at archival creation. The website is live and verified; the intended GitHub Release entry is not claimed created. The publication receipt preserves all these distinctions.

## Next bounded work and playtest

First establish whether a player can find Mara, understand the AI-created-creature premise, read HERE without coaching, observe a resident, discover why the reopened passage matters, and want to investigate Tidegate. Fix observed onboarding and interaction failures before building a long second chapter. Retain the existing roadmap rather than substituting this brief for unfinished acceptance obligations.

The public relay capture still contains secondary Ranch and Coast dispatch copy and generic field-kit hints beside the selected First Light task. Audit that competing information in the next polish pass so unrelated guidance does not dilute the story objective. Do not hide required controls, remove optional activities or relabel this observation as an already fixed bug. The player-facing primary story goal and HERE have passed their current automated checks; unfamiliar-player comprehension remains open.

After that bounded review, implement the missing-team chapter using the existing Tidegate geography, useful route choices, actual wildlife conditions and a safe separate chapter-state contract. Keep ongoing notes beside the game after each meaningful checkpoint, including what changed, what passed, what failed and what remains only proposed.

## Continuity instruction from the user

The user explicitly requires the future direction and continuation state to be saved on GitHub next to Dino Atlas throughout development so another chat can resume immediately if the current chat ends. Treat FUTURE-DIRECTION.md as the durable design/campaign document and HANDOFF.md plus feature-specific handoffs as the exact implementation/verification baton. Update them after meaningful changes, not only at release time. Include the current master/runtime identity, what is actually playable, unresolved bugs or confusing UX, tests/public verification actually completed, physical-device limits, and the next bounded task. Never leave a material design decision or recovery-critical fact only in conversation history.
