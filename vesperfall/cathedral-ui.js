/* Scaled atlas and art diagnostics. No movement, aim, records or combat writes. */
(function(root){'use strict';
 const colors={choir:'#c0ac79',nave:'#9cafa4',court:'#759d97',transept:'#c2b6a5',archive:'#ad947b',belfry:'#a99bbb'};
 function install(g){
  const $=id=>document.getElementById(id),toggle=$('cathedral-shadows');let cachedWorld=null,bounds=null,baseCanvas=null,shadowWorld=null;
  if(matchMedia('(pointer: coarse)').matches)toggle.checked=false;
  function lighting(){const r=g.scene.renderer;if(!r)return;r.shadowMap.enabled=toggle.checked&&!g.xr;r.shadowMap.type=g.T.PCFSoftShadowMap;g.scene.object3D.updateMatrixWorld(true);g.scene.object3D.traverse(o=>{if(o.isDirectionalLight&&!o.userData.cathedralSun){o.userData.cathedralSun=true;if(o.getWorldPosition(new g.T.Vector3()).y>20){o.castShadow=true;o.shadow.mapSize.set(1536,1536);Object.assign(o.shadow.camera,{left:-60,right:60,top:65,bottom:-65,near:.1,far:160});o.shadow.bias=-.0003;o.shadow.normalBias=.04;o.target.position.set(0,0,-26);g.scene.object3D.add(o.target);o.shadow.camera.updateProjectionMatrix();}}});}
  toggle.onchange=lighting;g.scene.addEventListener('enter-vr',lighting);g.scene.addEventListener('exit-vr',lighting);g.scene.addEventListener('renderstart',lighting,{once:true});if(g.scene.renderer)lighting();
  function worldBounds(w){const minX=Math.min(...w.rooms.map(r=>r.x-r.w/2)),maxX=Math.max(...w.rooms.map(r=>r.x+r.w/2)),minZ=Math.min(...w.rooms.map(r=>r.z-r.d/2)),maxZ=Math.max(...w.rooms.map(r=>r.z+r.d/2)),scale=Math.min(210/(maxX-minX),158/(maxZ-minZ));return {minX,maxX,minZ,maxZ,scale,cx:(minX+maxX)/2,cz:(minZ+maxZ)/2};}
  function atlas(){const w=g.game.world,canvas=$('map');if(canvas.hidden)return;const ctx=canvas.getContext('2d');
   if(w!==cachedWorld){cachedWorld=w;bounds=worldBounds(w);baseCanvas=document.createElement('canvas');baseCanvas.width=240;baseCanvas.height=220;const c=baseCanvas.getContext('2d'),f=(x,z)=>[120+(x-bounds.cx)*bounds.scale,112+(z-bounds.cz)*bounds.scale];c.fillStyle='#152b35f5';c.fillRect(0,0,240,220);c.fillStyle='#e8d3aa';c.font='bold 11px system-ui';c.fillText('ATLAS / SECTOR '+w.depth,12,18);
    c.lineWidth=3;c.strokeStyle='#788b89';for(const [a,b]of w.edges){const r=w.rooms[a],s=w.rooms[b];c.beginPath();c.moveTo(...f(r.x,r.z));c.lineTo(...f(s.x,s.z));c.stroke();}
    for(const r of w.rooms){c.beginPath();r.outline.forEach(([x,z],i)=>c[i?'lineTo':'moveTo'](...f(r.x+x,r.z+z)));c.closePath();c.fillStyle=colors[r.planFamily]+'88';c.strokeStyle=colors[r.planFamily];c.lineWidth=1;c.fill();c.stroke();}
    c.setLineDash([3,2]);c.strokeStyle='#f2cb7a';c.lineWidth=2;for(const r of w.architecture.routes){c.beginPath();c.moveTo(...f(r.a[0],r.a[2]));c.lineTo(...f(r.b[0],r.b[2]));c.stroke();}c.setLineDash([]);
    const tower=w.architecture.tower;if(tower){const r=w.rooms[tower.room],[x,y]=f(r.x,r.z);c.strokeStyle='#efd38c';c.strokeRect(x-5,y-5,10,10);}
    c.font='8px system-ui';c.fillStyle='#d3bc7d';c.fillText('GOLD: UPPER ROUTE / ◆ RELIQUARY',12,207);
   }
   ctx.drawImage(baseCanvas,0,0);const f=p=>[120+(p[0]-bounds.cx)*bounds.scale,112+(p[2]-bounds.cz)*bounds.scale];
   for(const p of w.pickups.filter(p=>p.kind==='relic'&&!p.taken)){const[x,y]=f(p.p);ctx.fillStyle='#ffe5a4';ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x+3,y);ctx.lineTo(x,y+4);ctx.lineTo(x-3,y);ctx.fill();}
   for(const e of w.enemies)if(!e.dead){ctx.fillStyle='#ec9a82';ctx.beginPath();ctx.arc(...f(e.p),2.5,0,7);ctx.fill();}
   const ex=w.rooms[w.exit],[x,y]=f([ex.x,0,ex.z]);ctx.strokeStyle=g.game.portalReady?'#8be6b5':'#7086a1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.stroke();
   const [px,py]=f(g.game.p);ctx.fillStyle='#fbf8e8';ctx.beginPath();ctx.arc(px,py,3.5,0,7);ctx.fill();ctx.fillStyle='#e0e9dc';ctx.font='9px system-ui';ctx.fillText('ELEVATION '+g.game.p[1].toFixed(1)+' m',12,31);
  }
  function hud(){atlas();const s=g.game,r=s.world.rooms[VesperCore.roomAt(s.world,s.p)],relics=s.world.pickups.filter(p=>p.kind==='relic');$('district-readout').textContent=r.label+' / '+(s.p[1]>5?'BELFRY LEVEL':s.p[1]>2?'UPPER WALK':'GROUND')+' · '+relics.filter(p=>p.taken).length+'/'+relics.length+' reliquaries';if(shadowWorld!==s.world){shadowWorld=s.world;lighting();}const errors=g.art.cathedralStatus.errors;if(errors.length)$('status').textContent='Some art failed to load; reload to retry. '+errors.join('; ');}
  return {hud,lighting,get atlasBounds(){return bounds}};
 }
 root.CathedralUI=Object.freeze({install});
})(globalThis);
