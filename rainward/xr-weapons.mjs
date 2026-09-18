import * as T from './vendor/three.module.js';
/* Original mechanical silhouettes. Existing CC0 assets/credits are retained,
 * but the ambiguous blaster meshes no longer replace the readable weapon.
 * The mount's -Z is the pointing ray; neither recoil nor reload rotates it. */
export function buildXRWeapon(kind){
 const root=new T.Group(),steel=new T.MeshStandardMaterial({color:0x555f66,metalness:.72,roughness:.38}),dark=new T.MeshStandardMaterial({color:0x242b2c,metalness:.12,roughness:.76}),mark=new T.MeshBasicMaterial({color:0xd6e9c5});
 const box=(name,x,y,z,w,h,d,mat=steel)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.name=name;m.position.set(x,y,z);root.add(m);return m;};
 const barrel=(z,length,radius)=>{const m=new T.Mesh(new T.CylinderGeometry(radius,radius,length,12),steel);m.name='Barrel';m.rotation.x=Math.PI/2;m.position.set(0,.065,z);root.add(m);};
 let muzzle;
 if(kind==='rifle'){
  box('Receiver',0,.045,-.13,.057,.084,.24);box('Fore-end',0,.025,-.335,.064,.068,.19,dark);barrel(-.505,.19,.013);
  box('Shoulder stock',0,.02,.135,.054,.085,.28,dark);box('Butt plate',0,.015,.282,.061,.12,.025,dark);
  const g=box('Pistol grip',0,-.06,-.04,.049,.14,.065,dark);g.rotation.x=.18;
  const mag=box('Magazine',0,-.07,-.18,.036,.15,.065,dark);mag.rotation.x=-.13;
  box('Rear sight',0,.1,-.05,.036,.026,.024,dark);box('Front sight',0,.104,-.435,.018,.032,.018,dark);muzzle=new T.Vector3(0,.065,-.6);
 }else{
  box('Slide',0,.058,-.095,.04,.046,.218);box('Frame',0,.023,-.07,.043,.036,.182,dark);barrel(-.18,.085,.011);
  const g=box('Grip',0,-.051,-.004,.039,.128,.062,dark);g.rotation.x=.2;
  box('Rear sight',0,.09,-.012,.035,.014,.018,dark);box('Front sight',0,.09,-.193,.01,.015,.012,mark);
  for(let z=-.025;z<.03;z+=.012)box('Slide serration',.021,.06,z,.0015,.03,.0035,dark);
  muzzle=new T.Vector3(0,.065,-.223);
 }
 box('Trigger guard front',0,-.036,-.093,.013,.056,.009,dark);box('Trigger guard base',0,-.062,-.06,.016,.009,.066,dark);box('Trigger',0,-.033,-.056,.008,.031,.012,steel);
 const bore=new T.Mesh(new T.CircleGeometry(kind==='rifle'?.010:.008,12),dark);bore.name='Muzzle bore';bore.rotation.y=Math.PI;bore.position.copy(muzzle).add(new T.Vector3(0,0,-.0005));root.add(bore);
 root.name='Rainward '+kind;return {root,muzzle};
}
export function createXRWeapons(){
 const root=new T.Group();root.name='Ray-aligned held firearm';const models=new Map(['pistol','rifle'].map(k=>[k,buildXRWeapon(k)]));for(const m of models.values())root.add(m.root);let equipped='pistol';
 function update(player,{visible=true}={}){equipped=player.equipped||'pistol';root.visible=visible&&models.has(equipped)&&player.waterMode!=='swim';for(const [k,m]of models)m.root.visible=k===equipped;}
 function ray(){root.updateWorldMatrix(true,true);const m=models.get(equipped)||models.get('pistol');return {origin:m.muzzle.clone().applyMatrix4(root.matrixWorld),direction:new T.Vector3(0,0,-1).transformDirection(root.matrixWorld)};}
 return {root,update,ray,stats:()=>({equipped,visible:root.visible,representation:'original-mechanical-mesh',ready:[...models.keys()],axis:'-Z',muzzle:ray().origin.toArray(),direction:ray().direction.toArray(),errors:{}}),dispose(){const geometry=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)materials.add(o.material);});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();}};
}
