/* Authored town content. Coordinates extend the existing district; they do not
 * replace its roads or first commission. Romance characters and the player are adults. */
export const LIFE_VERSION=1;
export const ATTRIBUTES={vitality:'Vitality',riding:'Riding',ingenuity:'Ingenuity',empathy:'Empathy'};
export const LEVELS=[0,100,240,420,650,900,1200,1550,1950,2400];
export const ROOMS=[
 {id:'workshop',name:'The Workshop Annex',x:-24.5,z:24,side:-1,kind:'workshop',cellar:true},
 {id:'apothecary',name:'Ada’s Apothecary',x:24.5,z:61,side:1,kind:'apothecary'},
 {id:'inn',name:'The Copper Cat Inn',x:104.5,z:178,side:1,kind:'inn',cellar:true},
 {id:'hall',name:'The Mayor’s Hall',x:-104.5,z:178,side:-1,kind:'hall'},
 {id:'smith',name:'Bartolo’s Cycle Works',x:-24.5,z:215,side:-1,kind:'smith'},
 {id:'observatory',name:'Sofia’s Conservatory',x:24.5,z:496,side:1,kind:'observatory'}
];
export const PEOPLE=[
 {id:'leonardo',name:'Leonardo',role:'Inventor and mentor',x:-10,z:2,existing:true,text:'My young colleague, a town is not a collection of buildings. It is the work that passes between people. Bring something useful back from every journey.'},
 {id:'ada',name:'Ada',role:'Apothecary',x:25,z:62,room:'apothecary',text:'Ink, tonics, a little light in the dark. Everything here has a purpose. Please leave your bicycle at the door.'},
 {id:'marta',name:'Marta',role:'Market quartermaster',x:17,z:170,existing:true,text:'I supply the workshops. Take care of your neighbors and they will take care of you. Florins are earned here, never bought with real money.'},
 {id:'bartolo',name:'Bartolo',role:'Smith and cycle builder',x:-25,z:216,room:'smith',text:'A frame should fit its work. A light courier bicycle is quick; a cargo cycle carries more. Neither replaces good steering.'},
 {id:'beatrice',name:'Beatrice',role:'Innkeeper',x:105,z:177,room:'inn',text:'Welcome to the Copper Cat. There are beds upstairs in the story, but this taproom and its cellar are the places you can explore today.'},
 {id:'mayor',name:'Mayor Vittorio',role:'Civic commissions',x:-105,z:179,room:'hall',text:'A city runs on trust. Someone has taken the guild’s receipts. Without them I cannot reopen the north garden.'},
 {id:'lucia',name:'Captain Lucia',role:'City watch',x:-80,z:166,patrol:true,text:'My watch protects citizens, not purses. Bring evidence before you accuse anyone. A peaceful resolution is worth more than a fight.'},
 {id:'isabella',name:'Isabella',age:26,role:'Painter and independent artisan',x:20,z:201,romance:true,text:'I paint the things hurried people forget to notice. I would rather know what you found on the road than how many florins you carry.'},
 {id:'sofia',name:'Sofia',age:28,role:'Lens maker and astronomer',x:25,z:497,room:'observatory',romance:true,text:'The stars require patience. So do people. I have a life of my own, but there is room for a good conversation in it.'},
 {id:'luca',name:'Luca',role:'Courier guild member',x:-9,z:66,text:'There is more than one way across town. My circuit will take you down streets the first commission never needs.'},
 {id:'neri',name:'Neri',role:'Workshop archivist',x:-25,z:23,inside:'workshop',text:'The lock’s verse reads: a LEAF drinks WATER beneath a STAR. The old lantern is magic in this alternate history, not a claim about Renaissance science.'},
 {id:'rocco',name:'Rocco',role:'Receipt thief',x:105,z:180,inside:'inn',enemy:true,text:'I took the receipts, not the townspeople’s wages. Show me a warrant and the ledger and I will come quietly. Otherwise, keep your staff ready.'},
 {id:'guard',name:'Watchman Enzo',role:'North gate watch',x:7,z:399,text:'The northern gardens are closed until the mayor signs a charter and Bartolo repairs the pump. There is no toll and no paid shortcut.'}
];
export const CATS=[{id:'pippa',name:'Pippa',x:91,z:202,color:'#c78340'},{id:'nero',name:'Nero',x:-28,z:32,color:'#394243'},{id:'luma',name:'Luma',x:33,z:490,color:'#ead7af'}];
export const OBJECTS=[
 {id:'prism',name:'Three-symbol prism lock',x:-25,z:28,inside:'workshop',kind:'runes'},
 {id:'cog',name:'Stored bronze cog',x:-21,z:25,inside:'workshop',kind:'pickup'},
 {id:'ledger',name:'Faded guild ledger',x:109,z:176,inside:'inn',kind:'hidden'},
 {id:'pump',name:'Orchard pump and north gate',x:0,z:401,kind:'mechanism'},
 {id:'pigment-red',name:'Madder pigment',x:-23,z:460,kind:'plant'},
 {id:'pigment-blue',name:'Woad pigment',x:70,z:479,kind:'plant'},
 {id:'pigment-gold',name:'Ochre pigment',x:-70,z:527,kind:'plant'},
 {id:'lens-east',name:'Eastern lens test',x:80,z:460,kind:'survey'},
 {id:'lens-west',name:'Western lens test',x:-80,z:517,kind:'survey'},
 {id:'stamp-west',name:'Western dispatch stamp',x:-80,z:99,kind:'post'},
 {id:'stamp-east',name:'Eastern dispatch stamp',x:80,z:62,kind:'post'},
 {id:'stamp-market',name:'Market dispatch stamp',x:0,z:141,kind:'post'},
 {id:'wind',name:'Hilltop wind survey',x:0,z:541,kind:'survey'},
 {id:'airframe',name:'Leonardo’s unfinished flying machine',x:-18,z:39,kind:'invention'},
 {id:'bench',name:'Garden meeting place',x:16,z:462,kind:'meeting'}
];
export const QUESTS=[
 {id:'ink',name:'Ink and Feathers',giver:'leonardo',xp:80,florins:30,requires:[],stages:[['ada','Collect Leonardo’s ink from Ada inside the apothecary.'],['leonardo','Return the sealed ink to Leonardo.']],description:'A small errand introduces the first walkable shop.'},
 {id:'cat',name:'The Missing Copper Cat',giver:'beatrice',xp:80,florins:35,requires:[],stages:[['pippa','Find and coax Pippa near the inn gardens.'],['beatrice','Bring the news back to Beatrice in the inn.']],description:'Help the innkeeper, gain a cat companion and earn access to the cellar.'},
 {id:'lantern',name:'A Light Below',giver:'ada',xp:120,florins:45,requires:['ink'],stages:[['prism','Descend the workshop stairs and solve the three-symbol lock.'],['ada','Bring the prism to Ada to learn Lantern magic.']],description:'Read Neri’s verse. Magic reveals things that ordinary light misses.'},
 {id:'receipts',name:'The Missing Guild Receipts',giver:'mayor',xp:140,florins:65,requires:['cat'],stages:[['lucia','Ask Captain Lucia for a warrant.'],['ledger','Use Lantern in the inn cellar to reveal the faded ledger.'],['rocco','Confront Rocco with the evidence, or defend yourself.'],['mayor','Report to the mayor to earn the garden charter.']],description:'A watch investigation opens a civic route; a fight is optional.'},
 {id:'orchard',name:'The Garden Beyond the Gate',giver:'bartolo',xp:140,florins:70,requires:['ink'],stages:[['cog','Collect the bronze cog in the workshop basement.'],['pump','With the mayor’s charter and restored waterwheel, repair the north pump.'],['bartolo','Tell Bartolo the gardens are open.']],description:'A larger northern area becomes part of the same traversable map.'},
 {id:'courier',name:'The Brass Courier Circuit',giver:'luca',xp:90,florins:45,requires:[],stages:[['stamp-west','Get the western dispatch stamp.'],['stamp-east','Get the eastern dispatch stamp.'],['stamp-market','Get the market dispatch stamp.'],['luca','Report to Luca for a courier-cycle permit.']],description:'A free-route circuit. No forced timer or teleport; choose your own streets.'},
 {id:'pigments',name:'Colors of the Garden',giver:'isabella',xp:110,florins:40,requires:['orchard'],stages:[['pigment-red','Gather madder pigment from the north garden.'],['pigment-blue','Gather woad beside the eastern garden path.'],['pigment-gold','Gather ochre by the western hill.'],['isabella','Bring the colors back to Isabella.']],description:'An artisan’s commission can become friendship or an optional relationship.'},
 {id:'lenses',name:'A Clearer View',giver:'sofia',xp:110,florins:45,requires:['orchard'],stages:[['lens-east','Align the eastern lens test.'],['lens-west','Align the western lens test.'],['sofia','Return to the conservatory with both readings.']],description:'Help Sofia complete her work. A shared garden walk is optional.'},
 {id:'sky',name:'Skyward, One Day',giver:'leonardo',xp:180,florins:80,requires:['pigments','lenses'],stages:[['isabella','Ask Isabella for sailcloth.'],['wind','Record the wind at the northern survey station.'],['sofia','Collect Sofia’s calibrated compass.'],['leonardo','Bring the research to Leonardo’s workshop.']],description:'Unlock the flying-machine design and assembly display. Piloted flight is a future update, not enabled by this blueprint.'}
];
export const GOODS=[
 {id:'tonic',name:'Restorative cordial',price:15,seller:['ada','marta'],text:'Restore vitality. No real-money purchases.'},
 {id:'focus',name:'Focus cordial',price:18,seller:['ada'],text:'Refill focus for Lantern magic.'},
 {id:'flowers',name:'Garden bouquet',price:12,seller:['marta'],text:'A friendly gift; gifts alone never unlock romance.'},
 {id:'courier',name:'Brass Courier bicycle',price:85,seller:['bartolo'],quest:'courier',text:'Lighter gearing: faster pedaling, same steering controls.'},
 {id:'cargo',name:'Artisan Cargo bicycle',price:75,seller:['bartolo'],quest:'ink',text:'Carries 30 letters; slower top speed and larger panniers.'}
];
