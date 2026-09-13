// Pelagic Station is a fictional, nonlethal flooded-facility mission.
// It uses a separate save namespace and never clears a previous game record.
export const AQUATICS_BUILD='aquatics-20260912.1';
export const AQUATICS_KEY='dino-atlas.aquatics.v1';
export const LAB={x:-376,z:0,hx:24,hz:26,deck:2.7,floor:.18,high:2.25,low:.56};
export const AQUA_HARBOR={id:'aquatics',name:'Pelagic Station Pier',x:-411,z:20,land:{x:-409,z:20},boat:{x:-438,z:20}};
export const HOME_DOCK={x:-78,z:-151,boat:{x:-94,z:-151},land:{x:-73,z:-151}};
export const ROUTE=[{x:-236,z:-152},{x:-304,z:-152},{x:-442,z:-152},{x:-449,z:-60},AQUA_HARBOR.boat];
export const POINTS={breaker:{x:-395,y:3.8,z:21},intake:{x:-396,y:3.8,z:-13},pump:{x:-396,y:3.8,z:-20},stairs:{x:-389,y:3.6,z:19},archive:{x:-363,y:1.3,z:-10},sample:{x:-359,y:1.3,z:5}};
export const STEPS=[
 {name:'Reach Pelagic Station by boat',detail:'Request the unoccupied patrol boat at Wetland Dock. Y / F boards. RT sails, LT reverses. Follow the west-channel markers to Pelagic Pier.'},
 {name:'Restore the pool safety circuit',detail:'Stop at the pier and exit with Y / F. Climb the entry stairs and press A / E at the amber safety breaker. The pool is too deep to enter yet.'},
 {name:'Isolate the seawater intake',detail:'Walk along the west-side pool deck to the large intake wheel. A / E opens its controls. Close the intake before running the drain pump.'},
 {name:'Drain the flooded archive wing',detail:'Operate the pump at the north end of the deck. Watch the actual water level fall. The access gate opens only when the pool is shallow enough.'},
 {name:'Recover the submerged research',detail:'Use the south pool steps. Wade through the shallow basin to the east archive room. Recover both the habitat archive and sealed sample case with A / E.'},
 {name:'Deliver the samples to Wetland Dock',detail:'Return up the pool stairs, leave the facility, and board your boat at Pelagic Pier. Follow the channel home. Stop and press A / E to hand over both cases.'},
];
export const insideLab=(p,margin=0)=>Math.abs(p.x-LAB.x)<LAB.hx+margin&&Math.abs(p.z-LAB.z)<LAB.hz+margin&&p.y<9;
export const clearLabSite=(x,z)=>Math.abs(x-LAB.x)<LAB.hx+8&&Math.abs(z-LAB.z)<LAB.hz+8||x< -398&&x> -420&&Math.abs(z-20)<8;
export const inBasin=p=>p.x>LAB.x-16&&p.x<LAB.x+4&&p.z> -18&&p.z<16;
export const inArchive=p=>p.x>LAB.x+6&&p.x<LAB.x+21&&p.z> -17&&p.z<10;
export const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const near=(p,q,r=3)=>gap(p,q)<r&&Math.abs(p.y-q.y)<2;
export function emptyAquatics(){return {version:1,active:false,stage:0,leg:0,returnLeg:0,breaker:false,intakeClosed:false,pumping:false,water:LAB.high,archive:false,sample:false,completed:false,rewarded:false,inspection:true,refraction:true,bestTime:null,elapsed:0};}
export function sanitizeAquatics(v){
 const s=emptyAquatics();if(!v||v.version!==1)return s;
 for(const k of ['active','breaker','intakeClosed','pumping','archive','sample','completed','rewarded','inspection','refraction'])if(typeof v[k]==='boolean')s[k]=v[k];
 for(const [k,max] of [['stage',6],['leg',4],['returnLeg',4]])if(Number.isInteger(v[k]))s[k]=Math.max(0,Math.min(max,v[k]));
 if(Number.isFinite(v.water))s.water=Math.max(LAB.low,Math.min(LAB.high,v.water));
 if(Number.isFinite(v.elapsed))s.elapsed=Math.max(0,Math.min(86400,v.elapsed));
 if(Number.isFinite(v.bestTime)&&v.bestTime>0)s.bestTime=Math.min(86400,v.bestTime);
 // Never accept a physically impossible drain or a reward without completion.
 if(!s.breaker||!s.intakeClosed)s.pumping=false;
 if(!s.breaker){s.water=LAB.high;s.intakeClosed=false;}
 if(s.completed){s.stage=6;s.active=false;s.breaker=true;s.intakeClosed=true;s.water=LAB.low;s.archive=true;s.sample=true;s.pumping=false;}
 if(!s.completed){s.rewarded=false;if(s.stage===6)s.stage=0;}
 return s;
}
export function readAquatics(storage){try{return sanitizeAquatics(JSON.parse(storage?.getItem(AQUATICS_KEY)));}catch{return emptyAquatics();}}
export function saveAquatics(storage,s){try{if(!storage)return false;storage.setItem(AQUATICS_KEY,JSON.stringify(sanitizeAquatics(s)));return true;}catch{return false;}}
export function beginAquatics(s){if(s.completed)return false;s.active=true;return true;}
export function advanceAquatics(s,event){
 if(!s.active)return false;
 if(s.stage===0&&event==='arrive'){s.stage=1;return true;}
 if(s.stage===1&&event==='breaker'){s.breaker=true;s.stage=2;return true;}
 if(s.stage===2&&event==='isolate'){s.intakeClosed=true;s.stage=3;return true;}
 if(event==='pump'&&s.stage===3&&s.breaker&&s.intakeClosed){s.pumping=true;return true;}
 if(s.stage===4&&(event==='archive'||event==='sample')){s[event]=true;if(s.archive&&s.sample)s.stage=5;return true;}
 if(s.stage===5&&event==='deliver'&&s.archive&&s.sample){s.completed=true;s.stage=6;s.active=false;s.bestTime=s.bestTime===null?s.elapsed:Math.min(s.bestTime,s.elapsed);return true;}
 return false;
}
export function tickAquatics(s,dt){
 if(!s.active||!Number.isFinite(dt)||dt<=0)return false;
 dt=Math.min(.1,dt);s.elapsed+=dt;
 if(s.pumping&&s.breaker&&s.intakeClosed){s.water=Math.max(LAB.low,s.water-dt*.22);if(s.water<=LAB.low+1e-5){s.water=LAB.low;s.pumping=false;s.stage=4;return true;}}
 return false;
}
export function shallowSafe(s){return s.water<=.72;}
export function movementInLab(s,p){
 const feet=p.y-.9,wet=(inBasin(p)||inArchive(p))&&feet<s.water-.05;
 return {scale:wet?.58:1,deep:wet&&s.water-feet>1.1,wet};
}
export function actionAtAquatics(s,p,mode,speed=0){
 if(!s.active||Math.abs(speed)>2.7)return null;
 if(s.stage===0&&mode==='foot'&&gap(p,HOME_DOCK.land)<10)return 'boat-service';
 if(s.stage===5&&mode==='boat'&&gap(p,HOME_DOCK.boat)<15)return 'deliver';
 if(mode!=='foot')return null;
 if(s.stage>=1&&near(p,POINTS.breaker))return 'breaker';
 if(s.stage>=2&&near(p,POINTS.intake))return 'intake';
 if(s.stage>=2&&near(p,POINTS.pump))return 'pump';
 if(s.stage===4&&shallowSafe(s)&&!s.archive&&near(p,POINTS.archive))return 'archive';
 if(s.stage===4&&shallowSafe(s)&&!s.sample&&near(p,POINTS.sample))return 'sample';
 return null;
}
