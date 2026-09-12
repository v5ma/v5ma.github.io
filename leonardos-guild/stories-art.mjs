/* Persistent story outcomes, using only original geometry and existing assets.
 * No new lights, audio emitters, texture downloads or collision obstacles. */
import * as T from './vendor/three.module.js';
import {Batch,unit,label} from './art.mjs';
import {heightAt} from './model.mjs';
import {doorLevel} from './doors-core.mjs';
import {storyOutcomes} from './stories-core.mjs';
export function createStoryArt({scene,w,m,camera}){
 const work=w.doorHomes.find(h=>h.id==='workshop'),home=w.doorHomes.find(h=>h.id==='residence-home-0');
 const lamp=new T.Group(),books=new T.Group();lamp.name='Alessia reading lamp';books.name='Renata corrected atlas';
 lamp.position.set(work.x+work.side*(work.hx-1.5),heightAt(work.x,work.z),work.z+work.hz-1.8);
 books.position.set(home.x,heightAt(home.x,home.z),home.z+home.hz-1.4);scene.add(lamp,books);
 const b=new Batch();b.box(0,.65,0,.55,1.3,.5,'#745038');b.rod([0,1.25,0],[0,1.9,0],.045,'#c4a16d');b.box(0,1.48,0,.4,.09,.36,'#c4a16d');b.finish(lamp,m.trim,'Reading lamp frame');
 const glowMaterial=new T.MeshBasicMaterial({color:'#efc675'}),glow=new T.Mesh(new T.SphereGeometry(.18,8,6),glowMaterial);glow.position.y=1.68;glow.scale.set(1,1.3,1);lamp.add(glow);
 const pages=new Batch();pages.box(0,.96,0,1.7,.09,.66,'#694d36');pages.box(-.42,1.1,0,.5,.2,.42,'#568282');pages.box(.3,1.14,0,.54,.28,.44,'#9b734f');pages.finish(books,m.trim,'Corrected atlas and lending shelf');
 const shelf=new Batch();shelf.box(0,.3,0,1.8,.08,.7,'#694d36');shelf.box(-.85,.66,0,.08,1.2,.7,'#694d36');shelf.box(.85,.66,0,.08,1.2,.7,'#694d36');const shelfGroup=new T.Group();shelf.finish(shelfGroup,m.trim,'Shared neighborhood shelf');books.add(shelfGroup);
 const lampTag=label(lamp,'A light for reading',0,2.2,0,2,.42,0,'#665239'),creditTag=label(books,'Renata + Pietro / shared work',0,1.65,0,2.8,.48,0,'#41616a'),shelfTag=label(books,'Neighborhood lending shelf',0,1.65,0,2.8,.48,0,'#41616a');
 let last={lamp:null,ledger:null};
 function update(s){last=storyOutcomes(s,w);const ground=doorLevel(s)===0,dl=Math.hypot(s.x-work.x,s.z-work.z),db=Math.hypot(s.x-home.x,s.z-home.z);lamp.visible=!!last.lamp&&ground&&dl<45;books.visible=!!last.ledger&&ground&&db<45;glowMaterial.color.set(last.lamp==='ivory'?'#fff1d2':'#efc675');shelfGroup.visible=last.ledger==='shared';for(const tag of[lampTag,creditTag,shelfTag])tag.quaternion.copy(camera.quaternion);lampTag.visible=dl<10;creditTag.visible=db<10&&last.ledger==='credit';shelfTag.visible=db<10&&last.ledger==='shared';}
 return {update,inspect:()=>({...last,lampVisible:lamp.visible,ledgerVisible:books.visible,extraLights:0})};
}
