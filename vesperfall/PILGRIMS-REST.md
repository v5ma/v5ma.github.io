# Vesperfall 0.9.0: Pilgrim's Rest

This upgrades the maintained Vesperfall game. Hollow Dominions, Resonant Hunt, existing profiles, keyboard/touch/Xbox gameplay and Quest VR/AR modes remain in place.

## Saved expeditions

A scored expedition creates a local checkpoint when it begins, then saves approximately every 15 seconds of active play, on pause, on visibility loss and on page departure when the browser allows that callback. Save checkpoint now and Save and return to title are available in the pause menu. Continue saved expedition restores it after a reload and waits paused for an explicit Resume. Abrupt process termination can lose progress since the last successful save.

The checkpoint preserves the seed and sector, player floor position, health, ammunition, weapon and crossbow state, cooldowns, combat counters, discovered areas, optional rewards, enemy positions/health/attack state, taken supplies, flying projectiles and delayed hazards. The model regenerates the original bounded world instead of loading arbitrary saved geometry. Current saves require the Hollow Dominions generator version; future incompatible versions must add migration rather than silently resetting progress.

Physical hand/trigger latches, guard deployment and partial string gestures are canceled. No stale held input should fire on continuation. Quest resumes keep physical head tracking rather than forcing a stored head orientation. A restored run is paused while the player gets ready. The shield must be deliberately raised again.

The versioned `vesperfall-expedition-v1` envelope stores the cleaned permanent profile and run banking receipts together with the checkpoint. The legacy `vesperfall-profile-v1` key remains a compatibility mirror; existing renown, purchases and Chronicle unlocks migrate without reset. Checksums detect damaged data, not deliberate local tampering or competitive cheating.

Practice and enemy trials do not overwrite a scored expedition or bank their counters. Stationary AR Sanctuary is also unscored and does not replace the saved expedition. Starting over from a suspended slot and discarding a save use a game-owned confirmation dialog, not a browser alert. Explicit discard keeps the permanent profile.

Saved state is local to this browser and origin. It is not a cloud save, account backup or guarantee against cleared site data, browser eviction or device loss. Storage denial and quota errors are displayed, leaving play available. The last successful envelope is retained if writing fails. When another tab changes the envelope, a stale tab pauses and offers Reload rather than knowingly overwriting it. This is optimistic local coordination, not a server lock or anti-cheat system.

## Controller operation

Xbox uses the existing pause-menu focus controls to reach Continue, Save now, Save and return to title, Discard and recovery actions. D-pad up/down navigates, A activates, and B dismisses the in-game confirmation without confirming it.

Quest exposes Continue on the spatial main menu when a suspended slot exists. Expedition / practice / seed / trials / saves contains the Saved expedition screen on its second page. That screen offers Continue, Save now, Save and return to title and Discard. Confirmation offers a separate cancel action. No mouse is needed for those game-owned actions. Headset/browser permission prompts remain platform-owned.

## Production tools

`roadmap.html` now displays a canonical 76-task plan, seven quality-gated milestones, priorities, dependencies, role ownership and evidence. `AAA-PRODUCTION.xlsx` is the six-sheet workbook. `AAA-ROADMAP.md` explains the sequence and the distinction between implementation, publication, hardware QA and human acceptance. The plan is a path toward a polished premium game, not a claim that AAA quality has already been reached.

## Verification and limits

`tests/pilgrim.test.cjs` covers bounded serialization, exact reconstruction, elevated saves, finite resources, projectiles, windups, hazards, rewards and storage failure cases. `tests/pilgrim-browser.py` exercises actual browser reload and continuation plus Xbox, Quest and AR input fixtures, corruption and competing tabs. `tests/production.test.cjs` checks task IDs, dependency structure and release consistency; `tests/production-browser.py` checks the board, exports and its separation from gameplay storage.

Physical Quest sleep/eviction behavior, controller ergonomics, long-session performance and resumed-floor comfort still require device playtesting. The production workbook keeps those gates open rather than labeling software emulation as hardware certification.
