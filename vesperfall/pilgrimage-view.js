/* Pilgrimage graybox presentation. Every walk, shutter and target follows the
 * authoritative module assembly. No renderer-owned collision or progression. */
(function(root){'use strict';
 const prior=VesperArt.create;
 VesperArt.create=function(T,scene){const kit=prior(T,scene),old=kit.world,K=kit.architectureKit;
  kit.world=function(w){if(!w.pilgrimage)return old(w);
   const group=new T.Group();group.name=w.pipeline.name+' / assembled graybox';
   const b=new K.Batch(),dynamic={},signals=[],releases=[];
   const box=(parent,mat,x,y,z,a,h,d)=>{const m=new T.Mesh(K.unitBox,mat);m.position.set(x,y,z);m.scale.set(a,h,d);parent.add(m);return m;};
   for(const f of w.floors){
    if(f.type==='stair'){const n=Math.ceil(f.d/.2);for(let i=0;i<n;i++){const z=f.z-f.d/2+(i+.5)*f.d/n,y=f.y+f.slopeZ*(z-f.anchorZ);b.box(K.paving,f.x,y-.035,z,f.w,.06,f.d/n+.002);b.box(K.gold,f.x,y+.002,z-f.d/n*.4,f.w,.012,.025);}}
    else{b.box(f.y?K.pale:K.dark,f.x,f.y-.17,f.z,f.w,.3,f.d);b.box(K.paving,f.x,f.y-.005,f.z,f.w,.018,f.d);for(const a of[-1,1])b.box(K.gold,f.x+a*(f.w/2-.06),f.y+.006,f.z,.035,.012,f.d);}
   }
   for(const s of w.solids){if(['stair-base','gallery-deck'].includes(s.type))continue;
    const d=s.max.map((v,i)=>v-s.min[i]),p=s.min.map((v,i)=>(v+s.max[i])/2);
    if(['pilgrim-shutter','pilgrim-gate'].includes(s.type)){
     const obj=new T.Group();obj.name=s.id;obj.position.set(p[0],s.min[1],p[2]);dynamic[s.id]=obj;group.add(obj);
     if(s.type==='pilgrim-shutter'){
      box(obj,K.copper,0,d[1]/2,0,d[0],d[1],d[2]);for(let x=-2.8;x<3;x+=.7)box(obj,K.gold,x,d[1]/2,d[2]/2+.015,.045,d[1],.04);
     }else{
      const pane=kit.mat('#9bb9ad',.05);pane.transparent=true;pane.opacity=.2;pane.depthWrite=false;
      box(obj,pane,0,d[1]/2,0,d[0],d[1],d[2]);for(let x=-2.8;x<3;x+=.7)box(obj,K.gold,x,d[1]/2,.21,.045,d[1],.06);
      for(const y of[.12,1.05,3.28])box(obj,K.wood,0,y,0,d[0],.15,d[2]);
     }continue;
    }
    const mat=s.type==='landmark'?K.ivory:s.type==='roof'?K.dark:s.type==='cover'?K.dark:s.type==='balustrade'?K.gold:K.stone;
    b.box(mat,...p,...d);
    if(s.type==='wall')b.box(K.pale,p[0],s.max[1]-.1,p[2],d[0]+.035,.2,d[2]+.035);
   }
   for(const m of w.pipeline.modules){
    const winch=new T.Group();winch.position.set(m.winch[0],m.winch[1]+1.08,m.winch[2]);group.add(winch);dynamic[m.id+'/winch']=winch;
    kit.mesh('ring','#b79b65',winch,0,0,0,.38,.38,.38);for(const a of[0,Math.PI/3,2*Math.PI/3])kit.mesh('box','#cab283',winch,0,0,0,.025,.66,.04).rotation.z=a;
    b.box(K.wood,m.winch[0],m.winch[1]+.42,m.winch[2],.25,.8,.25);
    const release=kit.mesh('ball','#d4a842',group,...m.release,.22,.22,.22);release.name=m.id+'/brass-release';releases.push(release);
    kit.mesh('ring','#e4c17c',group,...m.release,.4,.4,.4);
    const lamp=new T.Group();lamp.name=m.id+'/signal';lamp.position.set(...m.targetPoint);group.add(lamp);
    const orb=kit.mesh('ball','#adab93',lamp,0,0,0,.4,.4,.4);kit.mesh('ring','#dac17d',lamp,0,0,0,.58,.58,.58);signals.push(orb);
    for(const x of[-.7,.7])b.box(K.wood,m.x+x,4.15,m.z-10,.1,1.9,.1);
    b.box(K.gold,m.x,5.12,m.z-10,1.55,.1,.1);
    // Repeated recognizable refuge marker appears through the return grille.
    kit.mesh('ball','#edcf89',group,m.x-m.side*11.8,2.3,m.z+11.4,.22,.25,.22);
    kit.label(group,(m.slot?'FAR':'NEAR')+' '+(w.pipeline.chapter?'ARCHIVE LENS':'RELAY LANTERN'),m.x,5.85,m.z-10,3,.25,'#20313a','#eddbb6');
    kit.label(group,'BRASS RELEASE / OPENS THE FIRING LINE',m.release[0],2.25,m.release[2],3.4,.22,'#20313a','#eddbb6');
    kit.label(group,'GALLERY / OBSERVE + SHUTTER CONTROL',m.x+m.side*10,2.25,m.z+12.7,3.8,.23,'#20313a','#eddbb6');
    kit.label(group,'SERVICE RETURN / LATCH INSIDE',m.x-m.side*11,2.75,m.z+9.8,3.8,.23,'#20313a','#eddbb6');
    kit.label(group,'SHELTERED FLANK',m.x-m.side*6,1.4,m.z+7,2.4,.22,'#20313a','#eddbb6');
    // Supported gallery landing is visually the same usable floor, not a
    // marker granting teleport permission independently of the real collider.
    const patch=kit.mesh('box','#c3baa0',group,m.x+m.side*11,3.213,m.z+2.5,1.25,.01,1.25);
    patch.name=m.id+'/gallery-receiver';
   }
   for(const d of w.pipeline.decoration){const mat=kit.mat(d.tone>.5?w.pipeline.palette[0]:w.pipeline.palette[1],.02);b.box(mat,d.x,4.9,d.z,.04,1.6,1.1);}
   const exit=w.pipeline.controls.find(c=>c.kind==='exit'),gate=new T.Group();gate.position.set(exit.p[0],1.4,exit.p[2]);group.add(gate);kit.mesh('ring','#97d9b9',gate,0,0,0,.55,.7,.55);
   kit.label(group,w.pipeline.name.toUpperCase(),0,2.8,22.4,6.7,.38,'#20313a','#eddbb6').rotation.y=Math.PI;
   kit.label(group,w.pipeline.chapter?'RESTORED READING ROOM / EXIT':'FAR BEACON / ASHEN ARCHIVE',exit.p[0],2.75,exit.p[2]-.9,5,.28,'#20313a','#eddbb6');
   const instances=b.finish(group);group.userData.pilgrimage={dynamic,signals,releases};return {group,gate,instances,pilgrimage:group.userData.pilgrimage};
  };return kit;
 };
 function install(g){const M=PilgrimageModel,C=VesperCore,$=id=>document.getElementById(id),ui=g.dominionControls;
  const intro=document.createElement('p');intro.id='pilgrimage-intro';intro.textContent='Pilgrimage connects two seeded chapters. Learn the signal courts, then use that knowledge among the archive stacks. Older chapters and saved expeditions remain available.';$('returning-intro').after(intro);
  const style=document.createElement('style');style.textContent='#pilgrimage-intro{max-width:62ch;color:#cbd9d1;line-height:1.5;border-left:2px solid #c0a77a;padding-left:12px}';document.head.append(style);
  let seen=null,event=0;
  const menu=g.menuUI.bind(g);g.menuUI=function(){menu();const s=g.game;intro.hidden=g.arMode||$('expedition-mode')?.value!=='pilgrimage';if(s.pilgrimage)$('returning-intro').hidden=true;
   if($('expedition-mode')?.value==='pilgrimage')$('start').textContent='Begin Pilgrimage / two generated chapters';
   if(!s.pilgrimage||g.arMode)return;
   $('menu-eyebrow').textContent='PILGRIMAGE / CHAPTER '+(s.pilgrimage.stage+1)+' OF 2';
   $('menu-message').textContent=M.objective(s)+' The gallery reveals an angle and a winch. The flank avoids the shutter. The direct crossing exposes you.';
   if(!g.running)$('menu-title').textContent='Read the place. Choose your firing position.';
  };
  const hud=g.hud.bind(g);g.hud=function(){hud();const s=g.game;if(!s.pilgrimage||g.arMode)return;const c=M.available(s,C),text=c?c.label:M.objective(s);
   $('chapter').textContent=s.world.pipeline.name.toUpperCase();$('objective').textContent=text;$('tally').textContent=s.targets.size+' / 2 signals / '+s.discovered.size+' places known';
   $('district-readout').textContent=s.world.rooms[C.roomAt(s.world,s.p)].label+' / '+(s.p[1]>2?'UPPER WALK':'GROUND');
   if(g.xr){const {ctx,texture}=g.xrHud;ctx.fillStyle='#172638';ctx.fillRect(0,64,1024,85);ctx.fillStyle='#d9e8dc';ctx.textAlign='center';ctx.font='25px Arial';ctx.fillText(text,512,99,965);ctx.font='19px Arial';ctx.fillText(c?'Use your configured bow-hand interact control.':'Goldwind: golden draw / disk escape / directional shield.',512,133,960);texture.needsUpdate=true;}
  };
  const draw=g.drawMenu.bind(g);g.drawMenu=function(){draw();if(!g.game.pilgrimage||g.arMode||!g.xrPanel)return;const {ctx,texture}=g.xrPanel;ctx.fillStyle='#142230';ctx.fillRect(25,20,974,82);ctx.fillStyle='#eee0bf';ctx.font='36px Georgia';ctx.textAlign='center';ctx.fillText('VESPERFALL / '+g.game.world.pipeline.name.toUpperCase(),512,78,925);texture.needsUpdate=true;};
  const visuals=g.visuals.bind(g);g.visuals=function(){visuals();const s=g.game;if(seen!==s){seen=s;event=0;}if(!s.pilgrimage||g.arMode)return;
   const art=g.worldArt.pilgrimage;if(art)for(const m of s.world.pipeline.modules){const shutter=art.dynamic[m.id+'/shutter'],gate=art.dynamic[m.id+'/gate'],winch=art.dynamic[m.id+'/winch'];if(shutter)shutter.position.y=s.pilgrimage.shutters[m.slot]?6:0;if(gate)gate.visible=!s.pilgrimage.gates[m.slot];if(winch)winch.rotation.z=s.pilgrimage.shutters[m.slot]?Math.PI/2:0;art.signals[m.slot].material= g.art.mat(s.targets.has(m.target)?'#7ee9b4':'#b4afa0',.05,true);art.releases[m.slot].material=g.art.mat(s.pilgrimage.shutters[m.slot]?'#87b3a4':'#e6b653',.03,true);}
   $('expedition-progress').textContent=s.world.pipeline.name+' / '+s.targets.size+' of 2 relays / '+s.pilgrimage.gates.filter(Boolean).length+' return gates opened';
   for(const e of s.events)if(e.seq>event&&e.type.startsWith('pilgrimage-')){if(e.text)g.toast(e.text);g.sound(e.type==='pilgrimage-signal'?330:160,.16,.025);}event=s.eventSeq||0;
  };
  const start=g.start.bind(g);g.start=function(...args){start(...args);if(g.game.pilgrimage&&g.running&&!g.paused)g.toast(M.objective(g.game));};
  const choose=g.choose.bind(g);g.choose=function(...args){choose(...args);if(g.game.pilgrimage)g.toast(g.game.world.pipeline.name+': '+M.objective(g.game));};
  function menuRows(screen){const s=g.game;if(!s.pilgrimage||g.arMode)return null;
   if(screen==='objectives')return [[M.objective(s),()=>{}],['Gallery: observation and reversible control',()=>{}],['Flank: lower exposure, longer approach',()=>{}],['Brass release: open the crossing and firing line',()=>{}],['Signals accept arrows or ordinary interaction',()=>{}],['Back',()=>ui.setScreen('expedition')]];
   if(screen==='atlas'){const list=s.world.rooms.filter(r=>s.discovered.has(r.id)),n=Math.max(1,Math.ceil(list.length/4));ui.state.xrPage%=n;return [...list.slice(ui.state.xrPage*4,ui.state.xrPage*4+4).map(r=>[r.label,()=>{ui.state.notice=r.label+'. Known neighbours: '+s.world.links[r.id].filter(id=>s.discovered.has(id)).map(id=>s.world.rooms[id].label).join(', ');ui.setScreen('notice');}]),['More / page '+(ui.state.xrPage+1)+' of '+n,()=>{ui.state.xrPage=(ui.state.xrPage+1)%n;}],['Back',()=>ui.setScreen('equipment')]];}
   return null;
  }
  function atlas(){const canvas=$('map');if(canvas.hidden)return;const ctx=canvas.getContext('2d'),s=g.game;ctx.fillStyle='#152b35';ctx.fillRect(0,0,240,220);ctx.fillStyle='#ead1a3';ctx.font='bold 11px system-ui';ctx.fillText(s.world.pipeline.name.toUpperCase(),8,18);
   const fs=s.world.floors,minZ=Math.min(...fs.map(f=>f.z-f.d/2)),maxZ=24,k=174/(maxZ-minZ),px=x=>120+x*k,pz=z=>30+(z-minZ)*k;
   for(const f of fs){if(!s.discovered.has(f.region))continue;ctx.fillStyle=f.y>1||f.type==='stair'?'#caaf76':'#5e8785';ctx.fillRect(px(f.x-f.w/2),pz(f.z-f.d/2),f.w*k,f.d*k);}
   ctx.fillStyle='#fff3d5';ctx.beginPath();ctx.arc(px(s.p[0]),pz(s.p[2]),3.2,0,7);ctx.fill();ctx.font='10px system-ui';ctx.fillText('Known '+s.discovered.size+' / '+s.world.rooms.length+'. Unknown routes hidden.',8,216);
  }
  const remove=g.remove.bind(g);g.remove=function(){intro.remove();style.remove();remove();};const api={menuRows,atlas};g.pilgrimageView=api;g.menuUI();return api;
 }
 root.PilgrimageView=Object.freeze({install});
})(globalThis);
