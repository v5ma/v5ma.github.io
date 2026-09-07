import * as T from './vendor/three.module.js';
import {point,street,norm,add,mul,cross,rand} from './model.mjs';
import {mesh,anchor,batchStatic} from './art.mjs';
export function faceSurface(g,n,front){const u=new T.Vector3(...n),f=new T.Vector3(...front).projectOnPlane(u).normalize(),r=new T.Vector3().crossVectors(u,f).normalize();g.position.set(...point(n));g.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(r,u,f));}
const shadowGeo=new T.CircleGeometry(1,16),shadowMat=new T.MeshBasicMaterial({color:'#27433d',transparent:true,opacity:.18,depthWrite:false});
export function groundShadow(parent,n,sx=1,sz=1){const g=anchor(parent,n,.21),m=new T.Mesh(shadowGeo,shadowMat);m.rotation.x=-Math.PI/2;m.scale.set(sx,sz,1);g.add(m);return g;}
export function home(parent,s,i){const g=new T.Group();parent.add(g);faceSurface(g,s.n,norm(add(s.mail,mul(s.n,-1))));
 const trim='#f5edd6',roof=['#af5d47','#557c71','#657f91','#ab7151'][i%4],dark='#315a66';
 mesh(g,'box','#aaa38d',[0,.15,0],[4.65,.3,4.3]);mesh(g,'box',s.color,[0,1.6,0],[4.3,2.85,3.9]);
 for(let k=0;k<8;k++)mesh(g,'box',trim,[0,.35+k*.34,1.96],[4.32,.018,.025]);
 for(const side of[-1,1]){mesh(g,'box',roof,[side*1.17,3.25,0],[2.8,.18,4.65],[0,0,-side*.5]);mesh(g,'box',trim,[side*2.34,2.66,0],[.09,.15,4.7]);for(let k=0;k<9;k++)mesh(g,'box',roof,[side*1.17,3.28,-2.2+k*.54],[2.79,.06,.065],[0,0,-side*.5]);}
 mesh(g,'box',trim,[0,3.89,0],[.14,.14,4.75]);mesh(g,'box','#aa856c',[1.35,3.85,-.9],[.52,1.4,.57]);mesh(g,'box',trim,[1.35,4.6,-.9],[.67,.14,.73]);
 function windowAt(x,y,z,w=.88,h=1){mesh(g,'box',trim,[x,y,z],[w+.17,h+.17,.11]);mesh(g,'box',dark,[x,y,z+.065],[w,h,.06]);mesh(g,'box','#8aacb4',[x-.16,y+.16,z+.1],[w*.35,h*.44,.01]);mesh(g,'box',trim,[x,y,z+.12],[.055,h,.035]);mesh(g,'box',trim,[x,y,z+.12],[w,.055,.035]);for(const dx of[-1,1])mesh(g,'box',roof,[x+dx*(w/2+.19),y,z-.01],[.22,h+.14,.08]);mesh(g,'box',trim,[x,y-h/2-.1,z+.15],[w+.3,.09,.28]);}
 windowAt(-1.35,1.65,1.97);windowAt(1.35,1.65,1.97);mesh(g,'box',trim,[0,1,1.98],[1.02,2.05,.16]);mesh(g,'box','#865443',[0,.95,2.09],[.8,1.88,.1]);mesh(g,'box','#bdcebd',[0,1.45,2.16],[.48,.51,.025]);mesh(g,'ball','#e6bd68',[.27,.86,2.18],[.055,.055,.04]);
 mesh(g,'box','#d1b795',[0,.35,2.65],[3.65,.23,1.5]);for(let k=0;k<3;k++)mesh(g,'box','#b5afa0',[0,.1+k*.09,3.6-k*.22],[1.45,.18,.46]);
 for(const x of[-1.65,1.65])mesh(g,'box',trim,[x,1.53,3.19],[.13,2.3,.13]);mesh(g,'box',roof,[0,2.66,2.85],[3.95,.13,1.95],[.09,0,0]);
 for(const x of[-3.2,3.2]){mesh(g,'ball','#649760',[x,.5,1.8],[.8,.58,.65]);for(let k=0;k<5;k++)mesh(g,'ball',i%2?'#f3d39a':'#dc8d9c',[x+(rand(k)-.5),.7+rand(k+i)*.3,1.9],[.09,.1,.09]);}
 // Open front gate aligns with porch and mailbox. Pickets are deliberately low.
 for(const sign of[-1,1]){for(let k=0;k<7;k++)mesh(g,'box',trim,[sign*(1.3+k*.44),.53,4.02],[.12,1.05,.1]);for(const y of[.35,.8])mesh(g,'box',trim,[sign*2.63,y,4.02],[2.9,.08,.08]);}
 if(s.type==='post'){const c=document.createElement('canvas');c.width=256;c.height=80;const x=c.getContext('2d');x.fillStyle='#28546a';x.fillRect(0,0,256,80);x.fillStyle='#fff0c9';x.font='bold 33px sans-serif';x.textAlign='center';x.fillText(s.id==='post'?'SVGN.io NEWS':'CORNER STORE',128,51);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(2.8,.85),new T.MeshBasicMaterial({map:tx}));sign.position.set(0,2.5,3.9);g.add(sign);}
 return g;
}
export function avenueTree(parent,t){const g=anchor(parent,t.n),k=t.size;mesh(g,'cylinder','#8b7760',[0,1.45*k,0],[.15*k,2.9*k,.15*k]);for(let j=0;j<3;j++)mesh(g,'cylinder','#8b7760',[(j-1)*.3*k,2.2*k,0],[.085*k,1.6*k,.085*k],[0,0,(j-1)*-.45]);for(let j=0;j<8;j++){const a=j*2.4,r=j===0?0:.75*k;mesh(g,'ball',['#4c8f60','#73a964','#99b96f'][j%3],[Math.cos(a)*r,(2.65+rand(j+t.seed)*.8)*k,Math.sin(a)*r],[1.02*k,.9*k,1.04*k]);}return g;}
export function streetLamp(parent,t,side){const g=anchor(parent,street(t,side*3.7));mesh(g,'cylinder','#44616a',[0,2.7,0],[.065,5.4,.065]);mesh(g,'box','#44616a',[-side*.4,5.35,0],[.85,.08,.09]);mesh(g,'box','#e9dfb4',[-side*.77,5.27,0],[.4,.09,.29]);}
export {mesh,anchor,batchStatic};
