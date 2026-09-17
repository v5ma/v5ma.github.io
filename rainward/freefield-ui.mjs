import {freefieldOptions,saveFreefield} from './freefield.mjs';
import {XR_ACTIONS,XR_DEFAULT,XBOX_SLOTS,saveRemaps} from './freefield-remap.mjs';
export function createFreefieldUI({options,remaps,storage,changed}){
 const root=document.createElement('details');root.id='freefield-settings';
 const summary=document.createElement('summary');summary.id='freefield-settings-toggle';summary.textContent='MOVEMENT, QUIET AUDIO AND BUTTON REMAPS';root.append(summary);
 const field=document.createElement('div');field.className='settings';root.append(field);
 const add=(title,id,type,value,choices)=>{
  const label=document.createElement('label');label.textContent=title+' ';const el=document.createElement(type==='select'?'select':'input');el.id=id;
  if(type==='select'){for(const [v,text]of choices){const o=document.createElement('option');o.value=v;o.textContent=text;el.append(o);}el.value=value;}
  else{el.type=type;if(type==='checkbox')el.checked=value;else{el.value=value;el.min=id==='runSpeed'?6:0;el.max=id==='runSpeed'?14:100;el.step=id==='runSpeed'?1:5;}}
  label.append(el);field.append(label);return el;
 };
 const info=document.createElement('p');info.id='freefield-status';info.setAttribute('role','status');field.append(info);
 function persist(){const ok=saveFreefield(storage,options)&&saveRemaps(storage,remaps);info.textContent=ok?'Preferences saved. Checkpoints are unchanged.':'Preferences active for this session; browser storage is unavailable.';changed();}
 for(const [key,title,type,choices]of [
  ['freeStride','Free Stride / no running fatigue','checkbox'],['runSpeed','Running speed (metres/second)','range'],['blink','Allow fast blink travel','checkbox'],
  ['footsteps','Player footstep volume','range'],['waterVolume','Player water-movement volume','range'],['score','Music arrangement','select',[['quiet','Sparse / After the Rain'],['legacy','Legacy adaptive score'],['off','No music']]],
  ['xrLayout','Quest button preset','select',[['direct','Direct / A interact, B reload, X crouch, Y jump'],['legacy','Legacy Quest Fieldwork']]],['pinnedXR','Pinned field controls (legacy)','checkbox']]){
  const el=add(title,key,type,options[key],choices);el.addEventListener('input',()=>{options[key]=type==='checkbox'?el.checked:type==='range'?Number(el.value):el.value;Object.assign(options,freefieldOptions(options));persist();});
 }
 const names={lefttrigger:'Left trigger',leftgrip:'Left grip',leftstick:'Left stick click',leftprimary:'Left X',leftsecondary:'Left Y',righttrigger:'Right trigger',rightgrip:'Right grip',rightprimary:'Right A',rightsecondary:'Right B'};
 for(const key of Object.keys(XR_DEFAULT)){const el=add('Quest '+names[key],'remap-xr-'+key,'select',remaps.xr[key],XR_ACTIONS.map(a=>[a,a==='traverse'?'Jump / swim boost':a]));el.oninput=()=>{remaps.xr[key]=el.value;persist();};}
 const xboxNames={0:'A',1:'B',2:'X',3:'Y',4:'LB',5:'RB',6:'LT',7:'RT',10:'L3',11:'R3',12:'D-pad up',13:'D-pad down',14:'D-pad left',15:'D-pad right'};
 for(const id of XBOX_SLOTS){const el=add('Xbox '+xboxNames[id]+' acts as','remap-xbox-'+id,'select',String(remaps.xbox[id]),XBOX_SLOTS.map(i=>[String(i),xboxNames[i]+' in selected preset']));el.oninput=()=>{remaps.xbox[id]=Number(el.value);persist();};}
 const reset=document.createElement('button');reset.id='reset-button-remaps';reset.textContent='RESET BUTTON REMAPS';reset.onclick=()=>{Object.assign(remaps.xr,XR_DEFAULT);for(const i of XBOX_SLOTS)remaps.xbox[i]=i;for(const k of Object.keys(XR_DEFAULT))document.getElementById('remap-xr-'+k).value=remaps.xr[k];for(const i of XBOX_SLOTS)document.getElementById('remap-xbox-'+i).value=i;persist();};field.append(reset);
 const note=document.createElement('p');note.textContent='Menu A/B, headset system buttons, Quest R3 pause and the open-left-palm gesture stay reserved. Changes affect gameplay only. Left grip previews blink; release commits. Keyboard T blinks. Saved remaps do not alter shelter progress.';field.append(note);
 document.getElementById('pause').append(root);return {root};
}
