import {FirstLightTrail} from './first-light-trail.js';
import {storyFocus,STORY_FOCUS_STYLE} from './story-focus.js';
import * as T from './vendor/three.module.js';
import {drawDistrictMap} from './tidegate-routes.js';
import {navigationBearing} from './active-controls.js';
// Guidance indicates a destination, not a path through walls or a mandatory itinerary.
export class FieldNavigation{
 constructor({root,travel,fleet,task,yaw}){
  Object.assign(this,{travel,fleet,task,yaw});const style=document.createElement('style');style.textContent=STORY_FOCUS_STYLE;document.head.append(style);this.goal=null;travel.navigation=this;
  this.liveMap=document.getElementById('minimap');this.districtMap=!this.liveMap;
  if(this.districtMap){this.liveMap=document.createElement('canvas');this.liveMap.id='minimap';this.liveMap.width=720;this.liveMap.height=560;this.liveMap.setAttribute('aria-label','Live Tidegate route map. White is you; gold is your current goal. Wildlife is not shown on this compact route map.');
   const button=document.createElement('button');button.id='live-map-button';button.title='Open full map';button.style.cssText='position:absolute;right:16px;bottom:110px;width:clamp(150px,24vw,260px);padding:4px;background:#173c35;border:2px solid #edcf86;pointer-events:auto';this.liveMap.style.cssText='display:block;width:100%;height:auto';button.append(this.liveMap);button.onclick=()=>travel.ctx.action('map');document.getElementById('hud').append(button);
  }
  this.trail=new FirstLightTrail(root);
  this.group=new T.Group();this.group.name='Active destination guidance';root.add(this.group);
  const mat=new T.MeshBasicMaterial({color:0xffd34d,transparent:true,opacity:.85,depthTest:true});
  const ring=new T.Mesh(new T.TorusGeometry(2,.12,6,32),mat);ring.rotation.x=Math.PI/2;ring.position.y=.12;this.group.add(ring);
  this.pointer=new T.Mesh(new T.ConeGeometry(.7,1.4,4),mat);this.pointer.rotation.z=Math.PI;this.pointer.position.y=4;this.group.add(this.pointer);
  this.hud=document.createElement('div');this.hud.id='goal-compass';this.hud.setAttribute('aria-label','Active destination compass');
  this.hud.style.cssText='margin-top:10px;padding:8px 10px;background:#102b2bea;border:2px solid #ffd34d;border-radius:7px;color:#fff5d0;text-align:left;pointer-events:none;font:600 13px/1.4 system-ui';
  this.arrow=document.createElement('span');this.arrow.style.cssText='display:inline-block;width:18px;height:22px;background:#ffd34d;clip-path:polygon(50% 0,100% 45%,68% 45%,68% 100%,32% 100%,32% 45%,0 45%);transform-origin:center;vertical-align:middle;margin-right:10px';this.arrow.setAttribute('aria-hidden','true');this.text=document.createElement('span');this.hud.append(this.arrow,this.text);(document.querySelector('#hud .objective,#hud .mission')||document.getElementById('hud')).append(this.hud);
  this.mapText=document.createElement('p');this.mapText.id='map-destination';this.mapText.style.cssText='padding:10px;border-left:5px solid #ffd34d;background:#183c35;color:#fff5d0;font-weight:700';const map=document.getElementById('fullmap');const holder=map.closest('.atlas-layout')||map;holder.parentElement.insertBefore(this.mapText,holder);
 }
 update(time=0){
  const t=this.task(),p=this.fleet.position,b=navigationBearing(p,t?.target,this.yaw());this.goal=b?{...t,bearing:b}:null;
  document.body.dataset.livingFocus=String(storyFocus(t));
  const show=!!b&&this.travel.settings.guidance;this.trail.update(t?.route,show);this.group.visible=show;this.hud.hidden=!show;
  if(!b){this.mapText.textContent='No active destination. Choose an operation or explore.';this.updateMap();return;}
  const elevation=b.height>3?' / ABOVE':b.height< -3?' / BELOW':'',title=t.name||t.title||'Active objective';
  this.text.textContent=`${b.compass} / ${Math.round(b.distance)} m${elevation} - ${title}`;this.arrow.style.transform=`rotate(${b.relative}rad)`;
  this.mapText.textContent=`GOAL: ${title} / ${Math.round(b.distance)} m${elevation}. ${t.hint||'Follow usable roads, paths, docks and entrances. The compass is a bearing, not a route through obstacles.'}`;
  this.group.position.set(t.target.x,Number.isFinite(t.target.y)?t.target.y:0,t.target.z);this.pointer.position.y=4+Math.sin(time*2)*.2;
  // The compact Tidegate map updates without opening a modal or pausing the world.
  this.updateMap();
 }
 updateMap(){if(this.districtMap){drawDistrictMap(this.liveMap,this.fleet.state,this.fleet.position,[]);this.paint(this.liveMap,(x,z)=>[360+x*4.7,280+(z-3)*4.7]);}}
 paint(canvas,to,small=false){
  this.trail.paint(canvas,to,small);
  const c=canvas.getContext('2d'),g=this.goal,p=this.fleet.position;const margin=small?13:20,clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  c.save();c.setLineDash([]);c.textAlign='center';
  if(g){const original=to(g.target.x,g.target.z),x=clamp(original[0],margin,canvas.width-margin),y=clamp(original[1],margin,canvas.height-margin),r=small?8:12;
   c.fillStyle='#ffd34d';c.strokeStyle='#102b2b';c.lineWidth=3;c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.closePath();c.fill();c.stroke();
   c.strokeStyle='#fff1a5';c.lineWidth=2;c.beginPath();c.arc(x,y,r+5,0,Math.PI*2);c.stroke();
   if(!small){c.font='bold 15px sans-serif';const ty=y<55?y+32:y-25;c.fillStyle='#102b2b';c.fillRect(clamp(x-32,0,canvas.width-64),ty-16,64,22);c.fillStyle='#fff1a5';c.fillText('GOAL',clamp(x,32,canvas.width-32),ty);}
  }
  const [px,py]=to(p.x,p.z);c.translate(px,py);c.rotate(-this.yaw());c.fillStyle='#ffffff';c.strokeStyle='#123f42';c.lineWidth=3;c.beginPath();c.moveTo(0,-(small?9:13));c.lineTo(small?7:10,small?7:10);c.lineTo(0,small?3:4);c.lineTo(small?-7:-10,small?7:10);c.closePath();c.fill();c.stroke();c.restore();
 }
 snapshot(){return this.goal?{name:this.goal.name||this.goal.title,target:{...this.goal.target},...this.goal.bearing,trail:this.trail.snapshot(),enabled:this.travel.settings.guidance}:null;}
}
