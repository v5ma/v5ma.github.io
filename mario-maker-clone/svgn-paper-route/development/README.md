# Sky Cycle development: start here

Updated September 15, 2026. Continue the existing game in `mario-maker-clone/svgn-paper-route/`; do not build a replacement prototype. Read `RESUME-HERE.md` and the current versioned receipt before coding.

## Current release and source identity

The current merged release is **v0.21.0**, build `sky-cycle-portals-2026.09.14`: Portal Network, articulated courier contacts and opt-in seated tracked XR. Exact accepted candidate: `89897e4d2379464bd37be9e54ca384925c4da84e`. PR 148 merged it normally as `3383257313b74255cb61402d4ca7e21c84fbca20`.

Publication is established by `verification/portal-network-0.21.json`, not by this merge statement. Read its publication result and public-file hashes before describing a deployment as live. Newer combined master deployments may include unchanged Sky Cycle files alongside sibling-game upgrades.

Play: `https://v5ma.github.io/mario-maker-clone/svgn-paper-route/`.

Tideglass: `https://v5ma.github.io/mario-maker-clone/svgn-paper-route/?destination=tideglass-baths`.

WebGL XR entry: `https://v5ma.github.io/mario-maker-clone/svgn-paper-route/?destination=tideglass-baths&xr=1`, then explicitly choose the Quest / XR control. XR is a seated side-on view of the existing game, not first-person cycling. A reload starts a new route; it does not carry provisional run state. Unsaved Workshop drafts are protected.

## Read in this order

1. `RESUME-HERE.md`: current implementation, invariants, integration traps, open checks and next work.
2. `verification/portal-network-0.21.json`: exact accepted source, test jobs, artifacts, public verification and limitations.
3. `PORTAL-NETWORK-0.21.md`: current feature scope, controls, evidence classes and retained failures.
4. `AAA-ROADMAP.md`: canonical long-range production checklist; version numbers do not certify AAA quality.
5. `GITHUB-RELEASE-PROCESS.md`: branch, exact-source test, capture review, normal merge and public-byte verification process.
6. Prior notes and receipts: `TIDEGLASS-0.20.md`, `LUMINOUS-0.19.md`, `SUNRISE-0.18.md`, `ROUTE-COMPASS-0.17.md` and `FLIGHT-DECK-0.16.md`.

## Standing rules

- Preserve existing gameplay, route IDs/indices, saved progress, Workshop drafts, controller remaps, independent settings and the original soundtrack. No storage migration is introduced in v0.21.
- Keep the momentum-driven cycling identity: read the route, build speed, jump, catch, deliver, discover an alternate line, finish.
- Frequent gameplay actions belong on direct, readily accessible buttons. Preserve familiar mappings instead of adding menu friction.
- Ordinary play, pause, results, atlas, journal, settings and confirmations must remain usable with an Xbox-style controller. Advanced Bezier manipulation remains an explicitly open pointer-required exception.
- Quest tracked-controller and hand-select input must release held actions on source/visibility loss and exit. Test both modes without assuming CI emulation qualifies actual hardware.
- Native acceptance must use normal inputs and real engine wins. Never teleport the rider, assign score/progression, suppress a failed assertion or force a finish to make a test pass.
- Keep failed evidence and exact source identities. A passed rule test, carried-state model, isolated UI fixture, real-input browser run and physical-device test are different evidence classes.
- Publish accepted upgrades and compare public bytes with accepted source. Do not stop at a branch commit when release access is available. Never overwrite sibling-game work or force an obsolete Pages deployment.

## Acceptance boundaries

Candidate run `34942370330` passed all four scoped jobs: 146 rule tests, the stereo/controller/hand-input browser suite, Tideglass and Sunrise. The route suites record two Tideglass and three Sunrise first-attempt authored finishes, using real 3D local traversal and supported 2D full-route completion on CPU CI. The 23 PNG captures were reviewed. The XR suite uses the real Three XRManager with emulated hardware; physical Quest 3 and Xbox remain unqualified.

Do not describe the entire repository CI matrix as green. The older Cloudpost suite includes stale hard-coded 16-track checks and one failed strict optional canal-sequence trace despite an ordinary first-attempt finish. The old site-wide test also assumes the homepage contains exactly three projects. Details and follow-up requirements are in the current note and receipt. Keep these failures visible; do not remove content or weaken contracts merely to satisfy old tests.

## Current design direction

Tideglass remains the newest destination and Portal Destination 01. v0.21 generalizes travel around existing Tideglass and Sunrise; it does not add unfinished levels. Future destinations should have recognizable portal color, reflection, label and restrained sound signatures, and should be added one finished playable scene at a time.

The water-destination language remains muted aqua/teal water, tiled ceramic, chrome ladders, wet reflections, soft haze and restrained caustic-style highlights. Water is scenic behind the cycling road; swimming and underwater locomotion are not implemented. Rooftop pools, flooded corridors, cisterns and canal districts remain proposals, not promised playable content.

## Next work

First reconcile the legacy geometry-count assertions and repeat the complete optional canal sequence without mutating gameplay or weakening its route contract. Then continue the bounded water/audio sensory pass: notification-density and transient-intensity controls before adding more ambience, mechanical cues and portal sound. Keep one soundtrack owner, bounded voices/cooldowns and separate effects/music controls.

Physical Quest 3 controller and hand-tracking usability, real lighting/tracking loss, comfort and measured frame times should precede additional XR scene-detail increases. Waterwheel Boulevard and Copperleaf Gardens remain later chapter-quality work. Keep all wider AAA gates open until their own recorded acceptance conditions are actually met.
