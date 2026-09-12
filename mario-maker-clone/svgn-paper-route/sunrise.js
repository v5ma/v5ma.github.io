/* Existing Sunrise chapter plus an optional, collision-backed practice balcony. */
import {BUILD,BRANCH,STORE,upgradeCourse,freshRun,observe,incident,sanitize,settle,mission,cues} from './sunrise-core.mjs';
const prior=window.GroundCampaign,campaign=window.DeliveryCampaign;
const make=(n,T)=>upgradeCourse(prior.make(n,T));
const build=(i,T)=>i<4?campaign.build(i,T):make(i-4,T);
window.GroundCampaign=Object.freeze({...prior,make,build});
window.DeliveryCampaign=Object.freeze({...campaign,build,routes:campaign.routes.map((r,i)=>i===4?{...r,description:r.description+' Try Penny\'s low Market Pocket Park detour and earn a Market Pilot seal.'}:r)});
SkyRoutes.build=build;
let run=null,record=sanitize(null),saveOK=true;
try{record=sanitize(JSON.parse(localStorage.getItem(STORE)||'null'));}catch{saveOK=false;}
const eligible=()=>mode==='play'&&__delivery.state.route===4&&__sky.state.data?.gp?.sunrise?.version===1&&__delivery.state.code===levelCode();
const active=()=>run&&!run.finished&&mode==='play'&&!won&&!__delivery.paused&&!__delivery.state.menu&&!document.hidden;
const hook=(name,wrap)=>{const old=window[name];if(typeof old==='function')window[name]=wrap(old);};
hook('loadCode',old=>function(...args){const result=old.apply(this,args);if(result)run=null;return result;});
hook('startPlay',old=>function(...args){const result=old.apply(this,args);run=eligible()?freshRun():null;return result;});
hook('respawn',old=>function(...args){if(active())incident(run);return old.apply(this,args);});
hook('stepPlayer',old=>function(...args){const before=run,result=old.apply(this,args);if(before===run&&active())observe(run,{x:player.x,rail:player.track?.sky?.id,s:player.trackS,dead:player.dead>0,road:!!player.onGround&&!player.track&&!player.peg&&Math.abs(player.y+player.h-__sky.state.data.ground*36)<8});return result;});
hook('win',old=>function(...args){const wasWon=won,result=old.apply(this,args);if(!wasWon&&won&&run&&eligible()){
 const reward=settle(record,run,true);record=reward.records;
 if(reward.banked){try{localStorage.setItem(STORE,JSON.stringify(record));saveOK=true;}catch{saveOK=false;}
  const host=document.querySelector('#delivery-results .delivery-result-actions');if(host){const p=document.createElement('p');p.className='sc-earned';p.textContent=(reward.fresh?'MARKET PILOT: New seal earned!':'MARKET PILOT: Balcony challenge completed.')+(saveOK?'':' Saving unavailable; kept in this session.');host.prepend(p);}}
 }return result;});
const art=SkyNetworkArt.populate;
window.SkyNetworkArt=Object.freeze({...SkyNetworkArt,populate(args){
 art({...args,paths:args.paths.map(p=>p.sky?.id===BRANCH?{...p,sky:{...p.sky,entry:false}}:p)});const {course,metal,sign,greenery,kit,root}=args;if(!course.gp?.sunrise)return;
 const markers=cues(course,GrappleCore);root.userData.sunriseCues=markers.map(c=>c.id);
 for(const c of markers){const color=c.kind==='brake'?'#e7b370':c.kind==='return'?'#91d6bd':'#a9dbe1';
  metal.rod([c.x,-c.y-40,-56],[c.x,-c.y+26,-56],2,'#49646a');
  metal.box(c.x,-c.y,-57,194,56,4,'#173d46');
  metal.box(c.x-98,-c.y,-53,4,56,4,color);
  const label=sign(c.title+'\n'+c.detail,c.x,-c.y,-48,192,52);if(label){label.name='Sunrise wayfinding: '+c.id;label.userData.sunriseCue=true;}
 }
 const gy=-course.ground*36;
 // Painted chevrons are decorative and never become collision surfaces.
 for(let i=0;i<3;i++){const x=1630+i*23;metal.tri([x,gy+2,-15],[x+15,gy+2,0],[x,gy+2,15],'#faf0cf');}
 for(let i=0;i<5;i++){const x=2220+i*20;metal.box(x,gy+2,0,12,1,54,'#a5e2c7');}
 const path=course.ct.find(p=>p.sky?.id===BRANCH);
 if(path){
  for(const i of[18,36,53]){const [x,y]=path[i];metal.box(x,-y+8,-62,40,17,28,'#bcaa83');kit.flowers(greenery,x,-y+18,-62,.8);}
  for(const x of[1790,1990])metal.rod([x,gy,-100],[x,gy+90,-100],3,'#6b847b');
  const board=sign('PENNY\'S POCKET PARK\nRIDE / LAND / FINISH',1900,gy+270,-82,228,64);if(board){board.name='Pocket Park landmark';board.userData.sunriseCue=true;}
 }
}});
window.SkyCycleSunrise=Object.freeze({build:BUILD,branch:BRANCH,get run(){return run?{...run}:null;},get records(){return {...record};},get saveOK(){return saveOK;},journal(){return mission(run,record,saveOK);},cues(){return cues(window.__sky?.state.data,window.GrappleCore);}});
// Matching world-space signs for the existing lightweight 2D renderer.
const overlay=document.createElement('canvas');overlay.id='sunrise-cues';overlay.setAttribute('aria-hidden','true');overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;display:none';document.getElementById('stagewrap').append(overlay);
const pen=overlay.getContext('2d');let sizeKey='',readingScene=null;
hook('render',old=>function(...args){
 // Reading a paused native dialog does not need another expensive scene draw.
 // Input polling, audio and dialog DOM keep their independent event loops.
 const reading=!document.getElementById('prism-panel')?.open&&mode==='play'&&!won&&__delivery.state.view==='3d'&&__delivery.paused&&!!document.querySelector('#sc-journal[open],#flight-deck[open],#flight-deck-guide[open],#score-dialog[open]');
 const sceneKey=[__delivery.state.route,innerWidth,innerHeight,overlay.parentElement.clientWidth,overlay.parentElement.clientHeight,devicePixelRatio].join(':');
 if(reading&&readingScene===sceneKey)return;
 readingScene=reading?sceneKey:null;
 const result=old.apply(this,args);
 const visible=mode==='play'&&__delivery.state.route===4&&__delivery.state.view==='2d'&&!__delivery.state.menu&&!won;
 overlay.style.display=visible?'block':'none';if(!visible)return result;
 const rect=overlay.getBoundingClientRect(),w=rect.width,h=rect.height,ratio=Math.min(2,devicePixelRatio||1),key=w+':'+h+':'+ratio;
 if(key!==sizeKey){sizeKey=key;overlay.width=Math.round(w*ratio);overlay.height=Math.round(h*ratio);}
 pen.setTransform(ratio,0,0,ratio,0,0);pen.clearRect(0,0,w,h);const z=Math.min(1.6,Math.max(1.1,w/800));
 for(const c of cues(__sky.state.data,GrappleCore)){const x=(c.x-cam.x)*z,y=(c.y-cam.y)*z;if(x<-130||x>w+130||y<-50||y>h+50)continue;
  pen.fillStyle='#173d46';pen.fillRect(x-111,y-22,222,44);pen.fillStyle=c.kind==='brake'?'#f4ca8c':'#a6e2d3';pen.fillRect(x-111,y-22,3,44);pen.textAlign='center';pen.font='700 12px system-ui';pen.fillText(c.title,x,y-3);pen.font='9px system-ui';pen.fillStyle='#e4ece0';pen.fillText(c.detail,x,y+13);
 }
 return result;
});
