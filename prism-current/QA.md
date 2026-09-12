# Practice Lab v0.5.0 verification

The release discussion and source/publication receipts are in [PR #120](https://github.com/v5ma/v5ma.github.io/pull/120). Read the actual final workflow outcomes. A written test procedure or an implementation checkbox is not proof of test or publication success.

Current implementation boundaries are described in [PRACTICE_NOTES.md](PRACTICE_NOTES.md). The active production path is [AAA_CHECKLIST.md](AAA_CHECKLIST.md). Previous Tidal Bloom and Control Room verification records are preserved verbatim in [QA-v040.md](QA-v040.md).

The source gate runs all Node tests, including golden original chart/audio buffers and Practice Lab plan, PCM, record and application lifecycle fixtures. The new native browser suite uses real stereo audio and production WebGL for two unaccelerated 75% section passes, automatic repetition, cancellation, controller pause/mixer/disconnect, a return to full-song mode and save reload. The full Tidal suite also exercises the weakest-section shortcut after a complete song. Existing desktop, pointer, emulated XR and full-resolution art acceptance remains.

Native HTTP navigation is blocked locally by the development environment; source/public browser acceptance runs in GitHub Actions. Reduced software-rendered gameplay buffers are functional tests, not consumer-hardware performance measurements. Physical Xbox/Quest, sound-output latency, comfort and creative listening approval remain open. Practice Lab currently runs in the browser; AR/VR retain full-song play. Slowing playback lowers pitch.

After merge, Verify published Prism Current must match the exact committed game/documentation hashes and pass public legacy-song, controller/mixer, Tidal and practice flows. Revert only this release on current master to roll back, retaining unrelated game upgrades. The new practice save namespace may remain on the device during rollback. Full-song records are not migrated or deleted.
