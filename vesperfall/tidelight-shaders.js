/* Tidelight: original bounded water shader for existing WebGL/A-Frame renderer. */
(function(root){'use strict';
 const MODES=['off','balanced','cinematic'];
 function settings(raw={}){raw=raw&&typeof raw==='object'?raw:{};return {mode:MODES.includes(raw.mode)?raw.mode:'balanced',ripples:raw.ripples!==false,caustics:raw.caustics!==false};}
 function policy(raw,ctx={}){const s=settings(raw),enabled=s.mode!=='off'&&!ctx.ar,calm=!!ctx.reduced||ctx.effects===false;return {...s,enabled,animated:enabled&&!calm,detail:enabled&&s.mode==='cinematic'&&!ctx.xr,maxPools:ctx.xr?3:8,maxRipples:ctx.xr?4:10};}
 const vertex=`uniform float uTime,uAnimated,uDetail;varying vec3 vWorld;varying vec3 vNormalW;varying vec2 vUv2;
 void main(){vUv2=uv;vec3 p=position;float t=uTime*uAnimated;float w=sin((p.x+p.z)*1.7+t*1.15)+sin(p.x*2.9-p.z*2.1-t*.82);p.z+=w*.008*(.35+.65*uDetail);vec4 wp=modelMatrix*vec4(p,1.);vWorld=wp.xyz;vNormalW=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*wp;}`;
 const fragment=`uniform float uTime,uAnimated,uDetail,uOpacity,uCaustics;uniform vec3 uDeep,uShallow;uniform vec4 uRipples[10];varying vec3 vWorld;varying vec3 vNormalW;varying vec2 vUv2;
 float ring(vec2 p,vec2 c,float age){float d=length(p-c),r=age*.95;return exp(-pow((d-r)*22.,2.))*(1.-smoothstep(.15,1.,age));}
 float wave(vec2 p,float t){return sin(p.x*8.+t)+sin(p.y*10.-t*1.21)+sin((p.x+p.y)*6.+t*.72);}
 void main(){float t=uTime*uAnimated;vec2 p=vWorld.xz;float w=wave(p*.24,t*.8);float small=wave(p*.82,-t*.45);float rip=0.;for(int i=0;i<10;i++){vec4 q=uRipples[i];if(q.w>0.)rip+=ring(p,q.xy,q.z);}
 vec3 V=normalize(cameraPosition-vWorld);float fres=pow(1.-clamp(dot(normalize(vNormalW),V),0.,1.),3.2);float depthHint=smoothstep(.05,.95,.5+.5*sin(vUv2.y*3.14159));vec3 base=mix(uDeep,uShallow,.45+depthHint*.22+w*.018);
 float caust=(sin((p.x+p.y)*5.2+t*1.5)*sin((p.x-p.y)*4.4-t*1.18));caust=pow(max(0.,caust),3.)*uCaustics;
 vec3 sky=mix(vec3(.18,.32,.39),vec3(.55,.69,.73),.5+.5*normalize(V).y);vec3 c=mix(base,sky,.18+fres*.62);c+=vec3(.36,.62,.66)*(caust*.16+rip*.32);c+=small*.006;
 float a=clamp(uOpacity+.20*fres+.10*rip,0.,.88);gl_FragColor=vec4(c,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 const api={MODES,settings,policy,vertex,fragment};root.TidelightShaders=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
