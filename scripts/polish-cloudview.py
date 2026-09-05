"""Reference QA pass: atmosphere, surface finish and actual envelope collectibles."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'mario-maker-clone/svgn-paper-route/cloudview-world.js';s=p.read_text()
if 'cloudview-20260904-2' not in s:
 s=s.replace("cloudview-20260904-1","cloudview-20260904-2")
 s=s.replace('let lastStep=-1, trail=[]','let envelopes=[], lastStep=-1, trail=[]')
 s=s.replace('this.p=[];this.n=[];this.c=[];','this.p=[];this.n=[];this.c=[];this.uv=[];')
 s=s.replace('const i=idx?idx.getX(k):k;v.set',"const i=idx?idx.getX(k):k;const uv=g.attributes.uv;this.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0);v.set")
 s=s.replace("g.computeBoundingSphere();","g.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));g.computeBoundingSphere();",1)
 s=s.replace('roughness:.35,metalness:.48','roughness:.42,metalness:.2,map:paintFinish(T)')
 s=s.replace('painted:new T.MeshStandardNodeMaterial({vertexColors:true,roughness:.65,metalness:.1})','painted:new T.MeshStandardNodeMaterial({vertexColors:true,roughness:.65,metalness:0})')
 s=s.replace('function materials(T){', '''function paintFinish(T){
    const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
    g.fillStyle='#f5f5f5';g.fillRect(0,0,128,128);
    const edge=g.createLinearGradient(0,0,0,128);edge.addColorStop(0,'#fff');edge.addColorStop(.04,'#eee');edge.addColorStop(.94,'#f8f8f8');edge.addColorStop(1,'#a9adb3');g.fillStyle=edge;g.fillRect(0,0,128,128);
    for(let i=0;i<280;i++){g.fillStyle=i%4?'#5564750c':'#ffffff77';g.fillRect(rnd(i)*128,rnd(i+901)*128,1+rnd(i+7)*5,1);}
    g.strokeStyle='#67798766';g.lineWidth=1;g.strokeRect(1,1,126,126);
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
  }
  function materials(T){''')
 s=s.replace("    if(town){\n      for(let i=0;i<12;i++){", "    for(let k=0;k<13;k++){const a=k*2.399,rr=r*(.78+rnd(seed+k)*.12);b.add(units.rock,x+Math.cos(a)*rr,y-r*(.23+rnd(k+seed+100)*.23),z+Math.sin(a)*r*.42,r*.16,r*(.33+rnd(k)*.25),r*.19,(rnd(k+42)-.5)*.4,k%3?'#9dabbc':'#c3c9cd',k);}\n    if(town){\n      for(let i=0;i<20;i++){")
 s=s.replace("(i%4-1.5)*r*.35,zz=z+(Math.floor(i/4)-1)*r*.26,ht=r*(.2+rnd(i+seed*3)*.32),ww=r*.2", "(i%5-2)*r*.29,zz=z+(Math.floor(i/5)-1.5)*r*.24,ht=r*(.2+rnd(i+seed*3)*.37),ww=r*.17")
 s=s.replace("wheels=[];waterfalls=[];mailboxes=[];trail=[];", "wheels=[];waterfalls=[];mailboxes=[];envelopes=[];trail=[];")
 s=s.replace("m.renderer.setClearColor(bg,1);", "m.renderer.setClearColor(bg,1);m.scene.fog=new T.Fog(night?'#c4dced':'#b4dcf5',1050,2600);")
 s=s.replace("{map:st,depthWrite:false}","{map:st,depthWrite:false,fog:false}")
 start=s.index('    const cloudBatch=new GeometryBatch(T,mats.nature);')
 end=s.index('    for(let i=0;i<paths.length;i++){',start)
 s=s[:start]+'''    // Soft volumetric-cloud impostors are scenery only. Main islands, roads,
    // targets and the rider remain actual geometry. Four textures avoid clones.
    for(let variant=0;variant<4;variant++){
      const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
      // Overlapping shaded billows, with soft alpha edges and no dark outline.
      for(let k=0;k<40;k++){
        const x=75+rnd(k+variant*47)*360,y=104+rnd(k+variant*13+7)*70,r=25+rnd(k+30)*48;
        const grad=g.createRadialGradient(x-r*.15,y-r*.3,r*.07,x,y,r);
        grad.addColorStop(0,'#fffffffa');grad.addColorStop(.54,'#fbffffee');grad.addColorStop(.8,'#def1fadd');grad.addColorStop(1,'#c6e5f600');g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);
      }
      const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
      const cloud=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicNodeMaterial({map:tx,transparent:true,depthWrite:false,opacity:.91,side:T.DoubleSide,fog:false}),30);
      cloud.frustumCulled=false;cloud.renderOrder=-20+variant;const mm=new T.Matrix4();
      for(let i=0;i<30;i++){const id=i*4+variant,w=260+rnd(id+18)*420;mm.makeScale(w,w*.5,1);mm.setPosition(-950+id*211%(data.width*36+2300),-2350-rnd(id+57)*270,-850-rnd(id+60)*1350);cloud.setMatrixAt(i,mm);}
      cloud.instanceMatrix.needsUpdate=true;world.add(cloud);
    }
''' + s[end:]
 s=s.replace("const distant=p.pts.map(v=>[v[0]+390,v[1]-140]);", "const distant=p.pts.map(v=>[x+(v[0]-x)*.72+430,-y+(v[1]+y)*.72-160]);")
 s=s.replace("    for(const b of data.boxes||[])mailbox(world,b,mats);stats.mailboxes=mailboxes.length;", "    for(const b of data.boxes||[])mailbox(world,b,mats);stats.mailboxes=mailboxes.length;\n    for(let k=0;k<data.cells.length;k++)if(data.cells[k]===__gameRefs.T.GEAR)makeEnvelope(world,k%data.width,Math.floor(k/data.width),mats);")
 s=s.replace("    }else{restore();if(courier)courier.visible=false;return;}","    }else{restore();api.scene.fog=null;if(courier)courier.visible=false;return;}")
 s=s.replace('[__gameRefs.T.MAILBOX,__gameRefs.T.MAILDONE].includes(id)', '[__gameRefs.T.MAILBOX,__gameRefs.T.MAILDONE,__gameRefs.T.GEAR].includes(id)')
 s=s.replace("for(const box of mailboxes){", "for(const e of envelopes){e.root.visible=pg(e.x,e.y)===__gameRefs.T.GEAR;e.root.position.y=e.height+Math.sin(t*2+e.x)*1.5;}\n      for(const box of mailboxes){")
 s=s.replace('  function mailbox(parent,box,mats){', '''  function makeEnvelope(parent,x,y,mats){
    const T=api.THREE,root=new T.Group();root.position.set(x*36+18,-y*36-18,25);root.rotation.z=-.12+(x%3)*.12;parent.add(root);
    const b=new GeometryBatch(T,mats.painted),glow=new GeometryBatch(T,mats.glow);
    b.add(units.box,0,0,0,22,15,3,0,'#ffedbd');
    b.add(units.box,-4.4,1,1.7,12,1,1,-.57,'#ca9759');b.add(units.box,4.4,1,1.7,12,1,1,.57,'#ca9759');
    b.add(units.ball,0,-1,2.3,2.4,2.4,.9,0,'#d95138');
    glow.add(units.box,0,7,1.5,20,.65,1,0,'#fffbe1');
    b.finish(root,'Collectible sealed envelope');glow.finish(root,'Envelope edge light');envelopes.push({root,x,y,height:root.position.y});
  }
  function mailbox(parent,box,mats){''')
 p.write_text(s)
p=ROOT/'mario-maker-clone/svgn-paper-route/index.html';s=p.read_text()
if 'CircleGeometry,Fog,RepeatWrapping' not in s:s=s.replace('CircleGeometry,RepeatWrapping','CircleGeometry,Fog,RepeatWrapping')
p.write_text(s,newline='\r\n')
p=ROOT/'mario-maker-clone/svgn-paper-route/sky-game.js';s=p.read_text()
s=s.replace('Math.max(.85,Math.min(2.0,view.w/(speed>15?950:820)))','Math.max(.85,Math.min(2.35,view.w/(p.track?680:1020)))')
p.write_text(s)
print('Cloudview visual QA: soft clouds, atmospheric distance, panel finish, cliff detail and real envelopes.')
