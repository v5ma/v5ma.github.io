# Currentworks multi-pass plan

The user authorized five or more iterative passes and asked for periodic durable checkpoints. This is a continuation plan, not scheduled background work. Save usable code directly to fresh master without a new PR/branch. Keep API, tests and scope near each implementation.

## First pass: reusable water and actual Prism integration

Water 0.1.0 supplies geometry, normal detail, authored depth color, Fresnel sky approximation, crest/shore/wake foam, splash rings, pausable clock, query, quality/opacity/quiet controls and ownership cleanup. The thin RiverArt integration reads actual boat positions and existing destruction events. It does not change actors, collisions, scoring, audio, controls or the Rotunda.

The recovery checkpoint preserved water.js and water.mjs before any entry-point change. Subsequent checkpoints add documentation, tests and the adapter. Complete native and public verification, inspect actual screenshots and get owner Quest feedback before claiming device quality. Preserve the earlier shader-only evidence as separate evidence.

## Second pass: separate fire module

Implement Fire.create(THREE, options) with independently owned fixed pools. Support bounded burst, jet and surface-impact emitters, a hot core, turbulent three-dimensional flame, smoke fade and embers. Feed it only actual host events. Keep explosion decoration distinct from gameplay danger radius and never replace the saber lasers with an unrequested flamethrower weapon.

Use explicit update, reset and dispose; quality/XR caps; pausable time; duplicate-event protection and reduced motion. Do not cover panels, pointers, health bars or enemy silhouettes. Test per-eye origins, inside/outside volume cameras, transformed parents, interrupted loading and cleanup. Scene-copy heat haze requires separate stereo/performance evidence.

## Third pass: trees and foliage

Create seeded trunk/branch/foliage geometry with a documented coordinate contract, stable identifiers, bounded LOD, host-driven wind and idempotent disposal. Research EZ-Tree but verify license and compatibility before any dependency adoption. Prefer independent presets that can be reused without the entire game.

Place a small, deliberate riverbank set in Prism only. Keep targets and the river approach readable. Disable intrusive vegetation in AR and avoid shared-game rewrites. Do not build a new editor or side demo instead of improving the existing game.

## Fourth pass: coherence and interactions

Refine water, flame, smoke, tree colors and lighting together based on owner screenshots/playtest. Improve shoreline transitions, wakes and combustion shapes without inventing physics. Consider mesh patches, explicit scene reflections and weather only after measuring the present profile. Preserve transparent AR and stable UI.

## Fifth pass: measured validation and polish

Repeat both battles and the complete screen/AR/VR Rotunda journey, sound, placement, pause, exit/re-entry, input recovery and saved opacity. Check old saves, bounded allocations and disposal. Measure ordinary-resolution frame-time percentiles on named devices, not only low-resolution emulation. Gather owner judgments of readability and whether effects improve the game.

Additional passes may be needed for actual defects, weak visuals or physical-device results. Do not predeclare all five passes sufficient. FFT ocean simulation, a WebGPU backend, full hand-only combat and new soundtracks are not secretly included.
