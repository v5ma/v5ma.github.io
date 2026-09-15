# Lantern Ward / The Broken Delivery Loop

This is the first playable authored chapter in the place-mastery replacement program. It is an integrated graybox, not a finished AAA level. The original neighborhood is still available through `../legacy.html`, with its geometry, save identity, Homecoming, Tidewater, jobs and rewards preserved. `../legacy-layout.json` pins the retained runtime files and entry by SHA-256.

## Ordinary place and disruption

The depot supplies the print shop and lantern workshop through market circulation, a drying terrace, a canal and a goods hoist. A storm has jammed the hoist; the blue service door is latched from the receiving court. Collect the parcel, deliver by any approach, restore either the far-side door or the goods hoist, and return to the depot bench. The 600 chapter credits are awarded once, and the repaired connections persist.

## Three physical approaches

The street approach goes around the covered market to the pump gallery and workshop receiving court. The public print-shop stairs climb to a 4.4-metre terrace, bridge and loading loft; the workshop stair returns to ground level. The arcade stair reconnects the roof route with the market. The canal offers skiffs at two public piers. Draining it exposes maintenance stairs and a walking route instead. These are real movement/collision paths, not node-to-node teleports or objective triggers on a preferred corridor.

The blue door reconnects the receiving side with the red depot sign and familiar bench. The hoist has an open shaft beside the loft and a real landing. It can be called from the other floor, then carries the courier. Saving during a lift restores a stable landing rather than a stale moving-platform state. The sluice is reversible, shows its local waterline/gauge, and refuses to change support beneath an occupied channel.

The initial residents have deliberately small routines and dialogue: a dispatcher, porter and caretaker. The porter reacts to a bell and creates an alternative to blocking bicycle traffic. These are basic authored behaviors, not finished crowd or social simulation. Human review of pacing, conversations, route tradeoffs and whether players recognize the return connection remains open.

## Direct controls

Xbox keeps A hop, X interact, Y mount/dock, LB throw, RT accelerate, LT/B brake, right stick look/turn, RB view, View/D-pad up map, D-pad down jobs, L3 bell, R3 recenter and Start pause. Menu-exit inputs must reach real neutrality. A selects and B returns or cancels replacement. Keyboard uses WASD, E, F, Space, Q, C, M/J, L, R and Escape; dragging changes the camera. Touch controls cover movement, braking, interaction, hopping and mounting.

## Native spatial views

Choose First-person VR, Diorama VR or Diorama AR in Menu. The actual level geometry is rendered separately for both eyes; the older flat-screen theater remains only in the legacy game. AR explicitly requests `immersive-ar` and requires a non-opaque blend mode. Unsupported or denied sessions return a readable error without substituting VR or altering the save.

Diorama openings are the existing tested enum: top, front, both. Selection is instantaneous and atomic; every rendered frame retains at least one aperture. Cutaway walls/floors are presentation-only. The same metre-space collision and mission state operate at every display scale. Model size, stand height/distance, rotation and recenter are available on paused native panels. Placement is manual relative to the viewer; room scanning, hit-test anchors and physical occlusion are not implemented. The stand does not follow the courier.

First-person VR uses head-tracked stereo and snap turns. The character is hidden, artificial bicycle lean and gait bob are not copied to the headset, and hop animation does not move eye height away from its supporting floor. A near-wall head boundary fades the view and suppresses movement. Real Quest comfort, tracking, latency and frame rate need physical playtests; synthetic sessions cannot certify these.

Tracked controls: left stick moves, left trigger accelerates, left grip brakes; right trigger interacts, grip throws, A hops and B mounts/docks. Left X/Y opens Menu. Right stick snap-turns in first person. Xbox can also navigate the native panels. Tracked hands use joint-distance pinch hysteresis; common actions plus hold-to-move/brake are directly on the action panel. Releases, source changes, missing poses and headset/session visibility changes clear held input and pause safely. Operating-system file downloads remain outside native XR menus.

## Progress and release acceptance

The chapter uses `svgn.lantern-ward.v1`, explicit chapter/layout identity and an independent credit ledger. It never writes the original `svgn.paper-delivery-3d.v1` or `svgn.little-planet.v1` keys. There is no automatic reinterpretation of old planet coordinates or copying of old rewards into this chapter. Validated backup/staging writes, export and explicit backup/reset confirmation protect local progress; this is not cloud sync or multi-tab conflict resolution.

Run `node --test svgn-planet/tests/*.test.mjs svgn-planet/design/chapter-contract.test.mjs svgn-planet/lantern/*.test.mjs`. The Lantern Ward workflow also runs actual Chromium/WebGL tours for street, roof, canal, native synthetic XR, and all five retained legacy browser suites. Test movement changes only synthetic inputs. Physical device, fresh-player comprehension, replay enjoyment, production character art, audio and broader chapter replacement remain open gates. Read the versioned release receipt for actual accepted commit IDs; do not infer publication from this document.
