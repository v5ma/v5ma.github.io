"use strict";
function hidden(p,x) {
  return p.b1.map((b,j)=>Math.tanh(b+x.reduce((s,v,i)=>s+v*p.w1[i][j],0)));
}
function tail(p,h,lesion=-1) {
  const z=p.b2.map((b,j)=>Math.tanh(b+h.reduce((s,v,i)=>s+(i===lesion?0:v*p.w2[i][j]),0)));
  return p.bo[0]+z.reduce((s,v,j)=>s+v*p.wo[j][0],0);
}
function gradient(p,h,lesion=-1) {
  const z=p.b2.map((b,j)=>Math.tanh(b+h.reduce((s,v,i)=>s+(i===lesion?0:v*p.w2[i][j]),0)));
  return h.map((_,i)=>i===lesion?0:z.reduce((s,v,j)=>s+(1-v*v)*p.wo[j][0]*p.w2[i][j],0));
}
function worldBits(id) {
  return Array.from({length:10},(_,k)=>k<8?((id>>k)&1?1:-1):0);
}
function truth(id) {
  const x=worldBits(id),selected=x[6]>0?1:0;
  return x[selected]===x[7] && x[selected+2]>0 && x[selected+4]<0;
}
function inspect(p,world,unit,donorKind,route) {
  const x=worldBits(world),selected=x[6]>0?1:0,donor=x.slice();
  donor[(donorKind==="selected_grant"?selected:1-selected)+2]*=-1;
  const h=hidden(p,x),hd=hidden(p,donor),patched=h.slice();
  patched[unit]=hd[unit];
  const lesion=route==="same_route"?unit:route==="adjacent_route"?(unit+1)%24:-1;
  const before=tail(p,h,lesion),after=tail(p,patched,lesion);
  const effect=after-before,local=gradient(p,h,lesion)[unit]*(hd[unit]-h[unit]);
  return {world,unit,donor:donorKind,route,before,after,effect,local,h,patched,allowed:truth(world)};
}
function mayCommit(current,proposal) {
  return !!proposal && proposal.revision===current.revision &&
    current.allowed.includes(proposal.object) && proposal.delegated.includes(proposal.object);
}
const SANLab={hidden,tail,gradient,worldBits,truth,inspect,mayCommit};
if(typeof module!=="undefined")module.exports=SANLab;
if(typeof window!=="undefined")window.SANLab=SANLab;
