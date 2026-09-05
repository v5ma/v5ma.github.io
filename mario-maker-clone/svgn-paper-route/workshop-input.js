/* First capture listener: editing shortcuts cannot leak into the game. */
'use strict';
for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{
 const w=window.RouteWorkshop;if(!w?.active)return;
 w.handleKey(e);e.stopImmediatePropagation();
},true);
