import * as T from '../vendor/three.module.js';
import {CHANNEL_NODES,channelStatus} from './open-channel.mjs';

// World-space equipment and a state-driven diagram, not a head-locked menu.
export function createChannelView({world,box,label,createCanvas=()=>document.createElement('canvas')}){
 const group=new T.Group();group.name='Open Channel / live power routing';group.visible=false;world.add(group);
 const reserve=box(group,0x426e74,17.5,.68,8.3,.85,1.35,.55);
 const feeder=box(group,0x536c75,-18.1,11.5,-3.65,.5,1.35,.3);
 const uplink=box(group,0x426e74,-21.5,11.65,-3.58,.65,.2,.4);
 const lamps=[box(group,0xe0b663,17.5,1.27,7.99,.25,.15,.035),
  box(group,0xe0b663,-18.1,11.98,-3.83,.2,.14,.035),
  box(group,0xe0b663,-21.5,11.85,-3.63,.14,.13,.1)];
 for(const lamp of lamps)lamp.material=lamp.material.clone();
 const signs=CHANNEL_NODES.map(n=>label(n.id==='reserve'?'OPTION / RESERVE CELL +2':n.id==='feeder'?'PUBLIC LIGHTS / DIVERT +2':'UPLINK / NEEDS 3',n.x,n.y+2.05,n.z,2.35,.3,'#203e48','#fff0bf',group));
 const canvas=createCanvas();canvas.width=768;canvas.height=400;const ctx=canvas.getContext('2d');
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const panel=new T.Mesh(new T.PlaneGeometry(2.8,1.46),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,toneMapped:false}));
 panel.position.set(-20.55,12.45,-6.22);group.add(panel);
 let signature='',draws=0,last=null;
 function draw(state){
  ctx.fillStyle='#152c38';ctx.fillRect(0,0,768,400);ctx.strokeStyle='#cfb991';ctx.lineWidth=4;ctx.strokeRect(8,8,752,384);
  ctx.textAlign='left';ctx.fillStyle='#f7e6c3';ctx.font='bold 33px sans-serif';ctx.fillText('OPEN CHANNEL / POWER ROUTING',28,51);
  ctx.font='28px sans-serif';ctx.fillText('MAIN 4  +  RESERVE '+(state.reserve?'2 CONNECTED':'0'),28,112);
  ctx.fillText('PUBLIC LIGHTS '+(state.street?'2 UNITS / ON':'0 UNITS / DIVERTED'),28,162);
  const transmitted=state.stage>=2;
  ctx.fillStyle=transmitted||state.ready?'#98efc1':'#ffd18b';ctx.font='bold 40px sans-serif';
  ctx.fillText(transmitted?'REPLY SENT':state.available+' FREE / 3 REQUIRED',28,234);
  ctx.fillStyle='#a8dae4';ctx.font='23px sans-serif';
  ctx.fillText(transmitted?(state.stage>=3?'PUBLIC SERVICE RESTORED':'LISTEN AT THE ARCHIVE RECEIVER'):state.ready?'READY: INTERACT AT THE UPLINK TO SEND':'RESERVE CELL OR FEEDER: BOTH ROUTES WORK',28,292);
  ctx.fillStyle='#f7e6c3';ctx.font='21px sans-serif';ctx.fillText(transmitted?(state.outcome==='reserve'?'RESERVE ROUTE / STREET LIGHTS STAYED ON':'DIRECT ROUTE / BRIEF PUBLIC-LIGHT DIVERSION'):'Switches are reversible. No timer. No lost progress.',28,358);
  texture.needsUpdate=true;draws++;
 }
 function update(s,yaw=0){
  const state=channelStatus(s);last=state;const shown=state.active||state.stage===4;group.visible=shown;
  if(!shown)return;for(const sign of signs)sign.rotation.y=yaw;
  // Only uncompleted routing needs distant option markers. Completed hardware
  // remains visible without adding permanent floating route labels.
  signs.forEach((sign,i)=>{sign.visible=state.active&&state.stage===1&&(i!==0||!state.reserve);});
  const colors=[state.reserve?0x85e2ae:0xd2aa59,state.street?0x85e2ae:0xd2aa59,state.stage>=2||state.ready?0x85e2ae:0xd2aa59];
  lamps.forEach((lamp,i)=>{lamp.material.color.setHex(colors[i]);lamp.material.emissive.setHex(colors[i]);lamp.material.emissiveIntensity=.18;});
  const next=[state.stage,state.reserve,state.street,state.outcome].join('/');if(signature!==next){signature=next;draw(state);}
 }
 return {update,inspect:()=>({visible:group.visible,diagramDraws:draws,worldSpace:true,controlCount:CHANNEL_NODES.length,state:last?{...last}:null}),
  dispose(){group.removeFromParent();texture.dispose();panel.geometry.dispose();panel.material.dispose();for(const lamp of lamps)lamp.material.dispose();}};
}
