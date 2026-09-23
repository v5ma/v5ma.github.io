# Prism Current / Color Match 0.13.0 + Clear Shoals

The normal index.html is the full AR-first River Prism game. It retains Easy, Normal, Hard and Ultra Hard, readable health, healing supplies, slower fruit-throwing enemies and finale-only bosses. AR Tide supplies small tree islands, clouds and grass while leaving the real room visible. Clear Shoals now adds pebble-bed detail and refracted-light patterns to the existing water. No replacement demo, private hub, travel portal or sibling-game work is included.

## Enter and choose your pace

Use the chapter's AR choice when supported. Screen and VR remain alternatives. Easy is the first-play default and a valid saved difficulty is restored. Select the Difficulty control before starting; a paused encounter keeps the difficulty it started with. F2 exposes the semantic text-control alternative.

Easy has fewer approaching objects, longer enemy passes, slower throws, generous hit sizes and more healing. Normal increases activity but preserves forgiving fruit cuts. Hard and Ultra Hard use denser waves, faster throws, fewer supplies and directed cuts. Either saber can cut in every mode; Easy and Normal accept any direction. Cruise is a separate no-health-loss option with separate records, not a replacement for difficulty selection.

Ducks, boats and aircraft repeatedly throw fruit and purple blocks. Blocks can be cut, shot or shielded. No invulnerable red missile emitter remains. Easy and Normal omit spiked explosive bombs; on harder profiles, shoot or shield those bombs rather than slash them. The original soundtrack is not accelerated to change difficulty.

## Health, colors and finales

The stage-anchored HEALTH gauge shows the actual number out of 100 with a thick bar. Controller/floor status remains available. Damage, low health and healing are explicitly labeled; the gauge stows for the paused menu rather than covering it.

Mint plus-sign cases heal when cut, shot or touched, once per case and capped at 100. Easy provides five cases at up to 30 health each; Normal three at 25; Hard two at 20; Ultra Hard one at 15. Missing a case does not cause damage.

Color Match is implemented. During tracked combat, right A changes the right saber and left X changes the left. Keys 1/2 and L3/R3 are the screen and standard-controller equivalents. A valid fruit cut with either color earns the ordinary base reward; matching the fruit's color/symbol earns an additive bonus. Readable symbols accompany colors, and badges remain visible on the larger Easy fruit. Lasers, grip shields and existing attacks are preserved.

Neither boss is present at the start. Admiral Quack or the mothership arrives at beat 152, about 69 seconds into the existing 89-second track, followed by its entrance and exposed-core phase. Both actual boss defeat and song completion remain required.

## Spatial interface and preservation

Keep the world-anchored adjustable Rotunda, visible menu rays/contact cursor, thumbstick/A-X selection and direct B/Y start/pause/resume. Hand pinches support menus; combat still requires tracked controllers. Sound and scenery changes preserve the paused encounter. Genuine tracking/visibility interruptions pause; ordinary leaning and sidestepping do not trigger the former arbitrary position rectangle.

Exit ends the XR session and leaves the encounter paused in page memory. Re-enter its matching AR/VR mode and deliberately resume. Closing or reloading the page is not a persistent unfinished-battle save.

The full solid banks/forest remain hidden in AR. Duck Armada instead uses two compact planted islands, cloud groups and grass patches, with a saved Minimal scenery choice. Mothership retains its separate setting. AR Field Guide uses three FlexSurface cards before battle and on paused Controls; they hide during combat and never intercept input. FlexSurface is no longer merely library-only.

New Color Match records use prism-current.river.chromatic.records.v1, separated by chapter, input mode, difficulty and Arcade/Cruise. Previous pacing records and all older River/Classic/lesson records stay untouched. Classic rhythm, its five tracks, lessons and Practice Lab remain at rhythm.html; Floodgate Recovery remains at water-mission/index.html.

## Clear Shoals and reuse

The existing Water 0.1.0 is extended by Water Detail 0.1.0 and Water Optics 0.2.0. Two generated mipmapped textures add a pebble bed, micro-wave slopes, highlight filtering and precomputed refracted-light caustics. No extra scene-rendering pass, FFT runtime, external image asset or passthrough-image sample is added. Geometric waves, CPU height query, wakes, splashes and gameplay are unchanged.

Saved opacity and quiet mode still control that same surface. Opacity is per-surface strength: distant projected wave overlaps can compound, a pre-existing behavior measured in CLEAR-SHOALS-ALPHA-RESULT.md. Zero opacity removes water and the existing near-viewer fade remains. Do not promise a global composited-alpha cap.

Start at modules/environment/CLEAR-SHOALS.md for implementation, limitations, API, loading and disposal. CLEARWATER-NOTICE.txt retains the MIT notice for the adapted Fresnel helper. Clearwater's whole renderer and embedded imagery were not imported. Currentworks fire, trees and other reusable modules remain independent and caller-owned.

## Evidence and continuation

CLEAR-SHOALS-RESULT.md records exact source/public checks, screenshots and failures. The complete focused source optical/AR journey passed 26 checks; its first public counterpart matched all 25 runtime files and passed 18 checks before a frame-stall pause. This is not blanket public or physical-device approval. Later unchanged retries are recorded separately. All 431 local model tests and 19 new actual-Three optics resource checks pass.

FUTURE-DIRECTION.md is the current continuation point. Older playability/module receipts retain historical evidence, not declarations about every later build. Physical Quest appearance, comfort and sustained frame rate remain open. Richer bosses, gameplay blast-radius feedback, new chapters, new music and HTML-backed settings are separate work; color switching and matching bonuses are already implemented. Write directly to fresh master, preserve concurrent changes and never clear user progress.
