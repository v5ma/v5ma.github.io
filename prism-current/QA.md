# Prism Rotunda 0.11.0 verification

ROTUNDA-QA.md and PR #205 record this release's exact source and public outcomes. QA-v0101.md preserves the prior verification document. Historical pass counts do not establish physical-device or human approval of this changed interface.

The new native suite clicks actual scene controls, moves/resizes/rotates the panel, completes both full battles, changes sound during a paused run, verifies Xbox navigation/recovery, exercises all transformed buttons under strict native-shaped AR/VR input, and checks hand pinch, stable placement, movement beyond the former rectangle, opacity, wrist/floor HUD, session exit/re-entry and saved UI preferences. No gameplay score, health, position, boss state or clock is assigned to manufacture a pass. Simulated device poses are explicitly input emulation.

The former DOM route remains an F2 semantic-control alternative. Existing compatibility suites that exercise it explicitly request F2; the new untouched-entry suite separately tests the actual default in-canvas controls. Existing classic-game suites continue at rhythm.html and do not substitute for the main River acceptance.

The final read-only workflow verifies the exact committed source and, after a master push, compares every manifest-listed Prism runtime/documentation file with the live served SHA-256 hashes before running native acceptance. The temporary staging scripts and contents-write workflow are not part of the release tree.

Physical Quest/Xbox/touch, long-session GPU/thermal measurements, ordinary-resolution combat performance, owner feedback and unfamiliar-player readability remain open. Reduced software-rendering buffers provide input/lifecycle evidence; full-resolution scene captures are visual evidence, not hardware certification. Rollback must revert this scoped PR on current master without deleting saved progress or concurrent sibling work.
