/* Original Waterwheel reference slice, integrated into the existing campaign. */
import {ID,REVISION,RECORD,IDS,CUES,buildCourse,isLayout} from './waterwheel-core.mjs';
const previous=window.GroundCampaign,campaign=window.DeliveryCampaign;
const make=(n,T)=>n===1?buildCourse(previous.make(n,T),T,FlowRoutes.path):previous.make(n,T);
const build=(i,T)=>i===5?make(1,T):campaign.build(i,T);
const {cells,ct,...info}=make(1,__gameRefs.T);
window.GroundCampaign=Object.freeze({...previous,make,build});
window.DeliveryCampaign=Object.freeze({...campaign,build,routes:campaign.routes.map((r,i)=>i===5?info:r)});SkyRoutes.build=build;
const actual=()=>isLayout(window.__sky?.state.data);
const hook=(key,fn)=>{const old=window[key];if(typeof old==='function')window[key]=fn(old);};
let wheel=null,paintKey='',samples=[],lastSample=-1;
const populate=GroundArt.populate;
window.GroundArt={...GroundArt,populate(args){
 populate(args);if(!isLayout(args.course))return;
 const {course,m,root,kit,metal,far,sign}=args,{x,y,radius:r}=course.gp.waterwheel.landmark,gy=-course.ground*36;
 root.userData.waterwheelRevision=REVISION;
 // This machinery is visibly behind the riding plane; it is not a hidden platform.
 far.box(x+120,gy+170,-300,380,340,110,'#c7b596');far.box(x+120,gy+347,-300,404,18,130,'#466f72');
 for(let j=0;j<5;j++){far.box(x-30+j*65,gy+237,-241,34,53,3,'#325a6b');far.box(x-30+j*65,gy+155,-241,34,53,3,'#e4d2a9');}
 const g=new m.THREE.Group();g.name='Waterwheel landmark';g.position.set(x,-y,-138);root.add(g);wheel=g;
 const b=new kit.Batch();
 for(let i=0;i<32;i++){const a=i*Math.PI/16,n=(i+1)*Math.PI/16;b.rod([Math.cos(a)*r,Math.sin(a)*r,0],[Math.cos(n)*r,Math.sin(n)*r,0],7,'#946a43');b.rod([Math.cos(a)*(r-25),Math.sin(a)*(r-25),-14],[Math.cos(n)*(r-25),Math.sin(n)*(r-25),-14],4,'#52666a');}
 for(let i=0;i<12;i++){const a=i*Math.PI/6;b.rod([0,0,0],[Math.cos(a)*(r-6),Math.sin(a)*(r-6),0],5,'#c8a778');b.box(Math.cos(a)*r,Math.sin(a)*r,0,43,15,55,'#587a80',a+Math.PI/2);}
 b.ell(0,0,17,19,19,10,'#e4be74');b.finish(m,g,{roughness:.72,metalness:.15});
 metal.rod([x-65,gy,-70],[x,gy+230,-70],9,'#768a87');metal.rod([x+65,gy,-70],[x,gy+230,-70],9,'#768a87');
 sign('WATERWHEEL POST\nTHE ROAD BRINGS EVERYONE HOME',x+155,gy+380,-224,330,62);
 // Labels introduce choices before their approach, not on a blind receiving deck.
 for(const cue of CUES){metal.rod([cue.x,-cue.y-58,-64],[cue.x,-cue.y+24,-64],2,'#587678');const label=sign(cue.title+'\n'+cue.detail,cue.x,-cue.y,-60,220,55);if(label)label.name='Waterwheel cue: '+cue.id;}
 root.userData.waterwheelCues=CUES.map(c=>c.id);
}};
const overlay=document.createElement('canvas');overlay.id='waterwheel-cues';overlay.setAttribute('aria-hidden','true');overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;display:none';document.getElementById('stagewrap').append(overlay);
const pen=overlay.getContext('2d');
hook('render',old=>function(...args){
 if(wheel?.parent&&actual())wheel.rotation.z=-(__ground.state.steps||0)*.0025;
 const result=old.apply(this,args),visible=actual()&&mode==='play'&&!won&&!__delivery.state.menu&&__delivery.state.view==='2d';overlay.style.display=visible?'block':'none';if(!visible)return result;
 const rect=overlay.getBoundingClientRect(),w=rect.width,h=rect.height,ratio=Math.min(devicePixelRatio||1,2),k=[w,h,ratio].join(':');if(k!==paintKey){paintKey=k;overlay.width=Math.round(w*ratio);overlay.height=Math.round(h*ratio);}
 pen.setTransform(ratio,0,0,ratio,0,0);pen.clearRect(0,0,w,h);const z=Math.min(1.6,Math.max(1.1,w/800));
 const world=(x,y)=>[(x-cam.x)*z,(y-cam.y)*z];
 // Thin outlined wheel in fallback, never an opaque mask over gameplay.
 const q=__sky.state.data.gp.waterwheel.landmark,[wx,wy]=world(q.x,q.y),rr=q.radius*z;
 if(wx+rr>=0&&wx-rr<=w){pen.save();pen.translate(wx,wy);pen.rotate(-(__ground.state.steps||0)*.0025);pen.strokeStyle='#89683f';pen.lineWidth=5;pen.beginPath();pen.arc(0,0,rr,0,Math.PI*2);pen.stroke();pen.lineWidth=2;for(let i=0;i<12;i++){const a=i*Math.PI/6;pen.beginPath();pen.moveTo(0,0);pen.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);pen.stroke();}pen.restore();}
 for(const cue of CUES){const [x,y]=world(cue.x,cue.y);if(x<-130||x>w+130||y<-50||y>h+50)continue;pen.fillStyle='#173d46';pen.fillRect(x-116,y-25,232,50);pen.fillStyle='#e5c88b';pen.fillRect(x-116,y-25,4,50);pen.textAlign='center';pen.font='bold 12px system-ui';pen.fillText(cue.title,x,y-6);pen.font='10px system-ui';pen.fillStyle='#e5eee7';pen.fillText(cue.detail,x,y+12);}
 return result;
});
hook('startPlay',old=>function(...args){const r=old.apply(this,args);samples=[];lastSample=-1;return r;});
hook('stepPlayer',old=>function(...args){const r=old.apply(this,args);if(actual()&&player&&__ground.state.steps!==lastSample){lastSample=__ground.state.steps;if(lastSample%6===0){samples.push({step:lastSample,x:player.x,y:player.y,rail:player.track?.sky?.id||null,ground:!!player.onGround&&!player.track,tries});if(samples.length>600)samples.shift();}}return r;});
function exportClassic(){const code=campaign.encode(previous.make(1,__gameRefs.T)),url=URL.createObjectURL(new Blob([code],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download='waterwheel-classic-layout.route';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function mount(){const host=document.querySelector('#flight-deck .fd-actions');if(!host||document.getElementById('waterwheel-classic-export'))return;const b=document.createElement('button');b.className='delivery-btn';b.id='waterwheel-classic-export';b.textContent='Export classic Waterwheel copy';b.title='Exports the earlier editable layout without changing your current route or draft.';b.onclick=exportClassic;host.append(b);}
const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true});mount();window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
window.SkyCycleWaterwheel=Object.freeze({revision:REVISION,recordKey:RECORD,id:ID,main:IDS,classicCode:()=>campaign.encode(previous.make(1,__gameRefs.T)),get trace(){return samples.map(s=>({...s}));},get art(){return {wheel:!!wheel?.parent,cues:wheel?.parent?.userData.waterwheelCues||[]};}});
if(new URLSearchParams(location.search).get('chapter')==='waterwheel'){
 let attempts=0;const timer=setInterval(()=>{if(++attempts>1200){clearInterval(timer);return;}if(PaperDeliveryCampaign?.status==='ready'&&window.SkyCycleCompass&&window.SkyCycleFlightDeck){clearInterval(timer);if(window.RouteWorkshop?.state.dirty){toast('Save or export your draft before starting Waterwheel.');return;}__delivery.startRoute(5);}},50);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
