/* Read-only practice feedback. Run-level timing details never rewrite records. */
(function(root){'use strict';
 const stamp=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
 function sections(song){if(song.sections)return song.sections;const a=[];for(let b=0;b<song.bars;b+=8)a.push({id:'phrase-'+b,name:'Phrase '+(a.length+1),start:b*240/song.bpm,end:Math.min(song.duration,(b+8)*240/song.bpm),cue:'Follow the melody. Keep your movements comfortable.'});a.at(-1).end=song.duration;return a;}
 function current(song,time){const a=sections(song);return a.find(p=>time>=p.start&&time<p.end)||a.at(-1);}
 function summary(state){
  const groups=sections(state.song).map(p=>({...p,notes:0,hits:0,misses:0,bad:0,quality:0,offsets:[]}));
  for(const n of state.song.notes){const p=groups.find(s=>n.time>=s.start&&n.time<s.end);if(!p)continue;p.notes++;
   const d=state.judgmentDetails?.[n.id];if(!d)continue;
   if(d.type==='hit'){p.hits++;p.quality+=d.quality;if(Number.isFinite(d.offsetMs))p.offsets.push(d.offsetMs);}
   else if(d.type==='miss')p.misses++;else if(d.type==='bad')p.bad++;
  }
  const times=groups.flatMap(p=>p.offsets),abs=times.map(Math.abs),mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
  for(const p of groups)p.accuracy=p.notes?Math.round(p.quality/p.notes*1000)/10:null;
  const played=groups.filter(p=>p.notes),weak=[...played].sort((a,b)=>a.accuracy-b.accuracy)[0];
  return {sections:groups,meanOffset:mean(times),meanAbsolute:mean(abs),early:times.filter(t=>t< -35).length,centered:times.filter(t=>Math.abs(t)<=35).length,late:times.filter(t=>t>35).length,samples:times.length,weakest:weak?.id||null};
 }
 function install(g){const $=id=>document.getElementById(id);let last='',paint=-Infinity;const timeline=$('song-journey');
  function menu(){const song=PrismCore.chart(g.track,g.difficulty),a=sections(song);$('song-stats').textContent=`${stamp(song.duration)} / ${song.notes.length} notes / ${a.length} sections`;
   timeline.replaceChildren();for(const p of a){const s=document.createElement('span');s.textContent=p.name;s.title=stamp(p.start)+' - '+p.cue;timeline.append(s);}
  }
  function results(){if(!g.state)return;const r=summary(g.state),box=$('section-results');box.replaceChildren();
   const weakest=r.sections.find(p=>p.id===r.weakest);
   $('practice-tip').textContent=weakest&&weakest.accuracy<95?`Next target: ${weakest.name} at ${stamp(weakest.start)}. ${weakest.misses+weakest.bad} missed or wrong cuts. Replay the track and focus on this phrase.`:'Every section connected. Try the other chart for a different movement pattern.';
   $('timing-detail').textContent=r.samples?`${r.early} early / ${r.centered} within 35 ms / ${r.late} late. Average absolute timing error: ${r.meanAbsolute.toFixed(0)} ms. Timing is measured at ${g.state.mode==='keys'?'the button press':'the closest sampled blade contact'}, not an audio-device calibration.`:'No hit timing samples yet. Finish a few connections to see your timing feedback.';
   for(const p of r.sections){const row=document.createElement('div');row.className='section-result';const label=document.createElement('p');label.textContent=`${p.name} / ${stamp(p.start)} / ${p.notes?p.accuracy+'% quality':'listening break'}`;const bar=document.createElement('progress');bar.max=100;bar.value=p.accuracy||0;bar.setAttribute('aria-label',p.name+' quality');row.append(label,bar);box.append(row);}
  }
  function sync(){menu();if(g.phase==='complete')results();}
  function tick(now){if(now-paint<160)return;paint=now;const song=g.state?.song;if(!song){$('phrase-hud').hidden=true;last='';return;}
   const p=current(song,g.state.time),a=sections(song),next=a[a.findIndex(s=>s.id===p.id)+1];$('phrase-hud').hidden=!['playing','paused'].includes(g.phase)||g.immersive;
   if(last!==p.id){last=p.id;$('phrase-name').textContent=p.name;$('phrase-cue').textContent=p.cue;}
   $('phrase-next').textContent=next?`Next: ${next.name} in ${Math.max(0,Math.ceil(p.end-g.state.time))}s`:'Final phrase';
  }
  sync();return {sync,tick,results};
 }
 const api={sections,current,summary,install};root.PrismPhrases=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
