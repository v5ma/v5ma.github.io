# Receiver Crosswind v0.13.0

Windbreak selectors use the existing contextual X/E action; no new gameplay menu or binding is introduced. Tracked-controller interaction reaches the same selector logic. Choosing a protected angle does not bypass projectile collision, including when a tracked gun origin would reach through the active screen. Existing fixed menu controls, remaps, tracked-hand spatial UI, head independence and legal diorama openings are retained. Hands remain UI-only. Physical acceptance remains open.

# Presentation update v0.12.0

XR / diorama views is reachable from the title, pause and settings with fixed Xbox A/B/directional navigation and the existing tracked-hand spatial panel. Choose First-person VR, Third-person diorama VR, or Third-person diorama AR before entering XR. AR explicitly requests immersive-ar and remains unavailable when the browser does not support that session type; it never silently starts VR instead. Native browser or operating-system permission prompts still require user consent.

The enclosure offers exactly three configurations: open top and front, open top with closed front, or open front with closed top. No configuration closes both. The room ceilings/front shells are cut away visually where requested; collision remains real. Scale, table height, rotation and recenter controls are accessible in the same menus, including the hand-tracked panel. AR uses adjustable local-floor placement, not room scanning, scene understanding or detected furniture. A desktop preview provides a headset-free view of the same live scene.

The courier remains in the normal simulation while the view rig transforms the city into a miniature. Moving one's head around a diorama does not move or turn the courier. Left stick walks relative to the table. Rail braking/reversal and ladders retain ordinary up/down control. Tracked controller rays choose an aim point, but shooting still originates at the courier and obeys the game's range/occlusion checks. The right stick can turn the courier. Xbox-compatible Gamepad input also remains usable inside XR; its existing action/remap path is retained. In first-person XR, a pad's right stick requests deliberate snap turns and pitch remains head tracked.

Hands operate UI only. They do not shoot or walk. The diorama adds one animated 1.76-meter courier render instance, not a new simulated actor or a saved character position. Physical Xbox/Quest acceptance, passthrough appearance, comfort and sustained frame-time measurements remain open.

# Devices and current boundaries

## Grounded Cast v0.11.0

The current controller map keeps frequent actions on the face buttons, triggers and bumpers. Left stick moves and right stick looks. A jumps, performs aimed traversal, and releases a rail. X uses a nearby interaction or reloads; holding X retains the contextual secondary action. Y swaps carried weapons. B crouches on the ground or folds the airborne glider. LT aims and RT fires. LB taps the selected power, or charges its secondary action when held. RB quickly recalls the recent power; holding it opens the power wheel. Left-stick click sprints or boosts; right-stick click performs melee. View opens the atlas and Menu pauses. Rail braking and reversal use the left stick. Player remaps remain supported. The in-game Controller Deck displays the active bindings.

In menus, A selects, B returns one level, D-pad or left stick moves focus, and left/right adjusts options without an operating-system popup. Right stick and triggers scroll; bumpers page through longer menus. A fresh Back press is retained across dialog boundaries while a button held across that boundary must be released before it can activate another action. Disconnects pause the game; reconnecting controllers must be neutral.

Keyboard and touch remain available. WASD moves, arrows or mouse drag look, Space traverses, E uses nearby interactions, R reloads, F fires, Q casts, M opens the atlas and P/Escape pauses. The on-screen touch controls use the same gameplay actions and dialogs. No new menu is required for ordinary movement, shooting or interaction.

## Quest 3 target and immersive preview

Immersive sessions require local-floor and request optional hand-tracking. Head movement and both tracked controllers have independent poses. Left stick moves, right stick snap-turns, the right tracked controller aims the gun, and the left tracked controller supplies the power ray. Existing tracked-controller gameplay remains available without hand tracking.

Both measured hands can point and pinch to operate the spatial menu. The panel exposes Previous/Next page, Decrease/Increase value, Back and Exit VR. Sliders, selects, remapping and later journal entries are reachable inside the headset. A hand must first be observed open. Held pinches, missing joints and reacquisition cannot replay an activation. The rendered joint markers represent tracking samples, not authored hand meshes.

Hands operate UI only. They do not synthesize gunfire, powers or locomotion. Switching to hands without tracked controllers opens pause. The HUD Pause Menu target can reopen the menu during a hand-only session. Use tracked controllers for expedition movement and combat.

Controller tracking loss clears actions. Hidden sessions and reference-space resets pause safely. The flat-screen Longglass optic does not change immersive eye projections. Authored first-person hands/reloads, a tracked magnified lens, physical comfort acceptance and multiplayer remain open work.

## What has and has not been tested

Pure model tests, native HTTP/WebGL browser journeys and synthetic device-pose tests are separate evidence categories. Input journeys may use reduced pixel density on the software GPU; appearance tests retain their own rendering contracts. Reports and screenshots are archived with the exact tested public-file hashes.

Physical Xbox USB/Bluetooth pairing and Quest 3 tracking, hand interaction quality, readability, comfort and sustained frame time remain unverified. Synthetic device input does not certify those properties. Hardware acceptance flags remain false, and roadmap items X04, X05 and I03 remain open. No browser save reset or migration is required.
