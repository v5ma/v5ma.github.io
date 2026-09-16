# Neighborhood Missions: Working Quay application

Mapped to existing LEVEL-01 in svgn-planet/production/roadmap.json. Baseline 78dad9840163bbacb7308118cde44a1bb4f525f6 already has Lantern Ward's street/roof/canal routes, water, hoist, return shortcut and native XR. This iteration develops their relationships instead of expanding geography or recreating features.

A continuous visible loading cart creates a short cooperative bicycle approach and a longer timing-independent north loop. The bicycle bell is local and sight-dependent; reached fixed signal posts relay a request in every loading phase. Occupied-lane yielding and safe initialization around an old saved position preserve recovery. There is no new reward, remap or save-layout change.

Read ../../svgn-planet/lantern/WORKING-QUAY.md for the physical, conditional, behavioral, information and embodiment descriptions. Current exact-source evidence is ../../svgn-planet/production/evidence/working-quay-0.12.1/accepted.json. The earlier candidate.json and failed-comparison.json remain historical evidence. Runtime 241a2676d3c117da5bbb25293a6ff0555f3f7d05 passed 222 model tests and 146 checks across all ten browser suites. Live publication is separately recorded in the merge PR and ../../release-receipts/neighborhood-missions-working-quay-0.12.1.json.

The corrected input-only comparison measured a plain crossing at 6.966 simulated seconds with 4.567 blocked seconds, a signaled crossing at 2.450 seconds without blocking, and a north loop at 8.417 seconds over 23.231 metres without a signal or blocking. All remained mounted without menus during the crossing. These are individual controlled starts, not average-player times or hardware performance.

The first comparison failed a hand signal after measuring all three routes. A reached fixed post wrongly inherited free-bell line-of-sight to the moving cart. The code was corrected and the same tracked-controller/hand acceptance now passes. Preserve that revealing failure rather than discarding it or hiding it behind model-only acceptance.

The human test asks whether unfamiliar riders understand loading and choose deliberately, then benefit from that knowledge on return. LEVEL-01 remains needs-playtest. Physical Xbox/Quest, comfort and human comprehension remain open. Next opportunity is useful operational information on existing elevated space, not another map expansion. This peaceful circulation pattern is not a universal combat or movement template.
