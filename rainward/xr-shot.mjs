import {heightAt,HEIGHT,obstruction} from './world.mjs';
/* A tracked muzzle cannot be used from the far side of a wall or across a room. */
export function authorizedMuzzle(state,muzzle){
 const p=state.player,body={x:p.x,y:heightAt(p.x,p.z)+HEIGHT[p.stance]*.82,z:p.z};
 if(!muzzle||!['x','y','z'].every(k=>Number.isFinite(muzzle[k])))return null;
 if(Math.hypot(muzzle.x-body.x,muzzle.y-body.y,muzzle.z-body.z)>1.8)return null;
 if(obstruction(body,muzzle))return null;
 return {x:muzzle.x,y:muzzle.y,z:muzzle.z};
}
