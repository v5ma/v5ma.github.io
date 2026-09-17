# World Portal presentation contract (0.14.0)

The original expedition runs in its original meter coordinates. A fragment-level ray/box aperture displays all world depth visible through the box, including beyond its back and sides; geometry does not leak outside its projected silhouette or in front of its entrance. This is not a bounded map, a second simulation or a flat render texture. It does not require a stencil attachment from the XR compositor.

The courier stays exactly at the moving world origin mapped to the room-fixed anchor. Physical box size remains 60 by 48 by 35 game units scaled by the existing 0.02 to 0.055 setting. Default footprint remains 1.80 by 1.44 meters. Table height and recenter placement are retained. Behind-character camera orientation follows deliberate pad/desktop look; tracked-controller pointing changes aim without spinning the camera in a feedback loop. Right XR stick orbits the world, not the user's head.

Top/front serialized presets stay both, top and front, never sealed. Near-facing shell panels are fully transparent per render eye; far panels are a faint non-occluding tint, not opaque cutoffs. Existing room-shell visual cutaways do not remove collision.

Custom materials, stock meshes, instancing, skinned humans, sprites, lines and particles use the same aperture. Full inverse projection/view matrices and actual per-eye viewport coordinates avoid the old scaled-rig and billboard assumptions. Materials arriving asynchronously are adapted before their first rendered frame. Material disposal releases the adapter registry.

The diorama HUD is a small room-fixed dock below the box. The full spatial menu appears only when paused/opened and is fixed at that opening pose. Neither rectangle follows head roll. Both hands retain neutral-gated spatial selection; hand-only gameplay remains unsupported. Tracked controllers and Xbox provide movement/combat, with original action mappings and remaps.

First-person VR remains available. First-person AR is separately selectable and explicitly requests immersive-ar. It retains life-size gameplay geometry and removes opaque sky/fog for alpha composition; it is not a tabletop or an AR passthrough video renderer. It does not sense room furniture or physical obstacles. Keep a clear physical play area. Exit restores normal rendering and does not change saved progress.

Evidence and hardware approval are separate. Native software-renderer and synthetic XR tests do not certify physical stereo, passthrough, hand accuracy, comfort or sustained frame time.
