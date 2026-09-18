import * as T from './vendor/three.module.js';
import {readingPages} from './xr-reading.mjs';
/* Appears only after game feedback; not a permanent floating gameplay menu. */
export function createXRNotice(){
 const canvas=document.createElement('canvas');canvas.width=896;canvas.height=224;const ctx=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const mesh=new T.Mesh(new T.PlaneGeometry(1.12,.28),new T.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));mesh.renderOrder=10005;mesh.visible=false;let until=0,text='';
 function show(value,head){if(!value||!head)return;text=String(value);ctx.fillStyle='#13232aed';ctx.fillRect(0,0,896,224);ctx.fillStyle='#f2e5bd';ctx.font='bold 24px sans-serif';ctx.fillText('FIELD MESSAGE / HOLD B FOR MENU',22,34);ctx.fillStyle='#ffffff';ctx.font='27px sans-serif';const pages=readingPages(text,56,4);pages[0].forEach((line,i)=>ctx.fillText(line,22,76+i*32));if(pages.length>1){ctx.font='20px sans-serif';ctx.fillText('Full message in MENU / LAST FIELD MESSAGE',22,212);}texture.needsUpdate=true;const f=new T.Vector3(0,0,-1).applyQuaternion(head.orientation),yaw=Math.atan2(-f.x,-f.z),offset=new T.Vector3(0,-.24,-1.45).applyAxisAngle(new T.Vector3(0,1,0),yaw);mesh.position.copy(head.position).add(offset);mesh.rotation.set(0,yaw,0);until=performance.now()+6500;mesh.visible=true;}
 return {mesh,show,update(playing){mesh.visible=playing&&performance.now()<until;},clear(){until=0;mesh.visible=false;},stats:()=>({visible:mesh.visible,text}),dispose(){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();texture.dispose();}};
}
