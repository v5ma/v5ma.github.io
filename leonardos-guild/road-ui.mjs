import {ROAD_NODES,ROAD_ITEMS,ROAD_STEPS,roadNear,roadTarget,reviewRoadAction,commitRoadReview} from './road-core.mjs';
/* One native dialog model reused by the existing Xbox and world-space XR desk. */
export function createRoadUI({getState,playing,setPause,persist,onChange,travel,legacyJournal,legacyFrontier}){
 const make=(tag,text,parent)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(parent)parent.append(e);return e;};
 const dialog=make('dialog',null,document.body);dialog.id='road-dialog';dialog.setAttribute('aria-label','Lantern road story and inventory');
 const review=make('dialog',null,document.body);review.id='road-review';review.setAttribute('aria-label','Review exact transaction');
 let tab='story',error='',offer=null,committing=false;
 const button=(parent,id,text,fn,disabled=false)=>{const b=make('button',text,parent);b.id=id;b.type='button';b.disabled=disabled;b.onclick=fn;return b;};
 function paragraph(text,parent=dialog){return make('p',text,parent);}
 function direct(action){const s=getState(),q=reviewRoadAction(s,action);const r=q.ok?commitRoadReview(s,q,persist):q;error=r.ok?'':r.error;if(r.ok)onChange(r.summary);render();return r.ok;}
 function ask(action){
  const q=reviewRoadAction(getState(),action);if(!q.ok){error=q.error;render();return;}
  offer=q;review.replaceChildren();make('h2',q.action==='depart'?'Review frontier departure':'Review with '+q.merchant,review);
  paragraph(q.summary,review);paragraph('You have '+q.before+' florins. After this action: '+q.after+' florins.',review);
  paragraph('Single-player transaction on this browser. No other player, server, or shared online inventory is involved.',review);
  const status=paragraph('',review);status.id='road-review-status';status.setAttribute('role','status');
  const cancel=button(review,'road-review-cancel','Keep my items / Back',()=>{offer=null;review.close();});cancel.dataset.padDefault='';
  button(review,'road-review-confirm',action==='depart'?'Save and open Vesperfall':'Confirm exact exchange',async()=>{
   if(committing||!offer)return;committing=true;
   const r=commitRoadReview(getState(),offer,persist);offer=null;
   if(!r.ok){status.textContent=r.error;document.getElementById('road-review-confirm').disabled=true;committing=false;return;}
   onChange(r.summary);review.close();render();
   if(action==='depart'){
    const result=await travel.go('vesperfall');
    if(!result.ok){error=result.error;if(!dialog.open)dialog.showModal();render();}
   }
   committing=false;
  });
  review.showModal();cancel.focus({preventScroll:true});
 }
 function render(){
  const s=getState(),r=s.road,step=ROAD_STEPS[r.stage];dialog.replaceChildren();
  make('h2',tab==='pack'?'Your inventory':tab==='shops'?'Vinci artisans and services':'The Road Beyond the Lanterns',dialog);
  const nav=make('nav',null,dialog);nav.setAttribute('aria-label','Lantern road pages');
  for(const [id,name]of [['story','Story'],['pack','Inventory'],['shops','Shops']])button(nav,'road-tab-'+id,name,()=>{tab=id;error='';render();}).setAttribute('aria-current',String(tab===id));
  paragraph('VINCI / ARTISAN SETTLEMENT. A living town connected to a larger fantasy world. Vesperfall lies beyond its protected streets.');
  if(error){const p=paragraph(error);p.setAttribute('role','alert');}
  if(tab==='story'){
   make('h3',step[1],dialog);paragraph(step[2]);
   paragraph(['Leonardo: "A road is more than a way out. It brings someone home. Help us restore the signal that links our workshops to the frontier."','Mara: "The old survey carries three hands: a courier marked the turns, a mason the crossings, a glassworker the lights. None could have opened it alone."','Mara: "This is not a treasure price list. It is a promise to keep a return route. Let us identify what the fading marks actually say."','Ilaria: "A fighting company needs more than fighters. Bring the parcel; I will make the lens the chart calls for."','The old gate lantern waits for its lens. Rebuilding it will not erase the dangers outside, but travelers will know which road leads home.','Leonardo: "Bring us what you learned. The point of a journey is not only what you take away."','The signal is lit. The guild keeps its charter open to makers, healers, scholars, couriers and adventurers. This is the first restored connection, not the end of Vinci.'][r.stage]);
   const action=['accept','recover-chart','identify-chart','craft-signal','install','report',null][r.stage];
   const names=['Accept Leonardo\'s survey charter','Receive Mara\'s faded chart','Identify the chart / charter covers fee','Commission the signal lens','Install lens in the gate lantern','Report to Leonardo / receive recognition'];
   if(action)button(dialog,'road-step',names[r.stage],()=>ask(action),!roadNear(s,step[0]));
   if(!r.tracking||r.selected)button(dialog,'road-track','Track the next story destination',()=>direct('track'));
   if(r.tracking)button(dialog,'road-untrack','Follow the original Vinci adventure instead',()=>direct('untrack'));
   if(r.stage>=5)paragraph('PERSISTENT CHANGE: the expedition lantern is now lit in your town.');
   if(r.stage===6){button(dialog,'road-depart','Visit Vesperfall / separate saved expedition',()=>ask('depart'),!roadNear(s,'gate'));paragraph('Travel is a deliberate page change, not a seamless portal or MMO. Your inventory stays in Vinci. Select AR, VR or screen play again on arrival.');}
   if(r.returned)paragraph('You returned from Vesperfall. No completion claim or bonus was granted merely for visiting.');
   const target=roadTarget(s);paragraph(target?'Next marker: '+target.name+'. Dismount, stop nearby, then interact.':'Story tracking is off. Select Track to follow this charter.');
  }else if(tab==='pack'){
   paragraph('Florins: '+s.credits+'. Equipment: '+s.resonance.tool+'. Sling: '+s.resonance.ready+' loaded / '+s.resonance.reserve+' reserve. Letters: '+s.papers+'.');
   const entries=Object.entries(r.items).filter(([id,q])=>ROAD_ITEMS[id]&&q>0);
   if(!entries.length)paragraph('Your new satchel is empty. The survey charter provides its own bound materials; no purchase is required to finish it.');
   for(const [id,q]of entries){const d=ROAD_ITEMS[id];make('h3',d.name+' x '+q,dialog);paragraph(d.type+(d.bound?' / Quest-bound, cannot be sold.':'.')+' '+d.detail);if(id==='tonic')button(dialog,'road-use-tonic','Use one tonic / review',()=>ask('use:tonic'));}
   button(dialog,'road-old-journal','Open original notebook and character',()=>{dialog.close();legacyJournal();});
   make('h3','Recent saved receipts',dialog);if(!r.receipts.length)paragraph('No exchanges yet.');for(const p of [...r.receipts].reverse().slice(0,5))paragraph('Receipt '+p.id+': '+p.summary+' Balance '+p.balance+'.');
   paragraph('Player-to-player trade is not enabled. Future trades need authenticated participants, locked offer revisions, both confirmations, and an atomic server exchange.');
  }else{
   for(const n of ROAD_NODES){make('h3',n.name,dialog);button(dialog,'road-mark-'+n.id,'Mark '+n.name+' on the map',()=>direct('mark:'+n.id));
    if(n.id==='maps')paragraph('Chart identification is part of the survey charter and costs 0 florins. Quest evidence cannot be dumped at vendors.');
    for(const [id,d]of Object.entries(ROAD_ITEMS).filter(([,d])=>d.shop===n.id)){
     paragraph(d.name+': buy '+d.buy+' florins; sell '+d.sell+' florins; you own '+(r.items[id]||0)+'. '+d.detail);
     button(dialog,'road-buy-'+id,'Buy 1 '+d.name+' / '+d.buy+' florins',()=>ask('buy:'+id),!roadNear(s,n.id));
     button(dialog,'road-sell-'+id,'Sell 1 '+d.name+' / '+d.sell+' florins',()=>ask('sell:'+id),!roadNear(s,n.id)||!r.items[id]);
    }
    if(['table','glass'].includes(n.id)){const id=n.id==='table'?'tonic':'lens';button(dialog,'road-craft-'+id,'Craft '+ROAD_ITEMS[id].name+' / review recipe',()=>ask('craft:'+id),!roadNear(s,n.id));}
   }
  }
  if(roadNear(s,'gate'))button(dialog,'road-cinder','Original Cinder Hollow expeditions',()=>{dialog.close();legacyFrontier();});
  const close=button(dialog,'road-close','Back / Close',()=>dialog.close());close.dataset.padDefault='';
 }
 for(const d of [dialog,review])d.addEventListener('close',()=>{if(d===review){offer=null;render();}setPause(false);});
 function open(page='story'){if(!playing())return false;tab=['story','pack','shops'].includes(page)?page:'story';error='';setPause(true);render();if(!dialog.open)dialog.showModal();return true;}
 return {open,close(){if(review.open){offer=null;review.close();return true;}if(dialog.open){dialog.close();return true;}return false;},interact(){const s=getState();if(!s.road.tracking&&s.road.stage===0)return false;if(!ROAD_NODES.some(n=>roadNear(s,n.id)))return false;const node=ROAD_NODES.find(n=>roadNear(s,n.id));if(node.id==='gate'&&!s.road.tracking)return false;return open(node.id===ROAD_STEPS[s.road.stage][0]?'story':['table','glass'].includes(node.id)?'shops':'story');},hint(){const s=getState();if(!s.road.tracking&&s.road.stage===0)return '';const n=ROAD_NODES.find(n=>roadNear(s,n.id));if(n?.id==='gate'&&!s.road.tracking)return '';return n?'INTERACT / '+n.name+' / X (Xbox), right B (XR), G or I (keyboard)':'';},inspect:()=>({tab,reviewOpen:review.open,busy:committing})};
}
