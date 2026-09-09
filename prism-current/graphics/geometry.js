/* Jeweler-cut cushion and baton profiles. Pure geometry data also powers bounds
 * tests: the jewel never changes the scoring radius or the blade's endpoints. */
(function(root){'use strict';
 function cushion(radius=.158){
  const rings=[{z:-.125,r:.02},{z:-.020,r:1},{z:.005,r:1},{z:.102,r:.65}];
  // A clipped-square outline gives an unmistakable gemstone, not an icosphere.
  const outline=[[-.64,-1],[.64,-1],[1,-.64],[1,.64],[.64,1],[-.64,1],[-1,.64],[-1,-.64]];
  const vertices=[],uvs=[];
  function point(k,i){const q=outline[(i+8)%8],v=rings[k];return [q[0]*radius*v.r,q[1]*radius*v.r,v.z];}
  function triangle(a,b,c){vertices.push(...a,...b,...c);for(const p of[a,b,c])uvs.push(.5+p[0]/(radius*2),.5+p[1]/(radius*2));}
  for(let k=0;k<rings.length-1;k++)for(let i=0;i<8;i++){
   const a=point(k,i),b=point(k,(i+1)%8),c=point(k+1,(i+1)%8),d=point(k+1,i);
   // Alternating crown facets produce changing specular returns as you move.
   triangle(a,b,c);triangle(a,c,d);
  }
  for(let i=0;i<8;i++){triangle([0,0,rings[0].z],point(0,(i+1)%8),point(0,i));triangle([0,0,rings[3].z],point(3,i),point(3,(i+1)%8));}
  return {vertices,uvs,outline:outline.map(p=>p.map(v=>v*radius))};
 }
 function build(T){const data=cushion(),gem=new T.BufferGeometry();gem.setAttribute('position',new T.Float32BufferAttribute(data.vertices,3));gem.setAttribute('uv',new T.Float32BufferAttribute(data.uvs,2));gem.computeVertexNormals();
  const border=[];for(const p of data.outline)border.push(new T.Vector3(...p,.003));border.push(border[0].clone());
  const bezel=new T.TubeGeometry(new T.CatmullRomCurve3(border,false,'centripetal'),64,.008,6,false);
  const grip=new T.LatheGeometry([[0,-.12],[.023,-.12],[.032,-.105],[.032,-.082],[.025,-.069],[.022,.064],[.035,.076],[.038,.098],[.027,.122],[0,.122]].map(p=>new T.Vector2(...p)),32);grip.rotateX(-Math.PI/2);
  const blade=new T.BufferGeometry(),p=[],uv=[];const sections=[[-.08,.018],[-.22,.019],[-.68,.012],[-.74,0]];
  for(let i=0;i<sections.length-1;i++)for(let j=0;j<4;j++){
   const pt=(k,l)=>{const [z,r]=sections[k],a=l*Math.PI/2;return[Math.cos(a)*r,Math.sin(a)*r,z];};
   for(const [a,b,c]of[[pt(i,j),pt(i,j+1),pt(i+1,j+1)],[pt(i,j),pt(i+1,j+1),pt(i+1,j)]]){p.push(...a,...b,...c);for(const v of[a,b,c])uv.push((v[2]+.74)/.66,j/4);}
  }blade.setAttribute('position',new T.Float32BufferAttribute(p,3));blade.setAttribute('uv',new T.Float32BufferAttribute(uv,2));blade.computeVertexNormals();
  return {gem,bezel,grip,blade};
 }
 root.PrismGeometry=Object.freeze({cushion,build});if(typeof module!=='undefined')module.exports=root.PrismGeometry;
})(globalThis);
