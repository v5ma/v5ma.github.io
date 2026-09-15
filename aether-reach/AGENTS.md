# Aether Reach

Read DEVELOPMENT-HANDOFF.md, GROUNDED-CAST.md, DEVICE-SUPPORT.md and roadmap.json before editing. Continue the existing game, not the separate living-city experiment. Preserve version-1 expedition saves, user controller remaps, existing gameplay and other games in this repository.

Keep common actions on direct controller inputs. Support fixed A/B/directional menu navigation and the same actions in tracked-controller and hand spatial UI. Hands currently operate menus only, not combat or locomotion. Maintain neutral input re-arming after disconnects or tracking loss.

Run Node tests, Python backup tests, the canonical roadmap renderer and relevant native HTTP browser journeys. Test code must not grant gameplay progress or write actors in browser acceptance. Synthetic XR/Gamepad tests are not physical Xbox or Quest 3 certification. Keep hardware verification false until documented physical acceptance.

Use reviewed commits, preserve unrelated master changes and verify both Pages bytes and release backup roundtrip. Do not overwrite an existing release tag or publish staging tools as game assets.
