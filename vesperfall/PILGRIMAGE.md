Vesperfall 0.17.0 / Pilgrimage.

The new-player path now starts with Goldwind physical bow controls and the two-chapter Pilgrimage. The Lantern Causeway precedes The Ashen Archive; a blessing separates them, and the second blessing continues into retained Endless. Classic remains selectable and an explicitly stored Classic preference is respected. Existing saved expeditions retain their own layout, mode and continuation. The authored Returning Bell, First Bell, Bellkeeper Oath, practice and the unscored AR Sanctuary remain available. These are playable initial chapter families and a bounded procedural pipeline, not a completed final campaign, new boss suite or reconstruction of In Death's private source.

Design basis and intended learning.

The user requested Goldwind as default and a procedural pipeline with new chapters. Their supplied archery reference proposes a hierarchy from campaign route through modules, role-based encounters and decoration, separate forms of reachability, deterministic independent streams and stable saved identities. Their place-mastery brief emphasizes purposeful alternatives, recognizable service returns, consequential mechanisms and designed recovery. The shared studio manual, Vesperfall recommendations, review framework and industry notes were reconciled with master b74cc4d1849aded501b9f28576596efac5f5a407. The already implemented Open Line cathedral and Goldwind actions were retained, not recreated as new features.

The player should learn that opening a direct crossing also opens a firing lane, that an overlooking route changes what can be seen and shot, and that a service descent can return through a gate first seen from the refuge side. That knowledge should transfer between runs without requiring identical geography. We vary arrangements of this relationship rather than scatter interchangeable rooms and enemies.

The Lantern Causeway.

This is a processional signal road. Two relay lanterns have gone dark; the far beacon needs both restored. A sheltered arrival establishes the objective before the first court. Wind courts or split courts offer three approaches. The central ground crossing is short but its shutter blocks both movement and projectiles. A brass release can be shot with an ordinary arrow to lift it. The elevated wind gallery provides a view into the court and a winch that can raise or lower the same shutter. The opposite ordinary service flank does not require the shutter or finite ammunition.

The player may reach each relay through the stairs and operate it nearby, or obtain a clear shot from below and strike it. A live enemy can intercept that shot. Defeating every defender is not required. A lower service descent reaches the interior latch of a gate visible earlier beside a distinctive refuge marker. Opening it creates a real saved shortcut, not a cosmetic door. The chapter's two encounter modules are separated by a quieter connecting refuge, then end at the far beacon. Restoration plus an explicit exit interaction gives the ordinary one-time sector reward.

The Ashen Archive.

This chapter changes the visibility problem. Reading galleries sit above book-service circulation. Column halls and split stacks interrupt firing lanes; a physical ceiling limits high projectile arcs that were possible outdoors. Two archive lenses must be unsealed, by proximity or a real shot, before the reading-room exit can be used. The same learned shutter and service-return rules remain dependable, but columns, stacks, module handedness, defender composition and the connecting corridor alter approach and exposure.

It intentionally reuses the tested interaction vocabulary, rather than inventing a second control system. The physical upper route and lower bypass remain available. A missed release shot consumes no irreplaceable key: Standard arrows are unlimited and the ordinary gallery route remains usable. The roof is actual collision, not scenery through which a supposedly valid Blink is granted.

Generation pipeline and its boundaries.

Campaign stage selects an immutable family: lantern-causeway-1 or ashen-archive-1. Each family has two authored module variants. A deterministic geometry stream chooses variants, which side holds the gallery, the spacing between modules and a bounded lateral offset. Two compatible ground sockets are joined by real corridor floors with a tested elbow. This is a finite catalogue assembler, not arbitrary placement, Wave Function Collapse or an unbounded reject-and-retry search.

Each module records entrances, exits, region identities, floor elevations, shutter conditions, three route descriptions, a supported upper landing, release and relay shot lines, role-based enemy anchors and a service return. Ordinary walking, conditional direct crossings, projectile lines and Blink landings are separate contracts. A graph connection alone does not grant traversal. Production walkability and support queries validate ordinary paths and placement footprints; dedicated tests use actual movement, swept arrows and Blink prediction followed by flight.

Geometry, encounters, supplies and decoration use independent seeded streams. A decorative random draw cannot reshuffle enemies or supplies. The seed and chapter identity produce stable floor, solid, mechanism and pickup IDs. Enemy slot numbers remain stable for the existing combat/save contract, with an additional descriptive stable role ID in module metadata. Tier is snapshotted at expedition creation, not changed by a later achievement. The current tier vocabulary is deliberately modest and does not claim continuous skill-adaptive difficulty.

Each chapter currently contains two encounter modules, nine named regions, six defenders and five pickups. The cast reuses existing combat behaviors: a court volley, a gallery angle and ground pressure in each module. Stationary gallery archers have an actual firing position; ground enemies are not credited with nonexistent stair navigation. Module families and view-blocking geometry differ, but the release does not introduce new AI states or promise full stalking/navigation simulation.

Mechanisms, collision and recovery.

A shutter's mesh height follows its authoritative solid. Its raised state exposes the direct crossing and firing line. Closing is refused when the player or a live enemy occupies the destination volume. Gallery and service alternatives remain open in either state. Service gates only open, and their collision is removed before restoring a saved player inside the former barrier. Their upper glazing lets the familiar arrival marker be seen before the latch is used.

All required goals can be reached by ordinary movement with unlimited Standard arrows or proximity interactions. Blink offers supported upper approaches but is not a mandatory key. A refused teleport leaves the player where they were; ordinary stairs remain. The thrown disk retains Goldwind's supported-ground, short-range rules and does not become a gap-crossing exemption. Neither a missed arrow nor opening a gate makes a chapter insoluble.

Controls and presentations.

Fresh settings use Goldwind. A valid saved Classic selection wins over the default; switching presets never clears progress. Xbox down D-pad remains immediate Blink, left D-pad remains usable damage arrows, and menus retain navigation priority. Existing crossbow controls and the consumed-button handover correction remain. First-person Quest play uses the same geometry, collision, targets and objectives. Head pose is never assigned for a reveal.

The journal and floorplan show known regions of the actual chapter. In-headset chapter notes and known-place lists share the existing paginated menu. AR Architect's Table reconstructs the suspended seed, stage, tier and mechanisms and only reveals discovered regions. It remains paused inspection, not third-person tabletop combat. Bare-hand pinches operate menus, not archery. No room scan, physical anchor, furniture occlusion or forced real-room travel is introduced.

Save and version contract.

Do not modify hollow-dominions-1, returning-bell-1 or returning-bell-2 to generate these chapters. Their readers remain intact. A new checkpoint stores the new generator ID and a bounded pilgrimage state containing version, stage, tier, immutable layout signature, two shutter flags and two gate flags. Existing checkpoint fields retain player state, live enemies, projectiles, supplies, discovered regions, targets, counters and rewards.

Restore regenerates the exact family from the saved seed/stage/tier, checks its signature and reconstructs mechanism collision before validating the saved position. Unknown versions, mismatched stage/tier/signature, malformed flags and forged objective states are refused rather than relocated silently. The entire existing profile/checkpoint envelope and atomic reward receipt system remain. A legacy expedition finishing its current sector does not silently enter this new campaign. A new Pilgrimage advances Causeway to Archive, then to Endless, retaining earned equipment and counters.

Graybox observations and software evidence.

Initial model traversal found stair-support lips, an upper-slab edge that clipped the ascending body and a service descent overlapping the upper bridge. Those were corrected in geometry, not hidden with player relocation or looser collision. The service-return test also exposed an invalid sideways shortcut through a separating wall; the test now walks through the actual opened gate and arrival apron. The wall was not removed to manufacture success. Signature validation was expanded to include tier even when a tier happens to retain the same roster.

The new model suite samples 48 seeds in each of two chapters, varying tier, both gallery orientations and all four tile families. It checks ordinary .42-metre-radius body clearance and mechanism states. Separate input-driven model tours operate shutters and relays, fire actual arrows, restore live projectiles and reload inside opened gates. An upper Blink is predicted and then actually flown before walking back down. These are model observations, not proof that every possible seed is enjoyable.

For seed BELL-01, the complete gallery/service-return tour measured about 281 metres and 77.5 simulation seconds per chapter, including deliberate shortcut exploration. The direct relay-shot tour measured about 87 metres and 25.3 seconds. These are different complete plans, not a fair minimal-distance benchmark for three otherwise identical paths. Continuous generated movement took no damage in those samples; that does not establish that every approach is equally safe or that human players will understand it.

The rendered test uses real production movement, live enemies, ordinary ammunition, actual ray/swept collisions, Goldwind controller poses, hand-menu joints and save/reload. It never assigns actor position, health, inventory, time or objective progress to create an end-to-end pass. Malformed-save and fault-state fixtures are labeled model tests. Local Chromium navigation was blocked by the execution environment; it was not bypassed or counted as a pass. Native browser checks run in the repository's normal GitHub Actions environment.

Read tests/evidence/pilgrimage-0.17.0/publication.json for the exact final source, actual accepted counts, failed traces and served-file hashes. This design document is not the publication receipt. A successful model test, browser run, merge and public deployment are distinct facts. Physical Quest 3/Xbox tracking, sustained performance, comfort, seated/standing reach, unfamiliar-player understanding and repeat-player agency remain open. Representative graybox-first stone, roofs, stacks and markers are not finished production biome art.

Roadmap and continuation.

The original 76 task IDs and all broad gates remain. This work advances V05/V15/V24/V34/V35/V49/V50/V52/V56/V57/V65/V66/V68/V70 without claiming the campaign, boss, hardware or human-research goals complete. V70 is Partial because two new chapter families exist, not because the final campaign is finished. The next useful observation is whether players predict the shutter's exposure, recognize the service return and deliberately change their approach on a repeat run. Tune a module whose relationship fails before multiplying the catalogue.

Rollback should be a scoped forward commit disabling new campaign entry while retaining both new save readers and restoring the prior UI preference default where appropriate. Never reset master, remove a saved layout reader, clear localStorage or overwrite sibling-game work. No commercial map, mesh, texture, code or narrative was copied for these chapters; existing pinned dependencies and asset licenses remain.
