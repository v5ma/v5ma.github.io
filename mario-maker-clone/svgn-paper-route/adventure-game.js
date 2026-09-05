/* Chapter progression, in-world neighbors and feedback. No relocation shortcut:
 * a live rider crossing the end triggers the existing win/record path once. */
(function(){'use strict';function boot(){
 const on=()=>window.__ground?.active()&&__ground.meta?.adventure===2;
 const state={transition:null,finished:[],talked:new Set(),section:'',visits:[],pickups:[],enemyDefeats:0};
 let scene=null,cast=[],lastFrame=performance.now();
 const panel=document.createElement('div');panel.id='neighbor-caption';panel.setAttribute('role','status');panel.hidden=true;document.getElementById('stagewrap').append(panel);
 const spawn=spawnWorld;window.spawnWorld=function(x,y){const keep=routeKeep;state.transition=null;spawn(x,y);if(!keep){state.talked.clear();state.section='';state.visits=[];state.pickups=[];state.enemyDefeats=0;}};
 const interact=interactTiles;window.interactTiles=function(p){
  const before=on()?{shield:p.shield,star:p.star,nitro:p.nitro,gears}:null;interact(p);
  if(before){for(const k of ['shield','star','nitro'])if(Number(p[k])>Number(before[k]))state.pickups.push({type:k,x:p.x});}
 };
 const kill=killEnemy;window.killEnemy=function(...args){const wasDead=args[0]?.dead>0;kill(...args);if(on()&&!wasDead)state.enemyDefeats++;};
 const step=stepPlayer;window.stepPlayer=function(){step();if(!on()||won||player.dead>0)return;const d=__sky.state.data,goal=d.goal;
  // The entire end column is the finish line, including an airborne approach.
  if(goal&&player.x+player.w>=goal.x*TILE){win();}
  const sections=__ground.meta.sections||[];const s=[...sections].reverse().find(s=>player.x>=s.x*TILE);if(s&&s.name!==state.section){state.section=s.name;state.visits.push(s.name);}
  if(__grapple.state.lash>0&&!player.peg){const cx=player.x+13,cy=player.y+15;for(const e of enemies){if(e.dead>0||!['bloop','shell','hover'].includes(e.type))continue;const dx=e.x-cx,dy=e.y-14-cy;if(dx*player.dir>=0&&dx*player.dir<120&&Math.abs(dy)<42&&GrappleCore.lineClear({x:cx,y:cy},{x:e.x,y:e.y-14},(x,y)=>SOLID.has(pg(Math.floor(x/TILE),Math.floor(y/TILE)))))killEnemy(e,player.dir*5,-4,'WHIP!');}}
 };
 const winLevel=win;window.win=function(){if(won)return;winLevel();if(!won||!on())return;
  const index=__delivery.state.route;state.finished.push({index,deliveries,score,tries,x:player.x});
  if(index===4||index===5)state.transition={index,next:index+1,remaining:3.5};
  const res=document.getElementById('delivery-results');
  if(res){const title=res.querySelector('h1');if(title)title.innerHTML='Level complete.<br><em>On to the next!</em>';const area=res.querySelector('.delivery-result-actions');if(area){const count=document.createElement('p');count.id='next-level-countdown';area.prepend(count);if(index===4||index===5){const hold=document.createElement('button');hold.className='delivery-btn';hold.id='stay-results';hold.textContent='Stay on results';hold.onclick=()=>{state.transition=null;count.textContent='Continue when you are ready.';hold.remove();};area.append(hold);}}}
 };
 // Cancel queued navigation whenever the user chooses a route, replay or editor.
 document.addEventListener('click',e=>{if(e.target.closest('[data-course],[data-delivery="routes"],[data-delivery="retry"],[data-delivery="editor"],[data-delivery="next"],#beginner-blueprint'))state.transition=null;},true);
 function art(){if(!on()||!window.__cloudview)return;const root=__cloudview.root;if(scene===root)return;scene=root;cast=[];const m=__merged,T=m.THREE,kit=CloudAssets.create(T);
  for(const n of __ground.meta.cast||[]){const g=new T.Group();g.name='Neighbor '+n.name;g.position.set(n.x*TILE,-n.y*TILE+27,-30);root.add(g);const b=new kit.Batch(),color=['#d57244','#3d95a6','#8b6dae','#559760','#c2a755'][cast.length%5];b.box(0,-6,0,22,23,14,color);b.ell(0,15,0,12,11,10,'#eee3c6');b.box(0,14,9,17,6,3,'#2a475d');b.box(0,23,0,28,4,21,color);for(const dx of[-7,7]){b.box(dx,-21,0,7,10,10,'#39536b');b.box(dx*2,-5,0,6,18,7,color);}b.box(-18,-10,0,11,15,13,'#d7b877');kit.envelope(b,-18,-8,8,.48);b.finish(m,g,{roughness:.6});cast.push({data:n,mesh:g});}
  // Keep existing pickup/actor geometry, but let the camera reject offscreen meshes.
  root.traverse(o=>{if(o.isInstancedMesh&&o.count===1&&o.geometry?.attributes?.position){o.geometry.computeBoundingSphere();o.computeBoundingSphere();o.frustumCulled=true;}});
  kit.dispose();
 }
 const visuals=SkyVisual.update;SkyVisual.update=function(){visuals();art();if(on()){const t=__ground.state.steps/60;for(let i=0;i<cast.length;i++)cast[i].mesh.rotation.z=Math.sin(t*2+i)*.025;}};
 function ui(){const now=performance.now(),dt=Math.min(.1,(now-lastFrame)/1000);lastFrame=now;
  if(state.transition){const t=state.transition;if(!on()||!won||__delivery.state.route!==t.index)state.transition=null;else if(!document.hidden&&!__delivery.paused){t.remaining-=dt;const el=document.getElementById('next-level-countdown');if(el)el.textContent='Next level in '+Math.max(1,Math.ceil(t.remaining))+'...';if(t.remaining<=0){state.transition=null;__delivery.startRoute(t.next);}}}
  const mailLabel=document.querySelector('#cloud-hud .cloud-delivery .cloud-label'),retry=document.getElementById('sky-retry');
  if(mailLabel)mailLabel.textContent=on()?'BONUS MAIL':'DELIVERIES';
  if(retry)retry.textContent=on()?'Retry checkpoint':'Retry catch';
  if(!on()){panel.hidden=true;return;}
  const p=player,n=(__ground.meta.cast||[]).find(n=>Math.abs(p.x-n.x*TILE)<135&&Math.abs(p.y-(n.y*TILE-30))<100);
  panel.hidden=!n||won||__delivery.state.menu;if(n){panel.textContent=n.name+': '+n.text;state.talked.add(n.id);}
  const label=document.getElementById('cloud-flight-label');if(label&&!won)label.textContent=state.section.toUpperCase()+' / REACH THE FINISH TO CONTINUE';
  const help=document.getElementById('cloud-control-tip');if(help&&!won)help.textContent=(p.shield?'SHIELD / ':'')+(p.star>0?'STAR '+Math.ceil(p.star/60)+'s / ':'')+'NITRO '+p.nitro+' (X) / SPACE: JUMP / Z: WHIP';
  const post=document.getElementById('delivery-count');if(post)post.textContent=deliveries+' bonus';
  const cloudMail=document.getElementById('cloud-deliveries');if(cloudMail)cloudMail.textContent=String(deliveries);
 }
 const render=window.render;window.render=function(){render();ui();};
 window.__adventure={state,on,version:'2026.09.05-longplay'};
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();
