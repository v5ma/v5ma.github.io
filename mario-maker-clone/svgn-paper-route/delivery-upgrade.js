/* SVGN.io Paper Delivery - campaign, presentation, and game-loop upgrade.
 * This extension preserves the original engine, palette, curve tools, and saves.
 * Loaded after the original scripts. No backend or account configuration changes.
 */
'use strict';
(() => {
  function boot(){
    if(window.__delivery||!window.DeliveryCampaign||typeof startPlay!=='function')return;
    const C=window.DeliveryCampaign, root=document.getElementById('stagewrap');
    const state={route:-1,code:'',paused:false,pauseAt:0,menu:true,delivered:new Set(),streak:0,lastDelivery:0,fx:[],records:C.loadRecords(localStorage),view:'3d',lastHUD:0,elapsed:0};
    const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const btn=(text,act,cls='')=>`<button type="button" class="delivery-btn ${cls}" data-delivery="${act}">${text}</button>`;
    document.body.classList.add('delivery-upgraded');
    document.title='SVGN.io Paper Delivery | Play, deliver, create';
    const header=document.createElement('header');header.id='delivery-header';
    header.innerHTML=`<a href="../../index.html">ALL PROJECTS</a><div class="delivery-brand">SVGN.io<span>PAPER DELIVERY</span></div><span class="edition">THE CITY IS WAITING FOR YOU.</span><div class="actions">${btn('Routes','routes')}${btn('Create','editor')}${btn('2D view','view')}${btn('Pause','pause')}${btn('Sound','sound')}</div>`;
    document.body.insertBefore(header,document.body.firstChild);
    root.insertAdjacentHTML('beforeend',`<canvas id="delivery-canvas" aria-hidden="true"></canvas><canvas id="delivery-fx" aria-hidden="true"></canvas>
      <div id="delivery-hud"><div class="route-widget"><small id="delivery-district">YOUR PAPER ROUTE</small><h2 id="delivery-name">The Morning Edition</h2><div class="counts"><span><b id="delivery-count">0/4</b> deliveries</span><span><b id="delivery-score">0</b> score</span><span id="delivery-attempt">TRY 1</span></div><canvas id="delivery-map" width="560" height="42" aria-label="Route progress"></canvas></div><div id="delivery-timer"><small>ON THE CLOCK</small><span>0:00</span></div></div>
      <div id="delivery-hint">Move with A/D or arrows. Space jumps. C throws the paper.</div>
      <section id="delivery-menu" class="open" role="dialog" aria-modal="true" aria-label="Choose a delivery route"></section>
      <section id="delivery-results" role="dialog" aria-modal="true" aria-label="Delivery results"></section>
      <section id="delivery-pause" role="dialog" aria-modal="true" aria-label="Game paused"><div class="delivery-pause-card"><div class="delivery-kicker">TAKE A BREATHER</div><h2>Route paused.</h2><p>Your courier and route clock are paused. Your next delivery will be right where you left it.</p>${btn('Back to the route','resume','gold')} ${btn('Choose a route','routes')}</div></section>`);
    const fallback=document.getElementById('delivery-canvas'), fxCanvas=document.getElementById('delivery-fx'), g2=fallback.getContext('2d'), fg=fxCanvas.getContext('2d');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let scale=1,W=1,H=1,layoutDirty=true,env=null,envKey='',previousMenuFocus=null,throwBufferedUntil=0;
    const resize=new ResizeObserver(()=>layoutDirty=true);resize.observe(root);
    function size(){if(!layoutDirty)return;layoutDirty=false;const r=root.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);scale=Math.min(devicePixelRatio||1,2);for(const c of[fallback,fxCanvas]){c.width=Math.round(W*scale);c.height=Math.round(H*scale);}markFitDirty();}
    function saveRecords(){try{localStorage.setItem('svgn_delivery_records_v1',JSON.stringify(state.records));}catch{toast('Records cannot be saved in this browser.');}}
    function current(){return C.routes[state.route];}
    function clearKeys(){throwBufferedUntil=0;for(const k of Object.keys(keys))keys[k]=false;}
    function paused(on){
      if(on===state.paused)return;
      state.paused=on;clearKeys();
      if(on){state.pauseAt=performance.now();try{AC?.suspend();}catch{}}
      else {if(mode==='play')tStart+=performance.now()-state.pauseAt;state.pauseAt=0;try{AC?.resume();}catch{}}
      header.querySelector('[data-delivery="pause"]').textContent=on?'Resume':'Pause';
    }
    function hidePanels(){document.body.classList.remove('delivery-menu-open');for(const id of['delivery-menu','delivery-results','delivery-pause'])document.getElementById(id).classList.remove('open');state.menu=false;}
    function showMenu(){
      previousMenuFocus=document.activeElement;paused(true);hidePanels();state.menu=true;document.body.classList.add('delivery-menu-open');
      const menu=document.getElementById('delivery-menu');menu.classList.add('open');
      menu.innerHTML=`<div class="delivery-hero"><div class="delivery-kicker">AN ORIGINAL SVGN.io ARCADE ADVENTURE</div><h1>Good morning,<br><em>news travels<br>with you.</em></h1><p>Leap across the city. Time your newspaper throws. Deliver the news, find your rhythm, and build your own route.</p><div class="delivery-controls"><span class="key">A / D</span> MOVE &nbsp; <span class="key">SPACE</span> JUMP &nbsp; <span class="key">C</span> THROW<br><span class="key">X</span> NITRO &nbsp; <span class="key">P</span> PAUSE &nbsp; TOUCH & CONTROLLER READY</div>${btn(mode==='play'&&!won?'Resume current route':'Open the level editor',mode==='play'&&!won?'resume':'editor','gold')}<p class="minor">Original 3D couriers. Three curated routes. Your existing editor and saved machines are still here.</p></div><div class="delivery-courses">${C.routes.map((r,i)=>{const rec=state.records[r.id];const med=rec&&['gold','silver','bronze'].includes(rec.medal)?rec.medal.toUpperCase():'NOT YET DELIVERED';return `<button type="button" class="delivery-course" data-course="${i}"><small>${r.district} / ${r.difficulty}</small><h2>${r.name}</h2><p>${r.description}</p><span class="route-footer"><span>DELIVER ${r.quota} / ${r.mail.length} BOXES</span><span>${med}</span></span></button>`;}).join('')}</div>`;
      menu.querySelector('button')?.focus({preventScroll:true});
    }
    function startRoute(i){
      if(!C.routes[i])return;
      if(mode==='edit'&&state.route<0){try{localStorage.setItem('svgn_delivery_blueprint_v1',levelCode());}catch{toast('Blueprint backup could not be saved.');}}
      state.route=i;const data=C.build(i,T);state.code=C.encode(data);
      toEdit();loadCode(state.code);packPlaying=null;hideWin();hidePanels();state.delivered.clear();state.streak=0;state.fx=[];routeKeep=false;
      paused(false);startPlay(true);state.elapsed=0;envKey='';
      document.getElementById('delivery-hint').textContent=data.tip;
      document.getElementById('btnNext').style.display='none';
      cv.focus?.({preventScroll:true});
    }
    function openEditor(){
      hidePanels();paused(false);toEdit();
      if(state.route>=0){const backup=(()=>{try{return localStorage.getItem('svgn_delivery_blueprint_v1');}catch{return null;}})();if(backup)loadCode(backup);}
      state.route=-1;state.code='';envKey='';document.getElementById('delivery-hint').textContent='Create mode: paint tiles, draw curves, save a machine, then press Play to test it.';
    }
    const baseSpawn=spawnWorld;
    window.spawnWorld=function(sx,sy){
      const keep=routeKeep,saved=new Set(state.delivered);baseSpawn(sx,sy);
      if(!keep){state.delivered.clear();state.streak=0;state.lastDelivery=0;}else for(const k of saved){const [x,y]=k.split(',').map(Number);if(pg(x,y)===T.MAILBOX)spg(x,y,T.MAILDONE);}
      if(current()&&levelCode().split('.')[1]===state.code.split('.')[1]){routeQuota=current().quota;routeTotal=current().mail.length;}
      updateHUD();
    };
    const baseFire=fireGun;
    window.fireGun=function(p){
      const held=keys.KeyC;
      if(throwBufferedUntil>performance.now()&&p.gunCD<=1){keys.KeyC=true;throwBufferedUntil=0;}
      baseFire(p);keys.KeyC=held;
    };
    const basePackets=stepPackets;
    window.stepPackets=function(){
      const before=deliveries; basePackets();
      if(deliveries>before){
        for(let y=0;y<LH;y++)for(let x=0;x<LW;x++)if(pg(x,y)===T.MAILDONE&&!state.delivered.has(x+','+y)){
          state.delivered.add(x+','+y);state.fx.push({x:x*TILE+18,y:y*TILE,text:'DELIVERED!',life:1.7,color:'#ffe097'});
        }
        const now=performance.now();state.streak=now-state.lastDelivery<16000?state.streak+1:1;state.lastDelivery=now;
        if(state.streak>1&&current()){addScore(25*state.streak,player.x,player.y-30,state.streak+'x ROUTE STREAK');state.fx.push({x:player.x,y:player.y-30,text:state.streak+'x STREAK',life:1.4,color:'#8ef1cc'});}
      }
    };
    const baseWin=win;
    window.win=function(){
      baseWin();
      const r=current(),seconds=(performance.now()-tStart)/1000,total=r?r.mail.length:routeTotal;
      const medal=C.medal({delivered:deliveries,total,seconds,par:r?r.par:120,attempts:tries});
      if(r&&levelCode().split('.')[1]===state.code.split('.')[1]){
        const old=state.records[r.id],rank={bronze:1,silver:2,gold:3};
        state.records[r.id]={medal:old&&rank[old.medal]>rank[medal]?old.medal:medal,time:Math.min(Number(old?.time)||Infinity,seconds),score:Math.max(Number(old?.score)||0,score)};saveRecords();
      }
      const results=document.getElementById('delivery-results');results.classList.add('open');
      results.innerHTML=`<div class="delivery-hero"><div class="medal" aria-hidden="true">&#9733;</div><div class="delivery-kicker">${medal.toUpperCase()} ROUTE COMPLETE</div><h1>The news<br><em>is delivered.</em></h1><p>${safe(r?r.name:nameEl.value)} is in the bag. Deliver every mailbox for silver. Deliver all on your first attempt before the target time for gold.</p></div><div class="delivery-result-stats"><div><strong>${deliveries}/${total}</strong><small>MAILBOXES SERVED</small></div><div><strong>${seconds.toFixed(1)}s</strong><small>ROUTE TIME</small></div><div><strong>${score}</strong><small>SCORE</small></div><div><strong>${tries}</strong><small>ATTEMPTS</small></div><div class="delivery-result-actions">${r?btn('Next route','next','gold'):btn('Choose a route','routes','gold')}${btn('Run it again','retry')}${btn('All routes','routes')}</div></div>`;
      results.querySelector('button')?.focus({preventScroll:true});
    };
    const originalTick=tick;let previous=performance.now(),accumulator=0;
    // Fixed 60 Hz simulation. Preserve all engine steps; draw only once per frame.
    window.tick=function(){
      const now=performance.now(),dt=Math.min((now-previous)/1000,.1);previous=now;size();
      if(state.paused||state.menu||document.hidden){accumulator=0;fit();render();return;}
      accumulator+=dt;const draw=window.render;window.render=()=>{};
      try{let n=0;while(accumulator>=1/60&&n<6){originalTick();accumulator-=1/60;n++;}}
      finally{window.render=draw;}
      draw();
    };
    const originalRender=window.render;
    function setText(id,value){const el=document.getElementById(id);const text=String(value);if(el.textContent!==text)el.textContent=text;}
    function hud(now){
      if(now-state.lastHUD<100)return;state.lastHUD=now;
      const r=current();setText('delivery-name',r?r.name:nameEl.value);setText('delivery-district',r?r.district:'YOUR CUSTOM MACHINE');
      setText('delivery-count',`${deliveries}/${routeQuota}`);setText('delivery-score',score);setText('delivery-attempt','TRY '+tries);
      if(mode==='play'&&!state.paused&&!won)state.elapsed=(now-tStart)/1000;
      const elapsed=Math.max(0,state.elapsed),clock=`${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`;
      const clockEl=document.querySelector('#delivery-timer span');if(clockEl.textContent!==clock)clockEl.textContent=clock;
      const mc=document.getElementById('delivery-map'),mg=mc.getContext('2d');mg.clearRect(0,0,560,42);mg.fillStyle='#547780';mg.fillRect(4,21,552,3);
      if(r)for(const x of r.mail){mg.fillStyle=state.delivered.has(x+','+(r.ground-1))?'#8cf1c6':'#ffd177';mg.beginPath();mg.arc(7+x/r.width*546,22,5,0,Math.PI*2);mg.fill();}
      if(player){mg.fillStyle='#f6f9eb';mg.beginPath();const x=7+Math.min(1,Math.max(0,player.x/(LW*TILE)))*546;mg.moveTo(x,3);mg.lineTo(x-5,13);mg.lineTo(x+5,13);mg.fill();}
      if(mode==='play'&&!state.menu){const hint=document.getElementById('delivery-hint');const text=deliveries>=routeQuota?'Route quota met! Extra mailboxes are optional. Head right to the depot.':(state.elapsed<18?(r?r.tip:'Press C to deliver papers to mailboxes.'):state.streak>1?`${state.streak} deliveries in rhythm. Keep the route streak going!`:'C throws a paper. Space jumps. P pauses. Reach the depot after serving the quota.');if(hint.textContent!==text)hint.textContent=text;}
    }
    function projection(x,y){
      const m=window.__merged;
      if(state.view==='3d'&&window.__gpuReady&&m){const v=new m.THREE.Vector3(x,-y,20).project(m.camera);return [(v.x+1)*W/2,(1-v.y)*H/2];}
      const z=mode==='play'?Math.min(1.6,Math.max(1.1,W/800)):1;
      return [(x-cam.x)*z,(y-cam.y)*z];
    }
    function rect(c,x,y,w,h,color,r=0){c.fillStyle=color;if(r){c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}else c.fillRect(x,y,w,h);}
    function paper(c,x,y,s=1){c.save();c.translate(x,y);c.rotate(-.18);rect(c,-9*s,-6*s,18*s,12*s,'#fff5d6',2);rect(c,-6*s,-4*s,12*s,3*s,'#233e4e');rect(c,-6*s,1*s,7*s,1*s,'#879792');rect(c,-6*s,4*s,10*s,1*s,'#879792');c.restore();}
    function skyline(c,w,h,night,phase=0){
      const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,night?'#101e48':'#4e99ad');gr.addColorStop(.65,night?'#60567a':'#f2c39a');gr.addColorStop(1,night?'#d58986':'#fbe0ab');c.fillStyle=gr;c.fillRect(0,0,w,h);
      c.fillStyle=night?'#faf0c9':'#ffecad';c.beginPath();c.arc(w*.72,h*.26,night?32:54,0,7);c.fill();
      if(night)for(let i=0;i<42;i++){c.fillStyle='#fff0d09a';c.fillRect((i*251)%w,25+(i*61)%(h*.5),2,2);}
      for(let layer=0;layer<3;layer++){
        const span=95+layer*45,off=(phase*(.12+layer*.16))%span;
        for(let i=-1;i<w/span+1;i++){
          const x=i*span-off,height=75+((i+70)*37+layer*29)%180,bottom=h*(.65+layer*.12);
          rect(c,x,bottom-height,span-6,height,night?['#30405a','#283c50','#223942'][layer]:['#91a9a4','#789997','#4c7c83'][layer]);
          if(layer>0)for(let wx=9;wx<span-15;wx+=17)for(let wy=12;wy<height-10;wy+=24)rect(c,x+wx,bottom-height+wy,6,10,night?'#ffe4a585':'#cbe2c85a');
        }
      }
      c.fillStyle=night?'#294453':'#467b82';c.fillRect(0,h*.9,w,h*.1);
    }
    function tile2D(c,t,x,y,time){
      const night=themeName==='city';
      if(SOLID.has(t)){
        rect(c,x,y,36,36,night?'#365361':'#578783');rect(c,x,y,36,5,night?'#87c0ba':'#b9d8b1');rect(c,x+2,y+9,32,2,'#213f5044');rect(c,x+17,y+10,2,24,'#1c435344');
        if(t===T.CRATE||t===T.BCRATE||t===T.QBLOCK){rect(c,x+2,y+2,32,32,'#d9a35c',4);rect(c,x+6,y+6,24,24,'#efd091',3);c.fillStyle='#6f4f32';c.font='bold 21px system-ui';c.fillText(t===T.QBLOCK?'?':'+',x+11,y+25);}
        if(t===T.CONVR||t===T.CONVL){c.strokeStyle='#ffe29a';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+i*12+3,y+7);c.lineTo(x+i*12+8,y+12);c.lineTo(x+i*12+3,y+17);c.stroke();}}
      }else if(t===T.MAILBOX||t===T.MAILDONE){
        rect(c,x+16,y+14,4,22,'#544e49');rect(c,x+3,y+2,30,17,t===T.MAILDONE?'#75bd94':'#fff1c9',6);rect(c,x+22,y+4,5,10,'#395665',3);rect(c,x+4,y+7,14,2,'#567c7b');rect(c,x+29,y-7,3,17,'#e87753');
        if(t===T.MAILDONE){c.strokeStyle='#eaffdf';c.lineWidth=2;c.beginPath();c.moveTo(x+9,y+10);c.lineTo(x+13,y+14);c.lineTo(x+21,y+6);c.stroke();}
      }else if(t===T.GEAR){paper(c,x+18,y+17+Math.sin(time*3+x)*2,.85);
      }else if(t===T.PLAT||t===T.MOVER||t===T.LIFT){rect(c,x,y+4,36,9,'#f5cf93',3);rect(c,x+4,y+13,28,4,'#687b68');
      }else if(t===T.SPRING){rect(c,x+2,y+27,32,8,'#d48669',3);c.strokeStyle='#99dcbd';c.lineWidth=3;c.beginPath();c.moveTo(x+6,y+28);for(let i=0;i<5;i++)c.lineTo(x+(i%2?7:27),y+24-i*4);c.stroke();rect(c,x+3,y+3,30,5,'#ffe39c',2);
      }else if(t===T.SPIKE||t===T.LAVA){c.fillStyle=t===T.LAVA?'#eb744c':'#eef0d5';for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+i*12,y+35);c.lineTo(x+i*12+6,y+10);c.lineTo(x+i*12+12,y+35);c.fill();}
      }else if(t===T.CHECK||t===T.CHECKON||t===T.GOAL){rect(c,x+15,y-36,4,72,'#e1d8b7');rect(c,x+19,y-34,t===T.GOAL?54:25,22,t===T.CHECKON?'#93d2b2':'#eac06c',3);c.font='bold 8px system-ui';c.fillStyle='#243e48';c.fillText(t===T.GOAL?'DEPOT':'SAVE',x+22,y-20);
      }else if(t===T.START){if(mode==='edit')bot2D(c,x+18,y+18,time,'#ffd177');
      }else if(ENTITY.has(t)){bot2D(c,x+18,y+18,time,'#d89091');
      }else if(t!==0&&!TRACKS.has(t)){rect(c,x+7,y+7,22,22,'#e1c18b',5);c.fillStyle='#264955';c.font='bold 10px system-ui';c.fillText(t===T.SHIELD?'S':t===T.NITRO?'N':t===T.BIKEDOCK?'BIKE':String(t),x+10,y+22);}
    }
    function bot2D(c,x,y,time,color,dir=1,velocity=0){
      c.save();c.translate(x,y);c.scale(dir,1);c.fillStyle='#12343c55';c.beginPath();c.ellipse(0,18,15,4,0,0,7);c.fill();
      const stride=Math.sin(time*14)*Math.min(4,Math.abs(velocity));rect(c,-8,9+stride,6,10,'#1c3c4e',2);rect(c,3,9-stride,6,10,'#1c3c4e',2);rect(c,-12,-6,24,20,color,5);rect(c,-10,-20,22,17,'#dae2c8',5);rect(c,-6,-16,16,8,'#274b55',3);rect(c,4,-14,3,3,'#91eee0',1);rect(c,-14,-12,28,5,color,2);rect(c,-17,-3,8,18,'#526d65',3);rect(c,9,-1,8,5,'#eff0d0',2);c.restore();
    }
    function draw2D(now){
      g2.setTransform(scale,0,0,scale,0,0);skyline(g2,W,H,themeName==='city',cam.x);
      const z=mode==='play'?Math.min(1.6,Math.max(1.1,W/800)):1;
      if(mode==='play'&&player){cam.x=Math.max(0,Math.min(LW*TILE-W/z,player.x-W/z*.36));cam.y=Math.min(LH*TILE-H/z,player.y-H/z*.58);}
      g2.save();g2.scale(z,z);g2.translate(-cam.x,-cam.y);
      const data=mode==='play'?playGrid:grid,time=now/1000;
      for(let y=Math.max(0,Math.floor(cam.y/TILE)-1);y<Math.min(LH,Math.ceil((cam.y+H/z)/TILE)+2);y++)for(let x=Math.max(0,Math.floor(cam.x/TILE)-1);x<Math.min(LW,Math.ceil((cam.x+W/z)/TILE)+2);x++){const id=data[y*LW+x];if(id)tile2D(g2,id,x*TILE,y*TILE,time);}
      if(mode==='edit'&&editTracksDirty){editTracks=buildTracks(grid);editTracksDirty=false;}
      for(const tr of (mode==='play'?tracks:editTracks)){
        const pts=tr.pts||tr.points||[];if(!pts.length)continue;g2.strokeStyle='#83d7cf';g2.lineWidth=7;g2.beginPath();pts.forEach((p,i)=>{const x=p.x??p[0],y=p.y??p[1];if(i)g2.lineTo(x,y);else g2.moveTo(x,y);});g2.stroke();
      }
      if(mode==='play'){
        for(const m of movers){rect(g2,m.x,m.y,m.w,m.h,'#f5d399',3);}
        for(const e of enemies)if(e.dead<=0)bot2D(g2,e.x,e.y-e.h/2,time,'#d28a87',e.vx<0?-1:1,e.vx);
        for(const p of pickups)if(!p.dead)tile2D(g2,T.SHIELD,p.x,p.y,time);
        for(const p of packets){g2.save();g2.translate(p.x,p.y);g2.rotate(p.rot);paper(g2,0,0,.75);g2.restore();}
        for(const p of particles){g2.globalAlpha=Math.min(1,p.life/15);rect(g2,p.x,p.y,p.size||3,p.size||3,p.color||'#ffe2a1');}g2.globalAlpha=1;
        if(player){if(player.shield){g2.strokeStyle='#94efdba0';g2.lineWidth=2;g2.beginPath();g2.arc(player.x+13,player.y+12,27,0,7);g2.stroke();}bot2D(g2,player.x+13,player.y+13,time,CH().body||'#ffd177',player.dir,player.vx);if(player.veh){g2.strokeStyle='#ead69e';g2.lineWidth=4;for(const x of[-10,12]){g2.beginPath();g2.arc(player.x+13+x,player.y+31,8,0,7);g2.stroke();}}}
      }
      if(mode==='edit'){
        g2.strokeStyle='#e4f2e01c';g2.lineWidth=.5;g2.beginPath();for(let x=Math.floor(cam.x/TILE)*TILE;x<cam.x+W;x+=TILE){g2.moveTo(x,cam.y);g2.lineTo(x,cam.y+H);}for(let y=Math.floor(cam.y/TILE)*TILE;y<cam.y+H;y+=TILE){g2.moveTo(cam.x,y);g2.lineTo(cam.x+W,y);}g2.stroke();
      }
      g2.restore();
    }
    function destroyEnvironment(){if(!env)return;env.parent?.remove(env);env.traverse(o=>{o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){m?.map?.dispose();m?.dispose();}});env=null;}
    function buildEnvironment(m){
      destroyEnvironment();const A=m.THREE,night=themeName==='city',ground=-(current()?.ground??(LH-2))*TILE;
      env=new A.Group();env.name='SVGN Delivery District';m.scene.add(env);
      const bg=document.createElement('canvas');bg.width=1536;bg.height=768;skyline(bg.getContext('2d'),1536,768,night,0);
      const tx=new A.CanvasTexture(bg);tx.colorSpace=A.SRGBColorSpace;
      const sky=new A.InstancedMesh(new A.PlaneGeometry(6500,2400),new A.MeshBasicNodeMaterial({map:tx,depthWrite:false}),1);sky.setMatrixAt(0,new A.Matrix4());sky.position.set(LW*TILE/2,ground+620,-400);sky.renderOrder=-100;env.add(sky);
      const geom=new A.BoxGeometry(1,1,1),mat=new A.MeshStandardNodeMaterial({roughness:.86,metalness:.05});
      const batch=new A.InstancedMesh(geom,mat,512),matrix=new A.Matrix4();let n=0;
      function box(x,y,z,w,h,d,color,angle=0){if(n>=512)return;matrix.makeRotationZ(angle);matrix.scale(new A.Vector3(w,h,d));matrix.setPosition(x,y,z);batch.setMatrixAt(n,matrix);batch.setColorAt(n,new A.Color(color));n++;}
      const cols=night?['#5e7185','#586e78','#847882','#566979']:['#d9ab83','#b0c6ab','#8faeb8','#d8c196','#bbacae'];
      for(let i=0;i<Math.ceil(LW/7);i++){
        const x=i*252+90,h=100+(i*47)%125,w=142+(i%3)*20;
        box(x,ground+h/2,-130,w,h,65,cols[i%cols.length]);box(x,ground+h+4,-128,w+14,12,78,night?'#435663':'#65878c');
        box(x,ground+13,-91,w+9,25,9,night?'#3b4d56':'#b09f82');
        for(let row=0;row<Math.floor(h/35);row++)for(let col=0;col<3;col++)box(x-w*.3+col*w*.3,ground+29+row*34,-94,18,19,3,night?'#ffce83':'#365f70');
        box(x,ground+22,-90,24,44,4,'#2e4c56');
        if(i%2===0){box(x+w*.54,ground+46,-65,4,94,4,'#384e58');box(x+w*.54+12,ground+93,-65,28,6,6,'#617b75');box(x+w*.54+20,ground+88,-65,12,10,9,'#ffdfa1');}
      }
      batch.count=n;batch.instanceMatrix.needsUpdate=true;if(batch.instanceColor)batch.instanceColor.needsUpdate=true;env.add(batch);
      const light=new A.DirectionalLight(night?0x9ac9ee:0xffdeb0,night?.7:1.3);light.position.set(-200,300,250);env.add(light);env.add(new A.AmbientLight(night?0x8caace:0xc9dfd8,.65));
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#173c45';c.fillRect(0,0,512,128);c.strokeStyle='#edc77b';c.lineWidth=5;c.strokeRect(7,7,498,114);c.fillStyle='#ffe0a0';c.font='bold 38px system-ui';c.textAlign='center';c.fillText('SVGN.io NEWS DEPOT',256,56);c.font='18px system-ui';c.fillStyle='#cbe3d8';c.fillText('THE LAST STOP. THE NEXT STORY.',256,95);
      const signTx=new A.CanvasTexture(canvas);signTx.colorSpace=A.SRGBColorSpace;const sign=new A.InstancedMesh(new A.PlaneGeometry(230,58),new A.MeshBasicNodeMaterial({map:signTx}),1);sign.setMatrixAt(0,new A.Matrix4());sign.position.set((LW-5)*TILE,ground+125,-60);env.add(sign);
      m.renderer.setClearColor(night?0x182438:0xb4cfbd,1);
    }
    window.render=function(){
      const now=performance.now();size();const m=window.__merged,available=window.__gpuReady===true&&m,three=state.view==='3d'&&available;
      fallback.style.visibility=three?'hidden':'visible';
      const gl=document.getElementById('gl');if(gl)gl.style.visibility=three?'visible':'hidden';
      if(three){const k=[LW,LH,themeName,state.route].join(':');if(k!==envKey){envKey=k;buildEnvironment(m);}originalRender();}
      else {try{cx.clearRect(0,0,cv.width,cv.height);}catch{}draw2D(now);}
      fg.setTransform(scale,0,0,scale,0,0);fg.clearRect(0,0,W,H);
      for(const f of state.fx){if(!state.paused){f.life-=1/60;f.y-=.28;}const[x,y]=projection(f.x,f.y);fg.globalAlpha=Math.min(1,f.life*2);fg.font='800 19px system-ui';fg.textAlign='center';fg.strokeStyle='#123440';fg.lineWidth=5;fg.strokeText(f.text,x,y);fg.fillStyle=f.color;fg.fillText(f.text,x,y);}fg.globalAlpha=1;state.fx=state.fx.filter(f=>f.life>0);
      if(mode==='play'&&player&&!state.menu&&!won){
        const mb=nearestMailbox(player,250);if(mb){const[x,y]=projection(mb.x*TILE+18,mb.y*TILE-13);fg.fillStyle='#ffdf98';fg.beginPath();fg.moveTo(x-6,y-10);fg.lineTo(x+6,y-10);fg.lineTo(x,y-3);fg.fill();
          // The preview uses exactly the engine's fixed sector, speed, lift and gravity.
          const a=throwSector(player,mb);let px=player.x+player.w/2,py=player.y+6,vx=Math.cos(a)*THROW_V+player.vx,vy=Math.sin(a)*THROW_V-THROW_LIFT;
          fg.fillStyle='#fff0c077';for(let i=0;i<26;i++){vy+=GRAV*THROW_GRAV;px+=vx;py+=vy;if(i%3===0){const[qx,qy]=projection(px,py);fg.beginPath();fg.arc(qx,qy,2,0,7);fg.fill();}}
        }
      }
      hud(now);
    };
    function act(a){
      if(a==='routes')showMenu();
      else if(a==='editor')openEditor();
      else if(a==='resume'){hidePanels();paused(false);previousMenuFocus?.focus?.();}
      else if(a==='pause'){if(state.menu)return;if(state.paused){hidePanels();paused(false);}else if(mode==='play'&&!won){paused(true);document.getElementById('delivery-pause').classList.add('open');document.querySelector('#delivery-pause button').focus();}}
      else if(a==='next')startRoute((state.route+1)%C.routes.length);
      else if(a==='retry'){if(current())startRoute(state.route);else{hidePanels();paused(false);hideWin();startPlay(true);}}
      else if(a==='view'){state.view=state.view==='3d'?'2d':'3d';header.querySelector('[data-delivery="view"]').textContent=state.view==='3d'?'2D view':'3D view';if(state.view==='3d'&&!window.__gpuReady)toast('3D renderer is not available here. The 2D game remains playable.');}
      else if(a==='sound'){document.getElementById('btnMute').click();header.querySelector('[data-delivery="sound"]').textContent=document.getElementById('btnMute').textContent.includes('MUTED')?'Muted':'Sound';}
    }
    document.addEventListener('click',e=>{const course=e.target.closest('[data-course]');if(course){startRoute(Number(course.dataset.course));return;}const b=e.target.closest('[data-delivery]');if(b)act(b.dataset.delivery);});
    window.addEventListener('keydown',e=>{
      if(e.code==='KeyP'||e.code==='Escape'){if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;e.preventDefault();e.stopImmediatePropagation();if(state.menu&&mode==='play'&&!won)act('resume');else act('pause');return;}
      const panel=document.querySelector('#delivery-menu.open,#delivery-results.open,#delivery-pause.open');
      if(panel&&e.key==='Tab'){const list=[...panel.querySelectorAll('button,a')],first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}e.stopPropagation();return;}
      if(panel||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)){e.stopImmediatePropagation();return;}
      if(e.code==='KeyC'&&!e.repeat&&mode==='play'&&!state.paused)throwBufferedUntil=performance.now()+180;
    },true);
    window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',()=>{clearKeys();if(document.hidden&&mode==='play'&&!won&&!state.menu)act('pause');});
    // Expose deterministic state and controls for development, not a remote API.
    window.__delivery={state,startRoute,showMenu,openEditor,act,get paused(){return state.paused},get environment(){return env},version:'2026.09.04'};
    document.getElementById('tFire').textContent='THROW';cv.tabIndex=0;cv.setAttribute('aria-label','Paper delivery game. Arrows move, Space jumps, C throws, P pauses.');
    const baseToEdit=toEdit;window.toEdit=function(){paused(false);baseToEdit();clearKeys();};
    showMenu();size();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
