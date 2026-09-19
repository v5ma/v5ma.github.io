# XR menu buttons 0.26.2

The user reports that A/B/X/Y, triggers and grips still seem non-functional in the AR menu after 0.26.1. Treat the physical report as unresolved until retested. Earlier software passes do not establish that the current complaint is mistaken.

This repair starts at master 3d87ff8eb19d4c71df821c446baacaa449553ff4 on sky-cycle/xr-buttons-0.26.2, PR 203. Exact source f279935ce328485d76f72442ad953aa1dfbacf3f is accepted in run 35460852626 across attempts 1 and 2. The authoritative merge/public status and complete artifacts are in verification/xr-buttons-0.26.2.json. Later documentation does not change the accepted runtime. Preserve sibling work with a normal expected-head merge.

## Confirmed gaps, not an asserted physical-device diagnosis

The old neutral check iterates all controller button values, including unmapped extra slots. Actual old/repaired functions were compared with both hands and seven/twelve-slot pads: an active unused slot blocks old readiness but not repaired readiness. An actual held trigger still blocks readiness. Old menu mappings omit X and both grips, and selection relies on a native trigger event without a sampled fallback. An uncaptured select event can also suppress ordinary gameplay triggers. These are confirmed source/function-test gaps, not proof of the user's exact firmware, profile or physical cause.

The W3C WebXR Gamepads Module defines standard trigger/squeeze/thumbstick slots and permits additional controls. Meta's Touch documentation describes extra contact/proximity inputs. No new framework, runtime dependency, telemetry or camera access is introduced.

## Repair

Session-owned per-source edges handle headset menus independently of desktop focus and gameplay remaps. A/X confirms, B/Y returns one level, both triggers select, left/right grips move previous/next, and both sticks navigate or adjust a selected value. Right B still opens pause during riding. Native select and sampled trigger share one latch; a held press cannot activate repeatedly across menu changes. Initially held controls and non-visible sessions remain gated. Buttons have priority over simultaneous stick navigation. A held stick must return to neutral after a system interruption, without blocking independent recovery buttons.

Only known Touch-family profiles may use the standard slots when mapping is empty; arbitrary layouts are not guessed. Getter-backed native Gamepad properties are read directly. Unused sensor values do not lock readiness.

Navigation selects visible controls, including virtual menu footers. Accumulated ray-pose movement restores aiming even inside the same hovered row. Confirmation acts on the displayed targets, not a newly rebuilt menu. Commands still call the original guarded DOM actions, text Apply/Cancel, confirmation and browser-handoff owners. A select event suppresses gameplay only when UI or an editor gesture actually captures it.

The menu shows v0.26.2 and the last detected input. Raw controller values and last activated target are local diagnostics only, not uploaded or persisted. Controller riding keeps its unobstructed view; the fixed-world AR aperture, hand controls and modern Workshop remain intact.

## Accepted software evidence

The exact-source logs contain 332 passing game rules and 12 original soundtrack rules. Six native reports contain 241 passing checks: AR buttons 44, VR buttons 43, AR Workspace 41, VR Workspace 40, Portal Network 20 and deliveries 53. Source IDs and ZIP digests were verified for all six reports; all 51 PNGs were reviewed. No page or console errors were recorded in those passing reports. Videos are retained where produced, without a claim of complete video review.

The button journeys use the original game and real stereo renderer with emulated native-shaped controllers, twelve button slots with active unused sensors, no assisting Xbox and hidden/unfocused HTML. They independently exercise both grips, A/X opening real Sound menus, B/Y closing once, both raw triggers without select events and delayed-event deduplication. They also prove grip navigation and A activate the real Sound menu with both rays away, both sticks move a currently visible choice, and uncaptured gameplay triggers press/release their original inputs. Held B, direct resume, ordinary riding, changed head poses, system blur, hand input, XR exit and saved data remain covered.

Workspace coverage retains text editing, cancellation, undo, pan, tracking loss, playtest/return and explicit AR/VR switching. The delivery retry serves twelve actual mailboxes and finishes on its first attempt with score 9760; temporary credits 1055 restore to the 777-credit fixture on returning to Workshop. Protected persistent values and all eight campaign builders remain unchanged. The full CPU delivery route uses supported 2D after real 3D inspection.

## Retained failures

Initial source 38ec34c63aa528c68b46722e6ee8168c0944f497, run 35460045645, detected A but activated stale selection after grip navigation. Artifacts 10589827404 and 10589573055 are retained in the receipt. Fresh accumulated ray motion and displayed-target activation correct that defect.

Intermediate 87a5506d47bef3528a78a9a6d9cd99489df3829a, run 35460329888, passed the face/grip/trigger checks but the old stick oracle measured browser focus while the visible XR cursor selected a virtual footer. The oracle now requires a changed currently displayed selection and adds actual no-ray grip/A activation; it does not merely accept a hidden label. Artifacts 10589268921 and 10589458723 remain identified. Source 89200031932f8cfb7d1613411ca80c6663023777 was superseded; its cancelled jobs are not acceptance.

Final source f279935 failed the first delivery attempt after nine genuine deliveries: the Gallery Gate forward-window observer timed out, with no page/console error. Run 35460852626/job 105945062884/artifact 10588929075 remains retained. A retry of only that job on the identical source and test passed all 53 checks as job 105946127069/artifact 10590205257. No game, input recipe, physics or player state was altered to obtain that pass. This remains a timing-sensitive automation failure, not proof that every approach succeeds.

An integration placeholder intentionally stopped before runtime writes and was replaced by source-bound readable integration. Temporary write workflows are removed from the final tree. Container browser navigation is blocked by administrator policy; local Node/VM results are not browser evidence.

## Release and continuation

Follow GITHUB-RELEASE-PROCESS.md through source acceptance, normal merge, all 34 public runtime hashes and both public button journeys. Read the receipt before a live claim. Preserve original physics, eight stable campaign routes, soundtrack ownership, all save namespaces, remaps, Workshop documents and the separate Canal Choice branch. This is a Milestones F/G bug repair, not chapter promotion.

Physical Quest controller/hand behavior, actual passthrough and room lighting, headset text readability, comfort, reference-device performance and long sessions remain open after software publication. The tested editor journeys are not exhaustive coverage of all advanced gestures or imported documents. A changed-head screenshot does not establish physical comfort. The next user retest should check the menu build and last-input readout along with actual selection/back behavior; do not blame saved data or clear localStorage.
