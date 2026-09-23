# Rainward / Currentworks integration checkpoint

Owner request: integrate the public prism-current/modules/environment graphics library alongside the planned Rainward level upgrades. Read FUTURE-DIRECTION.md, DEVELOPMENT-HANDOFF.md and the current source before continuing. This record must be updated with actual implementation, tests and publication receipts rather than left as a chat-only plan.

Baseline inspected: repository master c31dd6c56a101aec7c8a890768ae1f845494b294. Rainward runtime remains e361025f37bc19e836ee18328cb9da239d361f32 with later documentation. Preserve Reclaimed Places, all seven chapters, current and legacy saves, finite resources, input remaps, no-fatigue default running, characters and all four XR modes.

The library's Water 0.1.0 and Trees 0.1.3 use a supplied Three namespace and host clock. Rainward bundles Three r177; the library was tested against r184. Do not replace the engine or infer Rainward compatibility from Prism receipts. Use exact locally vendored library bytes with source hashes and review shader composition, reduced graphics, native rendering, portal and waist-AR clipping, preparation and disposal in Rainward. No second renderer, game loop, storage owner or input layer is allowed.

Bounded implementation target: the Conservatory's three existing shallow water footprints and a curated replacement for its old card-based trees, coupled to one archive maintenance return loop operated by the existing archive-pages task. Preserve the original sluice puzzle, lens/core locations, seed task, rewards, water depths and shelter coordinates. The route must reconnect before the sluice, remain usable by enemies, and remain optional.

Fire, Toon and Cloudlets are reviewed library options, not promised additions in this pass. Do not turn Rainward into a toon demo or add expensive volumetric effects without a gameplay/atmosphere role and separate r177/XR validation. Preserve the library upstream and sibling games.

Status at this checkpoint: source/API investigation only; no new runtime integration or completed Rainward shader/device test is claimed yet. Next: implement the adapter and geometry, run compatibility and normal-input tests, commit directly to freshly reconciled master, verify actual served files, then update this record and FUTURE-DIRECTION.md with the exact result. Physical Quest/Xbox and human quality/performance acceptance remain open.
