# XR menu buttons 0.26.2

The user reports that A/B/X/Y, triggers and grips still seem non-functional in the AR menu after the 0.26.1 repair. Treat this as an unresolved physical playtest report until retested. Older software passes are not evidence that the current physical complaint is mistaken.

This branch starts at master 3d87ff8eb19d4c71df821c446baacaa449553ff4. The prior Sky Cycle runtime is unchanged from published 0.26.1; intervening master work is outside this game. Preserve all sibling work with a normal merge. The branch is sky-cycle/xr-buttons-0.26.2. Candidate 87a5506d47bef3528a78a9a6d9cd99489df3829a is awaiting hosted qualification. The versioned receipt, when written, controls final acceptance and public status.

## Confirmed code gaps and bounded inference

The old input-neutral check iterates all controller button values, including unmapped extra slots. A seven- or twelve-slot test pad with an active unused value blocks readiness even when gameplay controls are released. Old menu mapping omits X and both grips. Trigger selection depends on a native event without a sampled-button fallback. These are confirmed source/test gaps. They do not establish the exact controller profile, firmware or cause on the user's physical device.

WebXR Gamepads defines the standard trigger/squeeze/thumbstick slots and permits additional buttons. Meta documents additional Touch controller contact/proximity inputs. Menu readiness must consider commands actually used, not passive contacts. Sources: W3C WebXR Gamepads Module and Meta WebXR Touch controller documentation. No new runtime dependency or camera access is introduced.

## Implementation

A session-owned input module handles menu edges independently of desktop focus and gameplay remaps. A or X confirms, B or Y returns one level, either trigger selects, and left/right grips move previous/next. Both sticks navigate and adjust applicable fields. Tracked gameplay mappings remain unchanged; right B still opens pause from riding. Native select events and sampled trigger edges share one latch so a single held press cannot double-activate or cascade across dialogs. Initial held controls and system-blurred sessions remain blocked until release.

Only known Touch-family profiles are accepted when a device omits xr-standard mapping; arbitrary layouts are not guessed. Standard xr-standard pads use the documented slots. Getter-backed Gamepad properties are read directly. Unused touch/proximity values do not hold readiness closed.

Grip/stick navigation selects visible controls, including menu footers. Real ray movement restores aiming even when the hovered label remains the same. Activation uses the displayed targets rather than rebuilding the menu underneath a press. All commands still call the original guarded DOM actions, text-edit Apply/Cancel, confirmation and browser-handoff owners.

The menu shows v0.26.2 and the last detected input. Detailed input values and the last activated target remain in local diagnostics only; nothing is uploaded or saved. The controller riding panel stays hidden, the fixed-world AR aperture remains unchanged, and hand/editor paths remain supported.

## Revealing tests and recovery

Initial source 38ec34c63aa528c68b46722e6ee8168c0944f497 passed 317 game rules and the Portal Network/delivery regressions. Its expanded native button matrix failed when A activated an old selection after grip navigation instead of the pointed Sound menu. Retain run 35460045645, VR artifact 10589827404, SHA-256 feb764834d4213913b00e7a70194032991a1d91292b0e1c12ef8a91875df0364; AR artifact 10589573055, SHA-256 d37542c2b8c956eb7bad1a1d122c0ed483ee87becc7fa9359898d5927df7daed. The input was detected; the selected target was wrong. The correction tracks accumulated ray-pose changes and preserves the displayed control set during activation. Native assertions are not removed.

The module tests cover each face/trigger/grip button, unused sensor slots, raw getter properties, press/release latches, native/polled event order, initial held grips, source removal, system visibility and known-profile fallback. Separate fixtures execute the actual dispatch function. These are isolated tests, not physical-device or native-game acceptance.

Hosted AR/VR tests extend the original recovery journey with both getter-backed twelve-slot pads, active passive sensors, independent grips, A/X opening real Sound menus, B/Y returning once, and raw triggers with delayed native events. They retain hidden-page riding, moved-head captures, system blur, hand input, exit and save assertions. Existing Workspace, Portal Network and twelve-delivery regressions remain required. No rider, score, delivery or win values are assigned.

A placeholder staging workflow stopped before any runtime mutation; it was replaced by readable, checksum-bound integration and removed after applying. Retain that staging error as tooling evidence, not a gameplay failure. Container browser navigation is blocked by administrator policy; local Node tests are not a substitute for hosted browser evidence.

## Release and preservation

Follow GITHUB-RELEASE-PROCESS.md: exact-source tests and captures, expected-head merge, all 34 public runtime hashes, then both public all-button journeys. Never label an unmerged candidate or source-only pass as live. Preserve original eight-route campaign, physics, soundtrack owner, all save namespaces/remaps, editable documents and the separate Canal Choice branch. This is a Milestones F/G bug repair, not level redesign or chapter promotion. Physical Quest controller/hand behavior, room passthrough, comfort and long sessions remain open after software release.
