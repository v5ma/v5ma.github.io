# Graphics v0.5.0: glass, chrome and cut crystal

This is the same hosted SVGN.io Paper Delivery app, not a new game folder. It keeps nine roads, all original/bonus addresses, all stunt gates, the same collectible positions and rewards, and the 30 m/s Shift boost. No original gameplay equation is changed in this graphics milestone.

The rider's cycles gain lacquered bodies and polished alloy parts. Traffic gains clearcoated paint, rounded panels and glass. Architectural glass is kept out of opaque low-power batches. Existing postmarks are rendered as faceted gems. Four open-sided, glass-and-gold verge shelters and displays add local landmarks without placing obstacles across the roads. The water has an original animated ripple/Fresnel pattern; earned pickups and deliveries trigger a fixed-size spark pool.

Menu offers Balanced, Cinematic and Light optics separately from resolution/shadows. Balanced uses filtered environment reflections and translucent glass without a screen-space transmission pass. Cinematic adds physical transmission, spectral dispersion on crystal, and a quarter-resolution luminance bloom. Light avoids those extra passes. Reduced effects disables bloom and animated glints/collection particles. Preferences use a separate local-storage key and do not alter saves.

The generated linear-HDR environment is a sky/light-card approximation. It is not a live mirror of the streets, a ray-traced renderer, a photographed room or refracted real-world camera feed. Water caustics are an artistic shader pattern, not physical light transport. Glass and crystals remain conventional rasterized Three.js materials.

The existing pinned renderer is retained. No new Three.js copy, paid pack or unreviewed third-party shader is imported. Primary references studied for this work:

https://threejs.org/docs/pages/MeshPhysicalMaterial.html
https://threejs.org/docs/pages/PMREMGenerator.html
https://developer.playcanvas.com/user-manual/graphics/physical-rendering/physical-materials/
https://aframe.io/docs/1.7.0/components/material.html
https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/custom_procedural_textures/
https://threejs.org/manual/en/how-to-create-vr-content.html

The techniques are implemented in the existing renderer rather than stacking incompatible engines. WebXR locomotion, stereo-safe post-processing and physical headset comfort testing remain open: this release does not pretend a headset button alone is a finished VR game. Likewise, the older unmerged Signal City PR needs reconciliation with v0.4 roads before it can be safely published; it is not silently merged over newer graphics.

Release gates are the preserved model tests, ordinary-input road/boost and desktop/mobile scenarios, matched real-render captures, material switching, local-save isolation and forced context recovery. GPU render-target contents must be regenerated after WebGL restoration. Native Chromium evidence is not certification of physical phone performance, headset performance or visual parity with the user's references.
