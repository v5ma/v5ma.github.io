# AR / VR menu continuity contract

This contract supplements the existing controls, save contracts and movement-first level-design methodology. It does not replace campaign goals or certify a physical device. The versioned Spatial Workspace receipt controls which software journeys actually passed.

## One game across presentations

The stereo miniature reuses the existing Three scene, rider, collision, deliveries and game loop. AR requests an actual immersive-ar session and alpha composition outside the clipped exhibit. VR requests immersive-vr. The clipping volume is a presentation aperture around the following rider, not a boundary that truncates the authored game world.

The supported 2D game, modern Workshop and older editor remain their existing canvases, presented live inside the headset. Editor pointing emits ordinary pointer gestures into the real editor. No alternate progress model, duplicated route, account or storage migration is introduced. AR and VR switching deliberately ends one browser session and asks the player to enter the other; the game or draft stays in this tab.

## Shared controls and menu ownership

The actual connected DOM element owns the action. XR supplies pointing, readable labels, pages and text entry. Button callbacks, checkbox states, range/select/number changes, expandable summaries and text-field input/change events use the same application paths as ordinary controls. Hidden, disabled or disconnected controls cannot be activated from a stale entry. Password contents are not drawn on the public-facing XR panel.

Common riding actions retain direct mappings. The compact hand bar stays below the primary view. Editor Select, Pan, Undo, Redo, Fit, Zoom and Playtest have direct controls rather than requiring repeated trips through the full tool catalogue. Editor tools return through a distinct Resume editing control; Back to game is a separate, deliberate action.

Xbox remains a supported input path inside XR. A on a text field uses the same headset keyboard as a tracked ray. Directional adjustment changes the real slider or select. Focus must reveal its displayed page; it must not silently remain on an unseen control. Exit XR is present both in the spatial controls and as a native menu button accessible to controller focus. A user can open the wider game/editor menu from Flight Deck.

All menus is root navigation, not an implicit approval. It cancels uncommitted modal input and releases held actions before exposing the current game's or editor's controls. Nested Back retains the appropriate parent. A virtual game menu must keep the simulation paused even when a just-closed legacy modal posts a delayed resume callback. An editor tools menu must not accidentally leave the editor.

## Text, confirmations and browser-owned actions

Text editing uses a local, bounded edit buffer. Apply validates the actual field before committing input/change events. Cancel leaves the field unchanged. Unicode-safe deletion and input length limits remain enforced. The keyboard dialog participates in normal controller focus and native Back handling.

Existing synchronous confirm/prompt guards first return cancellation, before the guarded action mutates anything. An explicit headset approval replays only the same still-connected control and exact question. Changed questions invalidate the approval. Tokens exist only for that synchronous action and are never persisted or logged. An informational alert is displayed, not replayed as another action.

File selection, platform permission prompts, external navigation, native fullscreen/clipboard/reload and hardware-binding capture are browser-owned. They are not falsely represented as completed inside a texture. The player receives an explicit choice to leave XR, followed by a fresh Continue button in the browser. Cancellation keeps the current draft or game. Account/network services and arbitrary imported documents require their own qualification.

## Recovery and resource ownership

Source disconnect, visibility loss, cancellation and XR exit release held movement and cancel incomplete editor capture. An interrupted drag must not leave the editor in a stuck pointer state. Ending XR detaches the game-owned scene before disposing presentation resources and restores the original renderer and editor ownership. The native animation callback must be installed before the pinned r177 XR manager captures it; reversing this order produced a retained blank-framebuffer failure.

A frame counter and two reported eye cameras are insufficient rendering evidence. Acceptance must inspect the real XR framebuffer for completeness, nonempty image content and correct opacity, then visually review captures. AR transparency in emulation does not certify actual Quest passthrough, room placement, hand ergonomics, comfort or hardware performance.

## Qualification boundaries

The software journey covers selected AR and VR requests, stereo rendering, real menu opening and reading, adjustment and checkbox states, tracked and hand riding, brief pinch pause, live 2D, text editing, cancelled replacement and browser handoff, undo, native editor pan and tracking loss, playtest/return, deliberate mode switching, exit and denied re-entry. The independent twelve-delivery and Portal Network regressions retain earlier game and save contracts.

Do not describe this as exhaustive testing of every possible imported document, every network/account state, physical Xbox, physical Quest 3, room lighting, native layer/multiview behavior, accessibility with every assistive device, or long-session frame times. Report the exact tested source, actual assertions, captures, failures and public verification separately. Continue the preserved Canal Choice branch after reconciling these input/UI changes; no chapter promotion is implied by this presentation upgrade.
