'use strict';
// These regression anchors supplement the independently reviewed claim ledger.
// Their presence is not a claim that phrase matching proves semantic equivalence.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const body=fs.readFileSync(path.join(__dirname,'../editorial/authorial-articles/jesus-teacher-of-righteousness-hypothesis.md'),'utf8');
const cases=[
 ['Author assessment remains a report of examined evidence',['In the historical evidence I have examined so far','in each attempted refutation I examined I found flaws or gaps']],
 ['Collection scope permits competing proposals without making them all personal belief',['sometimes competing proposals','does not make every article a statement of personal belief']],
 ['The implications remain meaningful and conditional',['If the personal identification proved correct','Readers and religious communities may understand its theological consequences differently']],
 ['Compressed chronology rationale remains together with its dating limitation',['short sequence I was then using','minimum time needed for all those developments']],
 ['Betrayal and memory reconstruction retain their mechanism and uncertainty',['Pharisees facing persecution might have disclosed','filling gaps in an inherited oral account','does not establish that this betrayal occurred']],
 ['Distinct Christus is a separate reply with its own evidential burden',['distinct-Christus branch','evidence of two people or memory streams']],
 ['James and Paul reception preserve the proposed branch without universalizing it',['communities associated with James retain a Zadokite inheritance','Paul adapts what he has learned','neither a uniform Gnostic response to Paul']],
 ['Functional comparison keeps its positive rationale without treating AI scores as measurement',['distinctive organization even when later writers change their words','coherent pattern could favor a connected inheritance','AI-generated scores do not establish a numerical result']],
 ['Ezra example retains the proposed transformation and its dating limit',['anger I read in writings associated with Ezra','does not independently date a Gnostic work']],
 ['Kinship objection and the proposed reply remain together',["James as the Lord's brother",'later namesakes or descendants','an explanation of the kinship language']],
 ['Living witness objection and the proposed reply remain together',['many among the group of more than five hundred remain alive','later revelatory experiences, reuse of names or later textual shaping']],
 ['Identity, transmission and shared milieu remain distinct alternatives',['identity model proposes one historical individual','transmission model proposes','shared-milieu model proposes']],
 ['The corrected chronological calculation remains inspectable',['124-137 years','therefore 88 + 37 - 1 = 124 years']],
 ['Founder, early James and later generations retain different roles',["Teacher's brother James is proposed as an early successor",'Peter and James encountered by Paul belong to later generations']],
 ['Archived source reconstruction does not masquerade as independent ancient corroboration',['original public source files and their attribution remain unchanged','not independent corroboration of its ancient identifications']]
];
for(const [name,phrases]of cases)test(name,()=>{for(const phrase of phrases)assert(body.includes(phrase),phrase);});
test('The rejected immunity framing is absent',()=>{assert(!body.includes('immune to refutation'));});
for(const passage of require('./restored-passages.json'))test('Reviewed source rationale remains intact: '+passage.id,()=>{
 assert(body.includes(passage.prose),'Missing or materially altered reviewed rationale; revisit its claim-ledger row before changing the test');
 assert(passage.prose.includes(passage.source),'Restored rationale must retain its exact source-version link');
});
