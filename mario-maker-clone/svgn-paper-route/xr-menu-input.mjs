/* Session-owned menu edges. No DOM, gameplay, save, rendering or timing owner.
 * Native select and sampled trigger share a latch; no duplicate activation.
 * Button contacts/proximity sensors are not commands or neutral requirements.
 */
export function trackedController(source) {
  if (!source || source.hand || !['left','right'].includes(source.handedness) || !source.gamepad) return false;
  if (source.gamepad.mapping === 'xr-standard') return true;
  // Only the documented Touch family may use these slots with an empty mapping.
  return source.gamepad.mapping === '' && source.gamepad.buttons?.length >= 6 &&
    (source.profiles || []).some(p => /^(oculus-touch(?:-v[23])?|meta-quest-touch-(?:plus|pro))$/.test(p));
}
export function buttonDown(pad,index) {
  const b=pad?.buttons?.[index]; return !!b?.pressed || Number(b?.value) > .55;
}
export function menuCommand(source,index,menu) {
  if(index===5) return menu?'back':source.handedness==='right'?'pause':null;
  if(!menu)return null;
  if(index===0)return 'select';
  if(index===4)return 'confirm';
  if(index===1)return source.handedness==='left'?'previous':'next';
  return null;
}
export function createMenuInput() {
  const states=new Map();let count=0,last='none';
  const slots=[0,1,4,5];
  function state(source) {
    let s=states.get(source);
    if(!s){s={down:new Map(slots.map(i=>[i,buttonDown(source.gamepad,i)])),used:new Set(slots.filter(i=>buttonDown(source.gamepad,i))),selecting:false,dir:0,repeat:0};states.set(source,s);}
    return s;
  }
  function event(source,command,index) {count++;last=source.handedness+' '+(index===0?'trigger':index===1?'grip':index===4?(source.handedness==='left'?'X':'A'):index===5?(source.handedness==='left'?'Y':'B'):'stick');return {source,command,index};}
  return {
    seed(sources){states.clear();for(const source of sources)if(trackedController(source))state(source);},
    sample(sources,{menu=false,visible=true,now=0}={}) {
      const events=[];for(const source of states.keys())if(!sources.includes(source))states.delete(source);
      for(const source of sources) {
        if(!trackedController(source))continue;const s=state(source);
        for(const i of slots){const down=buttonDown(source.gamepad,i),previous=s.down.get(i);s.down.set(i,down);
          if(!down && !(i===0&&s.selecting))s.used.delete(i);
          if(!visible){if(down)s.used.add(i);continue;}
          if(down&&!previous&&!s.used.has(i)){s.used.add(i);const command=menuCommand(source,i,menu);if(command)events.push(event(source,command,i));}
        }
        const x=source.gamepad.axes?.[2]||0,y=source.gamepad.axes?.[3]||0;
        const dir=Math.abs(y)>.6?(y>0?1:-1):Math.abs(x)>.6?(x>0?2:-2):0;
        if(!visible||!menu){s.dir=dir;s.repeat=now+400;continue;}
        if(!dir){s.dir=0;s.repeat=0;continue;}
        if(dir!==s.dir||now>=s.repeat){s.dir=dir;s.repeat=now+320;events.push(event(source,dir===1?'next':dir===-1?'previous':dir===2?'increase':'decrease',-1));}
      }
      // Update every latch before dispatch; caller applies at most one action to a menu.
      return events.sort((a,b)=>(a.command==='back'||a.command==='pause'?-1:0)-(b.command==='back'||b.command==='pause'?-1:0));
    },
    selectStart(source,{menu=false,visible=true}={}) {
      if(!trackedController(source))return null;const s=state(source);s.selecting=true;
      if(!menu||!visible||s.used.has(0)){s.used.add(0);return null;}
      s.used.add(0);return event(source,'select',0);
    },
    selectEnd(source){const s=states.get(source);if(!s)return;s.selecting=false;if(!buttonDown(source.gamepad,0)){s.used.delete(0);s.down.set(0,false);}},
    get diagnostics(){return {sources:states.size,actions:count,last};}
  };
}

// Accumulated pose movement, not just a changed label, switches back to aiming.
export function aimChanged(previous,current){
  if(!previous)return true;
  return [12,13,14].some(i=>Math.abs(current[i]-previous[i])>.005)||
    [0,1,2,4,5,6,8,9,10].some(i=>Math.abs(current[i]-previous[i])>.01);
}
