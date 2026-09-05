# Ground is play, not a bypass

Micah's clarification: the introductory game should be easy, with continuous ground and gradual skill development. The sky maze is an advanced option, not the price of entry. Motocross-style ramps, exploration, collection and delivery remain valid ways to play without compulsory high-altitude transfers. This supersedes the earlier blanket no-ground rule; it does not delete the expert sky courses.

The featured progression begins with Your First Route, Canal Choices and Peg Garden. Each has a complete collision-backed road from Start to Depot. Upper rails, envelopes, bonus mailboxes and pegs are optional. The first route introduces only riding, stopping, jumping and paper delivery. Later introductory routes raise the optional geometry and provide grapple practice over solid ground. There are no pits, enemies or deadline failures in these three introductory courses. The timer is informational. Previously completed advanced courses and their identifiers/records are preserved behind an explicit Advanced challenges control, without a skill lock.

The original platform locomotion provides ground acceleration, braking, reversals and forgiving jumps. Optional rails use the existing open-curve ride and swept collision routines. No automatic lane selection, invisible catch, or upper-route win gate is added. Each newly reached upper rail awards a one-time 100-point exploration bonus in that run; retries retain those discoveries and delivered mail. The physical road catches missed upper landings.

Ground course metadata is saved with the native level code as gp. The Beginner template button opens a real editable ground/Start/Depot/ramp blueprint in the existing creator. This is not the completion of the separate uncommitted Route Workshop overhaul. That draft remains separate; this change does not overwrite it. The new wider framing and 10% smaller rendered rider keep the same collision dimensions.

Visual backgrounds vary by neighborhood: houses and planting, a canal promenade, and a pergola/peg garden. Only collision-backed terrain is presented as the road. Decorative water is behind it and cannot silently harm the player. Procedural Cloudview materials, shadows and perspective are retained.

Verification distinguishes source/geometry tests from native-HTTP 3D replays. Ground-only completion without Jump or Whip is a required positive acceptance test. Optional-rail play must show a deliberate jump, a real catch, a return to the road and a finish without death. Expert routes retain separate regression tests. Software WebGL is not a physical-device frame-rate claim. Technical references: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame and https://threejs.org/docs/pages/PerspectiveCamera.html .

No dinosaur, Theology, Studio or account configuration change belongs to this revision. Roll back by reverting the release commit, not resetting master or clearing unrelated saves.
