/* Original pool-surface and underwater tile lighting. No render-target allocations. */
import * as T from './vendor/three.module.js';
export function waterBudget(mode='balanced',xr=false,reduced=false,enabled=true){const moving=enabled&&!reduced;return{clock:moving,detail:enabled&&mode!=='low'&&!xr?1:0,ripples:moving?8:0,caustics:moving&&mode!=='low'&&!xr?.24:0};}
export function makePoolWater(pool){return new T.ShaderMaterial({name:'Tideglass / transparent wave surface',transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,fog:true,
 uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{clock:{value:0},detail:{value:1},depth:{value:pool.high-pool.floor},poolCenter:{value:new T.Vector2(pool.x,pool.z)},poolHalf:{value:new T.Vector2(pool.w/2,pool.d/2)},ripples:{value:Array.from({length:8},()=>new T.Vector4(0,0,-1,0))}}]),
 vertexShader:`varying vec3 vPoolWorld;
 #include <fog_pars_vertex>
 void main(){vec4 world=modelMatrix*vec4(position,1.);vPoolWorld=world.xyz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
 }`,
 fragmentShader:`uniform float clock;uniform float detail;uniform float depth;uniform vec2 poolCenter;uniform vec2 poolHalf;uniform vec4 ripples[8];varying vec3 vPoolWorld;
 #include <fog_pars_fragment>
 void main(){vec2 p=vPoolWorld.xz;
 vec2 slope=vec2(cos(p.x*1.4+p.y*.65+clock*.9),sin(p.y*1.6-p.x*.55-clock*.72))*.045;
 slope+=detail*.026*vec2(sin(p.y*4.8+clock*1.5),cos(p.x*4.3-clock*1.2));
 for(int i=0;i<8;i++){vec4 r=ripples[i];if(r.z>=0.&&r.z<3.5){vec2 d=p-r.xy;float l=length(d);float front=l-r.z*2.6;float envelope=exp(-front*front*3.0)*exp(-r.z*.85);slope+=d/max(.2,l)*cos(front*11.)*envelope*r.w*.16;}}
 vec3 n=normalize(vec3(-slope.x,1.,-slope.y));vec3 eye=normalize(cameraPosition-vPoolWorld);if(eye.y<0.)n=-n;
 float fresnel=.025+.975*pow(1.-abs(dot(eye,n)),5.);vec3 reflected=reflect(-eye,n);
 vec3 sky=mix(vec3(.64,.77,.76),vec3(.23,.47,.62),clamp(reflected.y*.8+.2,0.,1.));
 float cloud=.5+.5*sin(reflected.x*7.+sin(reflected.z*4.)+clock*.015);sky=mix(sky,vec3(.86,.89,.79),smoothstep(.73,.97,cloud)*.36);
 vec3 sun=normalize(vec3(-.4,.83,.38));float glint=pow(max(0.,dot(reflected,sun)),180.)*.8;
 vec3 teal=mix(vec3(.19,.49,.43),vec3(.055,.29,.30),clamp(depth/5.,0.,1.));
 float edge=1.-smoothstep(0.,.17,min(poolHalf.x-abs(p.x-poolCenter.x),poolHalf.y-abs(p.y-poolCenter.y)));
 vec3 color=mix(teal,sky,clamp(fresnel+.06,0.,1.))+glint*vec3(1.,.89,.6)+edge*.07;
 float opacity=clamp(.19+depth*.023+fresnel*.55+glint*.12,.19,.83);
 gl_FragColor=vec4(color,opacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
 }`});}
export function patchPoolTiles(shader,uniforms){
 if(!shader.vertexShader.includes('#include <project_vertex>')||!shader.fragmentShader.includes('#include <color_fragment>'))throw Error('Pool tiles require the pinned standard shader chunks');
 Object.assign(shader.uniforms,uniforms);
 shader.vertexShader='varying vec3 vTideTile;varying vec3 vTideNormal;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
 vTideTile=(modelMatrix*vec4(transformed,1.)).xyz;vTideNormal=normalize(mat3(modelMatrix)*objectNormal);`);
 shader.fragmentShader='uniform float tideClock;uniform float tideLevel;uniform float tideCaustic;varying vec3 vTideTile;varying vec3 vTideNormal;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec2 tileUV=abs(vTideNormal.y)>.5?vTideTile.xz:abs(vTideNormal.x)>.5?vTideTile.zy:vTideTile.xy;
 vec2 cells=fract(tileUV*2.);float grout=1.-smoothstep(.012,.028,min(min(cells.x,1.-cells.x),min(cells.y,1.-cells.y)));
 float wet=1.-smoothstep(tideLevel-.06,tideLevel+.06,vTideTile.y);
 diffuseColor.rgb*=mix(vec3(.83,.95,.94),vec3(.49,.72,.68),wet*.45);
 diffuseColor.rgb*=1.-grout*.19;
 vec2 flow=tileUV*2.4+vec2(sin(tileUV.y*1.4+tideClock*.55),cos(tileUV.x*1.1-tideClock*.48))*.65;
 float lines=pow(1.-abs(sin(flow.x+sin(flow.y)*.85)*sin(flow.y+cos(flow.x)*.65)),12.);
 diffuseColor.rgb+=vec3(.62,.91,.80)*lines*tideCaustic*wet;
 `);
 return shader;
}
