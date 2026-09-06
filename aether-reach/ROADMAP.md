# Review → plan → build → playtest → revise

The canonical public plan is [roadmap.json](./roadmap.json), with the [Kanban UI](./roadmap.html). It now tracks 35 tasks / 58 prerequisites. The companion workbook preserves controller, XR and physical-QA planning and adds combat review and formula-driven weapon tuning. Local board/workbook edits do not commit to GitHub.

## This review cycle

The v0.2 release established device support but did not change the visible game enough. B01–B05 address that directly: distinct equipment and a scoped viewfinder, buy/upgrade decisions, physical drops/caches, independent looking with adjacent rail detours, and differentiated silhouettes/landmarks. Read [REVIEW-03.md](./REVIEW-03.md) for the actual reference material and native test corrections.

A model success is not a player approval. B06 records encounter balance, ammunition demand, path readability, rewards and full mission replay with alternative loadouts. Preserve the complete foot route and accessible controls.

## Next concrete multiplayer slice

N01 defines authority and protocol; N02 requires two actual browser clients that see each other's movement and rail transitions in a shared room. N03 validates shared loot claims, currency, ammunition and damage on the server. Do not call a local patrol a remote player or show a fake connected lobby. No backend or account service is deployed by v0.3.

## Device continuity

I03, X04 and X05 remain physical Xbox, Quest 3 and headset performance gates. X07 is a real tracked magnified optic, distinct from flat-screen camera zoom. Climbing/gliding are developed separately before integration; no forced rail-follow head orientation is permitted. Hardware comfort and performance require measurements, not desktop screenshots.

All work remains public mechanics/placeholder assets only. Private narrative is excluded. Future publication status and exact verification receipts are recorded in the corresponding pull request, not inferred from a task's implementation state.
