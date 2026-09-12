# Spectral Observatory / v0.7.0

This is a visual upgrade of the existing Prism Current game. The four songs, scoring core, hit plane, input system, Practice Lab, First Steps and score namespaces are unchanged. The new shader source is graphics/spectral.js. The application version advances; the unchanged scoring core does not.

## The new light

Opal Aurora layers jade/violet curtains and fine folds behind the distant stage. Solar Silk produces amber/rose orbital filaments. Deep Current uses blue/turquoise interference bands. Each is analytic GLSL on the same background plane, not a video or downloaded texture. The central approach corridor is dimmed to reduce competition with notes.

A diffraction halo surrounds the distant metallic orbit. Tiny inner jewel seeds use a dichroic interference shader while outer optical crystals, bezels, glyphs, left/right identity and collision geometry remain intact. Successful hits trigger widening, hand-colored floor rings with a secondary echo. Their origin follows the actual hit's x/z coordinates; these are decorative virtual-floor effects, not physical waves or traced caustics.

No bloom compositor, screen-space lens, camera sample, real-room refraction, additional render target or per-hit point light is added. Three shared-geometry planes and five materials are allocated once. A six-slot uniform event pool limits ripple work, and a short cooldown coalesces very close events. Theme changes use uniforms and retain resources. Effects dispose with the existing art instance.

## Controls and boundaries

Open Controls, sound & comfort and choose Spectral atmosphere. Opal Aurora is the initial default, with Solar Silk, Deep Current and Classic Jewelbox alternatives. Theme and the hit-ripple preference are saved under prism-current.graphics.spectral.v1, separate from gameplay records. The existing standard-controller focus and left/right setting adjustments reach both new controls.

Classic selects the original rendering. Light graphics and zero effect strength disable the new shader layers and restore the original inner seeds. Quiet decorative motion freezes the new procedural clock and disables hit ripples; paused runs also freeze the new animation. Turning off Hit-reactive floor ripples leaves the ambient theme intact. These are controls for the new effects; older Jewelbox behavior is retained.

All new effects are disabled in immersive sessions, both AR and VR. They return after leaving XR. The established lightweight headset materials and transparent AR composition remain unchanged. This edition does not claim physical-headset performance, room-aware lighting or accessibility certification.

## Verification and visual evidence

The source/public spectral workflow compiles the actual game shaders, checks controller selection, saved preferences, Classic/Light/zero/quiet behavior, a real audio-timed hit and its floor reaction, untouched note positions, pause, bounded resources, cleanup and emulated transparent AR. Four 1440x1050 menu captures compare Classic with the new themes. Reduced software-renderer gameplay buffers are correctness tests, not consumer GPU frame-rate measurements. No test injects scores, changes clocks or fabricates impacts.

The local Node suite tests pool bounds, event validation/expiry, policies, preferences, material lifecycle and integration invariants alongside the existing chart/audio/save fixtures. Local browser HTTP navigation is restricted; production-renderer checks run through GitHub Actions. Actual workflow conclusions and screenshots, not the presence of this test description, establish the release result. A readable-motion and comfort review on real displays remains open in the production checklist.

Rollback should revert only this visual release on current master and redeploy, preserving unrelated game upgrades. Classic is also available as an immediate per-device visual fallback. No score migration is required.
