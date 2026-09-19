# Rainward 0.16.1 / XR repair

The user reported physical Quest 3 failures in published Freefield 0.16.0. Earlier software-device tests are not grounds to dismiss those reports. This repair addresses source defects and extends acceptance to external XR render attachments. Publication status is established separately in the release PR and evidence receipt.

## Controls and readable information

In the default direct Quest layout, hold right B for approximately 0.55 seconds to open the menu. Pressing the right stick also opens it. A short B press reloads on release. This recovery gesture is reserved even when the gameplay mapping is changed; ordinary menu A/B controls remain. Saved continuous-action bindings still function. Legacy Quest Fieldwork remains selectable with its existing hold-Y menu gesture. Headset system buttons are not intercepted.

A brief entry message explains menu recovery, then disappears. The existing left-open-palm gesture and spatial hand controls are retained. Fast no-fatigue running is now the land-movement default in Free Stride; partial-stick movement remains proportional. A separately saved Run by default setting can restore walk/sprint selection. Legacy movement and water boost remain distinct.

Acquiring a puzzle inscription opens its complete actual text in the headset, pauses the mission and keeps it present until dismissed. Long text is paginated. A or B closes reading without changing a background setting. Other action feedback appears briefly and can be reopened from LAST FIELD MESSAGE. Recorded field notes show their actual author and body. Nothing reveals an unacquired clue or assigns puzzle completion. Journal and map remain available.

## Weapon alignment and scope lifetime

The firearm is an original mechanical pistol/rifle mesh with identifiable slide/receiver, barrel, grip, sights, trigger guard and rifle stock. Existing CC0 assets and license records remain in the repository; this representation is not a newly downloaded model.

The visible gun uses the pointing orientation, not the differently oriented grip axes. Model muzzle, projectile direction and scope share the negative-Z axis. First-person shots no longer converge from the body through the desktop camera. They start at the actual muzzle only if it is near the body and its body-to-muzzle path is unobstructed. Wall collision, finite ammunition, spread, reload and damage remain. Diorama shots originate at the survivor, not the spectator hand. Muzzle transforms refresh after movement.

The scope resets when the scene changes or simulation time goes backward, so chapter changes and retries cannot wait for a previous chapter's clock. It never changes headset field of view. Sight rendering restores the target, viewport, scissor and XR state. Reload/recoil presentation does not rotate the gun away from its shot axis.

## AR and world portals

First-person AR clips environment materials in a single compositor draw, leaving dynamic actors, weapons and reading/UI surfaces intact. Original walls still block bodies and shots. Portals likewise draw world, frame, hands and interface into one XR frame rather than a separate overlay-scene pass. The XR camera is updated before rendering and held consistent through sight and scene draws.

The display remains a character-centered perspective aperture into the actual game, not a bounded map or flat texture. World scenery can remain visible beyond its sides/rear through the aperture. Camera-facing shell panels and foreground architecture retain presentation-only transparency. Both front and top cannot be closed together. Recenter, zoom and saved view preferences remain.

## Evidence and limitations

The new device harness deliberately separates grip and pointing orientations by 65 degrees. It allocates actual GPU framebuffer/color/depth attachments for XRWebGLLayer and XRProjectionLayer paths, instead of presenting into the default canvas. Captures read both eyes from those attachments. This exercises different rendering paths from the old identical-pose/default-framebuffer mock.

These remain artificial XR sessions, poses and room compositing, not a physical Quest or real passthrough camera. Software success does not establish headset comfort, vendor-browser behavior or performance certification. Physical retesting remains required. Native reports distinguish original live-enemy interactions from isolated model fixtures; no actor relocation, health grant, planted checkpoint or automatic puzzle solve is used in the repair journey.

Checkpoint versions/keys, chapter/item identities, rewards, licenses, legacy Xbox/Quest choices and sibling games are preserved. RW-020, RW-049, RW-050, RW-056 and RW-063 record the repair without approving their broader human/device criteria.

## References

The W3C WebXR Device API distinguishes gripSpace and targetRaySpace; the latter specifies the preferred negative-Z pointing direction. Three.js WebXRManager documents explicit updates when cameraAutoUpdate is disabled. The bundled renderer was inspected for base/projection attachment handling. References: https://www.w3.org/TR/webxr/ and https://threejs.org/docs/pages/WebXRManager.html .
