/* Standard-controller bridge. Native select events own pointing and hand pinch. */
const pressed=(pad,i)=>!!pad?.buttons?.[i]?.pressed || Number(pad?.buttons?.[i]?.value)>.55;
export function mappedPad(sources,{panel=false,suppressed=new Set(),held=new Set(),enabled=true}={}){
 const out={id:'Sky Cycle XR bridge',index:1000,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
 const set=i=>out.buttons[i]={pressed:true,value:1};
 if(!enabled)return out;
 for(const source of sources){const p=source.gamepad;if(source.hand||p?.mapping!=='xr-standard')continue;
  const left=source.handedness==='left';
  if(left){out.axes[0]=Number.isFinite(p.axes[2])?p.axes[2]:0;out.axes[1]=panel&&Number.isFinite(p.axes[3])?p.axes[3]:0;
   if(pressed(p,0)&&!suppressed.has(source)&&!panel)set(7);
   if(pressed(p,5))set(8);
   if(!panel&&p.axes[3]<-.65)set(12);if(!panel&&p.axes[3]>.65)set(13);
  }else if(source.handedness==='right'){
   if(pressed(p,4))set(0);if(pressed(p,5))set(panel?1:9);
   if(pressed(p,0)&&!suppressed.has(source)&&!panel)set(5);
   if(pressed(p,1)&&!panel)set(4);
  }
 }
 const action={jump:0,paper:5,whip:4,boost:7,pause:9,back:1};
 for(const name of held){if(name==='left')out.axes[0]=-1;else if(name==='right')out.axes[0]=1;else if(name in action)set(action[name]);}
 return out;
}
export function sourcesNeutral(sources){return sources.every(s=>!s.gamepad||((s.gamepad.buttons||[]).every(b=>!b.pressed&&!(b.value>.2))&&(s.gamepad.axes||[]).every(v=>Math.abs(v||0)<.25)));}
export function pointInRects(x,y,rects){return rects.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)||null;}
