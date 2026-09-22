# River Prism 0.11.3 / Coherence Pass4

Blade changes and menu synchronization no longer call Three.js's drawing-buffer resize when the pixel ratio is unchanged. Genuine quality/device-scale changes remain supported; active XR presentation is excluded from screen sizing. This removes confirmed unnecessary resets without weakening the existing stall safeguard or changing gameplay.

Duck Armada's banks now use sloped ground, irregular stones and narrow geometric reed fans instead of block walls and cone reeds. The visible terrain and the water's authored bed share one height function. Wet shading follows the actual tide, and the existing eight trees are grounded on its dry plateau. A brighter sky and bank detail reuse the water's procedural texture. AR hides solid banks/trees and retains its saved opacity; Mothership keeps space.

Both source and live-site jobs on52b054d1a29411d5f1d302cbefb791aacb9eb89f passed162 native checks each, including both complete Arcade battles. Source322 model tests pass and117 public files match. The resize negative/fixed test records four old calls versus zero fixed calls at unchanged resolution. Exact artifact hashes, results and earlier failures are saved in modules/environment/PUBLIC-PASS4.json.

The three module sources remain Water0.1.0, Fire0.1.3 and Trees0.1.3. The integration pass changes RiverArt and tree grounding, not core collision/scoring, weapon controls, audio, XR/Rotunda logic or saved records. Classic rhythm, lessons, Practice Lab and Floodgate remain available. No private hub, portals or other games are included.

Actual source/public entry images were reviewed. The result remains stylized, with sparse crowns and approximated reflection, not the reference demos' full realism. Physical Quest/Xbox/touch, long-session performance and owner approval remain open. Earlier Pass3 and initial Pass4 source failures are preserved even though this final named build passes. The final closeout is documentation/evidence only after the tested runtime.

For continuation, read the module CHECKPOINT, PASS4, PASS4-COHERENCE and ROADMAP. Fuller foliage, bark, flame/smoke irregularity and device-informed polish remain Pass5 work. Blade-color switching, either-blade base rewards, color-match bonuses and gameplay hazard-radius feedback remain separate unfinished mechanics.

Historical module acceptance remains in PUBLIC-PASS1.json, PUBLIC-PASS2.json and PUBLIC-PASS3.json. Rotunda's earlier interruption repair is documented in INTERRUPTION-RECOVERY.md; its original world-anchored UI and session contracts remain unchanged. Unchanged UI components still identify their0.11.0 revision while the host/browser title identifies0.11.3.
