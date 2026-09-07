/* Fictional local game state only; no network or device access. */
import {street,tangent,add,mul,norm,cross,dot,rotate,distance,RADIUS} from './world.mjs';
import {CITY,STORY,CITY_SAVE_KEY,coordinates,cityCollision,sightBlocked} from './city-world.mjs';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const forward=n=>tangent(add(street(coordinates(n).t+1,coordinates(n).x),mul(n,-1)),n);
export function log(c,s,type,data={}){c.events.push({type,step:s.steps,...data});if(c.events.length>160)c.events.shift();}
export function say(s,text){s.toast=text;s.toastT=5;}
export const focus=(s,c)=>c.drone.active?c.drone:s;
export function moveActor(n,f,meters){const axis=norm(cross(n,f)),a=meters/RADIUS;return {n:norm(rotate(n,axis,a)),f:tangent(rotate(f,axis,a),norm(rotate(n,axis,a)))};}
