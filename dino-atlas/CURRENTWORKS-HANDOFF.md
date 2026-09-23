# Currentworks / live-game continuation

Currentworks is published in the full regular Dino Atlas game. Runtime commit: 4df8736d4db11cfe796895d07d60794f31a81745. Build: currentworks-reserve-20260922.1. Validation commit: 4a96b327eaebb0464d79888d6dd2b680abb9624e. Work directly on fresh master, preserve siblings, and read AGENTS.md, FUTURE-DIRECTION.md, CURRENTWORKS.md and verification/currentworks/ before editing.

## Current public evidence

The previously queued Field Rotunda run 35807536633 completed its source checks successfully. Its first public attempt matched all 83 runtime files to the source manifest in each of the three public slices. Both public First Light journeys passed: screen 16 checks and explicit XR mock 18 checks, with no captured errors. The public Currentworks graphics and regular-game UI suite passed all 26 checks, including six real r177 rendered fixtures, ordinary story focus, on-foot hint suppression, pause, Classic fallback, Balanced restoration and restoration of older dispatch guidance after suspending First Light.

These are new public checks of the Currentworks runtime, not reused acceptance from the older First Light release. The screen, XR and graphics archives were independently downloaded, their GitHub-reported SHA256 digests matched, and all three public manifests matched the independently checked source manifest. The restored source suite was rerun locally: 305 passed, zero failures or skips. The checker passed 66 syntax files and scanned 77 owned runtime/script files. Details and exact archive identities are in verification/currentworks/public-first-attempt-20260922.json.

The remaining first-attempt failure occurred after the successful Currentworks suite, in the retained Classic floor-feedback test. It passed nine checks and then timed out waiting for a two-second reload notification after the synthetic button helper returned. The actual failure snapshot contains the real message, "This tool is already full.", in history, with its visibility already expired and no captured JavaScript errors. A missed short-lived test observation is plausible, but a root cause or gameplay fix is not claimed. Do not lengthen the user's two-second notifications or assign gameplay state to satisfy this test.

The existing failed public graphics/UI job 107021109732 was retried directly with rerun_workflow_job. The retry job is 107038601663 in the same run, attempt 2. At this checkpoint it has passed the fresh public-byte match and is executing the retained public UI suites. Runtime and tests are unchanged. Inspect its actual outcome, logs and artifacts before counting the remaining Classic/Tidegate floor, spatial and Classic portal assertions or claiming that every public slice passed. Keep the initial failure even if the unchanged retry succeeds.

## Deployment and playtest

The existing current-master Pages publisher run 35807398409 completed successfully at 2026-09-23T01:48:00Z. The deploy log records actual published source 5c34a62624c103a179ed7c94dddb2fd5fbb5df3a, artifact 10728631598, rather than just the publisher's triggering commit 1439d675. That source contains the Dino runtime and corrected test driver. The later successful 83-file public manifests independently establish that the upgrade is being served. The publisher repair was concurrent work elsewhere, not a shared-workflow or permissions change made by this Dino pass.

Open https://v5ma.github.io/dino-atlas/ and refresh or reopen the tab without clearing site data. Choose Menu / Coastal Light / Balanced to see the new visuals if a saved Classic preference is selected. Regular Start/free exploration remain available. Choose Play story: The Living Reserve or Continue story for First Light; the pause menu also contains its story entry. Inspect the woodland pond northwest of the entrance, wetland lagoons and central trail trees.

## Shipped scope and preservation

Water 0.1.0 and Trees 0.1.3 are unchanged pins from prism-current/modules/environment/ at c31dd6c. Dino retains its existing Three r177 renderer, one animation loop, physics, controls, save formats and character-centered full-depth portal. The adapter upgrades three original bounded water areas and twelve selected original tree positions. It masks dry corners and overlapping water, retains the original canal, ocean and pool, and shares original trunk collision. Classic restores the original geometry. Reduced Motion and Low/XR detail caps remain.

Independent baseline comparison found 77 prior runtime files and 83 current files. Only coastal-light.js and field-navigation.js changed among the prior files; the adapter, story-focus helper and four pinned Water/Trees files were added. All 75 other prior runtime files match byte-for-byte. Do not overwrite the full game with an older archive, rebuild completed missions or remap controls as part of publication recovery.

First Light focus suppresses unrelated Ranch/Coast dispatch copy while that story owns the selected task and suppresses mounted-rig advertising only on foot. The public tests verify that map, HERE, equipment, ammunition and action buttons remain, and suspension restores the old dispatch. Essential conversations remain deliberate and replayable. Existing activities, secured cargo, gate restoration, Express travel and saved user preferences are preserved.

## Earlier failures and verification limits

The initial runtime run 35804553224 passed all 258 retained source-browser assertions but its new graphics/UI driver failed after checking a hint before the HUD applied body mode. The test-only correction in 4a96b327 waits for the actual painted mode without weakening the visibility assertion. No runtime changed. Exact original artifacts and the failure are retained in verification/currentworks/first-native-attempt-20260922.json. Earlier public-byte mismatches during cancelled or superseded Pages builds remain historical deployment failures, not shader failures.

Public pond and lagoon captures show the new water. The tree fixture remains partly obscured by foreground canopy; do not claim complete vegetation readability or artistic approval from shader success. The ordinary First Light screenshot shows the selected task and retained map/equipment without the unrelated dispatch text.

Local full-game browser navigation was administratively blocked in the earlier implementation session. A fresh web-reader request in this recovery could not access the game. No policy was bypassed and no local public browser session is claimed; the completed hosted public journeys are the evidence. Physical Quest/Xbox, real hands, stereo/passthrough, comfort, sustained device performance and first-time-player comprehension remain unverified. A separate GitHub Release archive is not the website deployment; do not change permissions or shared Pages to force archival success.

## Next bounded task

Finish recording the unchanged public graphics/UI retry and save its actual result beside the game. Then prioritize human First Light onboarding and useful sightlines before more GPU cost. Fire, Grass, other newer library modules, The Missing Survey/Tidegate chapter, the storm investigation and evacuation ending are not delivered by this pass. Chapter two must use a separate forward-safe record or explicit migration, recognize existing Tidegate infrastructure and preserve occupied cargo carriers. Keep FUTURE-DIRECTION.md and the implementation handoffs current after meaningful checkpoints; never leave recovery-critical information only in chat.
