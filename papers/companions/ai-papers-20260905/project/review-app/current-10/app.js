"use strict";
const $ = id => document.getElementById(id);
const label = arm => EVIDENCE.arms[arm].label;
function element(tag, value, className) {
  const el = document.createElement(tag); if(value !== undefined) el.textContent = value;
  if(className) el.className = className; return el;
}
function link(path, text) {const a=element("a",text);a.href=path;return a;}
function modelCard(){
  const m=EVIDENCE.models[$("model").value], card=$("model-card");card.replaceChildren();
  card.append(element("span",m.status,"badge"+(m.tested?"":" mapped")),element("h3",m.name),element("p",m.mapping),element("p",m.evidence),element("p",m.boundary));
  if(m.checkpoint)card.append(element("p",m.checkpoint,"checkpoint"));
  const p=element("p");p.append(link(m.source,"Primary architecture source"),document.createTextNode(" · "),link(m.local,"Local methods/evidence"));card.append(p);
}
function studyTable(){
  const s=EVIDENCE.studies[$("study").value];$("study-note").textContent=s.note;
  $("metrics-caption").textContent=s.title;
  const body=$("metrics").tBodies[0];body.replaceChildren();
  for(const row of s.rows){const tr=element("tr"),th=element("th",label(row.arm));th.scope="row";tr.append(th);for(const [k,title] of [["giver","Giver /16"],["recipient","Recipient /16"],["color","Color /16"],["groups","Complete groups /8"]]){const td=element("td",String(row[k]));td.dataset.label=title;tr.append(td);}body.append(tr);}
}
function caseTable(){
  const c=EVIDENCE.cases[Number($("case").value)],arm=$("arm").value,answers=c.answers.filter(a=>a.arm===arm);
  $("case-story").textContent=c.story;$("arm-note").textContent=EVIDENCE.arms[arm].note;
  const body=$("answers").tBodies[0];body.replaceChildren();
  for(const a of answers){const tr=element("tr"),th=element("th",a.query);th.scope="row";tr.append(th,element("td",a.expected),element("td",a.answer),element("td",a.correct?"Yes":"No",a.correct?"pass":"fail"));body.append(tr);}
  const roles=answers.filter(a=>a.query!=="color"),same=roles[0].answer.trim().toLowerCase()===roles[1].answer.trim().toLowerCase();
  const correct=answers.filter(a=>a.correct).length;
  $("case-verdict").textContent=correct+"/3 answers correct for this requested reversal. "+(same?"Same-name role collapse: both role answers name the same person.":correct===3?"Both roles and the color are correct in this saved condition.":"A complete corrected relationship was not demonstrated in this condition.");
  $("case-source").replaceChildren(link("../../"+c.source,"Exact saved answers and token/logit hashes"));
}
for(const [i,c] of EVIDENCE.cases.entries()){const o=element("option",(i+1)+". "+c.story);o.value=String(i);$("case").append(o);}
for(const arm of EVIDENCE.studies.learned.rows.map(r=>r.arm)){const o=element("option",label(arm));o.value=arm;$("arm").append(o);}
$("arm").value="linear_ridge";
$("model").onchange=modelCard;$("study").onchange=studyTable;$("case").onchange=caseTable;$("arm").onchange=caseTable;
let current,proposal,trace;
function log(message){trace.push(message);trace=trace.slice(-12);$("trace").textContent=trace.join("\n");$("authority-status").textContent="Revision: "+current.revision+" · Allowed: "+(current.allowed.join(", ")||"none")+"\nProposal: "+(proposal?proposal.object+" at revision "+proposal.revision:"none")+"\n"+message;}
function reset(){current={revision:0,allowed:["A"]};proposal=null;trace=[];$("allow").value="A";$("object").value="A";log("Initial fixture permits A.");}
$("update").onclick=()=>{current={revision:current.revision+1,allowed:$("allow").value==="none"?[]:[$("allow").value]};log("Trusted scope update; prior proposals are now stale.");};
$("prepare").onclick=()=>{proposal={revision:current.revision,object:$("object").value,delegated:current.allowed.slice()};log("Prepared a virtual proposal.");};
$("commit").onclick=()=>log(SANLab.mayCommit(current,proposal)?"ACCEPTED virtual action. No real export occurs.":"REJECTED: missing proposal, stale revision or insufficient scope.");
$("untrusted").onclick=()=>log("Untrusted text is content only; authority unchanged.");$("reset").onclick=reset;
$("verification-counts").textContent=EVIDENCE.verification.application_tests+" previously passing application tests; "+EVIDENCE.verification.lean_statements+" existing Lean statements under their recorded assumptions. Study 10 reconstructed "+EVIDENCE.verification.reconstructed_answers+" saved native answers through separate code. Same-agent reconstruction is not independent review. No model experiment or Lean compilation runs in this viewer.";
modelCard();studyTable();caseTable();reset();
