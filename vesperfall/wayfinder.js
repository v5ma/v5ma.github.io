/* World-local affordances and an on-demand objective wrist card. No continuous
 * head menu, no teleport path, no saved geometry or reward-rule changes. */
(function(root){'use strict';
 function install(g){
  const T=g.T,C=VesperCore,M=WayfinderModel,P=PilgrimageModel,R=ReturningBellModel,$=id=>document.getElementById(id);
  const state={held:null,source:null,game:null,target:null,uses:0,message:'',until:0,text:'',wristText:'',next:null};
  const panel=g.makePanel(768,192,1.15,.288);panel.mesh.name='Mechanism / grip action';panel.mesh.material.depthTest=true;panel.mesh.visible=false;g.scene.object3D.add(panel.mesh);
  const wrist=g.makePanel(768,192,.50,.125);wrist.mesh.name='Objective / on-demand wrist';wrist.mesh.visible=false;wrist.mesh.material.depthTest=true;g.scene.object3D.add(wrist.mesh);
  function active(){return g.running&&!g.paused&&g.game.phase==='playing'&&!g.arMode&&!g.returningBell?.state.table&&!g.firstBell?.state.coach&&!g.practice;}
  function clear(){state.held=null;state.source=null;state.target=null;panel.mesh.visible=wrist.mesh.visible=false;}
  const cancel=g.cancel.bind(g);g.cancel=function(){clear();cancel();};
  const pause=g.setPaused.bind(g);g.setPaused=function(...args){clear();pause(...args);};
  function current(){return active()?M.current(g.game,C,P,R):null;}
  function ray(h){const pose=h.source.targetRaySpace&&g.scene.frame?.getPose(h.source.targetRaySpace,g.scene.renderer.xr.getReferenceSpace());const q=pose?g.rig.getWorldQuaternion(new T.Quaternion()).multiply(new T.Quaternion().copy(pose.transform.orientation)):h.q;return new T.Vector3(0,0,-1).applyQuaternion(q).toArray();}
  function input(dt,head,bow,hand,buttons,edge){
   if(!active()){clear();return false;}
   if(state.game!==g.game){clear();state.game=g.game;}
   if(state.held){
    const h=state.held==='bow'?bow:hand;
    if(h.source!==state.source||!buttons[state.held][state.index]){clear();g.goldwind.gesture.reset();return false;}
    if($('locomotion').value==='smooth')g.walkInput(VesperInput.deadzone(bow.axes.length>=4?bow.axes[2]:bow.axes[0]),VesperInput.deadzone(bow.axes.at(-1)),dt,head,1.7);
    g.charge=0;g.drawHeld=false;return true;
   }
   if(g.latch.drawing||g.goldwind.state.quiver||g.goldwind.gesture.held||g.goldwind.state.flight||g.fieldwork.state.held||g.ritual.state.pull)return false;
   const c=current();if(!c)return false;
   const bi=$('goldwind-shield').value==='grip'?0:1;
   const owner=edge('bow',bi)?'bow':edge('draw',1)&&M.aimed(g.game,c,hand.p,ray(hand),C)?'draw':null;
   if(!owner)return false;
   const old=g.game.eventSeq||0;g.interact();state.uses++;g.goldwind.gesture.reset();
   const event=g.game.events.filter(e=>e.seq>old&&e.text).at(-1);state.message=event?.text||c.label;state.messageTitle=event&&/blocked|locked/.test(event.type)?'ACTION BLOCKED':'ACTION CONFIRMED';
   state.until=performance.now()+2200;state.messagePoint=[...c.point];
   if(!g.paused){state.held=owner;state.index=owner==='bow'?bi:1;state.source=(owner==='bow'?bow:hand).source;}
   try{(owner==='bow'?bow:hand).source.gamepad?.hapticActuators?.[0]?.pulse(.2,50)?.catch?.(()=>{});}catch{}
   g.charge=0;g.drawHeld=false;return true;
  }
  function paint(p,a,b,c,key){const text=[a,b,c].join('\n');if(state[key]===text)return;state[key]=text;const {ctx,texture}=p;ctx.clearRect(0,0,768,192);ctx.fillStyle='#17313b';ctx.fillRect(0,0,768,192);ctx.strokeStyle='#d8ba77';ctx.lineWidth=4;ctx.strokeRect(3,3,762,186);ctx.textAlign='center';ctx.fillStyle='#fff0cb';ctx.font='bold 29px Arial';ctx.fillText(a,384,47,730);ctx.font='24px Arial';ctx.fillStyle='#e1ece6';ctx.fillText(b,384,102,730);ctx.font='21px Arial';ctx.fillText(c,384,157,730);texture.needsUpdate=true;}
  function direction(point){if(!point)return '';const eye=g.head.object3D.getWorldPosition(new T.Vector3()),d=new T.Vector3(...point).sub(eye),dist=Math.hypot(d.x,d.z);d.applyQuaternion(g.head.object3D.getWorldQuaternion(new T.Quaternion()).invert());const angle=Math.atan2(d.x,-d.z),word=Math.abs(angle)>2.35?'behind':angle>.6?'right':angle<-.6?'left':'ahead';return Math.round(dist)+' m '+word;}
  const visuals=g.visuals.bind(g);g.visuals=function(){
   visuals();const s=g.game;if(state.game!==s){clear();state.game=s;state.until=0;}
   const live=active(),c=current(),objective=M.goal(s,P,R);state.target=c;state.next=objective;
   const bowLeft=$('handedness').value==='left',side=bowLeft?'Left':'Right',other=bowLeft?'right':'left',binding=$('goldwind-shield').value==='grip'?'trigger':'grip';
   const message=live&&performance.now()<state.until;
   panel.mesh.visible=live&&!!(c||message);
   if(panel.mesh.visible){const p=message?state.messagePoint:c.point;panel.mesh.position.set(p[0],p[1]+.55,p[2]);panel.mesh.quaternion.copy(g.head.object3D.getWorldQuaternion(new T.Quaternion()));
    const a=message?state.messageTitle:M.status(s,c),b=message?state.message:g.xr?(g.goldwind.enabled()?side+' '+binding+': use / point + '+other+' grip: use':'Bow-hand lower button: use'):'Xbox A / keyboard E: use';
    paint(panel,a,b,message?objective.text:c.kind==='exit'&&!s.portalReady?objective.detail:'Shutters, relays and exits use the same interaction.','text');
   }
   // Put guidance above/beyond the visible palm, still hand-anchored, not a fixed camera HUD.
   const base=g.ritual.panel.mesh;wrist.mesh.visible=live&&g.xr&&base.visible;
   if(wrist.mesh.visible){wrist.mesh.position.copy(base.position).add(new T.Vector3(other==='right'?-.12:.12,.24,-.32).applyQuaternion(base.quaternion));wrist.mesh.quaternion.copy(base.quaternion);paint(wrist,objective.text,objective.detail,direction(objective.point)+' / pause: Objectives and Missions','wristText');}
  };
  const drawMenu=g.drawMenu.bind(g);g.drawMenu=function(){drawMenu();if(!g.xrPanel||!g.game.pilgrimage||g.arMode)return;const info=M.goal(g.game,P,R),{ctx,texture}=g.xrPanel;ctx.fillStyle='#142230';ctx.fillRect(35,100,954,76);ctx.fillStyle='#eee1be';ctx.font='25px Arial';ctx.textAlign='center';ctx.fillText(info.text,512,127,915);ctx.font='20px Arial';ctx.fillText(g.game.phase==='reward'?info.detail:info.detail+' '+direction(info.point),512,164,920);texture.needsUpdate=true;};
  const remove=g.remove.bind(g);g.remove=function(){for(const p of[panel,wrist]){p.mesh.geometry?.dispose();p.mesh.material?.map?.dispose();p.mesh.material?.dispose();p.mesh.removeFromParent();}remove();};
  return {state,current,input,panel,wrist};
 }
 root.Wayfinder=Object.freeze({install});
})(globalThis);
