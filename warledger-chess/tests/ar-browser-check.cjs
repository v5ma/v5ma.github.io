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
    assert.deepEqual(info,{pieces:32,width:256,height:512,engineD:'D'});
    async function square(s){
      const p=await page.evaluate(s=>{const a=WarLedgerAR,p=a.pieces.children.find(p=>p.userData.square===s);return p?a.projectObject(p.children[p.children.length-1]):a.projectSquare(s);},s);
      const hit=await page.evaluate(p=>WarLedgerAR.pointerPick({clientX:p.x,clientY:p.y})?.object.userData.action,p);
      assert.equal(hit,`square:${s}`,`Visible mouse target must resolve to ${s}`);
      await page.mouse.click(p.x,p.y);await page.waitForTimeout(200);
    }
    async function action(a){const p=await page.evaluate(a=>WarLedgerAR.projectAction(a),a);await page.mouse.click(p.x,p.y);await page.waitForTimeout(200);}
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
    await page.evaluate(()=>{window.testPad={id:'Xbox test',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[window.testPad];});
    async function press(b){await page.evaluate(b=>testPad.buttons[b]={pressed:true,value:1},b);await page.waitForTimeout(150);await page.evaluate(b=>testPad.buttons[b]={pressed:false,value:0},b);await page.waitForTimeout(150);}
    await press(15);assert.equal(await page.evaluate(()=>WarLedgerAR.focusSquare),'f2');await press(14);await press(0);
    assert.equal(await page.evaluate(()=>WarLedgerAR.selected),'e2');await press(12);await press(12);await press(0);assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[4][4]?.side),'white');
    await press(3);assert.equal(await page.evaluate(()=>WarLedgerAR.mode),'market');await press(1);assert.equal(await page.evaluate(()=>WarLedgerAR.mode),'play');
    async function ray(s){await page.evaluate(s=>{const a=WarLedgerAR,t=a.tiles.find(t=>t.userData.square===s),p=t.getWorldPosition(new a.THREE.Vector3());a.selectRay(p.clone().add(new a.THREE.Vector3(0,.5,0)),new a.THREE.Vector3(0,-1,0));},s);await page.waitForTimeout(200);}
    await ray('e7');await ray('e5');assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[3][4]?.side),'black');
    assert.deepEqual(errors,[]);
    const report={label,release:expectedRelease,passed:true,realBrowser:'Chromium WebGL (software rendering)',physicalQuestTested:false,xrInput:'simulated ray; no immersive hardware session',checks:['camera faces tabletop','texture decode','32 cuboid pieces','white and black mouse moves','world-space market/cancel','11-art gallery','occluded promotion target','licensed Chancellor promotion','2D/AR shared save and undo','reset confirmation','Xbox polling and B cancel','XR ray routing']};
    fs.writeFileSync(path.join(out,`${label}-report.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  }catch(error){
    await page.screenshot({path:path.join(out,`${label}-failure.png`)}).catch(()=>{});
    const state=await page.evaluate(()=>window.WarLedgerAR?{selected:WarLedgerAR.selected,mode:WarLedgerAR.mode,focus:WarLedgerAR.focusSquare,board:WarLedgerAR.state.board}:null).catch(()=>null);
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
      const files=['ar.html','warledger-ar.mjs','warledger-ui.mjs','warledger-art.mjs','warledger-session.mjs','warledger-input.mjs','warledger-engine.mjs','assets/piece-faces.webp'];
      const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
      const expected=Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(path.join(root,'warledger-chess',f)))]));
      for(let attempt=0;attempt<100;attempt++){
        try{
          const results=await Promise.all(files.map(async f=>{const r=await fetch(`${base}warledger-chess/${f}?v=${Date.now()}`);return r.ok&&hash(Buffer.from(await r.arrayBuffer()))===expected[f];}));
          if(results.every(Boolean)){ready=true;break;}
        }catch{}
        await sleep(6000);
      }
      assert.ok(ready,'All eight live runtime and artwork files must match the checked-out release byte for byte.');
      fs.writeFileSync(path.join(out,'live-hashes.json'),JSON.stringify({release:expectedRelease,files:expected},null,2));
      await runBrowser(browser,base,'live');
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
