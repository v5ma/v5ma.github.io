/* Original measured procedural hero, not a licensed skinned/mocap asset. */
import * as T from './vendor/three.module.js';
import {mesh} from './art.mjs';
export function buildCourierBody(g,shirt){
 const body=new T.Group();g.add(body);
 mesh(body,'round',shirt,[0,1.23,0],[.22,.275,.135]);mesh(body,'box','#304b60',[0,.97,0],[.31,.18,.23]);
 mesh(body,'cylinder','#ce9573',[0,1.52,0],[.062,.12,.062]);
 mesh(body,'round','#ce9573',[0,1.69,-.012],[.094,.12,.10]);
 mesh(body,'round','#273e49',[0,1.79,.0],[.104,.045,.108]);mesh(body,'box','#273e49',[0,1.775,-.108],[.20,.02,.11]);
 for(const x of[-.039,.039]){mesh(body,'round','#f5eddf',[x,1.712,-.104],[.021,.012,.011]);mesh(body,'round','#243b48',[x,1.712,-.114],[.008,.008,.004]);mesh(body,'round','#ce9573',[Math.sign(x)*.096,1.69,0],[.018,.032,.018]);}
 mesh(body,'round','#ce9573',[0,1.681,-.114],[.015,.020,.015]);mesh(body,'box','#8a4f40',[0,1.641,-.098],[.041,.009,.008]);
 mesh(body,'box','#d8a654',[0,1.23,.22],[.34,.39,.18]);mesh(body,'box','#efd2a0',[0,1.28,.318],[.25,.12,.015]);
 for(const x of[-.155,.155]){mesh(body,'box','#806246',[x,1.28,-.128],[.036,.36,.024]);mesh(body,'box','#806246',[x,1.39,.12],[.036,.055,.26]);}
 const legChains=[],armChains=[];
 function chain(a,b,r,col,lowerCol,side,leg){
  const upper=mesh(g,'cylinder',col,[0,0,0],[r,a,r]),lower=mesh(g,'cylinder',lowerCol,[0,0,0],[r*.78,b,r*.78]),joint=mesh(g,'round',col,[0,0,0],[r,r,r]);
  const end=new T.Group();g.add(end);
  if(leg){mesh(end,'box','#eee3c6',[0,-.012,-.052],[.19,.12,.29]);mesh(end,'box','#cf764c',[0,0,-.15],[.19,.075,.10]);mesh(end,'box','#304451',[0,-.073,-.052],[.194,.024,.30]);}
  else{mesh(end,'round','#ce9573',[0,-.023,-.009],[.043,.061,.033]);mesh(end,'round','#ce9573',[-side*.033,-.006,-.022],[.018,.032,.019]);}
  return {a,b,upper,lower,joint,end};
 }
 for(const side of[-1,1]){legChains.push(chain(.42,.43,.078,'#304b60','#567084',side,true));armChains.push(chain(.275,.29,.056,shirt,'#ce9573',side,false));}
 // Compatibility arrays remain for hidden legacy neighbors, not the active pose.
 return {body,legChains,armChains,legs:[],arms:[]};
}
