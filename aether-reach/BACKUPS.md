# Backups and recovery

The game source, original assets, pinned renderer/license, tests, documentation and canonical roadmap are committed in this public repository. A merged pull request is a recoverable version. It is not a backup of every scratch experiment or expired CI video.

## Durable release copies

Beginning with v0.4.0, a successful public-file verification triggers a separate release-backup job. It packages only committed public Aether source, the root chooser for provenance, the planning workbook and relevant workflows. Each archive records the exact commit and SHA-256 for every file. The job restores it into an empty directory and runs the model tests before creating a tagged GitHub Release. The source ZIP, workbook, checksum manifest, restore-test log and public deployment receipt are release assets, not solely expiring Actions artifacts. A repeated version must refer to the same source; it never overwrites an older release.

The archived eight-sheet v0.3 workbook is now committed at `planning/Aether-Reach-Development-Roadmap-v0.3.xlsx`. All 29 original workbook XML members, including formulas and styles, were preserved; its ZIP container was recompressed. `planning/WORKBOOK-MANIFEST.json` records member hashes. It is a historical snapshot; the current game plan is `roadmap.json` and the public Kanban.

GitHub source history and release assets are still on the same provider. They are NOT an independent off-site backup of a deleted GitHub account or repository. Keep a downloaded release on separate storage too. A full repository-history backup requires a mirror clone; this game-specific ZIP intentionally does not contain all other projects or private repositories.

## Restore

Download the version's source ZIP, `BACKUP-MANIFEST.json` and `SHA256SUMS.txt` from the repository Releases page. Verify the ZIP checksum. With the trusted committed restore script run:

```sh
python aether-reach/tools/backup.py --restore Aether-Reach-v0.4.0-source.zip --destination /path/to/empty-folder
```

It validates all member paths and checksums before writing, and refuses a nonempty destination. In the restored folder, run `python -m http.server 4173` and visit `http://localhost:4173/aether-reach/index.html`. The renderer is included and playing requires no API key. Node users can run `node --test aether-reach/tests/*.test.mjs`. Other chooser links point to projects excluded from this scoped archive.

Checkpoints, equipment, credits and browser-local Kanban edits are still stored in the player's browser. They are NOT uploaded to GitHub by these backups. Clearing browser storage can remove personal progress. Unpublished narrative, account credentials and private source are never included.

To make a fresh snapshot, commit reviewed files, then run `python aether-reach/tools/backup.py --out /tmp/aether-backup`. Tests and ordinary acceptance workflows are read-only; only the successful post-publication release job receives the permission needed to create a tag/release and upload its public archive.

References: https://docs.github.com/en/repositories/archiving-a-github-repository/backing-up-a-repository and https://docs.github.com/en/actions/how-tos/manage-workflow-runs/remove-workflow-artifacts .
