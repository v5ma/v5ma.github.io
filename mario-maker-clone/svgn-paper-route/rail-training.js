/* Editable grip lesson. The road is a safe fallback, not a compulsory aerial test. */
(function(){'use strict';
 function makeDocument(){const W=WorkshopCore,d=W.starter();d.name='Rail Grip Yard';d.w=112;d.cells=new Uint8Array(d.w*d.h);const ground=d.extra.gp.ground;for(let y=ground;y<d.h;y++)d.cells.fill(T.STEEL,y*d.w,(y+1)*d.w);for(const [x,y,t]of [[3,ground-1,T.START],[15,ground-1,T.NITRO],[105,ground-1,T.GOAL]])d.cells[y*d.w+x]=t;
  const paths=[W.cubic([650,2070],[760,2070],[815,1980],[930,1910],40),W.cubic([995,1790],[1190,1790],[1400,1760],[1600,1780],48),W.cubic([1760,1950],[2130,2110],[2500,2050],[2870,2050],64)];
  d.paths=paths.map((points,i)=>({points,anchors:null,meta:{version:1,kind:'open',id:'grip-'+i,stage:i,begin:0,end:1,network:true,optional:true,sector:0,tier:1,roadDepth:34,label:['Launch from above','Overhead underside receiver','Return to the upper face'][i]}}));
  d.extra.gp.cast=[];d.extra.gp.sections=[{x:0,name:'Rail Grip Yard'}];Object.assign(d.extra.gp.skyNetwork,{sectors:[{id:'yard',name:'Top / underside / top',x:0,y:1300,w:d.w*36,h:860}],links:[],mainIDs:['grip-0','grip-1','grip-2'],pegCount:0});return d;
 }
 function boot(){const button=document.createElement('button');button.id='rail-yard';button.textContent='Rail Grip Yard';button.title='Editable practice: collect nitro, jump onto the launch, then boost toward the underside.';document.querySelector('#route-workshop .maker-library details').prepend(button);button.onclick=()=>{const S=RouteWorkshop.state;if(S.dirty&&!confirm('Save or export your edits before loading the practice yard. Replace this draft?'))return;RouteWorkshop.open(WorkshopCore.encode(makeDocument()));};window.RailTraining={document:makeDocument};}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
