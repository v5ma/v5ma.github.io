# Aether Reach 0.10.0 - Skyglass Cast

The existing game, Bellwether mission, fifteen rail routes, controller layouts and version-1 saves are preserved. This is a presentation upgrade, not a replacement game or a claim of AAA quality.

## Animated human characters

Tavi uses Quaternius's female Adventurer; nearby wardens/skirmishers/breachers use Swat; marshals/longshots and Surveyor Lio use Suit. These are three distinct, creator-published CC0 character models rather than new arrangements of primitive blocks. The source skin, mesh topology, colors and ten retained animation clips are preserved. Runtime blends idle, walking, moving gun stance, firing, hit and brief death motions. The surveyor's gun is hidden; the Longshot has an original wrist-mounted extension. Movement, aim, hit detection and damage remain controlled by the existing simulation, not the animations.

Each instance has independent cloned bones and an animation mixer. Geometry and materials are shared read-only. A bounded pool uses at most twelve nearby animated actors, six in Light and four in immersive XR. Farther characters and characters whose files fail to load use the old visible procedural silhouettes. Turning animated models off also restores those fallbacks. Real hardware performance is not certified by these limits.

## Skyglass shaders

Dormant tactical rifts now have an original etched spectral membrane: clear edges, an angle-dependent rim and slow turquoise/gold variation. Depth testing remains enabled, so the effect does not reveal objects through walls. Active rifts retain their actual physical cover/medical/turret objects.

Island paving retains its textures and normal PBR lighting with an additional soft, slow cloud-light modulation. The shader is limited to top-facing surfaces and at most thirteen percent darkening. It creates no extra fullscreen, refraction or render-target pass. Existing Prismatic jewels and glass remain unchanged. Light and immersive modes disable cloud movement/shade and use static rift outlines; Reduced motion freezes decorative clocks. The independent Skyglass switch disables the added moving treatment.

The graphics settings use the existing controller focus system: Menu, Settings, D-pad navigation, A for either checkbox and B to return. Existing remaps and saved progress are separate from these local visual preferences.

## Sources and license

Creator: Quaternius. Ultimate Modular Men and Ultimate Modular Women are explicitly CC0 on their official pages and free for personal/commercial use. The selected public glTF files were retrieved from the download folders linked on those pages. Source filenames, download IDs, original SHA-256, derived GLB SHA-256, sizes and retained animation names are recorded in art/characters/manifest.json. Both publisher license files are retained verbatim. The women download's text has the same Males header as the men's text; the separate official women pack page also explicitly specifies CC0.

https://quaternius.com/packs/ultimatemodularcharacters.html
https://quaternius.com/packs/ultimatemodularwomen.html
https://creativecommons.org/publicdomain/zero/1.0/

Packaging is reproducible with tools/build-cast-assets.py and the pinned source digests. Ten of the original twenty-four clips are retained; unused animation binary data is removed, and roughness is set to 0.76. Original geometry and skinning are not remeshed. All runtime files are served locally by this game's Pages deployment; players do not need an asset-service account or a remote model request.

The local skeleton clone follows the documented independent-bones/shared-geometry contract described by Three.js SkeletonUtils. New rendering code and shader formulas are original; the existing pinned Three.js MIT license remains in vendor/LICENSE.
https://threejs.org/docs/pages/module-SkeletonUtils.html

## Acceptance scope

Node tests verify asset provenance/hashes, embedded GLB structure, actual clips, independent bones, correct foot and forward conventions, animation transitions, bounded pool reuse, fallback ownership and unchanged saves. Browser review must render the actual HTTP application, operate graphics controls with the emulated Gamepad API, exercise combat models, compile the shaders and test deliberately blocked model requests. It must report errors rather than treating a static mock-up as gameplay.

Physical Xbox USB/Bluetooth, physical Quest comfort/frame-time testing, long-session memory/performance and player approval of art remain open production gates. This release does not add multiplayer, photorealistic characters, motion capture, voice acting or a finished campaign.
