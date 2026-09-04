// Original stylized models, not scientifically validated anatomy or fossil scans.
export function makeDinosaur(T,d){
  const root=new T.Group(),body=new T.Group();root.add(body);const legs=[];
  const skin=new T.MeshStandardMaterial({color:d.color,roughness:.85,flatShading:true}),dark=new T.MeshStandardMaterial({color:new T.Color(d.color).multiplyScalar(.7),roughness:.9,flatShading:true}),horn=new T.MeshStandardMaterial({color:'#ead8ae',roughness:.8}),eye=new T.MeshStandardMaterial({color:'#15342f'});
  function ell(pos,size,mat=skin){const m=new T.Mesh(new T.SphereGeometry(1,12,8),mat);m.position.set(...pos);m.scale.set(...size);m.castShadow=true;m.receiveShadow=true;body.add(m);return m;}
  function tube(a,b,ra,rb,mat=skin){const av=new T.Vector3(...a),bv=new T.Vector3(...b),vec=bv.clone().sub(av),m=new T.Mesh(new T.CylinderGeometry(rb,ra,vec.length(),9),mat);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vec.normalize());m.castShadow=true;body.add(m);return m;}
  function leg(x,z,h=1.4){const pivot=new T.Group();pivot.position.set(x,h,z);const shin=new T.Mesh(new T.CapsuleGeometry(.19,.85,3,7),dark);shin.position.y=-.54;pivot.add(shin);const foot=new T.Mesh(new T.SphereGeometry(1,9,6),skin);foot.scale.set(.32,.15,.26);foot.position.set(.12,-h+.18,0);pivot.add(foot);body.add(pivot);legs.push(pivot);}
  const four=['longneck','horns','plates'].includes(d.type);
  ell([0,1.65,0],[1.7,.8,.72]);ell([.2,1.39,0],[1.2,.5,.65],dark);
  if(four){for(const x of[-.95,.92])for(const z of[-.53,.53])leg(x,z);}
  else{leg(-.45,-.43);leg(-.45,.43);ell([-.47,1.06,-.46],[.43,.72,.33],dark);ell([-.47,1.06,.46],[.43,.72,.33],dark);}
  tube([-1.3,1.75,0],[-2.9,1.65,0],.43,.18);tube([-2.9,1.65,0],[-4.2,2.05,0],.18,.015);
  let head=[2.2,2.5,0],hs=[.8,.45,.4];
  if(d.type==='longneck'){
    tube([1.1,1.95,0],[2.8,2.55,0],.48,.32);tube([2.8,2.55,0],[4.1,3.5,0],.32,.21);tube([4.1,3.5,0],[5.3,3.66,0],.21,.12);head=[5.6,3.66,0];hs=[.4,.23,.21];tube([-4.1,2.03,0],[-5.5,2.3,0],.025,.001);
  }else if(d.type==='horns'){
    ell([1.48,2.06,0],[.24,1.05,.9],dark);ell([1.65,2.06,0],[.21,.84,.74]);head=[2.2,1.55,0];hs=[.8,.5,.53];
    for(const z of[-.4,.4])tube([2.1,2.02,z],[3.05,3.05,z*1.2],.17,0,horn);tube([2.85,1.73,0],[3.25,2.35,0],.14,0,horn);
  }else if(d.type==='plates'){
    tube([1.1,1.6,0],[2.2,1.05,0],.38,.18);head=[2.5,1.1,0];hs=[.45,.27,.25];
    for(let i=0;i<9;i++){const x=-1.7+i*.43,h=.42+Math.sin(i/9*Math.PI)*.76,m=new T.Mesh(new T.ConeGeometry(.35,h,4),i%2?dark:horn);m.position.set(x,2.3+h/2-Math.abs(x)*.15,i%2?.22:-.22);m.rotation.y=Math.PI/4;m.scale.z=.4;m.castShadow=true;body.add(m);}
    for(const x of[-3,-3.45])for(const z of[-1,1])tube([x,1.75,0],[x-.2,2.45,z*.65],.11,0,horn);
  }else{
    const small=d.type!=='rex';tube([.9,1.95,0],[1.7,2.55,0],small?.28:.5,small?.2:.38);
    if(small){tube([1.7,2.55,0],[2.35,3.1,0],.2,.13);head=[2.68,3.14,0];hs=[.5,.24,.23];}
    for(const z of[-.43,.43]){tube([1.05,1.92,z],[1.3,small?1.03:1.49,z*1.25],.1,.065);tube([1.3,small?1.03:1.49,z*1.25],[1.66,small?1.04:1.53,z*1.35],.065,.04,horn);}
  }
  ell(head,hs);for(const sign of[-1,1])ell([head[0]+hs[0]*.2,head[1]+hs[1]*.3,sign*hs[2]*.94],[.055,.06,.025],eye);
  root.userData={legs,body,id:d.id};return root;
}
export function makeExplorer(T){
  const root=new T.Group(),mat=c=>new T.MeshStandardMaterial({color:c,roughness:.85});
  const green=mat('#365d4c'),cream=mat('#f1d3a6'),orange=mat('#da914f'),brown=mat('#584e40');
  function mesh(geom,material,x,y,z){const m=new T.Mesh(geom,material);m.position.set(x,y,z);m.castShadow=true;root.add(m);return m;}
  mesh(new T.CapsuleGeometry(.3,.47,4,10),green,0,.85,0);mesh(new T.SphereGeometry(.25,12,8),cream,0,1.5,0);mesh(new T.CylinderGeometry(.37,.39,.09,12),orange,0,1.68,0);mesh(new T.CylinderGeometry(.24,.28,.21,12),orange,0,1.79,0);mesh(new T.BoxGeometry(.47,.48,.19),brown,0,.92,.31);
  const legs=[mesh(new T.CapsuleGeometry(.095,.37,3,8),brown,-.14,.33,0),mesh(new T.CapsuleGeometry(.095,.37,3,8),brown,.14,.33,0)];
  mesh(new T.CapsuleGeometry(.08,.34,3,8),cream,-.37,.93,0);mesh(new T.CapsuleGeometry(.08,.34,3,8),cream,.37,.93,0);root.userData.legs=legs;return root;
}
