# Courier's Light / Vesperfall 0.17.0 refinement / 2026-09-22

This pass adds a bounded reusable physical tool to the existing expedition, not a replacement game. Living Lanterns, both Pilgrimage chapters, all five immutable layout readers, rewards and finite field-kit saves remain.

## Playing

In first-person VR or AR, reach the separate handle slightly forward of the free-hand waist. Grip carries the lantern; release stows it without a throw or supply cost. Its card gives the existing objective's direction, horizontal distance and upper/lower-level cue. The card belongs to the object, not the head. A bearing is not a walkable route, collision clearance or real-room safety instruction.

Aim a held lantern at a nearby accessible winch, lens, latch or exit and press trigger. Existing Wayfinder selection, same-level reach, hand/head line of sight and authoritative interaction rules remain in charge. Holding trigger does not repeatedly operate a mechanism. Carrying alone never discovers rooms, grants signals or changes rewards. A carried lantern and bow draw do not own the same free hand; stow before drawing. Existing guard and optional smooth movement remain available. Snap turning stows the tool safely.

Keyboard L and Xbox LB+Up toggle the desktop guide light without opening the journal. E / Xbox A retain ordinary nearby interaction. The equipment fieldset has a direct button and in-headset field-kit instructions describe the tool. Bare hands retain menus, not weapon/tool gameplay; switching tracking mode stows controller equipment.

A held frost flask now has an aimed trigger throw as well as the original sampled move-and-release throw. It launches through the same finite inventory, reach/occlusion validation, swept collision and enemy-effect rules as the existing keyboard/Xbox throw. One fresh trigger edge consumes one flask. Full-health healing protection is unchanged. Release after a trigger throw cannot also throw a teleport disk or spend another flask.

## Scope and rendering

There is one reusable carried lantern, not a new saved consumable. Pause, tracking/visibility loss, changed input sources and scene removal cancel ownership. Continue starts paused with the lantern stowed. No checkpoint schema, localStorage namespace, original geometry, enemy roster or reward changes are needed.

The lantern uses the existing Three r184 renderer and a single 4-metre unshadowed point light. It remains in the light set at zero intensity while stowed, avoiding a new shader light-count variant on each grab. This is approximate virtual illumination; it may light nearby geometry across thin surfaces and is not a shadow/occlusion system. Illumination is disabled in AR; only the compact guide/tool remains. No room scan, physical anchoring or real-world lighting claim is made.

Currentworks warmup is now sequential for Fire and the two Trees instances because each temporarily borrows the same renderer target and XR state. Cancellation is checked before each effect. The installed Water/Fire/Trees source blobs remain exact and untouched. No new engine, animation loop, postprocessor or runtime dependency is introduced.

## Verification

All 355 local Node tests pass, with 10 new model/lifecycle cases. The unchanged six-sheet workbook and 76-task snapshot validate. The real bundled-Three object fixture passes 16 checks using fake host/input collaborators; it performs no GPU draw. Local Chromium exposes no WebGL2 here. The independent native courier-lantern journey starts normally, uses keys/gamepad/poses only, walks the actual gallery, operates its winch, verifies the finite trigger throw, tests tracking/AR cancellation and compares the original saved state. Its hosted/public results must be recorded after inspection, not inferred from fixtures.

The preceding run 35816788082 passed Sureflight, Goldwind, both chapter traversal, Fieldwork, interface and Threshold AR/VR jobs. Its Currentworks test still failed because the driver held sprint before neutral after start; its corrected driver also honors the game's stick deadzone. Its physical-field-kit replay failed at the sampled throw despite a previous pass. Those failures remain preserved, and the physical sampler was not weakened to manufacture success. Native/physical throw reliability remains an explicit follow-up.

Read tests/evidence/courier-light-0.17.0/preflight.json and subsequent publication receipts. Do not label synthetic controllers as physical Quest/Xbox approval. Normal-resolution comfort, sustained frame timing and owner acceptance remain open.

## Continue

Do not rebuild the environment layer or reusable lantern. Next, observe real handling and add a small consequential refuge objective, including solo recovery and clearly versioned persistence. Throwing/dropping the lantern, enemy distraction, new authored chapter modules, difficulty tiers, melee and co-op are not included in this pass. Update FUTURE-DIRECTION.md and DEVELOPMENT-HANDOFF.md after every substantial pass and reconcile fresh master before writing.
