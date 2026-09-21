/* Exact production scene sequence, without a renderer or a game-state fixture. */
import {pose as basePose} from '../actors.mjs';
import {footContacts} from '../foot-contact.mjs';
export {actor} from '../actors.mjs';
export function pose(actor,player,time,enemy=false,heightAt=()=>0){
 basePose(actor,player,time,enemy);
 actor.root.position.y+=heightAt(player.x,player.z)-(player.swimDepth||0);
 footContacts(actor,player,heightAt);
}
