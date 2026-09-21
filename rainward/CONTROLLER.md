# Current pass / Rainward v0.16.2 Field Desk

Read FIELD-DESK.md. The default XR menu stays in its summon-local position through page changes, with height, distance, size and yaw controls plus separate saved preferences. Resume, Map, Satchel and acquired-clue recall appear on the first pause page. The virtual pedestal stows during play; it does not detect the physical floor. The v0.16.1 weapon, scope, compositor and movement repairs remain. Existing chapters, save schemas, controller presets and remaps are preserved. Physical headset acceptance and final quality remain open; only the release PR and public-byte receipt establish publication.

Earlier sections are retained history.

# Current repair / Rainward v0.16.1

Read XR-REPAIR.md and XR-REPAIR-HANDOFF.md. Hold B opens the default Quest menu; short B reloads on release, and R3 remains a recovery control. Acquired clues now appear as full readable spatial text. Mechanical weapon, safe muzzle and scope share the pointing axis; scopes reset between scenes. First-person AR and portals use one compositor draw. Fast land running is the default in Free Stride. Existing saved remaps, legacy choices and checkpoints are preserved. Physical Quest feedback remains distinct from synthetic device acceptance. The release PR and public-byte receipt establish delivery, not this header alone.

The earlier sections below are retained history, not current publication status.

# Current candidate / Freefield v0.16.0

Read FREEFIELD.md and FREEFIELD-HANDOFF.md first. The owner requested faster no-fatigue running, quiet player sounds, direct and saved Quest/Xbox remaps, blink, on-demand XR UI, real world portals, first-person AR, better bodies and different level geography. These supersede older mapping/crop descriptions below. Meridian is the first redesigned chapter in this pass; other chapter replacements and human/device approval remain open. A version string is not publication evidence; use the Freefield PR and served-file receipt.

Earlier release records are historical context.

# Current release / Freight Cut v0.15.0

Read FREIGHT-CUT.md. The existing ward-radio repair now releases a west loading passage; its sorting landing connects the spindle aisle back to market concealment and the established clinic terrace. Both original freight entrances and unpowered extraction remain valid. Wayfinder and Open Diorama are already merged; do not rebuild their features. No new save fields, task IDs, rewards or controller mappings are introduced. Follow the current shared library and exact release receipt; human and physical-device gates stay open.

# Current release / Wayfinder v0.14.1

Read WAYFINDER.md for clinic route chevrons, the gate/map/journal state, spatial pointer feedback and source-owned crafting holds. Open Diorama v0.14.0 is already merged in PR 154; do not revive its preparation branches. The next work remains graybox evaluation and the remaining Floodgate sequence, then chapter replacements, body/contact animation and physical Quest/Xbox review. All seven chapter identities, saves and Xbox presets are retained. The release PR and hash receipt establish publication.

The previous release records follow as historical context.

# Current release / Open Diorama v0.14.0

Read DIORAMA.md for first-person VR, third-person VR Diorama and third-person AR Diorama, controller/hand entry and the three valid shell states. Read LEVEL-DESIGN.md for the new experience-spine/graybox-first replacement contract. The first implemented replacement is the Floodgate clinic-market seam, with a 2.4-metre terrace, new north opening and saved inside-unlocked yard shutter. The other six chapter redesigns remain planned, not completed. All original chapter slots, objectives, shelters and checkpoint formats remain.

The earlier Quest Fieldwork text below describes the first-person component. Its statement excluding AR is superseded by DIORAMA.md. Physical Quest 3/Xbox, hand reliability, comfort, final art/audio and unfamiliar-player pacing gates remain unapproved. The release PR and evidence summary, not this document alone, establish publication.

# Current release / Quest Fieldwork v0.14.0

The owner selected playable Quest 3 XR as the next upgrade. Read [QUEST-FIELDWORK.md](QUEST-FIELDWORK.md) for entry, every tracked-controller button, hand pinch locomotion, immersive menus, and exact evidence boundaries. This replaces the paused overlook; it does not claim that unfinished character-motion work shipped. Existing desktop/Xbox play and all seven chapter saves are retained. Physical Quest 3 comfort, tracking and performance review remain open.

The following earlier notes are retained historical context; their stationary-XR scope does not describe this release.

# Rainward v0.13.1 / controller and interface contract

This is the current control guide. The earlier v0.8.1 X-reload mapping survives as the Classic preset; it is not the default Survival layout. These mappings are implemented using the browser standard gamepad layout. Physical wired/Bluetooth Xbox acceptance remains open.

## Survival / dry ground

Left stick moves. Right stick looks. Left-stick click toggles sprint by default; the setting can restore hold-to-sprint. Tap B to crouch or stand; hold B to toggle prone. A jumps or vaults supported low cover. LB is the dedicated dodge. Right-stick click swaps camera shoulder.

Y interacts with reachable supplies, tasks, field notes, shelters and eligible silent takedowns. X performs melee. Hold LT to aim; RT fires the equipped gun or throws the selected bottle/smoke. Hold LT and press X to reload. The reload action remains available in the satchel and on the HUD. Separate rifle and pistol magazines/reserves stay finite.

Hold RB to listen. D-pad left selects the rifle; right selects the sidearm; up cycles medkit, bottle and smoke. D-pad down opens the satchel. Holding a D-pad direction opens quick crafting; release the direction, choose a recipe and hold A to assemble it. Releasing A or taking damage interrupts a Survival held craft and refunds reserved resources once. Select a medkit and hold RT to bandage; release or damage interrupts it. The world continues during crafting/bandaging. Satchel equipment buttons provide an additional complete selection route for controller, keyboard and touch.

View opens the map and journal. Menu pauses. Human-shield grabs, a distinct deployable trap, arbitrary window traversal and full remapping are not shipped by this release.

## Classic / dry ground

Left/right sticks move/look. Left-stick click sprints using the configured toggle/hold behavior. A dodges or vaults. B crouches or stands. Right-stick click goes prone. Y interacts; X reloads; LT aims; RT fires. LB listens and RB throws a bottle. D-pad up uses a medkit, down opens the satchel, left uses smoke and right swaps shoulders. View opens the journal; Menu pauses. Classic retains its earlier crafting/quick-use behavior; do not describe its actions as the Survival hold-action layout.

## Deep-water override / both presets

Water depth is a separate state, not just a land posture. Entering a deep authored water volume switches to swimming. Left stick still moves horizontally and right stick looks. Sprint input becomes a faster stroke. In Survival, hold B to toggle diving; release after the toggle to keep both sticks available. In Classic, B or prone input toggles diving. A surfaces. Y can recover a reachable underwater objective only while submerged. The air meter appears while swimming and replenishes on surfacing.

All deep-water swimming, including surface swimming, stows weapons and disables melee, reload, healing, crafting and dry-world interactions. A nearby shelter cannot be saved from the pool. Unfinished dry actions cancel safely on entry. Reach dry ground to use those actions again. This is not free vertical 3D swimming or underwater combat. The water HUD now says HOLD B DIVE in Survival, B DIVE in Classic, and A SURFACE while submerged. Keyboard-only play shows Z DIVE and SPACE SURFACE. At 25 percent air or less while submerged, a textual low-air warning identifies the surface control. Its live region changes only on warning transitions, not on every frame. No automatic surfacing or oxygen-rule change is introduced.

## Menus and dialogs / both presets

D-pad or left stick moves focus; A selects and B closes/goes back or cancels. Left/right adjusts ranges and chapter selectors without opening an operating-system select popup. Right stick scrolls long panels. LB/RB cycles chapters on the title or tabs among journal, satchel and controls during an expedition. Checkboxes, equipment, task tracking, records, graphics/audio settings and safe retry/new-expedition confirmations are reachable without the mouse. Focus styling must not move controls during a pointer click.

New dialogs default to Cancel. Holding A cannot accept through the next dialog. Mode/focus changes, device replacement and reconnection require neutral input before gameplay resumes; disconnect pauses active play. Browser permission dialogs, browser chrome and external web pages are outside game control. Audio may require a trusted browser gesture; do not claim that restriction was bypassed.

Settings preserve sensitivity, radial deadzone, inverted controller look, sprint behavior and optional vibration, plus audio/graphics preferences. Unsupported rumble must never interrupt play. Field notes, route plans and production-board filters use the same controller UI conventions. Local board review marks are not repository changes.

## Keyboard and touch parity

WASD moves; mouse or arrows look. R reloads, E interacts, C crouches, Z goes prone on land or dives in deep water, and Space retains the land dodge/vault action or surfaces in water. G melees, J traverses, Alt dodges and V swaps shoulders. Keys 1/2 select sidearm/rifle; 3 cycles tools. H selects the medkit in Survival, then holding fire/F bandages; Classic H uses the medkit. Tab opens the satchel, M the journal and Esc/P pauses. Touch controls and native satchel equipment buttons remain available. Verify prompts against controls.mjs and app.mjs before changing mappings.

## Required follow-up acceptance

Record a physical wired and Bluetooth Xbox run of both presets: title, seven chapter choices, all settings and sliders, long-panel scroll, field-note expansion, task tracking, hold crafting, bandaging, reload, oxygen recovery, cancellation, retry and disconnect/reconnect. The 18 previously passing browser suites and 21 focused water checks used simulated input; they are not this hardware sign-off. A and B should never simultaneously act on gameplay and a newly opened menu.

Source entry points: input.mjs, controls.mjs, app.mjs, controller-ui.mjs, field-ready-ui.mjs, aquatic.mjs and aquatic-ui.mjs. See DEVELOPMENT-HANDOFF.md for release evidence and remaining priorities.
