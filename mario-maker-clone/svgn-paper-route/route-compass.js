/* Read-only navigation over the real course. Only accepted authored finishes bank stamps. */
import {BUILD,STORE,PREFS,sanitize,profile,newRun,observe,settle,guidance} from './route-compass-core.mjs';
const $=id=>document.getElementById(id);
const current=()=>window.DeliveryCampaign?.routes[window.__delivery?.state.route];
const playing=()=>typeof mode!=='undefined'&&mode==='play'&&!won;
const active=()=>playing()&&!document.hidden&&!window.__delivery?.paused&&!window.__delivery?.state.menu;
const authored=()=>{try{return !!current()&&__delivery.state.code===levelCode();}catch{return false;}};
let records=Object.create(null),saveOK=true,prefOK=true,run=null,preference='detailed',lastDistrict='',lastPaint=0;
try{records=sanitize(JSON.parse(localStorage.getItem(STORE)||'{}'));}catch{saveOK=false;}
try{const value=localStorage.getItem(PREFS);if(['detailed','compact','off'].includes(value))preference=value;}catch{prefOK=false;}
const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./route-compass.css',import.meta.url).href;document.head.append(css);
const ribbon=document.createElement('aside');ribbon.id='sc-compass';ribbon.hidden=true;ribbon.setAttribute('aria-label','Route guidance');
ribbon.innerHTML='<small>SKY CYCLE / ROUTE COMPASS</small><strong id="sc-district"></strong><p id="sc-next"></p><p id="sc-clue" class="sc-detail"></p><p id="sc-tip" class="sc-detail"></p>';
const announce=document.createElement('p');announce.className='sc-sr-only';announce.setAttribute('role','status');announce.setAttribute('aria-live','polite');
const journal=document.createElement('dialog');journal.id='sc-journal';journal.setAttribute('aria-labelledby','sc-journal-title');
journal.innerHTML='<div class="sc-heading"><div><small>SKY CYCLE / COURIER COMPASS</small><h2 id="sc-journal-title">Route journal</h2></div><form method="dialog"><button class="delivery-btn" id="sc-close">Back</button></form></div><p id="sc-journal-status" role="status"></p><div class="sc-actions"><button class="delivery-btn" id="sc-guidance"></button><a class="delivery-btn" href="https://github.com/v5ma/v5ma.github.io/blob/master/mario-maker-clone/svgn-paper-route/development/AAA-ROADMAP.md" target="_blank" rel="noopener">Development checklist</a></div><div id="sc-journal-content"></div><p class="sc-footnote">D-pad or left stick moves focus. A selects, B returns, and LB/RB steps through controls. Exploration never blocks the finish.</p>';
document.body.append(ribbon,announce,journal);
let resumeOwned=false,returnFocus=null,openedPad=null;
function pads(){try{return [...(navigator.getGamepads?.()||[])].filter(p=>p?.connected);}catch{return [];}}
function show(){
  if(journal.open)return;
  resumeOwned=active();returnFocus=document.activeElement;openedPad=pads()[0]?.index??null;
  if(resumeOwned)__delivery.act('pause');
  renderJournal();journal.showModal();$('sc-close').focus();
}
journal.addEventListener('cancel',e=>{e.preventDefault();journal.close();});
journal.addEventListener('close',()=>{
  const inputStillAvailable=openedPad===null||pads().some(p=>p.index===openedPad);
  if(resumeOwned&&inputStillAvailable&&!document.hidden&&playing()&&!__delivery.state.menu&&!document.querySelector('dialog[open]'))__delivery.act('resume');
  resumeOwned=false;
  if(returnFocus?.isConnected&&returnFocus.getClientRects().length)returnFocus.focus({preventScroll:true});
});
window.addEventListener('gamepaddisconnected',()=>{resumeOwned=false;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)resumeOwned=false;});
window.addEventListener('blur',()=>{resumeOwned=false;});
function addButton(host,id){if(!host||$(id))return;const b=document.createElement('button');b.id=id;b.className='delivery-btn';b.textContent='Route journal';b.setAttribute('aria-haspopup','dialog');b.onclick=show;host.append(b);}
addButton(document.querySelector('#delivery-header .actions'),'sc-journal-open');
addButton(document.querySelector('#delivery-pause .delivery-pause-card'),'sc-journal-pause');
addButton(document.querySelector('#flight-deck .fd-actions'),'sc-journal-deck');
function hook(name,decorator){const original=window[name];if(typeof original==='function')window[name]=decorator(original);}
hook('loadCode',original=>function(...args){const result=original.apply(this,args);if(result){run=null;lastDistrict='';}return result;});
hook('startPlay',original=>function(...args){
  const result=original.apply(this,args);lastDistrict='';
  run=playing()&&authored()?newRun(profile(window.__sky?.state.data,current())):null;
  return result;
});
hook('stepPlayer',original=>function(...args){
  const observed=run,result=original.apply(this,args);
  if(run===observed&&run&&!run.finished&&active()&&run.profile.id===current()?.id&&player&&!player.dead)observe(run,player.x,player.track?.sky?.id);
  return result;
});
hook('win',original=>function(...args){
  const before=won,result=original.apply(this,args);
  if(!before&&won&&run&&!run.finished&&authored()&&run.profile.id===current()?.id){
    const saved=settle(records,run,true);
    if(saved.banked){
      records=saved.records;
      try{localStorage.setItem(STORE,JSON.stringify(records));saveOK=true;}catch{saveOK=false;}
      const target=document.querySelector('#delivery-results .delivery-result-actions');
      if(target){const p=document.createElement('p');p.className='sc-earned';p.textContent=`Route journal: ${saved.fresh.length} new exploration stamps.${saveOK?' Saved on this device.':' Saving is unavailable; kept for this session only.'}`;target.prepend(p);addButton(target,'sc-journal-results');}
    }
  }
  return result;
});
function paragraph(host,text,className=''){const p=document.createElement('p');p.textContent=text;p.className=className;host.append(p);return p;}
function renderJournal(){
  $('sc-guidance').textContent='Guidance: '+preference;
  $('sc-journal-status').textContent=saveOK?'Exploration stamps are banked only after the game accepts a finish. Existing medals, career badges and Workshop drafts are unchanged.':'Local saving is unavailable. Exploration stays in this session; existing saves have not been cleared.';
  const host=$('sc-journal-content');host.replaceChildren();
  if(run){
    const p=run.profile,h=document.createElement('h3');h.textContent=p.name;host.append(h);
    paragraph(host,run.finished?'This route is complete. Banked stamps remain available on your next visit.':'This run is in progress. Visit districts and ride optional gold tracks, then cross the striped finish to bank your discoveries.');
    if(p.id==='first-neighborhood'&&window.SkyCycleSunrise){
      const m=SkyCycleSunrise.journal(),section=document.createElement('section');section.id='sunrise-mission';
      const heading=document.createElement('h3');heading.textContent=m.title;section.append(heading);paragraph(section,m.intro);
      for(const step of m.steps){const row=document.createElement('article');row.tabIndex=0;row.className='sc-mission-step';paragraph(row,(step.done?'DONE / ':'TO DO / ')+step.title);paragraph(row,step.detail);section.append(row);}
      paragraph(section,m.banked?'Market Pilot seal banked on this device.':'The seal is optional. A normal road finish is always available.');
      if(!m.saveOK)paragraph(section,'Saving unavailable. New seals remain in this session only.');host.append(section);
    }
    const list=document.createElement('div');list.className='sc-stamps';host.append(list);
    const banked=new Set(records[p.id]?.stamps||[]);
    for(const s of [...p.sections,...p.rails]){
      const row=document.createElement('article'),title=document.createElement('h4');row.tabIndex=0;title.textContent=s.name;row.append(title);
      const status=banked.has(s.id)?'BANKED':run.seen.has(s.id)?'FOUND THIS RUN':'NOT YET FOUND';
      row.dataset.state=status;paragraph(row,status,'sc-stamp-state');
      paragraph(row,s.id.startsWith('rail:')?'Optional discovery: ride this gold track. The lower road still leads to the finish.':'Ride into this district to discover it.');list.append(row);
    }
    paragraph(host,`This route has ${p.checkpoints.length} checkpoints. Checkpoint retries keep this run's discoveries; starting a new run clears discoveries that have not been banked.`);
  }else paragraph(host,'Start Sunrise Borough, Waterwheel Boulevard or Copperleaf Gardens to open its district guide. Expert sky trials and edited courses keep their existing controls and progression; this journal does not award exploration stamps there.');
  const heading=document.createElement('h3');heading.textContent='Banked explorations';host.append(heading);
  let count=0;
  for(const route of window.DeliveryCampaign?.routes||[]){const r=records[route.id];if(!r)continue;count++;paragraph(host,`${route.name}: ${r.stamps.length} stamps across ${r.finishes} accepted finishes.`);}
  if(!count)paragraph(host,'No stamps have been banked yet. A finish is never locked behind these optional discoveries.');
  if(!prefOK)paragraph(host,'Guidance settings could not be saved and apply only to this session.');
}
$('sc-guidance').onclick=()=>{preference={detailed:'compact',compact:'off',off:'detailed'}[preference];try{localStorage.setItem(PREFS,preference);prefOK=true;}catch{prefOK=false;}renderJournal();};
function paint(now){
  requestAnimationFrame(paint);if(now-lastPaint<200)return;lastPaint=now;
  ribbon.hidden=!run||!active()||preference==='off'||!!document.querySelector('dialog[open]');
  if(ribbon.hidden)return;
  const g=guidance(run.profile,player.x);if(!g){ribbon.hidden=true;return;}
  const headerBottom=document.getElementById('delivery-header')?.getBoundingClientRect().bottom||0;
  const meterBottom=document.querySelector('#cloud-hud .cloud-loop')?.getBoundingClientRect().bottom||0;
  ribbon.style.top=Math.ceil(Math.max(headerBottom,meterBottom)+12)+'px';
  ribbon.dataset.density=preference;
  $('sc-district').textContent=g.district.name+' / '+g.percent+'%';
  $('sc-next').textContent=g.next?'Next district: '+g.next.name+'.':'Next stop: the striped finish.';
  $('sc-clue').textContent=g.rail?'Optional gold route nearby: '+g.rail.name+'.':g.checkpoint!==undefined?'Checkpoint ahead: about '+Math.max(1,Math.ceil((g.checkpoint-player.x)/36))+' road blocks.':'Continue toward the finish at your own pace.';
  $('sc-tip').textContent=g.tip;
  if(lastDistrict!==g.district.id){lastDistrict=g.district.id;announce.textContent=g.district.name+'. '+g.tip;}
}
requestAnimationFrame(paint);
// Expose read-only snapshots for acceptance diagnostics; never an award shortcut.
window.SkyCycleCompass=Object.freeze({build:BUILD,show,get records(){return sanitize(records);},get run(){return run?{id:run.profile.id,seen:[...run.seen],finished:run.finished,steps:run.steps}:null;},get preference(){return preference;}});
