import {FLOODGATE_NOTES,FLOODGATE_ROUTES} from './floodgate-content.mjs';
import {chooseRoute,guideObjective,guidePath,openingAdvice,noteTarget} from './first-light.mjs';
import {dist,heightAt} from './world.mjs';
export function createFirstLightUI(E){const $=id=>document.getElementById(id),make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 const journal=make('section');journal.id='first-light-journal';journal.setAttribute('aria-label','Floodgate routes and field notes');journal.append(make('h3','FIRST LIGHT / FIELD JOURNAL'),make('p','Choose an approach, not a difficulty setting. These routes do not reveal enemies or guarantee safety. Every field note is optional; save at a shelter to keep discoveries.'));
 const routes=make('div');routes.className='first-light-routes';
 for(const [id,route] of Object.entries(FLOODGATE_ROUTES)){const card=make('article'),button=make('button',route.title.toUpperCase());button.id='route-'+id;button.onclick=()=>{chooseRoute(E.state,id);refresh(true);};card.append(button,make('small',route.tag),make('p',route.description));routes.append(card);}
 const off=make('button','HIDE SUGGESTED ROUTE');off.id='route-off';off.onclick=()=>{chooseRoute(E.state,null);refresh(true);};journal.append(routes,off);const notes=make('div');notes.id='first-light-notes';journal.append(notes);$('map-panel').insertBefore(journal,$('map'));
 const switcher=make('label'),check=make('input');check.type='checkbox';check.id='field-guidance';check.checked=E.settings.fieldGuidance!==false;switcher.append(check,document.createTextNode('Show first-expedition guidance'));document.querySelector('#pause .settings').append(switcher);check.oninput=()=>{E.settings.fieldGuidance=check.checked;E.persist();};
 const advice=make('section');advice.id='first-light-advice';advice.setAttribute('aria-label','Expedition guidance');const heading=make('strong'),text=make('p');advice.append(heading,text);$('hud').append(advice);
 const marker=make('div');marker.id='route-beacon';marker.setAttribute('aria-hidden','true');$('hud').append(marker);let previous=null,signature='',lastRouteAt=-1,path=[],target=null;
 function refresh(force=false){const s=E.state;journal.hidden=s.level!=='district';if(journal.hidden)return;const sign=(s.fieldNotes||[]).join('/')+'/'+s.guideRoute;if(!force&&sign===signature)return;signature=sign;
  for(const id of Object.keys(FLOODGATE_ROUTES))$('route-'+id).setAttribute('aria-pressed',String(s.guideRoute===id));$('route-off').setAttribute('aria-pressed',String(s.guideRoute===null));
  // Stable note nodes retain focus even when another discovery is recorded.
  if(!notes.children.length)for(const n of FLOODGATE_NOTES){const detail=make('details'),summary=make('summary'),body=make('p');detail.id='note-'+n.id;summary.id='read-'+n.id;detail.append(summary,body);notes.append(detail);}
  for(const n of FLOODGATE_NOTES){const row=$('note-'+n.id),known=(s.fieldNotes||[]).includes(n.id);row.querySelector('summary').textContent=known?n.title.toUpperCase():'UNDISCOVERED / '+({ 'south-letter':'SOUTH SHELTER','garden-ledger':'RAIN GARDEN','clinic-letter':'FIELD CLINIC','market-receipt':'MARKET','freight-manifest':'FREIGHT HALL','quay-postcard':'QUAY'})[n.id];row.querySelector('p').textContent=known?n.author+': '+n.text:'Find this record in the district, approach it, and use the normal interact control.';}
  lastRouteAt=-1;
 }
 function update(){const s=E.state;if(previous!==s){previous=s;signature='';lastRouteAt=-1;path=[];}refresh();const play=E.mode==='play',help=E.settings.fieldGuidance!==false,info=play&&help?openingAdvice(s,E.settings.controlPreset,E.pad.connected):null;advice.hidden=!info;if(info){heading.textContent=info.title;text.textContent=info.body;}
  marker.hidden=true;if(!play||s.level!=='district')return;
  // A dedicated visual cannot steal a nearby objective/shelter interaction.
  const note=noteTarget(s);if(note){const q=E.scene.project(note.x,heightAt(note.x,note.z)+1.2,note.z);if(q.visible){marker.hidden=false;marker.textContent='FIELD NOTE';marker.style.left=q.x*100+'%';marker.style.top=q.y*100+'%';}return;}
  if(!help||!s.guideRoute)return;
  if(lastRouteAt<0||s.t-lastRouteAt>.75){target=guideObjective(s);path=guidePath(s);lastRouteAt=s.t;}
  if(!target||!path.length)return;let point=path.find(p=>dist(p,s.player)>3)||path.at(-1);const q=E.scene.project(point.x,heightAt(point.x,point.z)+.3,point.z);if(q.visible){marker.hidden=false;marker.textContent='ROUTE / '+target.label+' / '+Math.round(path.length)+'m';marker.style.left=q.x*100+'%';marker.style.top=q.y*100+'%';}
 }
 return {update};
}
