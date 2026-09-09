# Cycle Works / v0.6.0

This is a focused continuation of UPGRADE-CHECKLIST D17 and D05 in the existing town. It does not replace any earlier mission or map, add payment services, or claim flight or multiplayer.

## Getting started

Stop at Bartolo's Cycle Works and dismount. Walk through its existing marked doorway. Near the indoor fitting station, open Nearby with I or the touch button and choose Bartolo's cycle tuning bench. Complete the existing Market Life activity A Better Fit first if needed. The chooser provides a direct handoff to that original workstation. There is no new inventory reset, account, premium currency or purchase with real money.

## Actual equipment choices

The original gearing, original brake and terracotta finish start owned. Sprint gearing costs 30 earned florins and gives 25% more acceleration with 12% lower pedal/boost speed limits. Cruise gearing costs 50 and gives 15% less acceleration with 12% higher limits. These scale whichever Standard, Courier or Cargo bicycle you currently use; Riding attribute bonuses still contribute. The pedal carriage is unaffected.

The 35-florin long-pull lever strengthens the dedicated bicycle brake by 50%. Hold Z on keyboard or Brake on touch. This does not change reversing or steering, and Space retains its original hop/carriage-brake behavior. Four visible finishes are available: terracotta free, river/olive/ivory eight florins each. Every component is paid for only once; refitting owned parts is free. Equipment cannot change mid-attempt or before reporting a completed test.

The actual bicycle has a remodeled enamel frame, split fork, brass lugs, shaped stitched saddle, wrapped grips, crank/pedals and mail satchel. The old wheels, scale and physical contact footprint remain. The nearby shop display reflects the same finish and lever. The workstand uses existing local art and an already-licensed scroll; no new third-party asset requests are introduced. Existing optimized facades, interiors and art-quality budgets remain.

## Optional street test

Mark the road test at the bench. Walk back to your parked bicycle and mount it. Only crossing the first start ring northward begins the clock. Ride the five sequential marked stages on the same central street just beyond the shop, weaving left/right and stopping in the final braking ring. The finish requires ground contact and low speed, not merely touching a trigger while flying through it.

There is no entry fee, forced deadline, automated steering, automatic reward or teleport. Normal traffic/collision remains. Missing a gate means approaching it again in order; Nearby's Road test tab shows the next stage and permits free cancellation. The markers exist only during an opted-in run so they do not clutter the regular city.

A completed clean stop stores a pending result. Physically return to the shop on foot and report it. The first report earns 40 experience and 25 florins once. Repeat attempts update a personal best, not an unlimited money/experience source. The timer is a personal practice measure, not a competitive synchronized multiplayer score.

## Saves and safety

The existing save key/outer format and all original, life, street and city records remain. A new validated cycle record stores owned/equipped parts, best result, pending completed report and reward status. Active attempts are intentionally not restored at the workshop spawn. Recovering or entering a basement cancels an active attempt without penalty. A finished pending result survives reload so it can still be reported. Unknown part IDs and malformed times are rejected.

## Verification

The 15 new pure model tests use explicitly placed fixtures; they are not gameplay recordings. They cover costs, prerequisites, floor checks, old saves, variant tradeoffs, braking, unchanged carriage motion, ordered swept contacts, stopped finish, return gating, repeated rewards, cancellation and reload. Together with retained tests, 112 local checks pass at preparation time.

The new browser test starts with a fresh game, earns its florins from physical letter deliveries, rides to the original shop, completes A Better Fit, purchases/refits equipment, rides every stage, stops, returns, reports and reloads using ordinary controls only. It does not seed a save or write live actor, clock or reward state. Retained original/interior/art/clock/touch workflows remain independent regressions. Actual captures and runtime manifests must be reviewed before publication.

Source preparation is not acceptance: the one-time scripts/prepare-cycle-works.py refuses changed baseline/output hashes and creates ordinary Git blobs only. No acceptance workflow invokes it or modifies runtime sources. Its temporary workflow is removed from the final branch. Local browser execution was blocked by the environment; hosted CI provides native HTTP/WebGL evidence. Physical phone, Safari, gamepad and frame-rate measurements remain open.
