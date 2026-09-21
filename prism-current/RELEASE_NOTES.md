# River Prism 0.11.1 / Rotunda Recovery

This patch fixes an interrupted-resume race: hiding or leaving the headset while audio is preparing can no longer allow a late promise to restart the battle. The run stays paused with its progress intact, and returning requires a new deliberate Resume. Playback checks the current session identity, visibility and calibration; stale requests cannot alter a newer request's status. See INTERRUPTION-RECOVERY.md for the reproduction and evidence boundaries.

The Rotunda interface from 0.11.0 remains: an in-scene pedestal instead of a browser-window menu overlay, direct chapter AR/VR/screen choices, world-anchored placement, and a menu that stows during combat. Raise, lower, move, resize or rotate it with the displayed controls. Reset, a paused XR stick click, or Home in screen play recovers placement. F2 or Controls exposes the retained semantic text alternative.

Score, hull and combo stay on the compact controller-mounted XR display or the selectable floor display. Sound and saved AR-water-opacity controls remain inside the rotunda. Normal physical dodging no longer triggers the old arbitrary position rectangle, while genuine tracking and visibility loss still pause. Exiting XR preserves the current battle in memory for same-mode re-entry; closing the browser is not a persistent unfinished-battle save.

Combat rules, bosses, soundtrack, chapters, score formats, classic rhythm, lessons, Practice Lab and Floodgate Recovery are unchanged. No sibling game, portal or private hub source is included. Color-change controls, either-color base scoring and revised hazard/blast rules remain separate open gameplay work.

Application and browser-title version is 0.11.1. The unchanged Rotunda/XR layout components retain their 0.11.0 revision label. Native source and served-file/public-play verification are recorded independently in the release discussion. Model tests and emulated input are not physical Quest/Xbox/touch, human approval or sustained-performance certification.
