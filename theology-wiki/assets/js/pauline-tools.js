/* Same-origin, input-only reading companion. Never changes the source chronology. */
(()=>{'use strict';const C=window.TheologyPaulineCore;
 function enhance(p){
  if(p.slug!=='james-and-contested-succession'||!C)return;
  const body=document.querySelector('#article-body');if(!body||body.querySelector('#pauline-lab'))return;
  const anchor=[...body.querySelectorAll('h2,h3,h4,h5,h6')].find(h=>h.textContent.trim()==='Three different clocks, not a single seven-year story');if(!anchor)return;
  const host=document.createElement('section');host.id='pauline-lab';host.setAttribute('aria-label','Pauline chronology lab');
  host.innerHTML='<h3>Chronology lab: change an assumption, inspect the consequences</h3><p>These are illustrative inputs, not dates established by Galatians. No output measures persecution duration or scores a historical theory.</p><form novalidate><div class="pauline-fields"><label>Proposed founder death<input id="pc-founder" name="founder" inputmode="numeric" maxlength="4" aria-describedby="pc-rules"></label><label>Founder era<select id="pc-founderEra" name="founderEra"><option value="bce">BCE</option><option value="ce">CE</option></select></label><label>Pauline revelatory transition<input id="pc-transition" name="transition" inputmode="numeric" maxlength="4" aria-describedby="pc-rules"></label><label>Transition era<select id="pc-transitionEra" name="transitionEra"><option value="bce">BCE</option><option value="ce">CE</option></select></label></div><div class="pauline-options"><label>Start the fourteen-year count from<select id="pc-origin" name="origin"><option value="transition">Revelatory transition</option><option value="visit">First Jerusalem visit</option></select></label><label>Counting illustration<select id="pc-count" name="count"><option value="elapsed">Completed elapsed years</option><option value="inclusive">Inclusive calendar-year labels</option></select></label></div><p id="pc-rules">Enter years from 1 to 5000. There is no historical year zero. Inclusive labels illustrate a counting convention, not exact event dates.</p><div class="pauline-buttons"><button type="submit">Calculate</button><button type="button" id="pc-earlier">Earlier-founder example</button><button type="button" id="pc-recent">Recent-founder example</button></div></form><p id="pc-error" role="alert" hidden></p><div id="pc-results" role="status" aria-live="polite" aria-atomic="true"></div><p id="pc-url-note"></p><p><a id="pc-share" href="">Open this exact comparison</a>. Its assumptions are stored only in the address, not in the shared timeline or browser storage.</p><p class="pauline-scope">The text below explains the interval choices and the living-recipient constraint. The article remains fully readable when this calculator is unavailable.</p>';
  anchor.after(host);
  const $=s=>host.querySelector(s),parsed=C.fromParams(new URLSearchParams(location.search));
  function fill(s){for(const k of C.keys)$('#pc-'+k).value=s[k];}
  function state(){return Object.fromEntries(C.keys.map(k=>[k,$('#pc-'+k).value]));}
  function paragraph(text){const p=document.createElement('p');p.textContent=text;$('#pc-results').append(p);}
  function render(changeAddress){
   const s=state();$('#pc-results').replaceChildren();$('#pc-error').hidden=true;if(changeAddress)$('#pc-url-note').textContent='';
   try{const r=C.calculate(s);paragraph('Selected assumptions: founder death '+r.founder+'; Pauline transition '+r.transition+'. The nominal calendar-year difference is '+r.gap+' years.');paragraph('First Jerusalem visit: '+r.first+' ('+r.three+' year-number steps after the transition). Later visit: '+r.later+' ('+r.fourteen+' steps after '+(r.origin==='visit'?'the first visit':'the transition')+').');paragraph('Persecution duration: not specified by these intervals. '+(r.count==='inclusive'?'Inclusive illustration: the starting year is counted as label 1.':'Elapsed illustration: the intervals are treated as completed years.')+' Neither convention establishes the actual dates.');
    const u=C.toParams(location.href,s);$('#pc-share').href=u.href;$('#pc-share').removeAttribute('aria-disabled');
    if(changeAddress){try{history.replaceState(history.state,'',u);}catch{$('#pc-url-note').textContent='This browser did not update the address. The comparison link still contains your inputs.';}}
   }catch(e){$('#pc-error').textContent=e.message;$('#pc-error').hidden=false;$('#pc-share').removeAttribute('href');$('#pc-share').setAttribute('aria-disabled','true');}
  }
  fill(parsed.state);if(parsed.invalid)$('#pc-url-note').textContent='Invalid comparison inputs in the address were ignored. The earlier-founder illustration is shown instead.';
  host.querySelector('form').addEventListener('submit',e=>{e.preventDefault();render(true);});
  for(const k of C.keys)$('#pc-'+k).addEventListener(k.endsWith('Era')||['origin','count'].includes(k)?'change':'input',()=>render(true));
  $('#pc-earlier').onclick=()=>{fill(C.defaults);render(true);};$('#pc-recent').onclick=()=>{fill({...C.defaults,founder:'30',founderEra:'ce'});render(true);};
  render(false);host.dataset.ready='true';
 }
 window.TheologyPauline={enhance};
})();
