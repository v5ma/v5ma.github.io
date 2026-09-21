/* Native menu pagination follows actual accessible control focus, not head pose.
 * This changes presentation only: no game actions, storage or synthetic focus. */
export function createNativeMenuFocus(pageSize=6){
 if(!Number.isInteger(pageSize)||pageSize<1)throw new TypeError('Positive page size required');
 let lastRoot=null,lastFocus=null;
 return {
  sync(root,controls,focused,page){
   const pages=Math.max(1,Math.ceil(controls.length/pageSize));
   let next=Math.max(0,Math.min(pages-1,Number.isInteger(page)?page:0));
   if(root!==lastRoot||focused!==lastFocus){
    const index=controls.indexOf(focused);
    if(index>=0)next=Math.floor(index/pageSize);
   }
   lastRoot=root;lastFocus=focused;return next;
  },
  reset(){lastRoot=null;lastFocus=null;}
 };
}
export function firstMissionControl(list){
 const buttons=Array.from(list?.querySelectorAll('[data-mission]')||[]).filter(b=>!b.disabled&&!b.closest('[hidden]'));
 return buttons.find(b=>b.dataset.missionActive==='true')||buttons[0]||null;
}

/* Make the one-shot Jobs destination agree with the controller's next scope
 * poll. Ordinary Pause restores Resume before rebuilding these mission rows. */
export function focusMissionList(list,resume){
 const target=firstMissionControl(list);
 if(!target)return false;
 for(const button of list.querySelectorAll('[data-pad-default]'))button.removeAttribute('data-pad-default');
 resume?.removeAttribute('data-pad-default');
 target.setAttribute('data-pad-default','');
 target.focus({preventScroll:false});
 return true;
}
