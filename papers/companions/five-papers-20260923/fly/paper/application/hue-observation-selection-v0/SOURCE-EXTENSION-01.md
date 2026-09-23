# Exact tracked-cache source check

This extension is frozen before requesting the next public source. The pinned
repository tree already lists `chreyesees/__pycache__` with tree object
`c428c04a7ed2c2e6716db1626cb23147c726bdd0`. Inspect that directory alone at
commit `91cf92581d2abaea72b96a994d69ed6d83ae05f9`, with at most 100 entries and
50,000 response bytes. This is not permission for a repository-wide search.

If it names a tracked `transform.*.pyc`, a subsequent explicit source request
may retrieve that one pinned object for non-executing inspection. Never import
or execute cached third-party code. Do not install an interpreter or disassembler
to force recovery. An obsolete or undecodable cache is not evidence for a
guessed definition. Preserve source type, commit and compatibility limitations.

The goal is to resolve the existing call to the absent `excitation_contrast`
definition, not to infer it by optimizing response agreement. No response data
are consulted by this source check.
