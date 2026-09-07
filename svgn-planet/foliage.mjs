import * as T from './vendor/three.module.js';
import {anchor,mesh} from './art.mjs';
import {rand} from './world.mjs';
// Shared opaque-cutout leaf material. No transparent sorting, external image,
// skinning, per-frame vertex changes or photographic backdrop is involved.
let material;
function leafMaterial(){
 if(material)return material;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const g=canvas.getContext('2d');
 g.clearRect(0,0,64,64);g.fillStyle='#ffffff';g.beginPath();g.moveTo(32,2);g.bezierCurveTo(60,16,57,45,32,62);g.bezierCurveTo(6,42,6,20,32,2);g.fill();
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.generateMipmaps=true;
 material=new T.MeshStandardMaterial({map:tex,vertexColors:true,alphaTest:.48,side:T.DoubleSide,roughness:1});
 return material;
}
// Pure bounded mesh builder for deterministic geometry tests and rendering.
export function canopyGeometry(seed,size=1){
 const positions=[],normals=[],uv=[],colors=[],palette=['#3d793c','#568b42','#79a550','#95b655','#629341'].map(c=>new T.Color(c));
 for(let i=0;i<512;i++){
  const a=i*2.399963,b=rand(seed*7+i+31)*2-1,r=Math.sqrt(1-b*b),radius=(.25+.75*Math.cbrt(rand(seed+i*3+89)))*1.4*size;
  const center=new T.Vector3(Math.cos(a)*r*radius,(3.05+b*.63)*size,Math.sin(a)*r*radius),w=(.13+rand(i+seed)*.13)*size;
  const normal=new T.Vector3(Math.cos(a)*.65,.4+rand(seed+i*5),Math.sin(a)*.65).normalize();
  const u=new T.Vector3().crossVectors(normal,new T.Vector3(0,0,1)).normalize(),v=new T.Vector3().crossVectors(normal,u).normalize();
  const color=palette[i%palette.length];
  for(const [x,y]of[[-1,-1],[1,-1],[-1,1],[1,-1],[1,1],[-1,1]]){
   const p=center.clone().addScaledVector(u,x*w*.65).addScaledVector(v,y*w);
   positions.push(p.x,p.y,p.z);normals.push(normal.x,normal.y,normal.z);uv.push((x+1)/2,(y+1)/2);colors.push(color.r,color.g,color.b);
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeBoundingSphere();return geo;
}
export function leafyTree(parent,t){
 const g=anchor(parent,t.n),k=t.size;mesh(g,'cylinder','#8b7755',[0,1.42*k,0],[.135*k,2.84*k,.135*k]);
 for(let j=0;j<5;j++){const branch=mesh(g,'cylinder','#89734f',[Math.sin(j*2.4)*.35*k,(2.12+rand(j+t.seed)*.35)*k,Math.cos(j*2.4)*.35*k],[.045*k,1.85*k,.045*k],[Math.cos(j*2.4)*.46,0,Math.sin(j*2.4)*-.46]);branch.name='Tree branch';}
 const leaf=new T.Mesh(canopyGeometry(t.seed,k),leafMaterial());leaf.name='Leaf-cutout canopy';leaf.castShadow=leaf.receiveShadow=true;g.add(leaf);return g;
}
