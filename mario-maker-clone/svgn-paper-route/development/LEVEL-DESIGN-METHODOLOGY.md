# Sky Cycle: ride, discover, reconnect

Approved direction: September 15, 2026. This is the canonical chapter-design method for the existing Sky Cycle. It integrates the two user-supplied side-scroller drafts with the existing game; it does not replace the cycling game with a different genre. The chapter implementation and its evidence are separate from this design specification.

## Design promise and hierarchy

Ride a complete adventure on the ground, discover an interconnected adventure above it, and gradually learn to connect the two into your own route.

Sonic and Motocross Maniacs remain the movement foundation. Mario informs teaching and variation. Metroid informs discovery and changing understanding. Castlevania informs how enemies, timing and terrain interact. These are unequal design roles, not four styles to alternate between mechanically. Do not demand unfamiliar traversal, maximum speed, searching and precise combat at the same instant.

Chapter quality now organizes production. Portals, rider animation, water, materials, audio, enemies and discoveries must serve riding decisions. Additional presentation releases must not continually defer the reference chapter. Complete the bounded Quiet Water release, then develop Waterwheel Boulevard before adding another destination.

## The ground is an adventure, not a safety strip

Author its beginning, development, relief, deliveries, readable encounters, ordinary choices and finish. Test the same chapter with aerial geometry absent. Ground completion must not require advanced loop transfers, an upper-to-upper whip release, a seal or an optional challenge. Ground may include slopes, modest jumps, bridges, braking and shortcuts. Human observation must establish enjoyment and readability; a finish alone is not enough.

## The sky is a connected adventure, not stunt props

Keep the enormous-network ambition. Expand by meaningful connections between recognizable districts, not arbitrary surface counts. A rising runway, open curl, receiving cradle, braking choice, recovery shelf and optional whip connection each need a usable next state. Short introductory detours must return clearly to the road before the extensive express network begins. Lower routes can favor deliveries, safety, observation or a better later approach; lower is not inherently punishment.

## The unit of design is a complete transfer

For every important transfer record its stable surface IDs, approach interval, tested speed/control assumptions, launch direction, receiver, likely short/early/late miss regions, usable onward state, visual cue, simultaneous input demands and evidence status. The route document owns the geometry. An annotation is an intention, not a playability guarantee.

Carry the same position and velocity across successive contacts in Ride Lab and isolated-physics tests. A receiver is useful only when the arrival allows continuing, braking, choosing or recovering. Test swept rider/deck clearance as well as contacts. Keep untested assumptions explicit. Never fix acceptance by teleporting, resetting intermediate velocity, steering invisibly, changing collision tolerance only for the chapter, assigning wins or removing failed traces.

## Teach possibilities in existing actions

Each chapter has one central movement question. Introduce it in a complete forgiving situation, vary the circumstances, provide contrast and relief, then offer a more expressive combination. Do not simply lengthen an identical jump repeatedly. The beginner and expert should explore the same physical idea at different depths. Jump, boost, paper and whip remain direct actions with preserved remaps.

## Discovery changes understanding first

Distinguish knowledge, skill and ability barriers. Prioritize discovering an entrance, reading an underside connection, selecting another receiver through braking, or understanding a local environmental change. Do not assume swimming, moving-machinery grapple upgrades or new equipment are prerequisites for this project. The earlier Stormglass Aqueduct example is illustrative, not an added chapter commitment.

Revisiting should offer a faster connection, a new understanding, a delivery or altered geography. Avoid mandatory repetition through unchanged terrain. Continuous within-chapter geography is different from the current portal atlas, whose travel starts another route run. Do not carry unfinished deliveries across portals or describe the destination selector as seamless world simulation.

## Deliveries, encounters and pacing give geography purpose

Roads serve ordinary doorsteps, gallery lines can serve postal balconies, and maintenance routes can reach local workplaces. Place targets so the player can read and execute the intended throw while riding. Simultaneous grapple/jump/precise delivery belongs only in an introduced optional mastery challenge.

Every enemy should alter a riding decision. Provide a visible slowing approach or observation space before tactical encounters. Do not conceal an enemy on a committed receiving deck. Intended grapple targets must be distinguishable from decoration and from competing targets. Relief, sheltered discovery and landmark views separate demanding passages.

## Presentation, camera and access are part of authorship

Frame the current approach, receiver and meaningful recovery region, not every surface in the district at once. Audit real trajectory visibility at encouraged speeds. Avoid shrinking the rider indefinitely. Review normal side-on 3D, supported 2D and seated stereo XR separately. Background architecture must not look like physical routes or obscure contacts.

Rider articulation and contact IK express the existing simulation; do not move collision bodies to match poses. Audio confirms a visible state change. The chapter remains understandable with effects muted and optional notices suppressed. Maintain one soundtrack owner, bounded effects and visibility/pause cleanup.

Use the actual preserved Xbox mapping when testing simultaneous actions, including shoulder alternatives. Hand-only XR must not require tiny rapid UI selections on the ordinary route. Actual Quest controller/hand ergonomics, comfort, tracking loss and frame times remain physical-device gates, not consequences of an emulator pass. Advanced Bezier editing remains an explicit pointer-required exception until implemented and tested.

## Revision-safe promotion

Preserve route identity and catalog index, but not every prototype arrangement. Keep player-created documents immutable unless their owner edits them. Retain older medals, times, badges and ghosts as old-layout achievements; do not silently compare them to a different geometry. Before default campaign promotion, implement and rollback-test revision-aware settlement, display, checkpoint recovery and old/new record separation.

The first Waterwheel implementation uses a non-awarding Workshop preview and leaves the eight existing campaign builders untouched. The reserved future key `canal-choices-r2` is a policy identifier, not an active migration. The preview uses the existing Workshop's isolated finish/ghost/daily/credit behavior. A dirty draft blocks replacement. A separate backup key preserves the previous blueprint before opening the preview; failed backup writes block entry. This is a staging strategy, not a claim that the full redesign is finished.

## Chapter gates and evidence

Gate A specifies the movement question, delivery purpose, districts, landmark, decision pacing and route graph. Gate B produces an editable layout with a ground-only option and explicit transfer annotations. Gate C passes deterministic document/resource checks and bounded carried-state scenarios. Gate D records normal-input ground, introductory, expressive, recovery and exploration runs, including failed attempts. Gate E verifies older saves, draft protection, legitimate settlement, retries, controller menus and XR visibility. Gate F records unfamiliar-player readability/enjoyment and physical hardware/comfort. Gate G promotes the default chapter only after its declared contract and revision-safe record migration are accepted.

Do not collapse those gates into a percentage or mark them all complete because a preview is public. The scope of each published artifact must state what is implemented and what is not. Exact source, raw results, captures, source-manifest hashes and failed attempts belong in the versioned receipt. A normal merge is not evidence that Pages serves the new bytes.

## Sources and approved additions

The user-supplied drafts are preserved in `chapters/design-source-provenance.json` by filename, content hash and line ranges. The first supplies the side-scroller teaching/discovery/encounter/momentum framework. The second preserves Sky Cycle's identity and specifies Waterwheel as the reference chapter. Existing integration constraints come from `FLOW-ROUTES.md`, `CLOUDPOST-RELAY.md`, `RIDE-LAB.md`, `SUNRISE-0.18.md`, `RESUME-HERE.md` and `AAA-ROADMAP.md`.

Explicit layout revisions, a gated non-awarding preview and the seven concrete Waterwheel district names are implementation decisions following the approved merger. They are not attributed to outside designers or claimed to exist in the original sources. Historical game-design citations inside the supplied drafts are retained as their references; this implementation does not independently re-verify those historical claims.
