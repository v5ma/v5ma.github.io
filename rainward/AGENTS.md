# Rainward continuation rules

Read DEVELOPMENT-HANDOFF.md, release.json, production-plan.json and CONTROLLER.md before continuing work in this directory. This file scopes only Rainward; do not import goals, code or private narrative from sibling games.

The owner wants upgrades to the existing playable game, not replacement demos or image generation. Preserve all seven authored expeditions, save keys and older checkpoint compatibility, finite resources, controller presets and asset credits. Water missions, better human models/animation, believable environments, enemy/task variety, original sound/music and useful shaders are priorities.

Controller completeness means gameplay AND all title/settings/journal/satchel/confirmation/retry interfaces without a mouse. Survival uses X melee and LT+X reload; Classic uses X reload. Use CONTROLLER.md for the whole map and swimming overrides. Keep native in-game dialogs, safe Cancel focus, released-input arming, reconnect safety and keyboard/touch alternatives. Never promise to dismiss browser security prompts through game code.

For the owner's explicit September 21 direction, write reviewed Rainward changes directly to current master; do not create pull requests or staging branches unless explicitly requested. Read the current master immediately before writing, preserve concurrent sibling changes, and use non-forced fast-forward updates. Finish by committing, publishing and verifying actual public bytes. Retry transient GitHub failures after a short wait; do not bypass access restrictions, force-push master, discard concurrent work or report an unpublished candidate as live. Master moves for other games, so compare scoped paths before merging.

Canonical task state is production-plan.json; regenerate AAA_CHECKLIST.md rather than editing it alone. Local roadmap review marks do not edit GitHub and do not certify quality. Keep named-owner/human approval gates unapproved until evidence exists. Record incomplete requested features explicitly.

Retain tests and failed evidence. Model checks, safe-fixture browser tests, a live-enemy mission, physical Xbox/Bluetooth checks, subjective art/audio review and target-hardware performance are different evidence classes. The Undertow aquatic suite is NOT a living-enemy start-to-extraction browser run. Consult evidence/undertow-v0.13.0/ for the prior released build, not proof of a later candidate.

No gameplay release bump is implied by a documentation-only handoff. Old preparation/recovery workflows and branches are historical; do not rerun them blindly. Self-host runtime assets, retain their actual license/provenance, and do not require paid providers, accounts or API keys for play.

The owner authorized authored layout replacements on 2026-09-15. Apply LEVEL-DESIGN.md: experience spine, meaningful alternatives, observation, loops, retreat, contrast and graybox playtesting before final art. Preserve seven chapter identities, stable progression and compatible shelters, not every prototype wall. The initial clinic-market seam is only the first replacement. DIORAMA.md adds first-person VR and third-person AR/VR of the same game; never allow both top and front closed. Do not claim room-surface detection, persistent anchors, physical-device review, final level quality or unfinished IK as shipped.

The September 17 Freefield brief supersedes fatigue-limited default running, old Quest face buttons, pinned XR panels and six-plane cropping. Preserve selectable legacy controls/movement and old saves; do not restore superseded defaults to satisfy historical tests. FREEFIELD.md defines the four-view centered portal and on-demand UI. Software input/pixel tests do not certify physical Quest or human quality.

Read MERGE-RECONCILIATION.md before considering any historical Grounded or Freight Firebreak branch. The recovered motion is integrated through foot-contact.mjs, after the existing scene terrain placement. Do not run a second foot solver or overwrite the retained character bodies. PR147 proportions and PR165 map/task changes are not the canonical runtime. Keep archived source/evidence rather than blindly merging those branches.
