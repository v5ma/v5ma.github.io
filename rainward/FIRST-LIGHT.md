# Rainward v0.11.0 / First Light

This release advances the Floodgate opening instead of adding a seventh chapter. All six existing expeditions, both controller presets, required tasks, puzzle gates, ammunition rules and chapter save keys remain intact.

The Floodgate now has six original optional field records: For the next person, The rain garden, Leave one light, A debt settled, The north loading door, and A way through. Their physical stands use the regular Y/E interaction, do not pause combat and do not give ammunition or required-task credit. Collected records are readable in the map journal. Visiting another chapter does not erase them; saving at a shelter records discoveries for that expedition. Previously saved checkpoints without record fields remain readable. Story records and route preferences are optional fields in the existing version-4 checkpoint.

The map journal offers Garden and Freight approaches. Garden recommends the clinic battery first through the rain garden; Freight recommends the spindle first along the exposed eastern verge. These are authored approaches through the existing district, not new difficulty settings or guaranteed safe routes. Suggested next-turn markers use the same collision/navigation grid as the world, never reveal hidden patrols, and never move the player. Already collected objectives are skipped. The plan can be hidden entirely. In-world signs remain even with the guide disabled.

A first-expedition guidance card introduces scavenging, crouch/prone movement, listening, the clinic shelter, and extraction. It uses the selected controller preset rather than assuming LB/RB mean the same thing in Survival and Classic. It is non-modal and can be disabled in Controls and Settings. Opening the map pauses the simulation as before; recording a note does not.

The rain garden gains two real low-cover walls, a weathered pergola, seed trays and wayfinding signs. The walls are in both rendering and collision, and their tops can be seen over when standing. Thin decorative posts sit within those wall footprints. Field records have an unread/read lamp state. Static prop geometry is batched; six records do not create six new loading requests. No external soundtrack, asset service or API key is introduced.

Roadmap work: RW-009 now has an implemented slice design draft (not an approved design lock). RW-010 has an opening readability foundation awaiting unfamiliar-player testing. RW-011 has two explicit approaches with different first-objective order, still awaiting route risk/reward approval. RW-013 has an authored environmental story beat. Their full acceptance criteria remain unchanged. Hero mesh, authored animation, visual benchmarking, human review and hardware performance gates are not marked complete.

The full intended 15-20 minute flagship slice is still a production target, not a measured playtime claim for this increment. No physical Xbox/Bluetooth, subjective art, headphone mix, player-enjoyment or frame-rate certification is claimed by automated tests. The candidate test reports identify exact scope, and the post-merge publication comparison establishes which bytes reached the public game.

## Floodgate slice design draft

The opening asks a clear question: can the player leave a route others can follow? The shelter establishes the two-component objective and why survival matters. The garden offers a legible quieter approach with low cover, while the eastern verge trades shelter access for reaching the freight component first. The clinic supplies the middle recovery point. Market and freight records clarify distraction and exit planning without operating either objective. The quay note resolves the small story: opening one route is meaningful even when the whole city cannot be repaired in a single expedition.

Further slice work should improve the hero's movement and contact animation, author stronger interior art, test the opening with unfamiliar players, and tune the return journey. Do not expand the campaign footprint until this representative segment meets the agreed review gates.
