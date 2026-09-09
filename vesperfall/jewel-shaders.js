/* Original GLSL and cut-gem topology; uses documented Three.js material APIs.
 * No downloaded ShaderToy code or cross-engine runtime dependencies. */
(function(root){'use strict';
 const MODES=['classic','balanced','jewel'];
 function settings(raw={}){raw=raw&&typeof raw==='object'?raw:{};return {mode:MODES.includes(raw.mode)?raw.mode:'balanced',effects:raw.effects!==false,reduced:raw.reduced===true};}
 function policy(raw,xr=false){const s=settings(raw),on=s.mode!=='classic';return {...s,enabled:on,transmission:on&&!xr&&s.mode==='jewel'?.86:0,dispersion:on&&!xr&&s.mode==='jewel'?.28:0,particles:on&&s.effects&&!s.reduced?(xr?96:256):0,shafts:on&&s.effects&&!s.reduced&&!xr,xr:!!xr};}
 // Closed indexed cut, with table, crown, narrow girdle and pointed pavilion.
 // Normals are intentionally split per triangle at conversion, never smoothed.
 function gemData(sides=8){if(!Number.isInteger(sides)||sides<5||sides>16)throw Error('Gem sides must be 5–16');const positions=[],indices=[],rings=[[.43,.52],[.94,.13],[1,.04],[.96,-.08],[.26,-.74]];
  for(const [r,y]of rings)for(let i=0;i<sides;i++){const a=i*Math.PI*2/sides;positions.push(Math.cos(a)*r,y,Math.sin(a)*r);}
  const top=positions.length/3;positions.push(0,.52,0);const bottom=positions.length/3;positions.push(0,-.88,0);
  for(let i=0;i<sides;i++){const j=(i+1)%sides;indices.push(top,j,i);for(let r=0;r<rings.length-1;r++){const a=r*sides+i,b=r*sides+j,c=(r+1)*sides+i,d=(r+1)*sides+j;indices.push(a,b,c,b,d,c);}indices.push(bottom,4*sides+i,4*sides+j);}
  return {positions,indices};
 }
 const vertex=`varying vec2 vUv; varying vec3 vN; varying vec3 vEye;
 void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vEye=-p.xyz;gl_Position=projectionMatrix*p;}`;
 const shield=`uniform float uTime,uHit,uStrength;uniform vec2 uImpact;varying vec2 vUv;varying vec3 vN,vEye;
 void main(){vec2 p=(vUv-.5)*2.;float r=length(p);if(r>.995)discard;
 float rim=pow(1.-abs(dot(normalize(vN),normalize(vEye))),3.);
 vec2 q=p*9.;float lattice=pow(max(0.,cos(q.x+q.y*.577)*cos(q.y*1.154)),18.);
 vec3 film=.55+.45*cos(vec3(0.,2.1,4.2)+r*5.-rim*5.+uTime*.18);
 float ring=exp(-pow((length(vUv-uImpact)-(1.-uHit)*.85)*40.,2.))*uHit;
 float edge=pow(r,14.);float a=.07+lattice*.08+rim*.22+edge*.5+ring*.4;
 gl_FragColor=vec4(mix(vec3(.17,.62,.66),film,.45)+ring*vec3(1.,.65,.25),a*mix(.5,1.,uStrength));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 const portal=`uniform float uTime,uOpen,uCalm;varying vec2 vUv;varying vec3 vN,vEye;
 void main(){vec2 p=(vUv-.5)*2.;float r=length(p);if(r>1.)discard;float a=atan(p.y,p.x),t=uTime*(1.-uCalm);
 float spiral=pow(max(0.,sin(a*6.-r*19.+t*1.1)),10.);
 float rim=exp(-pow((r-.87)*34.,2.));float seal=pow(max(0.,cos(a*24.)),20.)*exp(-pow((r-.72)*55.,2.));
 vec3 c=mix(vec3(.19,.28,.39),vec3(.13,.85,.73),uOpen);c+=vec3(.75,.50,.22)*(rim+seal)*1.2;
 gl_FragColor=vec4(c+spiral*.25*uOpen,(.05+spiral*.12*uOpen+rim*.82+seal*.5)*(1.-smoothstep(.96,1.,r)));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 const pool=`uniform sampler2D uGlass;uniform float uTime,uCalm;varying vec2 vUv;varying vec3 vN,vEye;
 void main(){vec2 p=vUv-.5;float fade=1.-smoothstep(.22,.5,length(p));vec2 uv=vUv+sin(vUv.yx*10.+uTime*.2*(1.-uCalm))*.004;
 vec3 c=texture2D(uGlass,uv).rgb;float bright=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*1.6,fade*bright*.24);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 const shaft=`uniform float uTime;varying vec2 vUv;varying vec3 vN,vEye;
 void main(){float edge=pow(max(0.,sin(vUv.x*3.14159)),3.);float ends=sin(vUv.y*3.14159);float dust=.85+.15*sin(vUv.y*12.-uTime*.12);gl_FragColor=vec4(.83,.73,.48,edge*ends*dust*.045);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 const particleVertex=`attribute vec3 aVelocity,aColor;attribute float aBorn,aLife,aSize;uniform float uTime,uPixels;varying vec3 vColor;varying float vLife;
 void main(){float age=uTime-aBorn;vLife=(age>=0.&&age<aLife)?1.-age/aLife:0.;vColor=aColor;vec3 p=position+aVelocity*max(0.,age);p.y-=max(0.,age)*max(0.,age)*.4;
 vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=vLife>0.?clamp(aSize*uPixels/max(.5,-mv.z),1.,30.):0.;}`;
 const particleFragment=`varying vec3 vColor;varying float vLife;
 void main(){vec2 p=gl_PointCoord-.5;float d=length(p);if(d>.5||vLife<=0.)discard;float star=exp(-abs(p.x)*70.)*exp(-abs(p.y)*6.)+exp(-abs(p.y)*70.)*exp(-abs(p.x)*6.);float a=(exp(-d*d*60.)+.28*star)*vLife;gl_FragColor=vec4(vColor,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 const skyVertex=`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 const skyFragment=`uniform float uNight;varying vec3 vDir;
 void main(){vec3 d=normalize(vDir);float h=max(0.,d.y);vec3 low=mix(vec3(.66,.78,.82),vec3(.20,.31,.40),uNight),high=mix(vec3(.08,.25,.40),vec3(.025,.07,.14),uNight);
 vec3 c=mix(low,high,pow(h,.48));float sun=max(0.,dot(d,normalize(vec3(-.40,.72,.46))));c+=vec3(1.,.69,.34)*(pow(sun,420.)*7.+pow(sun,18.)*.2);
 float cloud=sin(d.x*23.+d.z*8.)*sin(d.z*19.-d.x*12.)*.5+.5;c+=pow(cloud,5.)*.065*(1.-h)*max(0.,d.y);
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 const api={MODES,settings,policy,gemData,vertex,shield,portal,pool,shaft,particleVertex,particleFragment,skyVertex,skyFragment};root.JewelShaders=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
