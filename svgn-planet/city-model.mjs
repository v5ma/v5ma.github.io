/* Public facade for the city simulation. Authoritative state stays in the app. */
export {CITY,STORY,CITY_SAVE_KEY} from './city-world.mjs';
export {focus} from './city-shared.mjs';
export * from './city-state.mjs';
export * from './city-actions.mjs';
export {scan,candidates,selectedDevice,cycleDevice} from './city-network.mjs';
export {stepCity} from './city-simulation.mjs';
import {mission} from './city-state.mjs';
import {selectedDevice} from './city-network.mjs';
export function cityInspect(s,c){return {active:c.active,stage:c.stage,completed:c.completed,credits:c.credits,car:c.car,vehicles:c.vehicles.map(v=>({id:v.id,n:[...v.n],f:[...v.f],speed:v.speed,fuel:v.fuel,condition:v.condition})),drone:JSON.parse(JSON.stringify(c.drone)),trace:c.trace,integrity:c.integrity,crouch:c.crouch,gate:c.gate,power:c.power,loop:c.loop,scan:c.scan,device:selectedDevice(s,c)?.id||null,progress:c.progress,approach:c.approach,nitro:c.nitro,walked:c.walked,driven:c.driven,jobs:[...c.jobs],guards:c.guards.map(g=>({id:g.id,n:[...g.n],stun:g.stun,search:g.search})),objective:JSON.parse(JSON.stringify(mission(c))),events:c.events.map(e=>({...e}))};}
