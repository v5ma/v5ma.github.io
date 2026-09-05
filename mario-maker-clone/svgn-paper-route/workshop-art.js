/* Course identities are built from real room/terrain geometry. */
window.WorkshopArt={
 populate({course,m,root,kit,metal,terrain,greenery,far,sign}){
  const w=course.wm;if(!w)return;const quarry=w.style==='quarry';
  if(quarry){
   for(let i=0;i<12;i++){
    const x=180+i*315,y=-2440+(i%3)*210,z=-260-(i%2)*220,r=150+i%3*55;
    kit.rock(terrain,x,y,z,r,420+i%3*75,i+2);kit.grass(greenery,x,y+4,z,r,.6);
    if(i%3===0){kit.tree(greenery,x,y+8,z,.7,i);sign('QUARRY\n'+(i<3?'UPPER CUT':'LOWER BASIN'),x,y+55,z+30,125,48);}
    for(let k=0;k<3;k++)metal.box(x+(k-1)*48,y+25,z,8,55,8,'#bd672e');
   }
   for(let j=0;j<8;j++){const x=400+j*420,y=-2400;far.box(x,y+180,-700,19,560,20,'#87737b');far.rod([x,y+420,-700],[x+330,y+450,-700],8,'#d6a36a');}
  }else if(w.style==='vault'){
   for(const room of w.rooms){
    const x=room.x+room.w/2,y=-(room.y+room.h/2),z=-175;
    far.box(x,y,z,room.w-10,room.h-10,24,'#183746');far.box(x,y,-152,room.w-50,room.h-50,5,'#102737');
    for(let px=room.x+30;px<room.x+room.w;px+=144){far.box(px,y,-132,12,room.h,24,'#35677a');far.box(px,y+room.h/2-18,-112,28,16,12,'#dcbb72');}
    for(let py=room.y+60;py<room.y+room.h;py+=100)far.box(x,-py,-134,room.w-55,3,10,'#234955');
    sign(room.name.toUpperCase(),x,-room.y,-118,Math.min(190,room.w*.6),38);
   }
  }
  for(let y=0;y<course.height;y++)for(let x=0;x<course.width;x++){const id=course.cells[y*course.width+x];if(id!==1&&id!==2&&id!==7)continue;const top=id===7?6:36;metal.box(x*36+18,-y*36-top/2,0,36,top,46,quarry?'#946b45':'#264c60');metal.box(x*36+18,-y*36+1,0,36,3,48,quarry?'#ffd494':'#53cacc');if(id!==7&&(x+y)%4===0)metal.box(x*36+18,-y*36-17,25,25,19,2,quarry?'#b18457':'#345f73');}
 }
};
(function(){function boot(){
 const previous=SkyVisual.build;
 SkyVisual.build=function(m){const root=previous(m);const w=WorkshopMission.data;if(!WorkshopMission.on()||!w)return root;
  const T=m.THREE,kit=CloudAssets.create(T),keys=[],doors=[],sentries=[];
  for(const item of w.keys){const g=new T.Group();g.position.set(item.x,-item.y,30);root.add(g);const b=new kit.Batch();b.ell(0,0,0,10,10,3,'#82f0d1');b.ell(0,0,4,5,5,1,'#16374a');b.box(12,0,0,19,4,4,'#f9d588');b.box(17,-5,0,4,8,4,'#f9d588');b.finish(m,g,{unlit:true});keys.push({mesh:g,id:item.id});}
  for(const item of w.doors){const g=new T.Group();g.position.set(item.x+item.w/2,-item.y-item.h/2,12);root.add(g);const b=new kit.Batch();b.box(0,0,0,item.w,item.h,48,'#253750');for(let y=-item.h/2+10;y<item.h/2;y+=23)b.box(0,y,28,item.w-8,5,3,'#ee896b');b.finish(m,g,{roughness:.5});doors.push({mesh:g,key:item.key});}
  for(const item of w.sentries){const g=new T.Group();g.position.set(item.x,-item.y,20);root.add(g);const b=new kit.Batch();b.ell(0,0,0,16,13,12,'#71839a');b.box(0,1,12,23,6,3,'#ec8269');b.ell(-19,0,0,6,3,10,'#304957');b.ell(19,0,0,6,3,10,'#304957');b.finish(m,g,{roughness:.3,metalness:.25});sentries.push({mesh:g,id:item.id});}
  WorkshopMission.setGraphics({keys,doors,sentries});
  const sky=root.children.find(o=>o.renderOrder===-100&&o.material?.map?.image?.getContext);if(sky){const c=sky.material.map.image,g=c.getContext('2d'),a=g.createLinearGradient(0,0,0,c.height);a.addColorStop(0,w.style==='vault'?'#0e1e3a':'#3f83b1');a.addColorStop(1,w.style==='vault'?'#365d71':'#f7d4a1');g.fillStyle=a;g.fillRect(0,0,c.width,c.height);sky.material.map.needsUpdate=true;}
  kit.dispose();return root;
 };
 const update=SkyVisual.update;SkyVisual.update=function(){update();if(WorkshopMission.on()){for(const [key,o]of __merged.voxMesh)if([1,2,7,67].includes(Number(String(key).split('#')[0])))o.visible=false;}};
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();
