/* Test-only standard controller. Buttons travel through navigator.getGamepads
 * and the production controller handler, never through direct game actions. */
(()=>{
 window.testPad={id:'Acceptance standard pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
 let polls=0;const waiters=new Set();
 Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>{
  polls++;
  for(const w of [...waiters])if(polls>=w.target){waiters.delete(w);clearTimeout(w.timer);queueMicrotask(w.resolve);}
  return window.testPad?[window.testPad]:[];
 }});
 function nextPoll(){return new Promise((resolve,reject)=>{const w={target:polls+1,resolve,timer:null};w.timer=setTimeout(()=>{waiters.delete(w);reject(Error('Production controller polling stopped'));},10000);waiters.add(w);});}
 window.PrismTestPad={get polls(){return polls;},async press(button){
  if(!testPad)throw Error('Connect the emulated controller before pressing a button');
  // Neutral sampling also lets a newly connected controller seed its state.
  testPad.buttons[button]={pressed:false,value:0};await nextPoll();
  testPad.buttons[button]={pressed:true,value:1};try{await nextPoll();}finally{testPad.buttons[button]={pressed:false,value:0};}
  await nextPoll();
 }};
})();
