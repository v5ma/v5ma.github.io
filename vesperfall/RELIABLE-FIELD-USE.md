# Reliable Field Use / Pilgrim's Kit follow-up / 2026-09-22

This pass completes and refines the physical-supplies direction rather than replacing Vesperfall. Read FIELD-KIT.md for all stock, controls, cache and save contracts. The approved future is recorded in FUTURE-DIRECTION.md, not hidden in a chat.

## Player experience

A finite frost flask is a practical alternative when enemies press the player; a healing vial supports a recovery decision. Arrival, refuge and upper-gallery caches give exploration a useful resupply purpose. Reliable handling matters more than adding another dungeon room before these actions feel dependable. The opening teaches read, use, approach, replenish and continue, while retaining ordinary archery and golden-arrow movement.

The recovered physical throw trace contained valid hand positions at 0, 0.1167 and 0.28 seconds. The rolling window retained two and the old three-sample requirement silently stowed the deliberate throw. Two distinct recent positions now suffice only when chronology, minimum displacement, speed, age and discontinuity checks pass. Motion fixtures at 8, 12, 36, 72 and 90 samples per second exercise this. Stationary drops, slow hand tremor, invalid tracking and stale samples remain rejected without spending an unthrown vial.

A visible cache now identifies its name and actual capped healing/frost yield from up to eight metres, before grip range. It says to approach or explains that the satchel is full. Walls and floors block its affordance and actual reach targeting. Looking away or taking its contents removes the label. The label is object-local; short gain/failure confirmations stay on the existing two-second floor panel. Readability is not a remote pickup: the player must still approach and interact to receive supplies.

## Controls retained

Look down on the free-hand side for HEAL and FROST slots. Grip a nearby vial, move and release to throw, or release without a throwing motion to stow. Bring healing to the mouth and press that controller's trigger to drink. Full vitality retains a drink; a deliberately thrown vial can be wasted. Frost and healing bursts respect walls/floors. A grip spent on the kit cannot become an accidental teleport disk.

Keyboard F drinks, G throws frost and T throws healing. Xbox LB+X drinks and LB+RB throws frost; unmodified controls and direct golden/damage D-pad shortcuts retain ownership. Equipment / Pilgrim field kit supplies scene-rendered alternatives. Bare hands use menus, not bare-hand combat. Caches are collected using existing nearby grip, E or Xbox A; ordinary arrows can break their seals but do not award distant loot.

## Verification and limits

The nine added deterministic tests include a reproduction of the actual sparse-frame failure and new read-only visibility/stock hints. The complete local suite passes 322 tests; the canonical workbook remains unchanged. These are model fixtures, not headset approval. The existing browser journey now also looks toward the real arrival cache through ordinary keyboard input and requires its world-local label before collection; it retains the sampled physical throw, stow, mouth trigger, actual movement to a cache, one-time reward, save/reload, hands, AR and Xbox checks.

Retain the initial failed public artifact 10720337268 from run 35780846097, source 92871871042ebc9078eae276a16477afa2c00d02. Do not relabel that failure a pass. Full public and physical-device acceptance remain distinct. Exact new reports, production file hashes and source revisions belong in tests/evidence/field-kit-0.17.0/ after the run completes.

This repair contributes to existing V30, V41, V53, V57, V65 and V68; it does not promote their broader acceptance status. No new save member or layout identity is introduced. The additive Kit reader must remain for rollback. The optional sibling return hook is preserved. No PR, branch, new workflow, private hub code or other-game modification is part of the change.
