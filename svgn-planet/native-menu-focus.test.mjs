import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNativeMenuFocus,firstMissionControl,focusMissionList} from './native-menu-focus.mjs';
const controls=()=>Array.from({length:23},(_,i)=>({id:'button-'+i}));
test('Moving accessible focus past the sixth row reveals that exact control',()=>{const c=controls(),f=createNativeMenuFocus(),r={};assert.equal(f.sync(r,c,c[0],0),0);assert.equal(f.sync(r,c,c[6],0),1);assert.equal(f.sync(r,c,c[19],1),3);assert.equal(f.sync(r,c,c[2],3),0);});
test('Pointer Next and Previous remain intentional until accessible focus actually changes',()=>{const c=controls(),f=createNativeMenuFocus(),r={};f.sync(r,c,c[0],0);assert.equal(f.sync(r,c,c[0],2),2);assert.equal(f.sync(r,c,c[0],1),1);assert.equal(f.sync(r,c,c[7],1),1);});
test('Submenu and cancel-first confirmation reveal their own default focus',()=>{const c=controls(),f=createNativeMenuFocus();f.sync({},c,c[18],3);const keep={},replace={};assert.equal(f.sync({},[keep,replace],keep,3),0);});
test('A focused non-control or a removed button cannot select a phantom page',()=>{const c=controls(),f=createNativeMenuFocus(),r={};assert.equal(f.sync(r,c,{},2),2);assert.equal(f.sync(r,[c[0]],null,9),0);assert.equal(f.sync(null,[],null,-1),0);});
test('Re-entry resets presentation history without mutating controls',()=>{const c=controls(),before=JSON.stringify(c),f=createNativeMenuFocus(),r={};f.sync(r,c,c[13],0);f.reset();assert.equal(f.sync(r,c,c[13],0),2);assert.equal(JSON.stringify(c),before);});
test('Focus paging uses the same six-control ordering for small and large lists',()=>{const c=controls(),f=createNativeMenuFocus();for(let i=0;i<c.length;i++)assert.equal(f.sync({},c,c[i],0),Math.floor(i/6));assert.throws(()=>createNativeMenuFocus(0));});
const b=(id,disabled=false,active=false,hidden=false)=>({id,disabled,dataset:{missionActive:String(active)},closest:()=>hidden?{}:null});
test('Mission jump resumes the active available story without selecting or completing it',()=>{const a=b('main'),active=b('press',false,true),locked=b('locked',true,true),list={querySelectorAll:()=>[a,locked,active]};assert.equal(firstMissionControl(list),active);assert.equal(active.dataset.missionActive,'true');});
test('Fresh mission jump finds the first available task and skips inaccessible rows',()=>{const a=b('main'),list={querySelectorAll:()=>[b('hidden',false,false,true),b('done',true),a]};assert.equal(firstMissionControl(list),a);assert.equal(firstMissionControl(null),null);});
test('Unified XR actually invokes focus following and paints a visible focused marker',()=>{const s=readFileSync(new URL('./unified-xr.mjs',import.meta.url),'utf8');assert.match(s,/menuFocus\.sync\(r,controls,document\.activeElement,page\)/);assert.match(s,/focused:el===document\.activeElement/);});
test('Jobs uses direct mission focus while Pause keeps Resume as its default',()=>{const s=readFileSync(new URL('./main-hub.mjs',import.meta.url),'utf8');assert.ok(s.includes("wardMenu(name==='jobs'?'missions':'resume')"));assert.ok(s.includes("focusMissionList($('ward-missions'),$('ward-resume'))"));assert.ok(s.includes('id="ward-mission-list"'));});

test('A direct mission jump remains the default at the following controller poll',()=>{
 let focused=null;
 const make=id=>({id,disabled:false,dataset:{},attributes:new Set(),closest:()=>null,setAttribute(k){this.attributes.add(k);},removeAttribute(k){this.attributes.delete(k);},focus(){focused=this;}});
 const resume=make('resume'),old=make('old'),target=make('active');resume.setAttribute('data-pad-default');old.setAttribute('data-pad-default');target.dataset.missionActive='true';
 const list={querySelectorAll:q=>q==='[data-mission]'?[old,target]:[old,target].filter(b=>b.attributes.has('data-pad-default'))};
 assert.ok(focusMissionList(list,resume));assert.equal(focused,target);
 assert.deepEqual([resume,old,target].filter(b=>b.attributes.has('data-pad-default')),[target]);
});
test('A missing available mission leaves the safe Resume default untouched',()=>{
 let cleared=false;assert.equal(focusMissionList({querySelectorAll:()=>[]},{removeAttribute(){cleared=true;}}),false);assert.equal(cleared,false);
});
