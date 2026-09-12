# Sunrise Borough: Market Pocket Park, v0.18.0

Build: `sky-cycle-sunrise-2026.09.12`. Date: September 12, 2026.

This is a scoped content and controller-readability upgrade of the existing Sky Cycle. It continues Milestone B of `AAA-ROADMAP.md`; it does not replace the game or assert that its entire campaign is AAA-qualified.

## Player experience

Market Lanes now has a low optional Pocket Park balcony. Ride past the first street obstacle, jump from the painted approach, follow the shallow rise and descending exit, and return to the market road. The original 16 rails, including the Cloudpost relay, are unchanged. The lower road, original tile grid, mailboxes, enemies, checkpoints, starting position and striped finish remain intact. This adds a branch to Sunrise Borough, not another full chapter.

Penny's Market Pilot challenge has three stages: ride the balcony, land on its road return without a crash, and complete the existing route. The seal is recorded only after the original engine accepts an unmodified authored-route finish. Grazing the rail, an editor playtest, a rejected win, or a road-only completion does not grant the seal. Repeated win callbacks cannot duplicate it. Finishing entirely on the road remains valid.

World-space boards and painted markings distinguish the optional takeoff, receiving decks, the Canal Fork braking choice, and the road return. A flower-planter landmark identifies the Pocket Park. Matching signs are drawn in the supported 2D renderer. These decorations are not collision objects and never change rider position, velocity, grip or steering.

The existing Route Journal shows the three challenge stages as focusable entries. Guidance controls now precede the long discovery list. When a paused reading/audio dialog is open in 3D, the new adapter reuses the rendered scene instead of redrawing it every frame. Independent input, audio and dialog event loops continue; closing the dialog or changing the viewport/stage size invalidates the cached scene. The original rendering/physics source is not replaced. This cache applies to the named paused reading dialogs, not every editor, menu or results state.

## Preservation and rollback

The new seal uses only `svgn.skycycle.sunrise.v1`. Existing delivery medals, Flight Deck badges, exploration stamps, Workshop documents, audio settings and remaps are neither cleared nor migrated. Blocked storage is disclosed; session progress is not falsely labeled durable.

Existing edited copies of the first chapter remain editable and do not gain a branch automatically. Newly loaded authored Sunrise routes include the branch. The campaign loader waits for its registration before enabling route buttons, preventing a partly downloaded candidate from being mistaken for the new course.

Rollback must be a scoped revert of this upgrade's seven runtime files, not a repository reset. Retain the independent seal key for a compatible future release. Do not remove other games or undo concurrent work.

## Evidence requirements

The local rule and geometry suite passes 40 checks. Twenty of these carry real isolated grip/flight state from a sampled road jump through all candidate rails to a road landing, over four entry speeds and five takeoff offsets. These are model fixtures, not full native playthroughs. The other checks cover preservation of original course data, editor serialization, bounded stored records and finish-gated rewards. The 29 existing Flight Deck and Compass pure-rule checks also pass locally.

An earlier branch design accidentally joined the longer sky network instead of returning to the road. It was rejected and the practice branch's descending exit was retuned. The final model samples land before the next street obstacle and do not catch a second rail.

Native browser acceptance and publication evidence are recorded separately in `verification/sunrise-0.18.json`. The native suite uses ordinary keyboard, controller samples and UI controls, never a player-position assignment or a forced win. It checks a real 3D detour and controller journal before using the supported 2D view for the remaining full-route coverage. Exact source SHAs, failures, captures and video remain part of the evidence.

Physical Xbox hardware, actual mobile devices, human enjoyment/readability reviews, a complete legacy-route regression and reference-device frame-time budgets remain separate open gates. A software-rendered browser is not a performance certification. Ordinary controller menu navigation was tested, but the three complete routes are not claimed to be controller-only playthroughs: their movement uses ordinary keyboard input.

## First accepted candidate and final hardening

Candidate `a05b120e0a2ba2111a30032a7c7ddb3c4e3fd3a3` passed the native acceptance and all four existing browser regression modes in Actions run `34712629564`. The acceptance artifact `10304150682` contains 21 passing checks, no uncaught errors, three complete first-attempt runs, screenshots and video. Its captures were inspected. The only optional rail visited by the detour run was `sunrise-market`; both road runs visited none. The detour accumulated 206.34 units of forward rail travel and banked exactly one seal, which persisted after reload.

Final runtime candidate `e12dbf9f873675ad2bbb9a5f64ff2bcbb1cf96d7` makes the cached scene sensitive to the actual stage size as well as viewport size, and avoids calling an earned but unsaved seal banked on the device. A fortieth rule test covers that storage distinction. Actions run `34713373362` tests that exact final runtime; its completed results and the separate public-byte verification belong in the verification receipt. The first candidate's successful run must not be silently relabeled as a later commit's test.
