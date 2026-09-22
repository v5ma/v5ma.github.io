# The Living Reserve / First Light

Build living-reserve-20260922.1. This is the playable opening chapter of the proposed original campaign, inside the existing full Classic Reserve. The later missing-team campaign, storm evacuation and full ending are not implemented by this chapter. Tidegate, Storm Response and all existing activities remain available and separate.

## Canon and play

The user establishes a near-future AI Singularity that learned to design creatures by recombining DNA. Atlas uses that capability to create living animals that look and act like dinosaurs, matching known fossil data above the 99th percentile. The opening presents this as Atlas' in-world fossil-fit benchmark, not recovered ancient blood, a claim of 99% original DNA or a measured real-world scientific capability. Fossil constraints, synthesized behavior and actual field observations remain distinct. The AI's success is not made into an evil-AI twist: the mystery concerns changed infrastructure and ignored field reports.

The regular-game introduction offers Play story: The Living Reserve, with the same entry also in the pause menu. Free exploration and the regular screen/VR/AR entries stay intact. Choosing the story starts or resumes it without moving the ranger, replacing the world, erasing a save or consuming a carried object. Other selected activities are suspended, not reset. Choosing another activity suspends story guidance. The two independent story/field save systems retain their evidence.

First Light has seven ordered physical steps: meet senior ranger Mara at the visitor-center bay; quietly observe an actual visible plant-eater from the valley; reach Ivo at the east service stop; inspect the north relay's maintenance record; restore the corridor controller; pass through the reopened physical research gate and recover the survey recording; return to Dr. Leena Rao at the visitor center. The recording points toward Tidegate and the next proposed chapter. This first implementation begins in the regular reserve rather than silently replacing Classic with Tidegate.

These are ordinary in-reach interactions. Work requires stopping on foot and a clear approach; observation needs a live visible resident. No tool firing is needed for the first survey. The restored gate stays open after suspension, completion and reload, and existing original-campaign power is combined with story power so old progress cannot be closed off. No old mission or reward is awarded by the new chapter's explicit actions. Normal incidental exploration can still advance original travel milestones.

Conversations use the existing rendered XR console and accessible screen dialog. They wait for deliberate Continue or can be dismissed. Each completed conversation remains replayable in the story journal, including the origin primer. Essential story text is not a two-second toast. The established floor map, current goal, HERE prompt and two-second temporary messages/history remain. Menu size, floor size and box size are unchanged and independent. No new engine, head-locked board, private hub code, travel portal, shader stack or external asset is added.

The three named staff use the current original ranger model as a graybox character representation. This is not the previously unported seven-staff/rigged-asset package. Production acting, voiceover, facial animation and a full cast schedule remain open.

## Routes and preservation

The existing practice ramp interrupted the initial assumed straight east-fork route: the real-physics ranger stopped at x=9.6249,z=19.5187. The corrected chapter approach goes north of that ramp via the existing clear ground; a visible service sign and instructions explain the choice. The ramp and all legacy collision remain. This is a recorded route-design finding, not a reduced movement requirement or manufactured completion.

The chapter uses dino-atlas.living-reserve.v1 only. It stores stage, tracking and the actual observation. No old inventory, money, cargo, journal, presentation, controller or reward namespace is migrated. Future versions of the story save are protected against overwrite. Completion is idempotent and awards no repeatable currency. The restored corridor is applied before initial physics settling so a ranger saved inside the passage is not resumed against a newly closed gate.

## Evidence and continuation

At the first source checkpoint, 297 Node/model/physics/source tests pass, including the original 285. The new route fixture drives production movement through the real existing static world, gate and return route; it is explicitly not a native browser or hardware playthrough. A static browser layout fixture using the real styles confirms all three regular XR choices remain inside the initial 1100x720, 900x600 and 390x844 viewports after adding the story button.

The native runner living-reserve-browser.py uses ordinary synthetic Xbox input, real collision, dialogue, observation, gate passage and reload. LIVING_XR=1 additionally uses an explicitly mocked immersive session and camera pose with the real story/UI implementation. Candidate and separate public results must be recorded after they actually run; this source document is not proof that they passed. Local full-game navigation is blocked by administrator policy. Hosted verification is used rather than circumventing that restriction.

Work directly on fresh master, scoped to Dino and its existing read-only dino-spatial-console.yml. Preserve concurrent siblings. Do not create PRs, branches, transport payloads or new publisher workflows. The next content work is a genuine Tidegate missing-team chapter that uses the existing service loop and wildlife corridor, after player feedback on this opening. The wider campaign remains under AL-01/AL-05; do not mark it complete from one chapter.
