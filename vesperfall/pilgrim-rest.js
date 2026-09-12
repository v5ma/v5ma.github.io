/* Saved expeditions for browser, Xbox focus UI and Quest spatial menus.
 * Runtime remains the existing A-Frame scene. No remote accounts or storage.
 */
(function(root){'use strict';
 function install(g){
  const C=VesperCore,P=VesperChronicle,S=PilgrimSave,T=g.T,$=id=>document.getElementById(id),ui=g.dominionControls;
  let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error('Storage unavailable');}};}
  const store=new S.Store(storage),state={activeId:null,checkpoint:store.data?.ok?store.data.checkpoint:null,issue:store.error||'',busy:false,suppressed:false,lastWrite:performance.now(),savedAt:store.data?.savedAt||0,conflict:false};
  if(store.data?.ok)g.profile=P.clean(store.data.profile);
  const panel=document.createElement('section');panel.id='pilgrim-rest';panel.setAttribute('aria-label','Saved expedition');
  panel.innerHTML='<p class="eyebrow">PILGRIM\'S REST / LOCAL CHECKPOINT</p><p id="checkpoint-summary" aria-live="polite"></p><div class="rest-actions"><button id="continue-expedition" hidden>Continue saved expedition</button><button id="save-expedition" hidden>Save checkpoint now</button><button id="suspend-expedition" hidden>Save and return to title</button><button id="discard-expedition" hidden>Discard saved expedition</button><button id="reload-expedition" hidden>Reload to use the newer save</button></div><p id="checkpoint-status" role="status"></p><small>Autosaves every 15 seconds, on pause and when hidden. Local to this browser, not a cloud save. Practice and AR do not replace an expedition. A restored run waits paused for you.</small>';
  $('resume').after(panel);
  function eligible(){return !!state.activeId&&g.running&&!g.practice&&!g.arMode&&!g.game.unscored;}
  function metadata(){const q=g.head.object3D.getWorldQuaternion(new T.Quaternion()),e=new T.Euler().setFromQuaternion(q,'YXZ');return {id:state.activeId,banked:g.banked||0,receipt:{...g.arsenal.state.receipt},yaw:e.y,pitch:C.clamp(e.x,-1.5,1.5),focus:g.ritual.focus.remaining};}
  function capture(){return eligible()&&g.game.phase!=='dead'?S.capture(g.game,metadata()):null;}
  function refresh(){const p=state.checkpoint,d=p?.state,current=eligible(),pending=!!p&&(!current||p.meta.id!==state.activeId);
   $('continue-expedition').hidden=!pending||!!g.arMode;$('save-expedition').hidden=!current||g.game.phase==='dead';$('suspend-expedition').hidden=!current||g.game.phase==='dead';$('discard-expedition').hidden=!p&&!store.error;$('discard-expedition').disabled=state.conflict||!!g.arMode;$('reload-expedition').hidden=!state.conflict;
   $('checkpoint-summary').textContent=p?'Seed '+p.seed+' / sector '+p.depth+' / vitality '+Math.ceil(d.health)+' / score '+d.score+' / '+d.kills+' defeated / '+(d.phase==='reward'?'blessing awaits':'expedition in progress'):'No suspended expedition. Your permanent Chronicle is retained.';
   $('checkpoint-status').textContent=state.issue||(state.savedAt?'Saved in this browser at '+new Date(state.savedAt).toLocaleTimeString()+'.':'A scored expedition creates its first checkpoint when it begins.');
   $('checkpoint-status').classList.toggle('save-error',!!state.issue);
  }
  function flush(explicit=false){if(state.busy||state.suppressed||state.conflict||g.arMode)return false;state.busy=true;
   try{const next=eligible()?capture():state.checkpoint,r=store.write(g.profile,next);if(!r.ok)throw Error(r.error);state.checkpoint=next;state.savedAt=r.savedAt;state.issue='';state.lastWrite=performance.now();if(explicit)g.toast('Expedition saved. Restore will wait paused.');return true;}
   catch(e){state.issue='Not saved: '+e.message;if(explicit)ui.notice(state.issue);return false;}
   finally{state.busy=false;refresh();}
  }
  // Single atomic profile + checkpoint transaction, with the same prior rewards.
  // This replaces the two intermediate legacy profile writes during banking.
  g.bank=function(){if(state.suppressed||g.practice||g.game.unscored||g.arMode)return;
   const result=P.bank(g.profile,g.game,g.arsenal.state.receipt,false),p=result.profile;
   p.shards=Math.min(100000,p.shards+Math.max(0,g.game.kills-(g.banked||0)));p.best=Math.max(p.best,g.game.score);p.depth=Math.max(p.depth,g.game.world.depth);
   g.profile=P.clean(p);g.banked=g.game.kills;g.arsenal.state.receipt=result.receipt;flush();g.arsenal.journal();
   if(result.unlocked.length)g.toast('Chronicle unlocked: '+result.unlocked.join(', ')+'. Available next run.');
  };
  g.profileSave=()=>{if(!state.suppressed)flush();};
  const start=g.start.bind(g);
  function doStart(practice){if(g.arMode)return start(practice);
   if(eligible()){if(practice)flush();else g.bank();}
   state.suppressed=true;state.activeId=null;
   try{start(practice);}finally{state.suppressed=false;}
   if(!practice){state.activeId='pilgrim-'+crypto.getRandomValues(new Uint32Array(3)).join('-');state.checkpoint=null;flush();}else refresh();
  }
  g.start=function(practice){if(!g.arMode&&!practice&&state.checkpoint&&!eligible()){
    ui.confirm('Replace saved expedition?','The saved world and unbanked run counters will be discarded. Permanent Chronicle unlocks and renown remain. Continue the saved expedition to finish it instead.',()=>{if(discard(false))doStart(false);});return;
   }return doStart(practice);
  };
  const pause=g.setPaused.bind(g);g.setPaused=function(yes){pause(yes);if(yes&&!state.busy&&!state.suppressed&&eligible())flush();refresh();};
  const choose=g.choose.bind(g);g.choose=function(type){choose(type);if(eligible())flush();};
  const menu=g.menuUI.bind(g);g.menuUI=function(){menu();refresh();};
  function suspend(){if(!eligible()){ui.notice('Only a scored expedition can be suspended. Your saved expedition is unchanged.');return false;}g.setPaused(true);if(!flush())return false;
   state.activeId=null;g.running=false;g.training=null;g.menuUI();if(g.xr)g.placePanel();else $('continue-expedition').focus();return true;
  }
  function resume(){if(g.arMode){ui.notice('Exit AR Sanctuary before restoring an expedition.');return false;}
   if(state.conflict){ui.notice('Another tab updated the save. Reload this tab before continuing.');return false;}
   if(!state.checkpoint){ui.notice(state.issue||'There is no saved expedition in this browser.');return false;}
   let restored;try{restored=S.restore(state.checkpoint);}catch(e){state.issue=e.message;refresh();return false;}
   state.busy=true;
   try{g.setPaused(true);const {game,meta}=restored;g.game=game;g.practice=false;g.training=null;g.running=true;state.activeId=meta.id;g.banked=meta.banked;g.arsenal.state.receipt={...meta.receipt};g.lastEvent=0;g.lastPhase=game.phase;g.accumulator=0;g.lastHud=-1;g.cancel();g.ritual.focus.remaining=meta.focus;g.ritual.state.seenGame=game;
    if(!g.xr){g.rig.rotation.set(0,0,0);g.yaw=meta.yaw;g.pitch=meta.pitch;g.head.object3D.position.set(0,1.65,0);g.head.components['look-controls'].yawObject.rotation.y=g.yaw;g.head.components['look-controls'].pitchObject.rotation.x=g.pitch;}
    g.build();const local=g.head.object3D.position.clone().applyQuaternion(g.rig.quaternion);g.rig.position.set(game.p[0]-local.x,game.p[1],game.p[2]-local.z);g.scene.object3D.updateMatrixWorld(true);game.head=g.head.object3D.getWorldPosition(new T.Vector3()).toArray();$('seed').value=game.world.seed;
    g.setPaused(true);g.ritual.focus.remaining=meta.focus;g.ritual.state.seenGame=game;ui.state.armed=false;ui.state.xrNeutral=false;g.arsenal.state.xrArmed=false;g.toast('Expedition restored. Resume when ready; no time passed while away.');if(g.xr)g.placePanel();return true;
   }finally{state.busy=false;refresh();}
  }
  function discard(ask=true){if(ask){ui.confirm('Discard saved expedition?','Only the saved run is removed. Your permanent renown, purchases and Chronicle are kept.',()=>discard(false));return false;}
   if(state.conflict||g.arMode)return false;
   const r=store.discard(g.profile);if(!r.ok){state.issue=r.error;refresh();return false;}
   state.checkpoint=null;state.issue='Saved expedition discarded. Permanent progression retained.';state.savedAt=0;
   if(eligible()){state.activeId=null;g.running=false;g.setPaused(true);}g.menuUI();return true;
  }
  const enter=g.enterXR.bind(g);g.enterXR=function(){if(eligible())flush();enter();refresh();};
  const exit=g.exitXR.bind(g);g.exitXR=function(){exit();refresh();};
  const visuals=g.visuals.bind(g);g.visuals=function(){visuals();if(eligible()&&!g.paused&&!document.hidden&&performance.now()-state.lastWrite>=15000){state.lastWrite=performance.now();flush();}};
  function hidden(){if(document.hidden&&eligible()){g.setPaused(true);flush();}}
  function pagehide(){if(eligible())flush();}
  function changed(e){if(e.key!==S.KEY||e.newValue===store.raw)return;state.conflict=true;state.issue='Another tab changed the saved expedition. This tab is paused and will not overwrite it. Reload to continue.';g.setPaused(true);refresh();}
  document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',pagehide);window.addEventListener('storage',changed);
  const remove=g.remove.bind(g);g.remove=function(){document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',pagehide);window.removeEventListener('storage',changed);panel.remove();remove();};
  $('continue-expedition').onclick=resume;$('save-expedition').onclick=()=>flush(true);$('suspend-expedition').onclick=suspend;$('discard-expedition').onclick=()=>discard();$('reload-expedition').onclick=()=>location.reload();
  const api={state,store,flush,resume,suspend,discard,refresh,get available(){return !!state.checkpoint;},get eligible(){return eligible();}};refresh();g.menuUI();return api;
 }
 root.PilgrimRest=Object.freeze({install});
})(globalThis);
