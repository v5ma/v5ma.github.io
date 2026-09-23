# Currentworks garden integration / Sky Cycle 0.29

The owner requested the public graphical library at prism-current/modules/environment in addition to the curved 2.5D direction. Continue directly on refreshed master. This initial checkpoint is a plan, not a shipped feature or rendering pass.

## Source and compatibility

Inspected library snapshot: c31dd6c56a101aec7c8a890768ae1f845494b294. Read its README.md, module-manifest.json, AR-LIBRARY.md and actual source rather than assuming every module has the same renderer support. Toon 0.1.0 and Cloudlets 0.1.0 are library additions; Islands 0.1.0 is also present as original compact geometry. The existing Water/Fire/Trees renderer hooks target the separate r184 WebGLRenderer. Sky Cycle retains its pinned r177 WebGPURenderer, WebGL backend, TSL material hooks and existing XR owner. Do not import a second Three version or silently enable unsupported raw shaders.

The bounded first integration uses exact pinned Toon, Cloudlets and Islands source with a small game-local adapter. Retain source hashes and attribution. Pin copied module source in the game so independent Prism changes cannot silently alter a published Sky Cycle runtime. No edits to Prism itself or private hub source.

## Intended playable result

The Waterwheel preview receives modest actual mesh clouds and distinct garden-island silhouettes behind the existing road. Toon lighting applies only to this new decorative composition, not a global material replacement. The market's away/return bends should reveal recognizable landmarks before the rider reaches them; the existing porch entry, gold receiving rails, signs, twelve mailbox targets and high/lower choice remain readable. Background islands are not new collision platforms.

Preserve the existing gentle curved surface and original 2D simulation. The new objects must follow the same mapping and fixed-world AR aperture, while menus, controller rays, headset pose, physics, saves, rewards and documents remain unchanged. No extra steering axis, new frame loop, network request, render target or audio owner. The existing motion preference freezes decoration; Classic/2D must provide a recoverable lower-detail presentation. Hidden decoration must not receive menu input.

## Acceptance before claiming completion

Test the actual pinned module constructors and Node material compatibility, bounded counts, pausable motion, correct curved positions, shared-eye detail, source identity and cleanup. Exercise the real game with ordinary controller input, a genuine paper delivery, both depth lobes, AR/VR menus, reduced motion, view switches and unchanged saves. Inspect actual unobstructed stereo captures. Public hashes and public-origin replay are distinct from source tests. Physical Quest/Xbox, passthrough, comfort and measured frame times remain open.

## Preserve the larger roadmap

This adds library-backed presentation while advancing the planned landmark/sightline pass. It does not claim the optional high-to-high whip connection, independent depth lanes, depth-profile authoring, global receiver fitting, ordered passports, Quarry/Vault chapters or rotunda is complete. Keep those obligations in FUTURE-DIRECTION.md, RESUME-HERE.md and the existing roadmap. Record completed work, failures, exact source and next bounded task as implementation proceeds.
