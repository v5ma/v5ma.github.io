# The living-town expansion (v0.3.0)

This extends the same Leonardo's Guild map, not a replacement prototype. The original 45 houses and folio mission, controls, joystick, graphics preferences and local save key are preserved. Four new northern buildings and 160 metres of northern terrain create a garden district beyond the original gate.

## Play the additional stories

Press **T**, or the Talk touch button, near a named resident, cat or marked object. Dismount before talking. **N / Journal** opens commissions, relationships, discovered interiors and character attributes. **R / Magic** casts Lantern once Ada has taught it. J/K remain staff/brace. There is no map teleport; a selected side commission adds a blue destination to your normal map.

Six marked houses have real open doorways, walkable collision spaces, cutaway roofs, furnishings and characters: Leonardo's workshop annex, Ada's apothecary, the Copper Cat inn, the mayor's hall, Bartolo's cycle shop, and Sofia's conservatory. The last is in the unlockable north garden. Buildings without an open signed doorway remain scenery. The workshop and inn have basements accessible at marked stairs; both return by those same stairs. The inn cellar requires helping its innkeeper. Vehicles stay parked outside.

Nine side commissions form a dependency graph, in addition to The Stolen Folio:

1. Ink and Feathers — Leonardo, Ada and a return to the workshop.
2. The Missing Copper Cat — Beatrice, Pippa and the inn cellar key.
3. A Light Below — a three-symbol lock and Ada's Lantern spell.
4. The Missing Guild Receipts — a warrant, magically revealed evidence, the thief Rocco and the mayor's charter. Peaceful surrender is available with evidence; no civilian violence is required.
5. The Garden Beyond the Gate — a basement cog, the original repaired waterwheel, the charter, and a pump repair. The north gate opens physically so you can ride through it.
6. The Brass Courier Circuit — three neighborhood stamps and a bicycle permit, with no forced timer.
7. Colors of the Garden — pigments for the painter Isabella.
8. A Clearer View — field readings for Sofia at the conservatory.
9. Skyward, One Day — sailcloth, wind readings and a compass unlock Leonardo's flying-machine design. **Piloted flight is not implemented in this release.**

## Character and town life

One-time quest rewards, unique deliveries and completing the original folio grant experience. Ten bounded levels award spendable points in Vitality, Riding, Ingenuity or Empathy. The points change health, riding, focus/spell duration or the new shop prices; they are not merely labels. Earned florins buy restoratives and unlockable Courier/Cargo cycles. Both are actual bicycle variants with gearing/capacity and visual differences. The original bicycle and pedal carriage remain.

Three cats inhabit the town. Helping Beatrice allows Pippa to follow through streets, with simple collision avoidance; this is not a full animal pathfinding simulation. The new named town residents include the mayor, city watch, artisans, an archivist and a cellar thief. The watch participates in the investigation, not a citywide wanted/police simulation. Existing background citizens continue walking.

The player is explicitly an adult apprentice (22); Isabella (26) and Sofia (28) offer optional nonsexual friendship/relationship scenes after their own commissions and conversation. A relationship is not bought, required by a quest or a promise of multiplayer. Characters can instead remain friends without penalty. This first relationship implementation relocates the consenting companion to a garden meeting place and preserves that relationship locally; it is not a complete life simulation.

Lantern is explicitly alternate-history magic. It consumes focus, has a cooldown and reveals the cellar ledger. The bicycle and future flying machine are fictional Leonardo workshop inventions, not asserted historical artifacts.

## Persistence and boundaries

Existing `svgn.leonardos-guild.v1` saves, outer JSON version 2, remain compatible. The new validated `life` object stores quests, known flags, one-time rewards, attributes, bikes, relationships and discovered rooms. The transient location, focus and basement camera are not loaded into a potentially blocked location; as before, a continued save begins at the workshop. No other game saves are cleared, and no accounts, payments, Supabase schema or multiplayer services are changed.

## Verification scope

Node tests include the full nine-commission chain, old-save migration, unique rewards, door/cellar boundaries, gate prerequisites, trade, attribute spending, bikes, friendship and magic. These deterministic fixtures explicitly set starting positions and are not native gameplay claims.

The new served WebGL journeys separately cover a fresh ink commission/interiors/puzzle and documented resumed saves for the evidence investigation and northern repair/merchant path. Those browser runs use keyboard and UI actions without live actor, clock or progress assignments. The original complete first commission and joystick suites remain required independent regressions. Source hashes and failed captures are retained by read-only CI. Hardware speed, all optional human routes and enjoyment need further playtesting.
