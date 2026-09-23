// The rule engine's D is Chancellor, NOT Dragon. Dragon art is gallery-only.
export const ART_TYPES = ['K','Q','R','B','N','P','D','Z','C','A','DRAGON'];
export const ART_NAMES = ['King','Queen','Rook','Bishop','Knight','Pawn','Chancellor','Zebra','Chameleon','Cannon','Dragon (art preview)'];
export const ART_INDEX = Object.freeze(Object.fromEntries(ART_TYPES.map((type,i)=>[type,i])));
export const ATLAS = Object.freeze({url:'./assets/piece-faces.webp',columns:4,rows:8,cell:64,width:256,height:512});
export const HEIGHTS = Object.freeze({K:.092,Q:.087,R:.067,B:.079,N:.073,P:.059,D:.085,Z:.077,C:.07,A:.069,DRAGON:.09});

export function faceUV(type, face) {
  if (!Object.hasOwn(ART_INDEX,type)) throw new Error(`No artwork for ${type}`);
  if (!Number.isInteger(face) || face < 0 || face > 5) throw new Error('Invalid cuboid face.');
  // Three.js BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z.
  // Side faces use the rendered portrait; front/back/top/bottom use the icon.
  const tile = ART_INDEX[type] * 2 + (face < 2 ? 1 : 0);
  const col = tile % ATLAS.columns, row = Math.floor(tile / ATLAS.columns);
  const inset = 2 / ATLAS.cell;
  return {
    u0:(col+inset)/ATLAS.columns,u1:(col+1-inset)/ATLAS.columns,
    v0:1-(row+1-inset)/ATLAS.rows,v1:1-(row+inset)/ATLAS.rows
  };
}

export function createArtFactory(THREE, atlas) {
  const material = new THREE.MeshStandardMaterial({map:atlas,roughness:.86,metalness:.03});
  const teamMaterials = {
    white:new THREE.MeshStandardMaterial({color:0xf9edcc,roughness:.55,metalness:.12}),
    black:new THREE.MeshStandardMaterial({color:0x263c50,roughness:.5,metalness:.25})
  };
  const trim = new THREE.MeshStandardMaterial({color:0xb99751,metalness:.65,roughness:.35});
  const geometries = new Map(), caps = new Map();
  const footGeometry = new THREE.BoxGeometry(.065,.009,.065);
  const rimGeometry = new THREE.BoxGeometry(.06,.003,.06);
  const labels = new Map();
  function geometry(type) {
    if (!geometries.has(type)) {
      const g = new THREE.BoxGeometry(.054,HEIGHTS[type],.054);
      const uv = g.attributes.uv;
      for (let face=0;face<6;face++) {
        const r=faceUV(type,face);
        for (let vertex=0;vertex<4;vertex++) {
          const i=face*4+vertex;
          uv.setXY(i,r.u0+uv.getX(i)*(r.u1-r.u0),r.v0+uv.getY(i)*(r.v1-r.v0));
        }
      }
      g.clearGroups();
      uv.needsUpdate=true;geometries.set(type,g);
    }
    return geometries.get(type);
  }
  function label(type,side) {
    const key=`${type}-${side}`;
    if (!labels.has(key)) {
      const c=document.createElement('canvas');c.width=128;c.height=64;
      const ctx=c.getContext('2d');ctx.fillStyle=side==='white'?'#f9edcc':'#263c50';ctx.fillRect(0,0,128,64);
      ctx.fillStyle=side==='white'?'#182330':'#fff1c9';ctx.font='bold 34px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(type==='D'?'Cn':type==='DRAGON'?'Dr':type,64,33);
      const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
      labels.set(key,new THREE.MeshBasicMaterial({map:texture}));
    }
    return labels.get(key);
  }
  return {
    make(type,side='white') {
      if (!Object.hasOwn(ART_INDEX,type)) throw new Error(`Unknown art type ${type}`);
      const group=new THREE.Group();group.userData.artType=type;
      const h=HEIGHTS[type];
      const body=new THREE.Mesh(geometry(type),material);body.position.y=.009+h/2;body.name='illustrated-cuboid';group.add(body);
      const foot=new THREE.Mesh(footGeometry,teamMaterials[side]);foot.position.y=.0045;group.add(foot);
      const rim=new THREE.Mesh(rimGeometry,trim);rim.position.y=.009+h+.0015;group.add(rim);
      if(!caps.has(type))caps.set(type,new THREE.PlaneGeometry(.04,.018));
      const top=new THREE.Mesh(caps.get(type),label(type,side));top.rotation.x=-Math.PI/2;top.position.set(0,.009+h+.0031,.013);group.add(top);
      return group;
    },
    material,
    dispose(){geometries.forEach(g=>g.dispose());caps.forEach(g=>g.dispose());labels.forEach(m=>{m.map.dispose();m.dispose();});material.dispose();Object.values(teamMaterials).forEach(m=>m.dispose());trim.dispose();footGeometry.dispose();rimGeometry.dispose();}
  };
}
