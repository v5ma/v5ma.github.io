# Rainward / Tactical Throws

Build: rainward-tactical-throws-20260923, version 0.16.4. Planning was checkpointed in ff0ef75d79a3157b74b5a2558ebe3366d6c5b1e4 before runtime changes. The baseline runtime is Currentworks source 0dbfb7a with its verified delivery notes in 6813cc9. This is a focused tool-use improvement, not another chapter replacement or a complete combat redesign.

## Playable changes

Select a bottle or smoke with the existing Survival equipment controls. Hold LT (or right mouse) to see its world-space dashed arc and landing ring, then use RT or F to throw. The guide stows when aim is released, a menu opens, another weapon is selected, the player swims or the expedition ends. Invalid/unavailable throws use a crossed marker as well as a different color. Classic retains its existing direct bottle and at-feet smoke controls; it does not misleadingly show a selected-tool guide when RT would fire its gun.

Smoke no longer fails solely because the original eight-metre endpoint is inside a wall. The planner tries a legal nearer patch. Bottles retain their eleven-metre maximum. Low cover can be cleared where a checked arc fits; indoor throws lower their arc to avoid ceilings. Full walls, closed shutters, map edges and terrain are checked against authored collision, not decorative cutaway art. The launch, displayed path and visible flight share the same calculation. The actual smoke cloud and bottle distraction still use the existing duration, radius, noise and finite inventory rules.

This is a conservative sampled/swept lob planner with bounded attempts, not a rigid-body bounce system or user-controlled throwing strength. Aim direction remains the existing yaw input. It does not add manual pitch/strength control, bouncing physics, enemy hits during flight or dynamic rigid-body collision. Failed paths do not consume a tool. Preview calculations do not write the player, saves, tasks or resources. Trajectories are transient and are not added to checkpoint schemas.

## Preservation and verification

Keep all seven expeditions, Currentworks water/trees, character geometry, fast movement, recipes, quantities, existing input/remap contracts and old checkpoints. This pass changes combat.mjs and survival.mjs only at the throwable action boundaries, adds throw-path.mjs and throw-guide.mjs, and integrates flight/guide art in scene.mjs. Guns, melee, enemy AI, legacy quick smoke, collision geometry and the XR adapter are unchanged. Scene buffers are reused, with no added render target or compulsory menu.

All 496 local model/source tests pass, including fourteen focused planner/action/Three-object tests. The initial endpoint floating-point residual was fixed, and the intentional scene change is explicitly repinned in evidence/tactical-throws-20260923/render-revision.json while historical receipts remain unchanged. Local WebGL2 is unavailable, so no local browser render is credited. The existing verification workflow retains its earlier tests and adds an earned-supply screen/AR throwing journey. Its completed outcome and public-byte verification must be recorded separately on the exact commit.

The old failed Floodgate replay is not declared fixed. Its captured player was already dead before quick smoke deployed, with smoke remaining and no medkits. That Classic quick-smoke path is unchanged. Keep its evidence, investigate resource/timing reliability separately and never grant supplies, remove enemies or change difficulty just to pass a test.

## Continue safely

Read FUTURE-DIRECTION.md, DEVELOPMENT-HANDOFF.md, this file and current master before editing. Record actual outcomes in the linked evidence directory and update the running future-direction record after delivery. The next bounded work is controller/Quest feedback on the aim guide and indoor paths, then the separately failed Floodgate recovery route and clipped world guidance. Physical Quest/Xbox, complete all-preset campaigns, performance, comfort and human quality remain open. Direct non-forced master updates only; preserve sibling work and failed evidence.
