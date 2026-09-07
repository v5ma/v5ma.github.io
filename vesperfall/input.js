/* Controller-independent bow latch. Loss of either valid pose cancels the shot;
 * reconnecting with a held trigger cannot shoot until it is released first. */
(function(root){'use strict';const C=root.VesperCore;
 class BowLatch{
  constructor(){this.reset();}
  reset(){this.armed=false;this.held=false;this.drawing=false;this.sample=null;}
  update(bow,hand,pressed,allowed=true,max=.56){
   if(!allowed||!bow||!hand){this.reset();return {charge:0,drawing:false,cancelled:true};}
   if(!pressed&&!this.held&&!this.drawing)this.armed=true;
   if(pressed&&!this.held&&this.armed&&C.len(C.sub(bow,hand))<.25){this.drawing=true;this.sample=null;}
   if(this.drawing&&pressed){const v=C.drawState(bow,hand,max);if(v){this.sample={...v,origin:[...bow]};}else if(C.len(C.sub(bow,hand))>1.05){this.drawing=false;this.armed=false;this.sample=null;}}
   let shot=null;
   if(!pressed&&this.held){if(this.drawing&&this.sample?.charge>=.08)shot=this.sample;this.drawing=false;this.sample=null;this.armed=true;}
   this.held=pressed;return {shot,charge:this.sample?.charge||0,drawing:this.drawing};
  }
 }
 function deadzone(v,d=.18){if(!Number.isFinite(v)||Math.abs(v)<d)return 0;return Math.sign(v)*Math.min(1,(Math.abs(v)-d)/(1-d));}
 function cleanProfile(p){return {version:1,shards:Math.round(C.clamp(Number(p?.shards)||0,0,100000)),best:Math.round(C.clamp(Number(p?.best)||0,0,1000000)),depth:Math.round(C.clamp(Number(p?.depth)||0,0,99)),heart:p?.heart===true,power:p?.power===true};}
 root.VesperInput={BowLatch,deadzone,cleanProfile};if(typeof module!=='undefined')module.exports=root.VesperInput;
})(globalThis);
