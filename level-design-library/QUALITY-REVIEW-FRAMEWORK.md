# SVGN Interactive Level Design Quality Review Framework

Use this framework to review a playable build. It is an internal development tool, not a prediction of critic scores.

## Required evidence

Every assessment must identify the game, exact build or SHA, level or chapter, presentation mode, input method, reviewer, and evidence. Separate automated evidence, developer playthroughs, unfamiliar-player sessions, returning-player sessions, and physical-device tests.

Do not assign a favorable overall result when a release blocker remains. Save corruption, broken controls, unwinnable progression, inaccessible required interaction, severe performance failure, or broken public deployment must remain visible as blockers.

## Review dimensions

First-session clarity: Can a new player identify a plausible goal and understand the basic rules without constant explanation?

Spatial readability: Can the player form a useful mental map, recognize landmarks, read important elevation changes, and understand where major routes lead?

Meaningful choice: Do route, tool, timing, social, or tactical choices produce different consequences rather than cosmetic variation?

Mechanical depth: Do a small number of dependable systems combine into increasingly interesting decisions?

Pacing and contrast: Does the experience alternate pressure, exploration, discovery, recovery, and spectacle appropriately for the game?

Encounter or challenge quality: Do enemies, wildlife, hazards, routines, notes, deliveries, or traversal problems create readable decisions and counterplay?

Environmental storytelling and function: Does the place communicate what it is for, what happened, and why routes or mechanisms exist?

Movement and camera integration: Does the level fit the real movement system, body, vehicle, camera, aim, and speed rather than merely being technically traversable?

Recovery and retry quality: Are likely mistakes understandable, recoverable where appropriate, and matched with a reasonable retry cost?

Accessibility and control continuity: Can the advertised input modes complete the level with consistent navigation, readable feedback, and low menu friction for frequent actions?

Performance and stability: Does the level remain stable under the intended rendering and simulation load, with physical hardware tested where required?

Replay and mastery: Does prior knowledge produce greater agency, efficiency, expression, or discovery rather than only faster repetition?

Audiovisual communication: Do lighting, sound, motion, landmarks, effects, and art reinforce gameplay information rather than obscure it?

Identity and memorability: Does the level deliver an experience specific to this game and chapter rather than feeling like generic geometry with the same systems repeated?

## Fresh-player questions

After the session, ask the player to describe the place in their own words. Ask where they thought they were going, which alternatives they noticed, what they believed a major mechanism changed, where they felt safe or exposed, what they would do differently on replay, and which location or event they remember most clearly.

A player completing the objective while being unable to explain the place or its systems is useful evidence that completion alone is not enough.

## Returning-player questions

Ask whether the player can exploit a shortcut, route relationship, routine, movement line, resource opportunity, or environmental state that they did not understand initially. A strong replay should convert knowledge into agency.

## Metrics worth recording

Record hesitation points, wrong turns, route choices, backtracking, voluntary exploration, deaths or resets, recoveries, damage or resource expenditure, missed cues, hint use, repeated interactions, time to objective understanding, time spent waiting, optional discoveries, completion time, and whether the player can explain important cause-and-effect relationships.

Metrics should diagnose the experience rather than replace observation. A low death count can coexist with boredom or confusion. Repeated failure can coexist with enjoyable learning.

## Presentation-mode review

Desktop, third-person, first-person VR, diorama VR, AR, controller, hand tracking, keyboard, touch, and 2D fallback can expose different information and physical demands. Review each advertised path on its own terms. Do not infer physical Quest or Xbox acceptance from emulation.

## Release recommendation language

Use precise states such as implemented, model-tested, browser-tested, developer-played, unfamiliar-player-tested, returning-player-tested, physical-device-tested, published, or verified-live. Avoid using a broad label such as AAA complete when the underlying evidence only supports a subset of those states.

## Iteration rule

When a test exposes a problem, prefer revising the relationship that caused it: move the landmark, widen the decision window, change the route tradeoff, improve feedback, add a recovery, remove a redundant corridor, alter enemy placement, shorten a wait, or simplify a mechanism. Do not automatically add more HUD markers, enemies, collectibles, or geometry.
