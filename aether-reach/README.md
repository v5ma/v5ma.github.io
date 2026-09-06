# Aether Reach — arsenal and sky-transfer prototype

An original first-person sky-city mechanics project for SVGN Interactive. This is a separate public application; Paper Delivery, Dino Atlas and the Theology Wiki are not replaced. No unpublished narrative is included.

## v0.3 playable candidate

Four original weapons have different magazines, cadence, ray spread, damage, range, reload and meshes. The starting Arc Caster recharges; the Tempest Carbine, Horizon Longglass and Foundry Scattergun have finite reserve ammunition. The Longglass uses actual 4x angular camera magnification in its flat-screen optic. Targets are not auto-hit. Mouse/keyboard/controller aiming becomes slower while scoped; the optic has an explicit exit control.

The player starts with 400 local game credits. Outfitters sells the carbine for 180, sniper for 300 and scattergun for 220. Damage and reload upgrades apply to a particular weapon; shield upgrades expand capacity. New expedition resets the kit; Continue preserves bought equipment, credits, upgrades and once-only pickups. World caches unlock equipment; defeated patrols leave physical salvage rather than awarding their drops remotely. This is a single-player economy, not real-money purchases or a secure network wallet.

Three active enemy patterns are differentiated: a moving scout, a slower armored burst attacker, and a long-range sentry with a visible wind-up. A passive range target near the quay teaches aiming and salvage. Bazaar stalls, greenhouse roof/flowers, a foundry gantry/chimneys and spire solar/beacon structures begin a district-art pass. The procedural art remains an evolving prototype, not the finished visual standard.

Seven bidirectional rails retain the original five plus Gale Market Loop and Prism Detour. Looking is independent of rail travel by default; the previous automatic rail camera can still be explicitly enabled. Jump toward a highlighted eligible line and press interact to catch. The catch needs range, line of sight and a clear body approach; no input teleports the actor. A deliberate airborne catch request is buffered for up to 0.30 simulation seconds through the release cooldown, then expires. Momentum above cruise speed decays rather than being clipped instantly.

Restore the three original district relays and return to Arrival Quay to broadcast. The complete foot route and local checkpoints remain.

## Controls

WASD moves; mouse/arrow keys look. E interacts or hooks a nearby line, Space jumps/releases, C reverses a rail, Shift sprints/boosts, F/click fires, R reloads, Q pulses, M opens the map, Esc/P pauses. B opens a nearby Outfitters kiosk. Z toggles aim, right mouse holds aim, and 1–4 selects an owned weapon. The touch HUD has buy/aim/swap and weapon controls without covering movement/action pads.

Xbox-standard mapping: left stick moves, right stick looks, A jumps, Y interacts, X reloads, RT fires, LT aims, LB pulses, RB reverses, View maps and Menu pauses. D-pad up/down cycles owned weapons; right opens nearby Outfitters. Menus use D-pad/left stick and A/B. Physical pairing and hardware-controller QA remain unverified.

The existing experimental Quest 3 WebXR adapter is retained. It uses independent tracked head/controller poses and does not magnify the whole eye projection to fake a VR optic. The new 4x optical view is FLAT-SCREEN ONLY. A real tracked magnified scope, richer in-headset inventory/weapon presentation, physical tracking, comfort and frame-time measurements remain separate work. Climbing, gliding, embodied reload and multiplayer are not shipped by this candidate.

## Plan and review

[roadmap.html](./roadmap.html) is a searchable, browser-local Kanban backed by [roadmap.json](./roadmap.json): 35 tasks and 58 dependency links. Browser edits/export do not modify GitHub or game saves. The workbook handoff adds weapon balance and combat-review sheets. [REVIEW-03.md](./REVIEW-03.md) records the reference study, failed native observations and resulting corrections.

B01–B05 track this implementation; B06 requires player balance feedback. N02 requires two real clients and server-owned state, and N03 covers shared pickup/economy authority. Local drones are never presented as multiplayer. X07 tracks the true headset optic. Device and private-content boundaries are in [DEVICE-SUPPORT.md](./DEVICE-SUPPORT.md) and [PUBLIC_BUILD.md](./PUBLIC_BUILD.md).

## Development / release

Serve the repository root with `python -m http.server 4173` and open `/aether-reach/`. Three.js r177 is pinned locally; there is no runtime CDN, service key, account or telemetry. Run `node --test aether-reach/tests/*.test.mjs`.

Native acceptance includes `tests/arsenal_browser.py` for the buy/scope/shot/drop/upgrade/save sequence and ordinary-input rail transfer. Existing expedition, interface, touch and device-emulated controller/XR suites remain regressions. Seeded model samples do not replace a native playthrough or certify enjoyment. The final workflows are read-only and public-file hashes must match before a release is called deployed.
