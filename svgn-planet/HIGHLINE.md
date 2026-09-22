# Highline / playable vertical-city checkpoint

The main entry is still svgn-planet/index.html. Select Play Highline / taller rooftop adventure on the welcome screen or from the original city pause menu. The same Highline case is available through Lantern Ward's mission list. It is optional and available immediately; it does not require finishing the old Night Watch campaign. Selecting it preserves previous progress and grants neither rewards nor equipment.

Meet Sal in the old loading loft. He lends the service grapple and cape rig for this case. Follow the cyan way-in route and gold task marker to Ada's upper archive at 10.8 m, the Print Exchange observation landing at 17.2 m, and the Radio Tower repeater at 23.6 m. Two sentries patrol the 10.8 m crossing after the archive discovery; the 17.2 m crossing bypasses them. The maintenance call can distract nearby same-level sentries. Neither combat nor a particular approach is required to restore the repeater. Its green light and the sentries standing down follow the saved mission stage.

Return to Sal's familiar 4.4 m loft for the recording, then bring it to Mara at the depot. The 240-credit Highline reward is recorded exactly once in the existing campaign ledger. It does not grant the old chapter's 600 credits, Signal Hijack's 180 credits, resident rewards or the older campaign's 950 credits. Completing Highline keeps its traversal kit available without falsely completing Rooftop Run. The sender on the recording is a future story question, not another implemented chapter.

Xbox retains X interact, A hop, held LB+RB glide after borrowing the kit, D-pad left scan, and the current aim/use and tool selection. In the main game's keyboard bindings, E interacts, Space hops, R grapples, L scans and K holds the cape. Release the cape to descend; the stairs remain a complete alternative. Default XR Action controls retain right-grip interaction, X scan and the existing tracked tool/holster and cape controls. Hand-tracking UI and ordinary walking remain available. No gesture, comfort or performance approval on physical hardware is claimed.

## Geometry and recovery

Two shared-data towers use 3.2 m vertical intervals, ten switchback stair flights, actual landings, two upper crossings and five added grapple anchors. The old streets, interiors and 4.4 m crossing remain. Upper facades start above the old hop's head clearance. The Radio Tower base landing closes the descent seam found during actual-input model testing. Geometry, support, collision and guidance use highline-layout.mjs; these are not tall decorative meshes over flat collision.

The save parser accepts supported new altitudes up to the 32 m safety ceiling. Existing save key, chapter and layout identities remain. Mid-glide and grapple saves still recover using the existing safe-position logic. Unknown future data and malformed reward totals remain rejected rather than silently overwritten. Do not roll back to an older height/parser implementation without retaining or exporting new Highline progress.

The standalone recovery renderer now re-exports the same district renderer used by the main game, avoiding divergent geometry fixes. New stairs use two instanced draw groups per flight. Window instances are children of their collision wall meshes, so cutaways hide the windows as well as the wall. Guidance uses an upper graph only for high-level travel and local geometry filtering; all old route and reward journeys remain tested.

## Evidence and limitations

The reviewed local suite passes 452 tests, including the complete older five-case campaign, two fresh-input Highline journeys, upper save/restore and reward contracts, real Three object checks, and all inherited UI/control tests. One new journey uses only stairs; the other performs a real hop, cape flight from the Radio Tower, release and landing on the Print Exchange. These are simulation/input journeys, not rendered browser or physical-device tests.

The first implementation blocked the older low glide at an upper facade and exposed a Radio Tower descent edge. Failed traces are retained under tests/highline-evidence; the geometry was corrected without relaxing the original glide or landing criteria. The local browser could not acquire WebGL2, so no local screenshot or GPU success is claimed.

The new highline-browser.py is wired into the existing source and public acceptance workflows, retaining all older suites. It uses the actual main entry, synthetic Xbox axes, real interactions, a high-altitude save/reload and the final reward check. Its result must be read, not inferred from source tests or publication. Current release evidence and any remaining failures belong in tests/highline-evidence/status.json. Direction and next work are in FUTURE-DIRECTION.md and DEVELOPMENT-HANDOFF.md.

This is a playable vertical graybox, not a finished commercial-scale city. It adds two taller buildings, not a height overhaul of every neighborhood. Further work includes larger rooftop encounter spaces, more functional upper interiors, more expressive ledge/climbing movement, stronger character presentation and authored cinematic events. Physical Quest 3, Xbox, hand tracking, comfort, sustained frame rate and unfamiliar-player understanding remain open.
