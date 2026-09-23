// Real Chromium/WebGL checks. XR rays and Xbox input are simulated; this is not a Quest hardware test.
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const http=require('node:http');const crypto=require('node:crypto');
const {chromium}=require(path.join(process.env.WL_PLAYWRIGHT||process.cwd(),'node_modules/playwright'));
const root=path.resolve(__dirname,'../..'),out=path.join(root,'warledger-check-output');fs.mkdirSync(out,{recursive:true});
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
  try{
    await page.goto(`${base}warledger-chess/ar.html?test=${Date.now()}`,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.WarLedgerAR?.ready,null,{timeout:45000});
    const info=await page.evaluate(()=>({pieces:WarLedgerAR.pieces.children.length,width:WarLedgerAR.atlas.image.width,height:WarLedgerAR.atlas.image.height,engineD:WarLedgerAR.art.make('D').userData.artType}));
    assert.deepEqual(info,{pieces:32,width:256,height:512,engineD:'D'});
    async function square(s){const p=await page.evaluate(s=>WarLedgerAR.projectSquare(s),s);await page.mouse.click(p.x,p.y);await page.waitForTimeout(180);}
    async function action(a){const p=await page.evaluate(a=>WarLedgerAR.projectAction(a),a);await page.mouse.click(p.x,p.y);await page.waitForTimeout(180);}
    await square('e2');assert.equal(await page.evaluate(()=>WarLedgerAR.selected),'e2');
    await square('e4');assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[4][4]?.type),'P');assert.equal(await page.evaluate(()=>WarLedgerAR.state.sideToMove),'black');
    await square('e7');await square('e5');assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[3][4]?.side),'black');
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
    // Standard mapping Xbox gamepad; exercise the actual per-frame input polling.
    await page.evaluate(()=>{window.testPad={id:'Xbox test',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[window.testPad];});
    async function press(b){await page.evaluate(b=>testPad.buttons[b]={pressed:true,value:1},b);await page.waitForTimeout(100);await page.evaluate(b=>testPad.buttons[b]={pressed:false,value:0},b);await page.waitForTimeout(100);}
    await press(15);assert.equal(await page.evaluate(()=>WarLedgerAR.focusSquare),'f2');await press(14);await press(0);
    assert.equal(await page.evaluate(()=>WarLedgerAR.selected),'e2');await press(12);await press(12);await press(0);assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[4][4]?.side),'white');
    // A synthetic tracked-controller ray runs through the exact same ray hit path as XR select.
    async function ray(s){await page.evaluate(s=>{const a=WarLedgerAR,t=a.tiles.find(t=>t.userData.square===s),p=t.getWorldPosition(new a.THREE.Vector3());a.selectRay(p.clone().add(new a.THREE.Vector3(0,.5,0)),new a.THREE.Vector3(0,-1,0));},s);await page.waitForTimeout(180);}
    await ray('e7');await ray('e5');assert.equal(await page.evaluate(()=>WarLedgerAR.state.board[3][4]?.side),'black');
    assert.deepEqual(errors,[]);
    const report={label,passed:true,realBrowser:'Chromium WebGL (software rendering)',physicalQuestTested:false,xrInput:'simulated ray; no immersive hardware session',checks:['texture decode','32 cuboid pieces','mouse legal moves','world-space market/cancel','11-art gallery','licensed Chancellor promotion','2D/AR shared save and undo','reset confirmation','Xbox polling','XR ray routing']};
    fs.writeFileSync(path.join(out,`${label}-report.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  }catch(error){await page.screenshot({path:path.join(out,`${label}-failure.png`)}).catch(()=>{});fs.writeFileSync(path.join(out,`${label}-errors.json`),JSON.stringify({message:error.message,stack:error.stack,errors},null,2));throw error;}
  finally{await context.close();}
}
(async()=>{
  await new Promise(resolve=>server.listen(8734,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
  try{
    await runBrowser(browser,'http://127.0.0.1:8734/','local');
    if(process.env.WL_VERIFY_LIVE==='1'){
      const base='https://v5ma.github.io/';let ready=false;
      const local=fs.readFileSync(path.join(root,'warledger-chess/assets/piece-faces.webp'));
      const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
      for(let attempt=0;attempt<100;attempt++){
        try{
          const r=await fetch(`${base}warledger-chess/ar.html?v=${Date.now()}`);
          const a=await fetch(`${base}warledger-chess/assets/piece-faces.webp?v=${Date.now()}`);
          if(r.ok&&a.ok&&(await r.text()).includes('ar-blocks-20260922-1')&&hash(Buffer.from(await a.arrayBuffer()))===hash(local)){ready=true;break;}
        }catch{}
        await sleep(6000);
      }
      assert.ok(ready,'The upgraded Pages release and exact texture bytes must be live.');
      await runBrowser(browser,base,'live');
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
