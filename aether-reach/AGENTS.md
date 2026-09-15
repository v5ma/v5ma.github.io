# Aether Reach

Read DEVELOPMENT-HANDOFF.md, GROUNDED-CAST.md, DEVICE-SUPPORT.md and roadmap.json before editing. Continue the existing game, not the separate living-city experiment. Preserve version-1 expedition saves, user controller remaps, existing gameplay and other games in this repository.

Keep common actions on direct controller inputs. Support fixed A/B/directional menu navigation and the same actions in tracked-controller and hand spatial UI. Hands currently operate menus only, not combat or locomotion. Maintain neutral input re-arming after disconnects or tracking loss.

Run Node tests, Python backup tests, the canonical roadmap renderer and relevant native HTTP browser journeys. Test code must not grant gameplay progress or write actors in browser acceptance. Synthetic XR/Gamepad tests are not physical Xbox or Quest 3 certification. Keep hardware verification false until documented physical acceptance.

Use reviewed commits, preserve unrelated master changes and verify both Pages bytes and release backup roundtrip. Do not overwrite an existing release tag or publish staging tools as game assets.

## Authored-world priority, September 15, 2026

The user has redirected the next upgrade to replacing prototype levels with authored chapters and adding first-person XR plus third-person AR/VR diorama presentation. Read planning/AUTHORED-WORLDS.md and planning/bellwether-authored-contract.mjs before choosing another animation or equipment task. Bellwether Blackout is the first replacement showcase, not an invitation to add another disconnected island.

The display enclosure permits open top, open front or both open, never both closed. diorama-policy.mjs enforces that preference invariant and supplies pure coordinate transforms; it is not yet wired into the renderer. Keep the tracked physical head and spatial UI unscaled, and preserve canonical gameplay collision and mission state. Authored building cutaways must not expose sealed rooms or remove collision.

The new route graph is an abstract design audit, not a playable map or geometric navigation proof. The next integration step is the shared Bellwether layout and continuous foot-route blockout using the existing engine, followed by the presentation-root integration. Run tests/authored-worlds.test.mjs in addition to existing tests. Do not mark the new modes, migration or level replacement shipped until normal-input browser journeys, visual review and the applicable physical-device checks exist.
