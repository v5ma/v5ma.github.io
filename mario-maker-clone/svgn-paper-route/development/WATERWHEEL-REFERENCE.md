# Waterwheel Boulevard: reference chapter specification

September 15, 2026. Approved central experience: deliver through a working waterside neighborhood, learn how momentum changes your route, and discover an aerial express connection that repeatedly rejoins the streets. Stable campaign route remains `canal-choices`, index 5. Read `LEVEL-DESIGN-METHODOLOGY.md` for the canonical method.

## First playable slice: waterwheel-r2

This slice replaces the authored chapter builder, not the physics or editor. The current implementation contains a complete 256-column road, six observation/pace districts, an independently returning Post Quay practice balcony, six connected express surfaces, a brake-selected canal balcony and an east-bank receiving promenade. The scene contains a behind-the-road wheelhouse and rotating waterwheel. This is a concrete first implementation, not completion of the enormous long-term sky network.

Post Quay begins with ordinary doorsteps and an optional low jump. The 650-to-1040 practice surface must land back on the street before the Mill Lane raised promenade at x=1404. It must not accidentally feed into the main express route.

Mill Lane varies the road through a broad, stepped promenade and supplies a readable approach to the main optional runway at x=2100. The normal road continues beneath it. Holding ordinary forward input after a jump should carry into the express lift; the ramp must not capture a rider who stays on the street.

Canal Choice makes braking useful. Braking before the rising runway's lip selects the lower balcony at x=2780 to 3420, with a canal-side postal stop and a clear road return. Holding pace selects the higher series. The test contract records the actual six receiving surfaces and carried states, not merely a graph claiming connections.

Wheelhouse Court provides recognizable background machinery, a view of the express overhead and a prepared road patrol encounter. A first approach, ground crossing and later look back should relate to the same landmark. Scenery remains behind the physical riding plane. The ordinary route never requires operating a new mechanism.

East-bank Promenade receives the long final express flight and returns toward the same road and depot. The ground journey has another raised passage and delivery stops. Waterwheel Depot concludes both journeys with an ordinary finish, not an aerial quota. Nine road mailboxes and two optional higher targets exist; the main finish does not require all mail. Six checkpoints retain the existing retry behavior.

## Transfer contracts and evidence

The initial declared express model matrix varies speeds 5, 6, 7.5 and 9 and road-jump offsets 90, 120, 150 and 180 before `ww-rise`. It carries state through `ww-rise`, `ww-1` through `ww-5`, then `ww-east`, finally returning to road before the finish. A swept conservative rider envelope is checked against deck bodies. These are 16 bounded seeded-first-jump model cases, not native playthroughs or all-input reachability.

Five braking recipes begin braking 80, 95, 110, 125 and 140 units before the runway lip. They require `ww-rise` then `ww-low`, no unintended upper contact, and useful road return. Nine introductory recipes vary speed 5, 7.5 and 9 and offsets 90, 120 and 150; each must visit only `ww-quay` and return before Mill Lane. Actual engine-input browser recipes separately test the road, practice, lower and express journeys.

An early practice entry produced a conservative deck-clearance warning in a fast/late sample. Lowering the entry lip fixed that tested warning. Experimental large open curls produced either swept-body warnings or premature receiver catches; those experiments were rejected rather than labelled playable. The initial slice deliberately uses a connected receiver sequence. The planned major open curl and advanced upper-to-upper whip link remain unfinished, not hidden by a passed six-lift test. Boosted entries and full reverse-route coverage are also outside this bounded matrix.

## Record and document ownership

The stable route identity is unchanged. New time, medal, career and exploration records use `canal-choices-waterwheel-r2`; the earlier `canal-choices` records remain in their original namespaces and are displayed as earlier-layout history. Existing Workshop documents are not rewritten. Flight Deck exposes an export of the classic chapter as a `.route` document, without replacing the active route or current draft.

Every accepted new-layout finish must pass the existing unmodified-authored-document check. Edited runs cannot obtain official awards. Checkpoint positions are run-local in the current architecture; launching the revised chapter starts a new run rather than teleporting an old persisted position. Future save migrations require separate review.

## Acceptance ledger

Rule and geometry cases are in `tests/waterwheel.test.mjs`. Native paths and explicit old-storage compatibility fixtures are in `tests/waterwheel-browser.py`, with separate road, quay, canal, express and XR cases. Actual 3D entry/court captures and supported 2D full-route completion are labelled separately. XR has real Three stereo rendering with deterministic tracked-controller/hand-select emulation; physical hardware remains unqualified. The versioned receipt alone controls exact tested source and publication status.

Before calling the chapter reference-quality, complete unfamiliar-player ground review with aerial geometry hidden, slower and faster native routes, every offered mailbox/badge attainability, full 3D moving-camera review, the proposed open curl and optional whip continuation, additional near-miss variations, muted/readability review, physical Xbox and Quest 3, and reference-device frame times. Long-term expansion is not a checkbox inferred from this slice.

## Next chapter work, in order

Resolve any native input or visible composition defect exposed by this slice. Prove all optional delivery and badge goals through actual inputs. Complete the larger open-curl and optional high-to-high whip extension with an ordinary alternative and retained failed trajectories. Add an observation-led discovery interaction only when it changes an already understood route. Review the complete ground journey with new players, then expand the district and only afterward adapt the method to Copperleaf Gardens.

The historical Sunrise optional canal-sequence uncertainty remains a distinct maintenance item. Waterwheel uses newly authored geometry and its own exact recipes; it does not claim that the older failed sequence is now validated.
