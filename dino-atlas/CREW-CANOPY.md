# Crew and Canopy / 2026-09-12

This release completes the retained Northstar Canopy software work and introduces licensed, rigged human staff plus original Fieldlight shaders. It upgrades the existing game, without replacing its 64 residents, 30-species library, saved journals, vehicles, economic ledger or older activities.

## Start here

Chief Ranger Mara is just outside the visitor center. Park, leave the jeep with Y / F, approach her and press A / E. Seven named staff have contact labels and job briefings linking to the existing field study, roundup, boat salvage, Canopy Circuit, Storm Response, fossil survey and coastal race. Menu > Reserve crew and Fieldlight shows their roster and offers a tracked introductions assignment. Speaking to all seven and returning to Mara pays 600 credits once. Remote roster entries pin locations, not automatically complete introductions.

Staff use the CC0 Kenney Animated Characters Survivors mesh, living-human male/female skins and Idle/Run clips. They pause when approached, face the ranger and pace short collision-checked service areas. They are scripted staff, not autonomous combat AI. The player can use either human skin or return to the original procedural ranger. Asset loading is asynchronous and failure leaves functional fallback figures rather than preventing the game from starting.

## Northstar Canopy

The unfinished signature-facility module has been recovered rather than discarded. A ribbed glass canopy, illuminated crown, service lockers and a two-flight exterior ascent supplement the original building. The marked airlock crosses the existing safety rail explicitly; it is not a fake walk-through wall. A five-stage on-foot drill visits the entrance console, interior seed relay, roof wind sensor, canopy spine and return report. Four physical consoles serve five stages; arrival and report share one console. The first completion pays 750 credits. Replays retain timing and completion count without repeating the first payout.

## Fieldlight

New GPU shaders add rolling water-normal highlights, shoreline foam, dusk coloring, angle-dependent canopy glass and restrained research-map displays. These are original shader additions for the pinned Three.js r177 WebGL engine. They do not implement ray tracing, depth-based water simulation, full-screen bloom or real scene reflections. Classic mode restores the original materials immediately. Reduced Motion freezes decorative shader motion; gameplay physics and necessary character motion remain active. No new full-screen flash or camera shake is added.

## Inputs, saves and provenance

All new panels use the shared Xbox A/select, B/back, directional focus and stick scrolling. X remains reload, Y remains board/exit. Existing save namespaces stay separate. The reward sanitizer now retains all explicitly supported Living Herds, Northstar and crew payout identifiers across reloads. Crew state uses dino-atlas.crew.v1; Northstar retains dino-atlas.northstar-signature.v1.

The asset source, original license and SHA-256 receipts are in assets/crew/. tools/build-crew-assets.py reproduces the optimized glTF from checksummed official sources. Runtime character files and Three.js loader dependencies are served from the game's origin. No paid asset, external login, font download, analytics or asset-service request is required.

Kenney source: https://kenney.nl/assets/animated-characters-survivors
Three.js reference: https://threejs.org/docs/pages/ShaderMaterial.html
Three.js loader reference: https://threejs.org/docs/pages/GLTFLoader.html

## Verification boundary

Model/physics/save tests include the prior game plus rig/animation parsing, independent skeleton clones, contact restrictions, save isolation, reward retention, reversible shaders and real exterior-stair support. Native Chromium/WebGL acceptance exercises controller contacts, the introduction payout/reload, shader compilation, avatar selection and asset-failure fallback. Northstar and older story/study journeys remain separate regressions. Distant positions use declared test fixtures. Human art review, actual speakers/headphones, physical Xbox hardware and consumer-GPU performance remain open production gates. This is not a claim of finished AAA production quality.
