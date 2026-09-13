# Tidelight / flooded cloisters

Release 0.12.0. Published 2026-09-13. The maintained game remains `vesperfall/`; Tidelight is an in-place upgrade, not a new game.

Tidelight adds bounded, presentation-only water to selected existing cloister and chapel-like spaces. The water reuses existing collision floors and does not change navigation authority, Blink validity, saves, combat state, Chronicle progression or procedural-generation state. Existing v0.9+ saved-expedition/profile compatibility remains under the established validation envelope.

The visual target came from the pool references used during development: visible submerged tile and stone, translucent depth, moving caustic highlights, rippling specular response and reflections of surrounding architecture. The VHS/camcorder distortion in the references was intentionally not adopted because it would reduce aiming clarity.

Balanced is the default water profile and is the WebXR-oriented path. Cinematic is the desktop-focused higher-detail option. Quest limits visible water surfaces and ripple counts and avoids extra reflection render passes. AR disables fictional world water so passthrough is not painted with imaginary pools. Reduced-effects policy freezes ambient motion. Arrow impacts, successful Blink/Shard arrivals and player movement can create bounded ripple rings.

The design rule is selective flooding, not water everywhere. Water should make a district feel authored and memorable without obscuring archery silhouettes or turning every court into the same visual gimmick. Future water areas should preserve dry alternate routes where combat/readability benefits from them and must not silently alter collision or teleport rules.

## Controller and XR contract

All water-facing settings and any future water interactions must remain operable without a mouse. Xbox navigation must be able to enter, change and close every related menu or dialog. Quest 3 controller paths must preserve the established bow-hand/draw-hand roles, spatial pause/settings UI and explicit Exit VR path. AR and VR remain separate supported presentation modes; AR must preserve passthrough and must not render fictional flooded floors.

Water must never steal trigger/grip/button ownership from archery, Wardglass, reload, Blink, shard-step or spatial-menu controls without an explicit mapped interaction and corresponding controller documentation. Physical Xbox and Quest hardware acceptance is still open even when synthetic/browser controller tests pass.

## Audio direction

The next sound pass should treat water as part of the game's acoustic identity rather than as a silent shader. Priorities include positional arrow splashes, shallow-water footsteps, occasional localized drips, chapel/reliquary ambience, room-dependent reverb character and music transitions that react to entering or leaving flooded spaces. Long-session headphone fatigue and notification density still require human review.

## Future water-development checklist

- Preserve the existing collision floors, save keys, Chronicle progression and deterministic world state unless a later release deliberately introduces a new gameplay mechanic with migration tests.
- Keep submerged stone/tile legible through the surface; do not replace the environment with opaque blue planes.
- Keep ripples event-driven and pooled. Arrow, Blink/Shard and movement effects must remain bounded and must retire correctly on sector rebuilds and session transitions.
- Profile Quest 3 before increasing reflection quality, surface count, vertex density or ripple limits. Desktop Cinematic effects are not evidence of Quest performance.
- If deeper water or swimming is ever introduced, make it a separately designed gameplay feature with explicit comfort, locomotion, oxygen/surface rules, controller mappings, save behavior and AR exclusions rather than silently extending this presentation layer.
- Add more distinctive flooded destinations only when each has a route purpose, landmark value, encounter opportunity or exploration reward.
- Preserve complete Xbox UI navigation and Quest spatial UI navigation, including closing alerts/dialogs without reaching for a mouse.
- Continue to treat human art review, physical-device performance, comfort and audio acceptance as separate from automated shader/browser success.

## Publication discipline

The release is not considered finished merely because files exist on a branch. Every future Vesperfall upgrade should preserve saves, run relevant model/browser/controller/XR checks, commit the actual source, merge it into the maintained branch, verify GitHub Pages deployment and verify the public game path. If GitHub write access is temporarily unavailable, retry rather than leaving a completed upgrade unpublished.
