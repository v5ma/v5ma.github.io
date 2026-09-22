/* The in-headset UI invokes the existing DOM handlers and reducers. No parallel
 * inventory, quest, shop, save or text-entry implementation lives here. */
import * as T from './vendor/three.module.js';
const W=1024,H=1536;
function words(text,width=49){
 const result=[];
 for(const paragraph of String(text||'').split(/\n/)){
  let line='';for(const word of paragraph.split(/\s+/)){if(!word)continue;if((line+' '+word).length>width&&line){result.push(line);line='';}line+=(line?' ':'')+word;}result.push(line);
 }
 return result;
}
const label=e=>e.getAttribute('aria-label')||e.labels?.[0]?.textContent||e.textContent?.trim()||e.placeholder||e.id||e.tagName;
export function createXRPanel({ui,actions,getState,consoleUI,exit,clock=()=>performance.now()}){
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const g=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 let buttons=[],root=null,page=0,textPage=0,last='',lastDraw=-Infinity,hover='',currentDescription='',lastFocus=null;
 const button=(key,text,x,y,w,h,run,hold=null,element=null)=>buttons.push({key,text,x,y,w,h,run,hold,element});
 // Ray hit tests and painting share one model. Invalidate synchronously on
 // DOM/focus/page changes; bounded refresh also sees property-only updates.
 let cached=null,dirty=true,observed=null,modelAt=-Infinity,modelPage=-1,modelTextPage=-1,revision=0,paintRevision=-1,rebuilds=0,paints=0;
 const observer=typeof globalThis.MutationObserver==='function'?new globalThis.MutationObserver(()=>{dirty=true;}):null;
 function model(force=false){
  const next=ui.root(),wheel=actions.wheelActive(),target=next||(wheel?document.getElementById('guild-wheel'):null),time=clock();
  if(observer?.takeRecords().length)dirty=true;
  if(target!==observed){observer?.disconnect();observed=target;if(target)observer?.observe(target,{subtree:true,childList:true,characterData:true,attributes:true});dirty=true;}
  if(!force&&cached&&!dirty&&next===root&&wheel===last&&document.activeElement===lastFocus&&page===modelPage&&textPage===modelTextPage&&time>=modelAt&&time-modelAt<100)return cached;
  cached=rebuild();modelPage=page;modelTextPage=textPage;modelAt=time;dirty=false;revision++;rebuilds++;return cached;
 }

 function controls(){
  return [
   ['jump','A / Jump or stair',()=>actions.jump()],['interact','B (right) / Interact',()=>actions.interact()],
   ['vehicle','Ride / leave vehicle',()=>actions.vehicle()],['quick','X (left) / Last tool',()=>actions.quickTool()],
   ['reload','Reload sling',()=>actions.reload()],['dodge','Right grip / Dodge',()=>actions.dodge()],
   ['tools','Equipment wheel',()=>actions.openWheel('tools')],['dispatch','Guild dispatch',()=>actions.dispatch()],
   ['map','Map',()=>actions.map()],['pause','Pause / settings',()=>actions.pause()],
   ['scan','Inspect nearby',()=>actions.scan()],['cover','Take cover',()=>actions.cover()],
   ['magic','Lantern / discipline',()=>actions.magic()],['special','Special ability',()=>actions.special()],
   ['recenter','Center game camera',()=>actions.recenter()],['journal','Notebook / pack',()=>actions.journal()],['presentation','XR view / diorama openings',()=>actions.presentation?.()]
  ];
 }
 function rebuild(){
  buttons=[];const next=ui.root(),wheel=actions.wheelActive();
  if(next!==root||last!==wheel){root=next;last=wheel;page=textPage=0;}
  const s=getState();let text='',title='',items=[];
  if(root){
   title=root.getAttribute('aria-label')||root.querySelector('h1,h2,h3')?.textContent||'Guild menu';
   const description=root.cloneNode(true);description.querySelectorAll?.('button,nav,select,input,script,style').forEach(e=>e.remove());text=description.textContent||'';
   items=ui.choices(root).flatMap((e,index)=>{
    if(e.tagName==='SELECT'||e.type==='range')return [
     [`dom${index}-minus`,label(e)+' -',()=>ui.adjust(e,-1),null,e],
     [`dom${index}-plus`,label(e)+' + ('+(e.selectedOptions?.[0]?.textContent||e.value)+')',()=>ui.adjust(e,1),null,e]
    ];
    return [[`dom${index}`,label(e),()=>ui.activate(e),null,e]];
   });
  }else if(wheel){
   title='Equipment and choices';text=document.getElementById('guild-wheel')?.innerText||JSON.stringify(consoleUI.inspect().wheel||wheel);
   items=[['previous','Previous choice',()=>actions.updateWheel(0,0,0,-1)],['next','Next choice',()=>actions.updateWheel(0,0,0,1)],['variant-','Previous variant',()=>actions.updateWheel(0,0,-1,0)],['variant+','Next variant',()=>actions.updateWheel(0,0,1,0)],['confirm','Confirm choice',()=>actions.closeWheel(true)],['cancel','Cancel wheel',()=>actions.closeWheel(false)]];
  }else{
   title='Leonardo\'s Guild';
   const mission=['mission-tag','mission-title','mission-description','context','toast'].map(id=>document.getElementById(id)?.innerText||'').join('\n');
   text=`${s.mode} | Tool: ${s.resonance.tool} | Health: ${Math.round(s.health)}\nFlorins: ${s.credits} | Sling: ${s.resonance.ready} ready / ${s.resonance.reserve} reserve\n${mission}`;
   items=controls();
  }
  const lines=words(text),textPages=Math.max(1,Math.ceil(lines.length/14))+(root?.querySelector('canvas')?1:0),pages=Math.max(1,Math.ceil(items.length/8));
  // Physical thumbstick focus must not disappear onto an undisplayed page.
  if(root&&document.activeElement!==lastFocus){
   const focused=items.findIndex(item=>item[4]===document.activeElement);
   if(focused>=0)page=Math.floor(focused/8);
  }
  lastFocus=document.activeElement;
  page=Math.min(page,pages-1);textPage=Math.min(textPage,textPages-1);
  for(const [i,a]of items.slice(page*8,page*8+8).entries())button(a[0],a[1],30,735+i*76,964,66,a[2],a[3]||null,a[4]||null);
  button('text-prev','Read previous',30,635,350,65,()=>textPage=(textPage-1+textPages)%textPages);
  button('text-next',`Read next (${textPage+1}/${textPages})`,410,635,584,65,()=>textPage=(textPage+1)%textPages);
  button('page-prev','More controls <',30,1355,310,66,()=>page=(page-1+pages)%pages);
  button('page-next',`More controls > ${page+1}/${pages}`,365,1355,360,66,()=>page=(page+1)%pages);
  button('back','Back / B',750,1355,244,66,()=>{if(wheel)actions.closeWheel(false);else ui.back();});
  button('exit','Exit XR safely',30,1450,964,62,exit);
  currentDescription=title;
  const readPage=root?.querySelector('canvas')?Math.max(0,textPage-1):textPage;return {title,lines:lines.slice(readPage*14,readPage*14+14),root,mapPage:textPage===0};
 }
 function draw(now,hit=''){
  const data=model();if(now-lastDraw<100&&hover===hit&&paintRevision===revision)return;lastDraw=now;hover=hit;paintRevision=revision;paints++;
  g.fillStyle='#101e27';g.fillRect(0,0,W,H);g.fillStyle='#f2eddc';g.font='bold 36px sans-serif';g.fillText(data.title.slice(0,47),30,57);
  g.font='27px sans-serif';data.lines.forEach((l,i)=>g.fillText(l,30,110+i*35));
  // Maps are actual live map canvases, not a placeholder compass.
  const map=data.root?.querySelector('canvas');
  if(data.mapPage&&map&&map.width&&map.height){g.fillStyle='#101e27';g.fillRect(25,170,974,445);const ratio=Math.min(960/map.width,440/map.height);g.drawImage(map,512-map.width*ratio/2,174,map.width*ratio,map.height*ratio);}
  for(const b of buttons){
   const focused=b.key===hit||b.element===document.activeElement;
   g.fillStyle=focused?'#416777':'#263e4a';g.fillRect(b.x,b.y,b.w,b.h);
   g.strokeStyle=focused?'#ffe6a7':'#728c93';g.lineWidth=focused?5:2;g.strokeRect(b.x,b.y,b.w,b.h);
   g.fillStyle='#fff4de';g.font='27px sans-serif';const ls=words(b.text,Math.floor(b.w/15));ls.slice(0,2).forEach((l,i)=>g.fillText(l,b.x+12,b.y+27+i*27));
  }
  texture.needsUpdate=true;
 }
 function hit(u,v){model();const x=u*W,y=(1-v)*H;return buttons.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)||null;}
 function invoke(key){model(true);const b=buttons.find(b=>b.key===key);if(!b)return false;try{b.run?.();}finally{dirty=true;lastDraw=-Infinity;}return true;}
 draw(0);
 return {canvas,texture,draw,hit,invoke,inspect:()=>({title:currentDescription,page,textPage,buttons:buttons.map(b=>b.key),rebuilds,paints}),dispose:()=>{observer?.disconnect();texture.dispose();}};
}
export function createXRToolbar(actions){
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=384;const g=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const entries=[
  ['left','Left',null,'left'],['forward','Forward',null,'forward'],['right','Right',null,'right'],['turn-left','Look left',null,'turnLeft'],['turn-right','Look right',null,'turnRight'],['aim','Aim / brake',null,'aim'],
  ['backward','Back',null,'backward'],['sprint','Sprint / boost',null,'sprint'],['fire','Use tool',null,'fire'],['operate','Hold operate',null,'hack'],['interact','Interact',actions.interact],['jump','Jump / climb',actions.jump]
 ];
 let last=null;
 function draw(hit=''){
  if(last===hit)return;last=hit;g.fillStyle='#101e27';g.fillRect(0,0,1536,384);g.font='28px sans-serif';g.fillStyle='#fff4de';g.fillText('Point and hold pinch or trigger. Release to stop. Move your head freely; it does not move your character.',20,40);
  entries.forEach((e,i)=>{const x=(i%6)*256+8,y=65+Math.floor(i/6)*155;g.fillStyle=hit===e[0]?'#416777':'#263e4a';g.fillRect(x,y,240,135);g.strokeStyle=hit===e[0]?'#ffe6a7':'#728c93';g.lineWidth=hit===e[0]?5:2;g.strokeRect(x,y,240,135);g.fillStyle='#fff4de';g.font='30px sans-serif';words(e[1],13).forEach((line,j)=>g.fillText(line,x+12,y+55+j*35));});texture.needsUpdate=true;
 }
 function hit(u,v){const x=u*1536,y=(1-v)*384;return entries.map((e,i)=>({key:e[0],text:e[1],run:e[2],hold:e[3],x:(i%6)*256+8,y:65+Math.floor(i/6)*155})).find(e=>x>=e.x&&x<=e.x+240&&y>=e.y&&y<=e.y+135)||null;}
 draw();return {texture,canvas,draw,hit,dispose:()=>texture.dispose()};
}
