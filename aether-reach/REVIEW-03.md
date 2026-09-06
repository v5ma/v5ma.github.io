# Arsenal / traversal review cycle

## Reference study

- Irrational's developer explanation describes Sky-Lines as a freight network enabling movement and combat: https://irrationalgames.ghoststorygames.com/insider/ken-levine-explains-sky-lines/ . Its linked video was not available for full playback during this review. The design response is independent sight, nearby visible rail targets, meaningful detours and carried release momentum rather than a camera tour.
- Valve's June 2023 Counter-Strike loadout/buy revision: https://steamcommunity.com/games/CSGO/announcements/detail/3702568031467132889 ; contemporaneous account https://www.hltv.org/news/36438/counter-strike-2-update-swaps-dust2-for-mirage-introduces-interchangeable-weapon-loadouts-selling-during-buytime . Limited earned credits should create equipment tradeoffs; this demo does not claim Counter-Strike round/matchmaking rules.
- BioShock Infinite first-hand walkthrough: https://www.gamerguides.com/bioshock-infinite/guide/walkthrough/act-3-the-hall-of-heroes/chapter-07-soldiers-field/soldiers-field-welcome-centre . Upgrades need actual effects. This project implements capped weapon damage/reload and shield-capacity purchases, not the original narrative or progression.
- Epic's historical Chapter 5 Season 1 description and official weapon/environment screenshots: https://www.fortnite.com/news/join-the-fight-in-fortnite-battle-royale-chapter-5-season-1-underground . Weapon roles, supplies, found gear and modification choices inform the four original weapon profiles and exploration caches. This is not a claim about today's Fortnite balance.
- Population: ONE developer feature page and climbing screenshot: https://www.populationonevr.com/ . Vertical movement and squad combat should reinforce each other. Climbing, gliding and actual multiplayer remain separate implementation tasks, not inferred from local bots.

## First implementation and review

Four mechanically distinct weapons, a real flat-screen 4x scope, local earned-credit economy, once-only drops, three active enemy patterns, district landmarks, and two rail detours were added. The original journey and device adapters remain regressions. Private narrative was not accessed.

The first native run exposed a stretched rail HUD obscuring the centre view, overlapping phone controls, and two timing-sensitive inputs. The correction explicitly clears the legacy bottom anchor and separates the touch weapon bar from movement/action/health controls. Scoped tests wait for the real modal-close state rather than assuming a click completed its asynchronous close handler. Rail tests wait on elapsed simulation time, not a fixed wall-clock pause on a slow software renderer.

A deliberate airborne catch input is now buffered for at most 0.30 simulation seconds through the release cooldown. This does not jump, steer or catch without an explicit request; it still requires range, visible eligible geometry and a clear approach. Incoming speed above cruise decays rather than being clipped on the next frame. Model tests include early input, unrequested flight, expired requests and retained momentum.

## Acceptance boundaries

The native test must buy the sniper, aim through actual camera magnification, hit a target, collect its physical drop, buy a real upgrade, continue the saved kit, and use another loadout. The rail test must jump and catch a different line with ordinary inputs, then reach its endpoint without a rescue. Model fixtures are separate evidence, not native play or enjoyment certification.

The optic changes flat-screen camera FOV only. XR headset projection is untouched; an embodied magnified scope is a separate task. Physical Xbox/Quest tracking, performance and comfort are still unverified. Single-player credits are not secure networked currency. Real multiplayer requires two-client replication, server authority, shared loot ownership and latency/reconnect tests. No private story, remote credential, copied franchise art or audio belongs in this public build.
