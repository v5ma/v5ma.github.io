import * as T from './vendor/three.module.js';
import {box,part,label,material} from './ranger-art.js';
import {BUILDINGS,distance} from './ranch-data.js';
import {bakeStatics} from './frontier-art.js?v=herds1';

export const NORTHSTAR_BUILD='northstar-signature-20260912.1';
export const NORTHSTAR_KEY='dino-atlas.northstar-signature.v1';
export const NORTHSTAR=BUILDINGS.find(b=>b.id==='north-lab');
export const CIRCUIT_REWARD=750;
export const CIRCUIT_POINTS={
 start:{x:NORTHSTAR.x-5,y:1,z:NORTHSTAR.z+NORTHSTAR.hz+5},
 seed:{x:NORTHSTAR.x+13,y:1,z:NORTHSTAR.z-10},
 roof:{x:NORTHSTAR.x-8,y:NORTHSTAR.h+1,z:NORTHSTAR.z+8},
 observatory:{x:NORTHSTAR.x-8,y:NORTHSTAR.h+1,z:NORTHSTAR.z-8},
 report:{x:NORTHSTAR.x-5,y:1,z:NORTHSTAR.z+NORTHSTAR.hz+5}
};
export const SERVICE_TOP={x:NORTHSTAR.x+NORTHSTAR.hx+8.2,y:NORTHSTAR.h+2.1,z:NORTHSTAR.z+NORTHSTAR.hz+1};
export const SERVICE_ROOF={x:NORTHSTAR.x+NORTHSTAR.hx-6,y:NORTHSTAR.h+1.1,z:NORTHSTAR.z+NORTHSTAR.hz-5};
export function serviceGateAt(p,mode,speed=0){if(mode!=='foot'||Math.abs(speed)>3||p.y<NORTHSTAR.h-2)return null;if(distance(p,SERVICE_TOP)<5)return 'roof';if(distance(p,SERVICE_ROOF)<5)return 'stairs';return null;}
export const CIRCUIT_STEPS=[
 ['Start the Canopy Circuit','Park outside Northstar. Continue on foot and press A at the canopy operations console.',CIRCUIT_POINTS.start],
 ['Restore the seed-vault relay','Enter through the pedestrian doorway and follow the service corridor to the amber seed-vault relay.',CIRCUIT_POINTS.seed],
 ['Reach the roof wind sensor','Choose your route: use the maintenance lift, or leave through the front and climb the illuminated exterior SERVICE ASCENT. Press A at the roof sensor.',CIRCUIT_POINTS.roof],
 ['Cross the canopy spine','Walk across the rooftop observatory and reset the canopy circulation console. The helicopter pad remains clear.',CIRCUIT_POINTS.observatory],
 ['File the emergency report','Return to the ground canopy console by lift or service stair and file the report. Replays remain available without another first-completion reward.',CIRCUIT_POINTS.report]
];
export function emptyCircuit(){return {version:1,active:false,stage:0,elapsed:0,completed:0,best:null,rewarded:false,lastRoute:'none'};}
export function sanitizeCircuit(v){const s=emptyCircuit();if(!v||v.version!==1)return s;s.active=v.active===true;if(Number.isInteger(v.stage))s.stage=Math.max(0,Math.min(4,v.stage));for(const k of ['elapsed','best'])if(Number.isFinite(v[k])&&v[k]>=0)s[k]=Math.min(86400,v[k]);if(Number.isInteger(v.completed))s.completed=Math.max(0,Math.min(1e6,v.completed));s.rewarded=v.rewarded===true;if(['none','lift','service'].includes(v.lastRoute))s.lastRoute=v.lastRoute;return s;}
export function readCircuit(storage){try{return sanitizeCircuit(JSON.parse(storage?.getItem(NORTHSTAR_KEY)));}catch{return emptyCircuit();}}
export function saveCircuit(storage,s){try{storage?.setItem(NORTHSTAR_KEY,JSON.stringify(sanitizeCircuit(s)));return !!storage;}catch{return false;}}
export function startCircuit(s,restart=false){if(restart||!s.active){s.active=true;s.stage=0;s.elapsed=0;s.lastRoute='none';}return s;}
export function circuitAction(s,p,mode,speed=0){if(!s.active||mode!=='foot'||Math.abs(speed)>3)return null;const point=CIRCUIT_STEPS[s.stage][2],radius=s.stage===0||s.stage===4?4.8:4.2;return Math.abs((p.y??1)-point.y)<2&&distance(p,point)<radius?'circuit':null;}
export function advanceCircuit(s){if(!s.active)return null;if(s.stage<4){s.stage++;return {complete:false,stage:s.stage};}s.active=false;s.completed++;s.best=s.best===null?s.elapsed:Math.min(s.best,s.elapsed);const first=!s.rewarded;s.rewarded=true;return {complete:true,first,reward:first?CIRCUIT_REWARD:0,time:s.elapsed};}

function solid(physics,g,c,x,y,z,sx,sy,sz){box(g,c,x-NORTHSTAR.x,y,z-NORTHSTAR.z,sx,sy,sz);physics.box(x,y,z,sx/2,sy/2,sz/2);}
function rail(physics,g,x,y,z,sx,sy,sz){solid(physics,g,0x88b5a5,x,y,z,sx,sy,sz);}
function stairFlight(physics,g,x,z0,z1,y0,y1,steps){const dz=(z1-z0)/steps,dy=(y1-y0)/steps;for(let i=0;i<steps;i++){const top=y0+dy*(i+1),z=z0+dz*(i+.5),h=top;solid(physics,g,0x6e8074,x,h/2,z,2.7,h,Math.abs(dz)+.08);if(i>=3&&i<steps-5){rail(physics,g,x+1.5,top+.65,z,.12,1.3,Math.abs(dz)+.1);rail(physics,g,x-1.5,top+.65,z,.12,1.3,Math.abs(dz)+.1);}}}
export function buildNorthstarSignature(scene,physics){
 const root=new T.Group();root.position.set(NORTHSTAR.x,0,NORTHSTAR.z);scene.add(root);
 const structure=new T.Group(),lights=new T.Group(),story=new T.Group();root.add(structure,lights,story);
 const glass=new T.MeshStandardMaterial({color:0x8ed9c8,roughness:.18,metalness:.08,transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false});
 // A recognizable canopy crown occupies the rear-west roof while keeping the helipad centre open.
 for(let i=0;i<5;i++){const rib=part(structure,new T.TorusGeometry(6.4,.12,6,40,Math.PI),material(0x8bb7a8),-8,NORTHSTAR.h+1.1,-9+i*3.2);rib.rotation.z=0;}
 const dome=part(structure,new T.SphereGeometry(6.1,24,12,0,Math.PI*2,0,Math.PI/2),glass,-8,NORTHSTAR.h+.25,-2.5);dome.scale.z=1.25;
 for(const [x,z] of [[-16,-11],[-16,7],[1,-11]]){box(structure,0x455f58,x,NORTHSTAR.h+5.8,z,.55,11.6,.55);const lamp=part(lights,new T.SphereGeometry(.34,8,6),new T.MeshBasicMaterial({color:0xa6f1dc}),x,NORTHSTAR.h+11.8,z);lamp.userData.pulse=true;}
 const crown=part(structure,new T.TorusGeometry(8,.16,6,48),new T.MeshBasicMaterial({color:0xb8ead5}),-8,NORTHSTAR.h+8,-2);crown.rotation.x=Math.PI/2;crown.scale.y=.55;
 const towerTitle=label('NORTHSTAR CANOPY / OBSERVATION SPINE',25,1.2,'#24473f','#d7f0d9');towerTitle.position.set(-8,NORTHSTAR.h+5,-11.8);structure.add(towerTitle);
 // Environmental storytelling around the ground service entry and roof research canopy.
 for(let i=0;i<4;i++){box(story,0x596f61,-15+i*3.2,1.1,NORTHSTAR.hz+3.2,2.2,2.1,1.4);box(story,0xb9caa8,-15+i*3.2,1.25,NORTHSTAR.hz+3.93,1.1,.7,.05);}
 const seed=label('SEED VAULT / MANUAL RELAY',12,.8);seed.position.set(13,3,-10);story.add(seed);
 const climate=label('CANOPY CLIMATE / WIND + HUMIDITY',15,.8);climate.position.set(-8,NORTHSTAR.h+3.1,8);story.add(climate);
 const service=label('SERVICE ASCENT / ROOF ON FOOT',17,1,'#314c45','#f1d18d');service.position.set(NORTHSTAR.hx+6,3,NORTHSTAR.hz+2);story.add(service);
 // Exterior service ascent: two wide switchback flights terminate at a deliberate roof airlock; the existing safety rail remains solid.
 const x1=NORTHSTAR.hx+4.2,x2=NORTHSTAR.hx+8.2,zFront=NORTHSTAR.hz+1,zBack=-NORTHSTAR.hz+4;
 stairFlight(physics,structure,NORTHSTAR.x+x1,NORTHSTAR.z+zFront,NORTHSTAR.z+zBack,0,12,40);
 solid(physics,structure,0x65796d,NORTHSTAR.x+(x1+x2)/2,11.85,NORTHSTAR.z+zBack,x2-x1+3,.3,2.4);
 stairFlight(physics,structure,NORTHSTAR.x+x2,NORTHSTAR.z+zBack,NORTHSTAR.z+zFront,12,NORTHSTAR.h+1.2,44);
 const airlock=label('A / ROOF AIRLOCK',10,.8,'#314c45','#f1d18d');airlock.position.set(x2,NORTHSTAR.h+4,zFront);story.add(airlock);
 const descent=label('A / SERVICE DESCENT',12,.8,'#314c45','#f1d18d');descent.position.set(NORTHSTAR.hx-6,NORTHSTAR.h+3,zFront-5);story.add(descent);
 // Consoles and objective lamps are separate so their state can pulse without changing static collision.
 const console=(p,name)=>{const g=new T.Group();g.position.set(p.x-NORTHSTAR.x,p.y-1,p.z-NORTHSTAR.z);box(g,0x34584f,0,.85,0,1.25,1.7,1);const lamp=part(g,new T.OctahedronGeometry(.34),new T.MeshBasicMaterial({color:0xf3cb79}),0,2,0);const tag=label(name,9,.72);tag.position.set(0,3,0);g.add(tag);story.add(g);return {g,lamp,p};};
 const consoles=[console(CIRCUIT_POINTS.start,'A / CANOPY CIRCUIT'),console(CIRCUIT_POINTS.seed,'A / SEED RELAY'),console(CIRCUIT_POINTS.roof,'A / WIND SENSOR'),console(CIRCUIT_POINTS.observatory,'A / CANOPY RESET')];
 const stageRing=part(lights,new T.RingGeometry(1.15,1.4,36),new T.MeshBasicMaterial({color:0xffd27c,transparent:true,opacity:.75,side:T.DoubleSide,depthWrite:false}),0,.12,0);stageRing.rotation.x=-Math.PI/2;
 const pointLights=[[-8,NORTHSTAR.h+5,-2,0x7fd8c4],[-15,4,12,0xf0c778],[12,7,-4,0xa7d9ca]].map(([x,y,z,c])=>{const l=new T.PointLight(c,12,30,2);l.position.set(x,y,z);lights.add(l);return l;});
 bakeStatics(structure);bakeStatics(story,consoles.map(o=>o.lamp));
 return {root,consoles,stageRing,pointLights,service:{x:NORTHSTAR.x+x2,z:NORTHSTAR.z,top:NORTHSTAR.h+1.4},setStage(stage,active){const c=consoles[stage===4?0:Math.max(0,Math.min(3,stage))];stageRing.visible=!!active;if(c)stageRing.position.set(c.p.x-NORTHSTAR.x,.12+(c.p.y>4?c.p.y:0),c.p.z-NORTHSTAR.z);consoles.forEach((o,i)=>{o.lamp.material.color.setHex(active&&i===(stage===4?0:stage)?0xffdb85:0x7bb3a1);});},update(time,reduced=false){for(const [i,l] of pointLights.entries())l.intensity=reduced?8:9+Math.sin(time*1.8+i)*3;for(const o of consoles)o.lamp.rotation.y+=reduced?0:.02;}};
}

export class NorthstarSignature{
 constructor(ctx){this.ctx=ctx;this.s=readCircuit(ctx.storage);this.world=ctx.signatureWorld||buildNorthstarSignature(ctx.scene,ctx.physics);this.clock=0;this.installUI();this.world.setStage(this.s.stage,this.s.active);}
 save(){return saveCircuit(this.ctx.storage,this.s);}
 pause(){this.s.active=false;this.save();this.world.setStage(this.s.stage,false);}
 begin(restart=false){this.ctx.director?.suspend();this.ctx.herds?.pause();this.ctx.ranch?.pauseTracking();startCircuit(this.s,restart);this.save();this.world.setStage(this.s.stage,true);this.ctx.close();this.ctx.radio(CIRCUIT_STEPS[this.s.stage][1]);}
 installUI(){document.body.insertAdjacentHTML('beforeend',`<dialog id="northstar-dialog" aria-labelledby="northstar-title"><p class="eyebrow">SIGNATURE DISTRICT / NORTHSTAR CANOPY</p><h2 id="northstar-title">Canopy Circuit emergency drill</h2><p>Northstar now has a rooftop research canopy, illuminated service ascent, interior service route and a repeatable five-step emergency circuit. The helipad stays usable.</p><p id="northstar-status"></p><div class="entry-list"><button class="primary" id="northstar-start">Start or continue Canopy Circuit</button><button id="northstar-restart">Restart circuit from the entrance</button><button id="northstar-pause">Suspend drill and explore</button><button id="northstar-close">Back to play / B</button></div><p>At the roof stage you can take the maintenance lift or walk outside and climb the marked switchback stair. First completion pays 750 credits; replays record time without duplicating that reward.</p><p class="pad-help">D-pad / left stick navigates. A selects. B closes. Y enters/leaves vehicles. X remains reload.</p></dialog>`);document.querySelector('#menu-dialog .menu-grid')?.insertAdjacentHTML('afterbegin','<button id="menu-northstar">Northstar Canopy Circuit</button>');
 const $=id=>document.getElementById(id);$('menu-northstar').onclick=()=>this.open();$('northstar-start').onclick=()=>this.begin(false);$('northstar-restart').onclick=()=>this.begin(true);$('northstar-pause').onclick=()=>{this.pause();this.ctx.close();};$('northstar-close').onclick=()=>this.ctx.close();$('northstar-dialog').addEventListener('cancel',e=>{e.preventDefault();this.ctx.close();});$('northstar-dialog').addEventListener('close',()=>this.ctx.input.clear());document.addEventListener('click',e=>{if(e.target.closest?.('[data-job],[data-track],#campaign-track,#pen-track,#aaa-director-start,#aaa-director-resume,#herds-study-start'))this.pause();},true);}
 open(){const $=id=>document.getElementById(id),best=this.s.best===null?'--':this.s.best.toFixed(1)+' s';$('northstar-status').textContent=this.s.active?`Active stage ${this.s.stage+1} / 5: ${CIRCUIT_STEPS[this.s.stage][0]}`:`Completed runs ${this.s.completed}. Best ${best}. Last roof route: ${this.s.lastRoute}.`;this.ctx.show('northstar-dialog');}
 task(){if(!this.s.active)return null;const [title,detail,target]=CIRCUIT_STEPS[this.s.stage];return {name:'Northstar Canopy / '+title,detail,target,done:this.s.stage,total:5};}
 candidate(){const f=this.ctx.fleet,gate=serviceGateAt(f.position,f.mode,f.actor.speed);if(gate)return {kind:'northstar',type:'service-gate',gate,label:gate==='roof'?'Open roof service airlock / A':'Use exterior service descent / A'};if(circuitAction(this.s,f.position,f.mode,f.actor.speed))return {kind:'northstar',type:'circuit',label:['Start Canopy Circuit / A','Restore seed-vault relay / A','Read roof wind sensor / A','Reset canopy spine / A','File Canopy Circuit report / A'][this.s.stage]};return null;}
 interact(){const candidate=this.candidate();if(!candidate)return false;if(candidate.type==='service-gate'){const to=candidate.gate==='roof'?SERVICE_ROOF:SERVICE_TOP;this.ctx.fleet.person.setActive(true,to);if(candidate.gate==='roof'&&this.s.active&&this.s.stage===2)this.s.lastRoute='service';this.ctx.audio.tone?.(290,.16);this.ctx.notify(candidate.gate==='roof'?'Roof airlock opened. You crossed onto the Northstar canopy deck.':'Service airlock opened. Descend the exterior switchback on foot.');this.save();this.ctx.save();return true;}const result=advanceCircuit(this.s);if(!result)return false;if(result.complete){const awarded=result.first&&window.__dinoEconomy?.grant?.(CIRCUIT_REWARD,'aaa:northstar-canopy');this.ctx.audio.mission?.();this.ctx.input.pulse(.35,180);this.ctx.info('CANOPY CIRCUIT COMPLETE','Northstar is stable.',`<p>The seed-vault relay, roof wind sensor and canopy circulation system are stable. Your route was <b>${this.s.lastRoute}</b>.</p><p>Time: ${result.time.toFixed(1)} s. Best: ${this.s.best.toFixed(1)} s.</p><p>${awarded?'750 credits added to your saved balance.':'The first-completion reward was already collected or could not be confirmed. Replays remain available.'}</p>`);}else{this.ctx.audio.tone?.(610,.1);this.ctx.input.pulse(.14,80);this.ctx.radio(CIRCUIT_STEPS[this.s.stage][1]);}this.save();this.world.setStage(this.s.stage,this.s.active);this.ctx.save();return true;}
 update(dt,time){if(dt>0)this.world.update(time,this.ctx.settings.reduced);if(dt<=0||!this.s.active)return;this.s.elapsed+=dt;const p=this.ctx.fleet.position;if(this.s.stage===2&&this.s.lastRoute==='none'&&p.y>NORTHSTAR.h-1&&distance(p,{x:NORTHSTAR.x-12,z:NORTHSTAR.z-9})<7){this.s.lastRoute='lift';this.save();}}
 drawMap(ctx,to,k,full){const [x,z]=to(NORTHSTAR.x,NORTHSTAR.z);ctx.strokeStyle='#f0d18b';ctx.lineWidth=full?3:2;ctx.beginPath();ctx.arc(x,z,full?9:6,0,Math.PI*2);ctx.stroke();if(full){ctx.fillStyle='#f0d18b';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('Northstar Canopy',x,z-12);}}
 snapshot(){return {build:NORTHSTAR_BUILD,state:{...this.s},task:this.task()};}
}
