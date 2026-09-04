import {PERIODS,DINOS,STORAGE_KEY,PATCHES,byId,inPeriod,emptyProgress,readProgress,writeProgress,addDiscovery,brushPatch,digPercent,journalText,escapeHTML as esc} from './core.js';
import {dinosaurArt,landscapeArt} from './art.js';
import {createWorld} from './world.js';
const main=document.querySelector('#main');
let storage;try{storage=window.localStorage;}catch{storage=null;}
const loaded=readProgress(storage);
let progress=loaded.progress,selected='diplodocus',period='jurassic',mode='3d',level='explorer',world=null,toastTimer,quizResult=null,spin=false;
const route=()=>['explore','dig','journal','grownups'].includes(location.hash.slice(1))?location.hash.slice(1):'explore';
const selectedDino=()=>byId(selected);
function notify(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4200);}
function save(){if(!writeProgress(storage,progress))notify('Your discoveries work here, but this browser cannot save them. Export your journal before leaving.');updateCount();}
function updateCount(){document.querySelector('#journal-count').textContent=progress.observed.length;}
const button=(text,action,extra='',cls='')=>`<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
function periodButtons(){return `<section class="time-section" aria-labelledby="time-title"><div class="section-heading"><div><p class="eyebrow">THE TIME MACHINE</p><h2 id="time-title">Pick a world to explore.</h2></div><span class="muted">Millions of years ago</span></div><div class="periods">${PERIODS.map(p=>`<button data-action="period" data-id="${p.id}" class="period ${p.id} ${period===p.id?'active':''}" aria-pressed="${period===p.id}"><span class="period-dot" aria-hidden="true"></span><span><strong>${p.name}</strong><small>${p.theme}</small></span><span class="period-age">${p.start}-${p.end}<small>million years ago</small></span></button>`).join('')}</div><p class="timeline-note">These are rounded period boundaries. Our visits are snapshots, not the full time range of each animal. Period cards are not to scale.</p></section>`;}
function creatureCards(){return `<section class="creatures" aria-labelledby="creature-title"><div class="section-heading"><div><p class="eyebrow">MEET YOUR NEIGHBORS</p><h2 id="creature-title">Who will you discover?</h2></div><span class="muted">${inPeriod(period).length} animals in this chapter</span></div><div class="creature-grid">${inPeriod(period).map(d=>`<button data-action="select" data-id="${d.id}" class="creature-card ${selected===d.id?'selected':''}" aria-pressed="${selected===d.id}"><span class="card-art">${dinosaurArt(d)}</span><span class="card-copy"><strong>${d.name}</strong><small>${d.diet} / About ${d.length} m long</small><span class="card-place">${d.place}</span></span><span class="card-arrow" aria-hidden="true">${progress.observed.includes(d.id)?'Seen':'Explore'}</span></button>`).join('')}</div></section>`;}
function explore(){
  const d=selectedDino(),p=PERIODS.find(p=>p.id===period);
  return `<section class="intro"><div><p class="eyebrow">LITTLE EXPLORERS. BIG DISCOVERIES.</p><h1>A whole world,<br><em>before ours.</em></h1><p>Travel through deep time. Meet incredible creatures.<br class="desktop-break"> Uncover the clues they left behind.</p></div><div class="expedition-stamp"><span aria-hidden="true">◎</span><strong>Your curiosity<br>is the compass.</strong><small>FIRST EXPEDITION / 6 CREATURES</small></div></section>
    ${periodButtons()}
    <section class="expedition" aria-label="Current dinosaur expedition"><div class="world-panel"><div class="world-header"><span class="scene-tag">${p.name.toUpperCase()} / ABOUT ${p.stop} MILLION YEARS AGO</span><div class="view-switch" aria-label="Choose view">${button('2D','mode','data-id="2d" aria-pressed="'+(mode==='2d')+'"',mode==='2d'?'active':'')}${button('3D','mode','data-id="3d" aria-pressed="'+(mode==='3d')+'"',mode==='3d'?'active':'')}</div></div><div id="world-stage" class="world-stage">${mode==='2d'?landscapeArt(d):`<canvas id="world-canvas" tabindex="0" role="img" aria-label="Rotatable stylized 3D ${d.name}. Use arrow keys to rotate, plus and minus to zoom, and Home to reset."></canvas>`}</div><div class="world-bottom"><span id="world-help">${mode==='3d'?'Drag or use arrow keys to look around.':'An illustrated view of an imagined habitat.'}</span><div class="world-controls">${mode==='3d'?button('−','zoom','data-delta="1" aria-label="Zoom out"')+button('+','zoom','data-delta="-1" aria-label="Zoom in"')+button('Reset','camera')+button(spin?'Pause':'Orbit','spin','aria-pressed="'+spin+'"'):''}</div></div><p class="model-note">A playful reconstruction, not a fossil scan. Colors, proportions, plants, and scenery are simplified.</p></div>
    <aside class="field-card"><p class="eyebrow">FIELD GUIDE / ${p.name.toUpperCase()}</p><h2>${d.name}</h2><p class="pronunciation">Say it: ${d.say}</p><p class="description">${level==='junior'?d.short:d.detail}</p><div class="facts"><div><small>ON THE MENU</small><strong>${d.diet}</strong></div><div><small>BODY LENGTH</small><strong>About ${d.length} m</strong></div><div class="wide"><small>FOSSIL REGION, PRESENT-DAY GEOGRAPHY</small><strong>${d.place}</strong></div></div><div class="field-actions">${button(progress.observed.includes(d.id)?'Recorded in your journal':'Record this discovery','observe','', 'primary')}${button('Uncover its fossils','open-dig','','secondary')}</div><label class="reading-level">Reading level <select id="reading-level"><option value="junior" ${level==='junior'?'selected':''}>Junior</option><option value="explorer" ${level==='explorer'?'selected':''}>Explorer</option></select></label></aside></section>
    ${creatureCards()}
    <section class="evidence-section"><div class="section-heading"><div><p class="eyebrow">THINK LIKE A SCIENTIST</p><h2>How do we know?</h2></div><span class="muted">A good question is a discovery, too.</span></div><div class="evidence-grid"><article><span class="evidence-label">FOSSIL EVIDENCE</span><h3>What we found</h3><p>${d.evidence}</p></article><article><span class="evidence-label">SCIENTIFIC INFERENCE</span><h3>What it suggests</h3><p>${d.inference}</p></article><article><span class="evidence-label">AN OPEN QUESTION</span><h3>What is still unknown</h3><p>${d.unknown}</p></article></div></section>
    ${quiz(d)}<section class="mission-banner"><div class="mission-symbol" aria-hidden="true">?</div><div><p class="eyebrow">YOUR EXPEDITION MISSION</p><h2>Find a clue. Ask a question. Keep exploring.</h2><p>${p.description}</p></div>${button('To the Fossil Lab','open-dig','','primary')}</section>`;
}
function quiz(d){return `<section class="quiz" aria-labelledby="quiz-title"><p class="eyebrow">CURIOUS MINDS CHALLENGE</p><h2 id="quiz-title">${d.question}</h2><div class="answers">${d.answers.map((a,i)=>button(a,'answer',`data-index="${i}"`)).join('')}</div><p class="quiz-feedback" role="status">${quizResult || (progress.quizzes.includes(d.id)?'You have already solved this one. Try it again anytime.':'Take a guess. You can always try again.')}</p></section>`;}
function dinoSelect(){return `<label class="specimen-selector">Your specimen <select id="specimen">${DINOS.map(d=>`<option value="${d.id}" ${d.id===selected?'selected':''}>${d.name} / ${d.period}</option>`).join('')}</select></label>`;}
function dig(){
  const d=selectedDino(),percent=digPercent(progress,d.id);
  return `<section class="page-intro"><p class="eyebrow">THE FOSSIL LAB</p><h1>Every fossil<br><em>has a story.</em></h1><p>Gently brush away the sediment. Look for clues, then save what you found.</p></section><div class="lab-heading">${dinoSelect()}<span class="lab-badge">PALEONTOLOGIST IN TRAINING</span></div><div class="lab-grid"><section class="dig-card"><div class="dig-top"><strong>${d.name}</strong><span id="dig-label">${percent}% uncovered</span></div><div class="dig-site" id="dig-site" role="img" aria-label="Fossil excavation. Drag to brush. A keyboard-accessible brush button follows."><div class="buried-art">${dinosaurArt(d,true)}</div><div class="sediment-grid" aria-hidden="true">${Array.from({length:PATCHES},(_,i)=>`<span class="sediment soil-${i%5} dust-${progress.digs[d.id]?.[i]||0}" data-patch="${i}"></span>`).join('')}</div><span class="dig-corner" aria-hidden="true">FIELD GRID / A</span></div><progress id="dig-progress" max="100" value="${percent}" aria-label="Excavation progress"></progress><div class="dig-tools">${button('Sweep the next patch','sweep','','primary')}${button('See this creature alive','back-explore','','secondary')}</div><p class="hint">Use a mouse or finger to brush. With a keyboard, focus the sweep button and press Enter. Each patch takes two gentle passes.</p><p id="dig-complete" class="completion" role="status">${percent===100?'Specimen uncovered! It is saved in your field journal.':'Take your time. Every careful pass reveals a little more.'}</p></section><aside class="lab-notes"><p class="eyebrow">YOUR FIELD NOTES</p><h2>Not just old bones.</h2><p>A fossil is evidence of past life. Scientists record where a fossil was found, the surrounding rock, and how the pieces fit together.</p><div class="note-card"><strong>Look for this clue</strong><p>${d.evidence}</p></div><div class="note-card"><strong>A question to carry home</strong><p>${d.unknown}</p></div><p class="hint">This is a simplified skeleton puzzle, not a real specimen scan or a realistic excavation. Real digs require permission, careful records, and trained supervision.</p><p class="hint">Paleontology studies ancient life. Archaeology studies the human past. Today, you are practicing paleontology.</p></aside></div>`;
}
function journal(){
  const entries=DINOS.filter(d=>progress.observed.includes(d.id)||progress.excavated.includes(d.id)||progress.notes[d.id]||progress.quizzes.includes(d.id));
  return `<section class="page-intro"><p class="eyebrow">YOUR FIELD JOURNAL</p><h1>A collection<br><em>of discoveries.</em></h1><p>Keep the evidence. Save your questions. Build a little museum of your own.</p></section><div class="journal-summary"><div><strong>${progress.observed.length}<small>creatures observed</small></strong></div><div><strong>${progress.excavated.length}<small>fossils uncovered</small></strong></div><div><strong>${progress.quizzes.length}<small>challenges solved</small></strong></div>${button('Export my journal','export','','primary')}</div>${entries.length?`<div class="journal-grid">${entries.map(d=>`<article class="journal-card"><div class="journal-art">${dinosaurArt(d)}</div><div class="journal-copy"><p class="eyebrow">${d.period.toUpperCase()} / ${progress.excavated.includes(d.id)?'FOSSIL UNCOVERED':'FIELD OBSERVATION'}</p><h2>${d.name}</h2><p>${d.evidence}</p><label for="note-${d.id}">What do you wonder about?</label><textarea id="note-${d.id}" data-note="${d.id}" maxlength="400" placeholder="Write a question or observation. No names or personal details.">${esc(progress.notes[d.id]||'')}</textarea>${button('Visit again','visit',`data-id="${d.id}"`,'text-button')}</div></article>`).join('')}</div>`:`<section class="empty-state"><div aria-hidden="true">◎</div><h2>Your first discovery is waiting.</h2><p>Explore a creature and record it, or finish a fossil dig. Your collection starts there.</p>${button('Begin exploring','back-explore','','primary')}</section>`}<p class="journal-privacy">Saved in this browser only. Clearing browser data removes the journal. Export a copy to keep it. Please do not write personal information.</p>`;
}
function grownups(){return `<section class="page-intro"><p class="eyebrow">FOR GROWN-UPS & EDUCATORS</p><h1>Wonder, with<br><em>evidence underneath.</em></h1><p>A first playable expedition designed for shared exploration, roughly ages 7-12.</p></section><div class="adult-grid"><article><h2>What this prototype does</h2><p>Children explore six dinosaurs across three geological periods, rotate original low-poly models, uncover a simplified fossil illustration, answer questions, and keep a field journal. Junior mode shortens the creature descriptions.</p><h2>What the pictures mean</h2><p>All artwork and 3D models are original, simplified teaching props. Their colors, proportions, poses, vegetation, and scenery are imaginative. They are not scientifically validated anatomy, fossil scans, paleogeographic maps, or simulations of real ecosystems. Animal lengths are approximate museum-guide values, not model scale.</p><p>The era buttons use rounded public museum boundaries. The time stops are illustrative snapshots. The Triassic animals represent different places; they are not presented as one local community. More precise species ranges and site-specific environments need expert review.</p><h2>Data stays on the device</h2><p>The application has no accounts, ads, analytics, chat, payments, remote fonts, remote scripts, or network APIs. It saves progress and optional notes in localStorage on the same browser. Hosting providers may keep ordinary server access logs. Museum links below leave the app.</p><p>This is a prototype, not a claim of regulatory compliance. A public children's release still needs privacy, accessibility, security, and educational review.</p>${button('Erase local progress','reset','','danger')}<h2>Accessibility and controls</h2><p>Use keyboard navigation throughout. In 3D, arrow keys rotate, plus and minus zoom, and Home resets the camera. The Fossil Lab has a keyboard sweep button. Nothing is timed. Automatic orbit is opt-in. If WebGL is unavailable, the app switches to its 2D view.</p></article><aside class="source-panel"><p class="eyebrow">SCIENCE LIBRARY</p><h2>Follow the sources.</h2><p>Creature facts draw on the Natural History Museum, London. Wording is original. These links are for grown-ups and open external websites.</p>${DINOS.map(d=>`<p><a href="${d.source}" target="_blank" rel="noopener noreferrer">${d.name} / Natural History Museum</a></p>`).join('')}<p><a href="https://www.nhm.ac.uk/discover/when-did-dinosaurs-live.html" target="_blank" rel="noopener noreferrer">When did dinosaurs live? / Natural History Museum</a></p><p><a href="https://www.nps.gov/subjects/fossils/dinosaurs.htm" target="_blank" rel="noopener noreferrer">Dinosaurs through geologic time / National Park Service</a></p><p><a href="https://www.nhm.ac.uk/discover/how-are-fossils-formed.html" target="_blank" rel="noopener noreferrer">How are dinosaur fossils formed? / Natural History Museum</a></p><p class="hint">Initial fact check: September 4, 2026. Museum summaries can change and sometimes use older classifications or dates. Consult current primary research before expanding the scientific claims.</p></aside></div>`;}
function render(focus=false,restoreSelector=null){
  world?.dispose();world=null;spin=false;
  const r=route();document.querySelectorAll('header a').forEach(a=>{if(a.hash==='#'+r)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  main.innerHTML=({explore,dig,journal,grownups}[r])();updateCount();
  if(r==='explore'&&mode==='3d'){
    const fail=()=>{mode='2d';render();notify('3D is unavailable in this browser. Your expedition is ready in 2D.');};
    try{world=createWorld(document.querySelector('#world-canvas'),selectedDino(),fail);}catch{fail();}
  }
  if(r==='dig')wireDig();
  if(focus){main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
  else if(restoreSelector)main.querySelector(restoreSelector)?.focus({preventScroll:true});
}
function choose(id){if(!byId(id))return;selected=id;period=selectedDino().period;quizResult=null;}
function navigate(name){if(route()===name)render(true);else location.hash=name;}
function refreshDig(){
  const d=selectedDino(),p=digPercent(progress,d.id);
  document.querySelectorAll('[data-patch]').forEach(el=>{const i=Number(el.dataset.patch);el.className=`sediment soil-${i%5} dust-${progress.digs[d.id]?.[i]||0}`;});
  document.querySelector('#dig-label').textContent=p+'% uncovered';document.querySelector('#dig-progress').value=p;
  document.querySelector('#dig-complete').textContent=p===100?'Specimen uncovered! It is saved in your field journal.':'Take your time. Every careful pass reveals a little more.';
}
function sweep(indices){const before=progress.excavated.includes(selected);indices.forEach(i=>brushPatch(progress,selected,i));refreshDig();save();if(!before&&progress.excavated.includes(selected))notify('Fossil uncovered! '+selectedDino().name+' is in your journal.');}
function wireDig(){
  const site=document.querySelector('#dig-site');let down=false,lastIndex=-1,lastPoint=null;
  function brush(e){
    const rect=site.getBoundingClientRect();
    const point=[(e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height];
    const previous=lastPoint||point,steps=Math.max(1,Math.ceil(Math.hypot(point[0]-previous[0],point[1]-previous[1])*18)),indices=[];
    for(let i=1;i<=steps;i++){
      const x=previous[0]+(point[0]-previous[0])*i/steps,y=previous[1]+(point[1]-previous[1])*i/steps;
      if(x<0||y<0||x>=1||y>=1)continue;const index=Math.floor(y*6)*8+Math.floor(x*8);
      if(index!==lastIndex){indices.push(index);lastIndex=index;}
    }
    lastPoint=point;if(indices.length)sweep(indices);
  }
  site.addEventListener('pointerdown',e=>{down=true;lastIndex=-1;lastPoint=null;site.setPointerCapture(e.pointerId);brush(e);});
  site.addEventListener('pointermove',e=>{if(down)brush(e);});
  for(const event of['pointerup','pointercancel','lostpointercapture'])site.addEventListener(event,()=>{down=false;lastIndex=-1;lastPoint=null;});
}
main.addEventListener('click',e=>{
  const b=e.target.closest('button[data-action]');if(!b)return;
  const action=b.dataset.action,d=selectedDino();
  if(action==='period'){period=b.dataset.id;choose(inPeriod(period)[0].id);render(false,`[data-action="period"][data-id="${period}"]`);}
  if(action==='select'){choose(b.dataset.id);render(false,`[data-action="select"][data-id="${selected}"]`);}
  if(action==='mode'){mode=b.dataset.id;render(false,`[data-action="mode"][data-id="${mode}"]`);}
  if(action==='observe'){const added=addDiscovery(progress,'observed',selected);save();b.textContent='Recorded in your journal';notify(added?d.name+' added to your journal.':'You have already recorded this creature.');}
  if(action==='open-dig')navigate('dig');
  if(action==='back-explore')navigate('explore');
  if(action==='visit'){choose(b.dataset.id);navigate('explore');}
  if(action==='zoom')world?.zoom(Number(b.dataset.delta));
  if(action==='camera')world?.reset();
  if(action==='spin'){spin=!spin;world?.spin(spin);b.textContent=spin?'Pause':'Orbit';b.setAttribute('aria-pressed',String(spin));}
  if(action==='answer'){
    const correct=Number(b.dataset.index)===d.correct;
    quizResult=correct?'Exactly! '+d.explanation:'Not quite. '+d.explanation+' Try another answer.';
    document.querySelector('.quiz-feedback').textContent=quizResult;
    if(correct){addDiscovery(progress,'quizzes',selected);save();}
  }
  if(action==='sweep'){
    const patches=progress.digs[selected]||Array(PATCHES).fill(0),indices=[];
    for(let i=0;i<PATCHES&&indices.length<4;i++)if(patches[i]<2)indices.push(i);
    if(indices.length)sweep(indices);else notify('This specimen is complete. Choose another dinosaur to keep exploring.');
  }
  if(action==='export'){
    const url=URL.createObjectURL(new Blob([journalText(progress)],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='dino-atlas-field-journal.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  if(action==='reset')document.querySelector('#reset-dialog').showModal();
});
main.addEventListener('change',e=>{
  if(e.target.id==='reading-level'){level=e.target.value;render(false,'#reading-level');}
  if(e.target.id==='specimen'){choose(e.target.value);render(false,'#specimen');}
});
main.addEventListener('input',e=>{if(e.target.dataset.note&&byId(e.target.dataset.note)){progress.notes[e.target.dataset.note]=e.target.value.slice(0,400);save();}});
document.querySelector('#reset-dialog').addEventListener('close',e=>{
  if(e.target.returnValue!=='reset')return;progress=emptyProgress();try{storage?.removeItem(STORAGE_KEY);storage?.removeItem("dino-atlas.clues.v1");}catch{}render();notify('Dino Atlas progress erased. Other browser data was not changed.');
});
window.addEventListener('hashchange',()=>{quizResult=null;render(true);});
window.addEventListener('pagehide',()=>world?.dispose());
window.addEventListener('pageshow',e=>{if(e.persisted)render();});
document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();main.focus();main.scrollIntoView();});
const requestedSpecimen=new URLSearchParams(location.search).get('specimen');if(byId(requestedSpecimen))choose(requestedSpecimen);
render();if(!loaded.available)notify('Saved progress could not be loaded. You can explore and export a new journal.');
