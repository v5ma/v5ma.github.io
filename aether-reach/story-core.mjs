/* Public story presentation. Only reads the existing expedition/relay/archive
 * state. Reading, replaying, or loading a chapter never grants game progress. */
import {TASKS} from './expedition-world.mjs';
import {BELL_TASK} from './bellwether-world.mjs';
import {RECORDS} from './model.mjs';
import {readingPages} from './field-guide-core.mjs';

export const STORY_TITLE='A City With a Voice';
export const STORY_OPENING="You are an engineer-courier arriving in a city above the clouds. The Registry has closed its northern routes. Iona needs someone who can carry a message where the signal cannot reach, repair what is broken, and help the city speak again.";
export const STORY_PURPOSES=Object.freeze({
 dispatch:'A carried letter can connect people when a transmitter cannot.',
 ferry:'A working ferry gives isolated neighbors a way to cross again.',
 charter:'The original charter preserves the memory that these routes were public.',
 weather:'Restoring the weather engine reconnects another working station to the city.',
 rescue:'An open route matters most when it brings someone home.',
 defense:'The beacon gives travelers a light to navigate by; the Registry wants it dark.',
 summits:'Survey the high galleries to understand how the separated districts connect.',
 routes:'Learn the public transport network by making its crossings yourself.',
 districts:'These are working neighborhoods, not just platforms to pass over.',
 'open-sky':'Bring the repaired stations, recovered charter and rescued surveyor back into one shared story.',
 'bellwether-blackout':'Restore a neighborhood, not just a switch: street, workshop and receiver depend on one another.',
 'roof-surveys':'Learn the roof routes that connect the city above its closed streets.',
 'roof-courier':'Recover the undelivered letters so their journeys can continue.',
 'roof-beacons':'Align the rooftop beacons so separate stations can work together.'
});
export const storyPurpose=id=>STORY_PURPOSES[id]||'Reconnect the city through the work you do here.';
const entry=(id,title,text,notice='')=>({id,title,text,notice});
const has=(s,id)=>s.expedition?.flags?.includes(id)===true;

export function storyAssignment(s){
 const task=TASKS.find(t=>t.id===s.expedition?.tracked);
 if(task&&has(s,task.flag))return entry('assignment','Your next chapter',task.name+' is complete. '+storyPurpose(task.id)+' Open Adventures to choose another assignment. The Silent Network relay expedition also remains available.');
 if(!has(s,'dispatch-started')&&s.expedition?.tracked==='dispatch')return entry('assignment','Your first dispatch',STORY_OPENING+" Walk to Iona's noticeboard on Arrival Quay, ahead and right of your arrival point. Use it when its name appears. Your starter equipment is enough; no purchase is needed.");
 if(task)return entry('assignment','Why this assignment matters',task.name+'. '+storyPurpose(task.id)+' '+task.description+' The live map and What do I do? show the current action and destination.');
 return entry('assignment','The city needs a courier',STORY_OPENING+' Your live map marks the next destination. Open Adventures to choose a task.');
}

/* Stable narrative order, not invented dates or a claim about the order the
 * player chose. Locked outcomes do not appear in this returned collection. */
export function storyChapters(s){
 const chapters=[
  entry('arrival','An engineer-courier',STORY_OPENING+' Your tools are a field suit, a sidearm, a sky clamp and a Foldwing. Rails, stairs, ferries and service routes are ways to reach people, not an obstacle course separate from the story. You are here to make the city usable again.'),
  entry('city','Before the closed routes','The first platforms were tethered laboratories built to put the wind to work. Gardens, workshops, markets and homes grew around them. The surviving city records tell of ladders replaced by licenses and temporary tolls that never went away. The city still contains the machinery of connection. Someone has to make it work.'),
  entry('iona','Iona and the silent network',"Iona is the voice organizing the dispatches from Arrival Quay. The Registry has closed the northern routes, and armed boarding parties stand in the way of reopening them. Iona's answer begins with practical work: carry a dispatch, reconnect a relay, bring someone home. Restoring a signal does not mean every door is open or the Registry is defeated."),
  entry('relays','The Silent Network','There is another route through the city alongside Skyward Dispatch. Restore the greenhouse relay at Glasshouse Gardens, the freight relay at Copperlight Works, and the broadcast relay at the Meridian Spire. Then return to the broadcast console at Arrival Quay. The gardens need power, freight needs a working network, and Iona needs a transmitter.')
 ];
 if(has(s,'dispatch-started'))chapters.push(entry('dispatch-taken','A letter through the clouds',"IONA: When the frequencies go quiet, carry the words yourself. The noticeboard has entrusted you with a public dispatch for Bellwether. Take the long stair west and deliver it to the notice office. This is the first connection: not a conquered outpost, but a message reaching another neighborhood."));
 if(has(s,'dispatch-delivered'))chapters.push(entry('dispatch-delivered','The message arrives',"Bellwether's notice office has accepted Iona's dispatch. The northern stations are no longer just names on a board: they are places asking for help. A mechanic left an induction regulator in the Clockmaker's Arcade. Gannet's ferry needs it. The market's blackout dispatch desk offers a separate, connected repair through its streets, workshop and Theatre roof.",'IONA: The letter reached Bellwether. One neighborhood can answer another. Story so far updated.'));
 if(has(s,'regulator'))chapters.push(entry('regulator','A crossing waiting to happen',"The induction regulator is recovered from the Clockmaker's Arcade, but the ferry is not repaired yet. Carry it to the engine at Gannet Docks. Captain Orel's surviving log describes a timetable as a promise to someone you have never met. This part is what can make that promise possible again."));
 if(has(s,'ferry-online'))chapters.push(entry('ferry','A ferry for everyone',"You installed the regulator at Gannet Docks. The passenger ferry can cross to the Civic Archive again. The repaired engine is not only a reward chest or a checked box: it is a route another traveler could need. Board at the southwest Gannet landing to make the crossing yourself.",'IONA: Gannet has its crossing back. A working route is a promise kept. Story so far updated.'));
 const b=s.bellwether?.stage||0;
 if(b>=1)chapters.push(entry('bell-start','Bellwether goes dark',"Bellwether's street, Arcade and Theatre receiver form one broken connection. The dispatch desk has sent you after the street disruptors. Tavi's field messages explain the next repair. First make the approach safe; then find why power will not reach the workshop. The rooftop signal is the last link, not a substitute for repairing the circuit."));
 if(b>=2)chapters.push(entry('bell-street','Room to repair','The street disruptors are stopped. This has created room to enter the Clockmaker\'s Arcade and work on the circuit. Read its maintenance card: supply, return and balance must agree. A cleared street cannot light the market by itself. The work inside matters as much as the fight outside.','TAVI: The street is clear. Now we can repair what the disruptors kept dark. Story so far updated.'));
 if(b>=3)chapters.push(entry('bell-circuit','The workshop answers','The Arcade circuit holds, and the west service shutter has opened. A working workshop and a useful shortcut now come from the same repair. Follow the maintenance galleries toward the Theatre receiver, or use the familiar south ladder. Look back toward the street you secured: it is part of this connection, not a discarded level.','TAVI: The Arcade has power and the service shutter is open. The receiver is the next link. Story so far updated.'));
 if(b>=4)chapters.push(entry('bell-roof','Hold the connection','The Theatre receiver attempt has begun. The Registry boarders contest the roof. The reversible windbreak protects either the receiver lane or the gallery approach; your shots obey the cover too. The east gallery lets you retreat and return to the same fight. Clear the receiver and stay close enough to synchronize it. An interrupted attempt can be retried without repeating the circuit repair.'));
 if(b>=5)chapters.push(entry('bell-signal','Light over the market',"The Theatre receiver has synchronized. Bellwether's lamps are lit again. The circuit, street and receiver now form the connection you came to restore. Return to the eastern dispatch desk to finish the assignment. The receiver's success and the desk's reward are distinct steps.",'TAVI: The receiver is synchronized. Look back at the market lights, then report to the desk. Story so far updated.'));
 if(has(s,BELL_TASK.flag))chapters.push(entry('bell-restored','A neighborhood restored',"You reported back to Bellwether's dispatch desk. The market is restored and the dispatch reward has been recorded once. The Arcade, lamps and opened service route remain part of the city you can return to. This chapter ends with a neighborhood functioning again, not with the whole city's conflict resolved.",'TAVI: Bellwether is back on its own frequency. You repaired a neighborhood. Story so far updated.'));
 const leaves=['charter-market','charter-academy','charter-dawn'].filter(id=>has(s,id));
 if(leaves.length)chapters.push(entry('charter-leaves','Pieces of a public promise',leaves.length+' of the 3 charter leaves have been recovered. Their seals lead to the Civic Archive. Recover the leaves from Bellwether, Aurelian Academy and Dawn Aerodrome, then use the archive seal reader. These fragments point toward the original public-route charter, not a new claim that the Registry has surrendered.'));
 if(has(s,'charter'))chapters.push(entry('charter','The city remembers','The original public-route charter is recovered. The Archive preserves a memory of shared routes beneath the later licenses and closed passages. A document alone will not restart an engine or protect a crossing. Carrying that memory alongside practical repairs is what gives the dispatch its meaning.','IONA: The charter is recovered. The city can remember what those routes were for. Story so far updated.'));
 if(has(s,'weather-open'))chapters.push(entry('weather','A station comes back','The valves are balanced and the Stormglass Weather Engine is running. Another station can take its place in the connected city. This is a working repair, not a promise that every storm is gone. The engine room and its reserve are now accessible.','IONA: Stormglass is running again. Another silent station can answer. Story so far updated.'));
 if(has(s,'surveyor-found'))chapters.push(entry('lio-found','Nobody crosses alone',"You found Surveyor Lio at Dawn Aerodrome. Lio can walk, but Registry fire blocks the route. Stay close, clear the way and accompany Lio to the evacuation pad. Finding someone is not the same as bringing them to safety. The route must work for the person traveling it."));
 if(has(s,'surveyor-safe'))chapters.push(entry('lio-safe','A route that brought someone home',"Lio has reached Dawn's evacuation pad. The rescue gives the city's network a human meaning: a cleared route is somewhere a person can actually go. Lio can see the beacon from here. Nobody has to make every crossing alone.",'LIO: We made it to the evacuation pad. Nobody has to cross alone now. Story so far updated.'));
 if(has(s,'beacon-secure'))chapters.push(entry('beacon','Keep the light on','The Registry boarding waves were repelled and the Solstice beacon is secure. Its light marks an open route above the clouds. The beacon is one station in a larger network; it still needs the recovered charter, working weather engine and completed rescue to bring Skyward Dispatch together.','IONA: Solstice is secure. Leave the light on for the next traveler. Story so far updated.'));
 for(const [id,title,text,notice]of[
  ['garden','The gardens can breathe',"The greenhouse relay is restored. Iona reports that the irrigation pumps have power again. Gardener Sen's archive tells of keeping seeds from silent districts alive. Repair here means maintaining a place for people who have not yet answered.",'IONA: The gardens have power again. Their pumps can breathe. Story so far updated.'],
  ['foundry','Freight is a public road','The Copperlight freight relay is restored. Iona recalls that these rails belonged to the people who built them. The sky clamp lets an engineer use the same machinery that carries supplies. A working freight network is another way for the divided city to connect.','IONA: Freight authority restored. Those rails were built to connect us. Story so far updated.'],
  ['spire','A transmitter listening',"The Meridian broadcast relay is restored. Iona's transmitter is listening. When all 3 relays are working, return to Arrival Quay and use the broadcast console. A restored transmitter is not yet the final broadcast; it still needs your hand at the Quay.",'IONA: The transmitter is listening. Restore any remaining relays, then return to the Quay. Story so far updated.']
 ])if(s.relays?.has(id))chapters.push(entry('relay-'+id,title,text,notice));
 if(s.won)chapters.push(entry('broadcast','The city has a voice',"Iona's signal is back on the public air. You restored the relays and returned to Arrival Quay to broadcast it. The doors are not all open, and the Registry has not been defeated, but the city can speak. This closes The Silent Network expedition. Skyward Dispatch and the neighborhoods still offer work worth doing."));
 if(has(s,'open-sky'))chapters.push(entry('open-sky','The Skyward Dispatch',"IONA: Your dispatch is on every public frequency. The recovered charter, Stormglass station, Lio's rescue and Solstice beacon are connected again. You began by carrying one letter. Now the city has routes, shared memory and a signal through which people can answer. This chapter is complete. Keep exploring; restoring these connections does not mean every conflict has ended.",'IONA: Your dispatch is on every public frequency. The city can answer again. Story so far updated.'));
 return chapters;
}
export function storyEntries(s){
 return [storyAssignment(s),...storyChapters(s),...RECORDS.filter(r=>s.records?.has(r.id)).map(r=>entry('archive-'+r.id,'Archive: '+r.title,r.text))];
}
export function storyPage(e,index=0){
 const pages=readingPages(e.text,235),page=Math.max(0,Math.min(pages.length-1,Number.isFinite(index)?Math.trunc(index):0));
 return {page,count:pages.length,text:pages[page],description:'Page '+(page+1)+' of '+pages.length+'. '+pages[page]};
}
/* A session observer, not an extra save. Prime on Continue so old achievements
 * reconstruct their chapters without new-completion toasts or duplicate rewards. */
export function createStoryObserver(){
 let seen=new Set();
 return {reset(s){seen=new Set(storyChapters(s).map(e=>e.id));},poll(s){const chapters=storyChapters(s),fresh=chapters.filter(e=>!seen.has(e.id));seen=new Set(chapters.map(e=>e.id));return fresh.filter(e=>e.notice).at(-1)||null;}};
}
