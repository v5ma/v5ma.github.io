/* Analytic two-bone contacts, independent of the renderer and game physics.
 * Original implementation informed by https://theorangeduck.com/page/inverse-kinematics-foot-locking .
 * This rider's contacts are pedals and grips, not a walking character's floor.
 */
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function solveTwoBone(root,target,upper,lower,bend=1){
 if(![...root,...target,upper,lower,bend].every(Number.isFinite)||upper<=0||lower<=0)throw new TypeError('Finite points and positive limb lengths required');
 const dx=target[0]-root[0],dy=target[1]-root[1],raw=Math.hypot(dx,dy),ux=raw>1e-9?dx/raw:0,uy=raw>1e-9?dy/raw:-1;
 const max=upper+lower-.001,min=Math.abs(upper-lower)+.001,soft=.35;
 let d=clamp(raw,min,max);if(d>max-soft)d=max-soft+soft*(1-Math.exp(-(d-max+soft)/soft));
 const a=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-a*a)),sign=bend<0?-1:1;
 return {joint:[root[0]+ux*a-uy*h*sign,root[1]+uy*a+ux*h*sign],end:[root[0]+ux*d,root[1]+uy*d],limited:raw>max-soft||raw<min};
}
export function createMotion(){return {step:null,x:null,phase:0,wheel:0,lean:0,compression:0,attached:false};}
export function updateMotion(s,p,step,{motion=true,throttle=false}={}){
 if(s.step===step)return s;
 const delta=s.x===null?0:p.x-s.x,continuous=Math.abs(delta)<90,dt=s.step===null?0:clamp((step-s.step)/60,0,.1),attached=!!(p.onGround||p.track||p.peg);
 if(!continuous){s.lean=0;s.compression=0;}
 if(attached&&continuous){s.wheel-=delta/7;if(throttle)s.phase+=Math.abs(delta)/15;}
 const target=motion?clamp((throttle?Math.abs(p.vx)*.007:-Math.abs(p.vx)*.004)+(!attached?clamp(-p.vy*.008,-.07,.07):0),-.1,.14):0;
 s.lean+=(target-s.lean)*(1-Math.exp(-14*dt));
 if(attached&&!s.attached&&motion)s.compression=.9;
 s.compression*=Math.exp(-14*dt);s.attached=attached;s.x=p.x;s.step=step;return s;
}
export function riderPose(s){
 const hip=[-5,4-s.compression],shoulder=[hip[0]+4*Math.cos(s.lean)+16*Math.sin(s.lean),hip[1]-4*Math.sin(s.lean)+16*Math.cos(s.lean)];
 const feet=[0,Math.PI].map(offset=>[1+Math.cos(s.phase+offset)*3,-11+Math.sin(s.phase+offset)*3]);
 const legs=feet.map(foot=>({root:hip,...solveTwoBone(hip,foot,14,13,1),target:foot}));
 const arms=[-5.8,5.8].map(z=>({root:shoulder,...solveTwoBone(shoulder,[17,10],12,11.5,-1),target:[17,10],z}));
 return {hip,shoulder,legs,arms};
}
