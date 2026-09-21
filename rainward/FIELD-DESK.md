# Field Desk / Rainward 0.16.2

Continue the full published v0.16.1 XR Repair rather than rebuilding or replacing it. Source baseline: master d539c8e6bdf16339df16d3c514df1a2f4043af15; latest Rainward runtime d08a90b1b68daf04a2a0f2e905a3d2c51ef5f5d6, merged in PR194. The owner requested in-scene menus that remain placed, compact controller status, and a stowable adjustable pedestal. No private hub code or review file was used.

## What changes

In the default Direct layout, hold B or click R3 to summon the menu; the left-palm hand gesture remains. The panel captures the current horizontal reference frame on opening. Turning, leaning, paging, reading, adjusting audio and using a button do not reattach it to the eyes. Resume, Map, Satchel, Last acquired clue/note and Last field message appear first. Map selection displays the actual mission map immediately, with its next objective and existing route logic. Legacy pinned controls retain their previous presentation and map behavior.

DESK POSITION is a persistent spatial control beside the page arrows. Its controls change height, distance, uniform size and horizontal rotation in bounded increments. They use the actual transformed mesh for pointing/pinch selection. In placement mode the left stick and A offer focused selection, while B closes placement. Reset and Recall keep the layout recoverable. Only explicit Recall/Reset/reopening changes the reference origin. No grip has been repurposed away from interaction or blink.

The original Rainward virtual pedestal is calibrated relative to summon height, not detected from room surfaces. It supports the panel when open and stows out of view during play. Reduced motion is the default: optional motion affects only the pedestal, never slides the selectable panel away from its hit target. The pedestal may also be disabled. Height is relative to the current seated/standing summon pose, so recalling while seated does not require reaching an old standing position. Bounds cannot guarantee personal comfort; physical headset review remains required.

Layout is stored only in svgn.rainward.v1.field-desk. Room coordinates, chapter data and health/resources are not stored there. Storage denial leaves a usable session-local layout. Menus stop intercepting rays immediately on close. Existing source-owned held actions, input neutral arming, camera/muzzle authority and real XR session shutdown remain.

Acquired clues are kept separate from newer transient messages. Recall can recover the latest acquired inscription/note in the current expedition, including a clue already marked read in an earned checkpoint. It does not reveal an unread solution, award a note, solve a puzzle or migrate a save.

## Evidence and delivery

The local model/source suite includes transform/raycast, stow, visibility, storage denial, bounded layout, clue retention and restored-clue tests. Browser acceptance must use the actual game, normal start, controller/hand selection, both-eye compositor captures, audio/map access, unchanged saves/remaps and exit/reentry. Existing v0.16.1 compositor journeys protect clue-solving, gun alignment and scope changes. Synthetic tracking and rendered pixels do not approve actual Quest tracking, passthrough appearance, comfort, performance or enjoyment.

The local browser is administrator-blocked. No bypass was attempted; native HTTP/WebGL testing runs on the repository's authorized GitHub Actions runner. Failed attempts remain in artifacts. Do not describe source/CI as published: merge normally, preserve concurrent master work and compare the actual served files separately.

This pass preserves seven chapters, characters, gameplay, finite rewards, save versions/keys, Xbox presets, licensed assets and the private/public boundary. No A-Frame migration, private WebXR SaaS implementation, game-launch hub, walking/sphere portal, hand-grab panel authoring, or multiple independently detachable panels is included. Those remain separately scoped work.

Reference definitions consulted: Three.js Object3D world/local transforms (https://threejs.org/docs/pages/Object3D.html) and W3C WebXR reference spaces / pointing versus grip frames (https://www.w3.org/TR/webxr/). Runtime remains on the vendored renderer, without a dependency upgrade.
