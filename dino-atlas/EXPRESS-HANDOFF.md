# Express controls continuation

Unpublished candidate. Read EXPRESS-FIELD-CONTROLS.md, AGENTS.md, AAA-ROADMAP.md and the latest actual workflow/release evidence. Do not repeat the published portal correction.

This pass implements sustained 2x/4x/8x vehicle speed, shared Active/Legacy input profiles and destination guidance in both existing games. The original 181 tests still pass; the expanded local suite has 198 passing tests. Native/public evidence is pending. Keep failures visible and do not mark INPUT-08a/NAV-08a accepted until actual browser/public gates complete.

The temporary transport workflow must be absent from the final diff. Only Dino files and its established Tidegate workflow may change. Refresh master and compare the exact changed files before normal expected-head merge. Preserve sibling changes and all old save keys. The new preference key stores no armed express state.

Run all Node/syntax checks, express-browser.py for both scenes, and all existing portal/Tidegate/service/Classic tests. New actual-game tests set input values and mock XR sources only; do not move actors or set quest/inventory state to make them pass. Keep physical Xbox/Quest and human readability/comfort gates open.
