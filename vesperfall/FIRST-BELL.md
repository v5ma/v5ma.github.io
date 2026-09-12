# Vesperfall 0.10.0: First Bell

First Bell upgrades the maintained game rather than starting another project. The original Endless cloisters, 25-room generator, optional outer routes, all 15 sparring types, Resonant Hunt audio, existing profiles and local Pilgrim's Rest checkpoints remain available. The opening menu now offers Learn physical archery and Take the Bellkeeper's Oath.

## Learn by doing

Ten lessons cover a comfortable stance and preferred handedness, a real target hit, cancellation of a drawn string, crossbow firing and reloading, a directional shield block against a real cantor volley, a valid Blink landing, Shard Step, collecting a supply crystal, changing ammunition through the slow-time quiver, and reading the wrist familiar or atlas. The first stance step is an explicit readiness acknowledgment, not automatic measurement of comfort. All remaining steps depend on actual gameplay outcomes rather than clicking Next. Skipping records an unpracticed lesson, not mastery or a permanent unlock.

The lessons use unscored practice and leave a scored expedition checkpoint untouched. Completion and skipped-step counts last for this session. They are not a permanent achievement or human usability study. Controller-specific instructions change for keyboard, Xbox and tracked Quest controls. The Quest coach is a world-space panel placed to the side of the current view, not a fixed head-locked HUD. Coach / current instruction repeats it; Coach ready resumes after stance or a paused lesson. Skip current lesson requires an explicit game-owned confirmation.

Xbox uses Menu to pause, D-pad to navigate, A to activate and B to cancel game dialogs. Quest uses its spatial Expedition menu, More / page, then First Bell / tutorial / Oath route. The First Bell screen includes lessons, Oath start, repeat instruction, ready, skip and an Endless-mode option. The existing physical bow, accessible shorter draw, physical/button crossbow reload, shield, quiver and handedness controls are reused.

## The Bellkeeper's Oath

The optional scored mode links three courts in the existing generated world. Roseglass Approach starts with a cantor and a charging stalker. Ivory Crown combines a Penitent Archer and Mirror Acolyte. Ember Crown holds the Bellkeeper. Room signage and a floor-level route pointer identify the next connection outside an active encounter. These do not steer the player, bypass collision or remove alternate ground and upper routes. The arrangement uses existing collision-tested geometry; it is not a newly authored 20-30 minute campaign.

Opponents become active when the player approaches their stage. Future stages cannot be attacked in advance. A director spaces new attack commitments, limits simultaneous windups and active bolts, and prevents new attack initiation from well behind the player's current facing. Already-committed attacks still follow their announced paths rather than becoming harmless when the player turns. Clearing a court removes its remaining hazards, gives a 4.5-second recovery beat, restores 18 health up to the current maximum and grants 2 Frost and 2 Cinder charges once. Recovery is not passive regeneration during combat.

The Bellkeeper is an original procedural armored figure with a bell staff, segmented arms, a seven-point crown, rotating halo and exposed crystal. Its first phase commits to slow projectile fans. Its second phase announces a bounded, non-homing charge that respects walls and supported floors. Its third phase alternates a wider fan with a delayed floor circle. The circle stays on its announced location and floor; repositioning is its counter. Phase transitions provide a protected pause, clear the boss's outgoing hazards and cannot be skipped by a single excessive-damage hit.

Armor reduces damage outside recovery. The crystal and label indicate when the exposed head is most vulnerable. Frost can interrupt attacks, the directional shield can stop frontal projectiles or a charge, and cover and movement remain useful. This is functional procedural character art, not a completed rigged production character or motion-capture animation.

Defeating the staged opponents opens the normal beacon and blessing choice. The next sector continues the selected Oath mode with a new seed-derived layout while retaining earned run counters. Changing back to Endless remains explicit in the menu. Existing Nightfall difficulty scales the optional route only when selected.

## Save compatibility and boundaries

Oath stage progress, boss phase, remaining attack state, supplies and cooldowns extend the existing versioned local checkpoint. Old 0.9 checkpoints without an Oath restore as Endless; the original generator identity is retained. A reload returns paused and cancels held physical input, not a surprise arrow. Starting a new scored route asks before replacing a suspended expedition. Practice does not bank or overwrite that run.

AR Sanctuary remains a separate stationary, unscored mode. Traversal lessons and the Oath require browser play or VR, so they cannot silently introduce artificial walking into passthrough. AR does not scan furniture or guarantee real-world occlusion. Clear site data or browser eviction can still remove local saves; these are not cloud backups or anti-cheat.

## Verification and remaining production work

`tests/oath.test.cjs` covers wave activation, threat budgets, phase transitions, counterplay, fixed-seed spawn clearance, checkpoint reconstruction, legacy compatibility and reward idempotence. `tests/first-bell-browser.py` drives the actual tutorial and scored journey using ordinary UI/controller events, with read-only observations for aiming and navigation. Long CPU-only runs may use the existing explicit render-only fixture; it changes draw cadence, not gameplay clocks, actor positions, damage or progression. Screenshots restore full rendering, and XR is not decimated.

The canonical `roadmap.json`, `roadmap.html` and `AAA-PRODUCTION.xlsx` now record the software slice and its remaining gates. V49-V52 and V76 remain Partial: physical handedness/reach, real-player confusion and fatigue, long-session encounter balance, production character animation and a measured polished route duration are not certified by software tests. No AAA-completion percentage or hardware frame-rate claim is attached to this release.
