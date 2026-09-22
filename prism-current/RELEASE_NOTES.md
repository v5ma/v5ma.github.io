# River Prism 0.12.2 / Friendly Current

Easy is now the first-play default. Easy, Normal, Hard and Ultra Hard have separate encounter profiles with different object counts, enemy spacing, approach times, repeated volleys, damage and health supplies. Select one before starting through the scene Difficulty page or the accessible text controls. A valid saved choice is restored. A paused battle cannot be relabeled as a different difficulty.

Ducks and airplanes linger much longer and throw fruit and purple blocks. The old invulnerable red missile emitter is gone. Purple blocks can be sliced, shot or shielded. Easy and Normal omit explosive bombs. Hard and Ultra Hard retain distinct spiked bombs for ranged shooting or shielding. Either blade can cut fruit in all modes; Easy and Normal do not require the arrow's direction, while Hard and Ultra Hard do.

Mint plus-symbol cases heal when cut, shot or touched, once per case and never above HEALTH 100. Easy supplies five cases restoring up to 30 each; Normal three at up to 25; Hard two at up to 20; Ultra Hard one at up to 15. A stage-anchored health gauge clearly labels the number, bar, damage, healing and low-health state, alongside the controller/floor status display. It is not attached to the player's head. Unchanged status text is no longer repainted/uploaded on a timer, and its textures upload during loading before audio.

Neither chapter has a boss at startup. Admiral Quack and the mothership enter at beat 152, about 69 seconds into the existing 89-second song. The redesigned duck flagship has a crown, paddle wheels and twin fruit mortars. Its core opens after the entrance. Actual boss defeat and song completion still determine a clear.

A new B/Y start/resume press in XR now works immediately after another menu action. It no longer disappears inside the preceding pointer-click debounce. Native/polled selection latches, held-button checks, one action per frame, controller/session checks and the performance safeguard remain.

Old River records remain untouched; new clears are stored separately by chapter, input mode, difficulty and Arcade/Cruise. Water, Fire, Trees, shoreline, soundtrack, controls, Classic rhythm, lessons, Practice Lab and Floodgate are retained. No new flamethrower, private hub, portals or changes to other games are included.

The exact runtime is c5c426dd9082336768c7a08bfc6f88fd3915a03f. Its public receipt matches all 124 checked files. Its dedicated source tracked AR/VR suite passed all 35 checks and completed both Easy chapters after real damage, healing and block interactions. The public tracked replay passed seven checks including real damage and healing, then hit a rendering-stall pause before its remaining sequence. It is not a complete public gameplay pass. All 359 local model/lifecycle tests pass. qa/friendly-current-public.json and PLAYABILITY-CHECKPOINT.md preserve companion outcomes, failures and continuation steps.

Physical Quest/Xbox/touch, sustained performance and owner balance/readability acceptance remain open. Blade-color switching, color-match bonuses and gameplay explosion danger-radius presentation remain unfinished. The earlier either-blade base reward request is now implemented; new scenery is not a substitute for the owner's Easy playtest.

## Historical 0.11.3 / Coherence Pass4

Blade changes and menu synchronization stopped requesting a drawing-buffer resize when the pixel ratio was unchanged. Genuine quality/device-scale changes remained supported, with active XR excluded from screen sizing. The coherent shoreline added sloped banks, irregular stones and geometric reeds, shared water/ground depth, tide-following wet shading and grounded trees. AR hides solid banks/trees and retains saved water opacity.

Both source and public jobs for 52b054d1a29411d5f1d302cbefb791aacb9eb89f passed 162 native checks each, with 322 model tests and 117 public-file matches. The resize reproduction recorded four old calls versus zero fixed calls. These are historical results, not approval of every later gameplay update. Exact artifacts and prior failures remain in modules/environment/PUBLIC-PASS4.json.

Water 0.1.0, Fire 0.1.3 and Trees 0.1.3 remain reusable. Earlier receipts are PUBLIC-PASS1.json through PUBLIC-PASS3.json. INTERRUPTION-RECOVERY.md retains the older audio/session repair. Fuller foliage, bark, organic flame/smoke and device-informed polish remain opportunities, subordinate to the player's current playability feedback.
