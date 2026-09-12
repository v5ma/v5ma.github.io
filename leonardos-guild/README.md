# Leo's Guild - Living Stories v0.9.0

Open Adventures, then Living stories (or D-pad up, Adventures, Living stories). Two authored cases add six physical steps apiece, alternate roof/cellar evidence routes, a reversible shutter puzzle and peaceful choices with saved, visible household outcomes. The Lamplighter's Promise begins at the workshop household desk; The Ledger With Two Names begins at Renata's western cartographer house, residence-home-0. All prior stories, households, floor networks, quiet audio preferences and saves remain. New story updates are silent by default.

The current long-term production plan is AAA-ROADMAP.md. UPGRADE-CHECKLIST.md retains earlier task IDs and release history. Release identity is in release.json; actual publication is established by the merged release PR and live-byte receipt, not the files alone.

## Earlier release notes

# Leo's Guild - Resonance v0.8.0

The existing game at /leonardos-guild/ now has a sound-led controller expansion. Read RESONANCE.md for the current mapping, audio options and explicitly retained limitations. Open the existing Leonardo's Guild card on the SVGN homepage. The served title and release.json identify the version; only a successful post-merge public-file receipt proves publication.

On a controller, D-pad up opens Guild Dispatch. Its Audio / controls application opens the mixer, dynamic-range settings, aim assistance, vibration and Classic Open Doors profile. Audio settings also appear on the title and pause screens. Hold D-pad left for music. Hold LB for equipment; use the right stick to select and D-pad left/right for variants. Release to equip or press B to cancel. X interacts, or reloads while aiming the sling. Holding X preserves interaction access. The new default uses camera-relative foot movement and a separate right-stick camera.

Five original 64-bar arrangements accompany the city, market, interiors/night, underground passages and nearby rivals. Fifty locally hosted music/effect/ambient files replace the old persistent oscillator. Master, music, effects and environment volumes are independent. Important sound captions remain available when muted. Some browsers require one trusted Enter key press before allowing audio; controller navigation never waits on that permission and no mouse is required.

Your original save key, commissions, town, 49 multi-floor households, roof and underground networks, vehicles, licensed art, keyboard and touch controls remain. Sling ammunition, selected equipment and discipline are additive. The blue bar is a replenishing guard reserve, not a claim that body-armor equipment has been added. The discipline wheel changes the same apprentice's ability; it does not claim three separate protagonists. Full policing, property economics and additional playable characters remain on the roadmap.

## Retained Open Doors guide (Classic controller profile)

# Leo's Guild - Open Doors

Leonardo's Guild version 0.7.0, build guild-open-doors-20260911. This is an expansion of the existing Renaissance browser adventure, not a replacement game. Open the existing Leonardo's Guild card at https://v5ma.github.io/ or go to /leonardos-guild/. The title screen and release.json identify the served version. PR95 and the post-merge public-file verification contain release evidence; a branch manifest alone is not publication proof.

## Start exploring

Dismount beside Leonardo's workshop and walk through its existing doorway. Use X on an Xbox controller or G on keyboard beside the household desk, staircase or commission board. Accept a household job at its ground-floor desk, solve the written craft clue upstairs, finish the work in the attic, then return to the resident for the reward. The attic ladder opens onto the rooftop walks; a cellar hatch leads to the underground passage network. Other houses have the same real entrances and multi-floor access, with separate saved progress.

Every one of the 49 city houses has a ground floor, upper workshop, attic and cellar. The two original quest basements remain part of the same city. Eight craft patterns provide 49 household commissions, rather than 49 wholly different bespoke stories. Six additional authored adventures send you between houses, rooftops and undercity sites before a physical return report. Eighteen humanoid rivals patrol, pursue, telegraph attacks and yield non-graphically when defeated. They can be braced, dodged or avoided.

Roof and underground travel uses connected, collision-checked walking geometry. Stairs and hatches are explicit same-building floor transitions, not a free-climbing physics system. Map tracking points you toward doors and stairs without teleportation. The original northern charter/pump gate and inn-cellar prerequisite remain enforced on the new routes.

## Xbox controls

Press a button after loading to let the browser expose a standard-mapped Xbox-compatible controller. Left stick moves and steers; right stick looks. A jumps or confirms. B dodges on foot or backs out of menus. X interacts, including the original market stall when stopped beside it. Y mounts or dismounts. RT strikes with the staff on foot or pedals harder while riding. LT braces on foot or brakes a vehicle. LB/RB throw letters in gameplay and change menu tabs. View opens the map, Menu pauses, left-stick click toggles sprint, and right-stick click recenters the camera. D-pad up opens the new adventure guide, down opens the original notebook, left uses Lantern, and right inspects or operates a nearby mechanism while held.

In every game dialog, D-pad or left stick moves focus, A activates, B returns, LB/RB switch tabs and right stick scrolls. Focused settings can be adjusted without a native popup. A on a text/search field opens controller text entry. Reset uses an in-game confirmation whose default is to keep your progress. Disconnect releases held input and pauses. Title and pause screens both expose settings and sound. Unchanged paused 3D scenes do not redraw continuously; UI polling remains active.

Existing keyboard and touch controls remain. G opens Open Doors, O dodges, I opens the original nearby chooser, N opens the notebook, T talks, V opens neighborhood work, J strikes and K braces. The game's Controls screen includes the remaining original keys.

## What remains

The Stolen Folio, the nine earlier side commissions, Market Life's 22 neighborhood activities, Lantern Hours services and clock, Cycle Works tuning and road test, licensed town models, bikes, pedal carriage, residents, cats, original gates, keyboard, touch joystick and saved progress remain. The existing save key is svgn.leonardos-guild.v1, outer version 2. The bounded doors record is additive. Continue resumes at the original safe street rather than a potentially isolated floor.

WebGL2 is required. Code, Three.js, glTF assets, textures and licenses are local to the site; no API key, account, purchase or external runtime asset request is needed. See ASSET-REGISTER.json for retained licensed models and OPEN-DOORS.md for the expansion's original procedural furnishings and humanoids. This is a single-player alternate-history adventure, not a historical claim, MMO or new piloted-flight release.

## Development and evidence

Read OPEN-DOORS.md, OPEN-DOORS-CHECKLIST.md and the retained UPGRADE-CHECKLIST.md before continuing. Historical release notes remain in CHANGELOG.md, MARKET-LIFE.md, LIVING-TOWN.md and CYCLE-WORKS.md. Older candidate labels in those historical files are not the current release decision.

npm test exercises original mechanics, all house access, floor authorization, route connectivity, rival behavior, prerequisites, one-time rewards, save compatibility and paused rendering. tests/doors-browser.py is a fresh native HTTP/WebGL journey using only a virtual standard Gamepad API device. It never writes live actor, quest, clock or currency state. Existing independent original/touch/interior/art/service/cycle journeys remain regressions. A virtual controller verifies software paths, not physical Xbox pairing or device performance. Read actual Actions reports and screenshots rather than treating the feature inventory as proof of passing every journey.

After merge, the publication workflow checks the actual public game files against the merged source and verifies the homepage link. Retain its receipt and commit identity in PR95. Do not stop at an unmerged branch when the user requested publication.
