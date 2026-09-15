# Quiet Water v0.22.0

Build: `sky-cycle-quiet-water-2026.09.15`. Continues the existing Sky Cycle from master `bebbcf1ab228f545befe6b5a192f7cc272c1372b`. Read `verification/quiet-water-0.22.json` for the exact accepted candidate, tests and public-byte verification. A prepared candidate is not a published release.

## Scope

The next sensory pass builds on the original one-context music/effects mixer. Tideglass gains a two-source, low-pass-filtered water/pump texture with a quiet early reflection, not another soundtrack. Water ambience has its own gain, feeds the existing effects gain and master limiter, and allocates no additional AudioContext. The four-second procedural texture has quiet endpoints and reuses one buffer per context. Pause, focus/background loss, master/effects mute, leaving Tideglass and page exit stop/disconnect the ambience. Resuming creates at most one rig. Sluice opening, waterline reveal and Tideglass arrival are observed once per transition; no simulation values are written.

Sound & music now includes Optional notices (Balanced, Quiet, Essential only), Effect intensity (Gentle, Soft, Full) and Water ambience. Soft/35 percent ambience are the defaults. Balanced admits optional notices at most once per 4.5 seconds; Quiet at most once per 12 seconds, with longer same-message suppression. Essential only suppresses optional water pop-ups and portal-focus pings. Unknown/legacy notifications, save warnings, controller warnings and continuous riding/objective guidance are never filtered. Optional messages cannot overwrite a recent essential message. Nothing is queued for later playback.

Transient effects have softened 12 ms attacks, bounded durations/pitches, eight simultaneous voices, and a 45 ms duplicate-burst guard. Intensity scales these effects without rewriting existing effects/music volume preferences. The original compositions, worker, music source ownership, route IDs, physics, courier IK, XR rendering and save namespaces are preserved. The only new preference key is `svgn.skycycle.sensory.v1`; blocked writes are labeled session-only.

## Input and preservation

Frequent gameplay buttons and saved remaps are unchanged. The new settings use real labeled selects and a range inside the original sound dialog, so existing Xbox focus/adjust/back and tracked-controller/native hand-select XR menus operate them. Xbox ambience adjustment advances five percentage points; XR pointing offers single-point adjustment. This adds no gameplay menu dependency. Physical Xbox, Quest 3, real hand-tracking ergonomics and listening/comfort are not certified by the tests. Advanced Bezier manipulation remains pointer-required.

## Verification maintenance

The Tideglass desktop HUD test now waits for positive-sized measured rectangles and the original five-pixel clearance, with a 15-second failure timeout. It no longer treats mere visibility as settled layout. The actual overlay placement is unchanged.

Legacy entry/loading/relay/Workshop browser assertions compare the full ordered list of 17 shipped rail IDs, including `cloudpost-relay` and `sunrise-market`, rather than an obsolete count of 16. Isolated pre-Sunrise model tests still legitimately test 16 surfaces and are not rewritten. No geometry is removed. The historical full optional canal-sequence failure stays open pending its own real-input replay; no expected sequence is weakened.

## Evidence boundaries

The local runtime fixture was recovered from the prior Actions artifact and all 16 v0.21 release-owned hashes matched its successful public report. The live connector comparison confirmed no Sky Cycle runtime changes between its accepted merge and current master. Local Chromium navigation is blocked by the managed browser policy; native acceptance runs in GitHub Actions rather than bypassing that restriction.

The 146 prior rule tests plus 22 new preference, notice, waveform, resource and mixer tests pass locally. Initial test failures were numerical-representation assertions (`0.35*0.12` versus exact `0.042`, and signed zero at a waveform endpoint); assertions now express the same amplitude and silence conditions with appropriate floating-point semantics. Native evidence must exercise the actual game, actual Web Audio, controller settings, real water events, persistence and tracked-hand XR. Context-count instrumentation wraps the real constructor; it does not replace audio with a mock. New-key storage failure is explicitly injected and labeled separately. Browser waveform measurement is not human listening or headset frame-time evidence.

All 21 release-owned public runtime files must match the accepted source after normal merge. Keep prior failures, raw traces and screenshots. Do not label the entire repository CI matrix green when legacy unrelated tests fail.

## Next work

Replay the full optional canal sequence with ordinary controls; investigate input timing versus geometry before changing physics. Qualify real Quest 3/Xbox input, human listening and long-session comfort. Further chapter design for Sky Cycle needs its own movement/landmark plan rather than copying the place-mastery framework used for other games. No new level is claimed in this audio release.

## Technical reference

W3C Web Audio API, https://www.w3.org/TR/webaudio/ . Source-node lifetime, gain routing and context state inform the shared-bus/explicit-cleanup implementation. All ambience samples and effect code are original; no external songs or music service is used.
