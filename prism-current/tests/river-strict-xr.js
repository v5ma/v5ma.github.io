/* Test-only extension of river-fake-xr.js. Native-shaped live source collection,
   independent aim/grip transforms, native primary events and missing-pose cases.
   This changes emulated devices only. It never writes game state or clocks. */
(()=>{
 const S=TestXR.state;S.aim={};S.rotate={};S.noGrip=new Set();S.noAim=new Set();S.oneController=false;
 class InputSources {
  constructor(items){this._items=items;for(let i=0;i<items.length;i++)Object.defineProperty(this,i,{get:()=>this._items[i]});}
  get length(){return S.oneController?Math.min(1,this._items.length):this._items.length;}
  *values(){for(let i=0;i<this.length;i++)yield this[i];}
  [Symbol.iterator](){return this.values();}
  *keys(){for(let i=0;i<this.length;i++)yield i;}
  *entries(){for(let i=0;i<this.length;i++)yield [i,this[i]];}
  forEach(fn,thisArg){for(let i=0;i<this.length;i++)fn.call(thisArg,this[i],i,this);}
 }
 const request=navigator.xr.requestSession.bind(navigator.xr);
 navigator.xr.requestSession=async(...args)=>{const session=await request(...args),sources=Array.from(session.inputSources);for(const s of sources){s.targetRaySpace.role='aim';s.gripSpace.role='grip';}session.inputSources=new InputSources(sources);
  const raf=session.requestAnimationFrame.bind(session);session.requestAnimationFrame=callback=>raf((time,frame)=>{const get=frame.getPose;frame.getPose=(space,ref)=>{const hand=space.hand;if((space.role==='grip'&&S.noGrip.has(hand))||(space.role==='aim'&&S.noAim.has(hand)))return null;const pose=get(space,ref);if(!pose)return null;const T=AFRAME.THREE,aim=space.role==='aim'&&S.aim[hand],position=aim?.origin||S.hands[hand],q=new T.Quaternion();if(aim)q.setFromUnitVectors(new T.Vector3(0,0,-1),new T.Vector3(...aim.direction).normalize());else q.setFromEuler(new T.Euler(...(S.rotate[hand]||[0,0,0])));const m=new T.Matrix4().compose(new T.Vector3(...position),q,new T.Vector3(1,1,1));return {emulatedPosition:false,transform:{position:{x:position[0],y:position[1],z:position[2]},orientation:{x:q.x,y:q.y,z:q.z,w:q.w},matrix:new Float32Array(m.elements)}};};callback(time,frame);});return session;
 };
 TestXR.button=(hand,i,on)=>{const src=Array.from(S.session.inputSources).find(s=>s.handedness===hand);src.gamepad.buttons[i]={pressed:on,touched:on,value:on?1:0};};
 TestXR.axes=(hand,x,y)=>{const src=Array.from(S.session.inputSources).find(s=>s.handedness===hand);src.gamepad.axes=[0,0,x,y];};
 TestXR.select=(hand,on)=>{const e=new Event(on?'selectstart':'selectend');e.inputSource=Array.from(S.session.inputSources).find(s=>s.handedness===hand);S.session.dispatchEvent(e);};
 TestXR.point=(hand,target)=>{const origin=S.hands[hand];S.aim[hand]={origin:origin.slice(),direction:target.map((v,i)=>v-origin[i])};};
 TestXR.away=()=>{for(const hand of['left','right'])S.aim[hand]={origin:S.hands[hand].slice(),direction:[0,1,0]};};
})();
