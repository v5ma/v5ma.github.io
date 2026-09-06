/* Runtime bridge; no changes to Supabase auth, entitlements, purchases or data. */
(function(){'use strict';
 function boot(){
  const stored=k=>{try{return localStorage.getItem(k);}catch{return null;}},save=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
  const settings={vehicle:stored('svgn.ride-choice.v1')==='bike'?'bike':'euc',grip:stored('svgn.rail-grip.v1')==='precision'?'precision':'forgiving'};
  RailGripCore.configure({mode:settings.grip,solid:(x,y)=>mode==='play'&&SOLID.has(pg(Math.floor(x/36),Math.floor(y/36)))});
  const header=document.querySelector('#delivery-header .actions'),options=document.createElement('div');options.className='rail-options';options.innerHTML='<select id="rail-vehicle" aria-label="Vehicle appearance"><option value="euc">Unicycle</option><option value="bike">Bike</option></select><select id="rail-mode" aria-label="Rail catch setting"><option value="forgiving">Forgiving grip</option><option value="precision">Precision grip</option></select>';
  header.append(options);const el=id=>document.getElementById(id);el('rail-vehicle').value=settings.vehicle;el('rail-mode').value=settings.grip;
  el('rail-mode').onchange=e=>{settings.grip=e.target.value;RailGripCore.configure({mode:settings.grip});save('svgn.rail-grip.v1',settings.grip);cv.focus();};
  el('rail-vehicle').onchange=e=>{settings.vehicle=e.target.value;save('svgn.ride-choice.v1',settings.vehicle);cv.focus();};
  const contact=document.createElement('div');contact.id='rail-contact';contact.hidden=true;document.getElementById('stagewrap').append(contact);
  // Carry the new anchor metadata only while it still matches sampled geometry.
  const oldLoad=loadCode,oldCode=levelCode;
  window.loadCode=function(code){let doc;try{doc=WorkshopCore.decode(code);}catch{return false;}const ok=oldLoad(code);if(ok){for(let i=0;i<customTracks.length;i++){const p=doc.paths[i];if(p?.bezier)customTracks[i].authorBezier={nodes:BezierCore.copy(p.bezier),arc:p.arc?BezierCore.copy(p.arc):null,points:JSON.stringify(p.points)};}}return ok;};
  window.levelCode=function(){const code=oldCode(),[a,b]=code.split('.'),m=JSON.parse(b64d(a));const cb=customTracks.map(t=>{const author=t.authorBezier;return author&&author.points===JSON.stringify(t)?{nodes:author.nodes,...(author.arc?{arc:author.arc}:{})}:null;});if(cb.some(Boolean))m.cb=cb;return b64e(JSON.stringify(m))+'.'+b;};
  const oldSpawn=spawnWorld;window.spawnWorld=function(...args){oldSpawn(...args);if(player){player._railFace=1;player._gripSlow=0;player._railAir=false;player._nitroTick=-1;}RailGripCore.history.length=0;};
  const fire=fireNitro;window.fireNitro=function(p){
   if(!p.euc)return fire(p);if(p._nitroTick===frame)return;p._nitroTick=frame;
   const held=!!keys.KeyX;if(held&&!p._nHeld&&p.nitro>0){p.nitro--;p.nitroT=55;popText(p.x+p.w/2,p.y-12,'NITRO!','#ffc376');sfx.brick();updateHUD();}p._nHeld=held;
   if(p.nitroT>0){p.nitroT--;if(p.track){const direction=p.speed<0?-1:p.speed>0?1:p.dir||1;p.speed=direction*Math.min(28,Math.abs(p.speed)+.40);}else{const speed=Math.hypot(p.vx,p.vy);const x=speed>.5?p.vx/speed:p.dir||1,y=speed>.5?p.vy/speed:0;const next=Math.min(28,speed+.24);p.vx=x*next;p.vy=y*next;}if(frame%3===0)particles.push({x:p.x+p.w/2,y:p.y+p.h/2,vx:-p.vx*.12,vy:-p.vy*.12,life:12,color:'#8defff',size:2});}
  };
  const update=SkyVisual.update;let lastHero=null,uni=null;
  SkyVisual.update=function(){update();if(!window.__cloudview||!window.__sky?.active()){contact.hidden=true;return;}const h=__cloudview.hero,T3=__merged.THREE;
   if(h!==lastHero){lastHero=h;const kit=CloudAssets.create(T3),b=new kit.Batch(),group=new T3.Group();group.name='Electric unicycle courier';h.group.add(group);
    b.torus(0,-11,0,11,'#20394f');b.torus(0,-11,3,7.7,'#e3b35b');b.ell(0,-11,4,4.5,4.5,1.5,'#2c8cab');
    b.ell(0,-7,-1,8,12,8,'#1487b7');b.box(0,-2,0,16,5,12,'#f4c366');
    b.rod([-3,12,2],[-6,-4,4],2.7,'#305272');b.rod([4,12,-2],[7,-4,-3],2.7,'#305272');b.box(-7,-4,5,11,3,5,'#e8b65c');b.box(7,-4,-3,11,3,5,'#e8b65c');
    b.ell(0,18,0,7,9,6,'#f2b442');b.box(-8,18,-1,7,12,12,'#e2ba72');b.box(-12,18,5.5,6,10,1,'#fff1c6');
    b.rod([1,24,4],[9,18,6],2.2,'#e7ac42');b.rod([9,18,6],[16,11,7],2,'#ffce92');b.ell(16,11,7,2.5,2,2,'#264154');
    b.ell(2,31,1,6,6,5.5,'#f4c08b');b.ell(1,34,0,7.3,6.3,6,'#197faf');b.box(5,34,5.8,11,3,1.6,'#f3be5e');b.ell(7,31,6.4,4,2.5,1.3,'#24536b');b.ell(8,32,7.5,1.6,1,.4,'#b1f1ef');
    b.finish(__merged,group,{roughness:.32,metalness:.17});kit.dispose();uni=group;
   }
   const show=settings.vehicle==='euc';for(const object of h.group.children){if(object===uni)object.visible=show;else if(object!==h.scarf&&object!==h.flame)object.visible=!show;}
   h.group.userData.vehicle=settings.vehicle;
   if(show&&player.track){const q=GrappleCore.sample(player.track,player.trackS),normal={x:q.nx*(player._railFace===-1?-1:1),y:q.ny*(player._railFace===-1?-1:1)};h.group.rotation.z=-Math.atan2(normal.x,-normal.y);}
   contact.hidden=!player.track;contact.textContent=player.track?`${player._railFace===-1?'UNDERSIDE':'TOP'} / ${Math.round(Math.abs(player.speed)*6)} speed${player.nitroT>0?' / NITRO':''} / ${settings.grip}`:'';
  };
  // Explicit navigation to retained original features, not imitation accounts.
  const tools=document.createElement('div');tools.id='retained-game-tools';tools.className='bezier-row';tools.innerHTML='<button id="rail-library">Original level library</button><button id="rail-cloud">Community / cloud shelf</button>';
  document.querySelector('#route-workshop .maker-library details')?.append(tools);
  el('rail-library').onclick=()=>{RouteWorkshop.action('legacy');document.getElementById('btnLoad')?.click();};
  el('rail-cloud').onclick=()=>{RouteWorkshop.action('legacy');document.getElementById('btnComm')?.click();};
  window.__railRepair={settings,history:RailGripCore.history,get unicycle(){return uni},version:'rail-editor-2026.09.06'};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
