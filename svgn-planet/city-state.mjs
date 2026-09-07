/* Fictional local game state only; no network or device access. */
import {street,tangent,add,mul,norm,cross,dot,rotate,distance,RADIUS} from './world.mjs';
import {CITY,STORY,CITY_SAVE_KEY,coordinates,cityCollision,sightBlocked} from './city-world.mjs';
import {clamp,forward} from './city-shared.mjs';
export function initialCity(saved={}){saved=saved||{};return {
 active:saved.active===true,stage:saved.stage||0,credits:saved.credits??80,nitro:!!saved.nitro,completed:!!saved.completed,
 jobs:new Set(saved.jobs||[]),paid:new Set(saved.paid||[]),alarmEver:!!saved.alarmEver,approach:saved.approach||null,
 vehicles:CITY.vehicles.map(v=>({...v,n:[...v.n],f:forward(v.n),speed:0,fuel:100,condition:100,owned:v.parked,stopped:0})),
 car:null,drone:{active:false,n:street(0),north:[0,0,-1],facing:[0,0,-1],lift:4,battery:100},
 guards:CITY.guards.map(g=>({...g,n:[...g.n],f:forward(g.n),target:1,stun:0,search:0,lastSeen:null})),
 scan:0,selected:0,targetId:null,progress:0,hacking:null,power:false,gate:false,loop:0,red:0,distraction:0,
 trace:0,unseen:0,integrity:100,energy:100,contactCD:0,crouch:false,walked:saved.walked||0,driven:saved.driven||0,events:[],lastHacked:null
 };}
export function citySave(c){return {v:1,active:c.active,stage:c.stage,completed:c.completed,credits:c.credits,nitro:c.nitro,jobs:[...c.jobs],paid:[...c.paid],alarmEver:c.alarmEver,approach:c.approach,walked:c.walked,driven:c.driven};}
export function readCitySave(raw){try{if(typeof raw!=='string'||raw.length>7000)return null;const d=JSON.parse(raw);if(d?.v!==1)return null;const arr=(a,allowed)=>Array.isArray(a)?[...new Set(a.filter(x=>allowed.includes(x)))]:[];const stage=Number.isInteger(d.stage)?clamp(d.stage,0,5):0;return {active:d.active===true,stage:stage===5&&d.completed!==true?4:stage,completed:d.completed===true&&stage===5,credits:clamp(Number(d.credits)||0,0,100000),nitro:d.nitro===true,jobs:arr(d.jobs,CITY.jobs.map(j=>j.id)),paid:arr(d.paid,['cabin','fern','mill','terrace','beacon','market','quay','harbor']),alarmEver:d.alarmEver===true,approach:['on foot','drone'].includes(d.approach)?d.approach:null,walked:clamp(Number(d.walked)||0,0,1e7),driven:clamp(Number(d.driven)||0,0,1e7)};}catch{return null;}}
export function mission(c){return [
 {name:'Collect the field kit',detail:'E at the SVGN desk. Paper deliveries remain optional.',site:CITY.desk},
 {name:'Meet Open Signal',detail:'Meet Nia at Signal Plaza. Take a car or ride the neighborhood road to the new junction.',site:CITY.contact},
 {name:'Retrieve the Waterfront File',detail:'Scan with X; hold H to link. Power the front gate, use the rear alley, or fly a drone above the fence.',site:CITY.devices.find(d=>d.id==='evidence')},
 {name:'Record the quay report',detail:'Recall the drone. Cross the harbor bridge and press E at the field-report marker.',site:CITY.report},
 {name:'Publish without a tail',detail:'Return to the SVGN desk. Lose the CivicGrid trace before publishing.',site:CITY.desk},
 {name:'The Waterfront File — published',detail:'Keep exploring. Garage upgrades and optional dispatches are available.',site:CITY.garage}
 ][clamp(c.stage,0,5)];}
