# Dino Atlas: Pelagic Recovery

Build: aquatics-20260912.1. This update adds a compact original aquatic-research facility to the existing reserve, plus one six-stage playable mission. It does not replace Living Herds, Coastal Light, Storm Response, Ranch & Coast, any earlier vehicle, the 64 residents, or the 30-species library.

## Play

Open Menu > Water mission: Pelagic Recovery. Accept/continue with A. Visit Wetland Dock, leave your ground vehicle, and request the unoccupied boat with A; this moves only the boat, not the ranger. Board with Y. The objective guides you west through the existing navigable channel and then north along the coast to the new Pelagic pier.

Stop the boat, disembark with Y and climb the actual outside stairs. A operates the safety breaker. Follow the dry west-side deck to the seawater intake and close it using the in-game panel. The drain pump cannot run while the intake is open. Start the pump and watch the water level fall. The staircase gate physically opens when the pool is shallow enough. Go down the pool steps, wade through the basin into the east-side archive room, recover the archive and sample case, and return both to Wetland Dock by boat for a one-time 1,200-credit reward.

Left stick moves; right stick looks. A interacts, B closes, X reloads and Y boards/exits. The local first-person inspection view can be disabled independently in the mission panel. The older vehicle cameras are not replaced. Refraction can also be disabled there. The finished facility remains drained and explorable.

## Water and lighting

The pool and connected archive water sample an actual offscreen scene-color/depth capture. Wave offsets refract the rendered room; depth checks reject displaced samples that would incorrectly pull foreground geometry into the water. Submerged floor and wall tiles have a procedural grid, damp coloring and a moving caustic-like light pattern. Eight reused ripple uniforms react to wading. Ladders, rim rails, service pipes, skylight beams and practical light panels make this an authored pool room rather than an isolated water plane.

This is not path-traced light, a fluid simulation, true underwater volumetrics or a complete swimming system. There is no forced VHS distortion. The supplied reference screenshots were used as visual direction, not uploaded as game assets. All geometry and effects are original procedural work.

One refraction target and depth texture are reused for both pool surfaces. The width cap is 512 on Low graphics and 1024 otherwise. Targets are released outside the local facility and when refraction is disabled or Classic materials are selected. Reduced Motion freezes decorative caustics/ripples while leaving the functional drainage level readable. Pausing freezes the drainage clock as well. The pool does not add another music director; pump ambience uses one active loop routed through the existing ambience bus and short wading cues use the existing effects bus.

## Persistence and safety

Mission state is stored only in dino-atlas.aquatics.v1. Interrupted drainage resumes at the stored height. Earlier saves are not cleared or renamed. Both cases must be recovered before delivery. The existing economy ledger owns the one-time reward, and a pending reward can reconcile after the economy loads. A completed mission cannot be restarted merely to duplicate the payment.

The deep pool is closed for maintenance until drained. This pass implements shallow wading, not diving, swimming or drowning. Its access gate is a real collider. An emergency local safeguard returns a ranger who bypasses it to the dry landing without damage. Explicit mission recovery moves only the ranger and preserves parked vehicles and recovered cases.

## Verification boundary

Node tests cover mission order, pump interlocks, saved partial drainage, bounded state, original-save isolation, dry/wet harbor coordinates, pool access, both case locations, the entire return route through the physical stairs, and the round-trip boat route under real Rapier physics. All previous model/physics/save tests are included.

Rendered acceptance runs on native Chromium with software WebGL and synthetic standard-layout Xbox input. Long boat travel uses explicit positioning fixtures; boarding, entry stairs, engineering deck, pump panels, drainage, on-foot archive traversal, recharge, reconnection, delivery and reload are exercised through production behavior. Runtime shader compilation and screenshots are evidence, not physical-hardware or consumer-GPU performance certification. Listening quality and first-time-player comfort remain human acceptance items in the roadmap.

Technical implementation references, accessed for the existing WebGL material/render-target integration:
https://threejs.org/docs/pages/Material.html
https://threejs.org/docs/pages/WebGLRenderTarget.html
https://threejs.org/docs/pages/DepthTexture.html

The local pinned Three.js distribution and actual browser compilation, not an upgrade to the latest engine, define compatibility.
