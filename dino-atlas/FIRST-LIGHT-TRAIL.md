# First Light / Follow the trail

Build first-light-trail-20260922.1. This pass improves the existing optional First Light chapter; it is not chapter two. Read HANDOFF.md for the exact latest source, hosted and public verification state, and FUTURE-DIRECTION.md for the preserved campaign direction.

## Player-facing changes

An optional amber foot trail now shows the known route to the selected First Light objective, including the main gate, the north-side practice-ramp bypass, the relay approach, the restored research gate and the return to Leena. Small static ground chevrons show the next 42 m at most; a dashed line on the existing map shows the remainder. The existing floor display uses that same map. The gold objective marker still belongs to the actual destination, not a second mission or compulsory waypoint.

The current step names the next useful landmark and switches to READY only when the original interaction rules permit the action. Plant-eater observation names the actually visible animal; it does not ask the player to shoot. Nearby vehicle guidance asks the ranger to park and step out. When off the authored path or above ground level, the guide explains the limitation rather than drawing a false straight connector through obstacles. The introduction and map legend explain these cues without replacing the existing game entries.

The existing destination-guidance switch controls the trail. Turning it off does not reset anything. Routes are advisory: the player may take any legal alternative and interact without visiting route nodes. The guide recalculates from position; it has no visited flags or rewards. Completing or suspending First Light removes the trail. Original free exploration, story conversations, equipment, missions and controls remain.

## Implementation and limits

first-light-route.js contains nineteen named points and twenty-one bidirectional edges over existing ground. Research-gate crossing is conservatively available for the corresponding restored chapter stages. This is a bounded First Light foot guide, not a reserve-wide navigation mesh, dynamic wildlife avoidance or vehicle route planner. It does not reinterpret previous gate progress or change a collider.

first-light-trail.js adds one instanced mesh with at most twenty-four two-triangle marks, inside the existing game/portal root. It owns no renderer, clock, input, storage or physics. Marks are depth-tested, static and respect the normal per-eye portal wrapper. No decorative pulse or head-locked panel is added. All Currentworks water/tree code, r177 engine, original terrain, saves, carried cargo, reward IDs, controller profiles and core chapter eligibility remain unchanged.

living-reserve.js supplies the state-aware task; field-navigation.js paints the optional trail. index.html versions those changed imports and explains the feature. The original seven-step save schema is unchanged. Inactive stories avoid the additional context query. This pass does not fix foreground tree occlusion or claim improved production character art.

## Validation and continuation

Before publication, all 322 local tests passed with zero failures or skips, including seventeen new route, readiness, ownership, portal-hook and actual-Rapier traversal tests. Every advertised edge walked in both directions in explicit geometry fixtures; a sequential physical route also walked from the actual bay through all seven destinations and back. These are model tests, not native GPU or physical-device playtests. The checker passed 68 syntax files and scanned 79 owned source/script files. Python compilation passed.

The initial focused test run had one mistaken expectation: a position outside the 3 m trail corridor was expected to be on it. The fixture was moved to an actual corridor position; the runtime bounds were not weakened. Retain that distinction in verification/first-light-trail/.

The existing full-story browser runner retains all earlier movement, dialogue, visibility, gate passage, return and reload assertions and adds trail activation, pause, off/on preference, real readiness, ramp bypass, restored-gate route, completion cleanup and mocked-XR floor guidance checks. No actor, mission, inventory or reward assignment is used for native acceptance. The existing read-only workflow runs those source journeys and separately matches public runtime bytes before the same public journeys. Read the actual results before claiming this build verified live.

Physical Quest/Xbox, hand tracking, stereo/passthrough, comfort, sustained performance and unfamiliar-player comprehension remain open. Next review whether the optional cues make the opening understandable without becoming intrusive. Then continue the separately saved Missing Survey/Tidegate chapter proposal using forward-safe chapter state, existing geometry and preserved cargo. Do not silently add Fire/Grass, replace the renderer or recreate already delivered systems.
