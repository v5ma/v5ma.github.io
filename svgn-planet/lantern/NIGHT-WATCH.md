# Night Watch 0.14.0: recovered candidate, not published

## Status and provenance

This candidate extends the recovered Living Portal runtime cb0cb99a1ca24c839a27cbddedd6cd2b22f51056. The separate prepared Living Portal release branch was f4199f292963dc12559b8b8f34c5b669aad7b1b8. Its source job and thirteen browser suites passed in run 35280131714; that is baseline evidence only. This new candidate has local model/input evidence, not browser, device or publication acceptance. The earlier write-availability conclusion was too broad. Retrying on September 17 restored successful connector writes; the recovery branch now carries the candidate. Master merge, new rendered acceptance and publication remain separate gates.

The local source includes the previously interrupted portal framing, first-person AR, hold-release braking, eight resident stories, mission map and added interiors. These are recovered work, not newly recreated features. The current public Working Quay release must not be replaced by extracting this snapshot over shared master.

## One bounded experience

Learn how the ward's receiver, rooftop service route and pump-gallery sentries relate, then restore the signal through observation/traversal or deliberate combat. The same place must work in desktop third person, first-person VR/AR and player-centered diorama VR/AR, with no permanently open gameplay menu. This is an optional original action case within a peaceful courier neighborhood, not a Batman clone or a replacement for resident stories.

Night Watch: Signal Hijack begins by tracking the case in Missions and meeting Mara at the watch desk near the depot. Tracking grants neither progress nor kit. Mara lends the scanner and grapple. A print-shop receiver or pump-gallery meter reveals the same interference. The player can then take the existing stairs, bridge and loft to the roof override, optionally using a validated service grapple, or confront two hijacked sentries and use the ground reset. Both routes restore the same relay and return to Mara for a separate 180-credit exactly-once reward. The original 600-credit chapter ledger and resident-story ledger are unchanged.

## XR interaction contract

All four native XR modes share one renderer, one simulation and one action layer. A-Frame was evaluated, not installed. It provides an entity-component structure over Three.js; wrapping the existing renderer would not itself fix visibility, neutral rearm, confirmation or portal problems. The implementation retains the vendored Three.js engine and the full-depth per-eye portal.

The main menu, mission map, field tools, controls, explanatory help, save, current/original export, backup restore, restart confirmation and session exit are native spatial controls. Menus dock at a yaw-only pose when opened and do not follow head roll. No menu board or long selection ray is visible during ordinary controller or hand play. A hand action board is an explicit session-only opt-in, initially off. Download completion remains an operating-system/browser behavior requiring device testing; in-headset file browsing, arbitrary text entry and full per-button remapping are not implemented.

Default right-handed Action controls: left stick moves, holding its click sprints, right stick snap-turns, right grip interacts, right trigger strikes, left trigger aims a selected field tool, and left-trigger plus right-trigger fires it. Left grip guards and brakes; with motion enabled the guard hand is held near the chest. A hops, B mounts/docks, X toggles the scanner, Y opens the menu and right-stick click cycles grapple/pulse/smoke. Left-handed controls mirror action ownership; stick swapping is independent. Snap angle, handedness, Action/Courier profile and motion-strike preference persist in a separate validated preference key.

In Courier profile the main trigger interacts, main grip throws, other trigger holds speed and other grip brakes. The other hand's face buttons open the menu. Established Xbox courier controls remain outside the optional on-foot encounter. During that encounter RT strikes, LT guards/aims, LT+RT or LB uses the selected tool, R3 cycles it and held L3 sprints. A/X/Y and Menu/Missions remain familiar. Keyboard has V scan, G grapple, Z strike, X hold guard, P pulse, H smoke and T tool cycle.

Hands use ordinary pinch to interact and a deliberate low pinch to walk. Releasing stops issuing movement and applies braking. A pinch raised near the head and held for 0.55 seconds opens the menu; release is required before selection. The gesture is a project-specific proposal, not a claim about Arkham's exact controls. The optional board exposes field tools and held guard for hands; switching to it requires opting in. Physical-hand combat parity and gesture comfort remain unapproved.

First-person VR/AR supports modest closed-grip forward motion strikes and trigger alternatives. Detection rejects large tracking jumps, insufficient time samples, head-only motion and repeated extension without rearming. Motion is disabled for the miniature view. Turning off motion gives button-only guard and trigger strike for seated accessibility. Never swing harder to compensate for missed recognition. Headset boundaries remain necessary; the AR view does not scan or protect the physical room.

## Five linked level descriptions

Physical: the existing print shop, roof bridge, loft, pump gallery and depot provide the case. Four service rings land on real supported surfaces. The grapple samples an arcing path against walls and the underside of floors; a changed obstruction returns to the safe departure. No new district or increase in map extent was made.

Conditional: the kit is available only after meeting Mara. Investigation can use either receiver. The roof override is accessible without defeating sentries. The ground reset requires both disabled. The sentries are active only while the optional case is being tracked before restoration; ordinary residents never become damage targets. The final relay state persists.

Behavioral: a Scout and a Shield sentry use bounded pursuit, line of sight, a blue windup, attack recovery and a return-to-home behavior. Only one initiates an attack windup at a time. Freshly raising guard during the cue creates a counter opening; holding indefinitely blocks but does not repeatedly earn counters. Pulse staggers the shield. Smoke breaks perception for four seconds with a recharge delay. These are explicit small state machines, not squad tactics or full predator stealth.

Information: the scanner shows the receiver-to-relay link and service rings. World-space labels and blue counter rings belong to the same scene as the level, not a head-locked plane. The mission map, beacon and floor cue follow the tracked Watch target. Route preference can be changed without losing evidence or requiring a preferred-path trigger.

Embodiment: movement, collision, saves, NPC truth and rewards are shared by all views. The courier remains centered inside the room-fixed full-depth portal while actual coordinates change normally. Display scale is not movement speed. First-person grapple travel hides the virtual motion through the existing boundary curtain; in AR it reveals passthrough. This still needs physical comfort review. Other camera/head tracking stays independent of character lean and arm animations.

## Recovery and persistence

A combat setback stops the optional encounter and offers an explicit recovery action at Mara's desk. It preserves clues, deliveries and other ledgers. Leaving the case permits normal play. Enemy health, transient player health, cooldowns, smoke and grapple motion are deliberately not serialized. Reload before relay restoration resets the small encounter; durable investigation and the restored relay survive. A mid-grapple save records its safe departure instead of an unsupported airborne location.

Save key svgn.lantern-ward.v1, chapter lantern-ward-01 and layout 1 remain. Optional watch.v1 adds stage, tracking, route and its independent credits. Missing fields in old saves initialize empty; unknown or inconsistent ledgers are rejected rather than silently downgraded. Only one city/Watch objective may be tracked. All 102 legacy-layout hashes were checked unchanged. Preference key svgn.lantern-xr-controls.v1 rejects incompatible data and does not overwrite it. No localStorage clear or acceptance-time actor/mission mutation was used.

Rollback must preserve both city and Watch serializers or archive/export the newer data explicitly. An old parser that ignores additive fields can discard earned optional progress on its next write. No full rollback drill or multi-tab conflict handling is certified.

## Evidence

All 270 tests in the full Node invocation passed locally: 242 inherited checks, eleven Watch cases, five pure XR input cases and twelve real-adapter-with-fake-renderer cases. The latter use real Three.js math and an explicitly fake renderer, DOM and XR sources. They test actions, gestures, four mode identities, hidden UI, rearm, menu reachability, preference switches and cancel-first confirmation; they do not render pixels. Module syntax and Python harness compilation also pass.

The Watch tests include real tick/input journeys for both mission approaches, plus labeled fixtures for timing, save validation and setback recovery. They are model playthroughs, not browser playthroughs. The browser harness watch-browser.py adds watch-roof, watch-combat and xr-ui suites using actual gameplay input paths and read-only inspection. It does not assign position, health, inventory or mission progress. Those suites are prepared but not accepted: local navigation was rejected with ERR_BLOCKED_BY_ADMINISTRATOR, and a separate about:blank check could not acquire WebGL2. Neither event is represented as a game pass or a shader pass.

The thirteen inherited real-browser suites still need to run with this modified source. A prepared workflow extends them to sixteen suites without deleting any. Publication must independently check the exact game files and applied design notes, then run public original, city, portal, XR menu and both Watch approaches. Do not reuse Living Portal's passing results as new-code acceptance. Physical Xbox, Quest 3/3S, Touch Plus, hand tracking, accessibility, comfort, frame timing and fresh-player understanding remain open.

## Scope deliberately not claimed

No cape gliding, arbitrary surface grappling, chest/forearm holsters, gesture takedowns, stealth vents, multi-enemy freeflow lunges, voiced narrative campaign, full detective reconstruction, seamless city-wide open world or retrofitting every legacy building is implemented. This is one integrated candidate case and an XR input/menu refactor. The goal is a testable direction, not a claim of Arkham-scale quality.

## Next acceptance and design opportunity

Run the native browser journeys first. Inspect real head-roll screenshots, menu depth/legibility, counter visibility in both views, grip/trigger conflicts, gesture false positives, and stopping after sprint release. Test every branch of confirmations without overwriting real saves. Reproduce the original rectangle report on Quest before marking it fixed for hardware. Observe whether an unfamiliar player can explain why the roof route bypasses combat and how a pulse changes the shield encounter. Only then expand expressive traversal or narrative density. Preserve the existing main and optional city stories.

The source and reviewed workflows are recovered to the isolated GitHub candidate branch. Do not overwrite shared master or force-push a reconstructed repository. Reconcile the exact Living Portal release branch, apply the source patch with base hashes checked, merge normally after real acceptance, publish by the established Pages process and record the separately observed live result.

## Reference boundaries

The user's Arkham Shadow outline supplies the requested design direction: embodied actions, counters, gadgets, useful verticality, investigation and contrasts between social and action pacing. Its detailed timing, campaign length, mapping and narrative proportions were not all independently verified and are not implementation requirements copied from the shipped game. DC's official game page confirms the VR action-adventure, gadgets and combat framing. A-Frame's official documentation establishes its Three.js/WebXR entity-component architecture. Those external facts do not prove this candidate's compatibility.

DC: https://www.dc.com/games/batman-arkham-shadow-2024
A-Frame: https://aframe.io/docs/ and https://aframe.io/docs/1.8.0/introduction/interactions-and-controllers.html
Shared library: level-design-library/AGENTS.md, STUDIO-LEVEL-DESIGN-MANUAL.md, GAME-RECOMMENDATIONS.md, QUALITY-REVIEW-FRAMEWORK.md and INDUSTRY-REFERENCE-NOTES.md, read at repository commit 82795b7d7209725a78ae2ebbb6975e782f964e5e.
