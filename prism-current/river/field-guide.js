/* AR Field Guide 0.1.0. Noninteractive, scene-mounted teaching cards.
 * Uses the existing FlexSurface library. No input, clock, scores or saved state.
 * Lives above the Rotunda only before battle/on its Controls page while paused.
 */
(function(root){
 'use strict';
 const VERSION='0.1.0',WIDTH=512,HEIGHT=384;
 function cards(profile){
  return [
   {id:'fruit',title:'FRUIT',verb:'SWING TO CUT',detail:'Either saber: base reward',note:profile.directionRequired?'Follow the fruit arrows':'Any cut direction',color:'#b8f378'},
   {id:'block',title:'PURPLE BLOCK',verb:'CUT / SHOOT / SHIELD',detail:'Triggers fire your lasers',note:'Grips raise your shields',color:'#cfb2ff'},
   {id:'health',title:'MINT HEALTH +',verb:'CUT / SHOOT / TOUCH',detail:'Restore up to '+profile.heal+' HEALTH',note:'Maximum health is 100',color:'#90ffdb'}
  ];
 }
 function shouldShow(frame){return !!frame.ar&&!!frame.open&&!frame.busy&&(frame.phase==='menu'||frame.phase==='paused'&&frame.page==='help');}
 function paint(canvas,card){
  const c=canvas.getContext('2d');c.clearRect(0,0,WIDTH,HEIGHT);
  c.fillStyle='#112f43';c.fillRect(0,0,WIDTH,HEIGHT);
  c.fillStyle=card.color;c.fillRect(0,0,WIDTH,9);c.strokeStyle=card.color;c.lineWidth=3;c.strokeRect(2,2,WIDTH-4,HEIGHT-4);
  c.textAlign='center';c.fillStyle='#effffb';c.font='700 30px system-ui';c.fillText(card.title,WIDTH/2,49);
  c.save();c.translate(WIDTH/2,123);
  if(card.id==='fruit'){
   c.fillStyle=card.color;c.beginPath();c.ellipse(-6,2,48,44,0,0,Math.PI*2);c.fill();
   c.strokeStyle='#645539';c.lineWidth=8;c.beginPath();c.moveTo(0,-36);c.lineTo(4,-55);c.stroke();
   c.fillStyle='#78bd67';c.beginPath();c.ellipse(23,-45,23,9,-.4,0,Math.PI*2);c.fill();
   c.strokeStyle='#ffffff';c.lineWidth=6;c.beginPath();c.moveTo(-63,42);c.lineTo(64,-36);c.stroke();
  }else{
   c.fillStyle=card.color;c.fillRect(-48,-44,96,86);c.strokeStyle='#ffffff';c.lineWidth=4;c.strokeRect(-48,-44,96,86);
   c.fillStyle='#233a50';
   if(card.id==='health'){c.fillRect(-9,-27,18,52);c.fillRect(-27,-9,54,18);}
   else{c.lineWidth=6;c.beginPath();c.moveTo(-22,-20);c.lineTo(20,0);c.lineTo(-22,21);c.stroke();}
  }
  c.restore();c.fillStyle=card.color;c.font='800 26px system-ui';c.fillText(card.verb,WIDTH/2,227);
  c.fillStyle='#ffffff';c.font='25px system-ui';c.fillText(card.detail,WIDTH/2,279);
  c.fillStyle='#c7e4e7';c.font='23px system-ui';c.fillText(card.note,WIDTH/2,323);
  if(card.id==='fruit'){c.fillStyle='#effffb';c.font='19px system-ui';c.fillText('X / A: color. Match badge: bonus.',WIDTH/2,360);}c.textAlign='left';
 }
 function attach(g,dock){
  if(dock.fieldGuide)return dock;
  const T=g.T,holder=new T.Group();holder.name='prism-ar-field-guide';holder.visible=false;dock.menu.add(holder);
  const items=[];let disposed=false,lastKey='',paints=0,prepared=false,shown=false;
  try{
   for(let i=0;i<3;i++){
    const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=T.LinearFilter;
    const material=new T.MeshBasicMaterial({map:texture,side:T.FrontSide,depthTest:false,depthWrite:false,toneMapped:false});
    const surface=root.SVGNFlexSurface.create(T,{width:.50,height:.375,columns:12,rows:2,readableBack:true,material});
    // A slight, static bend is decoration, not a moving input target.
    surface.update({bend:(i-1)*.28});surface.group.position.set((i-1)*.55,.80,.025);
    surface.group.name='prism-guide-'+['fruit','block','health'][i];
    for(const mesh of surface.group.children){mesh.renderOrder=32;mesh.frustumCulled=false;}
    holder.add(surface.group);items.push({canvas,texture,material,surface});
   }
  }catch(e){for(const item of items){item.surface.dispose();item.material.dispose();item.texture.dispose();}holder.removeFromParent();throw e;}
  function refresh(){
   const difficulty=g.state?.difficulty||g.difficulty||'easy',profile=root.RiverCore.DIFFICULTIES.get(difficulty);
   const key=[difficulty,profile.heal,profile.directionRequired].join('|');if(key===lastKey)return false;
   const content=cards(profile);items.forEach((item,i)=>{paint(item.canvas,content[i]);item.texture.needsUpdate=true;});
   lastKey=key;paints++;prepared=false;return true;
  }
  function update(){
   if(disposed)return;
   const d=dock.diagnostics||{};
   shown=shouldShow({ar:!!g.immersive&&g.el.is('ar-mode'),open:d.open,page:d.page,phase:g.phase,busy:g.busy});
   holder.visible=shown;if(shown)refresh();
  }
  function prepare(renderer){if(disposed)return;refresh();for(const item of items)renderer.initTexture(item.texture);prepared=true;}
  function dispose(){if(disposed)return;disposed=true;shown=false;holder.visible=false;holder.removeFromParent();for(const item of items){item.surface.dispose();item.material.dispose();item.texture.dispose();}}
  const api=Object.freeze({update,prepare,dispose,get stats(){return {version:VERSION,visible:shown&&!disposed,cards:disposed?0:3,paints,prepared,disposed,
   triangles:disposed?0:items.reduce((sum,item)=>sum+item.surface.stats.triangles,0),surfaceUpdates:items.map(item=>item.surface.stats.updates),textures:disposed?0:3,interactive:false};}});
  dock.fieldGuide=api;
  const oldUpdate=dock.update,oldPrepare=dock.prepare,oldDispose=dock.dispose;
  dock.update=function(...args){oldUpdate.apply(this,args);update();};
  dock.prepare=function(renderer){const result=oldPrepare.call(this,renderer);prepare(renderer);return result;};
  dock.dispose=function(){dispose();oldDispose.call(this);};
  refresh();return dock;
 }
 const api=Object.freeze({VERSION,cards,shouldShow,attach});
 if(root.RiverRotunda&&!root.RiverRotunda.fieldGuide){const prior=root.RiverRotunda;root.RiverRotunda=Object.freeze({...prior,fieldGuide:VERSION,install(...args){return attach(args[0],prior.install(...args));}});}
 if(typeof module!=='undefined'&&module.exports)module.exports=api;root.PrismFieldGuide=api;
})(globalThis);
