# Neighborhood Missions: continuing direction

Owner decision, September 22, 2026: make the Watch Dogs 2 / Uncharted / Batman Arkham direction playable, including genuinely taller buildings. Keep these notes beside the game and update them at implementation, verification and handoff checkpoints so another chat can resume. This document records design intent, not proof that every feature exists.

## Identity and priorities

Build an original neighborhood adventure. Watch Dogs 2 is a lens for manipulating a living city's infrastructure and choosing approaches. Arkham is a lens for useful verticality, observation, grappling, gliding, readable stealth and counters. Uncharted is a lens for character relationships, discovery, traversal pacing and authored payoffs. Do not copy franchise characters, dialogue, maps, assets or branding. Preserve peaceful resident work and optional action rather than turning all streets into combat.

Height must create gameplay, not taller empty boxes. Retain low shops and street-level routines; introduce mid-height roof connections and a few recognizable tall landmarks. Each major vertical route needs a supported entrance, traversable landings, a useful vantage or mechanism, a descent and a recoverable missed transfer. Street, roof, upper-roof and interior paths should reconnect. Keep the player in control; first-person XR must not inherit cinematic forced camera movement.

Longer-term goals are multi-level functional interiors, better patrol/search behavior, environmental distractions and power controls, persistent shortcuts and visible neighborhood consequences, stronger dialogue while moving, and larger authored adventure sequences. These are priorities, not implemented claims. Cars, drone gameplay, fully voiced chapters, advanced climbing and a city-wide high-rise rebuild remain unimplemented unless a later checkpoint provides source and evidence.

## Active playable upgrade: Highline

Working baseline: Neighborhood source bfb7d105cb6df7e151a6ed5b2959399bad2dc5e3, unchanged within svgn-planet at inspected master 6f1e4bdcae98dd4b4e81e43dd8e039d93b7a303f. Prior Neighborhood Focus and the five Night Watch cases already exist; do not recreate them.

Planned bounded slice: add a taller Print Exchange and Radio Tower above the current Lantern Ward, with shared collision/render floors, switchback stairs, two upper crossings, supported grapple perches and a glide return. Provide an explicitly selected Highline mission immediately from the main game rather than requiring completion of the older campaign. Extend height validation, guidance, save recovery and native presentation together. Keep the original streets, old 4.4 m roof route, residents, delivery chapter and all older cases usable.

Proposed experience: meet Sal, investigate a high archive, survey the tower, choose a lower exposed crossing or an upper bypass, restore a rooftop repeater, and return to familiar people below. Rewards must be awarded exactly once through a validated additive ledger. Temporary loaned traversal equipment must not falsely complete an older equipment-unlock mission.

## Non-negotiable implementation contract

Read AGENTS.md and the current release/handoff before work. The main entry is index.html, main-app.mjs and main-hub.mjs; Lantern Ward is an integrated district. Never replace it with a separate demo or make a recovery entry the only way to try new content.

Preserve saves, stable old mission IDs, independent reward ledgers, the 102 frozen legacy hashes, Xbox controls, eight native AR/VR modes, controller and hand UI, hidden normal-play menus, floor feedback and independently adjustable diorama dimensions. No localStorage clearing or invented test progress. No private hub, cross-site travel, A-Frame migration, sibling-game edits, new PR, staging branch or publication pipeline. Commit directly to freshly reconciled master without force.

## Checkpoint and evidence protocol

At this checkpoint only the direction and recovery plan are saved; Highline is not yet implemented or published. Continue from the current branch, not a stale whole-game snapshot.

Before each code checkpoint, run source/model tests and record exact source hashes. After publication, independently inspect public bytes. Keep model fixtures, actual-input model journeys, DOM checks, rendered synthetic-device browser tests and physical Quest/Xbox/hand testing distinct. Preserve failed traces and explain actual remaining failures. A queued job is not a pass. Update this section and DEVELOPMENT-HANDOFF.md with implementation SHA, test results, public evidence and the next concrete task before ending the session.
