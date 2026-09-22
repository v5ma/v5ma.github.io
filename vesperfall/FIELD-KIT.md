# Pilgrim's Kit / physical dungeon-adventure pass / 2026-09-22

This is the first playable Dungeons-of-Eternity-inspired direction pass, not a copy of its content or a promise of networking. Vesperfall keeps its precision bow, Goldwind travel arrows, Sureflight landings, shields, quiver, existing missions and saved geometry. The new relationship is finite field supplies that can be handled physically and rewarded by meaningful exploration.

## Play

New scored expeditions receive two healing vials and two frost flasks, capped at three of each. Look down toward the free-hand side of your waist. The green HEAL and blue FROST bottle slots carry words and counts as well as color. Reach a slot with the draw controller and squeeze grip. Move the hand and release grip to throw. Release without a real throwing motion to stow; no item is consumed. Bring the green bottle to your mouth and press that controller's trigger to drink. Full vitality retains a drink. A thrown healing vial breaks where it lands and heals within 2.8 metres; throwing it away can waste it. A frost burst interrupts valid nearby enemies within 3.2 metres using the existing Frost damage/status rules. Masonry and floors block both effects.

The bow hand retains its configured shield during a held vial. A held vial owns only the free hand: it cannot become a disk throw on release. Bow/damage shots, current pulls, quiver selection and ordinary supplies retain priority. Pause, tracking loss, a new input source, snap-turn or hand-only takeover returns an unthrown vial without cost. Bare hands can use all field-kit menus, but do not silently become a new hand-only combat system. Two tracked controllers are required for physical play.

Keyboard F drinks, G throws frost and T throws healing. Xbox LB+X drinks and LB+RB throws frost without simultaneously reloading or shard-stepping. Unmodified X, RB, D-pad down Blink and D-pad left damage cycling retain their functions. Pause / Equipment / Pilgrim field kit supplies scene-rendered alternatives and instructions. These menu actions resume ordinary play; no free stock is granted. Screen settings provide the same actions. Existing two-second world-floor feedback reports actual gains and failures, not a head-locked overlay.

## Exploration and progression

Each scored world has Ilyra's field locker beside arrival. Pilgrimage adds a refill in the connecting refuge and a courier cache on the first upper gallery. The upper cache rewards using the existing gallery approach; it does not block or replace the normal route. The refuge offers recovery between encounter modules. Same seed/layout identities and physical circulation remain intact.

An ordinary arrow can break a cache's seal, but cannot remotely award its contents. Reach or approach and interact to take up to one healing and one frost vial, once. A full satchel leaves the cache's supplies available. Golden arrows ignore the seal so a travel shot does not unexpectedly turn into loot interaction. This pass's caches are stationary containers, not dynamic rigid-body furniture. Existing mandatory mechanisms and original power-ups keep their priority. An explicitly aimed nearby cache takes precedence over an adjacent optional story note; looking back at the note still reads it normally.

Remaining stock carries into the next sector. Choosing the existing Provision blessing adds at most one of each vial; other blessings do not refill it. This is not a new crafting economy, randomized weapon tier or achievement unlock. The repeated loop is use, explore, recover supplies and choose an approach, rather than earn basic control reliability.

## Model and save contract

field-kit-model.js owns stock, cache receipts, bounded ballistic flights and status application. The core's fixed simulation step resolves the first swept wall, floor or target hit before a burst. Throws use real sampled controller motion, bounded reach, valid line of sight and a maximum of four simultaneous flights. Tiny drops and discontinuous tracking do not spend a vial. A physically thrown vial can be lost beyond available ground. No body teleport is part of the kit.

The existing version-1 checkpoint gains one optional, strictly validated fieldkit member. It records stock, all three cache receipts and in-flight projectiles. Old checkpoints without it still round-trip without manufacturing saved fields; their first explicit kit interaction initializes the starter allocation once and normal saving persists it. Neither namespace nor the five immutable world identities changes. Suspended or reward-state checkpoints remain exact. Practice and Sanctuary remain unscored and do not provide usable kit rewards. The story ledger and reward receipts remain separate.

Rollback must retain the additive save reader for any newly saved kit states. Disable the new input/view rather than reverting to a parser that rejects the new member. Never clear localStorage or regenerate a player's geography to undo this feature.

## Roadmap and evidence

This bounded addition contributes to existing V30 interaction, V41 accessible input, V53 finite-loot balance, V57 environmental reward presentation, V65 save compatibility and V68 release verification; no canonical task is promoted to human/device approval and the 76-task workbook remains its last synchronized planning snapshot. The next content pass should test enemy reactions and a larger objective-rich expedition, followed by deliberate close-range weapon work. Co-op requires a separate save/authority design and is not implemented here. Sparse occluding AR architecture, four difficulty tiers and production monster art remain separate unfinished requests.

The hypothesis is that trusted hand use and a useful gallery/refuge resupply make route choices more expressive without weakening bow traversal. The primary observation is an actual player grabbing, stowing, throwing, collecting and continuing with the correct finite stock. Local tests cover floor/wall occlusion, multiple Frost targets, one-time cache rewards, real arrow seal strikes, input sampling, exact save/legacy continuation and 64 chapter/seed cache placements. They do not certify hardware feel or enjoyment.

Initial model fixtures used the wrong floor-array name and an unreachable cache hand pose. Those fixtures were repaired to use real geometry and legal reach, not to relax gameplay. The floor-healing check also exposed the need to include floor surfaces, not only box solids, in burst occlusion. Both directions now block a floor-crossing effect. Browser loopback navigation is blocked by the local environment; that is not a gameplay pass. The existing read-only public acceptance workflow runs the actual published game with generated controller, hand and Xbox input, and retains failures and exact source. No new branch, PR, source-writing workflow, remote hub or private asset is introduced.

Final exact-source/public outcomes belong in tests/evidence/field-kit-0.17.0/publication.json. Physical Quest/Xbox tracking, reach, performance, motion comfort, human clarity and balancing remain unverified until player tests.
