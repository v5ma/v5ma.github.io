/* Original art-only equipment. No weapon statistics, input or hitbox changes. */
import * as T from './vendor/three.module.js';
export function dressWeapon(group,id){
 group.name='Detailed first-person '+id;
 // Original meshes share resources with world objects. Detach, never dispose
 // another owner's shared materials/geometry.
 group.clear();group.scale.setScalar(.92);
 const silver=new T.MeshPhysicalMaterial({color:'#c2d2dc',metalness:.98,roughness:.17,clearcoat:.55,clearcoatRoughness:.12,envMapIntensity:1.5});
 const brass=new T.MeshPhysicalMaterial({color:'#c5a269',metalness:.91,roughness:.23,clearcoat:.7,clearcoatRoughness:.14,envMapIntensity:1.5});
 const metal=new T.MeshPhysicalMaterial({color:'#29434c',metalness:.83,roughness:.29,clearcoat:.65,clearcoatRoughness:.13,envMapIntensity:1.4});
 const grip=new T.MeshStandardMaterial({color:'#182a32',roughness:.82,metalness:.08});
 const energy=new T.MeshStandardMaterial({color:id==='sniper'?'#cebaff':'#8fe3d3',emissive:id==='sniper'?'#7364ae':'#409a9b',emissiveIntensity:.85,roughness:.12,metalness:.35});
 const lens=new T.MeshPhysicalMaterial({color:'#8bdfe3',transparent:true,opacity:.48,roughness:.065,metalness:.1,depthWrite:false,clearcoat:1,iridescence:.35,envMapIntensity:1.5});
 const part=(geometry,material,x,y,z,sx=1,sy=1,sz=1)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);group.add(m);return m;};
 const ringGeo=new T.TorusGeometry(1,.1,8,32);
 const ring=(x,y,z,r,mat=brass)=>part(ringGeo,mat,x,y,z,r,r,r);
 const barrel=(x,y,z,r,length,mat)=>{const m=part(new T.CylinderGeometry(r,r,length,24),mat,x,y,z);m.rotation.x=Math.PI/2;return m;};
 const shell=(x,y,z,w,h,d,mat)=>{
  const shape=new T.Shape(),r=.10;shape.moveTo(-.5+r,-.5);shape.lineTo(.5-r,-.5);shape.quadraticCurveTo(.5,-.5,.5,-.5+r);shape.lineTo(.5,.5-r);shape.quadraticCurveTo(.5,.5,.5-r,.5);shape.lineTo(-.5+r,.5);shape.quadraticCurveTo(-.5,.5,-.5,.5-r);shape.lineTo(-.5,-.5+r);shape.quadraticCurveTo(-.5,-.5,-.5+r,-.5);const geo=new T.ExtrudeGeometry(shape,{depth:.94,steps:1,bevelEnabled:true,bevelSize:.02,bevelThickness:.03,bevelSegments:2,curveSegments:3});geo.translate(0,0,-.47);return part(geo,mat,x,y,z,w,h,d);
 };
 // Sculpted grip, trigger loop and plated back of a glove.
 const handle=shell(.35,-.43,-.61,.13,.25,.14,grip);handle.rotation.x=-.25;
 for(let i=0;i<5;i++)shell(.35,-.49+i*.035,-.59,.145,.013,.14,metal);
 const trigger=ring(.35,-.365,-.77,.063,metal);trigger.scale.y*=1.3;trigger.rotation.y=Math.PI/2;
 shell(.35,-.3,-.85,.19,.17,.46,metal);shell(.35,-.202,-.85,.165,.025,.39,brass);
 // Named bright fasteners are instanced rather than separate tiny draw calls.
 const screws=new T.InstancedMesh(new T.SphereGeometry(.012,8,6),silver,10),m=new T.Matrix4();for(let i=0;i<10;i++){m.makeTranslation(.35+(i%2?-.099:.099),-.28,-.67-Math.floor(i/2)*.08);screws.setMatrixAt(i,m);}group.add(screws);
 if(id==='arc'){
  for(const profile of [[[.055,-.29],[.075,-.25],[.075,-.20]],[[.08,.12],[.075,.23],[.052,.27]]]){const body=part(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),32),brass,.35,-.245,-1.08);body.rotation.x=Math.PI/2;}
  barrel(.35,-.245,-1.15,.07,.28,lens);barrel(.35,-.245,-1.15,.028,.25,energy);
  for(let i=0;i<7;i++)ring(.35,-.245,-.96-i*.042,.099,i%2?metal:silver);
  barrel(.35,-.245,-1.385,.041,.14,metal);ring(.35,-.245,-1.458,.044,silver);
  // Two elegant charging rails flank the energy chamber.
  for(const x of [.25,.45])barrel(x,-.242,-1.135,.011,.34,silver);
  shell(.35,-.14,-.91,.045,.07,.045,metal);part(new T.SphereGeometry(.014,10,8),energy,.35,-.112,-.91);
 }else if(id==='sniper'){
  shell(.35,-.29,-1.1,.145,.16,.62,metal);barrel(.35,-.24,-1.65,.032,.66,silver);barrel(.35,-.24,-1.935,.052,.15,metal);for(let i=0;i<4;i++)ring(.35,-.24,-1.89-i*.018,.054,brass);
  barrel(.35,-.095,-.93,.081,.44,metal);ring(.35,-.095,-.695,.087,brass);barrel(.35,-.095,-.71,.07,.018,lens);barrel(.35,-.095,-1.162,.065,.014,lens);for(const z of[-.81,-1.07])ring(.35,-.095,z,.087,silver);
  shell(.35,-.41,-.96,.12,.25,.16,brass);shell(.35,-.21,-1.22,.18,.018,.3,silver);
 }else if(id==='carbine'){
  shell(.35,-.27,-1.06,.185,.21,.52,metal);shell(.35,-.46,-.94,.125,.29,.17,brass);barrel(.35,-.245,-1.5,.035,.42,silver);ring(.35,-.245,-1.72,.044,metal);
  for(let i=0;i<7;i++)shell(.35,-.145,-.93-i*.047,.21,.012,.021,brass);
  for(let i=0;i<5;i++)shell(.447,-.264,-.94-i*.06,.011,.07,.029,grip);
  ring(.35,-.075,-1.08,.047,silver);part(new T.SphereGeometry(.009,8,6),energy,.35,-.067,-1.08);
 }else{
  for(const x of [.284,.416]){barrel(x,-.25,-1.27,.051,.74,metal);ring(x,-.25,-1.645,.056,silver);barrel(x,-.25,-1.64,.043,.012,grip);}
  shell(.35,-.37,-1.21,.23,.115,.28,brass);for(let i=0;i<6;i++)shell(.35,-.426,-1.11-i*.031,.235,.008,.013,metal);shell(.35,-.21,-.93,.21,.016,.21,silver);
 }
 return group;
}

/* Separate art for the existing left-hand rail-clamp group. Its caller keeps
 * the same attach animation, pose, collision and input behavior. */
export function dressClamp(group){
 group.clear();group.name='Articulated sky clamp';
 const gold=new T.MeshPhysicalMaterial({color:'#c9a66b',metalness:.93,roughness:.22,clearcoat:.5,envMapIntensity:1.5});
 const silver=new T.MeshPhysicalMaterial({color:'#b7cbd2',metalness:.97,roughness:.17,clearcoat:.6,envMapIntensity:1.5});
 const black=new T.MeshStandardMaterial({color:'#233945',metalness:.3,roughness:.58});
 const glass=new T.MeshPhysicalMaterial({color:'#b9f4ed',transparent:true,opacity:.48,roughness:.1,metalness:.15,depthWrite:false,clearcoat:1,envMapIntensity:1.6});
 const add=(geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);group.add(m);return m;};
 const cylinder=(x,y,z,r,length,mat)=>{const m=add(new T.CylinderGeometry(r,r,length,20),mat,x,y,z);m.rotation.x=Math.PI/2;return m;};
 cylinder(-.38,-.36,-.68,.084,.21,black);cylinder(-.38,-.32,-.87,.057,.24,gold);
 for(let i=0;i<5;i++)add(new T.TorusGeometry(.086,.009,6,24),i%2?gold:silver,-.38,-.36,-.60-i*.038);
 cylinder(-.38,-.24,-.98,.047,.13,silver);
 // Two opposing open jaws and distinct end caps, not a circle on a box.
 for(const side of [-1,1]){const curve=[];for(let i=0;i<=16;i++){const a=(-.25+i/16*Math.PI*.85);curve.push(new T.Vector3(-.38+side*Math.cos(a)*.146,-.155+Math.sin(a)*.15,-1.045));}add(new T.TubeGeometry(new T.CatmullRomCurve3(curve),20,.025,8,false),silver,0,0,0);for(const p of[curve[0],curve.at(-1)])add(new T.SphereGeometry(.033,12,8),gold,p.x,p.y,p.z);}
 cylinder(-.38,-.245,-1.05,.036,.15,glass);const energy=add(new T.IcosahedronGeometry(.027,1),new T.MeshStandardMaterial({color:'#aefff0',emissive:'#3dc1b3',emissiveIntensity:.6,roughness:.16}),-.38,-.23,-1.08);energy.rotation.y=.3;
 for(const side of [-1,1])cylinder(-.38+side*.07,-.29,-.96,.014,.20,gold);
 return group;
}
