# Quay art pass / visual release gate

This is a graphics-first pass on the same playable city. No mission, purchase, damage, collision, rail, flight or save rule is intentionally changed. The model change is a version label only. Two existing closed Quay buildings receive licensed modular facades/roofs, four old corner lamps are replaced, and six old planters receive modeled foliage. Elsewhere, the original city remains; the HDR lighting is shared across the scene.

## Visible changes

Thirteen selected components from the free Quaternius Downtown City MegaKit Standard edition supply detailed brickwork, window moldings, entrances, cornices and slate/dormer roof components. Poly Haven provides ornate cast-iron lamps, terracotta foliage, photographed paving/stone and an HDR environment. Arrival's masonry has an original pale wash; Customs retains warmer brick. The existing equipment receives a limited bevel/reframing pass, not new imported finished weapon or human-hand models. Closed decorative doors are not claimed as enterable interiors.

All 19 runtime art files total 8,262,586 bytes across both profiles. A desktop profile requests 6,598,914 bytes of art; the mobile profile requests 3,300,878, including the shared HDR. This is payload size, not a download-time/FPS promise. Mesh and material sharing reduces duplicated resources. Each failed asset group leaves its old visual fallback. Smaller assets are not proof of physical Quest 3 frame time or comfort.

## Review corrections

- The first library export had multiple buffers, invalid for GLB. The packer now consolidates them before writing; no partial asset files were published.
- The first actual native comparison showed flat brown window panels. Glass/interior materials were retuned rather than claiming a paid interior shader was included.
- Large mirrored sign backs obscured part of the view. World signs now use their authored front; the two facade posters fit their cornice bands.
- Blocky foreground gear was too dominant. Camera-attached box parts receive shared beveled geometry, and the gun/grip are moved modestly away from the view.
- The first renderer-only plate resolved relative assets under a test path and showed fallback scenery. Runtime assets now resolve against their module URL; the final plate fixture uses the real source scene and a correct base URL. Those failed first plates are not release visual evidence.

## What establishes a successful release

Inspect actual matched before/after screenshots. The final fixed-camera plates exercise the real renderer, not generated images or gameplay progress. Separate native runtime checks use only normal controls to verify the shop, field quest, rail entry, low profile and missing-asset fallback. Keep the existing complete expedition, arsenal, tactics, Foldwing, controller/XR and source-restore regressions.

The first integrated native build passed 12 graphics/playability checks; that was not final approval of the polished art. The current PR supplies exact final statuses, source hashes and publication/backup receipts. Technical passes do not substitute for the player's visual judgment. The unfinished living-city branch and all private narrative remain separate.

Asset authors, source URLs, licenses and modifications: [ART-SOURCES.md](./ART-SOURCES.md), [art/manifest.json](./art/manifest.json). The raw license permits redistribution in the public repository and backups. No purchase, account, runtime CDN or API key was needed.
