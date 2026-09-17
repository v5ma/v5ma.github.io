/* Life-size first-person AR; alpha composition, not a second game world.
 * No room sensing, physical obstacle detection or passthrough certification. */
import {Color} from './vendor/three.module.js';
export function createARView({scene,renderer}){
 let active=false,saved=null;const hidden=new Map();
 function set(on){
  if(on&&!active){saved={fog:scene.fog,background:scene.background,color:renderer.getClearColor(new Color()),alpha:renderer.getClearAlpha()};active=true;}
  if(!on&&active){active=false;scene.fog=saved.fog;scene.background=saved.background;renderer.setClearColor(saved.color,saved.alpha);for(const[o,v]of hidden)o.visible=v;hidden.clear();}
 }
 function update(){if(!active)return;scene.fog=null;scene.background=null;renderer.setClearColor(0x000000,0);const sky=scene.getObjectByName('Aether sky');if(sky){if(!hidden.has(sky))hidden.set(sky,sky.visible);sky.visible=false;}}
 return {set,update,get active(){return active},stats:()=>({active,alpha:active?renderer.getClearAlpha():null,lifeSize:true,roomSensing:false})};
}
