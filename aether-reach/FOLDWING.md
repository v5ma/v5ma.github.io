# Foldwing: optional controlled gliding

Release an elevated rail with Space, then press G to deploy or fold. Xbox-standard B operates the canopy during gameplay; B still goes back in menus. Touch uses the Foldwing button. In the experimental immersive mode, A jumps/releases while grounded/on a rail, then deploys or folds while airborne. Physical Quest comfort and controller testing remain open.

The canopy preserves the release position and velocity. Movement keys or the movement stick steer; looking alone does not change a coasting trajectory. Back/S brakes. The charge supports about eight seconds of uninterrupted flight; land or attach to a rail to recharge. It folds automatically on landing, attachment, depletion or rescue. It is not a ground takeoff, hover or teleport mechanism. Fast falls slow gradually, and the canopy never gives upward thrust.

The existing ground/rail collision model handles landings. The world-space wings are passive visual geometry; they do not move the player. Pulse energy, ammunition, currency and save schema are unchanged. Canopy position/state is intentionally not persisted as an arbitrary airborne save.

This is a first mechanics pass, not a universal guarantee of every jump or a headset comfort certification. Finite pure-model tests cover carried velocity, independent free look, explicit steering/braking, depletion, recovery, save isolation and twelve complete rail-release/landing recipes. The separate native browser test must complete a real keyboard-driven departure, pause/resume, controlled landing and relay interaction without assigning avatar state.

Private narrative and unrelated applications remain outside this public feature.
