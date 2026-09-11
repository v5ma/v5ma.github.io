# Open Doors implementation and acceptance

Version 0.7.0, build guild-open-doors-20260911. Same game, same map, same old save key. The release manifest is the canonical feature inventory; a manifest alone does not prove publication.

## World and activities

Every house in world.houses has an actual door opening and matching ground room. The 43 formerly closed houses join the six earlier signed interiors. There are 49 ground-floor household desks, 49 upper workshops, 49 attics, 49 cellars (including the two prior quest cellars), and two connected public traversal layers. Ground buildings preserve their footprints and old collision walls. A selected upper floor is built lazily, with furnished craft stations, shelves, sleeping space and marked up/down stairs. Stair/hatch actions transition vertically within the same building. Roof and underground travel is real walking over connected geometry rather than map teleportation.

Household jobs use eight explicitly clued craft variations: bookbinding, clocks, weaving, musical instruments, herbs, pottery, cartography and lens grinding. Each has accept, upstairs work, attic finishing and ground-floor return. Mistakes are free. Completion grants 60 XP and 25 florins once and opens repeatable rest with a cooldown. These are 49 distinct household progress records, not 49 wholly unique bespoke narratives.

Six additional authored investigations are The Missing Survey Pages, Signals Above the Streets, The Water Under Vinci, The Brass Mask Trail, A Guild in Every Street and The Astronomer's Correspondence. Their stages validate real location/floor, rival or household prerequisites and one-time return rewards. The original north gate cannot be bypassed through a roof or tunnel. The inn cellar remains locked until the original cat commission is complete.

Eighteen original clothed humanoid models inhabit attics, roofs and passages. Scout, brigand and duelist configurations have different health, pursuit and recovery timings. They telegraph attacks, can be braced or dodged, and yield non-graphically. Defeats persist. No projectile firearms or graphic violence were added.

## Controller

The standard browser Gamepad mapping is polled on the title screen, during gameplay and during all dialogs. Gameplay and UI inputs have separate routes. Buttons are edge-triggered; axes have a deadzone. D-pad/left-stick directional focus, A activation, B back, LB/RB tabs, right-stick scroll, inline select/range adjustment and an on-screen text-entry grid are supplied. Native alert/confirm is not used for reset. Cancel is the initial reset choice. Disconnect releases input and pauses. Settings and sound remain reachable without a pointer from both title and pause.

Browser tests inject a virtual standard Gamepad API object and alter only its input axes/buttons, never live game actor, quest, currency or renderer state. This validates software routing, not Bluetooth pairing or actual Xbox hardware. Existing keyboard/touch paths remain supported. The UI exposes the full mapping in G / Open Doors / Controller.

## Persistence and limits

The doors field is additive and bounded. Existing v2 outer saves without it initialize an empty expansion, retaining original currency, deliveries, quests, equipment and progress. Reload resumes at the existing workshop instead of an isolated layer. House rewards, investigation rewards and rival defeats are not repeated. No sibling project files, accounts, payment services or save keys are changed.

Read the tests, committed-source manifests and publication receipt for evidence. Software-rendered Chromium is not a device-performance certification. This is an expanded single-player browser game, not a new MMO, commercial animation package or piloted-flight release.
