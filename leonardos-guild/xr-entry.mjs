/* Native first-screen controls and explicit WebXR capability/error feedback.
 * One user click calls requestSession directly in guild-xr; no framework or
 * second renderer owns the session. Capability checks never request consent. */
export const XR_ENTRY_BUILD='guild-xr-entry-20260917';
export const XR_MODES=Object.freeze({
 'first-person':{label:'VR first person',session:'immersive-vr',presentation:'first-person'},
 'diorama-vr':{label:'VR diorama',session:'immersive-vr',presentation:'diorama'},
 'first-person-ar':{label:'AR first person',session:'immersive-ar',presentation:'first-person'},
 'diorama-ar':{label:'AR diorama',session:'immersive-ar',presentation:'diorama'},
 theatre:{label:'Seated theatre',session:'immersive-vr',presentation:'theatre'}
});
export function xrEnvironmentProblem(env=globalThis){
 if(env.isSecureContext===false)return 'XR needs HTTPS. Open the public game in a secure browser tab.';
 if(!env.navigator?.xr?.requestSession)return 'This browser does not expose WebXR. Open the game in your headset browser, or play on screen here.';
 const policy=env.document?.permissionsPolicy||env.document?.featurePolicy;
 try{if(policy?.allowsFeature&&!policy.allowsFeature('xr-spatial-tracking'))return 'XR is blocked by this embedded page. Open the game in its own browser tab.';}catch{}
 return '';
}
export function xrFailureText(error){
 const name=error?.name||'Error',detail=String(error?.message||error||'Unknown error').slice(0,220);
 const reason={
  NotAllowedError:'The headset request was declined or needs a direct click. Allow XR, then select the mode button with the browser pointer or a keyboard press.',
  SecurityError:'The browser blocked XR permission or user activation. Open the HTTPS game in its own headset tab and select the mode button directly.',
  NotSupportedError:'This headset/browser does not support the requested mode or reference space. Choose another available mode or play on screen.',
  InvalidStateError:'Another immersive session may still be open. Exit it, then select the mode again.',
  AbortError:'XR startup was interrupted. Your saved game is unchanged; select a mode to try again.'
 }[name]||'XR could not finish starting. Exit other immersive apps, check headset tracking, then try again or play on screen.';
 return reason+' ('+name+': '+detail+')';
}
export function supportText(kind,value,problem=''){
 const label=kind.toUpperCase();if(problem)return label+': '+problem;
 if(value===true)return label+': available in this browser.';
 if(value===false)return label+': unavailable in this browser. The other modes and on-screen game are independent.';
 if(value==='checking')return label+': checking support. Selecting a mode asks the headset directly.';
 return label+': support could not be confirmed. Select a mode to ask the headset directly.';
}
export async function probeXRMode(xr,mode,timeoutMs=4000){
 if(typeof xr?.isSessionSupported!=='function')return 'unknown';
 let timer;try{return await Promise.race([
  Promise.resolve().then(()=>xr.isSessionSupported(mode)).then(Boolean,()=> 'unknown'),
  new Promise(resolve=>{timer=setTimeout(()=>resolve('unknown'),timeoutMs);timer.unref?.();})
 ]);}finally{clearTimeout(timer);}
}
export function bindXREntry({enter,recheck,doc=globalThis.document}){
 const all=selector=>[...(doc?.querySelectorAll?.(selector)||[])],buttons=all('[data-xr-entry]');
 for(const b of buttons)b.onclick=()=>enter(b.dataset.xrEntry,true);
 for(const b of all('[data-xr-recheck]'))b.onclick=recheck;
 return {render({vr,ar,problem='',busy=false,presenting=false,status=''}){
  for(const b of buttons){const mode=XR_MODES[b.dataset.xrEntry],value=mode?.session==='immersive-ar'?ar:vr;b.disabled=busy||presenting||!!problem||value===false;b.setAttribute('aria-disabled',String(b.disabled));}
  for(const e of all('[data-xr-support]'))e.textContent=supportText(e.dataset.xrSupport,e.dataset.xrSupport==='ar'?ar:vr,problem);
  for(const e of all('[data-xr-entry-status]'))e.textContent=status;
  for(const b of all('[data-xr-recheck]'))b.disabled=busy||presenting;
 },count:buttons.length};
}
