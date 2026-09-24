/* Isolated optical evidence, not assigned game state or physical device input. */
window.runEffectsPolishFixture=async function(){
 const T=AFRAME.THREE,checks=[],captures={},metrics={};
 window.effectsPolishEvidence={checks,captures,metrics};
 const check=(v,m)=>{if(!v)throw Error(m+'; measured '+JSON.stringify(metrics));checks.push(m);};
 const renderer=new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});renderer.setSize(960,640);renderer.setClearColor(0,0);document.body.style.margin='0';document.body.style.background='#172530';document.body.appendChild(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,1.5,.05,50);camera.position.set(1.8,1.4,3.6);camera.lookAt(0,1,-2);
 const fire=SVGNFire.create(T,{quality:'cinematic',lights:false,seed:2731});scene.add(fire.group);
 const gl=renderer.getContext(),pixels=()=>{const a=new Uint8Array(960*640*4);gl.readPixels(0,0,960,640,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
 await fire.prepare(renderer,camera,scene);check(fire.stats.prepared&&fire.stats.warmupDraws===1,'Curling fire uploads and exercises its volume before the first event');
 function event(mode,time){fire.reset();fire.update({time:0,quiet:mode==='quiet',xr:false});
  if(mode==='jet')fire.emitter('fixture',{position:[-1.2,1,-2],direction:[1,.08,0],length:2.6,radius:.8});
  else fire.emit({id:'fixture',position:[0,1,-2],radius:1,mode:mode==='impact'?'impact':'burst'});
  for(let t=.025;t<=time+.0001;t+=.025){fire.update({time:t});if(mode==='jet')fire.emitter('fixture',{position:[-1.2,1,-2],direction:[1,.08,0],length:2.6,radius:.8});}
  renderer.render(scene,camera);return pixels();
 }
 function measure(a){let visible=0,energy=0,hot=0,weightedLuma=0,alphaWeight=0;
  for(let i=0;i<a.length;i+=4){const alpha=a[i+3]/255;if(a[i+3]>4)visible++;energy+=a[i]+a[i+1]+a[i+2];if(a[i+3]>10&&a[i]>a[i+2]*1.6)hot++;
   // Compare displayed luma per covered area, not summed RGB of a growing plume.
   weightedLuma+=(.2126*a[i]+.7152*a[i+1]+.0722*a[i+2])*alpha;alphaWeight+=alpha;
  }return {visible,energy,hot,meanLuma:weightedLuma/Math.max(alphaWeight,1e-8)};
 }
 const early=event('burst',.30);metrics.burst=measure(early);captures.burst=renderer.domElement.toDataURL();
 check(metrics.burst.visible>1000&&metrics.burst.hot>100,'New native flame has visible warm color and a nonempty three-dimensional silhouette');
 renderer.render(scene,camera);check(pixels().every((v,i)=>v===early[i]),'A paused curling flame repeats the exact rendered image');
 const later=event('smoke',1.15);metrics.smoke=measure(later);captures.smoke=renderer.domElement.toDataURL();
 check(metrics.smoke.visible>100&&metrics.smoke.meanLuma<metrics.burst.meanLuma,'Cooling smoke remains visible with lower mean pixel luma than the initial burst');
 check(later.some((v,i)=>v!==early[i]),'The host clock evolves the flame and smoke image');
 for(const mode of ['jet','impact','quiet']){const image=event(mode,mode==='jet'?.55:.35);metrics[mode]=measure(image);captures[mode]=renderer.domElement.toDataURL();check(metrics[mode].visible>100,mode+': the reusable mode draws actual pixels');}
 fire.update({quiet:true,time:.65});renderer.render(scene,camera);const q=pixels();fire.update({quiet:true,time:.85});renderer.render(scene,camera);
 check(pixels().every((v,i)=>v===q[i]),'Quiet fixes volume shape and removes moving embers while the event is held at full fade');
 check(fire.stats.activeSparks===0&&fire.stats.lights===0,'Quiet has no active spark or light channels');
 check(renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false),'Both volume and ember programs compile in native WebGL2');
 fire.dispose();scene.clear();renderer.render(scene,camera);check(pixels().every((v,i)=>i%4!==3||v===0),'Disposing the effect leaves a transparent canvas with no stale flame');
 renderer.dispose();return {passed:checks.length,checks,metrics,captures,scope:'960x640 native WebGL isolated fire fixtures. Not a game screenshot, fluid solver, device benchmark or physical Quest test.'};
};
