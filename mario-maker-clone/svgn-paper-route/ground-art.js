/* Collision-backed streets. Decorative water and plants stay behind the road. */
globalThis.GroundArt={
 populate({course,m,root,kit,metal,terrain,greenery,far,sign}){
  const style=course.gp.style,gy=-course.ground*36,length=course.width*36;
  for(let ty=0;ty<course.height;ty++){
   let tx=0;
   while(tx<course.width){
    if(course.cells[ty*course.width+tx]!==1){tx++;continue;}
    const a=tx;while(tx<course.width&&course.cells[ty*course.width+tx]===1)tx++;
    // The structural bed is below the wearing surface, never coplanar with it.
    metal.box((a+tx)*18,-ty*36-19.5,0,(tx-a)*36,36,82,'#3e6176');
   }
   for(let x=0;x<course.width;x++)if(course.cells[ty*course.width+x]===1&&(ty===0||course.cells[(ty-1)*course.width+x]!==1)){
    metal.box(x*36+18,-ty*36-1,0,36,2,86,style==='village'?'#c9b992':style==='canal'?'#becfcd':'#c0bd96');
    metal.box(x*36+18,-ty*36-10,43,36,11,4,'#d9ca98');
    if(x%2)metal.box(x*36+18,-ty*36+1,11,22,1,3,'#e6debb');
   }
  }
  terrain.box(length/2,gy-180,-230,length+280,340,210,style==='garden'?'#4a7649':'#6b7765');
  greenery.box(length/2,gy-3,-150,length+240,7,72,'#77aa43');
  function house(x,z,s=1){
   const b=far;const cols=['#f1d6ae','#b7d8d7','#edb799'];
   b.box(x,gy+44*s,z,105*s,88*s,80*s,cols[Math.floor(x/200)%3]);
   b.cone(x,gy+106*s,z,88*s,49*s,'#ba6452',0,4);
   b.box(x,gy+30*s,z+41*s,22*s,60*s,3*s,'#376680');
   for(const dx of[-33,33]){b.box(x+dx*s,gy+48*s,z+41*s,21*s,29*s,2*s,'#fbefc6');b.box(x+dx*s,gy+48*s,z+43*s,14*s,22*s,2*s,'#478ca8');}
   b.box(x-32*s,gy+123*s,z-13*s,13*s,46*s,16*s,'#876959');
  }
  for(let i=0;i<Math.ceil(length/230);i++){
   const x=110+i*230,z=-130-(i%3)*52;
   const region=[...(course.gp.sections||[])].reverse().find(s=>x>=s.x*36);
   const local=region?.scene||style;
   kit.tree(greenery,x+80,gy+5,z,.8+(i%3)*.18,i);
   if((local==='village'||local==='festival')&&i%2===0)house(x-48,-220,.8);
   if(local==='canal'){
    far.box(x,gy-3,-330,240,9,250,'#64b8d3');far.box(x,gy+7,-180,200,10,14,'#d1c9a7');
    for(let k=0;k<3;k++)far.box(x-65+k*65,gy+25,-180,5,36,6,'#557a7e');
    if(i%4===0){far.box(x,gy+65,-450,130,132,85,'#efce96');far.cone(x,gy+153,-450,110,54,'#688895',0,4);}
   }else if(local==='garden'||local==='park'){
    for(let k=0;k<3;k++)kit.flowers(greenery,x-50+k*32,gy+5,-90,.9);
    if(i%3===0){far.box(x,gy+104,-240,110,13,65,'#9b8560');for(const d of[-48,48])far.box(x+d,gy+51,-240,9,101,60,'#cfb897');for(let j=0;j<5;j++)far.ell(x-45+j*22,gy+122,-235,20,12,25,'#49793b');}
   }else if(local==='market'){
    far.box(x,gy+32,-135,90,60,50,'#dcb376');far.cone(x,gy+72,-135,72,32,'#bd644d',0,4);
    for(let k=0;k<5;k++)far.box(x-40+k*20,gy+51,-105,18,7,52,k%2?'#f1d49a':'#508f9e');
    for(const dx of[-31,0,31])far.ell(x+dx,gy+40,-103,9,9,8,'#7eab49');
   }else kit.flowers(greenery,x,gy+5,-75,.7);
   if(local==='festival'||local==='park')for(let j=0;j<6;j++){const xx=x-90+j*35;far.tri([xx,gy+147,-95],[xx+20,gy+143,-95],[xx+8,gy+123,-95],j%2?'#e39b62':'#66adbc');}

  }
  if(course.goal){
   const x=course.goal.x*36+18,y=-course.goal.y*36;
   for(const dx of[-60,60])metal.rod([x+dx,y,-38],[x+dx,y+150,-38],3,'#526e7d');
   const label=sign('SVGN.io DEPOT\nFINISH YOUR ROUTE',x,y+126,-28,166,61,true);
   if(label){label.name='Ground route depot';label.userData.groundDepot=true;}
   for(let i=0;i<6;i++)for(let j=0;j<3;j++)metal.box(x+(i-2.5)*9,y+.6,(j-1)*21,9,.6,21,(i+j)%2?'#e8dab7':'#294c66');
  }
  for(const area of course.gp.sections||[]){if(area.x>0)sign(area.name.toUpperCase(),area.x*36+70,gy+170,-170,220,40);}
  sign(String(course.name||'Your route').toUpperCase(),180,gy+170,-130,240,57);
  for(const [x,caption] of [[510,'GOLD RAMP: OPTIONAL\nSTREET: KEEP RIDING'],[1250,'BOTH ROUTES REJOIN\nNO NEED TO RUSH']]){
   if(x>length-400)continue;metal.rod([x,gy,-68],[x,gy+100,-68],2.8,'#697f78');sign(caption,x,gy+102,-64,185,52);
  }
  if(style==='garden')sign('Z: TRY THE WHIP\nROAD REMAINS OPEN',1620,gy+370,-50,215,64);
 }
};
