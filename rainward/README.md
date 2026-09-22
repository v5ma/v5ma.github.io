# Rainward / v0.16.4 Reclaimed Places

Rainward is the existing seven-expedition survival/stealth game, with screen play, first-person VR/AR and character-centered VR/AR dioramas. This is a prototype under active development, not a claim of AAA finish or physical-device certification.

Start with DEVELOPMENT-HANDOFF.md, release.json, CONTROLLER.md and production-plan.json. MERGE-RECONCILIATION.md records the September 21 Rainward-only cleanup and explains which branch changes were recovered, retained or discarded.

The missing Grounded foot-plant and swimming motion is recovered through the current visual contact adapter. Current bodies, faces, clothing, skeleton binds, licensed source assets, running speed and gameplay remain. The shipped Freight Cut route replaces the conflicting older Firebreak experiment; do not merge both layouts. Field Desk and XR Repair stay intact.

In the Direct Quest layout, hold right B or click R3 to summon the spatial menu; short B reloads. Hand tracking retains the left-palm menu gesture. The adjustable desk stays where it was summoned instead of following the eyes. Resume, map, satchel, acquired-clue recall and music controls are readily available. CONTROLLER.md is the full binding and saved-remap reference.

Preserve existing localStorage saves and controller preferences. Do not clear browser storage to update the game. New fixes go directly to freshly reconciled master unless a PR is explicitly requested. Reuse established verification; do not accumulate temporary staging branches or workflows.

Model checks, explicit animation fixtures, normal-start gameplay journeys, public-file comparison and physical Quest/Xbox review are separate evidence. See evidence/merge-reconciliation-20260921/ for this pass. The exact previous README is retained at evidence/merge-reconciliation-20260921/before-README.md; its older release instructions are historical, not a request to re-create a branch.

The Reclaimed Places level pass adds the Floodgate quay service rooms and task-operated Terminus escape loops. Read RECLAIMED-PLACES.md for locations, normal controls, preservation rules and evidence limits. Existing Glance Map / Tall Diorama and nonblocking clues remain; no new XR functionality is claimed by this level pass.
