/* Guidance only. It never grants progress, collects clues or selects a route. */
import {QUARTER_SITES} from './quarter-data.mjs';
export function quarterObjective(s){
 const q=s.quarter;if(!q?.active)return null;
 let id='parcel',verb='Recover the Missing Commission',hint='Loading stairs, dye roofs or drained service channel: choose your approach.',optional=false;
 if(q.parcel&&!q.reported){id='workshop';verb='Return the commission to Leonardo';hint=q.archOpen?'The opened bell arch leads back to the workshop.':'The gallery descent reaches the workshop-side arch latch.';}
 else if(q.reported&&q.delivery===0){id='workshop';verb='Ask Leonardo about the spindle delivery';hint='Optional follow-up. The original commission is complete.';optional=true;}
 else if(q.delivery===1){id='precision';verb='Collect Marta\'s spindle';hint='Manual pickup is available; restored drive and arch also enable porter service.';
  if(q.porterOrder){id='arch-front';verb='Meet Neri for the spindle';hint='He waits at the bell. You may intercept him on the goods route.';}
 }
 else if(q.delivery===2){id='loft';verb='Deliver the spindle to Ilaria';hint='Reach the finishing table in the dye loft, not the workroom below.';}
 else if(q.delivery===3){id='town';verb='Continue exploring Vinci';hint='Both Quarter deliveries are complete. Older districts remain available.';optional=true;}
 let site=QUARTER_SITES.find(p=>p.id===id);
 if(q.delivery===1&&q.porterOrder&&q.porter?.carrying){site={id:'porter',name:'Neri / spindle handoff',x:q.porter.x,y:q.porter.y,z:q.porter.z};}
 const layer=site.y<-.35?'service':site.y>.6?'upper':'street',dy=site.y-(q.groundY||0);
 return {...site,verb,hint,layer,optional,distance:Math.hypot(site.x-s.x,site.z-s.z),vertical:Math.abs(dy)<.5?'same height':dy>0?'above you':'below you',heightDifference:dy};
}
