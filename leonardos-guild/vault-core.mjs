import {VAULT_LAYOUT,VAULT_NODES,MIRROR_DIRECTIONS,inVaultArea,opticalOpen,vaultLine} from './vault-data.mjs';
/* Solo, bounded quest custody. Persist first; do not treat local saves as online authority. */
export function vaultState(raw){
 const r={version:1,layout:VAULT_LAYOUT,accepted:false,tracking:false,lens:'pack',weight:'pack',tool:'lens',mirror:0,notes:[],record:false,shortcut:false,reported:false,revision:0};
 if(!raw||raw.version!==1||raw.layout!==VAULT_LAYOUT)return r;
 r.accepted=raw.accepted===true;r.tracking=raw.tracking===true;r.revision=Number.isSafeInteger(raw.revision)&&raw.revision>=0&&raw.revision<100000000?raw.revision:0;
 if(!r.accepted)return r;
 r.lens=raw.lens==='emitter'?'emitter':'pack';r.weight=['shutter','service'].includes(raw.weight)?raw.weight:'pack';
 r.tool=['lens','weight','hand'].includes(raw.tool)?raw.tool:'lens';r.mirror=Number.isInteger(raw.mirror)&&raw.mirror>=0&&raw.mirror<4?raw.mirror:0;
 r.notes=Array.isArray(raw.notes)?[...new Set(raw.notes.filter(id=>['inscription','account'].includes(id)))]:[];
 r.record=raw.record===true;r.shortcut=raw.shortcut===true;r.reported=r.record&&raw.reported===true;
 r.revision=Number.isSafeInteger(raw.revision)&&raw.revision>=0&&raw.revision<100000000?raw.revision:0;
 return r;
}
export const saveVault=v=>vaultState(v);
const town=s=>s.frontier?.zone==='town'&&!s.quarter?.active&&!s.doors?.level&&!s.life?.inside;
const standing=s=>s.mode==='foot'&&Math.abs(s.speed||0)<=1.7&&(s.lift||0)<.5;
export const atVaultGuild=s=>town(s)&&standing(s)&&Math.hypot(s.x+8,s.z-3)<3.3;
export function nearVaultNode(s){
 if(!inVaultArea(s)||!standing(s))return null;
 return VAULT_NODES.filter(n=>Math.hypot(s.x-n.x,s.z-n.z)<2.25&&vaultLine(s,n,s)).sort((a,b)=>Math.hypot(s.x-a.x,s.z-a.z)-Math.hypot(s.x-b.x,s.z-b.z))[0]||null;
}
export function vaultInventory(v){
 if(!v?.accepted)return [];
 const a=[{id:'lens',name:'Inspection lens',where:v.lens==='pack'?'In your satchel':'Installed in the light instrument',detail:'Loaned, cannot be sold. Reveals the inscription or focuses the instrument.'},
 {id:'weight',name:'Brass counterweight',where:v.weight==='pack'?'In your satchel':'Installed at the '+v.weight+' socket',detail:'Loaned, cannot be sold. One physical weight: choose shutter or maintenance gate.'}];
 if(v.record)a.push({id:'plans',name:'Civic optical plans',where:v.reported?'Filed with Vinci Map House':'Protected quest evidence',detail:'Plans for a public reading instrument. Never consumed or sold.'});
 return a;
}
export function vaultTarget(s){
 const v=s.vault;if(!v?.tracking||s.road?.tracking||s.quarter?.active)return null;
 if(town(s)){if(!v.accepted||v.record&&!v.reported)return {id:'vault-guild',name:'Leonardo / Lantern Vault survey',x:-8,z:3,level:0};return {id:'vault-gate',name:'Expedition Gate / enter Cinder Hollow',x:0,z:-17,level:0};}
 if(s.frontier?.zone!=='badlands')return null;
 if(v.record)return {id:'vault-return',name:'Gate Camp / return to Vinci',x:300,z:20,level:0};
 return {...VAULT_NODES.find(n=>n.id===(inVaultArea(s)&&v.accepted?'record':'bench')),level:0};
}
export function vaultText(s){
 const t=vaultTarget(s);if(!t)return null;const v=s.vault;
 return {tag:'LANTERN VAULT / '+(v.reported?'SURVEY COMPLETE':'OPTICAL SURVEY'),title:!v.accepted?'A reply from the old workshop.':v.record&&!v.reported?'Bring the knowledge home.':v.reported?'A new craft in Vinci.':'Understand the light, or take the service route.',text:!v.accepted?'Meet Leonardo beside the Guild charter. Dismount; the survey loans both tools for free.':v.record&&!v.reported?(town(s)?'Report to Leonardo. The Map House can use these plans.':'Return through Gate Camp, then report to Leonardo in Vinci.'):v.reported?'Your optical plans restored a reading instrument at the Map House. The survey can be revisited; its reward is paid once.':town(s)?'Go on foot to the expedition gate and enter Cinder Hollow. The survey wing is east of Gate Camp.':'The records lie beyond the closed optical gate. Inspect the north plate, or move the counterweight to the south maintenance gate. Map and tools are on the survey desk.'};
}
export function vaultHint(s){
 if(atVaultGuild(s)&&s.vault?.tracking&&!s.road?.tracking)return 'INTERACT / Leonardo: Lantern Vault survey';
 const n=nearVaultNode(s);if(!n)return '';
 return n.name+' / G or I; Xbox X; XR right B: '+n.hint;
}
function plan(s,action){
 const v=structuredClone(vaultState(s.vault));let credits=s.credits,text='';
 const fail=error=>({ok:false,error});const near=nearVaultNode(s);
 if(s.health<=0)return fail('Recover before using the survey equipment.');
 if(action==='track'){v.tracking=true;text='Lantern Vault survey selected. The map shows the next destination.';}
 else if(action==='untrack'){v.tracking=false;text='Survey tracking hidden. All tools and discoveries are retained.';}
 else if(action==='accept'){
  if(v.accepted)return fail('Your survey tools are already loaned. Check the inventory for their location.');
  if(!atVaultGuild(s)&&near?.id!=='bench')return fail('Meet Leonardo or stop beside the survey bench.');
  v.accepted=true;v.tracking=true;text='Leonardo loans an inspection lens and one counterweight. Recover the civic optical plans; choose the light puzzle or the south service route. No purchase is required.';
 }else if(action==='report'){
  if(!atVaultGuild(s)||!v.record||v.reported)return fail('Bring the recovered plans to Leonardo. Each survey pays once.');
  if(!Number.isSafeInteger(credits)||credits>9999960)return fail('The florin balance is full. No reward or progress changed.');
  v.reported=true;credits+=40;text='Survey complete: 40 florins, once. Your plans restore a reading instrument outside the Map House. Your loaned tools remain available to revisit the workshop.';
 }else{
  if(!v.accepted)return fail('Borrow the tools from Leonardo or the survey bench first.');
  if(action.startsWith('equip:')){
   const tool=action.slice(6);if(!['lens','weight','hand'].includes(tool))return fail('Unknown survey tool.');
   if(tool!=='hand'&&v[tool]!=='pack')return fail('That tool is installed at '+v[tool]+'. Retrieve it there first.');
   v.tool=tool;text=tool==='hand'?'Empty hand selected.':'Selected '+(tool==='lens'?'inspection lens':'counterweight')+'. Use INTERACT beside a compatible object.';
  }else{
   if(!near||near.action!==action)return fail('Stand beside the actual object on its accessible side.');
   if(action==='emitter'){
    if(v.lens==='emitter'){v.lens='pack';v.tool='lens';text='Inspection lens retrieved. The beam is off until it is fitted again.';}
    else {if(v.tool!=='lens')return fail('The light instrument needs the inspection lens. Select it in Survey tools.');v.lens='emitter';v.tool='hand';text='Lens fitted. The light reaches the shutter; watch where it stops.';}
   }else if(action==='shutter'||action==='service'){
    if(v.weight===action){v.weight='pack';v.tool='weight';text='Counterweight retrieved. The '+action+' mechanism closes unless the inside return latch is open.';}
    else {if(v.weight!=='pack')return fail('Your only counterweight is at the '+v.weight+' socket. Retrieve it, or use the inside return latch.');if(v.tool!=='weight')return fail('Select the counterweight in Survey tools before fitting this socket.');v.weight=action;v.tool='hand';text=action==='shutter'?'The shutter rises. With the lens fitted, the light can reach the turning reflector.':'The south maintenance gate opens. This is an alternative to the optical puzzle.';}
   }else if(action==='mirror'){v.mirror=(v.mirror+1)%4;text='Reflector points '+MIRROR_DIRECTIONS[v.mirror]+'. '+(opticalOpen(v)?'The receiver lights and the records gate opens.':'Observe the beam and receiver; the north inscription can help.');}
   else if(action==='inspect'){if(v.tool!=='lens'||v.lens!=='pack')return fail('Hold the inspection lens from your satchel to read through the mineral film.');if(!v.notes.includes('inscription'))v.notes.push('inscription');text='Through the lens: "Raise the shutter; turn the ray EAST toward the rising-sun receiver." This clue is recorded on your survey desk.';}
   else if(action==='account'){if(!v.notes.includes('account'))v.notes.push('account');text='Caretaker: "They called the road unprofitable. I kept its reading lamps working for families who could not pay. The service gate takes the same counterweight." Account recorded.';}
   else if(action==='record'){if(v.record)return fail('The plans are already protected in your satchel.');v.record=true;text='Civic optical plans recovered. Open the inside return latch, return through Gate Camp, and report to Leonardo.';}
   else if(action==='latch'){v.shortcut=true;text='Both return gates are unlatched permanently. The workshop now reconnects to its entrance; tools can be retrieved safely.';}
   else return fail('This action is unavailable.');
  }
 }
 if(v.revision>=99999999)return fail('Survey record limit reached.');v.revision++;
 return {ok:true,vault:v,credits,text};
}
const fingerprint=s=>JSON.stringify([s.vault,s.credits]);
export function reviewVaultAction(s,action){const p=plan(s,action);return p.ok?Object.freeze({ok:true,action,text:p.text,credits:p.credits,expected:fingerprint(s)}):p;}
export function commitVaultAction(s,review,persist){
 if(!review?.ok||review.expected!==fingerprint(s))return {ok:false,error:'The survey state changed. Try the interaction again.'};
 const p=plan(s,review.action);if(!p.ok)return p;
 if(p.text!==review.text||p.credits!==review.credits)return {ok:false,error:'The proposed action changed. Review it again.'};
 const road=p.vault.tracking&&['track','accept'].includes(review.action)&&s.road?{...s.road,tracking:false}:s.road;
 try{if(typeof persist!=='function'||persist({...s,vault:p.vault,credits:p.credits,road})!==true)throw Error('Storage did not confirm the save.');}catch(e){return {ok:false,error:'Not saved: '+e.message+' Nothing was moved or awarded.'};}
 s.vault=p.vault;s.credits=p.credits;if(road)s.road=road;return {ok:true,text:p.text};
}
