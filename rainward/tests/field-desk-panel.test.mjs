import {test} from 'node:test';import assert from 'node:assert/strict';
import {createXRPanel} from '../xr-panel.mjs';
/* Minimal DOM/canvas stubs exercise production routing, not GPU or hardware. */
function setup(autoMap=true){
 let mode='pause',height=0;const drawn=[];const ctx=new Proxy({},{get:(o,k)=>o[k]||((...a)=>{if(k==='fillText')drawn.push(a);}),set:(o,k,v)=>(o[k]=v,true)});
 const el=id=>({id,tagName:'BUTTON',textContent:id,disabled:false,closest:()=>null,getClientRects:()=>[{}],getAttribute:()=>null,focus(){document.activeElement=this;}});
 const native=[el('resume'),...Array.from({length:9},(_,i)=>el('setting-'+i)),{...el('musicVolume'),tagName:'INPUT',type:'range',value:'40',min:'0',max:'100',step:'5'}];
 const map={width:400,height:400},sheet={querySelectorAll:()=>native,querySelector:s=>s==='canvas#map'?map:s==='#map-legend'?{textContent:'Known routes'}:{textContent:'Pause'},innerText:'Native text'};
 globalThis.document={activeElement:native[0],querySelector:()=>sheet,createElement:()=>({getContext:()=>ctx})};
 const desk=[{id:'desk-lower',label:'LOWER',run:()=>height--},{id:'desk-raise',label:'RAISE',run:()=>height++}];
 const panel=createXRPanel({mode:()=>mode,autoMap:()=>autoMap,deskActions:()=>desk,shortcutActions:()=>['map','pack','last-clue','last-reading'].map(id=>({id,label:id,run(){}})),extraActions:()=>[],status:()=>'',hint:()=>'',instructions:()=>'',isHeld:()=>false,hold(){},reset(){},back(){},recenter(){},exit(){}});
 const click=id=>{panel.collect();const r=panel.rows().find(r=>r.id===id);assert.ok(r,id);panel.select(panel.hit({x:(r.x+r.w/2)/1024,y:1-(r.y+r.h/2)/1024}));panel.collect();};
 panel.collect();return {panel,click,drawn,get height(){return height;},mode(value){mode=value;panel.collect();},dispose(){panel.dispose();delete globalThis.document;}};
}
test('Focused A placement is not stolen by an idle pointer over a different row',()=>{const f=setup();try{f.click('desk-layout');f.panel.navigate({nav:1},.016);f.panel.setHover('desk-lower');f.panel.navigate({confirm:true},.016);assert.equal(f.height,1);}finally{f.dispose();}});
test('Frequent pause actions and music controls are visible on the first page',()=>{const f=setup();try{const ids=f.panel.rows().map(r=>r.id);for(const id of ['resume','map','pack','last-clue','last-reading','musicVolume-minus','musicVolume-plus'])assert.ok(ids.includes(id),id);}finally{f.dispose();}});
test('Direct maps open as maps while the retained legacy option keeps manual read selection',()=>{for(const enabled of [true,false]){const f=setup(enabled);try{f.mode('map');assert.equal(f.panel.view(),enabled?'map':'controls');}finally{f.dispose();}}});
test('Long acquired text remains complete and paginated above the toolbar',()=>{const f=setup();try{const text=('Complete acquired instructions. ').repeat(70);f.panel.showDocument({title:'Inscription',text});assert.equal(f.panel.document().text,text);assert.ok(f.panel.document().pages>1);assert.ok(f.panel.document().visibleLines.length<=14);f.click('desk-layout');assert.equal(f.panel.view(),'desk');f.click('back');assert.equal(f.panel.view(),'text');assert.equal(f.panel.document().text,text);}finally{f.dispose();}});
