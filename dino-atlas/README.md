# Dino Atlas: Wild Frontier

The main index.html now opens the vehicle-driven dinosaur reserve. Drive the original cream-and-red Ranger 07 jeep through the gate, survey a plant-eater, restore the research relay, recover the northern field recorder, and bring it back to base. After delivery, free-roam the island and record all six dinosaurs.

The game uses locally hosted Three.js and Rapier 0.17.3. The jeep has four-wheel raycast suspension, steering, braking, collisions, boost, a hop, and recovery. The reserve includes contextual interactions, a map, roaming and reactive dinosaurs, pushable equipment, and a ramp. Dusk, headlights, orbit/chase cameras, opt-in synthesized audio, reduced motion, and lower graphics are available.

WASD or arrows drive. Space brakes, Shift boosts, E interacts, H honks, J hops, R recovers at base, M opens the map, and Escape pauses. Drag to orbit, scroll to zoom, and press C to change camera. Pointer-based mobile controls and standard gamepad mappings are included. Physical-device and gamepad compatibility are not certified.

Open through a static HTTP(S) host, not file://. Run npm start in this directory for the existing local Node server. No package installation, API key, backend, account, or external runtime service is required.

The complete original 2D/3D walking expedition is preserved at walking.html, including the Triassic, Jurassic, and Cretaceous chapters, clues, period switching, and 2D fallback. The fossil lab, quizzes, illustrations, rotating models, and field journal remain at field-guide.html. Existing journal progress and notes are retained. New campaign progress uses a separate dino-atlas.ranger.v1 key.

The vehicle interface is inspired by Bruno Simon's portfolio, independently implemented with original procedural assets. This is an imaginative dinosaur reserve, not an officially affiliated Jurassic Park game, a photorealistic simulation, or a claim of feature parity with Bruno's much larger site. Dinosaurs from different times and places coexist here for gameplay; the field guide retains its evidence and uncertainty notes.

See RANGER-README.md for full controls, architecture, provenance, save behavior, known scope, and rollback instructions. Original third-party licenses remain in vendor/.

Run npm test for the original tests, node --test tests/ranger.test.mjs for new unit and real physics tests, and python tests/ranger-browser.py with Playwright Chromium installed for actual HTTP/WebGL verification. CI artifacts provide screenshots and a report for the specific tested source. The repository's legacy browser checks now visit walking.html; the separate ranger workflow verifies the new homepage.
