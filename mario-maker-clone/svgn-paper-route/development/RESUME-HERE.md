# Resume Sky Cycle: Waterwheel delivery quality, v0.24

Continue the existing game in `mario-maker-clone/svgn-paper-route/`, not a replacement prototype. The authoritative release state is `verification/waterwheel-deliveries-0.24.json`. A version number, branch commit or passing unit test alone is not publication. Follow `GITHUB-RELEASE-PROCESS.md` through exact-source acceptance, reviewed captures, a normal merge, public SHA-256 matches and a real-input public replay.

## Current work and recovery

The recovered v0.24 gameplay/test source `8fd9108289626259321f5e0e267d998a3441c4e8` passed all ten scoped jobs in run `35041782849`. The delivery run served all twelve mailboxes and reached the depot on its first attempt through ordinary riding, deliberate coasting and sampled Xbox B throws. It did not assign positions, velocities, deliveries, scores, wins or progression. All eight campaign builders and preexisting persistent fixtures were preserved. Four Waterwheel traversal variants, Waterwheel XR, Portal Network, Tideglass and Sunrise also passed. Initial 3D inspections and full supported-2D CPU routes are different coverage from physical devices.

The release packaging source `b49ab32cf9122cb7769a61951ce585b7f6744116` exposed an obsolete Tideglass test assertion requiring version 0.23.0 although the correct route 7 loaded. Retain its failed report. Candidate `94dbd1176474017a68aa7ae55fee8ae9d8a3d656` changes the test to compare both version and build to the checked-out manifest, without removing the route assertion. It also fixes the stale 3D HUD left visible after switching to 2D; the native delivery test now requires the live fallback HUD, an advancing clock and correct pause behavior. Run `35054316372` qualifies that exact candidate. Read the receipt for its result and later publication proof rather than assuming these paragraphs establish acceptance.

Release identity is v0.24.0 / `sky-cycle-waterwheel-deliveries-2026.09.15`. The feature branch is `sky-cycle/waterwheel-deliveries-0.24`. The initial shared-master baseline was `d6c8f08176a54f547259c26f6788659274804dc6`; later Rainward changes are independent and must not be lost. Do not reset or force master to the feature snapshot.

## First next content gate

Read `LEVEL-DESIGN-METHODOLOGY.md`, `chapters/WATERWHEEL-BOULEVARD-R2.md`, `WATERWHEEL-DELIVERIES-0.24.md`, and `chapters/WATERWHEEL-BRAKING-FORK-NEXT.md`. Finish this chapter before another destination or cosmetic feature series.

The next playable slice is a speed/brake-selected fork with useful lower and upper outcomes, then an optional high-to-high whip connection with a non-whip alternative. The isolated 90-case model in `experiments/waterwheel-braking-model.mjs` is exploratory, not native acceptance. It suggests that late braking at the runway can reach `ww-collector`, while holding speed reaches `ww-crescent`, `ww-gallery` and `ww-finish`. Earlier braking can return to road or stall under the experiment's automatic input policy. Do not add automatic steering or conceal these outcomes. Qualify human-readable cues, ordinary-input traversal and recovery before calling the fork shipped.

## Gameplay and save invariants

Preserve momentum-driven cycling, ordinary ground completion, expressive optional upper routes, the existing throw physics and direct frequent actions. Waterwheel remains an explicitly non-awarding editable Workshop preview; it is not a ninth campaign route and is not yet the replacement for campaign index 5. Its twelve deliveries remain optional, with quota zero. Reserved `canal-choices-r2` records are inactive; keep earlier `canal-choices` records intact.

All eight campaign IDs and indices remain stable. Sunrise Borough is index 4 / `first-neighborhood`; Tideglass Baths is index 7 / `tideglass-baths`. Travel starts a new run and does not bank provisional progress. Optional medals, seals, stamps and career records settle only through the original accepted authored finish. Editor copies, rejected wins and duplicate callbacks cannot mint progression.

Preserve every independent storage namespace: legacy medals, credits, ghosts, ledger, pack records, Workshop library/recovery, remaps, audio/graphics preferences, career mastery, Route Journal exploration, Sunrise Market Pilot and Tideglass Keeper. Preview coins are temporary and restore on return. The previous Waterwheel blueprint backup has its own key, `svgn.skycycle.waterwheel-preview-backup.v1`. Never clear storage to make an upgrade or test pass; do not describe session-only fallback as durable persistence.

## Controls and presentation boundaries

Xbox defaults remain A jump, RT/X boost, RB/B paper, LB/Y whip, Start pause, View Flight Deck and D-pad Down nearby interaction. Honor saved gameplay remaps. Menus, results, settings, portals, journal and confirmations must retain controller access, nested back behavior and neutral-input barriers. Advanced Bezier manipulation remains a disclosed pointer-required exception.

Tracked XR uses left stick ride/reel, right A jump, right trigger paper, right grip whip, left trigger boost, left X interact, right B pause/back, left Y Flight Deck and menu rays. Native hand select/pinch events operate the existing menu and action bar. Input-source/visibility loss releases actions and pauses; XR exit restores scene ownership and leaves play paused. Do not add a competing render or music loop.

XR is the existing opt-in seated side-on diorama of the original game. It is not first-person cycling or qualified AR passthrough. The pinned r177 renderer requires the guarded WebGL entry `?xr=1`. Physical Quest 3 controllers/hands, comfort, permissions, frame times and native layers remain separate qualification gates. CI Gamepad samples are not a physical Xbox test.

Rider IK is presentation-only pedal/grip contact, not walking terrain foot-locking. Water remains scenic behind the cycling plane, not swimming. Import node helpers from the compatible vendored Three module rather than assuming the legacy facade contains the whole namespace. Preserve opaque XR framebuffer compatibility and stereo overlay contrast tests. Measure visible HUD bounds; do not leave hidden-view instruments frozen over the fallback renderer.

## Evidence and long-range work

Retain failures with their exact source/run/job/artifact identifiers. Do not relabel an older pass as a newer SHA. Review actual captures; do not infer human enjoyment, hardware performance or a full 3D/XR completion from a model or supported-2D run. The release workflow checks public runtime bytes and then repeats twelve real deliveries against the published origin.

Open beyond this slice: speed/brake fork native acceptance, optional whip alternative, comprehensive short/late/underside and reverse recovery, checkpoint-delivery retries, revision-aware campaign promotion/rollback, unfamiliar-player pacing, physical Xbox/Quest/mobile/native-WebGPU, long sessions and full advanced editor controller access. The old full optional canal sequence remains unresolved and must not be silently weakened. Historical homepage/Cloudpost stale-count failures are not evidence that all repository CI passed.

`AAA-ROADMAP.md` remains the long-range plan. `archive/RESUME-HERE-through-0.23.md` and `archive/README-through-0.23.md` retain the earlier complete handoff history verbatim, including v0.16-v0.23 release evidence and integration traps. Those historical current-version paragraphs do not supersede this handoff or the latest receipt.
