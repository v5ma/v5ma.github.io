/* An imported user-level fixture, not a live-player state injection. */
const {document:d}=require('./helpers/sky-post-fixture.cjs');
const W=require('../mario-maker-clone/svgn-paper-route/workshop-core.js'),fs=require('node:fs');
const doc=W.decode(GroundCampaign.encode(d));doc.name='Sky Post preview isolation check';
for(let i=0;i<doc.cells.length;i++)if(doc.cells[i]===8)doc.cells[i]=0;
doc.cells[(doc.extra.gp.ground-1)*doc.w+20]=8;
fs.mkdirSync('test-output',{recursive:true});fs.writeFileSync('test-output/sky-post-preview.route',W.encode(doc));
