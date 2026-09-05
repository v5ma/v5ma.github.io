/* Broad double-edged roadway follows the actual collision polylines.
 * Colors remain original Cloudview art; no reference screenshot is textured in. */
globalThis.SkyNetworkArt=(()=>{
 function sectionFrames(points){return points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dy=-(b[1]-a[1]),l=Math.hypot(dx,dy)||1;let miter=1;if(i>0&&i<points.length-1){const ux=p[0]-points[i-1][0],uy=-(p[1]-points[i-1][1]),ul=Math.hypot(ux,uy)||1;miter=Math.min(1.65,1/Math.max(.35,(dx*ux+dy*uy)/(l*ul)));}return {x:p[0],y:-p[1],tx:dx/l,ty:dy/l,nx:-dy/l,ny:dx/l,miter};});}
 function populate({course,m,root,kit,metal,terrain,greenery,far,sign,paths}){
  const road=new kit.Batch(),edges=new kit.Batch(),markers=new kit.Batch();let count=0;
  const quad=(b,a,c,d,e,color)=>{b.tri(a,c,d,color);b.tri(a,d,e,color);};
  for(const {pts,sky:tag}of paths){
   const f=sectionFrames(pts),v=(a,n,z)=>[a.x+a.nx*n*a.miter,a.y+a.ny*n*a.miter,z],gold=tag.tier===3?'#eac576':'#d9ba63';
   for(let i=1;i<f.length;i++){
    const a=f[i-1],b=f[i];
    quad(road,v(a,0,-32),v(a,0,32),v(b,0,32),v(b,0,-32),'#315c61');
    quad(road,v(a,0,32),v(a,-34,32),v(b,-34,32),v(b,0,32),'#14393e');
    quad(road,v(a,-34,-32),v(a,0,-32),v(b,0,-32),v(b,-34,-32),'#244a50');
    quad(road,v(a,-34,32),v(a,-34,-32),v(b,-34,-32),v(b,-34,32),'#17333d');
    for(const z of[-25,25])quad(edges,v(a,.6,z-1.6),v(a,.6,z+1.6),v(b,.6,z+1.6),v(b,.6,z-1.6),gold);
    for(const n of[-6,-27])quad(edges,v(a,n-1.6,32.6),v(a,n+1.6,32.6),v(b,n+1.6,32.6),v(b,n-1.6,32.6),gold);
    if(i%6===0){edges.ell(...v(b,-17,33.2),1.5,1.5,1,'#627f7b');metal.rod(v(b,-31,-36),v(b,-31,36),2,'#47616a');}
    if(i%7===0)quad(markers,v(a,.9,-1.5),v(a,.9,1.5),v(b,.9,1.5),v(b,.9,-1.5),'#d2d4af');
   }
   for(const end of[f[0],f.at(-1)])quad(edges,v(end,0,-32),v(end,-34,-32),v(end,-34,32),v(end,0,32),gold);
   count++;
  }
  const ground=course.ground*36;
  for(let i=0;i<course.gp.skyNetwork.sectors.length;i++){
   const s=course.gp.skyNetwork.sectors[i],x=s.x+s.w*.46,y=-s.y-120,z=-170;
   far.box(x,-ground+220,z,12,440,16,'#637b7c');far.rod([x,-ground+360,z],[x+240,y-70,z],5,'#7a938d');
   if(i%2===0){kit.rock(terrain,x+170,y-130,-240,88,130,i+2);kit.grass(greenery,x+170,y-128,-240,88,.55);kit.tree(greenery,x+170,y-122,-240,.55,i);}
   sign(s.name.toUpperCase(),x,y+95,-90,180,39);
  }
  const meshes=[];
  for(const [b,name,options]of[[road,'Network road ribbons',{roughness:.68,metalness:.12}],[edges,'Double lane edging and open ends',{roughness:.4,metalness:.34}],[markers,'Sparse roadway markings',{roughness:.72,metalness:0}]]){const a=b.finish(m,root,options);if(a){a.name=name;a.castShadow=true;a.receiveShadow=true;meshes.push(a);}}
  root.userData.skyNetworkArt={surfaces:count,vertices:meshes.reduce((n,o)=>n+o.geometry.attributes.position.count,0),contactOffset:24,bodyDepth:34,plane:0};
 }
 return Object.freeze({populate,sectionFrames});
})();
