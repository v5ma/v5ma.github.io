
const $=s=>document.querySelector(s);
const json=async name=>{const r=await fetch(name);if(!r.ok)throw Error(name+' could not be loaded.');return r.json();};
const el=(name,text,cls)=>{const p=document.createElement(name);if(text!=null)p.textContent=text;if(cls)p.className=cls;return p;};
let plan,metrics,reports=new Map(),current=null;
function options(select,values){for(const [v,name]of values){const p=el('option',name);p.value=v;select.append(p);}}
function showBoard(){
 const search=$('#search').value.toLowerCase(),area=$('#area').value,status=$('#status').value,horizon=$('#horizon').value;
 const filtered=plan.tasks.filter(t=>(!area||t.area===area)&&(!status||t.status===status)&&(!horizon||t.horizon===horizon)&&JSON.stringify(t).toLowerCase().includes(search));
 const board=$('#board');board.replaceChildren();
 for(const group of plan.states){const tasks=filtered.filter(t=>t.status===group);if(!tasks.length)continue;const column=el('section',null,'column');column.append(el('h3',group+' / '+tasks.length));
  for(const t of tasks){const card=el('article',null,'card');card.id=t.id;card.append(el('p',t.id+' / '+t.area+' / '+t.priority,'task-meta'),el('h4',t.title),el('p',t.acceptance));
   const details=el('details'),summary=el('summary','Dependencies, evidence and next action');details.append(summary);
   details.append(el('p','Prerequisites: '+(t.dependsOn.join(', ')||'None.')),el('p','Next: '+t.nextAction),el('p',t.caveat),el('p','Verification scope: '+t.verificationScope));
   if(t.evidence.length){const p=el('p','Evidence: ');for(const path of t.evidence){const a=el('a',path.split('/').at(-1));a.href=path;p.append(a,document.createTextNode(' '));}details.append(p);}
   card.append(el('p',t.horizon,'horizon'),details);column.append(card);
  }board.append(column);
 }
 $('#count').textContent=filtered.length+' of '+plan.tasks.length+' tasks shown. Completed software outputs and verified gameplay remain distinct.';
}
async function showGraph(){
 const n=Number($('#graph-chapter').value);
 if(!reports.has(n)){const [p,r]=await Promise.all([json('./flow-reports/plan-'+n+'.json'),json('./flow-reports/chapter-'+n+'.json')]);reports.set(n,{p,r});}
 current=reports.get(n);$('#graph-node').replaceChildren();options($('#graph-node'),[['','Whole level'],...current.p.tracks.map(t=>[t.meta.id,t.meta.id+' / '+t.meta.label])]);drawGraph();
}
function drawGraph(){
 const {p,r}=current,id=$('#graph-node').value,c=$('#plan-canvas'),g=c.getContext('2d'),selected=p.tracks.find(t=>t.meta.id===id),all=p.tracks.flatMap(t=>t.points);
 const links=r.witnesses.transitions.filter(e=>!id||e.from===id||e.to===id),unique=new Map();
 for(const e of links){const key=e.from+'>'+e.to;if(!unique.has(key))unique.set(key,e);}
 const shown=[...unique.values()].filter(e=>id||e.to!=='road').slice(0,id?10:24);
 const scope=id?[...selected.points,...shown.flatMap(e=>e.witness.points)]:all;
 const bx=Math.min(...scope.map(a=>a[0]))-80,by=Math.min(...scope.map(a=>a[1]))-80,bw=Math.max(...scope.map(a=>a[0]))-bx+80,bh=Math.max(...scope.map(a=>a[1]))-by+80;
 const s=Math.min((c.width-40)/bw,(c.height-40)/bh),x=(c.width-bw*s)/2-bx*s,y=(c.height-bh*s)/2-by*s;
 const point=a=>[a[0]*s+x,a[1]*s+y];
 g.fillStyle='#142d3c';g.fillRect(0,0,c.width,c.height);
 const path=(pts,color,width,dash=[])=>{g.strokeStyle=color;g.lineWidth=width;g.setLineDash(dash);g.beginPath();pts.forEach((a,i)=>i?g.lineTo(...point(a)):g.moveTo(...point(a)));g.stroke();g.setLineDash([]);};
 for(const t of p.tracks)path(t.points,t.meta.id===id?'#ffda8a':'#8aaeb1',t.meta.id===id?4:2);
 for(const e of shown){const q=e.witness,at=Math.max(0,q.points.findIndex(a=>q.launch&&Math.hypot(a[0]-q.launch.x-13,a[1]-q.launch.y-15)<20));path(q.points.slice(at),e.to==='road'?'#bac6d0':'#78ead5',1.4,[3,4]);}
 for(const peg of p.pegs){g.fillStyle='#ffd984';g.beginPath();g.arc(...point([peg.x,peg.y]),3,0,Math.PI*2);g.fill();}
 const route=r.witnesses.routes[id];
 $('#graph-description').textContent=id?(route?`${id}: composed entry from ${route.entry}, with ${route.controls.length} recorded transfers. Arrival speed ${route.arrival.speed.toFixed(1)} world units per tick. These curves show sampled motions, not invisible rails.`:'No composed witness recorded for this surface.'):`${p.tracks.length} fitted surfaces, ${p.pegs.length} sampled peg opportunities. Gold dots are pegs; mint dashed paths are actual simulated trajectories. Select a surface for a readable local view.`;
 const box=$('#graph-connections');box.replaceChildren();
 if(id)for(const e of shown){box.append(el('p',`${e.from} to ${e.to}: ${e.control.mode}${e.control.jumpAt?' with jump at '+Math.round(e.control.jumpAt*100)+'%':''}; ${e.witness.airTicks} airborne ticks, arrival ${e.witness.arrival?e.witness.arrival.speed.toFixed(1):'ground'} units/tick.`));}
}
try{
 [plan,metrics]=await Promise.all([json('./roadmap.json'),json('./metrics.json')]);$('#policy').textContent=plan.policy;
 const areas=[...new Set(plan.tasks.map(t=>t.area))].sort(),horizons=[...new Set(plan.tasks.map(t=>t.horizon))];options($('#area'),areas.map(v=>[v,v]));options($('#horizon'),horizons.map(v=>[v,v]));options($('#status'),plan.states.map(v=>[v,v]));
 options($('#graph-chapter'),metrics.chapters.map((c,i)=>[String(i),c.title]));
 for(const m of metrics.chapters){const card=el('article',null,'audit-card');card.append(el('p','CHAPTER '+m.chapter,'eyebrow'),el('h3',m.title),el('p',`${m.beforeSurfaces} surfaces before / ${m.afterSurfaces} fitted surfaces`),el('p',`Centerline crossings: ${m.beforeCrossings} before / ${m.afterCrossings} after`),el('p',`Clearance conflicts: ${m.beforeClearance} before / ${m.afterClearance} after`),el('p',`No composed access witness: ${m.beforeUnproven} before / ${m.afterUnproven} after`),el('p',`${m.entryCount} sampled entries / ${m.states} motion states`,'note'));$('#audit-summary').append(card);}
 for(const id of['search','area','status','horizon'])$('#'+id).addEventListener(id==='search'?'input':'change',showBoard);
 $('#graph-chapter').onchange=()=>showGraph().catch(e=>$('#graph-description').textContent=e.message);$('#graph-node').onchange=drawGraph;
 $('#export-roadmap').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(plan,null,2)],{type:'application/json'})),a=el('a');a.href=url;a.download='paper-delivery-roadmap.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 showBoard();await showGraph();
}catch(e){$('#policy').textContent=e.message;$('#policy').setAttribute('role','alert');}
