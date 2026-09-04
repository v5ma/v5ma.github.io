// Small, dependency-free WebGL diorama renderer. All geometry is original.
// Models emphasize recognizable features; they are not anatomical reconstructions.
const sub=(a,b)=>a.map((n,i)=>n-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((v,n,i)=>v+n*b[i],0);
const norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function buildWorld(d) {
  const v=[];
  function tri(a,b,c,col) {
    const n=norm(cross(sub(b,a),sub(c,a))), light=.58+.42*Math.max(0,dot(n,norm([-.4,1,.7])));
    for(const p of [a,b,c]) v.push(...p,...col.map(x=>x*light));
  }
  function ell(p,r,col,segs=12,rings=7) {
    const point=(i,j)=>{const a=i*Math.PI/rings,b=j*Math.PI*2/segs;return[p[0]+r[0]*Math.sin(a)*Math.cos(b),p[1]+r[1]*Math.cos(a),p[2]+r[2]*Math.sin(a)*Math.sin(b)];};
    for(let i=0;i<rings;i++)for(let j=0;j<segs;j++){const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),e=point(i,j+1);tri(a,b,c,col);tri(a,c,e,col);}
  }
  function tube(a,b,ra,rb,col,segs=9) {
    const axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),w=cross(axis,u);
    const at=(p,r,i)=>p.map((n,k)=>n+r*(Math.cos(i*2*Math.PI/segs)*u[k]+Math.sin(i*2*Math.PI/segs)*w[k]));
    for(let i=0;i<segs;i++){const p=at(a,ra,i),q=at(a,ra,i+1),r=at(b,rb,i),s=at(b,rb,i+1);tri(p,q,r,col);tri(q,s,r,col);tri(a,q,p,col);tri(b,r,s,col);}
  }
  const skin=rgb(d.color), belly=skin.map(n=>Math.min(1,n*1.15+.06)), dark=skin.map(n=>n*.72), horn=rgb('#f0ddab');
  const ground=rgb(d.period==='triassic'?'#c69c6c':'#94ad7e');
  tube([0,-.6,0],[0,-.04,0],5.3,5.45,rgb('#987b58'),56);
  tube([0,-.045,0],[0,0,0],5.45,5.45,ground,56);
  ell([2.5,.018,-1.8],[1.7,.03,1.1],rgb('#7daaa6'),28,4);
  ell([0,.018,0],[2.5,.028,.83],rgb('#6e8461'),24,4);
  for(let i=0;i<10;i++) {
    const a=2.9+i*.42,x=Math.cos(a)*4.25,z=Math.sin(a)*4.2, h=1.15+(i%3)*.48;
    tube([x,0,z],[x,h,z],.09,.06,rgb('#776346'),7);
    for(let k=0;k<3;k++)tube([x,.45+k*.38,z],[x,h+.5+k*.3,z],.68-k*.13,0,rgb(i%2?'#456e52':'#577f55'),7);
  }
  for(let i=0;i<14;i++) {
    const a=i*1.9,x=Math.cos(a)*4.1,z=Math.sin(a)*3.8;
    if(z<-.8)continue;
    for(let j=0;j<5;j++){const b=j*1.3;tri([x,0,z],[x+Math.cos(b)*.5,.18,z+Math.sin(b)*.5],[x,.48,z],rgb('#62835a'));}
  }
  for(let i=0;i<7;i++)ell([-4+i*1.22,.13,2.5+(i%2)*.4],[.23,.17,.19],rgb('#a8a68c'),7,4);
  const quadruped=['longneck','plates','horns'].includes(d.type);
  if(quadruped) {
    ell([-.25,1.25,0],[1.25,.72,.56],skin);
    ell([-.1,1.06,.015],[.92,.43,.53],belly);
    for(const x of[-.93,.5])for(const z of[-.4,.4]){
      tube([x,1.15,z],[x+.1,.16,z],.23,.14,dark);
      ell([x+.18,.14,z],[.26,.15,.21],skin);
    }
    if(d.type==='longneck') {
      tube([.65,1.5,0],[1.6,1.95,0],.42,.3,skin);
      tube([1.6,1.95,0],[2.55,2.65,0],.3,.18,skin);
      tube([2.55,2.65,0],[3.35,2.78,0],.18,.13,skin);
      ell([3.54,2.78,0],[.34,.2,.18],skin);
      for(const z of[-.168,.168])ell([3.59,2.84,z],[.034,.034,.017],rgb('#18382f'),6,4);
      tube([-1.15,1.25,0],[-2.4,1.55,0],.37,.16,skin);
      tube([-2.4,1.55,0],[-3.65,1.85,0],.16,.06,skin);
      tube([-3.65,1.85,0],[-4.45,1.9,0],.06,.009,skin);
    } else if(d.type==='plates') {
      tube([.6,1.17,0],[1.55,.83,0],.34,.15,skin);
      ell([1.7,.84,0],[.37,.22,.2],skin);
      for(const z of[-.18,.18])ell([1.81,.93,z],[.033,.033,.014],rgb('#17382f'),6,4);
      tube([-1.2,1.25,0],[-2.25,1.25,0],.3,.12,skin);
      tube([-2.25,1.25,0],[-3.25,1.55,0],.12,.015,skin);
      for(let i=0;i<9;i++){
        const x=-1.6+i*.3,y=1.48+Math.sin(i/9*Math.PI)*.43,z=(i%2?.16:-.16),h=.32+Math.sin(i/9*Math.PI)*.52,col=rgb(i%2?'#c8895f':'#dea874');
        const a=[x-.2,y,z],b=[x-.25,y+h*.64,z],c=[x+.02,y+h,z],e=[x+.25,y+h*.55,z],f=[x+.21,y,z];
        tri(a,b,c,col);tri(a,c,e,col);tri(a,e,f,col);
        tri(a,c,b,col);tri(a,e,c,col);tri(a,f,e,col);
      }
      for(const x of[-2.35,-2.7])for(const s of[-1,1])tube([x,1.3,s*.05],[x-.16,1.8,s*.55],.095,0,horn);
    } else {
      ell([.95,1.53,0],[.2,.77,.73],dark);
      ell([1.12,1.54,0],[.19,.6,.55],skin);
      ell([1.52,1.13,0],[.62,.45,.43],skin);
      ell([1.99,.89,0],[.37,.25,.31],dark);
      for(const z of[-.33,.33]){
        tube([1.46,1.53,z],[2.13,2.24,z*1.15],.13,0,horn);
        ell([1.65,1.28,z*1.21],[.047,.046,.024],rgb('#193b31'),7,4);
      }
      tube([2.12,1.07,0],[2.37,1.51,0],.13,0,horn);
      tube([-1.25,1.1,0],[-2.3,.94,0],.24,.08,skin);
      tube([-2.3,.94,0],[-2.83,1.14,0],.08,0,skin);
    }
  } else {
    const rex=d.type==='rex',early=d.type==='early',slim=d.type==='runner';
    ell([-.2,1.55,0],[1.07,slim?.43:.6,slim?.3:.47],skin);
    ell([.1,1.39,0],[.73,.32,slim?.27:.4],belly);
    for(const z of[-.34,.34]){
      ell([-.52,1.05,z],[.34,.62,.26],dark);
      tube([-.58,.8,z],[-.2,.24,z],.17,.1,skin);
      ell([.02,.13,z],[.4,.13,.19],skin);
      for(const o of[-.09,0,.09])tube([.13,.12,z+o],[.43,.09,z+o],.045,.015,horn,6);
    }
    tube([-1,1.62,0],[-2.27,1.57,0],.31,.16,skin);
    tube([-2.27,1.57,0],[-3.4,1.97,0],.16,.01,skin);
    tube([.52,1.77,0],[1.02,2.28,0],rex?.41:.24,rex?.36:.2,skin);
    if(!rex)tube([1.02,2.28,0],[1.43,2.74,0],.2,.13,skin);
    const hp=rex?[1.52,2.38,0]:[1.7,2.78,0],hr=rex?[.74,.43,.36]:[.45,.21,.19];
    ell(hp,hr,skin);ell([hp[0]+.07,hp[1]-.2,0],[hr[0]*.94,.12,hr[2]*.9],belly);
    for(const s of[-1,1]){
      ell([hp[0]+.1,hp[1]+.12,s*hr[2]*.94],[.048,.052,.026],rgb('#18382f'),8,5);
      ell([hp[0]+.12,hp[1]+.135,s*hr[2]*1.005],[.016,.016,.011],rgb('#fff1c3'),6,4);
      const arm=rex?.34:early?.76:.57;
      tube([.62,1.7,s*.38],[.85,1.7-arm,s*.5],rex?.09:.12,.06,skin);
      tube([.85,1.7-arm,s*.5],[1.03,1.64-arm,s*.48],.065,.045,skin);
      for(let i=0;i<(rex?2:3);i++)tube([1.01,1.65-arm,s*.48+i*.04],[1.19,1.58-arm,s*.48+i*.05],.021,.008,horn,5);
      if(rex)for(let i=0;i<6;i++)tube([1.22+i*.15,2.16,s*.29],[1.22+i*.15,2.05,s*.27],.035,0,horn,5);
    }
  }
  return new Float32Array(v);
}
function lookAt(eye,target) {
  const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
function perspective(aspect) {
  const f=1/Math.tan(.66/2),near=.1,far=80,nf=1/(near-far);
  return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);
}
export function createWorld(canvas,d,onFailure) {
  const gl=canvas.getContext('webgl',{antialias:true,alpha:true,preserveDrawingBuffer:true});
  if(!gl)throw Error('WebGL unavailable');
  const controller=new AbortController(),signal=controller.signal;
  let disposed=false,frame=0,auto=false,yaw=-.32,pitch=.31,distance=14,drag=null;
  const shaders=[];
  function shader(type,src){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec3 position;attribute vec3 color;uniform mat4 view;uniform mat4 projection;varying vec3 vColor;void main(){vColor=color;gl_Position=projection*view*vec4(position,1.0);}'));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.0);}'));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer=gl.createBuffer(),vertices=buildWorld(d);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  for(const [name,offset] of [['position',0],['color',12]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,24,offset);}
  const view=gl.getUniformLocation(program,'view'),projection=gl.getUniformLocation(program,'projection');gl.enable(gl.DEPTH_TEST);
  function render(){
    if(disposed||gl.isContextLost())return;
    const r=canvas.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*scale)),h=Math.max(1,Math.round(r.height*scale));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(projection,false,perspective(w/h));
    gl.uniformMatrix4fv(view,false,lookAt([Math.sin(yaw)*Math.cos(pitch)*distance,1+Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance],[0,.9,0]));
    gl.drawArrays(gl.TRIANGLES,0,vertices.length/6);
  }
  let last=0;
  function tick(t){frame=0;if(disposed||!auto||document.hidden)return;if(last)yaw+=Math.min(t-last,50)*.00013;last=t;render();frame=requestAnimationFrame(tick);}
  function spin(value){auto=value;last=0;cancelAnimationFrame(frame);if(auto&&!document.hidden)frame=requestAnimationFrame(tick);}
  const resize=new ResizeObserver(render);resize.observe(canvas);
  canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);},{signal});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.009;pitch=Math.max(.08,Math.min(1,(pitch+(e.clientY-drag[1])*.005)));drag=[e.clientX,e.clientY];render();},{signal});
  for(const type of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>drag=null,{signal});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.13;if(e.key==='ArrowRight')yaw+=.13;if(e.key==='ArrowUp')pitch=Math.min(1,pitch+.08);if(e.key==='ArrowDown')pitch=Math.max(.08,pitch-.08);if(e.key==='+')zoom(-1);if(e.key==='-')zoom(1);if(e.key==='Home')reset();render();},{signal});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!disposed){spin(false);onFailure();}},{signal});
  document.addEventListener('visibilitychange',()=>{last=0;cancelAnimationFrame(frame);if(auto&&!document.hidden)frame=requestAnimationFrame(tick);},{signal});
  function zoom(delta){distance=Math.max(9,Math.min(22,distance+delta));render();}
  function reset(){yaw=-.32;pitch=.31;distance=14;render();}
  render();
  return {zoom,reset,spin,dispose(){disposed=true;controller.abort();resize.disconnect();cancelAnimationFrame(frame);gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));gl.getExtension('WEBGL_lose_context')?.loseContext();}};
}
