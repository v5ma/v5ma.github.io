/* Sky Cycle Flight Deck. Additive telemetry and controller UI, not new physics. */
import {BADGES, validID, sanitizeLedger, objectives, settle, samplePad, repeatDirection, adjustValue} from './flight-deck-core.mjs';
const STORE = 'svgn.skycycle.mastery.v1';
const $ = id => document.getElementById(id);
const visible = el => !!el && !el.closest('[hidden],[inert]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
const controls = root => [...root.querySelectorAll('button,a[href],input:not([type="hidden"]),select,textarea,[tabindex="0"]')].filter(el => !el.disabled && visible(el));
const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('./flight-deck.css', import.meta.url).href; document.head.append(css);
let ledger = Object.create(null), saveOK = true, run = null, latest = null;
try { ledger = sanitizeLedger(JSON.parse(localStorage.getItem(STORE) || '{}')); } catch { saveOK = false; }
const current = () => window.DeliveryCampaign?.routes[window.__delivery?.state.route];
const active = () => typeof mode !== 'undefined' && mode === 'play' && !won && !document.hidden && !__delivery.paused && !__delivery.state.menu;
function authored() { try { return !!current() && __delivery.state.code === levelCode(); } catch { return false; } }
function startRun() {
  const route = current(); latest = null;
  run = mode === 'play' && !won && authored() && validID(route.id) ? {id:route.id, name:route.name, total:routeTotal, par:Number(route.par)||0, frames:0, incidents:0, delivered:deliveries, airmail:0, nitro:0, finished:false} : null;
}
function hook(name, decorate) { const original = window[name]; if (typeof original === 'function') window[name] = decorate(original); }
hook('startPlay', original => function(...args) { const result = original.apply(this,args); startRun(); return result; });
hook('stepPlayer', original => function(...args) { if (run && !run.finished && active()) run.frames++; return original.apply(this,args); });
hook('respawn', original => function(...args) { if (run && !run.finished && mode === 'play' && !won) run.incidents++; return original.apply(this,args); });
hook('fireNitro', original => function(p, ...args) { const before = p?.nitro; const result = original.call(this,p,...args); if (run && !run.finished && p?.nitro < before) run.nitro++; return result; });
hook('stepPackets', original => function(...args) {
  const observed = run, before = deliveries, air = !!player && !player.onGround && !player.track && !player.peg && !player.dead;
  const result = original.apply(this,args);
  if (run === observed && run && !run.finished) { run.delivered = deliveries; if (air && deliveries > before) run.airmail += deliveries - before; }
  return result;
});
hook('win', original => function(...args) {
  const before = won, result = original.apply(this,args);
  if (!before && won && run && !run.finished && authored() && run.id === current()?.id) {
    run.finished = true; run.delivered = deliveries;
    latest = settle(ledger,run); ledger = latest.records;
    try { localStorage.setItem(STORE,JSON.stringify(ledger)); saveOK = true; } catch { saveOK = false; }
    const target = document.querySelector('#delivery-results .delivery-result-actions');
    if (target) { const summary = document.createElement('p'); summary.id = 'flight-deck-earned'; summary.className = 'fd-earned'; summary.textContent = `Flight Deck: ${latest.fresh.length} new badges; ${ledger[run.id]?.badges.length || 0}/${objectives(run).length} route badges collected.${saveOK ? '' : ' Saving unavailable; this session only.'}`; target.prepend(summary); }
  }
  return result;
});
// A module arriving during a route does not backfill an unobserved clean run.
const dialog = document.createElement('dialog'); dialog.id = 'flight-deck'; dialog.setAttribute('aria-labelledby','fd-title');
dialog.innerHTML = '<div class="fd-heading"><div><small>SKY CYCLE / FLIGHT DECK</small><h2 id="fd-title">Courier career</h2></div><button id="fd-done" class="delivery-btn">Back</button></div><p id="fd-total"></p><p id="fd-save" role="status"></p><div id="fd-current"></div><div id="fd-routes"></div><div class="fd-actions"><button id="fd-audio" class="delivery-btn">Sound & music</button><button id="fd-controls" class="delivery-btn">Controller guide</button><a class="delivery-btn" href="https://github.com/v5ma/v5ma.github.io/blob/master/mario-maker-clone/svgn-paper-route/development/AAA-ROADMAP.md" target="_blank" rel="noopener">Development checklist</a></div><p class="fd-help">D-pad or left stick: focus. A: choose. B: back. Left/right: adjust a slider. LB/RB: previous/next control.</p>';
document.body.append(dialog);
const guide = document.createElement('dialog'); guide.id = 'flight-deck-guide'; guide.setAttribute('aria-labelledby','fd-guide-title');
guide.innerHTML = '<h2 id="fd-guide-title">Controller guide</h2><p>Left stick or D-pad: move, throttle and brake. A: jump or arm a gold-sector launch. X or RT: nitro. B or RB: throw a paper. Y or LB: whip. Left-stick click: stopwatch when available.</p><p>Start pauses and resumes the route; it no longer sends you into the editor. View opens the Flight Deck. Saved gameplay remaps are respected. Up/down on the D-pad reels a grapple.</p><p>In menus, D-pad or left stick moves focus, A selects, B closes or returns, and left/right adjusts audio sliders. LB/RB moves between controls. Release held buttons after changing screens.</p><p>The original tile editor controls remain: A paints, B erases, bumpers change tiles, and Start playtests. Advanced Bezier handle editing still needs pointer input.</p><form method="dialog"><button class="delivery-btn">Back</button></form>';
document.body.append(guide);
let deckResume = false, deckFocus = null;
function showDeck() {
  if (dialog.open) return;
  deckResume = active(); deckFocus = document.activeElement;
  if (window.__adventure?.state) __adventure.state.transition = null;
  if (deckResume) __delivery.act('pause');
  renderDeck(); dialog.showModal(); $('fd-done').focus(); resetInput();
}
$('fd-done').onclick = () => dialog.close();
dialog.addEventListener('close', () => { if (deckResume && mode === 'play' && !won) __delivery.act('resume'); deckResume = false; if (visible(deckFocus)) deckFocus.focus({preventScroll:true}); resetInput(); });
$('fd-audio').onclick = () => $('score-settings')?.click();
$('fd-controls').onclick = () => guide.showModal();
for (const panel of [dialog,guide]) panel.addEventListener('cancel', e => { e.preventDefault(); panel.close(); });
function renderDeck() {
  const total = Object.values(ledger).reduce((n,r) => n + r.badges.length,0);
  $('fd-total').textContent = `${total} career badges / ${total >= 30 ? 'ACE COURIER' : total >= 15 ? 'SKY COURIER' : total >= 5 ? 'ROUTE RIDER' : 'ROOKIE COURIER'}`;
  $('fd-save').textContent = saveOK ? 'Badges save locally after a real finish. Earn them across separate runs; your existing medals and drafts are untouched.' : 'Local saving is unavailable. Badges remain in this session; existing saves have not been cleared.';
  const now = $('fd-current'); now.replaceChildren();
  if (run && run.id === current()?.id && mode === 'play') {
    const h = document.createElement('h3'); h.textContent = run.name + (run.finished ? ' / completed' : ' / current run'); now.append(h);
    const p = document.createElement('p'); p.textContent = `${(run.frames / 60).toFixed(1)}s active time / ${run.incidents} retries or crashes / ${run.delivered}/${run.total} mailboxes / ${run.airmail} airborne deliveries`; now.append(p);
    for (const o of objectives(run)) { const row = document.createElement('p'); row.className = 'fd-objective'; row.textContent = `${o.met ? (run.finished ? 'EARNED' : 'ON TRACK') : 'NOT MET'} / ${o.name}: ${o.detail}`; now.append(row); }
  } else { const p = document.createElement('p'); p.textContent = 'Start an authored route to track its objectives. Editor playtests never write career badges.'; now.append(p); }
  const list = $('fd-routes'); list.replaceChildren();
  for (const r of window.DeliveryCampaign?.routes || []) {
    const rec = ledger[r.id], row = document.createElement('article'), title = document.createElement('h3'), text = document.createElement('p');
    title.textContent = r.name;
    text.textContent = rec ? `${rec.badges.length} badges / ${rec.finishes} finishes / best active time ${rec.best === null ? '--' : rec.best.toFixed(1) + 's'}` : 'No career badges yet.';
    row.append(title,text);
    if (rec?.badges.length) { const names = document.createElement('p'); names.className = 'fd-badges'; names.textContent = rec.badges.map(id => ({finish:'Route cleared',clean:'Clean wheels',mail:'Every doorstep',airmail:'Air courier',express:'Express delivery'}[id])).join(' / '); row.append(names); }
    list.append(row);
  }
}
const launch = document.createElement('button'); launch.id = 'flight-deck-open'; launch.className = 'delivery-btn'; launch.textContent = 'Flight Deck'; launch.setAttribute('aria-haspopup','dialog'); launch.onclick = showDeck; document.querySelector('#delivery-header .actions')?.append(launch);
const pauseCard = document.querySelector('#delivery-pause .delivery-pause-card');
if (pauseCard) { for (const [text,fn] of [['Flight Deck',showDeck],['Sound & music',() => $('score-settings')?.click()],['Controller guide',() => guide.showModal()],['Retry checkpoint',() => { __delivery.act('resume'); $('sky-retry')?.click(); }]]) { const b = document.createElement('button'); b.className = 'delivery-btn'; b.textContent = text; b.onclick = fn; pauseCard.append(b); } }
// Native dialogs are tracked in actual opening order, not DOM order.
let modalOrder = [];
const modalObserver = new MutationObserver(records => { for (const m of records) { const d = m.target; if (d.tagName !== 'DIALOG') continue; modalOrder = modalOrder.filter(x => x !== d && x.open); if (d.open) modalOrder.push(d); } });
modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
const legacyPanels = ['ctrlov','hangov','machov','shopov','commov','lvlov','accountov','winov'];
function topPanel() {
  const ordered = modalOrder.filter(d => d.open && visible(d)); if (ordered.length) return ordered.at(-1);
  const native = [...document.querySelectorAll('dialog[open]')].filter(visible); if (native.length) return native.at(-1);
  for (const id of legacyPanels) { const p = $(id); if (p?.classList.contains('show') && visible(p)) return p; }
  for (const selector of ['#delivery-results.open','#delivery-menu.open','#delivery-pause.open','[role="dialog"][aria-modal="true"]']) { const p = [...document.querySelectorAll(selector)].find(visible); if (p) return p; }
  return null;
}
function back(panel) {
  if (panel instanceof HTMLDialogElement) { panel.close(); return; }
  if (panel?.id === 'delivery-results') { __delivery.act('routes'); return; }
  if (panel?.id === 'delivery-menu') { if (mode === 'play' && !won) __delivery.act('resume'); return; }
  if (panel?.id === 'delivery-pause') { __delivery.act('resume'); return; }
  const closeIDs = {ctrlov:'btnCtrlClose',hangov:'btnHangClose',machov:'btnMachClose',shopov:'btnShopClose',commov:'btnCommClose',lvlov:'btnLvlClose'};
  if (closeIDs[panel?.id] && $(closeIDs[panel.id])) { $(closeIDs[panel.id]).click(); return; }
  const close = controls(panel).find(el => /^(back|close|done|return|cancel|resume)\b/i.test(el.textContent.trim())); if (close) close.click();
}
let lastPanel = null, lastPad = null, previous = Array(17).fill(false), waitNeutral = true, repeat = {direction:0,next:0}, padOwned = new Set(), physical = new Set(), connected = false;
function releasePad() { for (const code of padOwned) if (!physical.has(code)) keys[code] = false; padOwned.clear(); }
function resetInput() { releasePad(); waitNeutral = true; repeat = {direction:0,next:0}; }
window.addEventListener('keydown', e => { for (const c of keyActions(e.code)) physical.add(c); },true);
window.addEventListener('keyup', e => { for (const c of keyActions(e.code)) physical.delete(c); },true);
window.addEventListener('blur', () => { physical.clear(); resetInput(); if (active()) __delivery.act('pause'); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { physical.clear(); resetInput(); } });
function focusStep(panel, direction) {
  const list = controls(panel); if (!list.length) return;
  const i = list.indexOf(document.activeElement), next = i < 0 ? 0 : (i + direction + list.length) % list.length;
  list[next].focus({preventScroll:true}); list[next].scrollIntoView({block:'nearest',inline:'nearest'});
}
function adjust(el, direction) {
  if (el instanceof HTMLInputElement && el.type === 'range') {
    const min = Number(el.min || 0), max = Number(el.max || 100), step = Number(el.step) || 1;
    el.value = String(adjustValue(Number(el.value),min,max,step * (max - min >= 100 ? 5 : 1),direction)); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true;
  }
  if (el instanceof HTMLSelectElement) {
    const indices = [...el.options].map((o,i) => !o.disabled ? i : -1).filter(i => i >= 0), at = indices.indexOf(el.selectedIndex);
    if (indices.length) { el.selectedIndex = indices[Math.max(0,Math.min(indices.length - 1,at + direction))]; el.dispatchEvent(new Event('change',{bubbles:true})); } return true;
  }
  return false;
}
function handleKey(event) {
  const panel = topPanel();
  if (!(panel instanceof HTMLDialogElement)) return;
  // The release loader installs this delegate before the legacy pause handler.
  event.stopImmediatePropagation();
  if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); panel.close(); resetInput(); }
}
function decorateMenu() {
  const menu = $('delivery-menu'); if (!menu) return;
  for (const card of menu.querySelectorAll('[data-course]')) {
    if (card.querySelector('.fd-route-badges')) continue;
    const route = DeliveryCampaign.routes[Number(card.dataset.course)]; if (!route) continue;
    const label = document.createElement('span'); label.className = 'fd-route-badges';
    label.textContent = `${ledger[route.id]?.badges.length || 0} career badges`; card.append(label);
  }
  const hero = menu.querySelector('.delivery-hero');
  if (hero && !hero.querySelector('[data-fd-menu]')) {
    const b = document.createElement('button'); b.className = 'delivery-btn'; b.dataset.fdMenu = ''; b.textContent = 'Flight Deck / career & controls'; b.onclick = showDeck; hero.append(b);
  }
}
const menuObserver = new MutationObserver(decorateMenu);
if ($('delivery-menu')) { menuObserver.observe($('delivery-menu'),{childList:true}); decorateMenu(); }
const oldGamepadEdit = window.pollGamepadEdit;
function poll() {
  let pad = null; try { const pads = [...(navigator.getGamepads?.() || [])]; pad = pads.find(p => p?.connected && p.index === lastPad && p.mapping === 'standard') || pads.find(p => p?.connected && p.mapping === 'standard') || null; } catch {}
  connected = !!pad;
  if (!pad) { if (lastPad !== null) { releasePad(); if (active()) __delivery.act('pause'); } lastPad = null; previous.fill(false); waitNeutral = true; return; }
  if (pad.index !== lastPad) { lastPad = pad.index; resetInput(); }
  const state = samplePad(pad), b = state.buttons, pressed = i => b[i] && !previous[i], panel = topPanel();
  if (panel !== lastPanel) { lastPanel = panel; resetInput(); }
  if (document.hidden || !document.hasFocus()) { resetInput(); previous = b; return; }
  if (waitNeutral) { previous = b; if (state.neutral) waitNeutral = false; return; }
  if (pressed(8) && !(panel instanceof HTMLDialogElement)) { showDeck(); previous = b; return; }
  if (panel) {
    if (active()) __delivery.act('pause');
    releasePad();
    if (pressed(1) || pressed(9)) back(panel);
    else if (pressed(0)) { const list = controls(panel), el = list.includes(document.activeElement) ? document.activeElement : list[0]; if (el) { el.focus(); if (!(el instanceof HTMLSelectElement) && !(el instanceof HTMLInputElement && el.type === 'range')) el.click(); } }
    else {
      const horizontal = b[14] || state.x < -.5 ? -1 : b[15] || state.x > .5 ? 1 : 0;
      const vertical = b[12] || state.y < -.5 ? -1 : b[13] || state.y > .5 ? 1 : 0;
      const direction = vertical || (horizontal ? horizontal * 2 : 0);
      repeat = repeatDirection(repeat,direction,performance.now());
      if (pressed(4) || pressed(5)) focusStep(panel,pressed(4) ? -1 : 1);
      else if (repeat.fire) { if (!(horizontal && !vertical && adjust(document.activeElement,horizontal))) focusStep(panel,(vertical || horizontal)); }
    }
  } else if (mode === 'play') {
    if (pressed(9)) { __delivery.act('pause'); resetInput(); previous = b; return; }
    if (!active()) { releasePad(); previous = b; return; }
    const map = {ArrowLeft:state.x < -.35 || padHeld(pad,'left'),ArrowRight:state.x > .35 || padHeld(pad,'right'),Space:padHeld(pad,'jump'),KeyX:padHeld(pad,'nitro'),KeyC:padHeld(pad,'fire'),KeyZ:padHeld(pad,'whip'),KeyV:padHeld(pad,'watch'),ArrowUp:b[12],ArrowDown:b[13]};
    for (const [code,held] of Object.entries(map)) {
      if (held) { keys[code] = true; padOwned.add(code); } else if (padOwned.delete(code) && !physical.has(code)) keys[code] = false;
    }
  }
  previous = b;
}
// The original engine's poller is the same entry point, so no Start/edit race.
window.pollGamepad = poll;
window.pollGamepadEdit = function() {
  if (!topPanel() && !waitNeutral && !document.hidden && document.hasFocus()) {
    oldGamepadEdit?.();
    if (mode === 'play') { previous[9] = true; resetInput(); }
  }
};
let raf = 0, lastStamp = 0;
function frame(stamp) { poll(); if (stamp - lastStamp > 300) { lastStamp = stamp; document.body.classList.toggle('fd-controller',connected); launch.title = connected ? 'View button: Flight Deck. Start: pause.' : 'Career badges and controller guide'; } raf = requestAnimationFrame(frame); }
raf = requestAnimationFrame(frame);
window.addEventListener('pagehide', () => { cancelAnimationFrame(raf); resetInput(); });
window.addEventListener('pageshow', e => { if (e.persisted) { resetInput(); raf = requestAnimationFrame(frame); } });
window.SkyCycleFlightDeck = Object.freeze({version:'0.16.0',get run(){return run ? {...run} : null;},get records(){return sanitizeLedger(ledger);},get saveOK(){return saveOK;},get connected(){return connected;},show:showDeck,topPanel,handleKey});
