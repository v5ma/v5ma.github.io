/* Native UI actions mirrored onto a ray/pinch-accessible in-world canvas.
 * No DOM Overlay dependency and no screenshots used as buttons. */
import * as T from './vendor/three.module.js';
export function wrap(text,width=65){const lines=[];for(const para of String(text||'').split('\n')){let line='';for(const word of para.trim().split(/\s+/)){if(!word)continue;if((line+' '+word).length>width&&line){lines.push(line);line='';}line+=(line?' ':'')+word;}if(line)lines.push(line);}return lines;}
export function nativeLabel(el){let label=el.labels?.[0]?.textContent||el.getAttribute?.('aria-label')||el.textContent||el.id||'';label=label.replace(/\s+/g,' ').trim();if(el.tagName==='SELECT')label=label.split('  ')[0].slice(0,45)+' : '+(el.selectedOptions[0]?.textContent||'');else if(el.type==='range')label+=' : '+el.value;else if(el.type==='checkbox')label=(el.checked?'[ON] ':'[OFF] ')+label;return label||el.id;}
export function createXRPanel(E){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const c=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const mesh=new T.Mesh(new T.PlaneGeometry(1.45,1.45),new T.MeshBasicMaterial({map:texture,transparent:true,toneMapped:false,depthTest:false,depthWrite:false}));mesh.renderOrder=10000;
 let page=0,textPage=0,reading=false,mapView=false,lastMode='',lastSignature='',lastFocus=null,rows=[],all=[],caption='',hold=null;
 const root=()=>document.querySelector('.sheet:not([hidden])');
 function change(fn){release();fn();lastSignature='';E.reset();}
 function release(){if(hold){E.hold(hold,false);hold=null;}}
 function action(label,id,fn,extra={}){return {label,id,run:fn,...extra};}
 function collect(){
  const mode=E.mode();if(mode!==lastMode){lastMode=mode;page=0;textPage=0;reading=false;mapView=false;release();lastSignature='';}
  const r=root();caption=mode==='play'?E.hint():r?.querySelector('h1,h2')?.textContent||mode.toUpperCase();
  if(mode==='play')all=E.actions().map(a=>action(a.label,a.id,a.run));
  else all=r?[...r.querySelectorAll('button,input,select,summary')].filter(el=>!el.disabled&&!el.closest('[hidden]')&&el.getClientRects().length&&!el.id.startsWith('xr-')).flatMap(el=>{
   if(el.type==='range'||el.tagName==='SELECT')return [-1,1].map(sign=>action((sign<0?'- ':'+ ')+nativeLabel(el),el.id+(sign<0?'-minus':'-plus'),()=>{if(el.tagName==='SELECT')el.selectedIndex=(el.selectedIndex+sign+el.options.length)%el.options.length;else el.value=String(Math.max(Number(el.min)||0,Math.min(Number(el.max)||100,Number(el.value)+sign*(Number(el.step)||1))));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},{element:el}));
   return [action(nativeLabel(el),el.id||el.textContent.trim(),()=>el.click(),{element:el,held:E.isHeld(el)})];
  }):[];
  all.push(...(E.extraActions?.()||[]).map(a=>action(a.label,a.id,a.run)));
  const focus=document.activeElement;if(mode!=='play'&&focus!==lastFocus){lastFocus=focus;const index=all.findIndex(row=>row.element===focus);if(index>=0&&!reading)page=Math.floor(index/8);}const pages=Math.max(1,Math.ceil(all.length/8));page=Math.min(page,pages-1);
  rows=all.slice(page*8,page*8+8).map((r,i)=>({...r,x:28,y:214+i*78,w:968,h:68}));
  const mapCanvas=r?.querySelector('canvas#map');const toolbar=[action('BACK','back',()=>E.back()),action(mapView?'CONTROLS':reading&&mapCanvas?'VIEW MAP':reading?'CONTROLS':'READ TEXT','read',()=>{if(mapView){mapView=false;reading=false;}else if(reading&&mapCanvas){reading=false;mapView=true;}else reading=!reading;textPage=0;}),action('RECENTER','recenter',()=>E.recenter()),action('EXIT XR','exit',()=>E.exit())];
  rows.push(...toolbar.map((r,i)=>({...r,x:28+i*246,y:918,w:230,h:66})),{...action('< PAGE','prev',()=>{if(reading)textPage=Math.max(0,textPage-1);else page=Math.max(0,page-1);}),x:28,y:838,w:280,h:64},{...action('PAGE >','next',()=>{if(reading)textPage++;else page=Math.min(pages-1,page+1);}),x:716,y:838,w:280,h:64});
  if(reading||mapView)rows=rows.filter(r=>r.y>=838);
  const lines=wrap(r?.innerText||E.instructions(),64),maxText=Math.max(1,Math.ceil(lines.length/19));textPage=Math.min(textPage,maxText-1);
  const signature=JSON.stringify([mode,caption,E.status(),rows.map(r=>r.label),page,textPage,reading,mapView,reading?lines:[],hold?.id,focus?.id]);
  if(signature===lastSignature)return;lastSignature=signature;
  c.fillStyle='#101d21';c.fillRect(0,0,1024,1024);c.fillStyle='#efdcad';c.font='bold 35px sans-serif';c.fillText('RAINWARD / '+(mode==='play'?'FIELD CONTROLS':mode.toUpperCase()),28,51);
  c.fillStyle='#e5eeee';c.font='24px sans-serif';wrap(E.status(),73).slice(0,2).forEach((l,i)=>c.fillText(l,28,91+i*29));c.fillStyle='#e4d2a9';wrap(caption,71).slice(0,2).forEach((l,i)=>c.fillText(l,28,154+i*27));
  if(mapView&&mapCanvas){const height=565,width=height*mapCanvas.width/mapCanvas.height;c.drawImage(mapCanvas,(1024-width)/2,214,width,height);c.fillStyle='#e5eeee';c.font='22px sans-serif';wrap(r.querySelector('#map-legend')?.textContent,75).slice(0,2).forEach((l,i)=>c.fillText(l,28,807+i*25));}if(reading){c.fillStyle='#e5eeee';c.font='23px sans-serif';lines.slice(textPage*19,textPage*19+19).forEach((l,i)=>c.fillText(l,28,242+i*30));}
  for(const row of rows){c.fillStyle=hold?.id===row.id?'#456b62':row.element===focus?'#4a5a71':'#263b40';c.fillRect(row.x,row.y,row.w,row.h);c.strokeStyle='#819995';c.strokeRect(row.x,row.y,row.w,row.h);c.fillStyle='#ffffff';c.font=(row.w<300?'bold 22px':'25px')+' sans-serif';wrap((row.held?'HOLD: ':'')+row.label,row.w<300?15:67).slice(0,2).forEach((l,i)=>c.fillText(l,row.x+14,row.y+29+i*25));}
  c.fillStyle='#b6cac6';c.font='22px sans-serif';c.textAlign='center';c.fillText((reading?textPage+1:page+1)+' / '+(reading?maxText:pages),512,880);c.textAlign='left';texture.needsUpdate=true;
 }
 function hit(uv){if(!uv)return null;const x=uv.x*1024,y=(1-uv.y)*1024;return rows.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)||null;}
 function select(row){if(!row)return;row.element?.focus({preventScroll:true});lastFocus=document.activeElement;if(row.held){hold=row;E.hold(row,true);lastSignature='';}else change(()=>row.run());}
 return {mesh,collect,hit,select,release,held:()=>hold,page:()=>page,view:()=>mapView?'map':reading?'text':'controls',rows:()=>rows.map(({id,x,y,w,h,label})=>({id,x,y,w,h,label})),dispose(){release();mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();texture.dispose();}};
}
