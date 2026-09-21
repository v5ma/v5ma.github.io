# Dino Atlas continuation

## Direct-master development

The user requires normal updates directly on master. Do not create a PR, staging branch, source-transport payload or temporary source-integration workflow unless explicitly requested. Read current master and the exact target files before editing. Use current blob SHAs for per-file writes, or create a scoped commit on the latest master tree and update the ref with force=false. On a conflict, refresh and reconcile; never reset or overwrite concurrent sibling work.

Read INTEGRATION-AUDIT.md, HANDOFF.md, AAA-ROADMAP.md and the current feature contracts before editing. Historical branch divergence after squashing is not proof of missing changes. Do not repeat the delivered Express, field-operations, Classic launcher, service-loop, portal or rotunda merges. The unported Northstar/crew branches are explicitly classified in the audit; do not copy their old entry, reward sanitizer, shader stack or transport workflows into current master.

## Scope and preservation

Work in dino-atlas/ and only its narrowly relevant existing workflow. Keep other games, shared Pages deployment, repository account settings, private hub/review material and vendor licenses untouched. No new sphere/walking/cross-site portals or mandatory engine migration belong to this Dino pass.

Preserve every existing save namespace, stable mission and reward ID, old activity, public route, user control preference and physical vehicle interaction. Never clear localStorage. Preserve all twelve field assignments, mounted tool origins/ammunition/occlusion, secured-cargo carrier identity, 2x/4x/8x unlimited-duration Express and disarming on brake/pause/input loss/boarding/reload. Existing Xbox, Quest Active and Legacy profiles remain selectable. Frequent gameplay controls stay direct.

Keep the normal full game character-centered inside the stationary portal, with accepted box size/placement, depth through sides/rear, automatic shell cutaway and the three legal top/front states. Never close both front and top. Keep Classic's First-person VR, VR diorama and AR diorama entries prominent. Personal UI is separate from the head camera and miniature-world transform: compact status, deliberate rotunda summon, visible pointer feedback and hidden-surface/input-release protection. Never add a second animation loop or monoscopic postprocessing inside XR stereo. Retain the accessible screen DOM fallback until a replacement is proven.

## Validation and truthful publication

Run npm --prefix dino-atlas test and npm --prefix dino-atlas run check from the repository root. The full suite, not only the prototype test, is required. The existing dino-spatial-console.yml validates committed source read-only; it must not commit or push game source. Its release job may archive only after successful public checks.

Retain real-input browser journeys: spatial-console-browser.py, portal-game-browser.py and express-browser.py for Classic/Tidegate; classic-xr-entry-browser.py; grounded-xr-browser.py; tidegate-browser.py; tidegate-view-browser.py; service-loop-browser.py; living-herds-browser.py; aaa-browser.py; aquatics-browser.py; and field-operations-browser.py with FIELD_CASE=classic,tidegate,air. portal-render-browser.py is a two-eye graphics fixture, not a headset playtest. Consult the corresponding workflow for exact environment variables and artifacts.

Do not assign player, objective, inventory or reward state to manufacture native acceptance. Label model/geometry fixtures and synthetic controller/XR poses. Physical Quest/Xbox, actual hands/stereo/passthrough, reach, comfort, performance, human art and place-mastery acceptance remain open until actually observed. Verify public bytes and public gameplay separately from source tests or a commit. Do not call queued or skipped jobs successful. Keep real failures and accurate receipts in verification/.

The shared level-design library remains a reference, reconciled to current code. Preserve physical, conditional, behavioral and information relationships, useful alternatives and recovery. Do not replace full Classic with a prototype or add map area as a substitute for a complete understandable on-foot/vehicle/mission loop.
