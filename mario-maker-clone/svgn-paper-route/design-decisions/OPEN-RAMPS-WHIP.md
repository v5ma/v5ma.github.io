# Open ramps and whip traversal

This implements the user's supplied ramp/partial-loop examples as playable geometry and movement, not another image. Hookline Run is a fourth, prominently placed course inside the live application. The three prior ring courses and the separately packaged Studio artwork remain available and are not replaced.

Four separate open surfaces form the route: a rising kickoff ramp, a suspended 144-degree partial loop, a long curved receiver, and the depot approach. Open lips launch in their actual tangent direction. They do not wrap to a loop start or require the closed-ring gold-sector trigger. Space can deliberately jump from an open rail. Landing uses a swept, one-sided collision test along the real surface, including its steep sections.

Hold Z near a peg to cast the whip. Keep holding and use D/right or A/left to pump the pendulum. Up/down reels in/out with a bounded rope length. Release Z to leave with the swing's tangential velocity; full revolutions charge a bounded extra boost. C throws newspapers only and cannot silently grab an anchor. Pegs have finite range and line-of-sight checks. The rope attaches at its actual distance without moving the rider to a preset point. The route includes a main and lower recovery peg; finishing requires a grapple release as well as completing its four sections and deliveries.

The current Cloudview renderer draws the open track meshes, and this extension adds bolted peg heads, a reach halo and an instanced segmented chain. HUD text distinguishes open sections from closed loops. Keyboard, remapped gamepad Z, and a pointer-captured touch button share the same tether logic. Physical gamepad and phone testing is separate from emulated browser tests.

The existing editor can open a route copy. Its cm metadata retains kind=open with the curve points, so playing a saved/edited copy keeps the correct movement. Existing peg tiles can be moved with the palette. Edited geometry is not automatically certified reachable. Retry returns to a real recorded catcher contact and keeps completed deliveries. Original player blueprints are still backed up/restored by the campaign.

GrappleCore isolates deterministic math for tests of range, line-of-sight, continuous attachment, rope length, tangent release, speed caps, collision sides and real open endpoints. Native HTTP replay tests use keyboard/button events, not assignments to player position, velocity, score or progress. Test artifacts contain the actual renderer screenshots, video, event history and exact source identity. Successful local inline tuning is not represented as a WebGL or deployed playthrough.

No private material, third-party game artwork, model service, new account system, or additional remote runtime is used. No dinosaur, theology or Studio source is changed. Revert the merge commit to roll back; do not clear browser progress or reset unrelated repository history.
