# River Prism 0.11.0 / Rotunda

Prism's main entry now uses an in-scene pedestal rather than a browser-window menu overlay. Direct chapter choices offer AR, VR and screen play. The menu is stowed during combat and summoned by the familiar pause action; it stays where placed rather than following head motion.

Placement controls raise/lower, bring closer/move farther, resize and rotate the panel. The displayed labels and actual picking surface share the same transform. Reset panel, a paused XR stick click, or Home in screen play recovers placement. Screen panels fit the viewport; F2 or the Controls page exposes the retained semantic text-control alternative.

Score, hull and combo appear on a compact controller-mounted display in XR, with a selectable floor display. Brief point/damage deltas reflect the existing game state. Sound controls and saved AR water opacity are inside the rotunda. Changing them does not restart the paused battle.

The old small positional pause rectangle is removed. Normal physical dodging no longer triggers that game-imposed restriction; genuine tracking and session visibility loss still pause. Exiting XR ends the immersive session and keeps the battle paused in memory for explicit same-mode re-entry and resume. This is not a persistent unfinished-battle save across browser closure.

Existing combat rules, bosses, music, chapters, score formats, classic rhythm, lessons, Practice Lab and Floodgate Recovery remain. No other game, portal or private hub implementation is included. Color-change controls, either-color base scoring and revised hazard/blast rules remain separate open gameplay work.

Read ROTUNDA.md for the exact interaction scope, AAA_CHECKLIST.md for outstanding tasks and PR #205 for source/public receipts. Physical Quest/Xbox/touch, owner readability/comfort approval and sustained ordinary-resolution performance remain open. Previous release notes are archived at RELEASE_NOTES-v0101.md.
