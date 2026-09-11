# Open Doors continuation checkpoint - September 11, 2026

This file records the v0.7.0 slice. The broader original UPGRADE-CHECKLIST.md remains intact. Read release.json and PR95 to resolve publication status rather than assuming historical v0.5/v0.6 candidate wording is current.

## Implemented and model-checked

All 49 original house footprints have real entrance collision openings, household desks, upper workshops, attics and cellars. Paired stair/hatch actions keep the player in the correct building and preserve parked vehicles. Furnishings and written craft clues have eight variations. Each household has separately saved accept/work/finish/report progress, a one-time reward and cooldown-bound rest.

Two continuous walking networks connect rooftop decks and undercity passages. Map tracking chooses an intermediate door or stair; it does not move the player. The northern garden gate and locked inn cellar cannot be bypassed through a new route.

Six authored investigations validate staged physical visits, required household/rival outcomes and one-time return rewards. Eighteen clothed humanoid rivals patrol, chase, telegraph, recover, stagger and yield. Staff, brace and dodge have real combat effects. Defeats persist without currency farming.

The doors save is bounded and additive. Existing original missions, side quests, street activities, tuning, money, attributes, deliveries and vehicle data remain. Reload retains earned progress and resumes safely rather than inside an isolated runtime floor.

Standard Xbox controls cover gameplay and all dialogs, settings, the original market, map, notebooks, guide tabs, search text entry and safe reset cancellation. Disconnect releases input and pauses. Unchanged paused 3D frames can be skipped while controller/DOM polling continues; real state, settings, viewport and art-load changes still draw.

## Acceptance and publication gates

Run the committed-source model suite and retain its output. The 130-check implementation run includes an explicit paused-rendering check; model fixtures are not native playthroughs.

Run tests/doors-browser.py with fresh local storage and native HTTP/WebGL. Its only injected object is a standard virtual Gamepad API device; movement, menu choices and text entry use controller inputs. Preserve title, workshop, upper floor, rooftop and basement screenshots and the final report. Keep the original independent first-commission, touch, interiors, art, Lantern Hours and Cycle Works regressions. Do not hide old failures or change gameplay speed for tests.

Merge the tested ordinary source, deploy Pages, then inspect the public-byte verification receipt. It must identify v0.7.0, the merge source, matching public assets and the existing homepage game link. Record successful Actions and publication receipt in PR95. A feature branch, release manifest or successful source preparation is not proof of deployment.

## Remaining work after this slice

Retain the broader graphics, character animation, deeper relationships, schedules, systemic policing, vehicle variety, piloted flight and shared-world roadmap. This slice does not claim a commercial animation pack, every possible human route, physical Xbox/Bluetooth certification, phone frame rates or multiplayer.

Possible next density pass: more individually authored house stories beyond the eight craft templates, richer local consequences, alternative investigations, additional enemy behaviors and more visually distinct room sets. Preserve existing saves and every playable route when extending them.
