# Spatial Workspace v0.26.0

Build: `sky-cycle-spatial-workspace-2026.09.17`. This implements the requested AR/VR and shared headset UI in the existing Sky Cycle. It is not a replacement game or a promotion of the Waterwheel chapter. `verification/spatial-workspace-0.26.json` records exact accepted source, jobs, artifacts, failures, merge and separate public verification.

## Architecture and presentation

A-Frame was considered as the suggested wrapper. Sky Cycle already owns a pinned Three r177 node-material renderer, stereo path, simulation loop, editor and save model. This implementation extends that native WebXR boundary rather than creating another A-Frame scene lifecycle around it. No new framework dependency or third-party art asset is added.

AR requests immersive-ar and clears alpha outside a clipped rider-following exhibit. The browser owns passthrough composition; the application does not request camera images. VR requests immersive-vr and renders against an opaque environment. Optional hand tracking and local-floor requests do not make hand hardware or floor detection mandatory. The fallback is manually placed seated content, not automatic surface detection or persistent room anchors.

The original 3D game scene remains stereo 3D. The supported 2D game, modern Workshop and older editor can be viewed through their actual live canvases. Changing presentation does not introduce a second rider, alternate collision, new route ID, new campaign record or duplicate soundtrack. Manual size, distance, height, orientation and recenter affect only the exhibit. The menu layer counter-rotates when the exhibit turns so safety controls remain in front of the seated view.

## UI and controls

All menus exposes live native controls in pages. Route selection, portal travel, pause/results owners, Flight Deck, journal, graphics, audio and editor controls use their original DOM action paths. Hidden, disconnected or disabled controls cannot fire from a stale page. Checkbox values are announced, numerical controls are bounded, and text input uses a headset keyboard with Apply/Cancel. Explicit accessible labels take priority; route cards use their actual headings and other controls prefer rendered text over raw DOM text that can contain embedded styles.

Xbox support is retained inside XR, including remaps and menu navigation. Xbox A and a hand/controller ray share text-entry and confirmation handling. Focus reveals the visible page. A plus/minus pair spanning pages must not pull the user back to its first occurrence. The compact riding bar retains common actions directly; editor Select, Pan, Undo, Redo, Zoom, Fit and Playtest are direct shortcuts. Resume editing is distinct from Back to game.

The modern editor accepts ordinary pointer gestures from tracked rays. A pinch begins and moves its native drag; release, source loss and cancellation end it. Undo and playtest-return retain the same document. This is not a claim that every advanced Bezier operation has received physical-device usability approval.

Root navigation cancels uncommitted dialogs instead of approving them. Existing confirm/prompt guards are mediated through explicit in-headset decisions scoped to the same control and question; changed requests invalidate approval. Native file pickers, permissions, external navigation, clipboard/fullscreen/reload and hardware capture use an explicit leave-XR and fresh browser Continue flow. Cancellation keeps the current session and draft. No browser-owned action is reported complete merely because a menu texture was clicked.

## Entry and recovery

Open the existing game with `?xr=1`, then choose AR / VR and Enter AR or Enter VR. A compatible headset/browser is required. Capability checks disable unavailable entry modes without disabling ordinary play. WebGPU entry uses a guarded reload into WebGL; active or unsaved Workshop work blocks that reload. Switching AR/VR ends one session and offers a fresh deliberate entry while retaining the document in the same tab.

The native r177 callback must be installed before XRManager.setSession captures it. During exit, Three's synchronous session cleanup completes before application animation ownership is cleared. The original scene is detached before presentation-only resources are disposed. Tracking/visibility loss releases movement and editor capture. Denied entry leaves normal game/editor ownership recoverable.

## Actual software evidence and revealing failures

The first source rendered an empty stereo framebuffer because the startup order replaced Three's XR wrapper. Two reported eye views did not establish correct rendering. Strict framebuffer readback caught this and was retained. The corrected source renders real image content and AR alpha rather than substituting a screenshot.

A later pan test selected Back to game through an ambiguous Back label. The correction adds Resume editing and asserts the real Workshop tool, active mode and pan drag before testing movement. A subsequent helper waited for frames after it had intentionally ended XR; the test now recognizes termination while retaining explicit session, draft and restored-owner assertions. A prior delivery-test startup race now waits for Flight Deck before reading records. Regression and capture review also exposed split-page focus jumps and styling text in route-card captions; both are corrected in the UI layer.

Source `3d857644b9526340e631718ccdd18bdad820b2c4` passed the full native AR and VR journeys in run `35283088291`: 39 AR and 38 VR checks, covering stereo output, AR alpha, scale/rotation, menus, sound state, tracked/hand riding, short pinch pause, 2D, real text editing, cancelled replacement/import handoff, undo, pan and tracking loss, playtest-return, AR/VR switching, exit and denied re-entry. Its 268 game rules and 12 soundtrack tests passed. Label cleanup follows in `1725b9990ed9b60b69e056f89a773db7b9ac35a0`; its exact native result and public replay must be read from the receipt rather than inferred from the earlier source.

The release process independently hashes 32 public runtime files against the merged source, then repeats the immersive AR and VR journeys on the published origin. It also retains the twelve-delivery route and Portal Network regressions. A local/source CI pass is not a public deployment claim.

## Boundaries and next work

The tests use the real application, renderer, Web Audio ownership, DOM controls and editor pointer handlers with explicitly emulated tracking and sampled Xbox input. They do not relocate the rider or assign delivery, win or campaign state to manufacture success. Actual Quest 3 passthrough, room lighting, controller/hand comfort, physical Xbox, headset text readability and long-session performance remain open. A complete XR chapter finish, every imported draft, every browser-owned file flow and every external account/network state are not exhaustively tested.

This is a Milestones F/G presentation and interaction slice, not completed AAA production. Preserve the separate `sky-cycle/canal-choice-0.25` branch and reconcile it after release; no fork geometry or new reward owner is merged by this change. Continue movement-first chapter mastery and the useful high/low-route/recovery work before additional destinations or decoration.

## Research references

A-Frame official introduction, https://aframe.io/docs/1.8.0/introduction/ . Considered as an integration option, not installed as a dependency.

W3C WebXR Device API, https://www.w3.org/TR/webxr/ .

W3C WebXR Hand Input Module, https://www.w3.org/TR/webxr-hand-input-1/ .

Pinned local Three r177 vendor source, particularly XRManager callback capture, session cleanup and opaque-framebuffer behavior, is authoritative for this integration.
