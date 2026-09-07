/* Optional Sky Post discovery: observe real riding, never drive it. */
(function(){
 'use strict';
 const P=SkyPostProgress,$=id=>document.getElementById(id);
 const active=()=>window.__ground?.active()&&__ground.meta?.skyPost?.version===1;
 const campaign=()=>active()&&__delivery.state.route===4&&!RouteWorkshop.testing;
 let book=P.parse(null),run=P.create(),committed=false,lastReleases=0,above=false,lastRoot=null,ring=null,renderTick=-1,wasPaused=false,focusBefore=null;
 function read(){try{book=P.parse(localStorage.getItem(P.key));}catch{book=P.parse(null);}return book;}
 read();
 const style=document.createElement('link');style.rel='stylesheet';style.href='./sky-post.css';document.head.append(style);
 const button=document.createElement('button');button.id='route-passport-button';button.className='delivery-btn';button.textContent='Route Passport';button.title='Your discovered riding routes, saved on this device.';$('delivery-header').querySelector('.actions').append(button);
 const modal=document.createElement('dialog');modal.id='route-passport';modal.setAttribute('aria-labelledby','passport-title');
 modal.innerHTML='<div class="passport-heading"><div><small>EXPLORE / LEARN / RETURN</small><h2 id="passport-title">Your Route Passport</h2></div><button id="passport-close" autofocus>Back to the game</button></div><p id="passport-status" role="status"></p><div id="passport-cards"></div><p class="passport-note">A stamp records a route you rode before finishing Sunrise Borough. Trying a route is never required to finish the level. Stamps are local keepsakes, not currency. Editor playtests and Ride Lab cannot save them.</p><button id="passport-export">Export my passport</button>';
 document.body.append(modal);
 function paint(){
  read();const s=run.snapshot();$('passport-status').textContent=`${Object.keys(book.stamps).length} / ${P.ROUTES.length} routes stamped on this device.${RouteWorkshop.testing?' This is a playtest; no stamps will be saved.':s.earned.length&&!committed?' A route is ready to stamp when you reach the finish.':''}`;
  $('passport-cards').replaceChildren();
  for(const route of P.ROUTES){const card=document.createElement('article'),stamp=book.stamps[route.id];card.className='passport-card'+(stamp?' stamped':'');card.dataset.routeStamp=route.id;
   const title=document.createElement('h3');title.textContent=route.name;
   const status=document.createElement('strong');status.textContent=stamp?'STAMPED':s.earned.includes(route.id)&&!committed?'FINISH TO STAMP':'READY TO DISCOVER';
   const hint=document.createElement('p');hint.textContent=route.hint;
   card.append(title,status,hint);$('passport-cards').append(card);
  }
 }
 button.onclick=()=>{
  if(modal.open)return;focusBefore=document.activeElement;wasPaused=__delivery.paused;
  if(won)$('stay-results')?.click();
  if(mode==='play'&&!won&&!__delivery.state.menu&&!wasPaused)__delivery.act('pause');
  paint();modal.showModal();$('passport-close').focus();
 };
 $('passport-close').onclick=()=>modal.close();
 modal.addEventListener('close',()=>{if(!wasPaused&&__delivery.paused)__delivery.act('resume');if(mode==='play'&&!__delivery.state.menu)cv.focus({preventScroll:true});else focusBefore?.focus({preventScroll:true});});
 $('passport-export').onclick=()=>{const text=JSON.stringify(read(),null,2),url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Paper-Delivery-Route-Passport.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const spawn=spawnWorld;window.spawnWorld=function(...args){const keep=routeKeep;spawn(...args);if(keep)run.step({type:'retry'});else{run=P.create();committed=false;}lastReleases=__grapple.state.releases;above=false;};
 function release(){const n=__grapple.state.releases;if(n!==lastReleases){lastReleases=n;const e=__grapple.state.events.findLast(e=>e.type==='release');run.step({type:'release',peg:e?.id});}}
 const step=stepPlayer;window.stepPlayer=function(){
  if(!active()||__delivery.paused||__delivery.state.menu||won)return step();
  release();const p=player,tr=p.track;step();if(player!==p)return;release();
  if(p.track&&p.track!==tr)run.step({type:'catch',id:p.track.sky?.id,face:p._railFace});
  const now=!!p.track||!!p.peg||!p.onGround;if(above&&!now)run.step({type:'road'});above=now;
 };
 const finish=win;window.win=function(){
  const eligible=campaign()&&!won&&!committed;finish();if(!eligible||!won)return;
  committed=true;const stamps=run.finish();book=P.complete(read(),stamps,Date.now());let saved=true;
  try{localStorage.setItem(P.key,JSON.stringify(book));}catch{saved=false;}
  const parent=$('delivery-results')?.querySelector('.delivery-result-actions');if(parent){let note=$('passport-result');if(!note){note=document.createElement('p');note.id='passport-result';parent.prepend(note);}const titles=P.ROUTES.filter(r=>stamps.includes(r.id)).map(r=>r.name);note.textContent=titles.length?(saved?'Route Passport: ':'Unsaved route stamp: ')+titles.join(' / '):'Explore another line next time to add to your Route Passport.';}
 };
 // Decorations belong to the world, and do not add invisible collision or
 // pretend that a painted background island is a usable recovery platform.
 function art(){
  if(!active()||!window.__cloudview)return;const root=__cloudview.root;if(lastRoot===root)return;lastRoot=root;
  const m=__merged,T=m.THREE,kit=CloudAssets.create(T),b=new kit.Batch(),group=new T.Group();group.name='Sky Post relay marker';root.add(group);const peg=__ground.meta.skyPost.peg;
  group.position.set(peg.x,-peg.y,27);b.torus(0,0,0,23,'#bf93dc');b.ell(0,0,2,9,9,4,'#ffe7ad');kit.envelope(b,0,0,8,.48);b.finish(m,group,{roughness:.4,metalness:.3});ring=group;
  const rail=tracks.find(t=>t.sky?.id==='sky-post');if(rail){const q=GrappleCore.sample(rail,rail.len*.65),c=new kit.Batch();
   c.box(q.x,-q.y-48,-74,58,55,40,'#8766a0');c.box(q.x,-q.y-18,-74,65,6,48,'#ffe0a0');c.box(q.x,-q.y-42,-51,34,12,3,'#203e55');kit.envelope(c,q.x,-q.y-60,-51,.8);c.rod([q.x-20,-q.y,-74],[q.x-20,-q.y-18,-74],2,'#cfbf96');c.rod([q.x+20,-q.y,-74],[q.x+20,-q.y-18,-74],2,'#cfbf96');const mesh=c.finish(m,root,{roughness:.55,metalness:.12});if(mesh)mesh.name='Sky Post balcony mailbox';
  }
  kit.dispose();
 }
 const visual=SkyVisual.update;SkyVisual.update=function(){visual();art();};
 const render=window.render;window.render=function(){render();button.hidden=RouteWorkshop.active;
  if(!active()||won||__delivery.state.menu||RouteWorkshop.active||__delivery.paused)return;
  const p=player,tick=__ground.state.steps;if(renderTick===tick)return;renderTick=tick;
  const id=__ground.meta.skyPost.peg.id;let text=null;
  if(p.peg?.id===id){const a=((p.peg.th%(Math.PI*2))+Math.PI*2)%(Math.PI*2),releaseWindow=p.peg.loops>=1&&a>=.78&&a<=1.16&&p.vx>6&&p.vy<-14;
   text=releaseWindow?'SKY POST: RELEASE Z UP-RIGHT TOWARD THE VIOLET BALCONY':'SKY POST: HOLD Z + D TO WIND UP; RELEASE UP-RIGHT AFTER A TURN';
   if(ring)ring.scale.setScalar(releaseWindow?1.12:1);
  }else if(p.track?.sky.id==='sky-post')text='SKY POST DISCOVERED / FOLLOW THE BALCONY DOWN TO THE FESTIVAL GLIDE';
  else if(p.x>4360&&p.x<4720&&p.y<1050&&p.y>600)text='VIOLET BUOY: OPTIONAL Z WHIP RELAY / CONTINUE RIGHT FOR THE BELLFLOWER HOOK';
  if(text)$('cloud-flight-label').textContent=text;
 };
 window.__skyPost={active,campaign,get snapshot(){return run.snapshot();},get passport(){return read();},get marker(){return ring},version:1};
})();
