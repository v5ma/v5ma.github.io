# Field Clarity / 2026-09-22

## Implemented response to the playtest

Build ranger-field-clarity-20260922.1 addresses missing interaction messages, absent live XR maps, unclear next actions, and the shallow diorama. It is the same full Classic Reserve and Tidegate, not a new simplified game. Runtime publication and exact-source browser verification must be recorded separately from this implementation description.

The old compact wrist UI omitted the notification and radio streams altogether. The floor display now copies actual game messages and the existing navigation data into canvas-textured, floor-relative surfaces outside the miniature-world transform. A persistent HERE line shows the current nearby interaction and its actual control, or why the ranger needs to move closer or stop. It does not falsely imply that the trigger is the interaction button. Existing menu and wrist access remain.

The floor guide includes a live map, the selected mission, its current step, the destination bearing, selected tool and supplies, and mode-specific controls. It is present during ordinary headset play without opening a modal. Classic uses its existing live minimap; Tidegate now maintains a compact route map even when its full map is closed. White indicates the player, gold the actual selected goal. Tidegate's compact map omits wildlife, explicitly identified in its accessible label; the full map retains wildlife. These maps do not invent passable routes across obstacles.

A separate floor message surface lasts 2 seconds in wall-clock time, fading during the last 0.4 seconds. Pausing does not freeze an obsolete notice in view. The last twelve messages remain readable through What to do / controls, so a brief notice does not permanently remove mission instructions. The guide itself and current HERE prompt do not time out. Looking around does not drag the display with the head. Menu summon or Bring floor guide here deliberately repositions it. Its height can be raised for seated play.

## Larger box and accessible size controls

The default physical aperture is now 2.0 m tall, versus the former approximately 0.565 m at default width 2.4 m. An older presentation preference without height receives the new height without clearing saved width, aperture or view choices. Box height can range from 0.6 to 4.0 m; width from 0.8 to 4.8 m. Resizing keeps the existing character-center height rather than lifting the character out of sight. This changes the aperture, not game-world collision or mission coordinates. Full depth through the side/rear faces, automatic cutaway and the three legal top/front opening states remain.

Workspace starts with six direct buttons: Menu smaller/larger, Diorama smaller/larger, and Box shorter/taller. Menu size is independent of box size. Taller changes only aperture height; larger changes width and height together. Controller focus now brings the spatial page containing that control into view, fixing focus moving invisibly beyond the current page. The existing workspace slider now reaches 180 percent, with 55 percent minimum. The floor guide has its own size and height controls. Current values are labeled, persisted and validated. No new hand gesture or remapping must be learned merely to resize a display.

## Find the next action

Look down for the floor guide. Its Map button opens the normal full map. What to do / controls opens the actual current objective, current step, nearby interaction, the selected device/control profile, and recent messages. Menu / sizes opens the existing workspace directly. B remains menu/back for Quest; either grip interacts in Active mode. LT aims, RT uses the selected tool, X reloads, Y boards or exits, and A jumps on foot or brakes/hovers aboard. Legacy and Xbox profiles remain selectable and receive different, truthful help. Hand-only users retain the existing hold-to-move Field tray.

In screen play, What do I do? / Controls is next to the pause-menu resume control. Tidegate also gains a visible live minimap button. Screen DOM remains an accessible fallback; this pass does not claim a complete canvas-only screen UI rewrite.

## Preservation and evidence boundaries

All existing mission IDs, rewards, inventory, field cargo, physics, animation, utilities, Express rules and controller settings remain. The separate dino-atlas.field-feedback.v1 preference stores only personal display settings. Existing presentation/workspace keys gain bounded size values, not a migration or reset. No private hub material, new travel portal, engine migration, vendor change, PR or staging workflow belongs to this pass.

The baseline full suite passed 265 tests. Three source/presentation regression assertions demonstrate the absent message connection, absent closed-menu Tidegate map update and shallow default before this change. The integrated local suite passes 277 model/physics/source tests, including twelve focused checks for message lifetime/history, legacy preferences, actual resizing and preserved portal centering, profile-specific help, current task/prompt data, stationary floor placement and button/background picking. These are not headset acceptance.

The new field-feedback-browser.py drives both full games with real synthetic Xbox values and production menu/pointing handlers. It checks live maps during actual movement, ordinary reload feedback and its expiry while paused, floor Help, size controls through ray intersection, no actor movement during resizing, session exit and persisted dimensions. It uses explicit XR session/head/controller mocks, not assigned player/mission/inventory/reward state. The existing spatial, portal, Express and regular-game entry checks remain in the existing read-only Dino workflow; its public job separately checks served hashes and repeats public journeys before archiving the release.

Local localhost browser navigation is blocked by environment policy. No local full-game rendered pass is claimed. Hosted source/public outcomes must be appended from their actual results. Physical Quest/Xbox, passthrough/stereo compositor, room comfort, text reach/readability and human understanding remain open; request player feedback rather than treating synthetic rays as physical approval.


## Recovery refinement / 2026-09-22

The saved baseline b736121c35f1b62b9a4c981e55a9cbd166557ddc already contained the requested floor map, messages and tall aperture. Source run35693523781 passed both full-world feedback/spatial/portal/Express jobs and the launcher itself, but the later Grounded walking assertion failed after a fixed1.4-second input pulse. Its public and release jobs were skipped, not accepted.

Review of its actual renderer capture found a separate player-facing defect: the long map legend overlapped the mission title. The revised layout uses a short LIVE MAP heading, a separate bounded legend under the map, and a dedicated goal column. A real Canvas2D layout fixture verifies measured text extents without claiming a full-game or headset run.

First-patrol and guided-lesson instructions now derive from the selected device/profile instead of telling Active Quest users to accelerate with their tool trigger. Boarding is explained when the ranger is on foot. Help distinguishes keyboard, hand-only, Xbox and Active/Legacy Quest controls. Legacy squeeze aiming stays unchanged. HERE removes obsolete A suffixes when the current interaction uses grip. These are read-only descriptions; mission targets, gates, progress, rewards, inputs and physics are not reassigned.

The Grounded runner now waits for the same required physical displacement under ordinary stick input instead of assuming1.4 seconds is enough on software rendering. A blocked ranger still fails after30 seconds. It records state/focus/neutral diagnostics on failure; no teleport, progression assignment or reduced displacement criterion is introduced. This change requires its own hosted result before calling the failure resolved.

Four reproduced pre-repair guidance/layout assertions and their red trace are retained. The final local suite passes285 tests with zero failures/skips, checks62 JavaScript files, and scans72 owned runtime/script files for conflict markers. Eight new focused checks cover profile-specific instructions, unchanged task identities, keyboard and Legacy mappings, layout and HERE labels. Actual browser/public/hardware evidence remains separate. Use verification/field-clarity/recovery-20260922.json and later publication receipts for completed results.
