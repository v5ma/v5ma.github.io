# Northstar Canopy signature-facility release

Build: `northstar-signature-20260912.1`

This upgrade closes the implementation portion of the roadmap's representative signature-facility target (`VS-10` / `WORLD-01`). It does not claim that the whole game has reached final art, performance, hardware or AAA production quality.

## What changed

Northstar Canopy Institute now has a stronger original procedural identity: a translucent research canopy, structural ribs, observation-spine lighting, service lockers, climate/seed-vault signage and objective lighting. The existing helicopter landing pad remains usable and visually clear. No licensed film/game assets, music or recordings are used.

A second roof route now complements the existing maintenance lift. Rangers can walk the illuminated exterior switchback service ascent from ground level to roof height. The existing rooftop safety rail stays physically authoritative; at the top, A / E operates a marked service airlock that crosses onto the safe rooftop deck, and the same airlock supports the return descent.

The new **Canopy Circuit** is a repeatable five-stage on-foot emergency drill:

1. start at the exterior canopy operations console;
2. enter through the real pedestrian doorway and restore the seed-vault relay;
3. reach the roof wind sensor by lift or service ascent;
4. cross the canopy observation spine and reset circulation;
5. return to ground level and file the report.

First completion awards 750 credits through the existing economy ledger. Replays record completion count and best time without duplicating the first-completion payout. State is stored separately at `dino-atlas.northstar-signature.v1`.

## Preservation and fixes

The journal, recorder campaign, Frontier, Ranch & Coast, Storm Response, Living Herds, market/economy, audio settings and vehicle state remain separate and are not reset. During this pass the economy sanitizer was corrected to retain all current one-time AAA reward identifiers (`aaa:storm-response`, `aaa:living-herds`, `aaa:northstar-canopy`) across reloads.

## Controller behavior

The activity uses the shared controller language: Menu opens activities, D-pad/left stick moves focus, A selects/interacts, B closes, Y boards/exits vehicles and X remains reload. The service airlock and every Canopy Circuit console use A / E; no native browser alert/confirm prompt is introduced.

## Acceptance scope

Automated evidence covers state sanitization, save isolation, one-time reward behavior, all five circuit interactions, real character-controller traversal of both exterior stair flights, roof support/helipad preservation, rendered WebGL UI/controller flow, the real Northstar doorway/corridor, service airlock, roof interactions, completion/reload, plus the prior Living Herds and Storm Response journeys.

The browser acceptance uses software WebGL and synthetic standard-layout Xbox input. A distant fixture may position the ranger at Northstar to avoid turning the test into a whole-island travel soak. This is not a human art review, physical Xbox certification, television readability test, speaker/headphone review or consumer-GPU performance measurement; those roadmap gates remain open.
