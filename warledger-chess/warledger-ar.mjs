import {PIECES,FAIRY_PROMOTIONS,cloneState,coordToSquare,squareToCoord,createGame,getLegalMoves,getPromotionOptions,isKingInCheck,pieceAt,playMove,buyPromotionLicense} from './warledger-engine.mjs';
import {loadSession,saveSession} from './warledger-session.mjs';
import {ATLAS,ART_TYPES,ART_NAMES,createArtFactory} from './warledger-art.mjs';
import {nextPinch,gridStep,gamepadEdges} from './warledger-input.mjs';

import {MODAL_MODES,actionAllowed,safeViewport,selectedDescription,createBoardMarkers} from './warledger-presentation.mjs';

import {boardLayout,buildPlayTray,readViewPreference,writeViewPreference} from './warledger-closeview.mjs';
import {loadPieceAtlas} from './warledger-hd-art.mjs';

export const RELEASE='ar-closeview-20260922-5';
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
    this.viewPreference=readViewPreference();this.layoutSpec=boardLayout(innerWidth,innerHeight,this.viewPreference);
    if(this.layoutSpec.focused){this.orbitYaw=0;this.orbitPitch=1.28;}
    this.fullHelp=document.querySelector('#help').textContent;
    this.ready=false;this.lastActivation={action:null,time:0};
    this.buildBoard();this.markers=createBoardMarkers(THREE,this.board,this.tiles);
    this.buildEnvironment();this.bind();this.render();this.fitView();
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
    const checked=!this.state.gameOver&&isKingInCheck(this.state,this.state.sideToMove);
    const checkedSquare=checked?this.tiles.find((tile,i)=>{const p=this.state.board[Math.floor(i/8)][i%8];return p?.type==='K'&&p.side===this.state.sideToMove;})?.userData.square:null;
    this.markers.update({selected:this.selected,targets,lastMove:this.state.lastMove,checkedSquare});
    this.renderUI();this.updateFocus();this.root.updateMatrixWorld(true);
    if(this.layoutMode!==this.mode){this.layoutMode=this.mode;if(this.ready&&!this.xrSession)this.fitView();}
    if(!saveSession(this.state,this.undoStack)&&!this.saveWarning){this.saveWarning=true;status.textContent+=' Saving is unavailable in this browser.';}
  }
  statusLines() {
    const check=!this.state.gameOver&&isKingInCheck(this.state,this.state.sideToMove);
    const heading=this.state.gameOver?`${cap(this.state.gameOver.winner)} victory`: `${cap(this.state.sideToMove)} to move${check?' - CHECK':''}`;
    const ledgers=`Bank: White ${this.state.bank.white} / Black ${this.state.bank.black}   |   Score: ${this.state.battleScore.white} / ${this.state.battleScore.black}`;
    const detail=this.notice||this.state.gameOver?.message||(this.selected?selectedDescription(this.state,this.selected,this.legalMoves,PIECES):'Select a piece. Dots = moves; rings = captures. B / Escape cancels.');
    if(this.selected&&!this.notice&&!this.state.gameOver){
      const split=detail.indexOf('. ');
      if(split>=0)return [heading,ledgers,detail.slice(0,split+1),detail.slice(split+2)];
    }
    return [heading,ledgers,detail];
  }
  renderUI() {
    const T=this.THREE;this.clearOwned(this.ui);this.allButtons=[];
    const spec=boardLayout(innerWidth,innerHeight,this.viewPreference,!!this.xrSession);
    if(spec.key!==this.layoutSpec.key&&!this.xrSession){this.orbitYaw=spec.focused?0:.18;this.orbitPitch=spec.focused?1.28:1.03;}
    this.layoutSpec=spec;
    // Menus temporarily fit the whole tabletop, but never change the saved view preference.
    const compact=spec.focused&&!MODAL_MODES.has(this.mode)&&this.mode!=='gallery';
    document.body.classList.toggle('board-focus',compact);
    document.querySelector('#help').textContent=compact?'Select a piece, then a marked square. Drag to orbit. Pinch / wheel to zoom. V: change view.':this.fullHelp;
    document.querySelectorAll('[data-action]').forEach(b=>{
      b.disabled=!actionAllowed(this.mode,b.dataset.action);
      if(b.dataset.action==='view'){b.textContent=spec.focused?'Table view':'Board view';b.setAttribute('aria-pressed',String(spec.focused));}
    });
    const lines=this.statusLines();status.textContent=lines.join(' | ');
    const tray=buildPlayTray(this,lines);
    this.focusable=this.allButtons.slice();
    if(MODAL_MODES.has(this.mode)){
      // Hide the toolbar and remove all its hits while an exclusive panel is open.
      tray.children.filter(o=>o.userData.action).forEach(o=>{o.visible=false;});
      this.targets=[];this.allButtons=[];this.focusable=[];
    }
    if(this.mode==='options'||this.mode==='help') {
      const menu=new T.Group();menu.position.set(0,.27,.055);menu.rotation.x=-Math.PI*.25;this.ui.add(menu);
      if(this.mode==='options'){
        this.addPanel(menu,['Table options','Board changes do not change the match.'],.65,.075,0,.21);
        const buttons=[['Smaller','smaller'],['Larger','larger'],['Higher','higher'],['Lower','lower'],
          [this.layoutSpec.focused?'Table view':'Board view','view'],['Place board','place'],['All pieces','gallery'],['How to play','help'],['New game','new'],['Promotion lab','lab'],['Fit view','fit']];
        buttons.forEach(([label,action],i)=>this.addPanel(menu,[label],.196,.058,(i%3-1)*.215,.122-Math.floor(i/3)*.07,action,action!=='view'||!this.xrSession));
        this.addPanel(menu,['Back to game'],.196,.058,.215,-.088,'cancel');
      }else{
        this.addPanel(menu,['HOW TO PLAY','Select your piece, then a marked destination.','Green dot: quiet move. Coral ring: capture.','Gold ring: selected. Red ring: king in check.',
          'Checkmate or causing stalemate wins.','Making the third repeated position loses.','Captures earn bank points. Market buys promotion licenses.',
          'Quest: trigger / pinch selects; B cancels; X market; Y undo.',
          'Xbox: D-pad / stick; A selects; B cancels; X undo; Y market.',
          'Desktop: click to play; drag to orbit; wheel / two-finger pinch zoom.'],.72,.33,0,.115);
        this.addPanel(menu,['Back to game'],.30,.05,0,-.10,'cancel');
      }
      this.focusable=this.allButtons.slice();this.menuNavigation=true;
    }
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
    if(this.mode==='gallery'){
      this.addPanel(tray,['Return to match'],.25,.048,0,-.06,'gallery');
      this.focusable=this.allButtons.slice();
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
    if(!actionAllowed(this.mode,action))return false;
    const [name,arg]=action.split(':');
    if(name==='view'){
      if(this.xrSession)return false;
      this.viewPreference=this.layoutSpec.focused?'table':'board';writeViewPreference(this.viewPreference);
      this.render();this.fitView();return true;
    }
    if(name==='square')return this.square(arg);
    if(name==='buy')return this.buy(arg);
    if(name==='promote'&&this.pending)return this.commit({from:this.pending.fromSquare,to:this.pending.toSquare,promotionType:arg});
    if(name==='cancel')return this.cancel();
    if(name==='undo') {
      if(this.pending||this.placing)return this.cancel();
      if(this.undoStack.length){this.state=this.undoStack.pop();this.selected=null;this.notice='Last action undone.';}else this.notice='Nothing to undo.';
      this.mode='play';this.menuNavigation=false;
    } else if(name==='options'||name==='help'){this.mode=this.mode===name?'play':name;this.focusIndex=0;this.menuNavigation=this.mode!=='play';}
    else if(name==='fit'){this.fitView();this.notice='View fitted to your screen.';}
    else if(name==='market') {this.mode=this.mode==='market'?(this.pending?'promotion':'play'):'market';this.focusIndex=0;}
    else if(name==='gallery') {this.pending=null;this.selected=null;this.mode=this.mode==='gallery'?'play':'gallery';this.menuNavigation=false;this.notice=this.mode==='gallery'?'Ten playable types. Dragon is artwork only, not a new rule.':'';}
    else if(name==='new'||name==='lab'){this.confirmScenario=name==='lab'?'promotionLab':'standard';this.mode='confirm';this.focusIndex=0;}
    else if(name==='confirm')return this.loadScenario(this.confirmScenario);
    else if(name==='smaller'||name==='larger'){this.scale=clamp(this.scale+(name==='larger'?.15:-.15),.65,1.6);this.root.scale.setScalar(this.scale);if(!this.xrSession)this.fitView();this.notice=`Board width: ${Math.round(.724*this.scale*100)} cm.`;}
    else if(name==='higher'||name==='lower'){this.root.position.y=clamp(this.root.position.y+(name==='higher'?.05:-.05),.15,1.6);}
    else if(name==='flip'){this.board.rotation.y+=Math.PI;this.pieces.rotation.y=this.board.rotation.y;this.notice='Board flipped. The controls stay facing you.';}
    else if(name==='place'){
      this.mode='play';this.menuNavigation=false;
      if(this.xrSession){this.placing=!this.placing;this.selected=null;this.notice=this.placing?'Positioning the board. Trigger or pinch to confirm.':'';}
      else{this.root.position.set(0,.72,0);this.root.rotation.y=0;this.orbitYaw=.18;this.fitView();this.notice='Board recentered. Drag to orbit; use Higher / Lower for table height.';}
    } else if(name==='exit'){if(this.xrSession)this.scene.exitVR();return;}
    this.render();if(!this.xrSession)this.orbit();
  }
  activate(action,source=null) {
    const now=performance.now();
    if(action===this.lastActivation.action&&now-this.lastActivation.time<140)return;
    this.lastActivation={action,time:now};this.dispatch(action);
    try{source?.gamepad?.hapticActuators?.[0]?.pulse(.22,30);}catch{}
  }
  fitView() {
    if(this.xrSession||!scene.camera)return;
    const rect=scene.canvas.getBoundingClientRect();
    const top=Math.max(0,document.querySelector('#desktop').getBoundingClientRect().bottom-rect.top);
    const bottom=Math.max(0,rect.bottom-document.querySelector('#help').getBoundingClientRect().top);
    const area=safeViewport(rect.width,rect.height,top+8,bottom+8);
    scene.camera.setViewOffset(area.width,area.height,0,area.offsetY,area.width,area.height);
    this.orbitDistance=.8*this.scale;
    // Fit the board and actual visible panels, not an oversized imaginary box above the tray.
    const T=this.THREE,points=[];
    for(const x of [-.37,.37])for(const y of [-.04,.12])for(const z of [-.37,.37])points.push(new T.Vector3(x,y,z));
    this.root.updateMatrixWorld(true);
    const inverse=new T.Matrix4().copy(this.root.matrixWorld).invert();
    this.ui.traverseVisible(o=>{const a=o.geometry?.attributes.position;if(!a)return;const m=new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld);for(let i=0;i<a.count;i++)points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(m));});
    const fits=distance=>{
      this.orbitDistance=distance;this.orbit();this.root.updateMatrixWorld(true);scene.camera.updateMatrixWorld(true);
      return points.every(point=>{
        const p=point.clone().applyMatrix4(this.root.matrixWorld).project(scene.camera);
        const px=(p.x+1)*area.width/2,py=(1-p.y)*area.height/2;
        return p.z>-1&&p.z<1&&Math.abs(px-area.centerX)<=area.halfWidth&&Math.abs(py-area.centerY)<=area.halfHeight;
      });
    };
    let low=.35*this.scale,high=1.5*this.scale;
    while(!fits(high)&&high<24)high*=1.5;
    for(let i=0;i<16;i++){const mid=(low+high)/2;if(fits(mid))high=mid;else low=mid;}
    this.orbitDistance=high*1.025;
    this.orbit();
  }
  orbit() {
    if(this.xrSession)return;
    const T=this.THREE,p=this.root.position;
    const horizontal=this.orbitDistance*Math.cos(this.orbitPitch);
    const offsetX=this.layoutSpec.focused?this.layoutSpec.targetX*this.scale:0,offsetZ=this.layoutSpec.focused?this.layoutSpec.targetZ*this.scale:0;
    this.viewer.object3D.position.set(p.x+offsetX+Math.sin(this.orbitYaw)*horizontal,p.y+Math.sin(this.orbitPitch)*this.orbitDistance,p.z+offsetZ+Math.cos(this.orbitYaw)*horizontal);
    // The A-Frame entity is a Group: lookAt aims its positive Z, unlike a Camera.
    // Rotate the rig half a turn so the child camera's negative Z faces the board.
    this.viewer.object3D.lookAt(new T.Vector3(p.x+this.layoutSpec.targetX*this.scale,p.y+.04*this.scale,p.z+this.layoutSpec.targetZ*this.scale));
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
    let drag=null,pinch=null;const pointers=new Map();
    const distance=()=>{const p=[...pointers.values()];return p.length<2?0:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);};
    scene.canvas.style.touchAction='none';
    scene.canvas.addEventListener('pointerdown',e=>{
      if(this.xrSession||e.button!==0)return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});scene.canvas.setPointerCapture(e.pointerId);
      if(pointers.size>1){pinch={distance:distance(),zoom:this.orbitDistance};drag=null;return;}
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};
    });
    scene.canvas.addEventListener('pointermove',e=>{
      if(this.xrSession)return;
      if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pinch){const d=distance();if(d>10){this.orbitDistance=clamp(pinch.zoom*pinch.distance/d,.5,6);this.orbit();}return;}
      if(drag&&drag.id===e.pointerId){
        const dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;
        drag.moved=drag.moved||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7;
        if(drag.moved){this.orbitYaw-=dx*.007;this.orbitPitch=clamp(this.orbitPitch+dy*.005,.18,1.42);this.orbit();}
        drag.lastX=e.clientX;drag.lastY=e.clientY;
      }else scene.canvas.style.cursor=this.pointerPick(e)?'pointer':'grab';
    });
    scene.canvas.addEventListener('pointerup',e=>{
      if(!this.xrSession&&!pinch&&drag?.id===e.pointerId&&!drag.moved){const hit=this.pointerPick(e);if(hit)this.activate(hit.object.userData.action);}
      pointers.delete(e.pointerId);drag=null;if(!pointers.size)pinch=null;
    });
    const clearPointers=()=>{drag=null;pinch=null;pointers.clear();};
    scene.canvas.addEventListener('pointercancel',clearPointers);window.addEventListener('blur',clearPointers);
    scene.canvas.addEventListener('wheel',e=>{if(this.xrSession)return;e.preventDefault();this.orbitDistance=clamp(this.orbitDistance+e.deltaY*.001,.5,6);this.orbit();},{passive:false});
    let resizing=false;
    const resized=()=>{if(resizing)return;resizing=true;requestAnimationFrame(()=>{resizing=false;this.render();this.fitView();});};
    window.addEventListener('resize',resized);
    if(window.ResizeObserver){const observer=new ResizeObserver(resized);observer.observe(document.querySelector('#desktop'));observer.observe(document.querySelector('#help'));this.layoutObserver=observer;}
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
      else if(e.key.toLowerCase()==='v')this.dispatch('view');
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
    this.xrSession=session;scene.camera.clearViewOffset();this.needsRecenter=true;this.viewer.object3D.position.set(0,0,0);this.viewer.object3D.quaternion.identity();
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
    this.root.position.set(0,.72,0);this.root.rotation.y=0;this.notice='Returned to the 3D board. The same game is still active.';this.render();this.fitView();requestAnimationFrame(()=>this.fitView());
  }
  sourceRay(frame,source) {
    const ref=scene.renderer.xr.getReferenceSpace();if(!frame||!ref)return null;
    const pose=frame.getPose(source.targetRaySpace,ref);if(!pose)return null;
    const T=this.THREE,m=new T.Matrix4().fromArray(pose.transform.matrix);
    return {origin:new T.Vector3().setFromMatrixPosition(m),direction:new T.Vector3(0,0,-1).transformDirection(m)};
  }
  selectRay(origin,direction,source=null,frame=null) {
    const hit=this.pick(origin,direction),action=hit?.object.userData.action;
    if(this.placing&&!['higher','lower','place','exit','cancel'].includes(action))this.place(origin,direction,frame);
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
    for(const [source,rec] of this.xrInputs){rec.line.visible=false;rec.grip.visible=false;if(!live.has(source)){rec.pinch=false;rec.armed=false;}}
    for(const source of this.xrSession.inputSources) {
      let rec=this.xrInputs.get(source);
      if(!rec){
        const color=source.handedness==='left'?0xefca83:0x7eeadd;
        const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.85}));line.renderOrder=20;scene.object3D.add(line);
        const grip=new T.Mesh(new T.BoxGeometry(.019,.035,.035),new T.MeshBasicMaterial({color}));scene.object3D.add(grip);
        rec={line,grip,pinch:false,handJoints:false,armed:false};this.xrInputs.set(source,rec);
      }
      const ray=this.sourceRay(frame,source);if(!ray){rec.armed=false;rec.pinch=false;continue;}
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
        }else{rec.pinch=false;rec.armed=false;}
      }
      if(source.gamepad)this.pollPad(source.gamepad,source,time,true,source.handedness);
    }
  }
  navigate(dx,dy) {
    this.focusEnabled=true;
    if(this.menuNavigation||MODAL_MODES.has(this.mode)) {
      this.menuNavigation=true;const n=this.focusable.length;if(n)this.focusIndex=(this.focusIndex+dx+dy+n)%n;
    } else {
      const flip=Math.cos(this.root.rotation.y+this.board.rotation.y-(this.xrSession?this.viewYaw||0:this.orbitYaw))<0?-1:1;
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
      if(b[11])this.dispatch('view');
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
    const atlas=await loadPieceAtlas(T,scene.renderer,import.meta.url);
    const app=new LedgerAR(T,atlas);window.WarLedgerAR=app;
    AFRAME.registerComponent('warledger-loop',{tick(time){app.tick(time);}});scene.setAttribute('warledger-loop','');
  }catch(error){status.textContent=`Could not load the AR board: ${error.message}. Your save is unchanged.`;document.querySelector('#failure').hidden=false;console.error(error);}
}
start();
