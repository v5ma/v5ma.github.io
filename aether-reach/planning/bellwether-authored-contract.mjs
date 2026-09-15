/* A design-state graph, NOT a playable level, collision map, or game-progress API.
 * Milestones below stand for work the real mechanics must perform after integration. */
const freeze = v => {if (v && typeof v === 'object') {Object.values(v).forEach(freeze); Object.freeze(v);} return v;};
const room = (id, purpose, landmark, cutaway) => ({id, purpose, landmark, cutaway});
const route = (id, from, to, verb, tradeoff, requires = [], bothWays = true) => ({id, from, to, verb, tradeoff, requires, bothWays});
export const STARTER_CAPABILITIES = freeze(['walk', 'climb', 'interact', 'basic-combat']);
export const BELLWETHER_AUTHORED = freeze({
  id: 'bellwether-authored-r1', status: 'design-contract-not-playable', entry: 'arrival', goalFlag: 'reported',
  flags: ['street-secured', 'circuit-balanced', 'receiver-synced', 'reported', 'service-isolated', 'return-latched'],
  rooms: [
    room('arrival', 'Understand the blackout before receiving instructions; see the receiver.', 'Dark theatre receiver above a stopped market.', 'open-plaza'),
    room('demonstration', 'Experiment safely with a local motor and a visible power indicator.', 'Short exposed supply/return loop.', 'active-room'),
    room('market', 'Choose cover, engineering preparation or an elevated opening; regroup safely.', 'Silent public clock and market aisle.', 'open-plaza'),
    room('service-passage', 'Break sightlines and reach a manual isolation switch; longer approach.', 'Blue maintenance conduit.', 'active-room'),
    room('balcony', 'Read enemy positions from above; elevation trades protection for information.', 'Upper clock face aligned with the receiver.', 'foreground-only'),
    room('workshop', 'Optional environmental story and useful circuit clue, not required loot.', 'Repair bench diverted to public equipment.', 'active-room'),
    room('arcade', 'Read supply, return and balance through visible gauge feedback; accessible clue remains.', 'Three connected gauges and a receiver sightline.', 'active-room'),
    room('service-stairs', 'Provide a continuous, safe ascent independent of rails and upgrades.', 'Landings with changing views back to the market.', 'section'),
    room('overlook', 'Recognize the earlier route from above and discover a return connection.', 'The dispatch desk framed beneath the catwalk.', 'foreground-only'),
    room('roof-entry', 'Reorient in shelter before the encounter; no spawn-point crossfire.', 'Receiver machinery seen across the roof.', 'open-plaza'),
    room('receiver', 'Combine learned infrastructure behavior with cover and repositioning.', 'Signal mast; district lamps visibly respond.', 'open-plaza'),
    room('return-landing', 'Open a shorter return and see consequences in the district below.', 'Service stair visible from the first plaza.', 'section')
  ],
  routes: [
    route('arrival-loop', 'arrival', 'demonstration', 'walk', 'Safe optional mechanical practice.'),
    route('public-approach', 'arrival', 'market', 'walk', 'Direct approach with cover, but exposed sightlines.'),
    route('practice-exit', 'demonstration', 'market', 'walk', 'Transfer understanding immediately into the encounter.'),
    route('service-entry', 'demonstration', 'service-passage', 'walk', 'Longer, sheltered preparation route.'),
    route('service-flank', 'service-passage', 'market', 'walk', 'Different sightline and an isolation-switch opportunity.'),
    route('balcony-stairs', 'arrival', 'balcony', 'climb', 'Higher-information approach with limited cover.'),
    route('balcony-flank', 'balcony', 'market', 'climb', 'Rejoin or retreat during the fight; not three sealed corridors.'),
    route('workshop-detour', 'service-passage', 'workshop', 'walk', 'A clue and an alternate entrance reward exploration.'),
    route('workshop-door', 'workshop', 'arcade', 'walk', 'Connect story space to the machine it explains.'),
    route('arcade-front', 'market', 'arcade', 'walk', 'Legible main entrance with useful feedback visible inside.'),
    route('service-ascent', 'arcade', 'service-stairs', 'climb', 'Reliable foot ascent; never requires a purchased power.'),
    route('recognition-landing', 'service-stairs', 'overlook', 'walk', 'Reframe earlier spaces before entering danger.'),
    route('sheltered-roof', 'overlook', 'roof-entry', 'climb', 'Arrive behind protection with time to orient.'),
    route('aerial-approach', 'balcony', 'roof-entry', 'rail', 'Optional fast reconnaissance route; not required progression.'),
    route('roof-combat-loop', 'roof-entry', 'receiver', 'walk', 'Several cover pockets and lateral escape must realize this edge.'),
    route('receiver-exit', 'receiver', 'return-landing', 'walk', 'A changed vista after restoring the signal.'),
    route('return-stair', 'return-landing', 'service-stairs', 'climb', 'Always-available fallback when the shortcut is still shut.'),
    route('return-shortcut', 'return-landing', 'arrival', 'climb', 'Far-side latch creates the recognition payoff.', ['return-latched']),
    route('missed-transfer-recovery', 'roof-entry', 'market', 'glide', 'Optional descent must land on an authored recovery route.', [], false)
  ],
  milestones: [
    {id: 'secure-street', room: 'market', verb: 'basic-combat', requires: [], sets: 'street-secured'},
    {id: 'isolate-service', room: 'service-passage', verb: 'interact', requires: [], sets: 'service-isolated'},
    {id: 'balance-arcade', room: 'arcade', verb: 'interact', requires: ['street-secured'], sets: 'circuit-balanced'},
    {id: 'synchronize-receiver', room: 'receiver', verb: 'interact', requires: ['circuit-balanced'], sets: 'receiver-synced'},
    {id: 'open-return', room: 'return-landing', verb: 'interact', requires: ['receiver-synced'], sets: 'return-latched'},
    {id: 'report-dispatch', room: 'arrival', verb: 'interact', requires: ['receiver-synced'], sets: 'reported'}
  ],
  viewRules: {
    sameCanonicalSimulation: true, enclosureOpenings: ['top', 'front', 'both'],
    hideGameplayCollision: false, revealSealedRooms: false, scaleTrackedHead: false,
    automaticallyMovePhysicalTable: false, hardwareVerified: false
  }
});

function validate(chapter) {
  if (!chapter || !Array.isArray(chapter.rooms) || !Array.isArray(chapter.routes) || !Array.isArray(chapter.milestones) || !Array.isArray(chapter.flags)) throw new TypeError('Incomplete chapter contract.');
  const unique = (xs, what) => {if (new Set(xs).size !== xs.length || xs.some(x => typeof x !== 'string' || !x)) throw new Error(`Invalid or duplicate ${what}.`);};
  unique(chapter.rooms.map(r=>r.id), 'rooms'); unique(chapter.routes.map(r=>r.id), 'routes');
  unique(chapter.milestones.map(m=>m.id), 'milestones'); unique(chapter.flags, 'flags');
  if (chapter.flags.length > 12) throw new RangeError('Design audit is bounded to 12 flags.');
  const ids = new Set(chapter.rooms.map(r=>r.id)), flags = new Set(chapter.flags);
  if (!ids.has(chapter.entry) || !flags.has(chapter.goalFlag)) throw new Error('Unknown entry or goal.');
  for (const r of chapter.rooms) if (!r.purpose || !r.landmark || !r.cutaway) throw new Error(`Room ${r.id} lacks an authored purpose or viewing rule.`);
  for (const r of chapter.routes) if (!ids.has(r.from) || !ids.has(r.to) || r.from === r.to || !r.verb || !r.tradeoff || typeof r.bothWays !== 'boolean') throw new Error(`Invalid route ${r.id}.`);
  for (const m of chapter.milestones) if (!ids.has(m.room) || !flags.has(m.sets) || !m.verb) throw new Error(`Invalid milestone ${m.id}.`);
  for (const item of [...chapter.routes, ...chapter.milestones]) if (!Array.isArray(item.requires) || item.requires.some(f=>!flags.has(f))) throw new Error(`Unknown prerequisite on ${item.id}.`);
}

/** Exhaustive ABSTRACT state exploration. Success does not establish geometric
 * reachability, a fair fight, the quality of a reveal, or actual save compatibility. */
export function auditProgression(chapter = BELLWETHER_AUTHORED, capabilities = STARTER_CAPABILITIES) {
  validate(chapter); const can = new Set(capabilities), flagBits = new Map(chapter.flags.map((f,i)=>[f,1<<i]));
  const key = s=>`${s.room}|${s.flags}`, mask = xs=>xs.reduce((m,f)=>m|flagBits.get(f),0);
  const allowed = (x,s)=>can.has(x.verb) && (s.flags & mask(x.requires)) === mask(x.requires);
  const queue = [{room:chapter.entry, flags:0}], seen = new Map([[key(queue[0]), queue[0]]]), reverse = new Map(), done=[];
  for (let cursor=0; cursor<queue.length; cursor++) {
    const state=queue[cursor], here=key(state), next=[];
    if (state.flags & flagBits.get(chapter.goalFlag)) done.push(here);
    for (const r of chapter.routes) if (allowed(r,state)) {
      if (r.from===state.room) next.push({room:r.to,flags:state.flags});
      if (r.bothWays && r.to===state.room) next.push({room:r.from,flags:state.flags});
    }
    for (const m of chapter.milestones) if (m.room===state.room && allowed(m,state) && !(state.flags & flagBits.get(m.sets))) next.push({room:state.room,flags:state.flags|flagBits.get(m.sets)});
    for (const s of next) {const k=key(s); if (!reverse.has(k)) reverse.set(k,new Set()); reverse.get(k).add(here); if (!seen.has(k)) {seen.set(k,s); queue.push(s);}}
  }
  const recoverable=new Set(done), back=[...done];
  for (let cursor=0;cursor<back.length;cursor++) for (const k of reverse.get(back[cursor])||[]) if (!recoverable.has(k)) {recoverable.add(k); back.push(k);}
  return {
    abstractOnly:true, states:seen.size, completingStates:done.length, completable:done.length>0,
    roomsReached:[...new Set(queue.map(s=>s.room))],
    unreachableRooms:chapter.rooms.map(r=>r.id).filter(id=>!queue.some(s=>s.room===id)),
    strandedStates:[...seen.keys()].filter(k=>!recoverable.has(k)),
    flagsByRoom:Object.fromEntries(chapter.rooms.map(r=>[r.id,queue.filter(s=>s.room===r.id).map(s=>chapter.flags.filter(f=>s.flags & flagBits.get(f)))]))
  };
}
