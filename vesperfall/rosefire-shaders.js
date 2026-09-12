/* Rosefire: original, bounded WebGL shaders on the existing Three.js renderer.
 * No borrowed shader code, screen capture, depth buffer, new engine or CDN. */
(function(root){'use strict';
 const MODES=['off','balanced','cinematic'];
 function settings(raw={}){raw=raw&&typeof raw==='object'?raw:{};return {mode:MODES.includes(raw.mode)?raw.mode:'balanced',wet:raw.wet!==false,rose:raw.rose!==false,ward:raw.ward!==false};}
 function policy(raw,context={}){const s=settings(raw),enabled=s.mode!=='off'&&context.materialMode!=='classic',world=enabled&&!context.ar,calm=!!context.reduced||context.effects===false;return {...s,enabled,world,wet:world&&s.wet,rose:world&&s.rose,ward:enabled&&s.ward,sky:world,wakes:world&&!calm,animated:!calm,cinematic:world&&s.mode==='cinematic'&&!context.xr,roseCount:context.xr?2:4,maxWakes:context.xr?3:6};}
 // Pick nearest authored windows. Distance attenuation reaches zero before a
 // source is retired. These are artistic floor projections, not traced rays.
 function selectSources(sources,p,count=4){return sources.filter(s=>s.every(Number.isFinite)).map(s=>({s,d:Math.hypot(s[0]-p[0],s[1]-p[2])})).filter(o=>o.d<28).sort((a,b)=>a.d-b.d).slice(0,count).map(o=>o.s);}
 const noise=`float rfHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float rfNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rfHash(i),rfHash(i+vec2(1,0)),f.x),mix(rfHash(i+vec2(0,1)),rfHash(i+1.),f.x),f.y);}`;
 const surfaceVertex=`varying vec3 vRFWorld;varying float vRFUp;`;
 const surfacePosition=`#include <project_vertex>
 vec4 rfP=vec4(transformed,1.);
 #ifdef USE_BATCHING
 rfP=batchingMatrix*rfP;
 #endif
 #ifdef USE_INSTANCING
 rfP=instanceMatrix*rfP;
 #endif
 vRFWorld=(modelMatrix*rfP).xyz;
 vRFUp=inverseTransformDirection(transformedNormal,viewMatrix).y;`;
 const surfaceHeader=`uniform float uRFTime,uRFWet,uRFRose,uRFAnimated,uRFDetail;
 uniform vec4 uRFSources[4];uniform vec3 uRFPlayer;
 varying vec3 vRFWorld;varying float vRFUp;
 ${noise}
 vec3 rfGlass(vec2 p){float r=length(p),a=atan(p.y,p.x);float petal=.55+.18*cos(a*12.);float lead=1.-smoothstep(.012,.035,abs(r-petal));
 float cells=smoothstep(.03,.10,abs(sin(a*6.)))*smoothstep(.02,.05,abs(sin(r*19.)));
 vec3 c=.5+.5*cos(vec3(.3,2.4,4.4)+floor(a*6./3.14159)*.71+floor(r*5.)*1.8);
 c=mix(c,vec3(1.,.72,.30),lead*.75);return c*(.28+.72*cells)*(1.-smoothstep(.80,1.,r));}
 `;
 const surfaceColour=`#include <color_fragment>
 float rfUp=smoothstep(.82,.99,vRFUp);float rfNear=1.-smoothstep(18.,28.,distance(vRFWorld.xz,uRFPlayer.xz));
 float rfWet=0.;if(uRFWet>.0&&rfUp>.0){vec2 q=vRFWorld.xz*.24;float n=rfNoise(q)*.72+rfNoise(q*2.1)*.28;rfWet=smoothstep(.43,.69,n)*uRFWet*rfUp;diffuseColor.rgb*=1.-.16*rfWet;}
 `;
 const surfaceRoughness=`#include <roughnessmap_fragment>
 roughnessFactor=mix(roughnessFactor,.17,rfWet);`;
 const surfaceNormal=`#include <normal_fragment_maps>
 if(rfWet>.01&&uRFDetail>.5){vec2 w=vRFWorld.xz*8.;float t=uRFTime*.7*uRFAnimated;
 vec3 n=vec3(sin(w.y+t)*cos(w.x*.65),0.,cos(w.x-t)*sin(w.y*.7));normal=normalize(normal+mat3(viewMatrix)*n*(.016*rfWet));}`;
 const surfaceGlow=`#include <emissivemap_fragment>
 if(uRFRose>.0&&rfUp>.0&&rfNear>.0&&abs(vRFWorld.y)<.12){vec3 glass=vec3(0.);
 for(int i=0;i<4;i++){vec4 source=uRFSources[i];if(source.z>.1){vec2 q=(vRFWorld.xz-source.xy)/source.z;
 float sn=sin(source.w),cs=cos(source.w);q=mat2(cs,-sn,sn,cs)*q;q.y*=1.20;
 q+=sin(q.yx*7.+uRFTime*.17*uRFAnimated)*.007;
 glass+=rfGlass(q)*.70;}}
 totalEmissiveRadiance+=glass*uRFRose*rfNear;}
 `;
 const skyVertex=`varying vec3 vRFDir;void main(){vRFDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 const skyFragment=`uniform float uTime,uNight,uCalm,uDetail;varying vec3 vRFDir;${noise}
 void main(){vec3 d=normalize(vRFDir);float h=max(0.,d.y),t=uTime*.009*(1.-uCalm);
 vec3 low=mix(vec3(.65,.77,.82),vec3(.17,.27,.34),uNight),high=mix(vec3(.09,.25,.40),vec3(.013,.029,.075),uNight);
 vec3 c=mix(low,high,pow(h,.48));float sun=max(0.,dot(d,normalize(vec3(-.40,.72,.46))));c+=vec3(1.,.71,.41)*(pow(sun,460.)*6.+pow(sun,18.)*.16);
 vec2 q=d.xz/max(.18,d.y+.22);float n=rfNoise(q*2.4+vec2(t,-t*.6));
 c+=vec3(.09,.12,.15)*smoothstep(.51,.85,n)*(1.-h)*smoothstep(0.,.08,d.y);
 float band=sin(q.x*2.4+q.y*.75+n*2.+t)*.5+.5;
 float veil=pow(band,5.)*smoothstep(.04,.18,d.y)*(1.-smoothstep(.55,.93,d.y));
 c+=mix(vec3(.035,.25,.21),vec3(.14,.055,.27),n)*veil*uNight*mix(.3,.8,uDetail);
 if(uNight>.1&&uDetail>.5){vec2 grid=vec2(atan(d.z,d.x),asin(clamp(d.y,-1.,1.)))*170.;vec2 f=fract(grid)-.5;float star=step(.991,rfHash(floor(grid)))*(1.-smoothstep(.03,.13,length(f)));c+=vec3(.43,.52,.61)*star*smoothstep(.1,.5,d.y)*uNight;}
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 const ward=`uniform float uTime,uHit,uStrength,uCalm;uniform vec2 uImpact;varying vec2 vUv;varying vec3 vN,vEye;
 void main(){vec2 p=(vUv-.5)*2.;float r=length(p);if(r>.995)discard;float a=atan(p.y,p.x),t=uTime*.14*(1.-uCalm);
 float edge=exp(-pow((r-.945)*68.,2.));float ring=exp(-pow((r-.76)*65.,2.));
 float knots=pow(max(0.,cos(a*18.+t)),14.)*exp(-pow((r-(.845+.025*sin(a*9.-t)))*62.,2.));
 float weave=pow(max(0.,cos(p.x*25.+sin(p.y*6.))*cos(p.y*25.)),18.)*(1.-smoothstep(.60,.87,r));
 float fres=pow(1.-abs(dot(normalize(vN),normalize(vEye))),3.);
 vec3 film=.5+.5*cos(vec3(.4,2.5,4.6)+r*6.-fres*4.);
 float impact=exp(-pow((length(vUv-uImpact)-(1.-uHit)*.72)*34.,2.))*uHit*(1.-uCalm);
 vec3 c=mix(vec3(.11,.55,.67),film,.48)+vec3(1.,.72,.24)*(edge+knots)*.9+impact*vec3(1.,.78,.32);
 float alpha=(.024+edge*.62+ring*.21+knots*.43+weave*.04+fres*.16+impact*.26)*mix(.45,1.,uStrength);
 gl_FragColor=vec4(c,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 const wake=`uniform float uAge;uniform vec3 uColor;varying vec2 vUv;
 void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float radius=.18+uAge*.72;
 float ring=exp(-pow((r-radius)*50.,2.));float fine=exp(-pow((r-radius*.82)*85.,2.))*pow(max(0.,cos(a*20.)),10.);
 float fade=(1.-smoothstep(.45,1.,uAge))*smoothstep(0.,.06,uAge);gl_FragColor=vec4(uColor,(ring*.42+fine*.26)*fade);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 // Fail loudly on an incompatible upstream shader, not a silent visual loss.
 function patch(shader,uniforms){for(const key of ['vertexShader','fragmentShader'])if(typeof shader[key]!=='string')throw Error('Missing material shader');
 const replacements=[['vertexShader','#include <common>','#include <common>\n'+surfaceVertex],['vertexShader','#include <project_vertex>',surfacePosition],['fragmentShader','#include <common>','#include <common>\n'+surfaceHeader],['fragmentShader','#include <color_fragment>',surfaceColour],['fragmentShader','#include <roughnessmap_fragment>',surfaceRoughness],['fragmentShader','#include <normal_fragment_maps>',surfaceNormal],['fragmentShader','#include <emissivemap_fragment>',surfaceGlow]];
 for(const [key,needle,value]of replacements){if(!shader[key].includes(needle))throw Error('Rosefire shader chunk missing: '+needle);shader[key]=shader[key].replace(needle,value);}Object.assign(shader.uniforms,uniforms);return shader;
 }
 const api={MODES,settings,policy,selectSources,patch,skyVertex,skyFragment,ward,wake};root.RosefireShaders=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
