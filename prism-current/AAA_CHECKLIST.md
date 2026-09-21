# Prism Current / Host 0.11.2, Water 0.1.0, Fire 0.1.3

The active graphics milestone is Currentworks Pass 2. Source and public runtime 783236d7bb4e229d8f9c3461f93070f519f90450 passed both verification jobs. modules/environment/PUBLIC-PASS2.json records the exact evidence. Checkboxes below distinguish implementation, the named automated runtime and still-open physical/creative approval. All recurring gates must be rerun after new gameplay or rendering changes.

Read AGENTS.md before writing. Updates go directly onto reconciled current master without force, PRs or staging branches. INTEGRATION-AUDIT.md is historical branch evidence; its observed old deployment is not the current live status. The complete older board and task IDs remain in AAA_CHECKLIST-v0101.md and earlier archives.

## Spatial interface

- [x] UI-R01 / implementation. One rendered menu for screen/XR, direct chapter AR/VR/screen choices, and explicit semantic text-control alternative.
- [x] UI-R02 / implementation. Summonable pedestal, stowed during combat, with height, distance, scale, rotation and reset. Placement does not follow head motion.
- [x] UI-R03 / implementation. Visible controls and picking remain aligned under transforms. Preserve rays, contact cursor, thumbstick/A-X selection, B-Y start/pause/resume and hand-pinch menu access.
- [x] UI-R04 / implementation. Compact controller score/hull/combo with a floor alternative and brief point/damage deltas. Boss health remains in the world.
- [x] UI-R05 / implementation. Saved AR opacity and independent sound controls. Menu adjustment preserves the encounter. Ordinary movement does not trigger the removed arbitrary positional pause; real tracking/visibility loss still pauses.
- [x] UI-R06 / implementation. Actual session end retains the current paused encounter in page memory for matching-mode re-entry, without reclassifying an XR score as screen play.
- [x] UI-R07 / named automated runtime only. The 783236d7 source and public fire/water/interruption/Rotunda jobs pass. Each has 129 renderer checks and complete Arcade battles; 104 served files matched. Future changes reopen this gate. This is not physical approval.
- [ ] UI-R08 / owner/device. Physical Quest AR/VR, Xbox, touch, seated/standing readability, sound, exit/re-entry, movement, sustained performance and owner approval.
- [x] UI-R09 / implementation and named automated runtime. Cancel stale audio resumes; require visible calibrated matching sessions. Preserve paused state and newer operations. The 19-check interruption suite passes on the named source and public build.

## Reusable graphics modules

- [x] ENV-W01 / implementation. Independent WebGL2 water and ES facade: geometric waves/normals, authored-depth shading, sky approximation, foam, bounded wakes/splashes, CPU query, reset and cleanup.
- [x] ENV-W02 / integration. Observe real River boats/events within the existing recentered stage. Preserve AR opacity, quiet/quality settings, combat, input, sound and records.
- [x] ENV-W03 / reuse. API, coordinate/ownership limits, construction presets, research, tests and continuation checkpoint are saved alongside code.
- [x] ENV-W04 / named automated runtime. Water13 and actual-Three object37 checks pass, with the shared exact-public gate. Re-run after changes; physical water appearance/performance remains open.
- [x] ENV-F01 / implementation. Independent volume-fire module supports bursts, sustained jets and surface impacts, smoke phase, instanced embers, bounded optional lights, paused clock, quality limits, reset/disposal and duplicate-event protection.
- [x] ENV-F02 / integration. Real destruction events trigger Prism bursts. Load density/geometry and the matching display shader before audio, restoring renderer state and disposing the loading target. No extra renderer or per-frame scene pass, flamethrower or new damage rules.
- [x] ENV-F03 / named automated runtime. Fire24 passes on source and public, including prepared/visible program-key equality and no observed first-destruction stall. Fire object/lifecycle64 and all289 Node tests pass. Keep the earlier failures recorded. No change to the 0.35-second safeguard or game rules was used to pass.
- [ ] ENV-T01 / next implementation. Seeded trees/foliage with stable geometry, bounded detail, host-driven wind and cleanup. Preserve approach-lane sightlines and transparent AR.
- [ ] ENV-HUMAN / physical and creative approval. Sustained named-device frame times, stereo appearance, readability, comfort, and owner judgment against the supplied water/fire references.

## Scope and outstanding requests

Preserve RV-01 through RV-06, both chapters, soundtracks, record formats, native-shaped XR input, Classic rhythm, lessons, Practice Lab and Floodgate Recovery. The graphics adapter is not authority to change their rules. No private hub implementation, full combined multi-game brief, portals or sibling-game work is included.

Color-changing blades, base rewards for either blade, color-match bonuses, redesigned missile counterplay and gameplay explosion-radius feedback remain unimplemented. Fire's cosmetic radius must not be described as the requested hazard danger radius. No new soundtrack, chapters, FFT ocean, full hand-only combat or mid-battle save across browser closure is claimed.

Artistic refinement remains necessary. In the reviewed standalone image, the jet silhouette is still regularly wavy; later work should improve irregular turbulent shape, smoke breakup and surface interaction without sacrificing input performance. The low-resolution game capture proves integration, not high-resolution gameplay quality. Approximate water reflection and volume/surface compositing are known limits.

A-03 save export/recovery, accessible charts, calibration, human onboarding, remapping and the full platform/accessibility matrix remain open in the historical board. F-02 source tests, F-03 fresh-master commit plus separate deployment hashes, and F-04 real live input recovery with scoped rollback recur on every release. Do not reset the repository, clear localStorage, lower gameplay requirements to manufacture passes, or substitute emulator success for the owner's reported physical failures.

The next coding session starts from modules/environment/CHECKPOINT.md and ROADMAP.md. All usable source milestones are durable on master; future work should build on the accepted runtime rather than reapplying an obsolete archive.
