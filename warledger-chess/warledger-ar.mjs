import {PIECES,FAIRY_PROMOTIONS,cloneState,coordToSquare,squareToCoord,createGame,getLegalMoves,getPromotionOptions,isKingInCheck,pieceAt,playMove,buyPromotionLicense} from './warledger-engine.mjs';
import {loadSession,saveSession} from './warledger-session.mjs';
import {ATLAS,ART_TYPES,ART_NAMES,createArtFactory} from './warledger-art.mjs';
import {nextPinch,gridStep,gamepadEdges} from './warledger-input.mjs';

export const RELEASE='ar-blocks-20260922-3';
const scene=document.querySelector('a-scene');
const status=document.querySelector('#status');
const cap=s=>s[0].toUpperCase()+s.slice(1);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

class LedgerAR {
  constructor(THREE,atlas) {
    this.THREE=THREE;this.scene=scene;this.atlas=atlas;
    const saved=loadSession();this.state=saved.state;this.undoStack=saved.undoStack;
    this.notice=saved.warning;this.selected=null;this.pending=null;this.mode='play';
    this.focusSquare='e2';this.focusEnabled=false;this.menuNavigation=false;this.focusIndex=0;
    this.root=document.querySelector('#table').object3D;this.viewer=document.querySelector('#viewer');
    this.art=createArtFactory(THREE,atlas);this.pieces=new THREE.Group();this.ui=new THREE.Group();this.gallery=new THREE.Group();
    this.root.add(this.pieces,this.ui,this.gallery);
    this.board=new THREE.Group();this.root.add(this.board);this.tiles=[];
    this.targets=[];this.inputStates=new Map();this.xrInputs=new Map();
    this.raycaster=new THREE.Raycaster();this.raycaster.far=4;
    this.orbitYaw=.18;this.orbitPitch=1.03;this.orbitDistance=1.12;
    this.scale=1;this.placing=false;this.surfacePosition=null;this.xrSession=null;
    this.ready=false;this.lastActivation={action:null,time:0};
    this.buildBoard();this.buildEnvironment();this.bind();this.render();this.orbit();
    this.ready=true;this.probeXR();
  }
  box(w,h,d,color,x,y,z,parent=this.board) {
    const T=this.THREE;
    const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.8,metalness:.05}));
    m.position.set(x,y,z);parent.add(m);return m;
  }
  buildBoard() {
    const T=this.THREE;
    this.box(.724,.035,.724,0x182733,0,-.027,0);
    this.box(.704,.006,.704,0xb39251,0,-.009,0);
    for(let r=0;r<8;r++)for(let c=0;c<8;c++) {
      const square=coordToSquare(r,c);
      const tile=this.box(.0796,.009,.0796,(r+c)%2?0x326653:0xe8dbbc,(c-3.5)*.08,-.0045,(r-3.5)*.08);
      tile.userData.action=`square:${square}`;tile.userData.square=square;this.tiles.push(tile);
    }
    for(let i=0;i<8;i++) {
      const letter=this.panel([String.fromCharCode(65+i)],.033,.022);
      letter.rotation.x=-Math.PI/2;letter.position.set((i-3.5)*.08,.001,.338);this.board.add(letter);
      const number=this.panel([String(8-i)],.022,.033);
      number.rotation.x=-Math.PI/2;number.position.set(-.338,.001,(i-3.5)*.08);this.board.add(number);
    }
    this.focusRing=new T.Mesh(new T.BoxGeometry(.078,.002,.078),new T.MeshBasicMaterial({color:0x63f0e2,wireframe:true}));
    this.board.add(this.focusRing);
    this.reticle=new T.Mesh(new T.RingGeometry(.09,.098,48),new T.MeshBasicMaterial({color:0x65ffd2,side:T.DoubleSide}));
    this.reticle.rotation.x=-Math.PI/2;this.reticle.visible=false;scene.object3D.add(this.reticle);
  }
  buildEnvironment() {
    const T=this.THREE;
    scene.object3D.background=new T.Color(0x172126);
    this.floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:0x23332f,roughness:1}));
    this.floor.rotation.x=-Math.PI/2;this.floor.position.y=-.005;scene.object3D.add(this.floor);
  }
  panel(lines,width,height,action=null,enabled=true) {
    const T=this.THREE,c=document.createElement('canvas');
    c.width=Math.max(256,Math.ceil(width*1400));c.height=Math.max(96,Math.ceil(height*1800));
    const ctx=c.getContext('2d');ctx.fillStyle=enabled?'#16252c':'#253039';ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle=enabled?'#bba56e':'#5d6969';ctx.lineWidth=5;ctx.strokeRect(3,3,c.width-6,c.height-6);
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=enabled?'#f9edcc':'#a5abab';
    const lineHeight=c.height/(lines.length+.45);
    lines.forEach((line,i)=>{
      let size=Math.min(46,lineHeight*.65);ctx.font=`600 ${size}px system-ui, sans-serif`;
      while(ctx.measureText(line).width>c.width-20&&size>10){size--;ctx.font=`600 ${size}px system-ui, sans-serif`;}
      ctx.fillText(line,c.width/2,lineHeight*(i+.7));
    });
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
    const mesh=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
    mesh.userData.owned=true;
    if(action&&enabled)mesh.userData.action=action;
    return mesh;
  }
  clearOwned(group) {
    group.traverse(o=>{if(o.userData.owned){o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();}});
    group.clear();
  }
  addPanel(parent,lines,width,height,x,y,action=null,enabled=true) {
    const mesh=this.panel(lines,width,height,action,enabled);mesh.position.set(x,y,.002);parent.add(mesh);
    if(action&&enabled){this.targets.push(mesh);this.allButtons.push(mesh);}
    return mesh;
  }
  render() {
    this.legalMoves=getLegalMoves(this.state);
    const targets=new Map(this.selected?this.legalMoves.filter(m=>m.fromSquare===this.selected).map(m=>[m.toSquare,m]):[]);
    this.targets=[];this.pieces.clear();this.clearOwned(this.gallery);
    this.board.visible=this.mode!=='gallery';this.pieces.visible=this.board.visible;
    this.tiles.forEach((tile,i)=>{
      const square=tile.userData.square,r=Math.floor(i/8),c=i%8;
      const last=this.state.lastMove&&(this.state.lastMove.from===square||this.state.lastMove.to===square);
      const target=targets.get(square);
      tile.material.color.setHex(this.selected===square?0xd6ae57:target?(target.capture?0xc66053:0x50b6a0):last?0x88a39b:(r+c)%2?0x326653:0xe8dbbc);
      if(this.mode==='play')this.targets.push(tile);
      const entry=this.state.board[r][c];
      if(entry){
        const group=this.art.make(entry.type,entry.side);group.position.set((c-3.5)*.08,.001,(r-3.5)*.08);
        if(entry.side==='black')group.rotation.y=Math.PI;
        group.userData.square=square;
        group.traverse(o=>{if(o.isMesh){o.userData.action=`square:${square}`;if(this.mode==='play')this.targets.push(o);}});
        this.pieces.add(group);
      }
    });
    if(this.mode==='gallery') {
      ART_TYPES.forEach((type,i)=>{
        const x=(i%4-1.5)*.165,z=(Math.floor(i/4)-1)*.2;
        const group=this.art.make(type,i%2?'black':'white');group.position.set(x,.012,z);group.rotation.y=.35;
        this.gallery.add(group);
        const label=this.panel([ART_NAMES[i]],.15,.035);label.position.set(x,.008,z+.068);label.rotation.x=-Math.PI/2;this.gallery.add(label);
      });
    }
    this.renderUI();this.updateFocus();this.root.updateMatrixWorld(true);
    if(!saveSession(this.state,this.undoStack)&&!this.saveWarning){this.saveWarning=true;status.textContent+=' Saving is unavailable in this browser.';}
  }
  statusLines() {
    const check=!this.state.gameOver&&isKingInCheck(this.state,this.state.sideToMove);
    const heading=this.state.gameOver?`${cap(this.state.gameOver.winner)} victory`: `${cap(this.state.sideToMove)} to move${check?' - CHECK':''}`;
    const ledgers=`Bank: White ${this.state.bank.white} / Black ${this.state.bank.black}   |   Score: ${this.state.battleScore.white} / ${this.state.battleScore.black}`;
    const detail=this.notice||this.state.gameOver?.message||(this.selected?`${this.selected}: choose a highlighted destination.`:'Select a piece. Trigger or pinch selects; B cancels.');
    return [heading,ledgers,detail];
  }
  renderUI() {
    const T=this.THREE;this.clearOwned(this.ui);this.allButtons=[];
    const tray=new T.Group();tray.position.set(0,.013,.51);tray.rotation.x=-Math.PI/2;this.ui.add(tray);
    const lines=this.statusLines();status.textContent=lines.join(' | ');
    this.addPanel(tray,lines,.70,.085,0,.09);
    const toolbar=[['Undo','undo'],['Market','market'],['Smaller','smaller'],['Larger','larger'],['Flip','flip'],['Place','place'],['New game','new'],['Promo lab','lab'],[this.mode==='gallery'?'Play board':'All pieces','gallery'],['Higher','higher'],['Lower','lower'],['Exit XR','exit']];
    toolbar.forEach(([label,action],i)=>this.addPanel(tray,[label],.109,.041,(i%6-2.5)*.118,-Math.floor(i/6)*.05,action,action!=='exit'||!!this.xrSession));
    this.focusable=this.allButtons.slice();
    if(['market','promotion','confirm'].includes(this.mode)) {
      const menu=new T.Group();menu.position.set(0,.32,.04);menu.rotation.x=-Math.PI*.25;this.ui.add(menu);
      const start=this.allButtons.length;
      if(this.mode==='confirm') {
        this.addPanel(menu,['Replace this saved board?',this.confirmScenario==='promotionLab'?'Open the promotion lab.':'Start a new standard game.'],.64,.12,0,.09);
        this.addPanel(menu,['Replace board'],.28,.075,-.16,-.03,'confirm');
        this.addPanel(menu,['Keep playing'],.28,.075,.16,-.03,'cancel');
      } else {
        const options=getPromotionOptions(this.state,this.state.sideToMove);
        const types=this.mode==='market'?FAIRY_PROMOTIONS:options.map(o=>o.type);
        this.addPanel(menu,[this.mode==='market'?'Promotion license market':'Choose your promotion',`${cap(this.state.sideToMove)} bank: ${this.state.bank[this.state.sideToMove]}`],.65,.075,0,.195);
        types.forEach((type,i)=>{
          const option=options.find(o=>o.type===type),owned=option.owned||0;
          const affordable=this.state.bank[this.state.sideToMove]>=option.cost;
          const buying=this.mode==='market'||!option.available;
          const enabled=buying?affordable:option.available;
          const sub=buying?`Buy: ${option.cost} | Own: ${owned}`:option.cost?`Use license (${owned})`:'Free promotion';
          this.addPanel(menu,[option.name,sub],.15,.079,(i%4-1.5)*.166,.105-Math.floor(i/4)*.089,`${buying?'buy':'promote'}:${type}`,enabled);
        });
        this.addPanel(menu,[this.mode==='market'&&this.pending?'Back to promotion':'Cancel'],.32,.047,0,-.095,'cancel');
      }
      this.focusable=this.allButtons.slice(start);this.menuNavigation=true;
    }
    if(this.placing){
      const hint=this.panel(['PLACEMENT MODE','Look at a surface, or aim at the current table height.','Trigger / pinch places. B cancels. Higher / Lower adjusts height.'],.70,.11);
      hint.position.set(0,.13,.43);hint.rotation.x=-Math.PI*.28;this.ui.add(hint);
    }
  }
  updateFocus() {
    const {r,c}=squareToCoord(this.focusSquare);
    this.focusRing.position.set((c-3.5)*.08,.004,(r-3.5)*.08);
    this.focusRing.visible=this.focusEnabled&&!this.menuNavigation&&this.mode==='play';
    this.focusIndex=clamp(this.focusIndex,0,Math.max(0,this.focusable.length-1));
    this.allButtons.forEach(m=>m.material.color.setHex(0xffffff));
    if(this.menuNavigation)this.focusable[this.focusIndex]?.material.color.setHex(0x8af4e6);
  }
  square(square) {
    if(this.mode!=='play'||this.placing||this.state.gameOver)return false;
    this.focusSquare=square;
    const move=this.selected?this.legalMoves.find(m=>m.fromSquare===this.selected&&m.toSquare===square):null;
    if(move){
      if(move.promotion){this.pending=move;this.mode='promotion';this.focusIndex=0;this.render();return true;}
      return this.commit({from:move.fromSquare,to:move.toSquare});
    }
    const p=pieceAt(this.state,square);
    this.selected=p?.side===this.state.sideToMove&&this.selected!==square?square:null;
    this.notice='';this.render();return !!this.selected;
  }
  commit(input) {
    const result=playMove(this.state,input);
    if(!result.ok){this.notice=result.error||'Choose a promotion.';this.render();return false;}
    this.undoStack.push(cloneState(this.state));this.undoStack=this.undoStack.slice(-60);this.state=result.state;
    this.selected=null;this.pending=null;this.mode='play';this.menuNavigation=false;this.notice='';this.render();return true;
  }
  buy(type) {
    const result=buyPromotionLicense(this.state,this.state.sideToMove,type);
    if(!result.ok){this.notice=result.error;this.render();return false;}
    this.undoStack.push(cloneState(this.state));this.undoStack=this.undoStack.slice(-60);this.state=result.state;
    this.notice=`${PIECES[type].name} license purchased.`;
    if(this.pending)this.mode='promotion';
    this.render();return true;
  }
  loadScenario(scenario) {
    this.state=createGame(scenario);this.undoStack=[];this.selected=null;this.pending=null;this.focusSquare='e2';
    this.mode='play';this.menuNavigation=false;this.placing=false;this.reticle.visible=false;
    this.notice=this.state.note;this.render();
  }
  cancel() {
    if(this.mode==='market'&&this.pending){this.mode='promotion';this.render();return;}
    this.selected=null;this.pending=null;this.mode='play';this.placing=false;this.reticle.visible=false;this.menuNavigation=false;this.notice='';this.render();
  }
  dispatch(action) {
    if(!action)return;
    const [name,arg]=action.split(':');
    if(name==='square')return this.square(arg);
    if(name==='buy')return this.buy(arg);
    if(name==='promote'&&this.pending)return this.commit({from:this.pending.fromSquare,to:this.pending.toSquare,promotionType:arg});
    if(name==='cancel')return this.cancel();
    if(name==='undo') {
      if(this.pending||this.placing)return this.cancel();
      if(this.undoStack.length){this.state=this.undoStack.pop();this.selected=null;this.notice='Last action undone.';}else this.notice='Nothing to undo.';
      this.mode='play';this.menuNavigation=false;
    } else if(name==='market') {this.mode=this.mode==='market'?(this.pending?'promotion':'play'):'market';this.focusIndex=0;}
    else if(name==='gallery') {this.pending=null;this.selected=null;this.mode=this.mode==='gallery'?'play':'gallery';this.menuNavigation=false;this.notice=this.mode==='gallery'?'Ten playable types. Dragon is artwork only, not a new rule.':'';}
    else if(name==='new'||name==='lab'){this.confirmScenario=name==='lab'?'promotionLab':'standard';this.mode='confirm';this.focusIndex=0;}
    else if(name==='confirm')return this.loadScenario(this.confirmScenario);
    else if(name==='smaller'||name==='larger'){this.scale=clamp(this.scale+(name==='larger'?.15:-.15),.65,1.6);this.root.scale.setScalar(this.scale);this.notice=`Board width: ${Math.round(.724*this.scale*100)} cm.`;}
    else if(name==='higher'||name==='lower'){this.root.position.y=clamp(this.root.position.y+(name==='higher'?.05:-.05),.15,1.6);}
    else if(name==='flip'){this.root.rotation.y+=Math.PI;}
    else if(name==='place'){
      if(this.xrSession){this.placing=!this.placing;this.selected=null;this.notice=this.placing?'Positioning the board. Trigger or pinch to confirm.':'';}
      else{this.root.position.set(0,.72,0);this.root.rotation.y=0;this.orbitYaw=.18;this.notice='Board recentered. Drag to orbit; use Higher / Lower for table height.';}
    } else if(name==='exit'){if(this.xrSession)this.scene.exitVR();return;}
    this.render();if(!this.xrSession)this.orbit();
  }
  activate(action,source=null) {
    const now=performance.now();
    if(action===this.lastActivation.action&&now-this.lastActivation.time<140)return;
    this.lastActivation={action,time:now};this.dispatch(action);
    try{source?.gamepad?.hapticActuators?.[0]?.pulse(.22,30);}catch{}
  }
  orbit() {
    if(this.xrSession)return;
    const T=this.THREE,p=this.root.position;
    const horizontal=this.orbitDistance*Math.cos(this.orbitPitch);
    this.viewer.object3D.position.set(p.x+Math.sin(this.orbitYaw)*horizontal,p.y+Math.sin(this.orbitPitch)*this.orbitDistance,p.z+Math.cos(this.orbitYaw)*horizontal);
    // The A-Frame entity is a Group: lookAt aims its positive Z, unlike a Camera.
    // Rotate the rig half a turn so the child camera's negative Z faces the board.
    this.viewer.object3D.lookAt(new T.Vector3(p.x,p.y+.02,p.z+.10));
    this.viewer.object3D.rotateY(Math.PI);
    this.viewer.object3D.updateMatrixWorld(true);
  }
  pick(origin,direction) {
    this.root.updateMatrixWorld(true);this.raycaster.set(origin,direction);
    return this.resolveHit(this.raycaster.intersectObjects(this.targets,false));
  }
  resolveHit(hits) {
    const nearest=hits[0];
    // The selected block may hide the destination immediately behind it.
    // Prefer its legal board-square hit, but never click through menus or other pieces.
    if(this.mode==='play'&&this.selected&&nearest?.object.userData.action===`square:${this.selected}`) {
      const destination=hits.find(hit=>this.tiles.includes(hit.object)&&this.legalMoves.some(move=>move.fromSquare===this.selected&&move.toSquare===hit.object.userData.square));
      if(destination)return destination;
    }
    return nearest||null;
  }
  pointerPick(event) {
    const rect=scene.canvas.getBoundingClientRect(),T=this.THREE;
    const uv=new T.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    this.root.updateMatrixWorld(true);scene.camera.updateMatrixWorld(true);this.raycaster.setFromCamera(uv,scene.camera);
    return this.resolveHit(this.raycaster.intersectObjects(this.targets,false));
  }
  bind() {
    let drag=null;
    scene.canvas.addEventListener('pointerdown',e=>{if(this.xrSession||e.button!==0)return;drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};scene.canvas.setPointerCapture(e.pointerId);});
    scene.canvas.addEventListener('pointermove',e=>{
      if(this.xrSession)return;
      if(drag){
        const dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;
        drag.moved=drag.moved||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7;
        if(drag.moved){this.orbitYaw-=dx*.007;this.orbitPitch=clamp(this.orbitPitch+dy*.005,.18,1.42);this.orbit();}
        drag.lastX=e.clientX;drag.lastY=e.clientY;
      }else scene.canvas.style.cursor=this.pointerPick(e)?'pointer':'grab';
    });
    scene.canvas.addEventListener('pointerup',e=>{if(!this.xrSession&&drag&&!drag.moved){const hit=this.pointerPick(e);if(hit)this.activate(hit.object.userData.action);}drag=null;});
    scene.canvas.addEventListener('pointercancel',()=>{drag=null;});
    scene.canvas.addEventListener('wheel',e=>{if(this.xrSession)return;e.preventDefault();this.orbitDistance=clamp(this.orbitDistance+e.deltaY*.001,.60,2.5);this.orbit();},{passive:false});
    document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>this.dispatch(b.dataset.action)));
    document.querySelector('#enter-ar').addEventListener('click',()=>this.enter('ar'));
    document.querySelector('#enter-vr').addEventListener('click',()=>this.enter('vr'));
    window.addEventListener('keydown',e=>{
      if(e.target instanceof HTMLButtonElement||e.target instanceof HTMLAnchorElement)return;
      const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      if(moves[e.key]){e.preventDefault();this.navigate(...moves[e.key]);}
      else if(['Enter',' '].includes(e.key)){e.preventDefault();this.selectFocus();}
      else if(e.key==='Escape')this.cancel();else if(e.key.toLowerCase()==='u'||e.key.toLowerCase()==='x')this.dispatch('undo');
      else if(e.key.toLowerCase()==='m'||e.key.toLowerCase()==='y')this.dispatch('market');
      else if(e.key==='F2'){e.preventDefault();this.menuNavigation=!this.menuNavigation;this.updateFocus();}
    });
    scene.addEventListener('enter-vr',()=>this.startXR());
    scene.addEventListener('exit-vr',()=>this.stopXR());
  }
  async probeXR() {
    for(const mode of ['ar','vr']) {
      const button=document.querySelector(`#enter-${mode}`);
      try {button.disabled=!(await navigator.xr?.isSessionSupported(`immersive-${mode}`));}
      catch {button.disabled=true;}
      if(button.disabled)button.title=`Immersive ${mode.toUpperCase()} is not available in this browser. The 3D board remains playable.`;
    }
  }
  async enter(mode) {
    try {await (mode==='ar'?scene.enterAR():scene.enterVR());}
    catch(error){this.notice=`Could not enter ${mode.toUpperCase()}: ${error.message||error}. The 3D board is still playable.`;this.render();}
  }
  startXR() {
    const session=scene.renderer.xr.getSession();if(!session||session===this.xrSession)return;
    this.xrSession=session;this.needsRecenter=true;this.viewer.object3D.position.set(0,0,0);this.viewer.object3D.quaternion.identity();
    const ar=scene.is('ar-mode');this.floor.visible=!ar;scene.object3D.background=ar?null:new this.THREE.Color(0x172126);scene.renderer.setClearColor(0x172126,ar?0:1);
    document.body.classList.add('xr');this.notice='Trigger or pinch selects. Right B cancels. Left X opens the market; Y undoes.';
    this.onXRSelect=e=>{
      const rec=this.xrInputs.get(e.inputSource);
      if(e.inputSource.hand&&rec?.handJoints)return;
      const ray=this.sourceRay(e.frame,e.inputSource);if(!ray)return;
      this.selectRay(ray.origin,ray.direction,e.inputSource,e.frame);
    };
    session.addEventListener('select',this.onXRSelect);
    session.addEventListener('end',()=>this.stopXR(),{once:true});
    if(ar&&session.requestHitTestSource) {
      session.requestReferenceSpace('viewer').then(space=>session.requestHitTestSource({space})).then(source=>{
        if(this.xrSession===session)this.hitTestSource=source;else source.cancel();
      }).catch(()=>{});
    }
    this.render();
  }
  stopXR() {
    if(!this.xrSession)return;
    this.xrSession.removeEventListener('select',this.onXRSelect);this.xrSession=null;
    this.hitTestSource?.cancel();this.hitTestSource=null;this.surfacePosition=null;this.placing=false;this.reticle.visible=false;
    this.xrInputs.forEach(rec=>{rec.line.removeFromParent();rec.line.geometry.dispose();rec.line.material.dispose();rec.grip.removeFromParent();rec.grip.geometry.dispose();rec.grip.material.dispose();});
    this.xrInputs.clear();this.inputStates.clear();document.body.classList.remove('xr');
    this.floor.visible=true;scene.object3D.background=new this.THREE.Color(0x172126);scene.renderer.setClearColor(0x172126,1);
    this.root.position.set(0,.72,0);this.root.rotation.y=0;this.notice='Returned to the 3D board. The same game is still active.';this.render();this.orbit();requestAnimationFrame(()=>this.orbit());
  }
  sourceRay(frame,source) {
    const ref=scene.renderer.xr.getReferenceSpace();if(!frame||!ref)return null;
    const pose=frame.getPose(source.targetRaySpace,ref);if(!pose)return null;
    const T=this.THREE,m=new T.Matrix4().fromArray(pose.transform.matrix);
    return {origin:new T.Vector3().setFromMatrixPosition(m),direction:new T.Vector3(0,0,-1).transformDirection(m)};
  }
  selectRay(origin,direction,source=null,frame=null) {
    const hit=this.pick(origin,direction),action=hit?.object.userData.action;
    if(this.placing&&!['higher','lower','place','exit'].includes(action))this.place(origin,direction,frame);
    else if(action)this.activate(action,source);
    return action||null;
  }
  placementPoint(origin,direction) {
    if(this.surfacePosition)return this.surfacePosition.clone();
    if(Math.abs(direction.y)<.04)return null;
    const t=(this.root.position.y-origin.y)/direction.y;
    return t>.05&&t<3?origin.clone().addScaledVector(direction,t):null;
  }
  place(origin,direction,frame) {
    const point=this.placementPoint(origin,direction);if(!point)return;
    this.root.position.copy(point);this.faceViewer(frame);this.placing=false;this.reticle.visible=false;this.notice='Board placed. Select a piece to play.';this.render();
  }
  faceViewer(frame) {
    const pose=frame?.getViewerPose(scene.renderer.xr.getReferenceSpace());
    if(pose)this.root.rotation.y=Math.atan2(pose.transform.position.x-this.root.position.x,pose.transform.position.z-this.root.position.z);
  }
  updateXR(frame,time) {
    if(!frame||!this.xrSession)return;
    const T=this.THREE,ref=scene.renderer.xr.getReferenceSpace();if(!ref)return;
    if(this.needsRecenter) {
      const pose=frame.getViewerPose(ref);
      if(pose){
        const p=pose.transform.position,q=pose.transform.orientation;
        const dir=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion(q.x,q.y,q.z,q.w));dir.y=0;
        if(dir.lengthSq()<.01)dir.set(0,0,-1);dir.normalize();
        this.root.position.set(p.x+dir.x*.77,clamp(p.y-.62,.35,1.15),p.z+dir.z*.77);this.faceViewer(frame);this.needsRecenter=false;
      }
    }
    const viewerPose=frame.getViewerPose(ref);
    if(viewerPose)this.viewYaw=Math.atan2(viewerPose.transform.position.x-this.root.position.x,viewerPose.transform.position.z-this.root.position.z);
    this.surfacePosition=null;
    if(this.placing&&this.hitTestSource) {
      try{const pose=frame.getHitTestResults(this.hitTestSource)[0]?.getPose(ref);if(pose&&pose.transform.matrix[5]>.85)this.surfacePosition=new T.Vector3().setFromMatrixPosition(new T.Matrix4().fromArray(pose.transform.matrix));}catch{}
    }
    this.reticle.visible=false;
    const live=new Set(this.xrSession.inputSources);
    for(const [source,rec] of this.xrInputs){rec.line.visible=false;rec.grip.visible=false;if(!live.has(source))rec.pinch=false;}
    for(const source of this.xrSession.inputSources) {
      let rec=this.xrInputs.get(source);
      if(!rec){
        const color=source.handedness==='left'?0xefca83:0x7eeadd;
        const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.85}));line.renderOrder=20;scene.object3D.add(line);
        const grip=new T.Mesh(new T.BoxGeometry(.019,.035,.035),new T.MeshBasicMaterial({color}));scene.object3D.add(grip);
        rec={line,grip,pinch:false,handJoints:false,armed:false};this.xrInputs.set(source,rec);
      }
      const ray=this.sourceRay(frame,source);if(!ray)continue;
      const hit=this.pick(ray.origin,ray.direction);
      let end=hit?.point||ray.origin.clone().addScaledVector(ray.direction,1.4);
      if(this.placing){const point=this.placementPoint(ray.origin,ray.direction);if(point){this.reticle.position.copy(point);this.reticle.position.y+=.003;this.reticle.visible=true;end=point;}}
      const a=rec.line.geometry.attributes.position;a.setXYZ(0,ray.origin.x,ray.origin.y,ray.origin.z);a.setXYZ(1,end.x,end.y,end.z);a.needsUpdate=true;rec.line.geometry.computeBoundingSphere();rec.line.visible=true;
      if(source.gripSpace&&!source.hand){const p=frame.getPose(source.gripSpace,ref);if(p){rec.grip.position.copy(p.transform.position);rec.grip.quaternion.copy(p.transform.orientation);rec.grip.visible=true;}}
      rec.handJoints=false;
      if(source.hand&&frame.getJointPose){
        const thumbSpace=source.hand.get('thumb-tip'),indexSpace=source.hand.get('index-finger-tip');
        const thumb=thumbSpace&&frame.getJointPose(thumbSpace,ref),index=indexSpace&&frame.getJointPose(indexSpace,ref);
        if(thumb&&index){
          rec.handJoints=true;const a=thumb.transform.position,b=index.transform.position;
          const distance=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);if(distance>.03)rec.armed=true;
          const result=nextPinch(rec.pinch,distance);rec.pinch=result.latched;
          if(result.pressed&&rec.armed)this.selectRay(ray.origin,ray.direction,source,frame);
        }else rec.pinch=false;
      }
      if(source.gamepad)this.pollPad(source.gamepad,source,time,true,source.handedness);
    }
  }
  navigate(dx,dy) {
    this.focusEnabled=true;
    if(this.menuNavigation||['market','promotion','confirm'].includes(this.mode)) {
      this.menuNavigation=true;const n=this.focusable.length;if(n)this.focusIndex=(this.focusIndex+dx+dy+n)%n;
    } else {
      const flip=Math.cos(this.root.rotation.y-(this.xrSession?this.viewYaw||0:this.orbitYaw))<0?-1:1;
      this.focusSquare=gridStep(this.focusSquare,dx*flip,dy*flip);
    }
    this.updateFocus();
  }
  selectFocus() {
    if(this.menuNavigation)this.dispatch(this.focusable[this.focusIndex]?.userData.action);
    else this.square(this.focusSquare);
  }
  pollPad(pad,key,time,xr=false,hand='right') {
    let rec=this.inputStates.get(key);if(!rec){rec={buttons:[],nextNav:0};this.inputStates.set(key,rec);}
    const edges=gamepadEdges(pad.buttons,rec.buttons);rec.buttons=edges.current;const b=edges.pressed;
    if(xr){
      if(b[4])hand==='left'?this.dispatch('market'):this.selectFocus();
      if(b[5])hand==='left'?this.dispatch('undo'):this.cancel();
    }else{
      if(b[0])this.selectFocus();if(b[1])this.cancel();if(b[2])this.dispatch('undo');if(b[3])this.dispatch('market');
      if(b[4]||b[5])this.dispatch('flip');if(b[9]){this.menuNavigation=!this.menuNavigation;this.updateFocus();}
    }
    const axis=xr&&pad.axes.length>=4?2:0;
    const x=pad.axes[axis]||0,y=pad.axes[axis+1]||0;
    const dx=(pad.buttons[15]?.pressed||x>.6)?1:(pad.buttons[14]?.pressed||x<-.6)?-1:0;
    const dy=(pad.buttons[13]?.pressed||y>.6)?1:(pad.buttons[12]?.pressed||y<-.6)?-1:0;
    if((dx||dy)&&time>=rec.nextNav){this.navigate(dx,dy);rec.nextNav=time+210;}
    if(!dx&&!dy)rec.nextNav=0;
  }
  tick(time) {
    if(this.xrSession)this.updateXR(scene.frame||scene.renderer.xr.getFrame?.(),time);
    else for(const pad of navigator.getGamepads?.()||[])if(pad&&pad.mapping==='standard')this.pollPad(pad,`gamepad-${pad.index}`,time);
  }
  projectObject(object) {
    const T=this.THREE;this.root.updateMatrixWorld(true);scene.camera.updateMatrixWorld(true);
    const p=object.getWorldPosition(new T.Vector3()).project(scene.camera),rect=scene.canvas.getBoundingClientRect();
    return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};
  }
  projectSquare(square){return this.projectObject(this.tiles.find(t=>t.userData.square===square));}
  projectAction(action){const obj=this.targets.find(t=>t.userData.action===action);if(!obj)throw new Error(`No active UI action ${action}`);return this.projectObject(obj);}
}

async function start() {
  if(!window.AFRAME){document.querySelector('#failure').hidden=false;return;}
  if(!scene.hasLoaded)await new Promise(resolve=>scene.addEventListener('loaded',resolve,{once:true}));
  const T=AFRAME.THREE;
  try {
    const atlas=await new T.TextureLoader().loadAsync(new URL(ATLAS.url,import.meta.url).href);
    atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=Math.min(4,scene.renderer.capabilities.getMaxAnisotropy());
    const app=new LedgerAR(T,atlas);window.WarLedgerAR=app;
    AFRAME.registerComponent('warledger-loop',{tick(time){app.tick(time);}});scene.setAttribute('warledger-loop','');
  }catch(error){status.textContent=`Could not load the AR board: ${error.message}. Your save is unchanged.`;document.querySelector('#failure').hidden=false;console.error(error);}
}
start();
