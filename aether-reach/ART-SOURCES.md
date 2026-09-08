# Arrival Quay art sources and modifications

This first graphics-focused pass uses finished, freely redistributable artwork instead of treating primitive geometry as final production art. Runtime copies are stored in `art/`, not fetched from the creators' services by players. Every payload's SHA-256, bytes, source, author and transformation are recorded in `art/manifest.json`.

## Licensed source artwork

| Source | Creator | Public source | License |
| --- | --- | --- | --- |
| Downtown City MegaKit **Standard** | Quaternius | https://quaternius.itch.io/downtown-city-megakit | CC0-1.0 |
| Street Lamp 01 | Josh Dean / Poly Haven | https://polyhaven.com/a/street_lamp_01 | CC0-1.0 |
| Potted Plant 01 | Rico Cilliers / Poly Haven | https://polyhaven.com/a/potted_plant_01 | CC0-1.0 |
| Pavement 03 | Dario Barresi and Charlotte Baglioni / Poly Haven | https://polyhaven.com/a/pavement_03 | CC0-1.0 |
| Sandstone Blocks 04 | Rob Tuytel / Poly Haven | https://polyhaven.com/a/sandstone_blocks_04 | CC0-1.0 |
| Kloofendal 48d Partly Cloudy | Greg Zaal / Poly Haven | https://polyhaven.com/a/kloofendal_48d_partly_cloudy | CC0-1.0 |

The free Standard architecture ZIP's SHA-256 is `5b1a945576d54cdbb4ccc9c3d52711e6d530da74c74c586407ecc28b165335da`. Its included license is reproduced in `art/QUATERNIUS-LICENSE.txt`. No paid Source edition, paid engine shaders, creator marketing renders, logos, account credentials or private narrative were imported. Poly Haven's asset license expressly permits redistribution: https://polyhaven.com/license . CC0 legal text: https://creativecommons.org/publicdomain/zero/1.0/ . Credits do not imply creator endorsement.

## Processing and integration

Thirteen selected architecture modules were combined into a single-buffer GLB library per profile. The game assembles facades, doors, moldings and slate/dormer roof strips inside the two original Quay building footprints. Doorway artwork does not add enterable rooms: the existing buildings remain solid.

Lamps and plants were simplified from the selected 1K models. Hidden pot pebbles were removed. Desktop and mobile prop geometry differ; all material images are resized and converted to WebP. Model variants have embedded binary/image resources, without runtime CDN or remote texture dependencies. Shared meshes and materials are instanced rather than duplicating geometry memory for every placement.

`tools/pack-quay-art.mjs` records the build transform using glTF Transform 4.2.1, meshoptimizer 0.22.0 and sharp 0.33.5. The failed first GLB export left no partial runtime: the revised packer consolidates source buffers before export. Actual output hashes, rather than a promise of byte-identical re-encoding on every OS, define the committed release.

The three loader utility files under `vendor/` come from Three.js **r177**, matching the existing renderer. Their `three` imports were made local. Three.js's MIT license is retained in `vendor/LICENSE`.

## Scope and verification

The mechanical map, collisions, quests, weapon rules, upgrades, economy, rail physics, Foldwing and saves are not replaced by imported art. Per-asset failures preserve the original visible fallback and do not prevent starting the game. The smaller profile is used on narrow displays and recognized Quest/Oculus browser agents; that is not a physical headset performance certificate.

Compare the actual matching before/after frames recorded by `tests/quay_browser.py`. Its gameplay captures use normal input at the same spawn. Its architecture plate is separately labeled as a fixed-camera renderer fixture, not evidence that a player reached that aerial position. Gameplay regression and source-restore gates remain independent of visual judgment.

This is the Arrival Quay art benchmark, not a claim that the entire city, all characters, weapons or the unmerged living-city expansion have finished artwork. No private authoring source was read or bundled.
