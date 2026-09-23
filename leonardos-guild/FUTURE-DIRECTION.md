Leo's Guild: Vinci, Vesperfall and the shared-world direction.
Owner-approved direction, September 22, 2026.

(1) The promise.

Vinci is a distinctive artisan settlement connected to a larger fantasy world. Vesperfall is a farther frontier region, not a replacement for Vinci or its existing Cinder Hollow expedition. Build a place worth returning to, then explore the world that makes its continued flourishing possible. The town must remain a substantial game, not a vendor lobby between fights.

The owner approved inspiration from the fantasy world associated with NerveGear.Net. This public game direction is an adaptation, not a wholesale publication of the private manuscripts or a claim that Vinci is canonically Elorath. Do not import private characters, plot twists, documents, images, the private SaaS hub or access credentials. Further names and exact geography require an explicit canon decision. Treat the world and its inhabitants as meaningful, not disposable code that can be reset to excuse contradictions.

The owner's Realm Online material is design inspiration supplied in chat. Its historical prices, spell tiers, dungeon requirements and community claims were not independently verified for this release. Borrow social roles, local specialty merchants, cooperative expeditions, mentorship, crafting, item identification and comprehensible trade. Do not copy branded items, lore, layouts, artwork, or million-gold pricing into a new economy without designing its actual balance.

(2) What this release actually provides.

The Road Beyond the Lanterns is a solo charter in the existing full Vinci map. Leonardo provides a bound survey parcel and an allowance. Mara recovers and identifies a route chart. Ilaria builds a signal lens from the parcel. The player installs it at the existing expedition gate and reports back. The restored lantern and completed charter persist. It is an opening relationship among civic work, knowledge and frontier travel, not a finished MMO campaign.

The Common Table and Lantern Glassworks are named street service points. The satchel contains herbs, linen, tonic, glass, brass, a crafted trade lens and protected quest evidence. Shops display fixed buy/sell prices and a separate exact-exchange review. Crafting consumes a displayed recipe. Receipts, cancellation, inventory revalidation and save-failure rollback are implemented locally. Quest-bound objects cannot be sold. The charter supplies all required story materials; optional purchases cannot create a resource lock.

The Vesperfall connection is a deliberate page handoff after saving. The actual XR session must finish before navigation. Vesperfall retains its own controls, missions, checkpoint, equipment and currency. An arrival-specific Return to Vinci action is available in its browser save panel and XR Saved expedition menu. Return does not prove an expedition was completed and grants no additional reward. The two games are not yet one seamless renderer, one authoritative character or one shared economy.

Multiplayer remains false. There is no server authority, real player barter, account login, shared chat, auction house, multiplayer combat, tradable online wealth, or networked housing in this release. Never present the NPC review screen or local receipts as a secure live player economy. Another browser tab is not another authenticated player.

(3) Story structure to extend.

The apprentice's relationships should come before a chosen-one plot. Preserve The Stolen Folio, The Lamplighter's Promise, The Ledger With Two Names, original household work, vehicles, roofs, cellars, Cinder Hollow, Stillwater and optional Quarter progress. Connect selected stories rather than replacing them with another introduction.

The next original chapter should answer a specific question raised by the reopened road: who maintained it, who was excluded from it, and why did communication fail? Let makers, healers, cartographers, couriers and adventurers offer different useful perspectives. Do not make every mystery a monster attack. An expedition can recover knowledge, reunite a household or repair a service, not merely mint currency for a kill count.

A later return from Vesperfall should visibly change Vinci: a restored reading room, a working signal instrument, a new recipe, a returned traveler or a reopened service passage. That requires an actual completion contract, not a query parameter saying success. Existing Vesperfall chapter identities, seeds, geometry readers, rewards and saved runs must remain immutable under their old IDs.

Cinder Hollow remains the nearer danger. A future maintained road, caravan yard or farmland can make the transition to Vesperfall gradual. Each added place must have functional relationships, choices, recovery and a useful return. Do not add empty travel distance merely to claim a larger world.

(4) Town upgrades for a shared world.

Develop a recognizable guild hall, cafeteria or tavern, expedition courtyard, library/map house, makers' workshops, provision counters and healer. Reuse existing buildings where practical. The buildings situate the systems in the fiction, but essential information must also be available from the compact field desk so ordinary tasks do not require repeated commutes.

Trades should connect professions. Material suppliers, glassworkers, bow makers, fletchers, tailors and healers should make things that matter to expeditions and town life. Basic NPC supplies must remain available when few players are online. Crafting should change possibilities, not only increase numbers. Avoid mandatory gear purchases that strand a new or solo player.

Do not auction all existing NPC households to early arrivals. Preserve their stories and provide rented rooms, workshop annexes and instanced private interiors with visitor permissions. Larger player-guild halls can follow. Essential doors, services and streets must not be monopolized or blocked by other players.

Public works should create shared accomplishments without offline penalties. Garden, library, bathhouse, signal station and observatory projects can accept different kinds of useful contribution. A player who misses a week should not return to a home destroyed for failing a daily obligation.

Vinci remains safe. No hostile player combat, theft, forced trades, monster dragging, body-blocking required doors or denial of essential workstations. Any adversarial combat belongs in an explicit arena or dangerous mode with informed participation, not in ordinary public streets. Friendly rivalry can instead come from races, craft exhibitions or opt-in challenges.

(5) Inventory and trustworthy player trading: mandatory contract before launch.

Online items need stable server-issued instance IDs or bounded stack IDs, ownership, type, quantity, attributes, binding rules, identification state and a version. The client requests an action; it does not set balances, item ownership, rarity, quest completion or loot outcomes. The local satchel is not an online authority. Preserve local solo adventures separately; do not convert edited local gold, items or scores into tradable online wealth.

A trade session has two authenticated participants, one explicit revision and an expiry. Each side sees both complete offers, item identities, quantities, verified attributes, identification status, fees and resulting currency balance. Distinguish rare and ordinary objects with words and symbols, not color alone. No bait-and-switch thumbnail, truncated modifier list, hidden fee or default acceptance.

Every offer change invalidates both participants' confirmations. Both participants must review and accept the same server-owned revision. After both are ready, final settlement rechecks ownership, bindings, available balance and inventory capacity and transfers both sides atomically. Reserve offered items so they cannot be sold, consumed, equipped incompatibly or offered in another trade while settlement is pending. A one-sided transfer must never be exposed as a completed trade.

Use durable request IDs and settlement receipts so retries, double clicks, reconnects and duplicated messages cannot pay twice. Recover pending transactions by querying their known IDs; never retry a money transfer with a fresh ID merely because a response was lost. Database transactions must enforce constraints and locking or equivalent serializable settlement. Publish user notifications only after the durable result. Cross-region transfer must have one owner at a time and an explicit recovery state.

On disconnect, cancel an uncommitted offer or hold it under a clearly disclosed short expiry. Return reserved items safely. Never drop them on the ground, treat a disconnect as consent, or silently complete a changed offer. A timed-out interface must show pending/unknown until the authoritative receipt resolves the outcome, rather than invent success or refund twice.

Test changed offers after ready, last-moment substitutions, stale revisions, two tabs, duplicate requests, two trades for one item, full recipient bags, negative/overflow values, failed database writes, connection loss before and after commit, expired reservations and replayed return tokens. Reject forged requests from otherwise valid accounts. Mute/block and reporting controls must be available without accepting a trade. Logging should support investigation without collecting raw room scans or unnecessary headset motion.

Identification should have explicit rules and a useful knowledge role. The current charter identification is free and bound. A later unidentified-loot economy should not reveal hidden attributes through vendor prices accidentally; decide whether unidentified items can be traded at all and show that state unambiguously. Do not imply an item is identified when only its icon or resale price is known.

(6) Social and cooperative systems.

Start with understandable local, party and direct communication, then friends, mail and opt-in broader gossip/trade channels. These are inspired by the owner's supplied channel examples, not a promise that six online channels already exist. Voice should begin optional, preferably party-scoped; do not impose proximity chatter on a calm town.

Mentorship, cooperative work orders, public demonstrations and expedition organization must give noncombat players useful roles. Protect newcomers from coercive invites and economic exploitation. Include mute, block, report, invitation controls and rate limits before exposing strangers to each other. Mail attachments require the same ownership and atomic-delivery rules as trading. Private homes and guild storage need granular permissions and auditability.

There are three scopes of story truth. Personal household relationships belong to the character. Enemy and mechanism states belong to the party expedition. Public works belong to the community's town state. Define those scopes before networking a local quest flag. A newcomer should not need the whole server's history to rewind, and one player's dialogue choice should not rewrite every resident's state for strangers.

(7) Multiplayer architecture and evidence gates.

Initial capacity targets to investigate, not verified limits: eight players in one town district and parties of two to four in a Vesperfall expedition. Scale through bounded regional instances, not by drawing every connected player in every street. Measure CPU/GPU frame time, memory, bandwidth, simulation cost and reconnection under real load before increasing advertised capacity.

Use an authoritative room/zone simulation with persistent account, inventory and quest records. Choose and pin the networking stack after a small deployment evaluation; earlier discussion mentioned room-based game servers and authenticated Postgres as candidates, not an implemented integration. Keep privileged service credentials server-side. Database ownership policies alone do not make client-editable balances safe. Separate social presence from high-frequency action replication.

Head tracking, diorama placement, display scale, handedness and room origin are local presentation. Networking the miniature's physical table transform must not move another player's world. Replicate bounded game-world actions and validated character state. Keep local visual feedback responsive while reconciling with server results; do not add network latency directly to the user's head tracking.

Pausing a public town stops the local character's input, not the whole server. A private party may have an agreed pause policy. Headset removal, loss of tracking, stalled connections and reconnects need defined safe outcomes. Keep the existing solo pause unchanged. No stuck movement, involuntary firing, repeated rewards or hidden time advancement during a solo menu.

A later seamless transition should use a single managed XR session and explicit region lifecycle. First establish shared character and inventory contracts; do not rewrite both game engines simply to make a door look seamless. Preserve separate entry points and old save readers while adapters are tested. The current page handoff deliberately requires selecting the destination's presentation mode again.

An MMO is an ongoing service. Plan backups, restore drills, migration rollback, monitoring, moderation, abuse response, account recovery and cost ceilings. Forecast from measured concurrent usage and traffic, not a headline registered-user count. Avoid unbounded AI dialogue or creator uploads until moderation, determinism, asset budgets and content ownership are solved.

(8) Next milestones and acceptance.

First retain the playable solo charter and make the town interactions readable on desktop, Xbox and Quest. Physical VR freeze, aiming feedback, audio comfort and sustained performance remain open, regardless of passing source tests. Complete the exact new story, inventory review, cancellation, save failure, travel and return journey before broadening content.

Next prove one authenticated two-client room and one authoritative item exchange. Exercise conflict and reconnect failures, publish exact test results and keep local/offline wealth separate. Then develop one cooperative town work order and one two-to-four-player Vesperfall expedition with a genuine server-validated completion/return result. Only after those succeed expand population, guild halls, housing, professions, social channels and additional frontier chapters.

The next story-design opportunity is a small artisan case with two meaningfully different evidence routes and a useful persistent household change. The six-step charter is deliberately only the first route-opening slice, not a substitute for those deeper stories or the original 49 households.

(9) Resume protocol.

Read AGENTS.md, NEXT-SESSION.md, release.json, LANTERN-ROAD.md, this file, AAA-ROADMAP.md and the latest tests/evidence/lantern-road/receipt.json. Refresh current master and all touched hashes. Only write reviewed changes directly to master without force; reconcile concurrent sibling work. No new pull request, staging branch or temporary transfer workflow unless the owner explicitly requests one.

The road-core module owns validated solo inventory, quest stages and reviewed actions. road-ui uses the existing native dialog/XR bridge. road-storage controls durable local writes. road-art owns the static civic signs and restored lantern. road-travel owns fixed destinations and actual session shutdown. vesperfall-return is an arrival-specific adapter loaded by one script in Vesperfall's index; it does not replace Vesperfall gameplay. Browser tests use ordinary inputs; do not assign actor coordinates, inventory, money, quest or clock state to manufacture acceptance.

Preserve svgn.leonardos-guild.v1 and outer version 2, stable reward IDs, Quarter custody and all Vesperfall layout/readers/preferences. Record tested source identity, known failures, native versus simulated versus physical evidence, exact public bytes and rollback instructions. A passing local model is not a live deployment or physical-headset approval.

September 22 playable survey checkpoint.

LANTERN-VAULT.md now records an implemented first subset of the dungeon adaptation: eight connected single-elevation spaces in the existing frontier, inspection-lens and counterweight custody, a visible optical mechanism, a maintenance alternative, an inside return latch and a Map House consequence. Its two ordinary-movement model routes complete without combat, purchased gear or assigned progression. The proposed upper gallery, guardian, new bestiary, procedural variation, mastery gear and multiplayer are not implemented by this release. Keep the original town and independent Vesperfall expedition. Prioritize human understanding and hardware playability, then extend this authored loop rather than replacing it.

September 22, 2026 / Currentworks library integration.

The owner explicitly requested the shared Prism graphical library in addition to the established adventure work. CURRENTWORKS-INTEGRATION.md records the bounded Water/Trees implementation, r177 compatibility boundary, existing-basin and six-tree scope, graphics settings, state-aware survey hints, retained regression repair, evidence gates and next integration opportunities. Fire, Toon, Cloudlets and Grass require their own measured integration; do not silently expand scope or claim physical approval. Keep the planned story/guardian/verticality and trustworthy economy work in this document; graphics do not replace that direction.
