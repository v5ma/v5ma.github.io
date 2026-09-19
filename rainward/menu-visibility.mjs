/* Layout boxes alone can survive inside a closed <details> disclosure.
 * Keep the first summary reachable, but never navigate hidden descendants.
 * Ignore opacity: the native DOM is deliberately transparent during XR. */
export function menuControlVisible(element){
 if(!element||element.closest('[hidden],[inert],[aria-hidden="true"]'))return false;
 for(let parent=element.parentElement;parent;parent=parent.parentElement){
  if(parent.tagName==='DETAILS'&&!parent.open){
   const summary=[...parent.children].find(child=>child.tagName==='SUMMARY');
   if(!summary?.contains(element))return false;
  }
 }
 if(typeof element.checkVisibility==='function'&&!element.checkVisibility({visibilityProperty:true}))return false;
 return element.getClientRects().length>0;
}
