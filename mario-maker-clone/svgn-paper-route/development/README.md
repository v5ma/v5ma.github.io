# Sky Cycle current recovery: XR buttons 0.26.2

The latest physical report concerns unresponsive A/B/X/Y, triggers and grips in AR menus. Prior 0.26.1 software acceptance does not close this new report. Read XR-BUTTONS-0.26.2.md and verification/xr-buttons-0.26.2.json for exact source, acceptance, publication and remaining device observations. Do not reconstruct the repair or treat a pending CI job as a pass.

PR 203 / sky-cycle/xr-buttons-0.26.2 is the active repair. The final runtime candidate is f279935ce328485d76f72442ad953aa1dfbacf3f. The direct session-owned menu handler maps A/X confirm, B/Y one-level back, both triggers select, grips previous/next and sticks navigation/adjustment. It ignores unmapped sensor values, deduplicates native/polled triggers, gives buttons priority over concurrent navigation, and independently gates held sticks after a system interruption. Fresh ray motion restores aiming after navigation even within the same row. Uncaptured trigger events remain available to ordinary gameplay.

The visible headset selection, not hidden browser focus, owns virtual footer activation. The button tests include native-style getters, twelve-slot pads, active passive sensors, no-ray grip/A confirmation, nested menus and original gameplay trigger/release checks. The original Workspace, Portal Network, delivery, hidden-document, hand and moved-head tests remain required. The menu reports its build and last detected input locally. No telemetry, new framework, save migration or physics change is introduced.

This is a Milestones F/G input repair. Keep the fixed-world AR aperture and absent controller riding panel, all eight campaign IDs, remaps, soundtrack owner, Workshop drafts and independent save namespaces. Keep the separate Canal Choice branch unchanged until after this repair. The complete long-range roadmap and earlier handoffs remain below; their older current-release labels are historical.

Release gates are exact-source tests and capture review, normal expected-head merge preserving sibling work, 34 public runtime hashes and both public AR/VR all-button journeys. Physical Quest passthrough, controller/hand behavior, headset readability, comfort and long sessions remain separate open observations. Never clear localStorage to obtain an update or a test pass.

---

# Sky Cycle development: start here

Continue the existing momentum-cycling game, original physics, eight campaign routes, saved progress, independent Workshop documents and direct controller actions. Do not build a replacement game or introduce a second renderer.

The active repair is XR recovery v0.26.1, build sky-cycle-xr-recovery-2026.09.18. Read RESUME-HERE.md, XR-RECOVERY-0.26.1.md and verification/xr-recovery-0.26.1.json. The versioned receipt controls exact-source tests, actual capture review, merge and independent public verification. A branch or version label is not proof of publication.

The September 18 headset report exposed unusable AR menus and a view-dependent intersecting plane. The repair changes immersive visibility ownership, held-grip menu recovery, stable B/back transitions, both-stick navigation and explicit resume. The persistent controller-play menu plane is removed. AR uses fixed exhibit/world-space fragment masking while retaining original material identity. The previous stationary-head emulator did not certify the user's physical headset experience.

The actual game, its supported 2D view and editor canvases remain. Xbox gameplay mappings, remaps, independent saves, soundtrack and browser-owned action handoffs are preserved. XR-MENU-CONTRACT.md describes unchanged v0.26 behavior; where visibility, B mapping, controller-play panel visibility or clipping differs, the current repair note takes precedence.

The full long-range checklist remains AAA-ROADMAP.md. This is a Milestone F/G repair, not a completed physical-device or chapter gate. After release and user retest, reconcile the preserved sky-cycle/canal-choice-0.25 branch at c946e556d1a4d970e4e406d09b7a1f547ae0e8a7. Do not overwrite its fork geometry or replace the repaired XR files with an old branch copy. Waterwheel remains a non-awarding preview.

The prior README and complete handoff are preserved unchanged under archive with the before-xr-recovery-0.26.1 suffix. Older receipts are historical; the latest receipt and RESUME-HERE.md govern active work. Follow GITHUB-RELEASE-PROCESS.md and never clear user storage or reset unrelated master history.
