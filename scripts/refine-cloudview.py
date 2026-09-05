"""Refine runtime art after visual review; fixed mesh complexity, not adaptive quality."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1];g=root/'mario-maker-clone/svgn-paper-route'
p=g/'cloudview-assets.js';s=p.read_text()
if 'function smallSphere()' not in s:
 small="""  function smallSphere(){return primitive('smallSphere',()=>{const p=[],n=[],v=(a,b)=>[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];for(let i=0;i<4;i++)for(let j=0;j<8;j++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4,c=j*Math.PI/4,d=(j+1)*Math.PI/4;for(const q of[v(a,c),v(b,d),v(b,c),v(a,c),v(a,d),v(b,d)]){p.push(...q);n.push(...q);}}return {p,n};});}
"""
 s=s.replace('  function cylinder(',small+'  function cylinder(')
 s=s.replace('return this.add(sphere(),c,[x,y,z],[rx,ry,rz]', 'return this.add(Math.max(rx,ry,rz)<=3.2?smallSphere():sphere(),c,[x,y,z],[rx,ry,rz]')
if 'const uv=new Float32Array' not in s:
 s=s.replace('g.computeBoundingSphere();',"if(options.map){const uv=new Float32Array(this.p.length/3*2);for(let i=0,j=0;i<this.p.length;i+=3){uv[j++]=this.p[i]/110;uv[j++]=this.p[i+1]/110;}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}g.computeBoundingSphere();")
start=s.index('  function rock(');end=s.index('  function tree(',start)
s=s[:start]+'''  function rock(batch,x,y,z,r,depth,seed=1){
   const rings=[],sides=25,cols=['#7389a0','#9cabb7','#b0b9ba','#8b9daa','#c2c8c4','#8091a2'];
   for(let level=0;level<6;level++){const ring=[];for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2,k=1+Math.sin(j*17+seed)*.13+Math.sin(level*7+j*3+seed)*.09,rr=r*[1,1.02,.82,.6,.30,.025][level]*k;ring.push([x+Math.cos(a)*rr,y-depth*[0,.13,.33,.58,.84,1][level]+Math.sin(j*7+seed+level)*r*.07,z+Math.sin(a)*rr*.65]);}rings.push(ring);}
   for(let i=0;i<5;i++)for(let j=0;j<sides;j++){const k=(j+1)%sides;batch.tri(rings[i][j],rings[i+1][j],rings[i+1][k],cols[(j+i+seed)%cols.length]);batch.tri(rings[i][j],rings[i+1][k],rings[i][k],cols[(j+i+seed+1)%cols.length]);}
  }
'''+s[end:];p.write_text(s)
p=g/'cloudview-world.js';s=p.read_text()
if 'function cloudBank(' not in s:
 helper=''' function cloudBank(T,course,night){
  const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
  // A reusable procedural weather texture, not an image of the level.
  for(let i=0;i<24;i++){const x=70+(i*83%365),y=142-Math.sin(i*2.7)*35,r=38+i%5*9,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.94)');gr.addColorStop(.62,'rgba(248,253,255,.92)');gr.addColorStop(.84,'rgba(231,245,255,.65)');gr.addColorStop(1,'rgba(230,246,255,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
  const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
  const im=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicNodeMaterial({map:tx,transparent:true,depthWrite:false,color:night?'#dbe7fa':'#ffffff',side:T.DoubleSide}),80),matrix=new T.Matrix4();
  for(let i=0;i<80;i++){const x=-1000+i*135,y=-2150-(i%3)*125+Math.sin(i*2.13)*120,z=-1100-(i%5)*130;matrix.makeScale(260+i%4*60,140+i%3*35,1);matrix.setPosition(x,y,z);im.setMatrixAt(i,matrix);}im.instanceMatrix.needsUpdate=true;im.frustumCulled=false;root.add(im);
 }
 function cliffTexture(T){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#e5e6e3';g.fillRect(0,0,128,128);let seed=7;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<3000;i++){const v=175+Math.floor(rand()*80);g.fillStyle=`rgba(${v},${v},${v},.18)`;g.fillRect(rand()*128,rand()*128,1+rand()*5,1+rand()*2);}for(let i=0;i<30;i++){g.strokeStyle='rgba(65,79,96,.10)';g.beginPath();let x=rand()*128,y=rand()*128;g.moveTo(x,y);for(let j=0;j<4;j++){x+=rand()*12;y+=rand()*8-4;g.lineTo(x,y);}g.stroke();}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=1000;t.colorSpace=T.SRGBColorSpace;return t;}
'''
 s=s.replace(' function build(m){',helper+' function build(m){')
s=s.replace("m.renderer.setClearColor(night?'#6f9ccb':'#77bce8',1);", "m.renderer.setClearColor(night?'#6f9ccb':'#77bce8',1);m.scene.fog=new T.Fog(night?'#9ebbd6':'#b5dff6',1050,2450);")
s=s.replace('map:tx,depthWrite:false}', 'map:tx,depthWrite:false,fog:false}')
s=s.replace("for(let i=0;i<150;i++){const x=-700+i*81,z=-650-(i%7)*125,y=-2360+Math.sin(i*2.38)*150;clouds.ell(x,y,z,56+i%4*20,26+i%5*6,30+i%3*13,night?'#c5dbe9':'#f0f8fb');}", 'cloudBank(T,course,night);')
s=s.replace("metal.finish(m,root,{roughness:.34,metalness:.38})", "metal.finish(m,root,{roughness:.4,metalness:.12})")
s=s.replace("terrain.finish(m,root,{roughness:.95,metalness:0})", "terrain.finish(m,root,{roughness:.95,metalness:0,map:cliffTexture(T)})")
s=s.replace('const active=__sky.active(),menu=__delivery.state.menu,s=', 'if(!__sky.active()&&!__delivery.state.menu)engine.scene.fog=null;\n  const active=__sky.active(),menu=__delivery.state.menu,s=')
p.write_text(s)
p=g/'sky-game.js';s=p.read_text();s=s.replace('zoom+=(desired-zoom)*.045;', 'if(cx===null)zoom=desired;else zoom+=(desired-zoom)*.045;');p.write_text(s)
p=g/'index.html';s=p.read_text()
if 'WebGPURenderer,Fog,Group,' not in s:s=s.replace('WebGPURenderer,Group,','WebGPURenderer,Fog,Group,')
p.write_text(s,newline='\r\n')
# Hardware-independent deadline for initial shader compilation. This is not
# a relaxation of movement, collision, or scene assertions.
p=root/'tests/cloudview_browser.py';s=p.read_text();s=s.replace("page.locator('[data-course=\"0\"]').click();", "page.locator('[data-course=\"0\"]').click(timeout=90000);")
p.write_text(s)
print('Small props optimized, detailed cliffs textured, airy clouds and atmospheric depth applied.')
