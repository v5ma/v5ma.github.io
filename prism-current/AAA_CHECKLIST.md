# Prism Current: AAA-quality production checklist

Active release: Spectral Observatory v0.7.0, 2026-09-12. The user requested a shader-focused upgrade this round. The complete previous task specifications, priorities, ownership, effort, dependencies and acceptance criteria are retained in [AAA_CHECKLIST-v060.md](AAA_CHECKLIST-v060.md). Earlier archives and ROADMAP.md retain the full development history. Stable task IDs below refer to those specifications.

AAA-quality remains the production goal, not a claim of console certification or completed physical-device qualification. Checked implementation is distinct from human acceptance. Development owns implementation/automation, Micah owns creative direction, and a physical tester owns measured device and comfort checks. No physical tester is assigned. P0 is a release blocker within its declared scope, P1 is next production work and P2 is later expansion.

## Current shader milestone

- [x] SO-01 / P1 / Development / M. Add Opal Aurora, Solar Silk and Deep Current analytic shader atmospheres, keeping Classic Jewelbox selectable.
- [x] SO-02 / P1 / Development / M. Add a diffraction halo and dichroic inner jewel seeds without moving notes, changing collision geometry or covering hand/direction glyphs.
- [x] SO-03 / P1 / Development / M. Create floor interference from actual successful hits, with a six-slot uniform pool, short cooldown, bounded lifetime and shared resources. No per-hit lights or new render targets.
- [x] SO-04 / P0 / Development / M. Respect Light graphics, zero intensity and quiet motion. Disable all new effects in immersive sessions and retain original transparent AR composition.
- [x] SO-05 / P1 / Development / S. Persist theme/reaction choices independently of scores and include the controls in existing gamepad navigation.
- [x] SO-06 / P0 / Development / M. Add pool/policy/material lifecycle fixtures, actual browser shader compilation checks, controller preference checks, real-hit validation, resource reuse checks and full-resolution captures. Actual pass results belong in the release receipt.
- [ ] SO-HUMAN / P1 / Micah + physical tester / M. Compare readability, comfort, distraction and visual quality during full songs on real displays before declaring the creative/performance gate complete.

See [SPECTRAL_NOTES.md](SPECTRAL_NOTES.md) for the rendering design, controls, resource bounds and acceptance scope. [PR #127](https://github.com/v5ma/v5ma.github.io/pull/127) records candidate and publication receipts.

## Reliability and teaching: Gate A

A-01/A-02 remain implemented: rhythm/scoring invariants, swept collision, no-fail completion, separate input records and regression tests. A-03 save export/import and recovery remains P0 and is the next implementation priority. A-04's browser/device qualification and A-05's context-loss/long-session testing remain open. First Steps implements A-06 browser teaching, but its five-new-player review remains open. A-07 measured timing calibration remains open. The detailed exit criteria remain in the v0.6 checklist; none is waived by a visual release.

## Music, practice and access: Gates B and C

Tidal Bloom's composition and authored charts implement the content portions of B-01/B-02; human musical and physical-comfort approval remains open. B-03 diagnostics and B-04 browser Practice Lab are implemented. B-05 catalog expansion awaits creative approval, while B-06's subjective mixing review remains open despite its numeric audio audit. Existing songs are not changed by this release.

C-01 authored seated/one-handed charts, C-02 remapping, C-03 accessible visual presets, C-04 complete browser/headset menu acceptance, C-05 physical comfort and C-06 screen-reader/reduced-motion review remain open. Quiet behavior for the new shaders is implemented, but is not a completed accessibility certification.

## Visual production: Gate D

D-01 Jewelbox art remains implemented. This release implements three shader-theme directions within D-02 and expands D-06's screenshot coverage. It does not complete all D-02 stage/art-direction and track-specific-lighting work, nor D-06's full desktop/VR/AR/accessibility matrix. D-03 original controller/hand assets remain open.

D-04 still requires named-hardware frame-time, dropped-frame, memory, latency and thermal measurements over 30 minutes. Desktop 60 fps and headset 72 fps or the selected session rate remain targets, not measured claims. D-05 adaptive budgets/fallback based on those measurements remains open. Explicit Classic/Light fallback is not automatic GPU qualification.

## Progression and creation: Gate E

E-01 progression/unlocks, E-02 validated local chart/audio import, E-03 beatmap editing, E-04 replays/score integrity and E-05 optional competition/localization/packaging retain their open status and original dependencies. No online score storage, camera access, external music or analytics is added.

## Every release publishes: Gate F

- [x] F-01. Keep changes scoped to Prism Current and its own verification; preserve other games and private projects.
- [ ] F-02 / recurring P0. Run applicable tests on the exact candidate and record actual conclusions.
- [ ] F-03 / recurring P0. Commit, merge normally to master, confirm Pages deployment and compare committed files against public SHA-256 hashes.
- [ ] F-04 / recurring P0. Smoke-test the public game, preserve saves and document limitations plus a scoped rollback.
- [ ] F-05 / launch P0. External playtests, critical-defect closure, device matrix, accessibility, licenses, privacy and support remain open.

The release PR records F-02/F-03/F-04 outcomes for this candidate; every future update must repeat them. Historical CR-HW, CR-XR, TB-06, PL-HW, FS-HUMAN and FS-XR remain open under their original definitions. Next: resolve any regression, then implement A-03 save recovery while human shader/lesson/music reviews continue separately.
