/* Collision-backed streets and different grounded neighborhoods. The decorative
 * canal and planting are behind the road, never invisible gameplay hazards. */
globalThis.GroundArt={
 populate({course,m,root,kit,metal,terrain,greenery,far,sign}){
  const style=course.gp.style,gy=-course.ground*36,length=course.width*36;
  // The continuous lower route uses exactly the level's top solid row.
  metal.box(length/2,gy-18,0,length,36,82,'#3e6176');
  metal.box(length/2,gy-2,0,length,4,86,style==='village'?'#c9b992':style==='canal'?'#becfcd':'#c0bd96');
  terrain.box(length/2,gy-180,-80,length+280,340,230,style==='garden'?'#4a7649':'#6b7765');
  greenery.box(length/2,gy-3,-92,length+240,7,80,'#77aa43');
  metal.box(length/2,gy-10,43,length,11,4,'#d9ca98');
  for(let x=36;x<length;x+=72)metal.box(x,gy+1,11,22,1,3,'#e6debb');
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
   kit.tree(greenery,x+80,gy+5,z,.8+(i%3)*.18,i);
   if(style==='village'&&i%2===0)house(x-48,-220,.8);
   if(style==='canal'){
    far.box(x,gy-3,-330,240,9,250,'#64b8d3');
    far.box(x,gy+7,-180,200,10,14,'#d1c9a7');
    for(let k=0;k<3;k++)far.box(x-65+k*65,gy+25,-180,5,36,6,'#557a7e');
    if(i%4===0){far.box(x,gy+65,-450,130,132,85,'#efce96');far.cone(x,gy+153,-450,110,54,'#688895',0,4);}
   }else if(style==='garden'){
    for(let k=0;k<3;k++)kit.flowers(greenery,x-50+k*32,gy+5,-90,.9);
    if(i%3===0){far.box(x,gy+104,-240,110,13,65,'#9b8560');for(const d of[-48,48])far.box(x+d,gy+51,-240,9,101,60,'#cfb897');for(let j=0;j<5;j++)far.ell(x-45+j*22,gy+122,-235,20,12,25,'#49793b');}
   }else kit.flowers(greenery,x,gy+5,-75,.7);
  }
  sign(course.name.toUpperCase(),180,gy+170,-130,240,57);
  for(const [x,caption] of [[510,'GOLD RAMP: OPTIONAL\nSTREET: KEEP RIDING'],[1250,'BOTH ROUTES REJOIN\nNO NEED TO RUSH']]){
   if(x>length-400)continue;metal.rod([x,gy,-68],[x,gy+100,-68],2.8,'#697f78');sign(caption,x,gy+102,-64,185,52);
  }
  if(style==='garden')sign('Z: TRY THE WHIP\nROAD REMAINS OPEN',1620,gy+370,-50,215,64);
 }
};
