# Sky Cycle development: Route Entry v0.27 recovery

Continue the existing cycling game. The verified live baseline is v0.26.2; the v0.27 route-card upgrade is in PR 213 on `sky-cycle/route-entry-0.27` until its own publication receipt proves otherwise. Read `RESUME-HERE.md` and `verification/route-entry-0.27.json` before reporting a release state.

The source candidate `a2a3eeb06964c4e642a84cf826afe6c955efc99a` adds explicit AR, VR and Screen choices to the eight original cards, preserves the requested route through permission/session handling, and makes unavailable-mode explanations reachable by controller. The headset version label is dynamic. Local tests pass; hosted run `35556641185` has not been accepted at this checkpoint because its jobs were waiting for runner assignment. Do not recreate the implementation or confuse queued jobs with passing checks.

`ROUTE-ENTRY-0.27.md` describes the change and limitations. `ROUTE-ENTRY-PLAYTEST.md` is a prospective physical test protocol, not a claim that a user tested this build. `experiments/route-entry-lifecycle.mjs` retains six isolated asynchronous-policy checks and is not a native game replay.

The canonical `AAA-ROADMAP.md` remains intact. This work maps to its F/G entry, control-continuity and recovery obligations; it does not close chapter quality, physical-device or advanced-editor gates. Keep the public shared `level-design-library/SKY-CYCLE-LEVEL-DESIGN.md` and local `LEVEL-DESIGN-METHODOLOGY.md` authoritative for movement-first level design. Preserve the separate Canal Choice branch and finish useful routes/recovery before expanding destinations.

No private WebXR hub, rotunda implementation, attached multi-game brief or cross-game portal is published by this slice. All campaign IDs, saves, Workshop documents, original physics, remaps and soundtrack ownership remain protected. Follow `GITHUB-RELEASE-PROCESS.md` through exact-source native acceptance, reviewed captures, normal expected-head merge, 37 public hashes and both public route-entry replays.

The previous handoffs are preserved byte-for-byte in `archive/README-before-route-entry-0.27.md` and `archive/RESUME-HERE-before-route-entry-0.27.md`. Resolve their relative references from the original development directory. Do not let historical current-version headings supersede the latest receipt.
