# Dino Atlas: playable expedition

Open index.html through a static HTTP host. It is now the playable 2D/3D expedition, not the original field-guide screen. Control the explorer with WASD, arrows, or touch, approach moving dinosaurs and evidence markers, and press E or Inspect. Three period chapters share the same exploration system and retain journal discoveries between 2D and 3D views. There are six starter dinosaurs, two evidence sites per chapter, terrain boundaries, a lake obstacle, an orbiting third-person camera, a minimap, and a four-discovery chapter objective.

The original fossil lab, journal, quizzes, illustrations, and rotating-model guide remain in field-guide.html. Discoveries use the same local storage key. Expedition clues use a separate namespaced key. No accounts, analytics, network AI, or backend were added to this app. Self-hosted Three.js is used for the new 3D scene; the 2D map remains available when WebGL fails. No adaptive graphics quality is applied.

Run locally with Node.js 22+ using npm start in this directory, or serve this directory with any static server. No package installation or API key is needed. Open through HTTP/HTTPS rather than file://.

The scene is an imaginative learning landscape, not a geographically and temporally validated fossil community. In particular, the Triassic animals represent different places. Animals and trees are stylized original procedural models, not museum scans, anatomically validated reconstructions, or photorealistic assets. The application demonstrates genuine movement and interaction but is not a complete ancient-world simulation. Habitat and anatomy review, exact species ranges, a deeper excavation/assembly system, sound, and substantial content expansion are future work.

The original app modules are core.js, art.js, app.js, world.js, and style.css. New expedition modules are expedition-core.js, dino-models.js, expedition.js, and expedition.css. Vendor files are locally hosted copies of the public repository's existing Three.js distribution; original license notices are preserved.

Run npm test for the original data/journal tests. The public repository's tests/interactive.test.mjs adds campaign, movement, clue, and new 3D model tests. tests/interactive_browser.py checks the actual HTTP applications, including rendered WebGL pixels. CI output, not this README, is the authority for tests that have passed on a particular commit.
