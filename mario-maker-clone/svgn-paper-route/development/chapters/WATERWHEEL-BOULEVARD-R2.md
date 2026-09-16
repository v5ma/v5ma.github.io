# Waterwheel Boulevard: revision 2 chapter specification

Approved reference-chapter direction, September 15, 2026. Initial runtime baseline: Quiet Water, merged through PR 159 as `a215ecfe7bbd8da5f36932b94a885f156523f92e`. Canonical method: `../LEVEL-DESIGN-METHODOLOGY.md`. The latest delivery-quality acceptance and publication status belongs in `../verification/waterwheel-deliveries-0.24.json`; scope and retained failures are in `../WATERWHEEL-DELIVERIES-0.24.md`. The earlier preview evidence remains in `../verification/waterwheel-lab-0.23.json`.

## Experience and boundaries

Deliver through a working waterside neighborhood, learn how momentum changes the available route, and discover an aerial express connection that repeatedly reconnects with the streets. Ordinary road completion and expressive sky mastery are different, equally valid intentions. The waterwheel ties the journey together spatially.

Revision 2 initially ships as an explicitly labeled editable Workshop preview, not a silent replacement of campaign index 5. Existing `canal-choices` records remain untouched. There are still eight campaign routes. The preview is not a ninth progression destination and is not part of portal new-run travel. The future `canal-choices-r2` record policy is reserved but not active. No preview finish confers a medal, badge, stamp, campaign ghost, daily result or persistent credit award.

## Concrete first layout

The document is 256 by 70 tiles. The seven region starts, in tile columns, are South Quay Post Office at 0, Parcel Market at 24, Service Bridge at 61, Express Junction at 92, Millworkers Court at 135, Waterwheel Galleries at 176 and Wheelhouse Depot at 222. Start is column 3; the depot goal is column 251. Twelve road mailboxes, five checkpoints and four separated shield-supported patrol encounters make the lower road a testable delivery journey. Two broad terraced rises use the unchanged step-up rules. These are authored situations, not a claim of final art or human enjoyment.

The Parcel porch is a complete introductory detour, physically separated from the later express entrance. Its broad curve begins near world x=940 and ends near x=1480. It must return to road before x=2300, without unexpectedly feeding the main network. A sign identifies the return. Ground riders can pass underneath without using it.

The express runway begins near x=3200, rises toward x=4000, and launches toward an open mill crescent. The crescent leads to the postal gallery and then the wheelhouse landing/descent. Stable IDs are `ww-runway`, `ww-crescent`, `ww-gallery` and `ww-finish`. The final receiver must put the rider on a useful road state before the goal at x=9036. The first draft ended too late and landed beyond the goal in the model; the receiver endpoint was moved from x=8710 to x=8550. Preserve that failure as the reason for the correction.

The lower canal collector and mill-court return are initial recovery geometry, not proof of every missed transfer. Their IDs are `ww-collector` and `ww-court-return`. Main-line qualification does not qualify these alternates. The preview has no new grapple peg or movement upgrade; the approved optional whip connection remains a later authoring gate, with an alternate non-whip continuation required.

The wheelhouse landmark stands behind the physical riding plane near x=7930. Nine road-level wayfinding signs describe the current choice, including the short porch, express entrance, canal recovery and depot. Both 2D and 3D draw the authored landmark and cues. Audio, IK, shaders and XR remain the existing systems; no route-specific steering, gravity or collision changes are introduced.

## Transfer ledger

The geometry module contains five explicit transfer intentions: road-to-porch, road-to-runway, runway-to-crescent, crescent-to-gallery and gallery-to-finish. Each names its intended receiver, recovery interval and onward state; road entries also name an approach interval. Metadata status remains `candidate`: bounded model and native cases do not prove every control sequence. The metadata survives the existing document codec and remains available to the authoring tools. There is no new dedicated visual transfer-annotation editor yet.

The initial model matrix varies entry speed 5, 7.5 and 10, takeoff offset 90, 120 and 150, and both Forgiving and Precision grip for the porch and express entries. Its 36 cases carry real isolated rail state after one explicitly seeded road jump. It omits full terrain/enemy/delivery simulation, human input variability and a comprehensive swept body/deck audit. Native browser runs begin through the real UI and use ordinary movement, not seeded rider positions.

## Play and authoring entry

Routes contains `Waterwheel r2 design preview`. The same command appears under the Workshop's Worlds and drafts. The dialog offers the complete layout, the ground-only build with sky removed, the editable blueprint and explicit restoration of the previous blueprint. Dirty drafts and failed backup writes block entry. The previous blueprint is stored only in `svgn.skycycle.waterwheel-preview-backup.v1`; existing libraries and recovery documents are not cleared. A preview playtest uses the original Workshop and returns to that editor.

Xbox dialog focus, confirm/back and gameplay use the established bindings. The same native controls are available to the existing XR UI. Preserve the pointer-required advanced Bezier exception. Do not claim actual hand/controller usability from software tests alone.

## Accepted preview evidence

Earlier exact candidate `53c9a7bc945b031c642f48fb30a80e76ea1d3fbd` passed all nine scoped jobs in run `35034203866`: 223 game rules, 12 original instrumental-score rules and 144 browser checks. All eight native artifact digests and report source identities were verified; 46 PNGs were reviewed. Four first-attempt preview finishes cover ground beneath sky, the ground-only build, the returning porch and all four express sections in sequence. Five additional first-attempt finishes retain prior Tideglass and Sunrise regression evidence on that exact source.

Those v0.23 traversal runs intentionally delivered zero mail. The subsequent v0.24 source `94dbd1176474017a68aa7ae55fee8ae9d8a3d656`, run `35054316372`, delivery job `104661209083`, passed fifty-three checks including all twelve genuine road deliveries and a first-attempt depot finish. Its delivered tile set exactly matches the intent ledger; campaign documents and protected persistent fixtures remain unchanged. The four previous Waterwheel traversal variants also passed on this source. This closes the declared ground-delivery gate, not every combined aerial-and-delivery path. Delivery roles, including the proposed porch-return reward, still need unfamiliar-player and combined-route review.

These suites inspect actual 3D scenery before using the supported 2D view for full CPU-runner rides. Stereo suites use the actual renderer and emulated tracking hardware, not a physical Quest. The receipt controls exact-source XR/regression and public-byte acceptance. No complete XR chapter finish or physical controller qualification is claimed.

## Acceptance and promotion workbook

- [x] Adopt the merged method and chapter identity without changing the game genre.
- [x] Implement an independent ground-only build and editable full blueprint.
- [x] Preserve the existing campaign builders, route indices and award owners.
- [x] Define the short porch and four-section continuous express intention.
- [x] Add explicit transfer metadata and reserved revision record-key policy.
- [x] Attach exact-source native ground-only, ground-under-sky, porch and continuous express finishes.
- [x] Review actual 3D/2D images, controller entry/back and preview restore/save isolation.
- [x] Verify the new geometry and menu flow in the real stereo renderer with tracked input emulation; read versioned receipt for exact source.
- [x] Extend delivery placement into purposeful optional intentions and verify all twelve targets in the declared normal-input ground journey.
- [ ] Verify combined porch/express delivery outcomes and unfamiliar-player interpretation of each delivery role.
- [ ] Author and qualify the speed/brake-selected fork with genuinely useful lower and upper outcomes.
- [ ] Author the optional high-to-high whip link while preserving a non-whip alternative.
- [ ] Complete likely short/early/late recovery and underside routes with swept collision checks and normal-input replays.
- [ ] Resolve the old full optional canal-sequence uncertainty before reusing its pattern.
- [ ] Test checkpoints/retries, muted readability, slower/coasting approaches and reverse re-entry cases beyond the accepted delivery recipe.
- [ ] Implement revision-aware campaign settlement/display and rollback tests before replacing old default geometry.
- [ ] Observe unfamiliar players, then fix misunderstandings and pacing rather than optimizing death counts alone.
- [ ] Qualify physical Xbox and Quest controllers/hands, readability, tracking loss, comfort and performance.
- [ ] Promote the revised default chapter only after its declared gates pass; preserve earlier records and edited documents.

The next fork's exploratory model and native plan are in `WATERWHEEL-BRAKING-FORK-NEXT.md`. A published preview closes only its own software/publication scope, controlled by the versioned receipt; it does not close the entire reference-chapter quality gate. Continue this workbook before expanding Copperleaf or adding another water destination. Human and physical-device observations must be actual observations, never fabricated.
