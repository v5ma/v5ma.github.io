# Rainward v0.10.0 / Field Ready

Live audio initialization now creates the reverb impulse at the browser context sample rate. The previous 24 kHz impulse was accepted by offline 24 kHz tests but rejected by ordinary 44.1/48 kHz contexts. New tests exercise four sample rates and require live non-silent output after a permitted user action. Mono output retains independent caption direction, including sounds behind the camera. Failed graph construction closes its temporary context rather than leaking it.

Each of the six expeditions now has its own shelter slot. The original single-slot checkpoint is imported without deleting or overwriting it just to show a menu. Continue restores the most recently saved expedition. Continue Selected restores the chosen chapter. Starting a new chapter does not erase another one; restarting an occupied chapter asks for confirmation and only replaces its own slot. Saving remains an explicit shelter action, except the initial shelter created when starting a new chapter. Unsaved progress is not silently autosaved when leaving.

The save bank has a previous-bank backup and validates checkpoints before loading. A failed primary write leaves the earlier bank and legacy mirror unchanged. Storage may be unavailable in private browsing or on full devices; the game reports the failure. The backup is local, not a cloud backup. Do not clear browser storage to update the game.

The satchel now contains controller-reachable selection buttons for the sidearm, rifle, medkit, bottle and smoke. Buttons show equipment state and finite counts. Keyboard 1/2 selects sidearm/rifle; 3 cycles tools. In Survival mode H selects the medkit, then holding fire/F applies the timed bandage action. Classic controls remain available. Reload is LT+X in Survival and X in Classic. Closing the satchel cancels an unfinished held craft and refunds its reserved materials once.

The roadmap has 64 deliverables across release foundation, flagship vertical slice, combat/stealth, campaign/world, art/animation, sound/music, accessibility/performance, and release/production. Every row has a priority, responsible discipline, acceptance criterion, dependencies, status and evidence where available. Roles are unassigned disciplines, not invented staff; effort and budgets are unestimated.

The next content goal is an owner-approved 15-20 minute Floodgate vertical slice with stronger hero animation, environmental art and first-time-player readability. Proposed desktop 1080p/60 fps and reduced-tier 30 fps targets are not measured claims; target hardware must be named and tested. Human acceptance gates stay blocked until dependencies and reviewer sign-offs exist. Full VR, native packaging and multiplayer are separate decisions.

Canonical status is in production-plan.json. AAA_CHECKLIST.md is its readable GitHub checklist. roadmap.html provides filters and local review marks; those marks do not edit the repository or change delivery status. The older v0.6 board is archived.

Model tests validate deterministic behavior. Native suites exercise the HTTP/WebGL game and real Web Audio. Simulated gamepad tests do not certify physical controllers, Bluetooth, audio devices, artistic quality or enjoyment. Published-file hash verification proves deployment, not gameplay correctness. Workflow outcomes and saved reports are authoritative.
