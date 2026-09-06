'use strict';
const fs=require('node:fs'),path=require('node:path'),data=require('./atlas.json');
const make=(slug,title,summary,sourceIds,refs)=>({slug,title,summary,sourceIds,externalSources:refs,category:'origins',kind:'Developed article',updated:data.updated,claimType:'Source comparison and attributed alternative reconstruction',attribution:'AI-assisted editorial synthesis and development of Micah Blumberg\'s archived arguments and the current editing discussion. Selected original qualifications and hypothesis versions are preserved. New source comparisons and arithmetic are editorial analysis, not invented author quotations or independent confirmation of the reconstruction.',body:fs.readFileSync(path.join(__dirname,'atlas-articles',slug+'.md'),'utf8')});
const articles=[make('exodus-to-temple-competing-chronologies','From Exodus to Temple: competing chronologies','Read the rival ancient counts, inspect their endpoints, and change explicit anchor assumptions without replacing the earlier-Exodus reconstruction.',['2684','2651'],data.references.filter(r=>!['atlas-cambridge','atlas-eni','atlas-onias','atlas-beni'].includes(r.id)).map(r=>r.id)),make('manuscripts-movements-and-survival','Manuscripts, movements and survival','A work, its surviving copy, successor leadership and a proposed institutional genealogy need connected but different evidence.',['2656','1912'],['atlas-cambridge','atlas-eni','atlas-apion','atlas-onias','thomas-patterson-meyer'])];
const relations=[
 ['moses-volcano-and-exodus-chronology',articles[0].slug,'extends','The interval comparison examines a missing chronological constraint and recovers the author\'s explicit famine-versus-narration qualification.'],
 [articles[0].slug,'jesus-teacher-of-righteousness-hypothesis','compares','Daniel connects deliverance and sanctuary restoration, but its event assignments must not be inferred from numerical proximity alone.'],
 ['tor-thomas-and-gnostic-transmission',articles[1].slug,'extends','The source atlas preserves a proposed institutional reconstruction rather than replacing it with thematic similarity.'],
 [articles[1].slug,'melchizedek-priesthood-and-transmission','uses','The completed first passage comparison is an available component of the larger transmission investigation.'],
 [articles[1].slug,'sacred-inheritance-and-rival-continuations','applies','Textual survival, institutional continuity and moral fidelity are distinct dimensions of an inheritance.'],
 ['source-atlas','museum-trails','organizes','Stable source and challenge IDs can support an XR consumer without duplicating or shortening the full arguments.'],
 ['museum-trails','book-contents','organizes','Trails point to existing chapter routes, not claims that the book or headset experience is complete.'],
 ['argument-challenges','source-atlas','documents','An AI restatement mismatch or invalid inference is documented as an argument outcome, not counted as new archaeological evidence.']
].map(([from,to,type,why])=>({from,to,type,why,origin:'Editorial relationship'}));
const anchors=[
 {from:articles[0].slug,sourceId:'2684',turn:23,why:'The author explicitly distinguishes a non-selective famine from a proposed later firstborn narration.'},
 {from:articles[0].slug,sourceId:'2684',turn:29,why:'The author states the conquest-before-catastrophe order with illustrative dates.'},
 {from:articles[0].slug,sourceId:'2684',turn:46,why:'The author distinguishes an object date from the beginning of the reign.'},
 {from:articles[1].slug,sourceId:'2656',turn:22,why:'The author proposes a split and later reunion of communities, not only thematic resemblance.'},
 {from:articles[1].slug,sourceId:'2656',turn:26,why:'The author proposes succession, descendants and repeated names as a continuity mechanism.'},
 {from:articles[1].slug,sourceId:'1912',turn:1,why:'The author asks for the non-Gnostic Jewish comparison; the turn also contains quoted prior context.'}
];
module.exports={data,version:data.version,references:data.references,articles,relations,anchors};
