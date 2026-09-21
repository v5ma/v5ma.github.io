/* Walking doorway state, independent of game state and device libraries. */
(function(root){'use strict';
 const clamp=(x,a,b,f)=>Number.isFinite(x)?Math.max(a,Math.min(b,x)):f;
 function settings(x={}){if(!x||typeof x!=='object')x={};return {height:clamp(x.height,.65,1.65,1.15),scale:clamp(x.scale,.75,1.25,1),distance:clamp(x.distance,1.2,2.4,1.8),angle:clamp(x.angle,-.6,.6,0)};}
 class Crossing {
  constructor(){this.reset();}
  reset(){this.previous=null;this.armed=false;this.passed=false;this.fired=false;}
  update(p,valid=true){
   if(!valid||!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)){this.reset();return false;}
   if(this.fired)return false;
   const prev=this.previous;this.previous=[...p];
   if(!prev)return false;
   if(Math.hypot(...p.map((v,i)=>v-prev[i]))>.45){this.armed=false;this.passed=false;return false;}
   if(p[2]>.25&&p[2]<2.5)this.armed=true;
   if(this.armed&&prev[2]>0&&p[2]<=0){
    const t=prev[2]/(prev[2]-p[2]),x=prev[0]+t*(p[0]-prev[0]),y=prev[1]+t*(p[1]-prev[1]);
    this.passed=Math.abs(x)<.64&&y>.45&&y<2.45;
    if(!this.passed)this.armed=false;
   }
   if(p[2]>.15)this.passed=false;
   if(this.passed&&p[2]<-.18){this.fired=true;return true;}
   return false;
  }
 }
 const api=Object.freeze({settings,Crossing});root.VesperThresholdModel=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
