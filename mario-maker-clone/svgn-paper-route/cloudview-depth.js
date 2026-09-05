/* Cloudview depth pass: render-only. No gameplay state is modified here.
 * Pinned Three r177: ACESFilmicToneMapping=4, EquirectangularReflectionMapping=303.
 * Original geometry/textures. The reference image is never loaded into the game.
 */
'use strict';
(() => {
  const VERSION = '2026.09.05-depth1';
  const palette = {
    '#e6a82e':'#eea10b', '#f1be49':'#ffbf24', '#577491':'#284e79',
    '#3c5a77':'#19355b', '#294560':'#122b4c', '#70879b':'#577895',
    '#8cbf47':'#65b42f', '#679e37':'#347723', '#edf0d9':'#f2f0df',
    '#d94c43':'#bb2431', '#ed6755':'#ed4447', '#f6b336':'#ffa71a',
    '#197cbe':'#096cbd', '#187ebc':'#086eca'
  };
  let saved = null, lighting = null, enabled = false;
  const factory = CloudAssets.create;
  CloudAssets.create = function(T) {
    const kit = factory(T), Base = kit.Batch;
    class ArtBatch extends Base {
      add(g,c,p,s,r) { return super.add(g,palette[c] || c,p,s,r); }
    }
    kit.Batch = ArtBatch;
    // Irregular vertical strata rather than a patchwork of giant triangles.
    kit.rock = function(b,x,y,z,r,depth,seed=1) {
      const sides=40,levels=11,rings=[];
      const profile=[1,.99,.96,.85,.86,.69,.58,.50,.33,.20,.015];
      for(let i=0;i<levels;i++) {
        const ring=[];
        for(let j=0;j<sides;j++) {
          const a=j/sides*Math.PI*2, ridge=1+.10*Math.sin(j*3.1+seed)+.045*Math.cos(j*7.3+seed);
          const rr=r*profile[i]*ridge*(1+.035*Math.sin(i*8+j));
          ring.push([x+Math.cos(a)*rr,y-depth*i/(levels-1)+r*.018*Math.sin(j*2.6+seed),z+Math.sin(a)*rr*.64]);
        }
        rings.push(ring);
      }
      const stone=['#899daf','#9badbb','#8296aa','#a3b4bf','#778fa5'];
      for(let i=0;i<levels-1;i++) for(let j=0;j<sides;j++) {
        const k=(j+1)%sides,c=stone[(Math.floor(j/3)+seed)%stone.length];
        b.tri(rings[i][j],rings[i+1][j],rings[i+1][k],c);
        b.tri(rings[i][j],rings[i+1][k],rings[i][k],c);
        if(i===1&&j%3===0){const a=rings[i][j],d=rings[i][k];b.rod(a,d,r*.010,'#61748c');}
      }
      // Real narrow buttresses give sunlight a surface to rake across.
      for(let j=0;j<15;j++) {
        const a=j/15*Math.PI*2,rr=r*(.85+.07*Math.sin(j*4+seed)),ht=depth*(.22+.15*((j+seed)%4));
        const px=x+Math.cos(a)*rr,pz=z+Math.sin(a)*rr*.64;
        b.rod([px,y-r*.05,pz],[x+(px-x)*.45,y-ht,z+(pz-z)*.45],r*(.018+j%3*.009),stone[(j+seed)%5]);
      }
    };
    kit.tree = function(b,x,y,z,s=1,seed=1) {
      b.cone(x,y+11*s,z,1.6*s,24*s,'#664f35',.5,7);
      if(seed%4===1) {
        for(let j=0;j<7;j++) {
          const a=j*2.4,px=x+Math.sin(a)*7*s,pz=z+Math.cos(a)*6*s,py=y+(23+j%3*5)*s;
          b.rod([x,y+13*s,z],[px,py,pz],1.1*s,'#6c5131');
          b.ell(px,py,pz,(7+j%2)*s,8*s,7*s,['#246e30','#40952f','#65ad35'][j%3]);
          b.ell(px-2*s,py+4*s,pz+2*s,4*s,4*s,4*s,'#83c54b');
        }
      } else {
        for(let j=0;j<5;j++) {
          const ht=(13+j*4.8)*s,rr=(11-j*1.75)*s;
          b.cone(x,y+ht,z,rr,14*s,j%2?'#286c31':'#398a32',0,11);
          for(let k=0;k<3;k++) {
            const a=k*2.09+j*.5,px=x+Math.sin(a)*rr*.63,pz=z+Math.cos(a)*rr*.63;
            b.cone(px,y+ht-2*s,pz,rr*.40,6*s,k%2?'#6caf3a':'#4a972e',0,7);
          }
        }
      }
    };
    kit.grass = function(b,x,y,z,r,s=1) {
      b.ell(x,y-3*s,z,r,5*s,r*.63,'#346e2d');
      b.ell(x,y,z,r*.98,3*s,r*.61,'#65ad32');
      for(let i=0;i<48;i++) {
        const a=i*2.39996,rr=r*(.65+.33*(i%4)/3),px=x+Math.sin(a)*rr,pz=z+Math.cos(a)*rr*.62;
        const h=(3+i%4)*s;
        b.tri([px-2*s,y,pz],[px-.8*s,y+h,pz],[px+.5*s,y,pz],'#83c641');
        b.tri([px+.5*s,y,pz],[px+2*s,y+h*.7,pz],[px+2.7*s,y,pz],'#4a9228');
      }
      for(let j=0;j<12;j++) {
        const a=j/12*Math.PI*2,px=x+Math.cos(a)*r*.94,pz=z+Math.sin(a)*r*.60;
        const h=(10+j%4*5)*s;
        b.rod([px,y,pz],[px+2*s,y-h,pz+2*s],.65*s,'#446b2a');
        for(let k=0;k<4;k++) b.ell(px+(k%2?2:-2)*s,y-k/4*h,pz+2*s,3*s,1.3*s,2*s,k%2?'#438323':'#6dad30',.45);
      }
    };
    const city=kit.city;
    kit.city=function(b,x,y,z,s=1) {
      city(b,x,y,z,s);
      for(let i=0;i<8;i++) {
        const px=x+(i-3.5)*19*s,pz=z+((i%3)-1)*14*s,h=(22+i*7%26)*s;
        b.box(px,y+3*s,pz+7*s,17*s,5*s,3*s,'#c5ba99');
        b.box(px,y+h-4*s,pz+7*s,17*s,2*s,2*s,'#dcb977');
        for(let j=0;j<3;j++) {
          b.box(px,y+9*s+j*9*s,pz+7*s,5.2*s,6.2*s,.8*s,'#f9e6bc');
          b.box(px,y+9*s+j*9*s,pz+7.5*s,3.1*s,4.4*s,.8*s,'#255582');
        }
        if(i%2===0){b.cone(px,y+h+7*s,pz,12*s,15*s,'#eeae24',0,4);b.box(px,y+h+14*s,pz,1*s,10*s,1*s,'#7b683e');}
      }
      b.ell(x+10*s,y+90*s,z+10*s,5*s,5*s,.8*s,'#e2b645');
      b.ell(x+10*s,y+90*s,z+11*s,3.8*s,3.8*s,.5*s,'#fff6ce');
      b.rod([x+10*s,y+90*s,z+11.7*s],[x+10*s,y+93*s,z+11.7*s],.5*s,'#314969');
      for(const dx of[-35,10,40]){b.box(x+dx*s,y+(dx===10?158:121)*s,z,1*s,14*s,1*s,'#ad8744');b.tri([x+dx*s,y+(dx===10?163:126)*s,z],[x+(dx+11)*s,y+(dx===10?160:123)*s,z],[x+dx*s,y+(dx===10?156:119)*s,z],'#327abb');}
    };
    return kit;
  };
  function makeBevel(T) {
    const p=[],n=[],vals=[-.5,-.38,.38,.5];
    function vertex(axis,sign,u,v) {
      const q=[0,0,0];q[axis]=sign*.5;q[(axis+1)%3]=u;q[(axis+2)%3]=v;
      const core=q.map(a=>Math.max(-.38,Math.min(.38,a))),off=q.map((a,i)=>a-core[i]),l=Math.hypot(...off)||1;
      return {p:q.map((a,i)=>core[i]+off[i]/l*.12),n:off.map(a=>a/l)};
    }
    for(let axis=0;axis<3;axis++)for(const sign of[-1,1])for(let i=0;i<3;i++)for(let j=0;j<3;j++){
      const a=vertex(axis,sign,vals[i],vals[j]),b=vertex(axis,sign,vals[i+1],vals[j]),c=vertex(axis,sign,vals[i+1],vals[j+1]),d=vertex(axis,sign,vals[i],vals[j+1]);
      for(const v of sign>0?[a,b,c,a,c,d]:[a,c,b,a,d,c]){p.push(...v.p);n.push(...v.n);}
    }
    return {p,n};
  }
  function restore() {
    if(!saved)return;
    for(const [light,intensity]of saved.lights)light.intensity=intensity;
    saved.renderer.toneMapping=saved.tone;saved.renderer.toneMappingExposure=saved.exposure;
    saved.renderer.shadowMap.enabled=saved.shadows;
    saved.scene.environment=saved.environment;saved.scene.fog=saved.fog;enabled=false;
  }
  function engage(m) {
    if(!saved){saved={renderer:m.renderer,scene:m.scene,lights:[],tone:m.renderer.toneMapping,exposure:m.renderer.toneMappingExposure,shadows:m.renderer.shadowMap.enabled,environment:m.scene.environment,fog:null};}
    for(const light of m.scene.children)if(light.isLight&&!saved.lights.some(([a])=>a===light))saved.lights.push([light,light.intensity]);
    for(const [light]of saved.lights)light.intensity=0;
    m.renderer.toneMapping=4;m.renderer.toneMappingExposure=1.10;
    m.renderer.shadowMap.enabled=true;m.renderer.shadowMap.type=1;
    enabled=true;
  }
  function reflectionSky(T) {
    const c=document.createElement('canvas');c.width=512;c.height=256;
    const g=c.getContext('2d'),a=g.createLinearGradient(0,0,0,256);
    a.addColorStop(0,'#4279ce');a.addColorStop(.46,'#bedfff');a.addColorStop(.53,'#e5dfbb');a.addColorStop(1,'#34445a');
    g.fillStyle=a;g.fillRect(0,0,512,256);
    const sun=g.createRadialGradient(180,65,2,180,65,45);sun.addColorStop(0,'#ffffff');sun.addColorStop(.35,'#fffbe8');sun.addColorStop(1,'rgba(255,246,214,0)');g.fillStyle=sun;g.fillRect(110,0,140,130);
    for(let i=0;i<7;i++){g.fillStyle='rgba(245,253,255,.25)';g.beginPath();g.ellipse(i*85,105,56,10,0,0,7);g.fill();}
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.mapping=303;return texture;
  }
  function haloTexture(T) {
    const c=document.createElement('canvas');c.width=16;c.height=64;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,64);
    gr.addColorStop(0,'rgba(50,170,255,0)');gr.addColorStop(.35,'rgba(70,185,255,.09)');gr.addColorStop(.49,'rgba(110,240,255,.8)');gr.addColorStop(.51,'rgba(110,240,255,.8)');gr.addColorStop(.65,'rgba(70,185,255,.09)');gr.addColorStop(1,'rgba(50,170,255,0)');g.fillStyle=gr;g.fillRect(0,0,16,64);
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
  }
  function lightStrip(T,pts,width,z,texture,m,parent) {
    const p=[],uv=[];
    for(let i=1;i<pts.length;i++) {
      const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dy=-(b[1]-a[1]),len=Math.hypot(dx,dy)||1,nx=-dy/len*width,ny=dx/len*width;
      const q=[[a[0]-nx,-a[1]-ny,z],[a[0]+nx,-a[1]+ny,z],[b[0]+nx,-b[1]+ny,z],[a[0]-nx,-a[1]-ny,z],[b[0]+nx,-b[1]+ny,z],[b[0]-nx,-b[1]-ny,z]];
      q.forEach(v=>p.push(...v));uv.push(0,0,0,1,1,1,0,0,1,1,1,0);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    const mat=new T.MeshBasicNodeMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide,blending:2,toneMapped:false,opacity:.5});
    const mesh=m.makeSingle(g,mat);mesh.name='Emissive rail halo';mesh.frustumCulled=false;parent.add(mesh);return mesh;
  }
  const base=Cloudview,build=base.build,update=base.update;
  base.build=function(m) {
    if(lighting){m.scene.environment=null;lighting.environment?.dispose();lighting=null;}
    const root=build(m),T=m.THREE;
    const active=window.__sky?.active(),menu=window.__delivery?.state.menu;
    if(!active&&!menu){restore();return root;}
    engage(m);
    const kit=CloudAssets.create(T),b=new kit.Batch(),lamps=new kit.Batch(),bevel=makeBevel(T);
    const round=(x,y,z,w,h,d,color,a=0)=>b.add(bevel,color,[x,y,z],[w,h,d],[0,0,a]);
    const course=active?__sky.state.data:SkyRoutes.build(0,__gameRefs.T);
    const paths=active?tracks.filter(t=>t.sky).map(t=>({pts:t.pts,tag:t.sky})):course.ct.map(p=>({pts:p,tag:p.sky}));
    let panels=0;
    const tex=haloTexture(T);
    for(const {pts,tag}of paths) {
      let distance=0,last=-50;
      const total=SkyRoutes.length(pts),start=tag.begin*total,end=tag.end*total;
      for(let i=1;i<pts.length;i++) {
        const a=pts[i-1],d=pts[i],dx=d[0]-a[0],dy=-(d[1]-a[1]),length=Math.hypot(dx,dy);distance+=length;
        if(length<.001||distance-last<30)continue;last=distance;
        const nx=-dy/length,ny=dx/length,angle=Math.atan2(dy,dx),x=d[0]-nx*7,y=-d[1]-ny*7;
        const sector=distance>start+(end-start)*.55&&distance<=end;
        round(x,y,28.5,27,16,5,panels%5===0?'#274a76':panels%2?'#ffb716':'#e79a0d',angle);
        const q=(u,v,z=31.2)=>[x+u*dx/length+v*nx,y+u*dy/length+v*ny,z];
        for(const u of[-10,10]){const p=q(u,0,31);b.ell(...p,1.7,1.7,.8,'#143558');b.ell(p[0]-.3,p[1]+.35,31.7,.75,.75,.45,'#e0e9e6');}
        if(panels%2===0){const c=sector?'#fff6bd':'#62e9ff';lamps.tri(q(-5,5.5,31.8),q(1,0,31.8),q(-5,-5.5,31.8),c);lamps.tri(q(.5,5.5,31.8),q(6.5,0,31.8),q(.5,-5.5,31.8),c);}
        panels++;
      }
      lightStrip(T,pts,9,18,tex,m,root);
    }
    const plates=b.finish(m,root,{roughness:.28,metalness:.48});if(plates){plates.name='Beveled enamel and gold panels';plates.castShadow=true;plates.receiveShadow=true;}
    const lights=lamps.finish(m,root,{unlit:true,toneMapped:false});if(lights)lights.name='Luminous direction inlays';
    root.traverse(o=>{if(o.isLight)o.intensity=0;});
    const night=active&&themeName==='city';
    const sun=new T.DirectionalLight(night?'#d4e6ff':'#fff0cf',night?2.5:3.4);
    sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-450;sun.shadow.camera.right=450;sun.shadow.camera.top=400;sun.shadow.camera.bottom=-400;sun.shadow.camera.near=10;sun.shadow.camera.far=2100;sun.shadow.bias=-.00015;sun.shadow.normalBias=1.2;
    root.add(sun,sun.target);
    const fill=new T.DirectionalLight('#96c9ff',.52);fill.position.set(1200,-1500,1300);fill.target.position.set(700,-2100,0);root.add(fill,fill.target);
    const rim=new T.DirectionalLight(night?'#86cfff':'#ffe9b0',1.45);rim.position.set(700,-1700,-450);rim.target.position.set(650,-2100,0);root.add(rim,rim.target);
    root.add(new T.AmbientLight(night?'#9ebbe9':'#c4e0fa',.32));
    const env=reflectionSky(T);m.scene.environment=env;
    m.scene.fog=new T.Fog(night?'#a7c7e9':'#c5e7fa',1200,3000);
    const hero=__cloudview.hero;
    root.traverse(o=>{
      if(!o.material||!o.geometry)return;
      const mat=o.material;
      if(mat.isMeshStandardNodeMaterial){mat.envMapIntensity=.40;o.receiveShadow=true;}
      if(o.parent===hero.group&&mat.isMeshStandardNodeMaterial){o.castShadow=true;mat.roughness=.31;mat.metalness=.18;}
      if(o.name==='Cloudview merged art'&&o.geometry.attributes.position.count>100000&&!mat.transparent)o.castShadow=true;
    });
    lighting={root,sun,environment:env,scene:m.scene,renderer:m.renderer,stats:{version:VERSION,beveledPanels:panels,shadowMapSize:1024,lighting:'warm key, cool fill, rim, environment reflections',toneMapping:'ACES filmic',procedural:true}};
    window.__cloudDepth=lighting;
    __cloudview.stats.depthVersion=VERSION;__cloudview.stats.beveledPanels=panels;
    for(const o of root.children) {
      const mat=o.material;
      if(o.renderOrder===-100&&mat?.map){const sky=mat.map.image,ctx=sky.getContext('2d'),gr=ctx.createLinearGradient(0,0,0,sky.height);gr.addColorStop(0,night?'#152b68':'#0873e9');gr.addColorStop(.55,night?'#577db0':'#349bed');gr.addColorStop(1,night?'#a3cde4':'#d3efff');ctx.fillStyle=gr;ctx.fillRect(0,0,sky.width,sky.height);mat.map.needsUpdate=true;mat.toneMapped=false;}
    }
    kit.dispose();return root;
  };
  base.update=function() {
    update();
    if(!lighting)return;
    const visible=window.__sky?.active()||window.__delivery?.state.menu;
    if(!visible){if(enabled)restore();return;}
    if(!enabled)engage(window.__merged);
    const m=__merged,p=player,active=__sky.active();
    const x=active?p.x+110:500,y=active?-p.y: -2000;
    const snap=16,tx=Math.round(x/snap)*snap,ty=Math.round(y/snap)*snap;
    lighting.sun.position.set(tx-330,ty+600,750);lighting.sun.target.position.set(tx,ty,0);lighting.sun.target.updateMatrixWorld();
    if(active&&m.camera) {
      const dir=new m.THREE.Vector3();m.camera.getWorldDirection(dir);
      if(Math.abs(dir.z)>.01){const f=-m.camera.position.z/dir.z,c=m.camera.position.clone().addScaledVector(dir,f);m.camera.position.set(c.x+170,c.y+95,800);m.camera.lookAt(c.x,c.y,0);m.camera.updateMatrixWorld();}
    }
  };
})();
