import * as T from './vendor/three.module.js';
import {OPTICS_BUILD,CoastalMaterials,CoastalBloom,readOptics,saveOptics,effectivePreset} from './coastal-shaders.js?v=coastal1';
const $=id=>document.getElementById(id);
const SHELL_VERTEX=`varying vec3 vView;varying vec3 vNormal;varying vec3 vLocal;
void main(){vLocal=position;vec4 mv=modelViewMatrix*vec4(position,1.0);vView=-mv.xyz;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}`;
const SHELL_FRAGMENT=`varying vec3 vView;varying vec3 vNormal;varying vec3 vLocal;uniform vec3 tint;uniform float fade;uniform float phase;
void main(){float rim=pow(1.0-abs(dot(normalize(vView),normalize(vNormal))),2.0);float stripe=pow(.5+.5*sin(vLocal.y*24.0-phase*3.0),9.0);float a=(rim*.58+stripe*.17)*fade;if(a<.008)discard;gl_FragColor=vec4(tint*(1.1+rim),a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

export class CoastalLight{
 constructor(ctx){
  this.ctx=ctx;this.s=readOptics(ctx.storage);this.fx=new CoastalMaterials(ctx.scene);this.bloom=new CoastalBloom(ctx.renderer);this.current='';this.failed=false;this.errorCount=0;this.age=0;this.shellCursor=0;this.events=0;
  this.geo=new T.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2);
  this.shells=Array.from({length:5},()=>{const m=new T.ShaderMaterial({vertexShader:SHELL_VERTEX,fragmentShader:SHELL_FRAGMENT,uniforms:{tint:{value:new T.Color()},fade:{value:0},phase:{value:0}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
   const mesh=new T.Mesh(this.geo,m);mesh.visible=false;ctx.scene.add(mesh);return {mesh,age:10,life:1.6,radius:12};});
  this.event=e=>{const d=e.detail||{};if(!['sonic','gravity','celebration'].includes(d.type))return;this.burst(d,d.type);};
  window.addEventListener('dino-spectacle',this.event);
  // Reuse existing event sources; no second gameplay/physics or musical director.
  const world=ctx.ranchWorld;this.originalHorn=world.horn;this.originalShot=world.shot;
  world.horn=(p,reduced)=>{this.originalHorn(p,reduced);if(!reduced)this.fx.impact(p,.5);};
  world.shot=(kind,a,b,targets)=>{this.originalShot(kind,a,b,targets);if(kind==='water')this.fx.impact(b,.18);};
  this.priorError=ctx.renderer.debug.onShaderError;
  ctx.renderer.debug.onShaderError=(...args)=>{this.failed=true;this.errorCount++;this.priorError?.(...args);const [gl,program,vs,fs]=args;console.error('Coastal Light shader rejected; restoring Classic materials.',gl.getProgramInfoLog(program),gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs));};
  this.installUI();this.apply();
 }
 installUI(){
  document.querySelector('#menu-dialog .menu-grid')?.insertAdjacentHTML('afterbegin','<button id="menu-coastal-light">Coastal Light / shaders</button>');
  document.body.insertAdjacentHTML('beforeend',`<dialog id="coastal-light-dialog" aria-labelledby="coastal-light-title"><p class="eyebrow">MATERIALS / LIGHT / MOTION</p><h2 id="coastal-light-title">Coastal Light.</h2><p>Sunlit turquoise shallows, moving water highlights, canopy wind and luminous research pulses. At dusk, your boat leaves a cyan bioluminescent wake.</p><button class="primary" id="coastal-close">Return to the reserve / B</button><div class="settings"><label>Shader preset <select id="coastal-preset"><option value="classic">Classic / original materials</option><option value="balanced">Balanced / materials only</option><option value="cinematic">Cinematic / soft bloom</option></select></label><label><input type="checkbox" id="coastal-water">Water, foam and boat wakes</label><label><input type="checkbox" id="coastal-wind">Canopy breeze</label><label><input type="checkbox" id="coastal-energy">Luminous sonic / gravity effects</label><label>Bloom intensity <input id="coastal-bloom" type="range" min="0" max="0.8" step="0.05"><output id="coastal-bloom-value"></output></label></div><p id="coastal-status" role="status"></p><p><b>Where to see it.</b> Sail from Wetland Dock into the ocean or start the coastal race in Dispatch. Drive through the Visitor Sonic Gate beyond the first junction. The forest moves around the existing roads. During Storm Response, the roads acquire patchy wet highlights.</p><p><b>Your settings stay in charge.</b> Dusk is in the main menu. Reduced Motion freezes shader time and removes wind, wakes and new expanding shells. Cinematic falls back to Balanced on Low graphics or without floating-point render-target support. It adds soft bloom, not ray-traced reflections or extra gameplay damage.</p><p class="pad-help">D-pad navigates. A selects or toggles. Left/right changes the focused value. B closes. X remains reload in the world. All earlier missions, saves and controls are preserved.</p></dialog>`);
  $('menu-coastal-light').onclick=()=>this.open();$('coastal-close').onclick=()=>this.ctx.close();
  $('coastal-light-dialog').addEventListener('cancel',e=>{e.preventDefault();this.ctx.close();});$('coastal-light-dialog').addEventListener('close',()=>this.ctx.input.clear());
  $('coastal-preset').value=this.s.preset;$('coastal-preset').onchange=e=>{this.s.preset=e.target.value;this.failed=false;this.apply();this.save();};
  for(const k of ['water','wind','energy']){$('coastal-'+k).checked=this.s[k];$('coastal-'+k).onchange=e=>{this.s[k]=e.target.checked;this.apply();this.save();};}
  $('coastal-bloom').value=this.s.bloom;$('coastal-bloom').oninput=e=>{this.s.bloom=Number(e.target.value);this.status();this.save();};
  this.status();
 }
 save(){if(!saveOptics(this.ctx.storage,this.s))this.ctx.notify('Shader settings could not be saved. Gameplay saves are unchanged.');}
 open(){this.status();this.ctx.show('coastal-light-dialog');}
 status(){const low=this.ctx.settings.low,preset=this.failed?'classic':effectivePreset(this.s,low,this.bloom.available);
  $('coastal-bloom-value').textContent=this.s.bloom.toFixed(2);
  $('coastal-status').textContent=this.failed?'A shader failed on this device. Classic is active; all gameplay remains available.':this.s.preset!==preset?`Requested ${this.s.preset}; ${preset} is active because ${low?'Low graphics is selected':'floating-point rendering is unavailable'}.`:`Active preset: ${preset}. ${preset==='cinematic'?'Three extra full-screen passes.':'No extra full-screen passes.'}`;
 }
 apply(){const effective=this.failed?'classic':effectivePreset(this.s,this.ctx.settings.low,this.bloom.available);this.fx.apply(this.s,effective);if(effective!=='cinematic')this.bloom.release();this.current=effective;this.status();}
 burst(p,type){
  if(!p||![p.x,p.z].every(Number.isFinite)||this.current==='classic'||!this.s.energy||this.ctx.settings.reduced)return;
  this.events++;const o=this.shells[this.shellCursor++%5];o.age=0;o.life=type==='gravity'?2.5:1.35;o.radius=type==='gravity'?17:12;
  o.mesh.position.set(p.x,.18,p.z);o.mesh.material.uniforms.tint.value.setHex(type==='gravity'?0xa991ff:type==='sonic'?0x60dce9:0xf4bb72);o.mesh.visible=true;this.fx.impact(p,.85);
 }
 update(dt){
  const {fleet,settings,director}=this.ctx;const effective=this.failed?'classic':effectivePreset(this.s,settings.low,this.bloom.available);if(effective!==this.current)this.apply();
  const boat=fleet.vehicles.find(v=>v.type==='boat');const p=boat?.drive.position;
  this.fx.update(dt,{night:settings.night,storm:director?.stormMix||0,reduced:settings.reduced,boat:p?{x:p.x,z:p.z,speed:Math.abs(boat.drive.speed)}:null});
  const step=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;
  for(const o of this.shells){if(settings.reduced||this.current==='classic'||!this.s.energy){o.mesh.visible=false;o.age=o.life;continue;}
   o.age+=step;o.mesh.visible=o.age<o.life;if(o.mesh.visible){const f=o.age/o.life;o.mesh.scale.set(o.radius*(.1+f),o.radius*(.05+f*.4),o.radius*(.1+f));o.mesh.material.uniforms.fade.value=(1-f)*.65;o.mesh.material.uniforms.phase.value=o.age;}
  }
 }
 render(scene,camera){
  const r=this.ctx.renderer;
  if(this.current==='cinematic'&&!this.failed){try{this.bloom.render(scene,camera,this.s.bloom);return;}catch(error){this.failed=true;this.errorCount++;this.apply();this.ctx.notify('Cinematic rendering fell back to Classic. Your game continues.');console.warn('Coastal Light fallback',error);}}
  r.render(scene,camera);
 }
 snapshot(){return {build:OPTICS_BUILD,requested:this.s.preset,effective:this.current,settings:{...this.s},reduced:this.ctx.settings.reduced,failed:this.failed,shaderErrors:this.errorCount,...this.fx.snapshot(),post:this.bloom.snapshot(),shells:this.shells.filter(o=>o.mesh.visible).length,events:this.events};}
 dispose(){window.removeEventListener('dino-spectacle',this.event);this.ctx.ranchWorld.horn=this.originalHorn;this.ctx.ranchWorld.shot=this.originalShot;this.ctx.renderer.debug.onShaderError=this.priorError;this.fx.dispose();this.bloom.dispose();for(const o of this.shells){o.mesh.removeFromParent();o.mesh.material.dispose();}this.geo.dispose();}
}
