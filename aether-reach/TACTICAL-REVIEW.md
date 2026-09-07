# Tactical relay development

This branch adds fictional combat mechanics to the existing public Aether Reach game. The security puzzle controls only a simulated friendly turret inside the game world: it never connects to or modifies a computer, network, account, website, or external system.

Current and Cinder are original left-hand powers using the game's existing collision and damage functions. Water conducts Current; oil ignites with Cinder. The gun remains equipped and has separate ammunition and cooldown. The optional Atrium recovery encounter links environmental preparation, a visible circuit-routing puzzle, a friendly defensive turret and three enemy waves. Survey research and one equipped passive create build choices without repeated-scan reward farming.

The unreleased living-city PR62 stays separate. No content, source code, credentials or narrative from a private repository is accessed. No gameplay or network simulation is claimed to be multiplayer. Existing weapons, rails, Foldwing and version-1 equipment saves must remain usable.

## Release gates

- Model checks: independent gun/power resource accounting, bounds and line-of-sight checks, timed hazards, actual circuit graph connectivity, restricted passive selection, defense success/failure, one-time completion reward and safe save restoration.
- Native HTTP/WebGL: acquire the rig at the Quay bench through ordinary input; survey the real range target; use electricity and a gun together; solve the visible conductor puzzle; ignite an oil patch; defend the actual collector; reload and retain legitimate progress.
- Preserve keyboard, touch, standard-controller and emulated XR regression evidence. Physical Xbox/Quest testing remains unverified.
- Inspect actual captures before claiming visual improvement. Publish only after native tests and exact-file comparison; retain the existing restore-checked GitHub Release backup workflow.

Model tests seed explicit scenarios. Native gameplay tests may observe read-only snapshots, but may not assign actor position, ammunition, health, objective progress or elapsed simulation time. This document is a development plan, not a successful-publication receipt.
