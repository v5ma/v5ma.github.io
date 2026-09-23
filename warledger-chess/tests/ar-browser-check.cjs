// Real Chromium/WebGL checks. XR rays and Xbox input are simulated, not Quest hardware.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require(path.join(process.env.WL_PLAYWRIGHT||process.cwd(),'node_modules/playwright'));
const root=path.resolve(__dirname,'../..'),out=path.join(root,'warledger-check-output');fs.mkdirSync(out,{recursive:true});
fs.cpSync(path.join(root,'warledger-chess'),path.join(out,'source'),{recursive:true});
const expectedRelease=fs.readFileSync(path.join(root,'warledger-chess/ar.html'),'utf8').match(/data-release="([^"]+)"/)[1];
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{
  let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);});
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runBrowser(browser,base,label){
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url()==='https://aframe.io/releases/1.7.1/aframe.min.js')r.body().then(b=>fs.writeFileSync(path.join(out,'aframe-1.7.1.js'),b)).catch(()=>{});});
  try{
    await page.goto(`${base}warledger-chess/ar.html?test=${Date.now()}`,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.WarLedgerAR?.ready,null,{timeout:45000});
    assert.equal(await page.evaluate(()=>document.body.dataset.release),expectedRelease);
    const info=await page.evaluate(()=>({pieces:WarLedgerAR.pieces.children.length,width:WarLedgerAR.atlas.image.width,height:WarLedgerAR.atlas.image.height,engineD:WarLedgerAR.art.make('D').userData.artType}));
    assert.deepEqual(info,{pieces:32,width:512,height:1024,engineD:'D'});
    async function square(s){
      const p=await page.evaluate(s=>{const a=WarLedgerAR,p=a.pieces.children.find(p=>p.userData.square===s);return p?a.projectObject(p.children[p.children.length-1]):a.projectSquare(s);},s);
      const hit=await page.evaluate(p=>WarLedgerAR.pointerPick({clientX:p.x,clientY:p.y})?.object.userData.action,p);
      assert.equal(hit,`square:${s}`,`Visible mouse target must resolve to ${s}`);
      await page.mouse.click(p.x,p.y);await page.waitForTimeout(200);
    }
    async function action(a){
      const exists=await page.evaluate(a=>WarLedgerAR.targets.some(t=>t.userData.action===a),a);
      if(!exists&&['gallery','new','lab','help','smaller','larger','fit','place'].includes(a))await action('options');
      const p=await page.evaluate(a=>WarLedgerAR.projectAction(a),a);await page.mouse.click(p.x,p.y);await page.waitForTimeout(200);}
    const facing=await page.evaluate(()=>{const a=WarLedgerAR,c=a.scene.camera,p=a.root.getWorldPosition(new a.THREE.Vector3()),d=c.getWorldDirection(new a.THREE.Vector3()),o=c.getWorldPosition(new a.THREE.Vector3());return d.dot(p.sub(o).normalize());});
    assert.ok(facing>.9,'Camera must face the tabletop, not the back of the A-Frame rig.');
    await square('e2');assert.equal(await page.evaluate(()=>WarLedgerAR.selected),'e2');
    await square('e4');assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[4][4]?.type),'P');assert.equal(await page.evaluate(()=>WarLedgerAR.state.sideToMove),'black');
    await square('e7');assert.equal(await page.evaluate(()=>WarLedgerAR.selected),'e7');await square('e5');assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[3][4]?.side),'black');
    await page.screenshot({path:path.join(out,`${label}-board.png`)});
    await action('market');assert.equal(await page.evaluate(()=>WarLedgerAR.mode),'market');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>WarLedgerAR.mode),'play');
    const before=await page.evaluate(()=>JSON.stringify(WarLedgerAR.state));await action('gallery');
    assert.equal(await page.evaluate(()=>WarLedgerAR.gallery.children.filter(x=>x.userData.artType).length),11);
    assert.equal(await page.evaluate(()=>JSON.stringify(WarLedgerAR.state)),before);await page.screenshot({path:path.join(out,`${label}-gallery.png`)});await action('gallery');
    await page.evaluate(()=>WarLedgerAR.loadScenario('promotionLab'));await square('e7');await square('e8');
    assert.equal(await page.evaluate(()=>WarLedgerAR.mode),'promotion');await action('buy:D');assert.equal(await page.evaluate(()=>WarLedgerAR.state.licenses.white.D),1);
    await action('promote:D');assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[0][4]?.type),'D');
    assert.equal(await page.evaluate(()=>WarLedgerAR.state.bank.white),0);await page.screenshot({path:path.join(out,`${label}-chancellor.png`)});
    await page.goto(`${base}warledger-chess/?test=${Date.now()}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.WarLedgerDebug);
    assert.equal(await page.evaluate(()=>WarLedgerDebug.getState().board[0][4]?.type),'D');
    await page.locator('#undo').click();assert.equal(await page.evaluate(()=>WarLedgerDebug.getState().board[1][4]?.type),'P');
    await page.goto(`${base}warledger-chess/ar.html?test=${Date.now()}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.WarLedgerAR?.ready);
    assert.equal(await page.evaluate(()=>WarLedgerAR.state.licenses.white.D),1);await action('undo');assert.equal(await page.evaluate(()=>WarLedgerAR.state.bank.white),10);
    await action('new');assert.equal(await page.evaluate(()=>WarLedgerAR.mode),'confirm');await action('cancel');assert.equal(await page.evaluate(()=>WarLedgerAR.state.bank.white),10);
    await action('new');await action('confirm');assert.equal(await page.evaluate(()=>WarLedgerAR.pieces.children.length),32);
    await page.evaluate(()=>{
      window.testPad={id:'Xbox test',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
      Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.testPad]});
      window.testFrames=0;window.testPendingButton=null;window.testPressSerial=0;window.testConsumedSerial=0;
      const tick=WarLedgerAR.tick.bind(WarLedgerAR);
      WarLedgerAR.tick=time=>{
        testFrames++;tick(time);
        // Simulate a single-frame press, releasing only after the unmodified game has read it.
        // Fixed wall-clock pulses either vanish or auto-repeat under slow software WebGL.
        const b=window.testPendingButton;
        if(b!==null&&WarLedgerAR.inputStates.get('gamepad-0')?.buttons[b]===true){
          testPad.buttons[b]={pressed:false,value:0};testPendingButton=null;testConsumedSerial=testPressSerial;
        }
      };
    });
    assert.equal(await page.evaluate(()=>navigator.getGamepads()[0]===testPad),true);
    async function press(b){
      const serial=await page.evaluate(b=>{testPendingButton=b;testPad.buttons[b]={pressed:true,value:1};return ++testPressSerial;},b);
      // Require actual A-Frame frames. Never invoke tick or pollPad from the test.
      await page.waitForFunction(serial=>testConsumedSerial===serial,serial,{timeout:8000});
      await page.waitForFunction(b=>WarLedgerAR.inputStates.get('gamepad-0')?.buttons[b]===false,b,{timeout:8000});
    }
    await press(15);assert.equal(await page.evaluate(()=>WarLedgerAR.focusSquare),'f2');await press(14);await press(0);
    assert.equal(await page.evaluate(()=>WarLedgerAR.selected),'e2');await press(12);await press(12);await press(0);assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[4][4]?.side),'white');
    await press(3);assert.equal(await page.evaluate(()=>WarLedgerAR.mode),'market');await press(1);assert.equal(await page.evaluate(()=>WarLedgerAR.mode),'play');
    async function ray(s){await page.evaluate(s=>{const a=WarLedgerAR,t=a.tiles.find(t=>t.userData.square===s),p=t.getWorldPosition(new a.THREE.Vector3());a.selectRay(p.clone().add(new a.THREE.Vector3(0,.5,0)),new a.THREE.Vector3(0,-1,0));},s);await page.waitForTimeout(200);}
    await ray('e7');await ray('e5');assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[3][4]?.side),'black');
    // Tactical/readability regression pass. All controls below are exercised through the rendered UI.
    await page.evaluate(()=>WarLedgerAR.loadScenario('standard'));
    await square('e2');
    assert.match(await page.locator('#status').textContent(),/Pawn on e2.*2 legal moves/);
    assert.equal(await page.evaluate(()=>WarLedgerAR.markers.markers.find(m=>m.square==='e4').parts.move.visible),true);
    assert.equal(await page.evaluate(()=>WarLedgerAR.markers.markers.find(m=>m.square==='e2').parts.selected.visible),true);
    await page.keyboard.press('Escape');
    const trayBefore=await page.evaluate(()=>{const v=WarLedgerAR.allButtons[0].getWorldPosition(new WarLedgerAR.THREE.Vector3());return v.toArray();});
    await action('flip');
    assert.deepEqual(await page.evaluate(()=>WarLedgerAR.allButtons[0].getWorldPosition(new WarLedgerAR.THREE.Vector3()).toArray()),trayBefore);
    await action('flip');
    await action('options');
    assert.equal(await page.evaluate(()=>WarLedgerAR.targets.some(t=>t.userData.action?.startsWith('square:'))),false);
    const stable=await page.evaluate(()=>JSON.stringify(WarLedgerAR.state));
    await page.evaluate(()=>WarLedgerAR.dispatch('square:e2'));
    assert.equal(await page.evaluate(()=>JSON.stringify(WarLedgerAR.state)),stable);
    assert.equal(await page.evaluate(()=>WarLedgerAR.selected),null);
    await action('help');assert.equal(await page.evaluate(()=>WarLedgerAR.mode),'help');
    await action('cancel');assert.equal(await page.evaluate(()=>WarLedgerAR.mode),'play');
    const markerCount=await page.evaluate(()=>WarLedgerAR.markers.group.children.length);
    for(let i=0;i<4;i++){await action('market');await action('cancel');}
    assert.equal(await page.evaluate(()=>WarLedgerAR.markers.group.children.length),markerCount);
    for(const [width,height,name] of [[390,844,'portrait'],[844,390,'landscape']]){
      await page.setViewportSize({width,height});await page.waitForTimeout(600);
      const framed=await page.evaluate(()=>{
        const a=WarLedgerAR,top=document.querySelector('#desktop').getBoundingClientRect().bottom,bottom=document.querySelector('#help').getBoundingClientRect().top;
        return ['a1','h1','a8','h8'].map(s=>{const p=a.projectSquare(s);return {s,...p,inFrame:p.x>0&&p.x<innerWidth&&p.y>top&&p.y<bottom};});
      });
      assert.ok(framed.every(p=>p.inFrame),`Board must remain inside usable ${name} screen: ${JSON.stringify(framed)}`);
      await square('e2');await square('e4');assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[4][4]?.type),'P');
      await action('undo');
      await page.screenshot({path:path.join(out,`${label}-${name}.png`)});
    }
    await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(500);
    await page.screenshot({path:path.join(out,`${label}-tactical.png`)});
    // Synthetic multi-pointer gesture: the real pointer listeners receive the gesture, not direct zoom calls.
    const zoomBefore=await page.evaluate(()=>WarLedgerAR.orbitDistance);
    await page.evaluate(()=>{
      const canvas=WarLedgerAR.scene.canvas;
      // Synthetic IDs cannot own pointer capture; that browser API is irrelevant to this input-routing check.
      const capture=canvas.setPointerCapture;canvas.setPointerCapture=()=>{};
      const emit=(type,id,x)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId:id,clientX:x,clientY:400,button:0,bubbles:true}));
      emit('pointerdown',10,600);emit('pointerdown',11,700);emit('pointermove',11,760);
      emit('pointerup',11,760);emit('pointerup',10,600);canvas.setPointerCapture=capture;
    });
    assert.ok(await page.evaluate(()=>WarLedgerAR.orbitDistance)<zoomBefore);
    assert.equal(await page.evaluate(()=>WarLedgerAR.selected),null);
    await page.evaluate(()=>WarLedgerAR.fitView());
    // Keep the saved match while changing the screen layout. The board must be
    // materially larger, not merely inside the viewport. No XR hardware is emulated.
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(600);
    async function boardWidth(){return page.evaluate(()=>{const p=['a1','a8','h1','h8'].map(s=>WarLedgerAR.projectSquare(s));return Math.max(...p.map(v=>v.x))-Math.min(...p.map(v=>v.x));});}
    const savedMatch=await page.evaluate(()=>JSON.stringify({state:WarLedgerAR.state,undo:WarLedgerAR.undoStack}));
    if(await page.evaluate(()=>WarLedgerAR.layoutSpec.focused))await page.locator('[data-action="view"]').click();
    await page.waitForTimeout(600);const tableWidth=await boardWidth();
    await page.locator('[data-action="view"]').click();await page.waitForTimeout(600);
    const closeWidth=await boardWidth();assert.ok(closeWidth>tableWidth*1.35,`Close view should enlarge landscape board: ${tableWidth} -> ${closeWidth}`);
    assert.equal(await page.evaluate(()=>WarLedgerAR.layoutSpec.side),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('warledger-chess-view-v1')),'board');
    assert.equal(await page.evaluate(()=>JSON.stringify({state:WarLedgerAR.state,undo:WarLedgerAR.undoStack})),savedMatch);
    await square('e2');await square('e4');await action('undo');
    await action('options');await action('help');await action('cancel');
    await page.screenshot({path:path.join(out,`${label}-close-landscape.png`)});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(600);
    assert.equal(await page.evaluate(()=>WarLedgerAR.layoutSpec.side),false);
    await square('e2');await square('e4');await action('undo');
    await page.screenshot({path:path.join(out,`${label}-close-portrait.png`)});
    // Revisit a real page, with an actual failed texture request: the whole board
    // must remain playable using the previously verified low-bandwidth atlas.
    await page.route('**/assets/piece-faces-hd-2.webp',route=>route.abort());
    await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.WarLedgerAR?.ready);
    assert.equal(await page.evaluate(()=>WarLedgerAR.atlas.userData.quality),'fallback-64');
    assert.equal(await page.evaluate(()=>WarLedgerAR.layoutSpec.focused),true);
    assert.equal(await page.evaluate(()=>JSON.stringify({state:WarLedgerAR.state,undo:WarLedgerAR.undoStack})),savedMatch);
    await square('e2');await square('e4');await action('undo');
    await page.unroute('**/assets/piece-faces-hd-2.webp');
    await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.WarLedgerAR?.ready);
    assert.equal(await page.evaluate(()=>WarLedgerAR.atlas.userData.quality),'hd-128');
    assert.deepEqual(errors,[]);
    const report={label,release:expectedRelease,passed:true,landscapeBoardWidth:{table:tableWidth,board:closeWidth,ratio:closeWidth/tableWidth},realBrowser:'Chromium WebGL (software rendering)',physicalQuestTested:false,xrInput:'simulated ray; no immersive hardware session',checks:['camera faces tabletop','texture decode','32 cuboid pieces','white and black mouse moves','world-space market/cancel','11-art gallery','occluded promotion target','licensed Chancellor promotion','2D/AR shared save and undo','reset confirmation','Xbox frame polling and B cancel','XR ray routing','piece guides and markers','flip preserves tray orientation','exclusive modal targets','marker resource reuse','portrait and landscape play','synthetic two-pointer zoom','128px original-source HD textures','larger landscape close view','view preferences preserve match and undo','portrait close-view play','HD load failure fallback and recovery']};
    fs.writeFileSync(path.join(out,`${label}-report.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  }catch(error){
    await page.screenshot({path:path.join(out,`${label}-failure.png`)}).catch(()=>{});
    const state=await page.evaluate(()=>window.WarLedgerAR?{selected:WarLedgerAR.selected,mode:WarLedgerAR.mode,focus:WarLedgerAR.focusSquare,board:WarLedgerAR.state.board,frames:window.testFrames,scenePlaying:WarLedgerAR.scene.isPlaying,componentPlaying:WarLedgerAR.scene.components['warledger-loop']?.isPlaying,componentOrder:WarLedgerAR.scene.componentOrder,pads:Array.from(WarLedgerAR.inputStates.entries()),time:WarLedgerAR.scene.time}:null).catch(()=>null);
    fs.writeFileSync(path.join(out,`${label}-errors.json`),JSON.stringify({message:error.message,stack:error.stack,errors,state},null,2));throw error;
  }finally{await context.close();}
}
(async()=>{
  await new Promise(resolve=>server.listen(8734,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
  try{
    await runBrowser(browser,'http://127.0.0.1:8734/','local');
    if(process.env.WL_VERIFY_LIVE==='1'){
      const base='https://v5ma.github.io/';let ready=false;
      const files=['ar.html','warledger-ar.mjs','warledger-ui.mjs','warledger-art.mjs','warledger-session.mjs','warledger-input.mjs','warledger-engine.mjs','warledger-presentation.mjs','assets/piece-faces.webp','warledger-closeview.mjs','warledger-hd-art.mjs','assets/piece-faces-hd-manifest.json',...Array.from({length:4},(_,i)=>`assets/piece-faces-hd-${i}.webp`)];
      const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
      const expected=Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(path.join(root,'warledger-chess',f)))]));
      for(let attempt=0;attempt<100;attempt++){
        try{
          const results=await Promise.all(files.map(async f=>{const r=await fetch(`${base}warledger-chess/${f}?v=${Date.now()}`);return r.ok&&hash(Buffer.from(await r.arrayBuffer()))===expected[f];}));
          if(results.every(Boolean)){ready=true;break;}
        }catch{}
        await sleep(6000);
      }
      assert.ok(ready,`All ${files.length} live runtime and artwork files must match the checked-out release byte for byte.`);
      fs.writeFileSync(path.join(out,'live-hashes.json'),JSON.stringify({release:expectedRelease,files:expected},null,2));
      await runBrowser(browser,base,'live');
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
