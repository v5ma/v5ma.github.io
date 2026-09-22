# Friendly Current 0.12.2 / saved playability checkpoint

The requested easier playtest build is implemented and served. The exact runtime is c5c426dd9082336768c7a08bfc6f88fd3915a03f. The final closeout changes documentation/evidence only, not that tested runtime. Read the latest game README, FRIENDLY-CURRENT.md, QA.md and qa/friendly-current-public.json before continuing. The owner's gameplay feedback takes precedence over the earlier next-graphics-pass plan.

## Delivered gameplay

Easy is the first-play default unless a valid difficulty preference was already saved. The screen chapter menu and XR Battle page expose an individual choice of Easy, Normal, Hard and Ultra Hard. Each changes incoming quantity and pace, enemy residence, healing supplies, damage and boss endurance. Difficulty and input mode stay attached to the actual encounter and its separate record. Paused preferences cannot relabel it.

Ducks, boats, planes and fighters move more slowly and make repeated fruit/purple-block throws. Purple blocks can be cut, shot or shielded; no invulnerable red missile is scheduled. Easy and Normal omit spiked explosive bombs. Those distinct bombs remain on Hard and Ultra Hard for shooting or shielding, not cutting. Either blade earns ordinary cut points in all four profiles. Easy and Normal accept any cut direction; Hard and Ultra follow the fruit arrow.

Mint plus-symbol health cases heal once by slice, laser or body contact, capped at HEALTH 100 and without a miss penalty. Easy has five cases of up to 30 health, Normal three of up to 25, Hard two of up to 20 and Ultra Hard one of up to 15. A failed battle cannot be resurrected by a later event in that update. The new stage-anchored numeric gauge and controller/floor display show actual health, a thick bar and explicit damage/healing cues. They are not head-locked overlays.

Both bosses first appear at beat 152, approximately 69 seconds into the existing 89-second soundtrack. Admiral Quack is a crowned paddlewheel flagship with twin fruit mortars; the mothership also enters late. There is a four-beat entrance before the core opens. The player must defeat the boss and finish the track for a clear.

The three scenic modules, shoreline, soundtrack, core control mappings and existing XR/session recovery remain. Old River records under prism-current.river.records.v1 are untouched. New records use prism-current.river.pacing.records.v1 by chapter/input/difficulty/Arcade-or-Cruise. Classic, lessons and Floodgate saves remain. No private hub, portal, full multi-game brief or sibling-game files were published by this work.

## Durable checkpoints and focused repairs

Difficulty was saved at 2d69f5ae, integrated as 2af825f4, followed by status caching/pre-audio texture upload at adef4fc. That repair leaves the health canvas dimensions intact while avoiding unchanged repeated paints and mip generation. Independent tracked-mode verification was saved at 577f9d60.

The tracked AR test exposed a real direct Resume defect: a new B/Y edge immediately after Back could be discarded by the prior pointer action's 120ms debounce. Runtime c5c426dd fixes only that distinction. Pointer/native duplicate latches, held-button edges, one action per frame, calibration, visibility, controller and busy checks remain. The native test keeps the same immediate Back-to-B sequence instead of waiting longer to conceal the bug.

All 359 model/lifecycle/integration tests pass locally and in the checked-out CI source. Their controlled collaborators are not GPU or physical-device tests. PLAYABILITY-RECOVERY.md, PLAYABILITY-XR-VERIFICATION.md and PLAYABILITY-DIRECT-RESUME.md retain the exact earlier failed traces and repairs.

## Current evidence and unresolved reliability

Run 35750825858 matched all 124 expected public files to c5c426dd and version 0.12.2. The dedicated source AR/VR playability suite passed all 35 checks and completed both Easy chapters after real damage, laser healing, block cutting/shooting, immediate Resume and late boss defeat. It used actual input handlers, not assigned health/score/clock/actors. Source artifact 10706645321 was downloaded and its SHA-256 checked. The actual numeric health texture was inspected separately from the emulated view.

The dedicated public tracked replay passed seven AR checks including real damage and laser healing, then hit a rendering-stall pause at 19.89095238095238s before its remaining cut/boss checks. VR was not reached by that particular public suite. Artifact 10706945435 contains both the successful exact-file receipt and this failed trace. This is not a fully green public gameplay run, nor evidence that healing was merely drawn without changing health.

The complete source artifact 10706847299 was inspected: source tracked35, render-policy11, trees22, fire24, water13, interruption19 and Rotunda73 pass. The broader journey completed both Easy Arcade chapters. The independent desktop playability suite still failed after 13 checks on a rendering pause at 17.090045351473922s. Companion public results are recorded individually in the final JSON receipt, not inferred from source success.

Preserve these failures. The same .35-second pause safeguard, real input conditions and drawing resolutions remain; no automatic resumes or gameplay assignments manufacture acceptance. A source success and an exact public hash match do not erase an intermittent public frame gap. The cause needs physical/presentation-specific timing evidence rather than attributing every stall to health, trees or the emulator without proof.

## Next pass

Fetch current master and reconcile concurrent work before writing. Do not replay an older whole-game snapshot. First obtain the owner's Easy AR feedback on pace and the position/readability of HEALTH; keep current difficulty and healing data easy to tune. Investigate repeated frame pauses with bounded full-frame, render and input diagnostics. Preserve the revealing build and traces, and fix reproducible causes before adding rendering cost.

Normal, Hard and Ultra Hard have model coverage for quantity, rules and completion paths, but do not yet have the same complete native tracked journey as Easy in this receipt. Physical Quest/Xbox/touch, normal-resolution performance, comfort and enjoyment remain open. Color-changing blades, color-match bonuses, additional boss phases and gameplay blast-radius feedback are separate unfinished tasks. No further work is scheduled after this response; this file is the durable resumption point.
