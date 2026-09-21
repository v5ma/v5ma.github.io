# Dino Atlas: Field Rotunda recovery .3

Build ranger-spatial-console-20260920.3. This continues the full Classic Reserve and Tidegate spatial interface. PR206 and the .2 refinement were already merged; do not repeat those merges. The .3 runtime repairs closed workspace visibility and advances the module cache identities. Source, browser and public acceptance are separate stages.

## What is retained and improved

Normal XR play has a compact tracked wrist/floor slate instead of the permanent full-size face board. B summons the floor-relative workspace. Direct tabs provide Resume, Map, Missions, Field, Workspace and Leave XR. Height, distance, size and rotation are adjustable independently of the character-centered world portal. Looking around does not move the raised workspace. Hide Field removes its input surface. The regular-game First-person VR, VR diorama and AR diorama entry remains visible.

The .2 improvements remain: blank information surfaces consume a UI press without firing a tool, hidden ancestors reject picking, the nearest visible personal surface owns overlap, and only the exact pointed control highlights even when labels repeat. Active/Legacy flight hints remain distinct. The .3 fix scopes a not-open CSS rule to the workspace dialog so a generic settings grid cannot leave it visibly overlaid on normal screen play. Open settings keep their existing accessible layout.

## Revealing failures

Run35555017066 passed254 model/physics tests but its two spatial browser journeys failed after workspace adjustments and Resume. The synthetic pointing hand was below the rendered front of the wrist slate. A production-mesh inspection reproduced the correct backside miss. The corrected fixture moves only the synthetic pointing hand above/in front of the slate; it does not change single-sided materials, picking, tool range or gameplay state. It tests the information surface and both slate buttons and records facing geometry on failure.

Those same failure screenshots revealed the real closed-dialog display bug. New browser assertions check no closed dialog layout at load, after Resume and on XR exit. The existing input-capture, deliberate fresh firing, hand movement, mission-reward isolation and preference reload checks remain. Local .3 verification passes257 tests, zero failures or skips; syntax checks pass. Hosted and public results are recorded separately, not implied by this document.

## Preservation and scope

No prior save key, stable ID, reward, mission, vehicle physics, tool ammunition, controller profile or vendor changes. The new spatial preference key from .1 is unchanged. Full Classic/Tidegate content and the accepted portal dimensions, placement, depth and cutaway remain. The screen-mode DOM interface is still the accessible fallback; this is not a complete canvas-native rewrite of screen play. No private WebXR SaaS code, review file, combined transcript, credentials, assets or destination URLs are published. No engine migration or sphere/walking/cross-site portals are added to Dino.

## Remaining acceptance

Synthetic Xbox/Quest values and mocked XR sessions/poses exercise actual game movement, actions and rendering. They are not physical Quest3, hand-pose, stereo compositor, passthrough, comfortable reach, performance or human readability approval. The next pass should follow actual headset reach/readability findings and the existing full on-foot/vehicle/mission loop, not add more menu layers or substitute another demonstration.
