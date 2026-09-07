/* Same-origin, input-only reading companion. Never changes the source chronology. */
(()=>{'use strict';const C=window.TheologyPaulineCore;
 function enhance(p){
  if(p.slug!=='james-and-contested-succession'||!C)return;
  const body=document.querySelector('#article-body');if(!body||body.querySelector('#pauline-lab'))return;
  const anchor=[...body.querySelectorAll('h2,h3,h4,h5,h6')].find(h=>h.textContent.trim()==='Three different clocks, not a single seven-year story');if(!anchor)return;
  const host=document.createElement('section');host.id='pauline-lab';host.setAttribute('aria-label','Pauline chronology lab');host.tabIndex=-1;
  host.innerHTML='<h3>Chronology lab: change an assumption, inspect the consequences</h3><p>These are illustrative inputs, not dates established by Galatians. No output measures persecution duration or scores a historical theory.</p><form novalidate><div class="pauline-fields"><label>Proposed founder death<input id="pc-founder" name="founder" inputmode="numeric" maxlength="4" aria-describedby="pc-rules"></label><label>Founder era<select id="pc-founderEra" name="founderEra"><option value="bce">BCE</option><option value="ce">CE</option></select></label><label>Pauline revelatory transition<input id="pc-transition" name="transition" inputmode="numeric" maxlength="4" aria-describedby="pc-rules"></label><label>Transition era<select id="pc-transitionEra" name="transitionEra"><option value="bce">BCE</option><option value="ce">CE</option></select></label></div><div class="pauline-options"><label>Start the fourteen-year count from<select id="pc-origin" name="origin"><option value="transition">Revelatory transition</option><option value="visit">First Jerusalem visit</option></select></label><label>Counting illustration<select id="pc-count" name="count"><option value="elapsed">Completed elapsed years</option><option value="inclusive">Inclusive calendar-year labels</option></select></label></div><p id="pc-rules">Enter years from 1 to 5000. There is no historical year zero. Inclusive labels illustrate a counting convention, not exact event dates.</p><div class="pauline-buttons"><button type="submit">Calculate</button><button type="button" id="pc-earlier">Earlier-founder example</button><button type="button" id="pc-recent">Recent-founder example</button></div></form><p id="pc-error" role="alert" hidden></p><div id="pc-results" role="status" aria-live="polite" aria-atomic="true"></div><p id="pc-url-note"></p><p><a id="pc-share" href="">Open this exact comparison</a>. Its assumptions are stored only in the address, not in the shared timeline or browser storage.</p><p class="pauline-scope">The text below explains the interval choices and the living-recipient constraint. The article remains fully readable when this calculator is unavailable.</p>';
  anchor.after(host);
  // Put a discoverable entry above the long article without changing its source text.
  const entry=document.createElement('p');entry.className='pauline-jump';
  const jump=document.createElement('a');jump.href='#pauline-lab';jump.textContent='Explore the interactive chronology';
  entry.append(jump,document.createTextNode(' alongside the full James and succession argument.'));body.prepend(entry);
  jump.addEventListener('click',event=>{event.preventDefault();host.scrollIntoView({block:'start'});host.focus({preventScroll:true});});
  const $=s=>host.querySelector(s),parsed=C.fromParams(new URLSearchParams(location.search));
  function fill(s){for(const k of C.keys)$('#pc-'+k).value=s[k];}
  function state(){return Object.fromEntries(C.keys.map(k=>[k,$('#pc-'+k).value]));}
  function paragraph(text){const p=document.createElement('p');p.textContent=text;$('#pc-results').append(p);}
  function drawTimeline(s){
   const model=C.timeline(s),figure=document.createElement('figure');figure.id='pc-timeline';figure.setAttribute('aria-labelledby','pc-timeline-caption');
   const caption=document.createElement('figcaption');caption.id='pc-timeline-caption';caption.textContent='Selected scenario: four events on one scale';figure.append(caption);
   const note=document.createElement('p');note.className='pauline-scope';note.textContent='All four lanes run from '+model.start+' to '+model.end+' ('+model.span+' year-number steps). The scale adjusts to your inputs; this is a calculated scenario, not a dated source.';figure.append(note);
   const list=document.createElement('ol');list.className='pc-timeline-list';
   for(const event of model.events){
    const row=document.createElement('li');row.dataset.event=event.id;
    const label=document.createElement('span');label.className='pc-event-label';
    const title=document.createElement('span');title.textContent=event.title;
    const date=document.createElement('strong');date.textContent=event.date;label.append(title,date);
    const lane=document.createElement('span');lane.className='pc-time-lane';lane.setAttribute('aria-hidden','true');
    const point=document.createElement('span');point.className='pc-time-point';point.style.left=(event.position*100)+'%';lane.append(point);row.append(label,lane);list.append(row);
   }
   figure.append(list);$('#pc-results').append(figure);
  }
  function render(changeAddress){
   const s=state();$('#pc-results').replaceChildren();$('#pc-error').hidden=true;if(changeAddress)$('#pc-url-note').textContent='';
   try{const r=C.calculate(s);paragraph('Selected assumptions: founder death '+r.founder+'; Pauline transition '+r.transition+'. The nominal calendar-year difference is '+r.gap+' years.');paragraph('First Jerusalem visit: '+r.first+' ('+r.three+' year-number steps after the transition). Later visit: '+r.later+' ('+r.fourteen+' steps after '+(r.origin==='visit'?'the first visit':'the transition')+').');paragraph('Persecution duration: not specified by these intervals. '+(r.count==='inclusive'?'Inclusive illustration: the starting year is counted as label 1.':'Elapsed illustration: the intervals are treated as completed years.')+' Neither convention establishes the actual dates.');
    drawTimeline(s);
    const u=C.toParams(location.href,s);$('#pc-share').href=u.href;$('#pc-share').removeAttribute('aria-disabled');
    if(changeAddress){try{history.replaceState(history.state,'',u);}catch{$('#pc-url-note').textContent='This browser did not update the address. The comparison link still contains your inputs.';}}
   }catch(e){$('#pc-error').textContent=e.message;$('#pc-error').hidden=false;$('#pc-share').removeAttribute('href');$('#pc-share').setAttribute('aria-disabled','true');}
  }
  fill(parsed.state);if(parsed.invalid)$('#pc-url-note').textContent='Invalid comparison inputs in the address were ignored. The earlier-founder illustration is shown instead.';
  host.querySelector('form').addEventListener('submit',e=>{e.preventDefault();render(true);});
  for(const k of C.keys)$('#pc-'+k).addEventListener(k.endsWith('Era')||['origin','count'].includes(k)?'change':'input',()=>render(true));
  $('#pc-earlier').onclick=()=>{fill(C.defaults);render(true);};$('#pc-recent').onclick=()=>{fill({...C.defaults,founder:'30',founderEra:'ce'});render(true);};
  render(false);host.dataset.ready='true';
  if(location.hash==='#pauline-lab')requestAnimationFrame(()=>{if(host.isConnected){host.scrollIntoView({block:'start'});}});
 }
 window.TheologyPauline={enhance};
})();
