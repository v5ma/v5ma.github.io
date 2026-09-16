/* Original scene geometry and 2D wayfinding. No physics or score writes. */
import {FORK,FORK_SIGNS,brakeMarks} from './waterwheel-fork-core.mjs';
import {paths} from './waterwheel-layout-core.mjs';
const MARKS=brakeMarks(paths().find(p=>p.sky.id===FORK.launch));
const SIGNS=[
 [480,1990,'SOUTH QUAY','DELIVER AT YOUR OWN PACE'],
 [810,1960,'PARCEL PORCH','SHORT DETOUR / ROAD RETURN'],
 [1820,1990,'BACK TO MARKET','THE EXPRESS LINE IS LATER'],
 [2440,1900,'SERVICE BRIDGE','READ THE COURT AHEAD'],
 [2990,1900,'CHOOSE YOUR LINE','KEEP SPEED HIGH / BRAKE AND RELEASE LOW'],
 [4260,1820,'CANAL COLLECTOR','LOW LINE REJOINS FOR DELIVERIES'],
 [5170,1930,'MILLWORKERS COURT','DELIVERIES / ROOM TO OBSERVE'],
 [7010,1900,'WHEELHOUSE AHEAD','SKY AND ROAD REJOIN'],
 [8860,1960,'WHEELHOUSE DEPOT','FINISH THE PREVIEW']
];
export function populate({course,root,metal,far,sign}){
 const wheel=course.gp.waterwheel.landmark,{x,y,radius:r}=wheel;
 root.userData.waterwheelPreview={revision:2,signs:SIGNS.length,landmark:wheel};
 // The wheel stands behind the cycling plane. It is not a misleading collision target.
 far.box(x+120,-2160+220,-340,320,440,180,'#bdad8d');far.box(x+120,-2160+432,-330,352,26,218,'#557880');
 for(let i=0;i<32;i++){const a=i/32*Math.PI*2,b=(i+1)/32*Math.PI*2;metal.rod([x+Math.cos(a)*r,-y+Math.sin(a)*r,-210],[x+Math.cos(b)*r,-y+Math.sin(b)*r,-210],9,'#8f7655');}
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;metal.rod([x,-y,-210],[x+Math.cos(a)*r,-y+Math.sin(a)*r,-210],5,'#c8ae72');}
 metal.ell(x,-y,-196,27,27,10,'#586d77');
 for(const [sx,sy,title,detail]of SIGNS){const s=sign(title+'\n'+detail,sx,-sy,-74,sx===2990?350:230,sx===2990?80:62);if(s){s.name='Waterwheel wayfinding: '+title;s.userData.waterwheelCue=true;}}
 if(!course.gp.waterwheel.groundOnly){
  root.userData.waterwheelFork={id:FORK.id,marks:MARKS.length,signs:FORK_SIGNS.length,lowerDelivery:FORK.delivery};
  for(const m of MARKS)metal.rod([m.x,-m.y-12,-20],[m.x,-m.y-12,20],3,'#f8cf77');
  for(const c of FORK_SIGNS){const o=sign(c.title+'\n'+c.detail,c.x,-c.y,-90,c.w,c.h);if(o){o.name='Waterwheel fork: '+c.title;o.userData.waterwheelForkCue=true;}}
 }
 sign('WATERWHEEL / R2 PREVIEW\nNO CAMPAIGN AWARDS',220,-1910,-150,285,64);
}
export function draw2D(g,camX,camY,width,height){
 const data=window.__ground?.meta?.waterwheel;if(!data?.preview)return;
 const {x,y,radius:r}=data.landmark;
 g.save();g.fillStyle='#547f89';g.fillRect(camX,2134,width,26);
 if(x+r>camX&&x-r<camX+width){g.fillStyle='#b7a281';g.fillRect(x+60,1720,330,438);g.strokeStyle='#695f4a';g.lineWidth=11;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();g.lineWidth=5;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);g.stroke();}g.fillStyle='#496875';g.beginPath();g.arc(x,y,24,0,Math.PI*2);g.fill();}
 for(const [sx,sy,title,detail]of SIGNS){if(sx+135<camX||sx-135>camX+width||sy+40<camY||sy-40>camY+height)continue;g.fillStyle='#173c46';g.fillRect(sx-135,sy-31,270,62);g.fillStyle='#dfc68e';g.fillRect(sx-135,sy-31,5,62);g.textAlign='center';g.font='bold 14px system-ui';g.fillText(title,sx,sy-7);g.font='11px system-ui';g.fillStyle='#ecf0d9';g.fillText(detail,sx,sy+14,254);}
 if(!data.groundOnly){
  g.strokeStyle='#f8cf77';g.lineWidth=5;for(const m of MARKS){g.beginPath();g.moveTo(m.x-5,m.y-8);g.lineTo(m.x+5,m.y-3);g.stroke();}
  for(const c of FORK_SIGNS){if(c.x+c.w/2<camX||c.x-c.w/2>camX+width)continue;g.fillStyle='#173c46';g.fillRect(c.x-c.w/2,c.y-c.h/2,c.w,c.h);g.fillStyle='#f8cf77';g.textAlign='center';g.font='bold 15px system-ui';g.fillText(c.title,c.x,c.y-8,c.w-16);g.fillStyle='#ecf0d9';g.font='12px system-ui';g.fillText(c.detail,c.x,c.y+16,c.w-16);}
 }
 g.restore();
}
