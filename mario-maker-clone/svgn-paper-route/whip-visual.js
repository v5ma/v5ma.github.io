/* Visible 3D tether. Uses a stable mesh with dynamic vertex buffers rather than
 * a zero-instance pipeline; all link positions follow the live peg/rider pose.
 */
'use strict';
(() => {
  function boot(){
    if(!window.__grapple||!window.SkyVisual)return;
    let owner=null,rope=null,ring=null,T=null;
    const faces=[[0,1,2,0,2,3],[4,6,5,4,7,6],[0,4,5,0,5,1],[3,2,6,3,6,7],[0,3,7,0,7,4],[1,5,6,1,6,2]];
    function make(capacity,color,parent){
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(capacity*36*3),3).setUsage(T.DynamicDrawUsage));
      const shades=[1,.54,.78,.93,.61,.82],colors=[];
      const c=new T.Color(color);
      for(let i=0;i<capacity;i++)for(let f=0;f<6;f++)for(let v=0;v<6;v++)colors.push(c.r*shades[f],c.g*shades[f],c.b*shades[f]);
      g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setDrawRange(0,0);
      const mat=new T.MeshBasicNodeMaterial({vertexColors:true,side:T.DoubleSide,depthTest:false,depthWrite:false});
      const mesh=__merged.makeSingle(g,mat);mesh.frustumCulled=false;mesh.renderOrder=5600;parent.add(mesh);return mesh;
    }
    function link(mesh,index,center,dir,length,width,depth){
      const nx=-dir[1],ny=dir[0],verts=[];
      for(const [u,v,z]of[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]){
        verts.push([center[0]+dir[0]*u*length*.5+nx*v*width*.5,center[1]+dir[1]*u*length*.5+ny*v*width*.5,center[2]+z*depth*.5]);
      }
      let k=index*36;const pos=mesh.geometry.attributes.position;
      for(const face of faces)for(const i of face)pos.setXYZ(k++,...verts[i]);
    }
    const old=SkyVisual.update;
    SkyVisual.update=function(){
      old();const g=__grapple.graphics;
      if(!g||!__sky.active())return;
      if(owner!==g){owner=g;T=__merged.THREE;rope=make(72,'#ffe394',g.group);ring=make(24,'#91ffed',g.group);rope.name='Physical whip chain links';ring.name='Peg targeting ring';g.ropeMesh=rope;g.targetMesh=ring;
        // Observe actual render submission, not only a positive buffer count.
        g.ropeDraw=null;rope.onAfterRender=function(){
          const vertices=this.geometry.drawRange.count;
          if(vertices>0&&player.peg)g.ropeDraw={step:__sky.state.steps,vertices,peg:player.peg.id};
        };
      }
      g.chain.visible=false;g.halo.visible=false;
      const p=player,a=p.peg;
      const hand=__cloudview.hero.group.localToWorld(new T.Vector3(16,11,7));
      const destination=a?new T.Vector3(a.x,-a.y,28):__grapple.state.lash>0?new T.Vector3(hand.x+p.dir*(160-__grapple.state.lash*8),hand.y+15,hand.z):null;
      let n=0;
      if(destination){
        const dx=destination.x-hand.x,dy=destination.y-hand.y,dz=destination.z-hand.z,len=Math.hypot(dx,dy)||1,dir=[dx/len,dy/len];
        n=Math.min(72,Math.max(1,Math.ceil(len/5)));
        for(let i=0;i<n;i++){const f=(i+.5)/n,slack=Math.sin(Math.PI*f)*(a?1.5:8);link(rope,i,[hand.x+dx*f,hand.y+dy*f-slack,hand.z+dz*f],dir,len/n*.80,i%2?2.4:3.8,i%2?3.8:2.4);}
        g.ropePath=[hand.toArray(),destination.toArray()];
      }
      rope.geometry.setDrawRange(0,n*36);rope.geometry.attributes.position.needsUpdate=true;
      const target=a||__grapple.state.target;
      if(target)for(let i=0;i<24;i++){const th=i/24*Math.PI*2;link(ring,i,[target.x+Math.cos(th)*24,-target.y+Math.sin(th)*24,31],[-Math.sin(th),Math.cos(th)],3.8,1.5,1.6);}
      ring.geometry.setDrawRange(0,target?24*36:0);ring.geometry.attributes.position.needsUpdate=true;
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
