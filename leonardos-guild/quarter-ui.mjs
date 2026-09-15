import {inQuarter,quarterEnter,quarterAct,quarterChoices,nearbyQuarter,quarterText,quarterTarget} from './quarter-core.mjs';
import {QUARTER_GATE,QUARTER_FLOORS,QUARTER_SITES} from './quarter-data.mjs';
import {quarterNotebook,quarterPlace,mapLayer,floorOnLayer} from './quarter-notes.mjs';

export function createQuarterUI({getState,setPause,save,onTransition}){
 const legacyButtons=new Map();let uiActive=false,notebookOpen=false,layer='current',mapControls=null;
 const d=document.createElement('dialog');d.id='quarter-dialog';d.setAttribute('aria-label','Waterwheel Quarter');
 document.body.append(d);d.addEventListener('close',()=>{notebookOpen=false;setPause(false);});
 const element=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 const button=(text,run)=>{const e=element('button',text);e.onclick=run;return e;};
 function finish(){
  const back=button('Return to play / B',()=>d.close());back.dataset.padDefault='';d.append(back);
  setPause(true);if(!d.open)d.showModal();
 }
 function showNotebook(){
  const s=getState();if(!inQuarter(s)){show();return;}
  notebookOpen=true;d.replaceChildren(element('h2','Your Quarter notebook'),element('p',quarterPlace(s).name+' / '+quarterText(s).title));
  d.append(element('p','Inspect records with X at their actual work stations. The notes below remember what you observed and changed. No clue collection requirement blocks a legitimate return of the commission.'));
  const notes=quarterNotebook(s),body=element('section');body.dataset.padScroll='';body.id='quarter-observations';
  if(!notes.length)body.append(element('p','No observations recorded yet. The workbench, dye workroom, finishing table, maintenance ledger and workshop-side arch each have something to inspect.'));
  for(const note of notes){const entry=element('article');entry.dataset.observation=note.id;entry.append(element('h3',note.title),element('p',note.text));body.append(entry);}
  d.append(body,button('Read the public route brief',()=>showBrief()),button('Open the floor-aware map / M',()=>{d.close();document.getElementById('map-button').click();}));
  finish();
 }
 function showBrief(){
  notebookOpen=true;d.replaceChildren(element('h2','Three working connections'));
  for(const [title,text] of [
   ['Cooperate with Marta','The precision workshop opens onto the loading court. Read the drive instructions and repair the loading connection to open its stairs. Mistakes cost nothing.'],
   ['Follow Ilaria\'s fabrics','Workroom, finishing loft, drying stairs and roof form one upward route. The timber bridge connects that roof to the gallery. No drive repair is required.'],
   ['Follow the service channel','The dry controls let you watch the waterline fall. The ramp leads below the gallery. Rear service stairs climb around the machinery and return above it.'],
   ['Recognize your way back','The gallery descent leads toward the bell bracket beside Leonardo\'s workshop. Open the arch from its latch side and the return stays available.']
  ])d.append(element('h3',title),element('p',text));
  d.append(button('Back to my observations',showNotebook));finish();
 }
 function show(site){
  notebookOpen=false;const s=getState();d.replaceChildren(element('h2',site?.name||'Waterwheel Quarter'),element('p',inQuarter(s)?quarterPlace(s).hint:'The new Quarter begins beside Leonardo\'s workshop. Earlier commissions, vehicles and saved rewards remain in this town.'));
  const feedback=element('p');feedback.id='quarter-feedback';feedback.setAttribute('role','status');d.append(feedback);
  const choices=inQuarter(s)?site?quarterChoices(s,site.id):[['overview','Read the public route brief']]:[['enter','Enter the Waterwheel Quarter']];
  for(const [id,label]of choices){
   const b=button(label,()=>{
    if(id==='enter'){
     if(quarterEnter(s)){save();d.close();onTransition();}
     else feedback.textContent='Approach the Quarter sign on foot, stop, and finish or cancel any active road test before entering.';
     return;
    }
    if(id==='overview'){showBrief();return;}
    const result=quarterAct(s,site.id,id);feedback.textContent=result.text;save();
    if(result.transition){d.close();onTransition();}
   });b.dataset.quarterAction=id;d.append(b);
  }
  if(inQuarter(s)){const notes=button('Quarter notebook / G or N',showNotebook);notes.dataset.quarterNotebook='';d.append(notes);}
  finish();
 }
 function interact(){
  const s=getState();if(inQuarter(s)){show(nearbyQuarter(s)[0]);return true;}
  if(s.frontier?.zone==='town'&&s.mode==='foot'&&Math.hypot(s.x-QUARTER_GATE.x,s.z-QUARTER_GATE.z)<4&&!s.life.inside&&!s.doors.level){show();return true;}
  return false;
 }
 function ensureMap(){
  if(mapControls)return;
  const canvas=document.getElementById('city-map');if(!canvas)return;
  mapControls=element('nav');mapControls.id='quarter-map-layers';mapControls.setAttribute('role','tablist');mapControls.setAttribute('aria-label','Quarter map floors');
  for(const [id,text] of [['current','My current floor'],['all','All connections'],['street','Street and workshops'],['upper','Upper work floors'],['service','Lower service channel']]){
   const b=button(text,()=>{layer=id;drawMap(canvas,true);});b.dataset.quarterLayer=id;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(layer===id));b.setAttribute('aria-pressed',String(layer===id));mapControls.append(b);
  }
  canvas.before(mapControls);mapControls.hidden=!inQuarter(getState());
 }
 function wrap(g,text,x,y,maxWidth,line=19){
  let row='';for(const word of text.split(' ')){if(row&&g.measureText(row+' '+word).width>maxWidth){g.fillText(row,x,y);y+=line;row=word;}else row+=(row?' ':'')+word;}
  if(row)g.fillText(row,x,y);return y+line;
 }
 function drawMap(canvas,full){
  const s=getState();ensureMap();if(mapControls)mapControls.hidden=!inQuarter(s);if(!inQuarter(s))return false;
  const g=canvas.getContext('2d'),W=canvas.width,H=canvas.height,legend=full?250:0,pad=full?22:10;
  const scale=Math.min((W-legend-pad*2)/54,(H-(full?130:26))/51),X=x=>(x+28)*scale+pad,Z=z=>(z+18)*scale+(full?58:12),selected=mapLayer(full?layer:'current',s);
  g.fillStyle='#213e42';g.fillRect(0,0,W,H);
  // Ghosted other floors retain context, but never hide the selected storey.
  for(const foreground of [false,true])for(const f of QUARTER_FLOORS){
   const active=floorOnLayer(f,selected);if(active!==foreground)continue;
   g.globalAlpha=active?1:.14;g.fillStyle=f.y<-.35||f.endY<-.35?'#6ea9a5':Math.max(f.y,f.endY)>.6?'#d0a367':'#c8bda0';
   g.fillRect(X(f.x1),Z(f.z1),(f.x2-f.x1)*scale,(f.z2-f.z1)*scale);g.strokeStyle='#172e33';g.lineWidth=1;g.strokeRect(X(f.x1),Z(f.z1),(f.x2-f.x1)*scale,(f.z2-f.z1)*scale);
  }g.globalAlpha=1;
  const lx=W-legend+8;let ly=98;g.textAlign='left';
  if(full){g.fillStyle='#fff2c8';g.font='bold 19px sans-serif';g.fillText('WATERWHEEL QUARTER',pad,28);g.font='14px sans-serif';g.fillText('Showing: '+selected+' / You: '+quarterPlace(s).name,pad,49);g.font='bold 16px sans-serif';g.fillText('WORK STATIONS',lx,74);}
  QUARTER_SITES.forEach((p,index)=>{
   if(!floorOnLayer({y:p.y,endY:p.y},selected))return;
   const code=String.fromCharCode(65+index);
   if(full){g.fillStyle='#152e33';g.beginPath();g.arc(X(p.x),Z(p.z),11,0,Math.PI*2);g.fill();g.fillStyle='#fff2c8';g.textAlign='center';g.font='bold 13px sans-serif';g.fillText(code,X(p.x),Z(p.z)+4);g.textAlign='left';g.font='14px sans-serif';ly=wrap(g,code+' / '+p.name,lx,ly,legend-22)+8;}
  });
  // Gates are stateful landmarks, not teleport controls.
  for(const [x,z,open]of [[-16,-3.8,s.quarter.archOpen],[17,1.55,s.quarter.goodsAccess]]){
   g.strokeStyle=open?'#aee6b7':'#ef996c';g.lineWidth=full?4:2;g.beginPath();g.moveTo(X(x-1),Z(z));g.lineTo(X(x+1),Z(z));g.stroke();
  }
  const goal=quarterTarget(s);if(goal&&floorOnLayer({y:goal.y,endY:goal.y},selected)){
   g.save();g.translate(X(goal.x),Z(goal.z));g.rotate(Math.PI/4);g.fillStyle='#ffe098';g.fillRect(-4,-4,8,8);g.restore();
  }
  g.save();g.translate(X(s.x),Z(s.z));g.rotate(-s.yaw);g.fillStyle='#ffffff';g.strokeStyle='#173840';g.lineWidth=2;g.beginPath();g.moveTo(0,full?9:6);g.lineTo(-5,-5);g.lineTo(5,-5);g.closePath();g.fill();g.stroke();g.restore();
  if(full){g.fillStyle='#fff2c8';g.font='14px sans-serif';wrap(g,'White arrow: you. Gold diamond: current objective. Green gate: open. Orange gate: closed.',pad,H-66,W-pad*2);wrap(g,'Public floor plan. Dim shapes are other floors, not reachable passages. Map views never move your apprentice.',pad,H-24,W-pad*2);for(const b of mapControls.children){b.setAttribute('aria-pressed',String(b.dataset.quarterLayer===layer));b.setAttribute('aria-selected',String(b.dataset.quarterLayer===layer));}}
  return true;
 }
 function update(){
  const s=getState(),isQuarter=inQuarter(s);ensureMap();if(mapControls)mapControls.hidden=!isQuarter;
  if(isQuarter!==uiActive){
   uiActive=isQuarter;
   if(isQuarter){
    for(const id of ['street-open','city-open','doors-open','adventures-button','notebook-button']){
     const b=document.getElementById(id);if(!b)continue;
     legacyButtons.set(b,{handler:b.onclick,nodes:[...b.childNodes]});
     b.onclick=['city-open','doors-open'].includes(id)?()=>interact():()=>showNotebook();
    }
   }else{for(const [b,snapshot]of legacyButtons){b.onclick=snapshot.handler;b.replaceChildren(...snapshot.nodes);}legacyButtons.clear();}
  }
  if(isQuarter){
   const badge=document.getElementById('region-badge');if(badge)badge.textContent=quarterPlace(s).name.toUpperCase()+' / SAFE VINCI';
   const work=document.getElementById('street-open');if(work)work.textContent='Quarter notebook / G or N';
   const nearby=document.getElementById('city-open');if(nearby)nearby.textContent='Nearby work station / X';
   const direction=document.getElementById('city-direction');if(direction)direction.hidden=true;
   const p=nearbyQuarter(s)[0],stopping=Math.abs(s.speed)>.45;
   document.getElementById('context').textContent=p?(stopping?'Stop to inspect: ':'X / ')+p.name:quarterPlace(s).hint;
   document.getElementById('duel').hidden=true;
  }else if(Math.hypot(s.x-QUARTER_GATE.x,s.z-QUARTER_GATE.z)<7&&s.frontier?.zone==='town')document.getElementById('context').textContent='Waterwheel Quarter / stop on foot near the workshop and press X.';
 }
 return {interact,open:showNotebook,close(){if(!d.open)return false;d.close();return true;},drawMap,update,inspect:()=>({open:d.open,notebookOpen,notes:quarterNotebook(getState()),layer,nearby:nearbyQuarter(getState()).map(p=>p.id)})};
}
