Vesperfall 0.16.0 / Goldwind.

Goldwind is an explicit physical-bow control preset inside the existing game, not another game, new campaign chapter or claimed reconstruction of In Death's private source. Use the menu's Goldwind physical bow button, or choose Goldwind in Settings / Bow controls. Classic is retained as the default so an existing player's bindings do not silently change. Xbox shortcuts, keyboard/touch, and all crossbow controls remain unchanged.

Player experience and scope.

The player chooses a firing position with the same hands that shoot, defend and reposition. A combat arrow remains selected while a temporary golden travel arrow is acquired and released. A short escape is a deliberate thrown disk, not a grip-button dash. Ammunition selection is a physical reach near the bow. Test these relationships in the existing Open Line court, gallery and refuge before generating more architectural arrangements.

This follows the user's Pasted markdown(20260917-220755).md, especially its physical-interaction sequence and instruction to prove one excellent authored encounter before reusable generation. Its descriptions of In Death are reference material, not verified internal algorithms or measured numerical specifications. No commercial assets, code, characters, maps or sounds are copied. The public studio library was reconciled with current master acf522b290b051479c8d7868bee560635b0a9c8c and the verified 0.15.0 source. Open Line's screen, staircase, watcher, return gate, AR table and legacy generators already exist and are not credited as new Goldwind features.

Right-handed physical bow controls.

The left hand holds the bow. Bring the right controller near its string, hold the right trigger, pull, and release to fire the selected damage arrow. Standard arrows stay unlimited; special ammunition retains its existing stock and unlock rules.

For travel, instead hold either A or B near the string, pull, and release. This draw is latched as a golden Blink projectile without changing the selected damage arrow. Movement happens only when that projectile resolves a valid landing through the existing swept-collision simulation. Both buttons together act as one travel hold; releasing only one while the other remains held does not fire. Pressing a combat trigger during a travel draw, or a travel button during a combat draw, cancels and requires release before another acquisition. An input pressed away from the nock cannot acquire merely by sweeping through it while held.

By default there is no teleport path or destination ring in Goldwind bow play. The optional aiming-aid preference displays a gold path only during an active travel draw. It uses the same predictor as the actual projectile and does not authorize invalid landings. It never displays the destination ring. Classic preview behavior remains available in Classic mode.

Hold the right grip to hold the short-range disk. Move the hand deliberately and release to throw. Recent valid tracked movement determines velocity; holding and dropping, sparse or discontinuous samples, tracking jumps and invalid poses do not trigger a step. The disk travels as a bounded swept projectile, then relocates only on a valid supported-ground impact within four metres. A continuous unobstructed ground route, actor footprint, destination clearance and enemy clearance are still required. This is an escape/repositioning action, not an ability to cross gaps or travel through cover. A successful landing spends one existing regenerating shard charge; a refused throw/impact does not spend it.

The left trigger raises the existing directional Wardglass shield at the bow hand and hides the bow while guarding. Its actual normal, guard cost, break/recovery and collision still determine blocking. It is not omnidirectional invulnerability. Left grip operates a nearby mechanism. The Goldwind shield setting can swap these two actions, providing bow-grip shielding and bow-trigger interaction. Both handedness roles reverse together.

Hold either X or Y to reveal five damage-arrow models near the bow. Reach to the desired model with the other controller, then squeeze its trigger to select. The highlighted ring indicates the candidate; dark rings indicate unavailable arrows. An empty or locked choice cannot change ammunition. Release the face buttons to cancel without changing selection. The three-second tactical focus reserve slows combat, not head or hand poses. An already held trigger cannot select at acquisition, and selection does not release a combat arrow.

Click the draw-hand stick to pause. Click the bow-hand stick to switch weapon. The crossbow intentionally retains Classic trigger, grip, reload and face-button behavior; its existing in-headset manual remains authoritative. The physical bow preset is not a full arbitrary button-remapping system. Existing saved handedness, draw length, movement and audio preferences remain.

Safety and lifecycle.

Held draws, held disks, physical quiver and uncommitted disk flights are transient interactions. Pause, source loss, invalid reach, session visibility loss, a preset change or controller/hand takeover cancels them without a stray shot or charge. Fresh neutral input is needed before reacquisition. A disk is not serialized in midair: a save/pause cancels its uncommitted movement before charge spend. Golden arrows already in flight use the existing projectile/save contract. Real head offset is subtracted when synchronizing the rig after valid movement; no forced head rotation or camera sweep is introduced.

First-person VR shares the actual cathedral and physics. Bare hands continue to operate the existing spatial menu through joint pinches and target rays, not fabricated gamepads. They do not perform bow combat. AR Sanctuary remains stationary: artificial golden-arrow and disk travel are unavailable. The Architect's Table remains discovery-limited paused inspection and restores the suspended layout. No room scan, physical surface anchor, furniture occlusion or full AR campaign is introduced.

Save, layout and rollback contract.

Goldwind does not alter hollow-dominions-1, returning-bell-1 or returning-bell-2, earned rewards, profile/envelope keys or authored geography. Its explicit settings are stored separately under vesperfall-goldwind-v1 and also participate in the existing controller settings interface. Reverting to Classic never clears a save. Roll back by a scoped forward commit restoring the former action owner while keeping supported layout readers and all earned progress; never reset master or clear localStorage.

Engineering and evidence.

The model lives in goldwind-model.js; goldwind-xr.js installs the mode-specific owner after existing menus and hand UI. Temporary shot type is passed to VesperCore.fire, never implemented by swapping the selected inventory type. Disk flight and relocation are model rules; rendering does not grant a teleport. Legacy actions are delegated unchanged when this owner is not active. The first-bell coach provides preset-specific hints but keeps its outcome gates.

The added pure-model tests explicitly use fixtures for state-machine faults and collision edge cases. The browser journey exercises real game-owned controls, projectiles, models and the authored chapter with synthetic Xbox and WebXR poses; it does not assign actor position, health, ammunition, time or quest progress to manufacture a pass. Existing Surestep and Returning Bell journeys remain preservation checks. Read the exact release evidence under tests/evidence/goldwind-0.16.0/ before crediting a particular revision as verified-public. Failed traces are retained separately.

No physical Quest/Xbox approval, human comfort or frame-rate certification is claimed. Physical tests still need upward/near-face draws, tracking occlusion, varied arm reach, left/right use, accidental disk drops, headset sleep, quiver selection under threat, repeated preset changes and sustained complex-scene performance. Passing an emulated pose sequence does not establish those properties.

Roadmap integration and next opportunity.

The work advances V02/V04/V18/V19/V24/V41/V45/V49 and retains V65/V68 boundaries. V24 becomes Partial: the throw exists but richer generated vertical encounter families and physical approval are not complete. The canonical 76 task IDs and six-sheet workbook remain. Next, use real players and physical devices to evaluate whether the controls make the existing court/gallery tradeoff more intentional; then encode proven encounter motifs with distinct walking, shooting and Blink connections, stable IDs and independent deterministic random streams. Do not multiply weak encounters or recreate the already shipped chapter.

Technical input reference: https://www.w3.org/TR/webxr-gamepads-module-1/ . The xr-standard trigger and squeeze indices are interpreted separately from profile-dependent face buttons; state is copied each frame. No headset/system button is commandeered.
