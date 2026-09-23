/* Open Channel: two physical solutions to one readable power budget.
 * Simulation owns the circuit. Presentation only observes it. No timers or damage. */
export const CHANNEL_NODES=Object.freeze([
 Object.freeze({id:'reserve',label:'Workshop reserve cell',x:17.5,y:0,z:7.7}),
 Object.freeze({id:'feeder',label:'Public-light feeder',x:-18.4,y:10.8,z:-4.15}),
 Object.freeze({id:'transmit',label:'Archive uplink',x:-21.5,y:10.8,z:-4.6})
]);
const point=(id,label,x,y,z)=>Object.freeze({id,label,x,y,z,kind:'interact'});
export const CHANNEL_CASE=Object.freeze({id:'channel',title:'Archive: Open Channel',reward:140,
 summary:'Answer the original operator. Borrow reserve power from the workshop to keep the street lit, or take the shorter archive route and briefly divert its lights. Both deliver the same message.',steps:Object.freeze([
 point('channel-brief','Ask Sal how to answer the operator / loading loft',12,4.4,0),
 point('channel-send','Power and transmit the reply / upper reading room',-21.5,10.8,-4.6),
 point('channel-answer','Listen for the reply / archive receiver',-19.1,10.8,-6),
 point('channel-report','Tell Sal the operator is still there / loading loft',12,4.4,0)
 ])});
export const freshRouting=()=>({v:1,reserve:false,street:true,outcome:null});
const outcomes=['reserve','transfer'];
export function parseRouting(raw,stage=0){
 const p=raw==null?freshRouting():raw;
 if(!p||p.v!==1||typeof p.reserve!=='boolean'||typeof p.street!=='boolean'||p.outcome!==null&&!outcomes.includes(p.outcome))throw Error('Unsupported Open Channel circuit. Original save retained.');
 if(!Number.isInteger(stage)||stage<0||stage>4)throw Error('Invalid Open Channel stage.');
 if(stage===0&&(p.reserve||!p.street||p.outcome!==null)||stage===1&&p.outcome!==null||stage>=2&&!outcomes.includes(p.outcome))throw Error('Inconsistent Open Channel circuit.');
 if(stage===2&&(p.outcome!==(p.street?'reserve':'transfer')||p.street&&!p.reserve))throw Error('Unpowered Open Channel transmission.');
 if(stage>=3&&(p.reserve||!p.street))throw Error('Open Channel service was not restored.');
 return {v:1,reserve:p.reserve,street:p.street,outcome:p.outcome};
}
export function channelStatus(s){
 const c=s.campaign,r=c?.routing||freshRouting(),stage=c?.progress?.channel||0,active=c?.active==='channel',available=4+(r.reserve?2:0)-(r.street?2:0);
 return {active,stage,reserve:r.reserve,street:r.street,outcome:r.outcome,available,required:3,ready:available>=3,
  streetLit:!active||stage<1||stage>=3||r.street,
  summary:stage===1?`${available}/3 units available. ${r.street?'Street lights ON (2 units).':'Street lights DIVERTED.'} ${r.reserve?'Reserve +2 connected.':'Workshop reserve adds 2.'}`:
   stage===2?`Reply sent. ${r.outcome==='reserve'?'Street service stayed on.':'Temporary street diversion; listen to restore it.'}`:
   stage>=3?`Street service restored. ${r.outcome==='reserve'?'Reserve route: no blackout.':'Direct route: brief light diversion.'}`:'Choose reserve power or a short, temporary diversion.'};
}
export function channelTarget(s){
 const state=channelStatus(s);if(!state.active||state.stage!==1)return null;
 const node=CHANNEL_NODES.find(n=>n.id===(state.ready?'transmit':'feeder'));
 return {...node,label:state.ready?'Transmit the reply / archive uplink':
  'Supply 3 units: workshop reserve OR public-light feeder / upper archive'};
}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function nearbyChannelNode(s,api){
 if(s.campaign?.active!=='channel'||s.campaign.progress.channel!==1)return null;
 return CHANNEL_NODES.filter(n=>distance(s,n)<1.75&&api.lineClear(s,{x:s.x,y:s.y+1.3,z:s.z},{x:n.x,y:n.y+1,z:n.z})).sort((a,b)=>distance(s,a)-distance(s,b))[0]||null;
}
export function channelInteraction(s,api){
 const node=nearbyChannelNode(s,api);if(!node)return null;
 const c=s.campaign,r=c.routing||(c.routing=freshRouting());
 if(node.id==='reserve'){r.reserve=!r.reserve;return {advance:false,text:r.reserve?'Neri: Reserve cell connected. Two extra units, with the public lights still available. Take the reply to the upper archive uplink.':'Reserve cell disconnected. The live diagram shows the remaining supply.'};}
 if(node.id==='feeder'){r.street=!r.street;return {advance:false,text:r.street?'Public lighting restored. The uplink needs 3 units; connect the workshop reserve to transmit without a blackout.':'Public lighting temporarily diverted: 4 base units are available to the uplink. Transmit at the reading desk, or switch the feeder back to undo this choice.'};}
 const state=channelStatus(s);
 if(!state.ready)return {advance:false,text:'Uplink needs 3 units, but only '+state.available+' are free. Connect the reserve cell on the workshop floor (+2), OR temporarily divert public lights at the archive feeder (+2). Nothing was lost.'};
 r.outcome=r.street?'reserve':'transfer';
 return {advance:true,text:r.outcome==='reserve'?'Reply transmitted using reserve power. The street lights never went out. A voice is returning through the archive receiver.':'Reply transmitted with a brief public-light diversion. Listen at the archive receiver to release the transfer and restore street service.'};
}
export function channelStory(s,id){
 if(id==='channel-brief')return 'Sal: The operator is still listening. Our uplink needs 3 units; the grid has 4 and public lighting uses 2. Neri has a reserve cell on the workshop floor. Or take the shorter route to the upper archive and briefly divert its street feeder. Read the live panel before you transmit.';
 if(id==='channel-answer'){
  const r=s.campaign.routing;r.street=true;r.reserve=false;
  return 'Operator: I can hear you. I am still at the South Cable Exchange. Someone locked out our maintenance crew. Keep this line open. The transfer releases and public lighting returns to normal.';
 }
 if(id==='channel-report')return s.campaign.routing?.outcome==='reserve'?
  'Sal: We reached a person, not another dead relay, and the neighborhood stayed lit. I have logged Neri\'s reserve route. The exchange is our next lead; it is not an accessible district yet.':
  'Sal: A short diversion got the message through; street service is restored. I have logged the direct archive route. The exchange is our next lead; it is not an accessible district yet.';
 return null;
}
