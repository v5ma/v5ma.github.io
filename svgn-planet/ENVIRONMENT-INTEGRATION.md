# Currentworks / Neighborhood Missions 0.18.0

Owner request: use prism-current/modules/environment in Neighborhood Missions alongside the saved Highline direction. This checkpoint integrates selected real library modules into the existing main game, not a separate demo. Select Play Highline on the first welcome screen or in the city pause menu. The original city and previous saves remain available.

## Exact reuse and renderer boundary

Source repository v5ma/v5ma.github.io, directory prism-current/modules/environment, inspected commit c31dd6c56a101aec7c8a890768ae1f845494b294 and directory tree 86082336de4dc56c308267a914900a11e1e4f586. The five modules are copied byte-for-byte into environment/currentworks with their original headers; provenance.json records every blob identity. There is no mutable runtime import into another game's current master and no Prism source edit. This is the owner's original Currentworks library, not an imported third-party asset collection.

Integrated Water 0.1.0 and Water Optics 0.1.0 replace the old flat Lantern canal shader. Six Trees 0.1.3 instances replace the primitive trees at the same root positions. Three small Cloudlets 0.1.0 groups occupy bounded areas beside the skyline. Toon 0.1.0 supplies three selective equipment/paper materials in the new archive room; it does not replace character skin or the entire city's material style. Fire and Islands are not imported or claimed as implemented by this pass.

The library was originally tested against Three r184; Neighborhood uses r177. The engine stays at r177. Actual r177 object, shader-hook composition, quiet/pause, common-eye LOD and disposal tests run in this integration. GPU compilation and all eight rendered modes must report their own results. A version comparison is not a compatibility certificate.

The host retains its one renderer, current scene, simulation time, input, camera, scores and storage. First district entry prepares the library before releasing the player, with an explicit cancellable loading dialog. Cancellation does not change districts or grant mission progress. Prepare uses the existing host and disposable preparation resources, not a continuing reflected-scene or postprocessing pass. Returned shader hooks are composed with the existing portal material hooks.

Water consumes only actual observed local skiff positions. World recentering, diorama rotation and head motion cannot create a fictitious wake. The original canal water-level operation, skiff movement, collision and save rules remain authoritative. Water uses analytic sky reflection and an authored bed, not a reflection of actual buildings or the real room. Cloudlets are opaque mesh formations, not a volumetric weather simulation. Trees are cosmetic replacements, not new blocking trunks.

## Controls and AR presentation

The existing Lantern Ward pause menu now contains Environment detail, Still water and foliage, and Trees and clouds controls. Xbox/keyboard and the existing native XR menu consume these ordinary controls; no permanent gameplay panel or head-locked graphics menu is added. Preferences use the separate svgn.neighborhood-environment.v1 key. Malformed or unknown saved preferences are retained rather than cleared. The existing global reduced-motion and low-power settings also apply.

Water, wind and cloud motion follow the pausable host simulation clock. XR uses the Light visual budget and one observer for both eyes. AR retains bounded transparent canal water and visible discrete trees/clouds instead of an opaque sky enclosure. All eight first/third-person full-world/diorama AR/VR modes, independent box dimensions, floor map and interaction feedback remain. Physical hardware comfort and performance still need owner testing.

## The Unsent Call

This pass also realizes the next bounded Highline plan. The Print Exchange's 10.8 m level now has a connected reading-room annex, real floor/roof/wall geometry, an open doorway, shelves, a reading desk and a crossfeed control. The doorway is cut only at this floor; other floors retain their collision walls. Existing delivery and Highline paths are unchanged.

After completing Highline, select Archive: The Unsent Call in the mission list. Meet Ada in the print shop, isolate the damaged crossfeed in the upper reading room, read the recovered service log and return to Sal in the old loading loft. The control turns green according to saved stage. The original call identifies the South Cable Exchange operator; that location is a future lead, not a new district already built.

The four-step sequel grants 120 campaign credits exactly once. Highline's original six stages and 240 credits remain unchanged; older campaign, Watch, chapter and resident credits are not manufactured or reset. The existing 32 m altitude validator and high-position save recovery remain in force. The sequel is gated behind Highline, not behind the five older cases.

## Verification and remaining work

The local complete suite passes 462 tests, zero failures or skips. It includes all 102 frozen legacy hashes, the original five-case campaign, both existing Highline journeys, a fresh-input Highline-plus-archive journey and nine Currentworks integration contracts. The new all-input sequel journey walks both towers and the archive, completes ten physical tasks and earns only 360 combined new-case credits. No test assigns actor coordinates or quest progress in that journey.

The first local all-suite pass found an inherited source-contract assertion about the two-argument district renderer call. The caller was restored and preferences applied after construction; the assertion was not weakened. Local Chromium cannot acquire WebGL2. Local object/shader-source checks are not GPU, screenshot or physical acceptance.

The existing read-only source and public workflows run environment-browser.py for real renderer preparation, actual settings, pause and native-ray resume in all eight synthetic XR modes, then highline-browser.py for the complete main-entry Highline and archive journey. The older source/console/public matrices remain intact. Read tests/environment-evidence/public-receipt.json and status.json for observed outcomes; never infer a completed pass from a queued job.

Baseline review found the prior public Highline journey succeeded in run 35782836734, job 106934175516. That run was not entirely green: legacy grounded and recovery-portal suites failed and some jobs were cancelled. Those independent failures are not retroactively closed by this graphics integration.

Next: review the actual water/foliage/cloud shader images and all-input sequel traces, correct any rendering or route failure without falsifying test state, and obtain physical Quest/Xbox/hand feedback. Then deepen the archive's systemic choices and plan a real South Cable Exchange chapter. Neither a full-city visual replacement, voiced cinematic story, Fire integration nor physical AAA-quality approval is claimed.
