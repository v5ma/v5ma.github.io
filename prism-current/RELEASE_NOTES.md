# River Prism 0.11.2 / Currentworks Pass 3

The normal Duck Armada scene now includes eight seeded palms, alders and willows along the riverbanks. Screen and VR show them; AR and Mothership hide them. Actual branch and leaf geometry has three prebuilt detail levels, root-fixed wind driven by the pausable game clock, and a shared wind calculation per tree. The set is placed outside a tested 7m-wide central action corridor, without adding collisions or changing combat.

Water 0.1.0 and Fire 0.1.3 remain. The tree module is independently reusable as trees.js or trees.mjs, alongside the existing water and fire modules. TREES.md in modules/environment documents the API, coordinates, loading preparation, reset/disposal, quality caps and compatibility limits. The graphics are stylized foundations, not a claim to match the reference demos' realism.

The tree-pass runtime is 18d83fa4b5aa2f4115d6c602af2bf9a51c06896a. Its public job matched 113 files and passed all 151 tree/fire/water/interruption/Rotunda checks, including both complete Arcade chapters. Its separate source run exposed rendering pauses and an initial panel-selection failure; those and the unchanged retry are preserved in modules/environment/PUBLIC-PASS3.json. Physical-device, sustained-performance and owner acceptance remain open. A public pass does not erase a source failure.

This recovery updates the reusable module index, accurate API/continuation documentation and three metadata consistency tests. The tested browser runtime is unchanged. No PR, staging branch, new deployment workflow, private hub material, portal, sibling game or saved-progress reset is introduced.

Blade-color switching, either-blade base rewards, color-match bonuses and expanded missile/explosion-danger feedback remain separate unfinished gameplay work. Scenic modules do not substitute for those requests. Next comes reliability and combined visual refinement of the three existing modules.

## Historical 0.11.1 / Rotunda Recovery

This patch fixes an interrupted-resume race: hiding or leaving the headset while audio is preparing can no longer allow a late promise to restart the battle. The run stays paused with its progress intact, and returning requires a new deliberate Resume. Playback checks the current session identity, visibility and calibration; stale requests cannot alter a newer request's status. See INTERRUPTION-RECOVERY.md for the reproduction and evidence boundaries.

The Rotunda interface from 0.11.0 remains: an in-scene pedestal instead of a browser-window menu overlay, direct chapter AR/VR/screen choices, world-anchored placement, and a menu that stows during combat. Raise, lower, move, resize or rotate it with the displayed controls. Reset, a paused XR stick click, or Home in screen play recovers placement. F2 or Controls exposes the retained semantic text alternative.

Score, hull and combo stay on the compact controller-mounted XR display or the selectable floor display. Sound and saved AR-water-opacity controls remain inside the rotunda. Normal physical dodging no longer triggers the old arbitrary position rectangle, while genuine tracking and visibility loss still pause. Exiting XR preserves the current battle in memory for same-mode re-entry; closing the browser is not a persistent unfinished-battle save.

Combat rules, bosses, soundtrack, chapters, score formats, classic rhythm, lessons, Practice Lab and Floodgate Recovery are unchanged. No sibling game, portal or private hub source is included. Color-change controls, either-color base scoring and revised hazard/blast rules remain separate open gameplay work.

Application and browser-title version is 0.11.1. The unchanged Rotunda/XR layout components retain their 0.11.0 revision label. Native source and served-file/public-play verification are recorded independently in the release discussion. Model tests and emulated input are not physical Quest/Xbox/touch, human approval or sustained-performance certification.
