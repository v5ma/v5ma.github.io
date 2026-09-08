/* Authored short activities on existing blocks. A task is an entire playable
 * encounter, not a count of its markers. Adults/old quests are unchanged. */
const spot=(id,name,x,z,extra={})=>({id,name,x,z,...extra});
export const STREET_SITES=[
 spot('board','The neighbourhood noticeboard',-8,11,{asset:'BookStand'}),
 spot('cart','Tomas and the broken market cart',10,91,{asset:'Stall_Cart_Empty',person:'Tomas'}),
 spot('bell','The silent crossing bell',-10,127,{asset:'Lantern_Wall'}),
 spot('barrels','A leaking cider barrel',91,191,{asset:'Barrel'}),
 spot('cook','Emilia, the courtyard cook',14,207,{asset:'Stall_Empty',person:'Emilia'}),
 spot('apples','Spilled apples',10,217,{asset:'FarmCrate_Apple'}),
 spot('carrots','A misplaced vegetable crate',-11,227,{asset:'FarmCrate_Carrot'}),
 spot('basket','The cook\'s empty basket',11,234,{asset:'Pot_1'}),
 spot('clerk','Agostino, the guild clerk',-11,281,{asset:'Workbench',person:'Agostino'}),
 spot('receipt','A torn delivery receipt',-10,302,{asset:'Scroll_1'}),
 spot('witness','Renata, a street bookbinder',-10,318,{asset:'Bookcase_2',person:'Renata'}),
 spot('musician','Paolo\'s street music lesson',10,147,{asset:'Bench',person:'Paolo'}),
 spot('innsong','The Copper Cat songbook',101,181,{room:'inn',asset:'BookGroup_Medium_1'}),
 spot('mix','Ada\'s working recipe bench',23,57,{room:'apothecary',asset:'Cauldron'}),
 spot('sage','Sage at the courtyard edge',-14,76,{asset:'Pot_1'}),
 spot('honey','A sealed honey jar',14,99,{asset:'Pot_1'}),
 spot('water','Fresh water by the mechanism',8,183,{asset:'Pot_1'}),
 spot('bench','The workshop calibration bench',-22,27,{room:'workshop',asset:'Whetstone'}),
 spot('lost','A ribbon on a garden post',-12,112,{asset:'Scroll_1'}),
 spot('painter','Isabella\'s open-air exhibition',14,196,{asset:'BookStand'}),
 spot('books','Neri\'s book-restoration table',-22,20,{room:'workshop',asset:'Workbench'}),
 spot('cellar-sign','Old makers\' marks',-23,21,{inside:'workshop',asset:'Scroll_1'}),
 spot('inn-sign','The vanished tavern verse',102,182,{inside:'inn',asset:'Scroll_1'}),
 spot('archive-sign','The river archivist\'s seal',87,359,{asset:'Scroll_1'}),
 spot('smithwork','Bartolo\'s fitting station',-22,212,{room:'smith',asset:'Anvil_Log'}),
 spot('garden-work','The neglected garden bench',10,447,{garden:true,asset:'Bench'}),
 spot('lenswork','Sofia\'s alignment bench',23,493,{room:'observatory',garden:true,asset:'Workbench'}),
 spot('outing','A quiet garden conversation',17,468,{garden:true,asset:'Bench'}),
 spot('view','The cypress overlook',-10,526,{garden:true,asset:'Bench'}),
 spot('catcare','Nero\'s water bowl',-13,39,{asset:'Pot_1'}),
 spot('peddler','Vittoria\'s paper-and-ink stall',-11,157,{asset:'Stall_Empty',person:'Vittoria'}),
 spot('deliveryhall','The hall\'s receiving desk',-102,175,{room:'hall',asset:'Table_Large'})
];
const job=(id,title,kind,sites,description,extra={})=>({id,title,kind,sites,description,xp:35,coins:18,...extra});
export const STREET_JOBS=[
 job('cart','A Wheel out of True','sequence',['cart'],'Tomas cannot reach the market. Brace the cart, align the axle, then fit the wheel.',{options:['brace','axle','wheel'],answer:['brace','axle','wheel'],result:'Tomas has repaired the wheel and set the market stall upright.'}),
 job('bell','The Bell before Supper','sequence',['bell'],'A simple bell mechanism: release the brake, seat the gear, then tension the cord.',{options:['cord','brake','gear'],answer:['brake','gear','cord'],result:'The crossing bell turns again. Its lantern is lit.'}),
 job('cider','Save the Cider','sequence',['barrels'],'Do not hammer a leaking cask. Seat the bung, tighten the hoop, then turn the tap.',{options:['tap','hoop','bung'],answer:['bung','hoop','tap'],result:'The sealed barrel joins Beatrice\'s next delivery.'}),
 job('dinner','Enough for Everyone','gather',['cook','apples','carrots','basket','cook'],'Three things lie around the market lanes. Collect the produce and basket, then return to Emilia.',{xp:60,coins:28,result:'Emilia has laid the community table; the scattered crates are collected.'}),
 job('seal','The Misread Receipt','investigation',['clerk','receipt','witness','clerk'],'Agostino suspects a thief. Read the receipt and hear Renata before choosing what to report.',{options:['accuse the apprentice','report the wrong address','say nothing'],answer:['report the wrong address'],clues:{receipt:'The receipt reads WESTERN hall, but the crate was unloaded on EASTERN street.',witness:'Renata saw the apprentice returning an unopened crate after noticing the address.'},xp:60,result:'Agostino corrects the address and withdraws the accusation. No one is arrested.'}),
 job('tune','Notes through the Market','melody',['musician'],'Paolo offers a short lesson. Listen, or read the accessible note sequence, then play it back.',{options:['C','E','G'],answer:['C','E','G','E','C'],result:'Paolo remembers your duet; its written refrain remains in your Field Notes.'}),
 job('innmusic','The Copper Cat Refrain','melody',['innsong'],'A different song survives in the inn\'s songbook: G, E, C, E, G.',{options:['C','E','G'],answer:['G','E','C','E','G'],result:'The restored refrain is written into Beatrice\'s songbook.'}),
 job('tonic','A Useful Cup of Kindness','recipe',['mix','sage','honey','water','mix'],'Ada leaves a recipe: water first, then sage, finish with honey. Gather the ingredients, then prepare a tonic.',{options:['sage','water','honey'],answer:['water','sage','honey'],xp:60,result:'You prepare a tonic and restore your vitality. The recipe remains in your Field Notes.'}),
 job('bowl','Water for Nero','delivery',['catcare','water','catcare'],'Nero\'s bowl is dry. Bring fresh water from the market mechanism.',{result:'Nero has fresh water. His bowl stays filled.'}),
 job('ribbon','The Painter\'s Ribbon','delivery',['painter','lost','painter'],'Isabella lost a ribbon while looking for a painting spot. Look along the western frontage.',{result:'The ribbon is tied around Isabella\'s restored display.'}),
 job('calibrate','Three Gears, One Line','sequence',['bench'],'Leonardo\'s fixed bench diagram shows: large gear, small gear, then the locking pin.',{options:['pin','small gear','large gear'],answer:['large gear','small gear','pin'],result:'The calibration marks line up. The workshop bench now shows its completed diagram.'}),
 job('binding','A Book Worth Keeping','sequence',['books'],'Restore a damaged booklet without losing its pages: sort, stitch, then press.',{options:['press','sort','stitch'],answer:['sort','stitch','press'],result:'The worn volume is bound and returned to Neri\'s shelves.'}),
 job('marks','Names beneath the Workshop','lantern',['cellar-sign'],'Cast Lantern beside the old maker\'s marks, then copy the revealed inscription.',{requires:'lantern',result:'You copied the names of three forgotten workshop apprentices.'}),
 job('verse','Ink beneath the Inn','lantern',['inn-sign'],'The inn cellar holds more than the receipts. Use Lantern to recover a lost tavern verse.',{requires:'lantern',result:'The copied verse is kept in your Field Notes.'}),
 job('river','The River\'s Old Name','lantern',['archive-sign'],'Hidden ink near the archive records a place name older than the current road.',{requires:'lantern',result:'The old river crossing is added to your notes; the archive seal glows briefly.'}),
 job('courierwest','The Clerk\'s Cross-Town Packet','delivery',['clerk','deliveryhall','clerk'],'Carry a separate guild packet into the mayor\'s hall and return for payment. Ordinary letter inventory is not used.',{xp:50,coins:30,result:'The western hall has its corrected packet.'}),
 job('courierink','Paper for the Apothecary','delivery',['peddler','mix','peddler'],'Vittoria has paper for Ada\'s recipe book. Deliver it inside the apothecary.',{xp:50,coins:30,result:'Vittoria has paid for the completed shop delivery.'}),
 job('fitting','A Better Fit','sequence',['smithwork'],'Fit a cycle for its rider: measure the reach, align the saddle, then test the pedals.',{options:['pedals','reach','saddle'],answer:['reach','saddle','pedals'],result:'Bartolo has a recorded fitting for you. No hidden change to the steering controls.'}),
 job('gardenbench','A Place to Rest','sequence',['garden-work'],'Restore the garden seat: clean the wood, tighten the legs, then oil the boards.',{options:['oil','legs','clean'],answer:['clean','legs','oil'],result:'The garden bench has been restored and its nearby lantern lights.'}),
 job('lens','The Steady Lens','sequence',['lenswork'],'Sofia\'s workbench marks the order: base, horizon, focus. A steady instrument is better than a rushed guess.',{options:['focus','base','horizon'],answer:['base','horizon','focus'],result:'Sofia\'s instrument is aligned and the workbench is marked complete.'}),
 job('exhibition','A Small Exhibition','palette',['painter'],'After helping Isabella find her pigments, choose a palette for an outdoor display. Neither choice is wrong.',{requires:'pigments',options:['warm terracotta','cool river blue','olive and gold'],xp:50,result:'Your chosen colours appear on the exhibition panel.'}),
 job('walk','An Evening without an Errand','outing',['outing','view','outing'],'For an existing partner: agree on an outing, visit the overlook, and return to share what you noticed. Friendship can remain enough.',{requires:'partner',xp:40,coins:0,result:'The shared outing is remembered. No affection was bought and no old mission depended on it.'})
];
export const STREET_MAP=new Map(STREET_SITES.map(s=>[s.id,s]));
export const JOB_MAP=new Map(STREET_JOBS.map(j=>[j.id,j]));
