/* Guided third-person input only. First-person aiming and damage rules stay intact. */
import {stepWindowLook} from './window-controls.mjs';
export function stepDioramaLook(player,look,dt,options={}){
 if(options.guided===false||options.fine){stepWindowLook(player,look,dt,options);return;}
 const x=Number.isFinite(look?.[0])?look[0]:0,y=Number.isFinite(look?.[1])?look[1]:0;
 // Small diagonal thumb drift cannot pitch the weapon away from a level target.
 const vertical=Math.abs(y)>.32?Math.sign(y)*(Math.min(1,Math.abs(y))-.32)/.68*.65:0;
 stepWindowLook(player,[x,vertical],dt,options);
 // An intentional horizontal sweep eases back to chest height. Neutral is stable.
 if(Math.abs(x)>.25&&Math.abs(y)<.22)player.pitch*=Math.max(0,1-Math.max(0,Math.min(.12,Number.isFinite(dt)?dt:0))*5);
}
