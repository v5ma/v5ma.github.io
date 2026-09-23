# Mill Bell acceptance input review

Runtime 470d56178a6c20191df730d69236cf9be874ab8d remains unchanged. The initial hosted run is 35826997755. Source review found that the observation-led driver could hold movement immediately after a menu/session transition, conflicting with the game's deliberate neutral-input rearming. This is a test scheduling defect, not permission to bypass the live input gate.

The corrected driver offers eight ordinary released samples after entry/resume before driving. Two isolated tests execute the actual embedded driver with a frozen player object and verify initial/repeated neutral intervals without any actor assignments. Local total is now 478 game rules and 12 original soundtrack rules. All hook, release, gallery, early delivery, real finish, save and XR assertions remain. Native results are still pending at this checkpoint. Physical approval is not implied.

Only this test and its regression are changed. No runtime control, physics, geometry, saved state, workflow or sibling code is modified. Continue the automatically scheduled exact-source run after this correction and preserve any previous results instead of relabelling them.
