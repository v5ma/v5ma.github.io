/* Original tiled bathhouse art using the game's existing Three r177 renderer. */
import {POOLS,VALVE,RAIL,DRAIN_TICKS} from './bathhouse-core.mjs';
let live=null;
export function populate({course,m,root,kit,metal,sign}){
 const T=m.THREE,{uniform,positionWorld,vec2,vec3,sin,cos,fract,step,mix,color,normalMap,normalView,positionViewDirection,uv,smoothstep}=T.TSL;
 const gy=-2160,length=course.width*36,clock=uniform(0),waterObjects=[],portals=[];
 const stats={waterDraws:0,tileDraws:0,portalDraws:0,pools:POOLS.length,railVisible:false,waterDrop:0};
 const add=(g,mat,name,x,y,z)=>{const o=m.makeSingle(g,mat);o.name=name;o.position.set(x,y,z);o.frustumCulled=true;root.add(o);return o;};
 function tiles(horizontal=false,dark=false){
  const mat=new T.MeshStandardNodeMaterial({roughness:.29,metalness:.06,side:T.DoubleSide});mat.name='Tideglass glazed ceramic';
  const p=vec2(positionWorld.x,horizontal?positionWorld.z:positionWorld.y).div(30),f=fract(p);
  const seam=step(.956,f.x).max(step(.956,f.y));
  const glint=sin(positionWorld.x.mul(.061).add(clock.mul(.4))).mul(sin((horizontal?positionWorld.z:positionWorld.y).mul(.073).sub(clock.mul(.31)))).abs().pow(12);
  const base=mix(color(dark?'#245b62':'#a6bab4'),color(dark?'#376f70':'#d3d4c0'),sin(positionWorld.x.mul(.006)).mul(.12).add(.45));
  mat.colorNode=mix(base,color(dark?'#15363e':'#687e7e'),seam);mat.emissiveNode=color('#b8fbe2').mul(glint.mul(dark?.22:.065));
  return mat;
 }
 const wall=tiles(false),deep=tiles(false,true),floor=tiles(true),basin=tiles(true,true);
 function plane(w,h,mat,name,x,y,z,rx=0){const o=add(new T.PlaneGeometry(w,h),mat,name,x,y,z);o.rotation.x=rx;o.onAfterRender=()=>stats.tileDraws++;return o;}
 plane(length+1600,950,wall,'Bathhouse tiled rear wall',length/2,gy+270,-600);
 plane(length+1600,210,deep,'Teal ceramic dado',length/2,gy+70,-595);
 plane(length+500,175,floor,'Wet tiled promenade',length/2,gy-2,8,-Math.PI/2);
 plane(length+500,70,floor,'Rear pool coping',length/2,gy-2,-586,-Math.PI/2);
 let end=0;for(const p of POOLS){const start=p.x-p.width/2;if(start>end)plane(start-end,460,floor,'Pool crosswalk',(start+end)/2,gy-2,-330,-Math.PI/2);end=p.x+p.width/2;}if(end<length)plane(length-end,460,floor,'Exit pool crosswalk',(length+end)/2,gy-2,-330,-Math.PI/2);
 // The nearest visible 88-unit strip is the actual continuous collision road.
 for(let x=0;x<length;x+=180){metal.box(x+90,gy-17,0,180,34,88,'#73989a');metal.box(x+90,gy+1,37,180,3,5,'#e5d6af');}
 const waterMat=new T.MeshPhysicalNodeMaterial({name:'Tideglass pool water',transparent:true,opacity:.54,depthWrite:false,side:T.DoubleSide,roughness:.12,metalness:.12,clearcoat:1,clearcoatRoughness:.07});
 const wx=positionWorld.x.mul(.026).add(clock.mul(.7)),wz=positionWorld.z.mul(.044).sub(clock.mul(.53));
 const w=sin(wx.add(sin(wz))).mul(cos(wz.add(sin(wx.mul(.63))))),fresnel=normalView.dot(positionViewDirection).abs().oneMinus().pow(2);
 waterMat.colorNode=mix(color('#176171'),color('#8dd4c4'),w.mul(.18).add(.46)).add(color('#e3fff1').mul(w.abs().pow(10).mul(.17)));
 waterMat.normalNode=normalMap(vec3(sin(wx).mul(.10).add(.5),cos(wz).mul(.10).add(.5),1));
 waterMat.opacityNode=fresnel.mul(.2).add(.38);waterMat.emissiveNode=color('#62bfae').mul(w.abs().pow(8).mul(.12));
 for(const p of POOLS){
  plane(p.width,430,basin,'Pool mosaic floor',p.x,gy-155,-330,-Math.PI/2);
  plane(p.width,180,deep,'Pool submerged wall',p.x,gy-70,-550);
  for(const x of [p.x-p.width/2,p.x+p.width/2]){const o=plane(430,170,deep,'Pool end wall',x,gy-70,-335);o.rotation.y=Math.PI/2;metal.box(x,gy+12,-332,24,25,460,'#d3ccb6');}
  const water=plane(p.width-16,412,waterMat,'Tideglass refractive-style water',p.x,gy+(p.sluice?94:-8),-332,-Math.PI/2);water.renderOrder=12;water.onAfterRender=()=>stats.waterDraws++;waterObjects.push({mesh:water,sluice:p.sluice});
  // Chrome ladders, below-water rungs and broad stone pool lips.
  const lx=p.x-p.width*.35;
  for(const dx of[-22,22]){metal.rod([lx+dx,gy-120,-125],[lx+dx,gy+58,-125],3.2,'#cedbd5');metal.rod([lx+dx,gy+58,-125],[lx+dx,gy+58,-66],3.2,'#cedbd5');metal.rod([lx+dx,gy+58,-66],[lx+dx,gy+5,-66],3.2,'#cedbd5');}
  for(let i=0;i<5;i++)metal.rod([lx-22,gy-98+i*30,-125],[lx+22,gy-98+i*30,-125],2.6,'#c5d7cd');
  metal.box(p.x,gy+9,-99,p.width,17,24,'#ddd8c2');metal.box(p.x,gy+9,-562,p.width,17,24,'#ddd8c2');
 }
 // Repeating architectural bays: tile piers, vaulted ribs and warm ceiling panels.
 for(let x=260,i=0;x<length+600;x+=640,i++){
  metal.box(x,gy+250,-571,34,500,62,'#879b96');metal.box(x,gy+445,-245,35,27,715,'#acbdb2');
  metal.box(x+300,gy+403,-430,170,10,86,'#e9dfae');
  const lamp=new T.MeshBasicNodeMaterial({color:'#fff0bb',toneMapped:false});plane(180,38,lamp,'Bathhouse ceiling lamp',x+280,gy+375,-563);
  for(let j=0;j<18;j++){const a=j*Math.PI/18,b=(j+1)*Math.PI/18,r=278;metal.rod([x+320+Math.cos(a)*r,gy+162+Math.sin(a)*r,-573],[x+320+Math.cos(b)*r,gy+162+Math.sin(b)*r,-573],6,'#d2ceba');}
  if(i%2===0){metal.box(x+260,gy+27,-73,135,10,28,'#8c7251');for(const dx of[-51,51])metal.box(x+260+dx,gy+11,-73,9,23,22,'#b6bdb0');}
 }
 function portal(x,name){
  const mat=new T.MeshBasicNodeMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false});
  const v=uv().sub(.5),r=v.length(),rim=smoothstep(.30,.46,r).mul(smoothstep(.46,.50,r).oneMinus()),swirl=sin(r.mul(75).sub(clock.mul(2))).mul(.5).add(.5);
  mat.colorNode=mix(color('#43c6be'),color('#e1fff0'),swirl);mat.opacityNode=rim.mul(.86).add(smoothstep(.39,.44,r).oneMinus().mul(.14));
  const o=plane(150,224,mat,'Tideglass '+name+' portal',x,gy+111,-42);o.renderOrder=30;o.onAfterRender=()=>stats.portalDraws++;portals.push(o);
  metal.box(x,gy+6,-41,175,12,52,'#2d727b');const label=sign(name.toUpperCase()+' PORTAL',x,gy+259,-72,215,38);label.name='Bathhouse portal label';
 }
 portal(220,'arrival');portal((course.width-5)*36+12,'return');
 const gate=new T.Group();gate.name='Mirror Pool lifting sluice';gate.position.set(VALVE+110,gy+85,-310);root.add(gate);
 const gateB=new kit.Batch();gateB.box(0,0,0,95,166,18,'#406d73');for(let i=-3;i<=3;i++)gateB.box(i*12,0,14,4,152,6,'#c4a973');gateB.finish(m,gate,{roughness:.35,metalness:.4});
 metal.box(VALVE,gy+43,-36,46,86,40,'#235561');metal.torus(VALVE,gy+90,-11,24,'#d8b979');metal.rod([VALVE,gy+69,-7],[VALVE,gy+111,-7],2,'#a78651');
 sign('SLUICE / E OR D-PAD DOWN',VALVE,gy+180,-70,270,43);
 sign('MIRROR POOL\nLOWER WATER TO REVEAL THE RAIL',2590,gy+307,-530,430,73);
 sign('TIDEGLASS BATHS\nDRY PROMENADE / FOLLOW THE LIGHT',730,gy+319,-531,460,80);
 sign('LANTERN BATHS\nTHE RETURN PORTAL IS AHEAD',4450,gy+310,-530,420,76);
 for(const [x,text] of [[2130,'AFTER DRAINING: JUMP'],[2880,'SAFE ROAD RETURN']])sign(text,x,gy+190,-70,280,40);
 // Render the same authored optional rail even while locked; only its visibility changes.
 const railGroup=new T.Group();railGroup.name='Revealed waterline deck';root.add(railGroup);const b=new kit.Batch(),p=course.ct.find(p=>p.sky?.id===RAIL)||[];
 for(let i=1;i<p.length;i++){const a=p[i-1],q=p[i],dx=q[0]-a[0],dy=-(q[1]-a[1]),len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);b.box((a[0]+q[0])/2,-(a[1]+q[1])/2-16,0,len+1,32,64,'#2c6a70',ang);b.box((a[0]+q[0])/2,-(a[1]+q[1])/2,28,len+1,4,6,'#acf4cc',ang);}b.finish(m,railGroup,{roughness:.28,metalness:.35});railGroup.visible=false;
 for(let i=0;i<4;i++){const x=2130+i*25;metal.tri([x,gy+2,-13],[x+15,gy+2,0],[x,gy+2,13],'#b1e2cd');}
 live={root,clock,waterObjects,gate,railGroup,stats};root.userData.bathhouse=stats;
}
export function update(state,steps,motion=true){
 if(!live||!live.root.parent)return;
 live.clock.value=motion?steps/60:0;const f=Math.min(1,(state?.drain||0)/DRAIN_TICKS);
 for(const w of live.waterObjects)if(w.sluice)w.mesh.position.y=-2160+94-f*128;
 live.gate.position.y=-2160+85+f*174;live.railGroup.visible=f===1;live.stats.railVisible=live.railGroup.visible;live.stats.waterDrop=f*128;
}
export function stats(){return live?{...live.stats}:null;}
export function draw2D(g,cx,cy,w,h,state,steps){
 const x0=Math.floor(cx/30)*30,y0=Math.floor(cy/30)*30;g.fillStyle='#224953';g.fillRect(cx,cy,w,h);g.strokeStyle='#54797655';g.lineWidth=1;
 g.beginPath();for(let x=x0;x<cx+w;x+=30){g.moveTo(x,cy);g.lineTo(x,cy+h);}for(let y=y0;y<cy+h;y+=30){g.moveTo(cx,y);g.lineTo(cx+w,y);}g.stroke();
 for(const p of POOLS){if(p.x+p.width/2<cx||p.x-p.width/2>cx+w)continue;const top=2010+(p.sluice?(state?.drain||0)/DRAIN_TICKS*105:80);g.fillStyle='#488e9080';g.fillRect(p.x-p.width/2,top,p.width,2160-top);g.strokeStyle='#b7efcd99';g.beginPath();for(let x=p.x-p.width/2;x<p.x+p.width/2;x+=7){const y=top+Math.sin(x*.06+steps/80)*2;x===p.x-p.width/2?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();g.strokeStyle='#c2d6c7';g.lineWidth=3;const x=p.x-p.width*.35;g.strokeRect(x-18,2065,36,85);for(let y=2080;y<2150;y+=16){g.beginPath();g.moveTo(x-18,y);g.lineTo(x+18,y);g.stroke();}}
 for(let x=Math.floor(cx/640)*640+260;x<cx+w+640;x+=640){g.strokeStyle='#9fb4a0';g.lineWidth=8;g.beginPath();g.arc(x+320,2010,277,Math.PI,Math.PI*2);g.stroke();g.fillStyle='#fff1bb';g.fillRect(x+255,1834,130,11);}
 for(const [x,name]of [[220,'ARRIVAL'],[5868,'RETURN']]){g.strokeStyle='#9af4d9';g.lineWidth=5;g.beginPath();g.ellipse(x,2052,64,103,0,0,Math.PI*2);g.stroke();g.fillStyle='#d6efd9';g.font='bold 13px system-ui';g.textAlign='center';g.fillText(name+' PORTAL',x,1928);}
 g.fillStyle=state?.opened?'#93dfbd':'#dbbc77';g.fillRect(VALVE-22,2074,44,86);g.strokeStyle='#f2d6a1';g.lineWidth=4;g.beginPath();g.arc(VALVE,2076,24,0,Math.PI*2);g.stroke();g.fillStyle='#e9eed8';g.font='bold 12px system-ui';g.textAlign='center';g.fillText('SLUICE / E OR D-PAD DOWN',VALVE,2010);
}
