import {createRoadTravel} from './road-travel.mjs';
/* Optional connection only when arriving from Vinci. No actor, currency,
 * checkpoint format, combat, geometry or private hub is imported or changed. */
export function installVinciReturn(g,{document:doc=globalThis.document,location:loc=globalThis.location}={}){
 if(g.vinciReturn)return g.vinciReturn;
 const travel=createRoadTravel({baseURL:loc.href,getSession:()=>g.scene.renderer.xr.getSession(),navigate:url=>loc.assign(url),save:()=>{
  g.setPaused(true);
  if(g.arMode||g.practice||g.game.unscored)return true; // Those modes never replace a scored checkpoint.
  return g.checkpoint.flush(true);
 }});
 const ask=()=>g.dominionControls.confirm('Return to Vinci?','Save this expedition, end XR if active, and open Vinci. The two games keep separate equipment and rewards. This visit alone does not complete an expedition.',async()=>{
  const result=await travel.go('vinci');if(!result.ok)g.dominionControls.notice('Stayed in Vesperfall. '+result.error);
 });
 const button=doc.createElement('button');button.id='vinci-return';button.textContent='Save and return to Vinci';button.onclick=ask;
 const host=doc.getElementById('pilgrim-rest');host.append(button);
 const text=doc.createElement('p');text.id='vinci-arrival';text.textContent='You arrived from Vinci, an artisan settlement beyond this frontier. Choose a mission or continue your saved expedition. In XR, return through Missions > Expedition options / saves > Saved expedition > Return to Vinci. No shared inventory or online economy is enabled.';host.append(text);
 const draw=g.drawMenu.bind(g);
 g.drawMenu=function(){
  const returnSelected=g.dominionControls.state.xrScreen==='saved'&&g.menuSelection===5;
  draw();
  if(g.dominionControls.state.xrScreen!=='saved'||!g.xrPanel||g.xrMenuRows.length!==5)return;
  // Use the existing row hit-test/action router. The saved screen has one spare
  // row; retain all five original rows and all existing Back/Exit behavior.
  const label='Return to Vinci / save and exit';g.xrMenuRows.push([label,ask]);
  const {ctx,texture}=g.xrPanel;
  if(returnSelected){g.menuSelection=5;ctx.fillStyle='#283e50';ctx.fillRect(95,495,834,61);ctx.fillStyle='#f7eed8';ctx.font='27px Arial';ctx.textAlign='center';ctx.fillText(g.xrMenuRows[4][0],512,535,800);}
  ctx.fillStyle=g.menuSelection===5?'#486971':'#283e50';ctx.fillRect(95,570,834,61);ctx.fillStyle='#f7eed8';ctx.font='27px Arial';ctx.textAlign='center';ctx.fillText(label,512,610,800);texture.needsUpdate=true;
 };
 g.vinciReturn={ask,inspect:()=>travel.inspect()};return g.vinciReturn;
}
if(globalThis.document&&globalThis.location&&new URLSearchParams(location.search).get('from')==='vinci'){
 let attempts=0;
 const boot=()=>{const g=document.getElementById('scene')?.components?.['vesper-game'];if(g?.checkpoint&&g.dominionControls&&document.getElementById('pilgrim-rest')){installVinciReturn(g);return;}if(++attempts<200)setTimeout(boot,100);};
 boot();
}
