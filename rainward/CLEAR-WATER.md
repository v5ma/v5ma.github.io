# Rainward v0.13.1 / Clear Water

This continuation closes the first normal-start Natatorium browser-playthrough gap and implements the pending water-control prompt polish. It is a bounded interface and acceptance upgrade, not another chapter or a new physics system.

## Player-facing changes

The surface HUD now shows HOLD B DIVE for Survival, B DIVE for Classic, or Z DIVE without a controller. Submerged guidance shows A SURFACE or SPACE SURFACE. Air at or below 25 percent produces a textual recovery warning and a non-flashing double border. The progress meter has an accessible percentage label; the warning live region updates only when its text changes. Entry hints no longer give misleading controller-only commands to keyboard players.

## Preservation boundary

All seven expeditions, four pool volumes, patrol stats, weapons, puzzles, field tasks, sounds, art and resource limits are retained. No save migration is needed: the legacy checkpoint key, seven-slot chapter bank, backup key and checkpoint formats are unchanged. Deep water still stows weapons and blocks dry-only actions. The patch does not grant oxygen, change drowning damage, auto-surface the player or weaken enemies.

## Acceptance and retained failures

The new tests/natatorium-journey.py starts normally, with no installed checkpoint, all six authored enemies alive and only authored supplies. It uses virtual standard Xbox sticks/buttons with read-only route and screen-projection guidance. Actual movement, hit tests, enemy attacks, ammunition, reload, oxygen, puzzle controls, task interaction and extraction remain authoritative. The script targets both Survival and Classic. Video, snapshots, source manifest and failures are uploaded by the release workflow. An initial Survival extraction passed 11 checks on 9c651ffd47b2cfa1ade59945a7bf56d40c87a5ad in run 34789910532; the paired Classic attempt died to the pump sentinel. That failed route is retained, not relabeled as success. The next route adds real finite-ammo sentinel combat and reload rather than nerfing the encounter.

The existing tests/aquatic.py remains explicitly separate: its authored dry-shelter fixture has defeated enemies to isolate shaders, control changes, keyboard fallback, reconnect, low-air layout, natural oxygen exhaustion, recovery and death/retry. It is not evidence for a living-enemy mission. All six optional/required station interaction points retain model tests in water-hardening.test.mjs; a complete native optional-station tour and every pool-edge approach are still additional coverage, not claimed by the required-objective journey.

Local model/source checks passed. Local browser acceptance was blocked by the environment with net::ERR_BLOCKED_BY_ADMINISTRATOR; native validation therefore runs on GitHub Actions, not through a browser-policy workaround. The exact final candidate, full regression results, merge and public-byte receipt must be recorded in the release PR and evidence directory before declaring publication.

These are automated browser-standard input checks, not physical wired/Bluetooth Xbox certification, frame-rate certification, artistic approval or real-device listening review. Full regression and published-file hash matching remain release gates.

## Resume next

Keep the new mission and recovery suites in the matrix. The next feature work is H-02: authored swim/land blends and hand/foot contact review for the existing fitted humans. H-03 water/combat audio review and H-04 physical-controller/hardware acceptance remain open. RW-032 is only Implemented because its full criterion covers every chapter and review, not merely one automated Natatorium route.
