Leo's Guild: puzzle expeditions, useful loot and a cooperative frontier.
Design proposal and source notes, September 22, 2026.

This document answers the owner's request about adapting Eye of the Beholder, Dungeons of Eternity and the supplied Realm Online review to Leo's Guild. It supplements FUTURE-DIRECTION.md and LANTERN-ROAD.md. The established approval is Vinci as an artisan settlement connected to a larger fantasy world, with Vesperfall as a farther frontier. The particular dungeon, items, enemies and advancement rules below are new proposals, not implemented features or established NerveGear canon. This documentation pass changes no runtime, release identifier, save, server, Vesperfall code or publication receipt.

Source baseline and distinctions.

Source inspection began at repository commit efdd38a3565a9e34701eacc48c1894a5b82b547c. The current road-core.mjs already contains the solo Lantern Road charter, bound chart identification, recipes, local inventory and reviewed NPC transactions. LANTERN-ROAD.md describes the save-protected page handoff and arrival-specific return from Vesperfall. Do not propose or build those again as missing features. Source presence and an initial test receipt do not prove current public deployment or physical Quest approval. The recorded MMO and player-to-player trade flags remain false.

The Scribd document is the SSI computer-game manual. It describes a four-character starting party, optional recruits, different uses for front and rear ranks, direct item actions, equipment slots, gates operated with keys or levers, camp functions and a bestiary. The owner's pasted Eye of the Beholder review concerns the SNES adaptation and emphasizes brisk navigation, readable interactions and puzzles. Those review judgments are supplied commentary, not independent playtest findings. The later physics-combat, generated-dungeon and promotion material concerns Dungeons of Eternity, not Eye of the Beholder.

Othergate's official description supports physical VR weapons and cooperative/solo play. Its official update notes confirm character promotion and charged Mythic weapons. They also document recovery and usability problems such as missing objective batteries, promotion disconnects and repeated immobilization. The supplied exact promotion cost, level cycle, perk totals, weapon counts and historical Realm prices are not independently established here and are not balance requirements for our game.

The supplied Realm review describes a particular server and period. Its community assistance, housing and dungeon experiences are useful qualitative evidence. Its complaints about shared loot, informal exchange and multiboxing are warnings, not features to reproduce. The supplied AnyFlip address identifies a Dungeons and Dragons 5E Monster Manual, but readable entry text was not returned and its basic reader returned 403. No particular page, monster entry, stat block, artwork or reuse permission was verified from that viewer. Do not treat uploader metadata as permission to copy a publisher's work.

The synthesis.

Borrow puzzle readability and useful expedition roles from the Eye of the Beholder material; embodied interaction and discovery-to-equipment progression from the Dungeons of Eternity material; and belonging, local services, mentorship and player cooperation from the Realm material. Keep Vinci a substantial peaceful game. The shared purpose is to learn something valuable beyond town and bring that knowledge into relationships, crafts and visible civic improvements.

Puzzles should make inventory useful.

An item should do something recognizable in the world rather than merely unlock a higher damage number. Proposed examples are an inspection lens that reveals an authored inscription, a tuning fork that tests a resonant socket, a removable counterweight for a maintenance plate, and survey chalk that marks an explored junction. Reuse one affordance in several places before inventing another bespoke key. Give clues about shape, material, purpose or consequence; never require trying every inventory item against every wall.

Teach one interaction in a safe room, vary one condition, combine it with a route choice, then give a useful consequence. A shutter can redirect light to a receiver; a counterweight can hold the shutter while the player explores; a maintenance balcony can reveal why the receiver is not working. The player should be able to see or trace the result of an action. Merely pressing three unrelated switches is not the target.

Puzzle items need custody and recovery rules. Required tools are supplied or recoverable and cannot be sold, consumed as generic crafting material, or lost in inaccessible geometry. Removing an object from a plate must not trap the only actor able to replace it. A dropped component returns to its established support point without creating a second copy. Wrong attempts produce understandable feedback without deleting irreplaceable resources. Optional rare equipment may offer an advantage, but an ordinary tool route remains viable.

Keep the existing movement, scale and map contracts.

Do not copy a missing automap, forced grid-step camera or tiny click targets. Use the existing continuous movement, Goldwind/Blink where Vesperfall supplies it, level diorama and independent headset tracking. The map should retain discovered stairs, floors, mechanisms and unanswered questions, with optional progressively specific hints. It can preserve mystery by not revealing unseen rooms or solutions. In diorama mode, local presentation and cutaways must not silently change reach, collision or puzzle truth. Decide which clues a high viewpoint legitimately reveals rather than relying on camera obstruction accidentally.

Interactive geometry needs visible targets and one dependable interaction vocabulary. On Quest, preserve existing grip/trigger/action roles in the appropriate game; do not globally replace the current mappings with the old game's mouse actions. Physical placement may be an option, with the same interaction available through controller selection. Seated play, one-handed access where supported, left-handed controls, readable status and hand-menu support need separate checks. Never describe optical-hand menu support as implemented hand-only combat.

Party roles should create advantages without compulsory attendance.

The useful adaptation is complementary actions, not four portraits that a headset player must micromanage. Build first on the game's existing skills and tools. A warden might hold a safe angle, a courier scout or carry a component, an artificer operate a device, and a later lore-focused role interpret a clue. A role should improve an approach without making a solo player permanently unable to finish. A counterweight or latch can replace a second person holding a lever. Shared completion must depend on the puzzle's actual state, not a hidden minimum party count.

NPCs could supply local knowledge, optional assistance or a new perspective on an expedition. Begin with one bounded companion or rescued specialist, with understandable follow, wait and assist commands, rather than a full autonomous party. Do not add compulsory escort failure, permanent death or pathfinding that blocks a necessary doorway. In multiplayer, another human fills a useful role; the system should not reward opening extra clients more than cooperating with people.

Original bestiary as field knowledge.

Organize proposed creature entries around silhouette, habitat, behavior, warning, attack, counterplay, useful tools, material or research discoveries, and uncertainty. Distinguish a resident, neutral animal, territorial creature, mechanical guardian and active enemy. Do not infer hostility from an entire people or species. A field guide can progress from local rumor to observation to tested knowledge, without requiring a kill to learn everything. Put compact facts near the relevant encounter and longer accounts in the Map House or library.

Three original behavioral sketches illustrate the intended scope, not newly implemented enemies. A Glasswing scavenger seeks bright light, allowing a carried lamp or authored lure station to redirect it. An Ashbound sentinel protects its front, telegraphs a committed strike, and briefly exposes a flank afterward. A Bellroot colony sends a visible and audible warning pulse before nearby guardians respond, making interruption or a quiet route useful. Each needs bounded AI, honest navigation, readable cooldowns and a fallback response using ordinary equipment. These are not reskins or stat copies of named D&D creatures.

Combining two different behaviors in a room should change the decision. A light source might make a route readable while attracting the scavenger. A sentinel may cover the fastest approach while a gallery reveals its flank. A trap or guardian should have a discoverable reset, disable method, timing window or bypass. Essential signals must not depend only on sound or color. Camera rotation, gaze and the user's physical movement remain their own; game status effects must never masquerade as a frozen renderer. Avoid repeated stun chains that remove meaningful control.

Equipment and crafting.

Use a discovery, study, commission, equip and field-test loop. Frontier plans give Vinci's makers something new to build; makers make exploration more expressive; observations from exploration refine the town's knowledge. Keep known recipes distinct from the actual items fabricated from them. Protect learned plans and quest evidence from accidental sale. Let players inspect the whole recipe, cost, effects, limitations and destination slot before spending anything.

An original lantern lens could offer either a wider inspection cone or a longer-lived stationary beacon. A field shield could trade a broad guard for faster recovery. A rescue kit could improve assistance rather than raw damage. Those are examples of different uses, not promised supported stats. Include meaningful combat gear eventually, but preserve Vesperfall's working bow mechanics first. Physical sword, axe and shield combat would require its own alignment, collision, damage-window, hit-feedback and performance work; adding an item icon is not implementing that combat system.

Random gear should stay within understandable budgets. Offer a small number of clearly different rewards, prevent irrelevant duplicates from dominating, and provide a bounded route toward an important recipe. Avoid endless layers of hidden perks, compulsory perfect rolls or a random rare key on the main quest path. Display full modifiers and identification state in inspection and trade, not only a rarity color. An unidentified item's hidden properties must not leak accidentally through a type-specific vendor quote; use an explicit policy such as a category quote or appraisal before sale.

Trustworthy inventory and rewards.

Keep the current local satchel and reviewed NPC trade as the solo foundation. Its receipt and save-failure protection are not online authority. The existing FUTURE-DIRECTION.md trade contract remains controlling: authenticated ownership, server-owned revisions, invalidation of both confirmations on offer changes, reservations, atomic settlement, idempotent requests and durable receipts. No client inventory import or return query string can mint online money or prove expedition completion.

For later cooperative loot, prefer individual entitlement to materials and rewards, followed by optional explicit gifting or trading. Opening a chest should not let the fastest client take everyone else's reward. Party-critical puzzle objects should be recorded as party custody, with a visible current holder and recoverable placement if that person disconnects. Do not place those objects in the ordinary personal marketplace. A rare shared award, if used at all, needs a disclosed consent-based allocation rule rather than an informal middleman.

A compact quick-access kit should be separate from the full satchel. Show equipped items, counts and relevant cooldowns near the existing wrist/floor status; keep detailed compare, identify, craft and trade actions on the deliberately summoned scene desk. Trading needs explicit review because it transfers ownership. Drinking a prepared tonic in a dangerous encounter should not require browsing a vendor-style confirmation flow; any future quick-use action must still revalidate and persist its consumption through the appropriate local or online authority. Do not silently remap a working action button for it.

Advancement without discarding a player's life in town.

Prefer a proposed Masterwork Commission system to copying a level-reset price. Demonstrating mastery through exploration, craft, research or assistance could unlock a signature item, workshop display, title, visual style or a bounded specialization. Preserve learned recipes, housing, equipment and quest progress. Allow sensible retraining so uninformed early build choices do not permanently damage a character. Later veterans should have new choices and social contributions, not a mandatory exponential advantage over newcomers.

A masterwork should begin with one clearly explained signature action and a small set of compatible modifications. Test each combination against encounter counterplay, inventory clarity and cooperative balance. Keep a noncombat route to meaningful town recognition. Gear intended for Vinci cannot simply be copied into Vesperfall's present independent equipment model; a shared capability/economy contract must precede any functional cross-game gear transfer.

The proposed next authored expedition: The Lantern Vault.

This is a working design name, not a released chapter. Place its optional dangerous boundary beyond the established town safety line, near the existing frontier infrastructure. Do not turn occupied Vinci houses, roofs, cellars or ordinary service passages hostile. Preserve Cinder Hollow, The Drowned Workshop and all current Vesperfall chapter identities instead of replacing them with a similar demo. Select the actual entrance after collision and route inspection; no unverified coordinates are assigned here.

Story premise: the signal repaired during Lantern Road receives an old maintenance response from a closed optical workshop. A guild commission asks who kept it working and whether its records can restore a lost civic service. The goal is evidence and a usable process, not exterminating every inhabitant. The original charter, its rewards and its bound signal lens remain intact; the new expedition supplies or loans its own necessary tools.

An initial scope hypothesis is 8-12 connected spaces, not an arbitrary room quota. A survey antechamber teaches the inspection lens. A shutter room shows the failed light path. A counterweight room lets one player secure the mechanism. A lower maintenance route provides components and cover; an upper gallery provides information and another approach. An optional side chamber contains a caretaker's account or an original fabrication plan. A controlled guardian encounter asks the player to apply the mechanism, bypass, disable or fight. A service latch reconnects to the entrance. A town report grants the new result once and makes a visible improvement to a workshop or reading room.

The gallery and maintenance route must be meaningfully different and both support legitimate completion. The main objective cannot require a lucky blueprint, a particular class, another online person, perfect aim, an exact real-room reach or killing every creature. A returning player can use earned route knowledge without repeating all tutorial exposition. The safe survey antechamber provides a deliberate checkpoint; saving is not accomplished by secretly resetting enemies or changing an immutable layout.

Only after an authored journey works should procedural variants recombine it. Generate a solvable dependency structure before assigning rooms, hazards and decorations. Verify keys precede locks or have a valid alternate route; controls are reachable; party members cannot be stranded; objective objects cannot vanish; and a return remains possible. Use a fixed layout identity and seed/state persistence for each saved expedition. Vary routes, clues, inhabitants and encounter combinations while retaining the taught rules. Sampled seeds are evidence, not a proof of every possible seed's quality.

Future mission families can share that vocabulary without becoming reskinned kill counts: survey and recover a process; rescue a specialist; repair a signal or drainage service; investigate a missing delivery; or opt into a defended expedition. Their rewards should serve different professions and civic goals. Preserve combat challenge in the frontier while offering viable noncombat town progression.

Implementation sequence and acceptance.

Map this proposal to the current NEXT01/NEXT06/S01/S02/S03/F03 story, interaction and quality obligations before assigning implementation work. This document does not mark those tasks complete or establish a second canonical roadmap. First finish the exact current Lantern Road charter, review/cancel, save-failure, travel/return and XR interruption tests. Existing reported freezes, aiming mismatch and sustained Quest load remain open.

Then implement one inventory-to-world interaction in a safe graybox, followed by the authored Vault route, map/clue record and one visible town consequence. Add the minimum original enemy behaviors needed to test the choices. Only afterward add a modest recipe/reward catalogue and repeatable variants. The separate MMO prerequisite remains one authenticated two-client room and one authoritative, revision-bound, atomic trade; NPC transactions and a page link cannot substitute for that milestone.

Test ordinary movement and interaction rather than assigning actor positions, quest stages, health, items or focus to manufacture success. Cover both routes, wrong-item attempts, missing optional gear, cancellation, full inventory, failed writes, repeated inputs, interruption while holding a component, save/reload, map access, consistent Back, and actual XR exit. For online work additionally test simultaneous item use/trade, disconnect before and after settlement, shared puzzle custody, late join and no duplicated rewards. Preserve unsuccessful traces and unchanged acceptance criteria.

Human checks ask whether a new player can explain what a mechanism changed, recognize the alternate approach and understand why the discovery matters to someone in Vinci. Replay checks ask whether knowledge creates a useful new choice. Desktop automation, mocked headset input, real WebGL frames, public-byte verification and physical Quest tests are different evidence classes. Do not use a still image or high source-test count as proof of comfort or enjoyment.

Resumption and rollback.

Read this alongside AGENTS.md, NEXT-SESSION.md, FUTURE-DIRECTION.md, LANTERN-ROAD.md, release.json, the studio library and the latest exact release receipts. Refresh current source before changing anything. No public/private lore import, engine migration, new PR, staging branch, temporary workflow, save reset or sibling-game modification is authorized by these design notes. Preserve the working Goldwind and Guild controls, one-stream quiet audio, independent rendering while paused, original v2 saves and optional Quarter history.

This pass adds only this document and a pointer in NEXT-SESSION.md. Reverting those two documentation changes on fresh master is sufficient to roll back this note; no runtime or saved data needs to be altered. Unresolved decisions include the Vault entrance, reward and puzzle budget, signature equipment, companion scope and future online service choice. Detailed story and private-world canon remain separate approval gates.

Sources and verification boundaries.

The owner supplied the SNES Eye of the Beholder review, Dungeons of Eternity feature/progression summaries, and a Realm Online review transcript in the current conversation. The Realm transcript is experience evidence for a particular server, not verification of all current server rules. The private NerveGear manuscripts were not copied or newly summarized into this public document.

SSI Eye of the Beholder computer-game manual, accessible text at https://www.scribd.com/document/34445240/Eye-of-the-Beholder . This is a primary manual reproduced by a third-party host; the host's metadata is not an intellectual-property license for our game. The review's puzzle-quality judgment is attributed to the supplied review, not to this manual.

Othergate's official Dungeons of Eternity description at https://store.steampowered.com/app/3189340/Dungeons_of_Eternity/ and official update notes at https://www.othergate.com/updates . Consulted for the embodied/cooperative direction and broad promotion/recovery features, not used to import the supplied numerical economy as our own.

The linked bestiary viewer at https://online.anyflip.com/ivdl/igol/mobile/index.html#p=30 identified a Dungeons and Dragons 5E Monster Manual but returned no readable entry text. Its alternate basic reader returned 403. No entry-specific claim or reproduction is based on it.

Current game sources inspected: AGENTS.md, FUTURE-DIRECTION.md, LANTERN-ROAD.md, NEXT-SESSION.md, road-core.mjs and tests/evidence/lantern-road/receipt.json. These establish the solo foundations and remaining evidence gates, not an implemented MMO or a completed Lantern Vault.
