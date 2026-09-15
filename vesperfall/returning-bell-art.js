/* Authored masonry follows ReturningBellModel's authoritative geometry.
 * Original construction, with the game's existing locally retained CC0 stone.
 */
(function(root){'use strict';
 const previous=VesperArt.create;
 VesperArt.create=function(T,scene){
  const kit=previous(T,scene),legacy=kit.world,K=kit.architectureKit;
  function world(w){if(!w.returningBell)return legacy(w);
   const parent=new T.Group();parent.name='The Returning Bell / authored chapter';parent.userData.cathedral=true;
   const b=new K.Batch(),dynamic={};
   const surface=f=>f.y+(f.slopeZ||0)*(f.z-(f.anchorZ||0));
   for(const f of w.floors){
    if(f.type==='stair'){
     // Fine visible treads stay within 4 cm of the continuous collision ramp.
     const n=Math.ceil(f.d/.2);for(let i=0;i<n;i++){const z=f.z-f.d/2+(i+.5)*f.d/n,y=f.y+f.slopeZ*(z-f.anchorZ);b.box(K.paving,f.x,y-.035,z,f.w,.065,f.d/n+.008);b.box(K.gold,f.x,y+.004,z+f.d/n*.4,f.w,.012,.025);}
    }else {b.box(f.y?K.pale:K.dark,f.x,f.y-.16,f.z,f.w,.3,f.d);b.box(K.paving,f.x,f.y-.004,f.z,f.w,.018,f.d);
     // Continuous border detail explains the actual usable footprint.
     for(const sign of[-1,1]){b.box(K.pale,f.x+sign*(f.w/2-.08),f.y+.005,f.z,.09,.012,f.d);b.box(K.pale,f.x,f.y+.005,f.z+sign*(f.d/2-.08),f.w,.012,.09);}}
   }
   for(const s of w.solids){
    const p=s.min.map((v,i)=>(v+s.max[i])/2),d=s.max.map((v,i)=>v-s.min[i]);
    if(s.type==='screen'||s.type==='return-gate'){
     const group=new T.Group();group.name=s.id;group.position.set(p[0],s.min[1],p[2]);parent.add(group);dynamic[s.id]=group;
     const db=new K.Batch();
     if(s.type==='screen')db.box(K.copper,0,d[1]/2,0,d[0],d[1],d[2]);
     else{
      // Glazing reveals the remembered refuge while remaining a physical barrier.
      // Geometry/material are shared through the existing art kit and disposer.
      db.box(K.wood,0,.45,0,d[0],.9,d[2]);
      const glass=kit.mat('#b5d3c6',.06);glass.name='Return gate leaded glazing';glass.transparent=true;glass.opacity=.22;glass.depthWrite=false;glass.roughness=.32;
      const pane=new T.Mesh(K.unitBox,glass);pane.name='Return gate glazed sightline';pane.position.set(0,(.9+d[1])/2,0);pane.scale.set(d[0],d[1]-.9,d[2]);group.add(pane);
     }
     if(s.type==='screen'){for(let x=-4.8;x<5;x+=1.2){db.box(K.gold,x,1.8,.23,.06,3.6,.05);K.arch(db,x+.55,.7,.25,.48,2.25,0,K.gold);}for(const y of[.14,3.46])db.box(K.pale,0,y,0,10,.16,.5);}
     else{for(let z=-2;z<=2;z+=.5)db.box(K.gold,.25,1.7,z,.07,3.4,.05);for(const y of[.18,1.4,3.2])db.box(K.gold,.25,y,0,.06,.06,4.3);}
     db.finish(group);continue;
    }
    if(s.type==='statue'||s.type==='basin')continue;
    b.box(s.type==='cover'||s.type==='stair-base'?K.dark:s.type==='gallery-deck'?K.pale:K.stone,...p,...d);
    if(s.type==='wall'){
     b.box(K.pale,p[0],s.max[1]-.1,p[2],d[0]+.14,.2,d[2]+.14);
     b.box(K.dark,p[0],s.min[1]+.14,p[2],d[0]+.06,.28,d[2]+.06);
     const longX=d[0]>d[2],length=longX?d[0]:d[2];
     for(let t=.6;t<length-.3;t+=3.2){const x=longX?s.min[0]+t:p[0],z=longX?p[2]:s.min[2]+t;
      // Shallow pilasters lie on existing wall footprints, not new obstacles.
      b.box(K.pale,x,p[1],z,longX?.19:d[0]+.08,d[1],longX?d[2]+.08:.19);}
    }
    if(s.type==='cover')b.box(K.pale,p[0],s.max[1]-.06,p[2],d[0]+.03,.12,d[2]+.03);
    if(s.type==='balustrade')b.box(K.gold,p[0],s.max[1]-.03,p[2],d[0],.06,d[2]);
   }
   // Threshold arch and upper ribs explain the earlier rooms from new angles.
   K.arch(b,0,0,4,2.18,5.9);K.arch(b,-14,0,8,2.95,4.5);K.arch(b,-14,3.2,-.15,2.95,4.4);
   for(const z of[-4,-15.7,-21.3])K.arch(b,-14,3.2,z,2.95,4.4);
   for(const x of[-5.2,5.2])K.arch(b,x,3.2,-25,4.9,6.8,Math.PI/2);
   K.arch(b,0,3.2,-19,4.9,10.2);K.arch(b,0,3.2,-29.9,4.9,10.2);
   K.rose(parent,b,0,10.6,-18.35,1.7,0);
   // A high silhouette is visible before the bell chamber itself is accessible.
   for(const x of[-4.6,4.6]){b.box(K.dark,x,9.7,-24.5,.65,13,.65);b.add(K.cylinder,K.pale,x,16.4,-24.5,.8,.2,.8);b.add(kit.geos.cone||K.cylinder,K.copper,x,18,-24.5,.82,3.2,.82);}
   for(const x of[-9.2,9.2])for(const z of[-16,-8,1]){const wall=w.solids.find(s=>s.type==='wall'&&x>=s.min[0]&&x<=s.max[0]&&z>=s.min[2]&&z<=s.max[2]&&s.max[1]>3);if(!wall)continue;const y=wall.max[1];b.box(K.pale,x,y+.7,z,.38,1.4,.38);b.add(K.sphere,K.gold,x,y+1.5,z,.2,.2,.2);}
   // The sheltered landmark pair has real collision, not invisible decoration.
   const basin=w.solids.find(s=>s.type==='basin'),bp=basin.min.map((v,i)=>(v+basin.max[i])/2);
   b.add(K.cylinder,K.dark,bp[0],.18,bp[2],.83,.36,.83);b.add(K.cylinder,K.pale,bp[0],.49,bp[2],.78,.3,.78);
   b.add(K.cylinder,K.copper,bp[0],.65,bp[2],.62,.025,.62);b.box(K.dark,bp[0]+.35,.665,bp[2],.028,.022,1.13,.3);
   b.add(K.cylinder,K.gold,bp[0],.12,bp[2],.1,.24,.1);
   const statue=w.solids.find(s=>s.type==='statue'),sp=statue.min.map((v,i)=>(v+statue.max[i])/2);
   b.box(K.pale,sp[0],.28,sp[2],.95,.56,.95);b.add(K.cylinder,K.ivory,sp[0],1.08,sp[2],.25,1.05,.31);b.add(K.sphere,K.ivory,sp[0],1.89,sp[2],.21,.27,.23);
   for(const side of[-1,1])b.add(K.cylinder,K.ivory,sp[0]+side*.29,1.35,sp[2]-.05,.08,.72,.09,0,0,side*.35);
   K.candle(b,bp[0]-.65,.66,bp[2]);K.candle(b,sp[0]+.35,.58,sp[2]);
   // Actual bell target and visible winch. Both support ordinary interaction.
   const bell=new T.Group();bell.name='Processional bell';bell.position.set(0,5,-24);parent.add(bell);
   const bellGeo=new T.LatheGeometry([[.44,-.32],[.46,-.28],[.36,-.22],[.25,.02],[.19,.29],[0,.34]].map(p=>new T.Vector2(...p)),20);bell.add(new T.Mesh(bellGeo,kit.mat('#c1a167',.5)));kit.mesh('ball','#6ccbb7',bell,0,-.15,0,.15,.2,.15);
   b.box(K.wood,0,6.1,-24,2.4,.22,.24);for(const x of[-1.15,1.15])b.box(K.wood,x,4.65,-24,.18,3,.2);
   b.add(K.cylinder,K.gold,0,5.9,-24,.035,.5,.035);
   const winch=new T.Group();winch.position.set(-12.1,4.3,-11.5);parent.add(winch);winch.name='Screen winch';
   kit.mesh('ring','#bc9a65',winch,0,0,0,.45,.45,.45);for(const angle of[0,Math.PI/3,2*Math.PI/3]){const spoke=kit.mesh('box','#c9b994',winch,0,0,0,.035,.8,.035);spoke.rotation.z=angle;}
   b.box(K.wood,-12.1,3.6,-11.5,.35,.8,.35);
   for(const x of[-5.1,5.1]){b.box(K.wood,x,4.45,-13,.18,8.9,.18);b.add(K.cylinder,K.gold,x,5.3,-13,.025,7.6,.025);}
   const latch=new T.Group();latch.position.set(6.45,1.25,8);parent.add(latch);kit.mesh('box','#cfb17c',latch,0,0,0,.18,.16,.7);
   const gate=new T.Group();gate.position.set(0,1.3,9.8);parent.add(gate);kit.mesh('ring','#80b8ac',gate,0,0,0,.4,.5,.4);
   const labels=[['BASIN REFUGE / RETURN',0,2.4,11.7,0,3.6],['WEST CLOISTER / GALLERY',-13.8,1.1,8.3,0,2.7],['LOWER AMBULATORY',12,1.9,-2.1,0,2.5],['SCREEN WINCH',-12.1,5.1,-11.5,0,2.1],['PROCESSIONAL SIGNAL',0,6.5,-24,0,3],['SERVICE DESCENT',20,4.3,-27,0,2.6],['BASIN REFUGE',6.48,2.5,8,Math.PI/2,2.5]];
   for(const [text,x,y,z,yaw,width]of labels)kit.label(parent,text,x,y,z,width,.23,'#1e3038','#edd8a6').rotation.y=yaw;
   const instances=b.finish(parent);parent.userData.returningBell={dynamic,bell,winch,latch};parent.userData.materials=kit.cathedralStatus;
   return {group:parent,gate,instances,returningBell:parent.userData.returningBell};
  }
  kit.world=world;return kit;
 };
})(globalThis);
