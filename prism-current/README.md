# Prism Current — rhythm in your room

A separate A-Frame game for SVGN Interactive. Two luminous blades cut timed,
directional notes to three original instrumental scores. `immersive-ar` is the
primary headset mode; the studio is removed and the renderer is transparent.
The browser/OS supplies passthrough. The app never requests camera frames.

## Play

Open `index.html` on an HTTPS host. Desktop keyboard practice uses **D F J K**
for the four lanes. Mouse mode: hold **left** for mint/L, **right** for coral/R,
and swipe in the arrow direction. Dot notes accept any deliberate direction.
Touch mode has an explicit L/R selector. **P or Escape** pauses audio and notes.

Quest preview: click **Enter passthrough AR**, check the clear play volume, and
use a controller trigger to select Start on the spatial menu. Both controllers
are needed to play. Swing freely; triggers do not need to be held for cuts.
Grip or B pauses. The menu has Resume, Next track, Recenter and Exit immersive.
The stage stays fixed after recentering; no forced locomotion or head steering.
A compact reach setting is available before a run.

This does NOT detect furniture, scan a room, provide physical occlusion or
replace the headset's boundary. Only play with clear arm reach, keep feet in a
comfortable position and stop if uncomfortable. Passthrough AR must be checked
on real Quest hardware; emulation is not a comfort/performance certification.
There is no hand tracking, shared multiplayer or copyrighted song library.

## Implemented first slice

- Original authored beat patterns, Flow and denser Pulse charts.
- Three locally synthesized scores, rendered in a Worker and played as complete
  stereo AudioBuffers; rhythm uses the audio clock, not accumulated render delta.
- Two-point swept saber collision against moving notes, direction/hand checks,
  timing/center quality, combo multipliers, no-fail completion, local bests.
- Separate keyboard timing-mode records; it does not pretend to grade VR cuts.
- Stereo XR rendering, stage placement from viewer pose, tracked grip blades,
  in-headset menu and HUD. Missing/invalid tracking, visibility loss, reference
  reset and large displacement pause play; no automatic unpause.
- No remote analytics, pose logs, camera capture, accounts, payment or story data.

## Inspiration, code and audio rights

Moon Rider (https://moonrider.xyz/ and https://github.com/supermedium/moonrider)
shows accessible browser rhythm play. We studied its README and modes as a
reference. This is not a fork: no Moon Rider models, song catalog or beatmaps
are included. No Beat Saber artwork, music, trademarks in branding, or charts
are copied. All visible game art, chart data and synthesis code here are original.
The original scores are First Light, Afterglow and Ion Drift; no Suno or other
external music service is required. A-Frame 1.8.0 is vendored with its MIT license.
The XR test emulator adapts the existing public repository test harness.

## Development and verification

Serve the repository with `python -m http.server 4173`. Run
`node --test prism-current/tests/core.test.cjs`. Browser acceptance uses
`PRISM_SUITE=desktop` or `PRISM_SUITE=xr` with `tests/browser.py`. Its emulated
XR inputs are clearly separated from ordinary desktop input and pure tests.
Tests never assign game scores, progress or audio clocks.

Normal GitHub CI is read-only. Each source revision has a file manifest; the
publication workflow compares served bytes and follows the actual homepage
link in a native browser. A successful model test, passing PR, served page and
physical device pass are distinct statuses. See ROADMAP.md for the open gates.

Primary technical references: https://aframe.io/docs/;
https://developer.mozilla.org/en-US/docs/Web/API/XRSession/environmentBlendMode;
https://developer.mozilla.org/en-US/docs/Web/API/XRFrame/getPose;
https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/start .


## v0.2 / Jewelbox graphics pass

The old rounded blocks are replaced by original 64-triangle cushion-cut jewels: a table, crown, girdle and pavilion, with a reflective platinum/gold setting. The note center, cut directions, hand colors and collision code are preserved. Saber grips are modeled with lathed ceramic barrels, reflective collars, a spiral metal inlay and gemstone pommels; the visual blade still spans the original -0.08 to -0.74 metre points.

Cinematic desktop uses Three.js MeshPhysicalMaterial transmission, high IOR, dispersion, clearcoat and iridescence. A generated linear-HDR studio environment is filtered once with PMREM and reused by crystals, metals and the obsidian runway. This is virtual studio lighting, not measured lighting or camera imagery from your room. The floor has an original procedural caustic-like lace shader, not ray-traced caustics or a planar reflection of the game. Highlights, bounded halo sprites, fading blade ribbons, cut-gem fragments and a slow studio-only aurora complete the treatment. No extra Three.js library, external shader CDN or paid asset is introduced.

**AR/VR deliberately do not use screen-space transmission.** Those sessions use a per-eye translucent Fresnel/facet shader, with reduced AR effect strength. It allows passthrough to remain visible; it cannot refract furniture or the real camera image. The opaque studio and showcase remain in the existing AR-hidden subtree. No postprocessing replaces the XR compositor or changes the original session mode.

Controls → Graphics selects Cinematic, Balanced or Light. Light removes note halos and saber ribbons. Quiet decorative motion disables showroom motion/twinkle without changing the song or notes. All graphics preferences have a separate `prism-current.graphics.v2` key; completed scores keep their existing namespace. Defaults favor Cinematic desktop and Balanced touch devices. Physical Quest frame rates, latency and comfort still require hardware.

Development reference: Three.js MeshPhysicalMaterial, PMREMGenerator and ShaderMaterial documentation; A-Frame 1.8.0 material and renderer components. All meshes, GLSL and synthetic radiance in this pass are original project assets, with the existing A-Frame dependency license retained.
