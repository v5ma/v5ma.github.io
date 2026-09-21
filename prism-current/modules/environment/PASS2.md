# Currentworks Pass 2 / Fire integration checkpoint

The independent Fire 0.1.0 module was saved directly to master at 35fd503795bd1bd552cb1b131487478f1a87488f before the main-game adapter. This checkpoint loads it in Prism's normal main entry and gives existing destroyed catapults, boats, aircraft, bombs and bosses spatial flame/smoke bursts, embers and bounded warm light. Fruit retains its original slice feedback; no flamethrower weapon, damage radius, missile rule, scoring rule or color-switching action is added.

The adapter adds the Fire group under the existing recentered art stage. It reads existing destruction events and preserves the event cursor, uses the same pausable host time and quality/quiet/XR settings, and resets/disposes with the existing art owner. Water source and behavior, combat core, audio, app state, XR controls, Rotunda and old saves remain unchanged. The page uses A-Frame's actual sortTransparentObjects setting so material render-order requirements are honored; no extra renderer or postprocessor is added.

The bundled Three.js compileAsync traverses all meshes, including invisible pooled effect meshes. Prism already invokes that full-scene compiler before starting the soundtrack. The new native suite checks that the fire program exists before the first destruction. No new async request is inserted into playback and no extra change to app.js is necessary. Other hosts can use the module's explicit prepare method as described in FIRE.md.

The module supports reusable burst, jet and oriented impact APIs, documented in FIRE.md. Prism uses bursts only; jet and impact are separately rendered test fixtures, not an unrequested new game weapon. Reduced-motion mode suppresses moving embers and lights. XR uses lower volume and particle caps. Opacity/depth/compositing limits and the absence of scene-copy heat haze, bloom, physical flames and blast damage are explicit in FIRE.md.

## Input recovery completed before integration

Direct commit 2cff39fd14ffc54acf0c431f534401aa70d128a8 made the XR test wait for a settled panel and observe neutral/select/release input and the actual tab result. Both source and public jobs in run 35644679776 passed all suites. Source artifact 10659214136, SHA-256 11bb84f1afeb37604822e2210acfb06d2316bf4e7dd16747d5040deb1019a4c2, was downloaded and inspected: 269 models, 37 water object checks, 13 water checks, 19 interruption checks and 73 Rotunda checks passed. Both Arcade chapters completed through ordinary inputs. No production UI was changed to obtain the pass, and prior failures remain in their original evidence documents.

## New validation scope

The integrated working source passed 284 Node tests, 37 existing water-object checks and 23 fire-object/adapter checks using the actual bundled Three.js. It was checked against the downloaded verified source, not an obsolete standalone root package. Fire and water modules are independently owned; object tests exercise per-eye transforms, fixed pools, source-state nonmutation, actual core destruction events, deduplication and disposal.

The existing read-only Rotunda workflow now also runs the fire object checks, a real-input served-game fire journey, and explicitly labeled standalone burst/smoke/jet/impact/quiet WebGL fixtures. It still independently runs water, interruption and full screen/Xbox/emulated-AR/VR Rotunda checks against source and published bytes. These new native results remain pending at this integration checkpoint. Physical Quest/Xbox/touch and sustained normal-resolution performance are not claimed.

Next: inspect the exact native source/public results and actual images, repair any real failure, then save a final receipt. Trees are the next independent module pass. Do not replace the game with a shader demo, create another PR or staging branch, modify sibling games, expose private hub material or clear saved progress.
