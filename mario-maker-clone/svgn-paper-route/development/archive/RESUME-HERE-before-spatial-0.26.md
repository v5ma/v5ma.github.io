# Resume Sky Cycle: Waterwheel delivery quality, v0.24

Continue the existing game in `mario-maker-clone/svgn-paper-route/`, not a replacement prototype. The authoritative release state is `verification/waterwheel-deliveries-0.24.json`. A version number, branch commit or passing unit test alone is not publication. Follow `GITHUB-RELEASE-PROCESS.md` through exact-source acceptance, reviewed captures, a normal merge, public SHA-256 matches and a real-input public replay.

## First resume action: finish publication, not reconstruction

PR 166 merged normally as `cd4da168b1c19f127ac3e80946e5ab4b8061c46d`, preserving the concurrent Rainward work. The accepted runtime is `94dbd1176474017a68aa7ae55fee8ae9d8a3d656`. Run `35054316372` passed all ten applicable jobs: 234 game rules, 12 original score rules and 197 native browser checks. All nine native report source IDs and ZIP digests were verified, and 52 PNG captures were reviewed. Later pre-merge changes affected only development documents and experiments, not this accepted runtime or tests.

The public release is NOT yet verified at this checkpoint. Pages run `35055730758` built successfully, but its deployment job `104666294483` was still queued. Publication run `35055731631`, public-byte job `104665406344`, was also queued; `live-deliveries` depends on its success. Inspect these existing runs before creating any new candidate. Allow the newest combined-master Pages deployment if this documentation or sibling work supersedes the initial publisher. Verify all 28 owned runtime files, then the actual public-origin twelve-delivery replay. Do not force an obsolete deployment, call a queue a failure or claim that an unexecuted check passed.

The full acceptance and retained-failure record is preserved byte-for-byte as `verification/waterwheel-deliveries-0.24-accepted.json`. The main receipt records the merge and subsequent publication state. Update the receipt and this first-resume section when those public gates genuinely pass.

## What is accepted

The delivery run served all twelve mailboxes and reached the depot on its first attempt through ordinary riding, deliberate coasting and sampled Xbox B throws. It did not assign positions, velocities, deliveries, scores, wins or progression. All eight campaign builders and protected persistent fixtures were preserved. Final preview score was 11460 and temporary credits 1072; returning to Workshop restored the original 777-credit fixture. Four Waterwheel traversal variants, Waterwheel XR, Portal Network, Tideglass and Sunrise also passed. Initial 3D inspections and full supported-2D CPU routes are different coverage from physical devices.

Packaging source `b49ab32cf9122cb7769a61951ce585b7f6744116` exposed an obsolete Tideglass assertion requiring version 0.23.0 although the correct route 7 loaded. The final test compares both version and build with the checked-out manifest and retains the route assertion. Capture review also exposed frozen 3D instruments after switching to 2D. The accepted runtime releases stale CloudHUD ownership on the shared render path; native tests now require the visible fallback HUD, an advancing clock and correct pause behavior. Do not replace these gates with a weaker version-label or mock-only assertion.

Release identity is v0.24.0 / `sky-cycle-waterwheel-deliveries-2026.09.15`. The merged feature branch was `sky-cycle/waterwheel-deliveries-0.24`. The initial master baseline was `d6c8f08176a54f547259c26f6788659274804dc6`; the merge base head was `78dad9840163bbacb7308118cde44a1bb4f525f6`. Never reset master to either old snapshot.

## First next content gate

Read `LEVEL-DESIGN-METHODOLOGY.md`, `chapters/WATERWHEEL-BOULEVARD-R2.md`, `WATERWHEEL-DELIVERIES-0.24.md`, and `chapters/WATERWHEEL-BRAKING-FORK-NEXT.md`. Finish this chapter before another destination or cosmetic feature series.

The next playable slice is a speed/brake-selected fork with useful lower and upper outcomes, then an optional high-to-high whip connection with a non-whip alternative. The isolated 90-case model in `experiments/waterwheel-braking-model.mjs` is exploratory, not native acceptance. It suggests that late braking can reach `ww-collector`, while holding speed reaches `ww-crescent`, `ww-gallery` and `ww-finish`. Earlier braking sometimes times out under the experiment's continuously re-evaluated threshold policy.

The follow-up `experiments/waterwheel-brake-release-model.mjs` uses a one-shot finite hold followed by ordinary release to right input. All fifty samples at seed speed 7.5 and offset 120 return to the modeled road; no sample times out. Some receiving routes differ between Forgiving and Precision, so do not collapse the two modes. `experiments/waterwheel-brake-release-summary.json` retains hashes, counts, the failed cross-mode equality comparison and limitations. These results support native release/recovery testing, not an automatic brake or a claim that a new fork is already shipped. Qualify early readable cues, both modes, ordinary-input high/lower routes and useful recovery without post-start state assignments.

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

Retain failures with their exact source/run/job/artifact identifiers. Do not relabel an older pass as a newer SHA. Review actual captures; do not infer human enjoyment, hardware performance or a full 3D/XR completion from a model or supported-2D run. A post-XR blank main-editor-canvas image does not by itself qualify restored viewport paint; document restoration is separately asserted. The cause of that capture was not established. Retain it for focused follow-up rather than silently calling it a timing issue.

Open beyond this slice: combined porch/express delivery roles, speed/brake fork native acceptance, optional whip alternative, comprehensive short/late/underside and reverse recovery, checkpoint-delivery retries, revision-aware campaign promotion/rollback, unfamiliar-player pacing, physical Xbox/Quest/mobile/native-WebGPU, long sessions and full advanced editor controller access. The old full optional canal sequence remains unresolved and must not be silently weakened. Historical homepage/Cloudpost stale-count failures are not evidence that all repository CI passed.

`AAA-ROADMAP.md` remains the long-range plan. `archive/RESUME-HERE-through-0.23.md` and `archive/README-through-0.23.md` retain the earlier complete handoff history verbatim, including v0.16-v0.23 release evidence and integration traps. Those historical current-version paragraphs do not supersede this handoff or the latest receipt.
