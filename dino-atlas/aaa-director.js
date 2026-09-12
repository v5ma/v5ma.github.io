import * as T from './vendor/three.module.js';
import {BUILDINGS,HARBORS,distance,surfaceAt} from './ranch-data.js';

const KEY='dino-atlas.aaa-director.v1';
export const AAA_BUILD='aaa-vslice-storm-20260911.1';
const MISSION='storm-response';
const EAST=BUILDINGS.find(b=>b.id==='east-hub');
const NORTH=BUILDINGS.find(b=>b.id==='north-lab');
const SOUTH=BUILDINGS.find(b=>b.id==='south-lab');
const EAST_PIER=HARBORS.find(h=>h.id==='east');
const SOUTH_PIER=HARBORS.find(h=>h.id==='south');
const stages=[
 {name:'Storm Response / Mobilize',detail:'Take a ground vehicle to Meridian Logistics Atrium. Follow the gold marker; the storm begins as you approach.',target:EAST},
 {name:'Storm Response / Restore backup power',detail:'Exit with Y / F, enter Meridian on foot, and activate the emergency generator panel with A / E.',target:{x:EAST.x+13,z:EAST.z-10}},
 {name:'Storm Response / Reach Northstar roof',detail:'Return outside, board the helicopter, fly to Northstar Canopy Institute, land on its roof and exit with Y / F.',target:NORTH},
 {name:'Storm Response / Calibrate the storm beacon',detail:'Walk across the Northstar rooftop to the illuminated storm beacon and press A / E.',target:{x:NORTH.x+10,z:NORTH.z+8}},
 {name:'Storm Response / Cross-island flight',detail:'Reboard the helicopter, fly to South Coast Biosecurity Center, land on its rooftop and exit.',target:SOUTH},
 {name:'Storm Response / Recover marine telemetry',detail:'Use the roof lift or ground entrance, then recover the emergency marine telemetry case inside the South Coast building.',target:{x:SOUTH.x+13,z:SOUTH.z-10}},
 {name:'Storm Response / Launch rescue boat',detail:'Reach South Rescue Pier and board the patrol boat. RT sails, LT reverses, left stick steers.',target:SOUTH_PIER},
 {name:'Storm Response / Deliver telemetry',detail:'Sail to East Freight Pier. Stop at the marked dock and press A / E to hand off the telemetry package.',target:EAST_PIER}
];
const defaults=()=>({version:1,active:null,stage:0,completed:[],checkpoint:0,storm:false,finishedAt:0});
export function sanitizeDirector(v){const s=defaults();if(!v||v.version!==1)return s;if(v.active===MISSION)s.active=v.active;if(Number.isInteger(v.stage))s.stage=Math.max(0,Math.min(stages.length-1,v.stage));if(Number.isInteger(v.checkpoint))s.checkpoint=Math.max(0,Math.min(stages.length-1,v.checkpoint));if(Array.isArray(v.completed))s.completed=[...new Set(v.completed.filter(x=>x===MISSION))];s.storm=!!v.storm;if(Number.isFinite(v.finishedAt))s.finishedAt=Math.max(0,Math.min(v.finishedAt,1e9));return s;}
export function readDirector(storage){try{return sanitizeDirector(JSON.parse(storage?.getItem(KEY)));}catch{return defaults();}}
export function saveDirector(storage,s){try{if(!storage)return false;storage.setItem(KEY,JSON.stringify(sanitizeDirector(s)));return true;}catch{return false;}}

export class AAADirector{
 constructor(ctx){this.ctx=ctx;this.s=readDirector(ctx.storage);this.time=0;this.lightning=5;this.flash=0;this.lastMode=ctx.fleet.mode;this.lastPosition={...ctx.fleet.position};this.stormMix=0;this.installWeather();this.installUI();if(this.s.active===MISSION)this.s.storm=true;}
 installWeather(){
  const g=new T.BufferGeometry(),count=420,pos=new Float32Array(count*3),seed=new Float32Array(count);for(let i=0;i<count;i++){pos[i*3]=(Math.random()-.5)*70;pos[i*3+1]=Math.random()*35;pos[i*3+2]=(Math.random()-.5)*70;seed[i]=Math.random();}g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('seed',new T.BufferAttribute(seed,1));
  this.rain=new T.Points(g,new T.PointsMaterial({color:0xbfd7df,size:.11,transparent:true,opacity:0,depthWrite:false}));this.rain.frustumCulled=false;this.ctx.scene.add(this.rain);
  this.flashLight=new T.HemisphereLight(0xe9f6ff,0x26323a,0);this.ctx.scene.add(this.flashLight);
 }
 installUI(){
  document.body.insertAdjacentHTML('beforeend',`<dialog id="aaa-director-dialog" aria-labelledby="aaa-director-title"><p class="eyebrow">PREMIUM VERTICAL SLICE / STORY MISSIONS</p><h2 id="aaa-director-title">Storm Response</h2><p id="aaa-director-copy"></p><button class="primary" id="aaa-director-start">Start Storm Response / A</button><button id="aaa-director-resume">Resume checkpoint / A</button><button id="aaa-director-abandon" class="quiet">Abandon current run</button><button data-aaa-close class="quiet">Back / B</button><p class="pad-help">D-pad or left stick navigates. A selects. B closes. Mission progress is saved separately from your journal, Ranch & Coast progress and economy.</p></dialog>`);
  const grid=document.querySelector('#menu-dialog .menu-grid');if(grid&&!document.getElementById('menu-aaa-director'))grid.insertAdjacentHTML('afterbegin','<button id="menu-aaa-director">Story mission: Storm Response</button>');
  document.getElementById('menu-aaa-director')?.addEventListener('click',()=>this.open());document.querySelector('[data-aaa-close]')?.addEventListener('click',()=>this.ctx.close());
  const d=document.getElementById('aaa-director-dialog');d?.addEventListener('cancel',e=>{e.preventDefault();this.ctx.close();});d?.addEventListener('close',()=>this.ctx.input.clear());
  document.getElementById('aaa-director-start').onclick=()=>this.begin(true);document.getElementById('aaa-director-resume').onclick=()=>this.begin(false);document.getElementById('aaa-director-abandon').onclick=()=>this.abandon();this.refreshDialog();
 }
 open(){this.refreshDialog();this.ctx.show('aaa-director-dialog');}
 refreshDialog(){const complete=this.s.completed.includes(MISSION),active=this.s.active===MISSION;const copy=document.getElementById('aaa-director-copy');if(copy)copy.innerHTML=`<p>A directed 20–30 minute cross-reserve assignment designed as the first premium-quality vertical slice: ground response, interior exploration, rooftop helicopter operations and storm-water boat delivery.</p><p><b>Status:</b> ${complete?'Completed once. Replay is available.':active?'Checkpoint '+(this.s.stage+1)+' / '+stages.length+'.':'Ready to deploy.'}</p><p>The mission never damages vehicles, clears journal data, or replaces Ranch & Coast progress.</p>`;const resume=document.getElementById('aaa-director-resume');if(resume)resume.disabled=!active;}
 begin(fresh){if(fresh||this.s.active!==MISSION){this.s={...defaults(),active:MISSION,stage:0,checkpoint:0,storm:true,completed:[...this.s.completed]};}else this.s.storm=true;this.ctx.ranch?.pauseTracking?.();this.save();this.ctx.close();this.ctx.radio('Storm Response active. Meridian Logistics reports a reserve-wide electrical fault. Ground units move first.');this.ctx.notify('Story mission pinned. Follow the gold objective marker.');}
 abandon(){this.s.active=null;this.s.storm=false;this.save();this.ctx.close();this.ctx.notify('Storm Response paused. Your checkpoint is preserved. Resume it from Menu.');}
 save(){return saveDirector(this.ctx.storage,this.s);}
 start(){if(this.s.active===MISSION)this.ctx.notify('Storm Response checkpoint restored: '+stages[this.s.stage].name);}
 task(){if(this.s.active!==MISSION)return null;const x=stages[this.s.stage];return {name:x.name,detail:x.detail,target:x.target,done:this.s.stage,total:stages.length};}
 advance(message){if(this.s.active!==MISSION)return;this.s.stage++;this.s.checkpoint=this.s.stage;if(this.s.stage>=stages.length){this.s.stage=stages.length-1;this.s.active=null;this.s.storm=false;if(!this.s.completed.includes(MISSION))this.s.completed.push(MISSION);this.s.finishedAt=this.time;window.__dinoEconomy?.grant?.(1800,'aaa:storm-response');this.ctx.audio.mission?.();this.ctx.input.pulse(.45,240);this.ctx.info('STORM RESPONSE COMPLETE','Reserve systems stabilized.','<p>You completed the first directed vertical-slice mission across ground vehicle, on-foot interior, helicopter and boat gameplay.</p><p>1,800 credits were awarded once. The mission remains replayable from Menu.</p>');this.save();return;}this.save();this.ctx.audio.tone?.(620,.12);this.ctx.input.pulse(.16,90);this.ctx.radio(message||stages[this.s.stage].name);}
 candidate(){if(this.s.active!==MISSION)return null;const p=this.ctx.fleet.position,mode=this.ctx.fleet.mode,s=this.s.stage;
  if(s===1&&mode==='foot'&&p.y<3&&distance(p,{x:EAST.x+13,z:EAST.z-10})<5)return {kind:'director',label:'Start Meridian emergency generator / A',type:'generator'};
  if(s===3&&mode==='foot'&&p.y>NORTH.h&&distance(p,{x:NORTH.x+10,z:NORTH.z+8})<5)return {kind:'director',label:'Calibrate Northstar storm beacon / A',type:'beacon'};
  if(s===5&&mode==='foot'&&p.y<3&&distance(p,{x:SOUTH.x+13,z:SOUTH.z-10})<5)return {kind:'director',label:'Recover marine telemetry / A',type:'telemetry'};
  if(s===7&&mode==='boat'&&distance(p,EAST_PIER)<34)return {kind:'director',label:'Deliver storm telemetry / A',type:'delivery'};return null;
 }
 interact(c){if(c.type==='generator')this.advance('Backup power is online. Air operations are cleared for Northstar.');else if(c.type==='beacon')this.advance('Northstar beacon calibrated. Cross the island to South Coast Biosecurity.');else if(c.type==='telemetry')this.advance('Marine telemetry secured. Launch the patrol boat from South Rescue Pier.');else if(c.type==='delivery')this.advance('Telemetry delivered. Reserve control confirms storm-routing recovery.');}
 update(dt,time){this.time=time;if(this.s.active===MISSION&&dt>0){const p=this.ctx.fleet.position,mode=this.ctx.fleet.mode,s=this.s.stage;if(s===0&&['jeep','buggy'].includes(mode)&&distance(p,EAST)<19)this.advance('Meridian reached. Dismount and restore its backup generator.');else if(s===2&&mode==='foot'&&surfaceAt(p)===NORTH.h&&distance(p,NORTH)<28)this.advance('Northstar rooftop secured. Calibrate the storm beacon on foot.');else if(s===4&&mode==='foot'&&surfaceAt(p)===SOUTH.h&&distance(p,SOUTH)<28)this.advance('South Coast rooftop secured. Enter the building and recover marine telemetry.');else if(s===6&&mode==='boat'&&distance(p,SOUTH_PIER)<36)this.advance('Rescue boat launched. Deliver the telemetry to East Freight Pier.');}
  this.updateWeather(dt,time);this.lastMode=this.ctx.fleet.mode;this.lastPosition={...this.ctx.fleet.position};
 }
 updateWeather(dt,time){const target=this.s.storm?1:0;this.stormMix+=(target-this.stormMix)*Math.min(1,dt*1.2);const mix=this.stormMix,p=this.ctx.fleet.position;this.rain.visible=mix>.02;this.rain.material.opacity=.55*mix;this.rain.position.set(p.x,p.y+1,p.z);if(this.rain.visible&&dt>0){const a=this.rain.geometry.attributes.position;for(let i=0;i<a.count;i++){let y=a.getY(i)-dt*(18+a.getX(i)%5);let x=a.getX(i)+dt*2.7;if(y<0)y+=35;if(x>35)x-=70;a.setXYZ(i,x,y,a.getZ(i));}a.needsUpdate=true;}
  if(this.ctx.scene.fog){this.ctx.scene.fog.near=100-55*mix;this.ctx.scene.fog.far=245-95*mix;}if(mix>.05){this.ctx.scene.background.lerp(new T.Color(0x40545c),Math.min(.65,mix*.45));this.ctx.scene.fog?.color?.lerp(new T.Color(0x40545c),Math.min(.65,mix*.45));}
  this.lightning-=dt;if(this.s.storm&&this.lightning<=0){this.lightning=6+Math.random()*10;this.flash=this.ctx.settings.reduced?.12:.48;this.ctx.audio.tone?.(52,.22);this.ctx.notify('Lightning over the reserve. Mission systems remain safe.');}this.flash=Math.max(0,this.flash-dt*1.9);this.flashLight.intensity=this.flash*5*mix;
 }
 drawMap(ctx,to,k,full){if(this.s.active!==MISSION)return;const t=stages[this.s.stage]?.target;if(!t)return;const [x,z]=to(t.x,t.z);ctx.strokeStyle='#f6e09a';ctx.lineWidth=full?3:2;ctx.beginPath();ctx.arc(x,z,full?13:8,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f6e09a';ctx.beginPath();ctx.arc(x,z,full?3:2,0,Math.PI*2);ctx.fill();}
 snapshot(){return {build:AAA_BUILD,state:JSON.parse(JSON.stringify(this.s)),task:this.task(),stormMix:this.stormMix};}
}
