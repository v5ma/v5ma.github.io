/* Full Vinci is the ordinary entry. Quarter accomplishments are retained in
 * the same save, and its optional archive entry is an explicit choice. */
import {newState} from './model.mjs';
import {attachFrontier} from './frontier-core.mjs';
import {attachQuarter} from './quarter-core.mjs';
export const PLAYTEST_BUILD='guild-vr-startup-20260921';
export function requestedCampaign(search=''){
 return new URLSearchParams(search).get('district')==='quarter'?'quarter':'vinci';
}
export function createCampaignState(saved=null,search=''){
 const quarter=requestedCampaign(search)==='quarter';
 const record={...(saved?.quarter||{}),active:quarter};
 return attachQuarter(attachFrontier(newState(saved),saved?.frontier),record,{fresh:!saved,legacy:!quarter});
}
