"use strict";
// Reuse immutable Python reference fixtures without overwriting their earlier receipt.
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const r=path.resolve(__dirname,".."),E=require(path.join(r,"review-app/engine.js")),D=require(path.join(r,"review-app/data.js"));
const fixtures=JSON.parse(fs.readFileSync(path.join(r,"review-app/parity-fixtures.json"),"utf8"));let maxError=0;
for(const f of fixtures){const a=E.inspect(D.models[f.seed],f.world,f.unit,f.donor,f.route),error=Math.max(Math.abs(a.before-f.before),Math.abs(a.after-f.after));assert(error<1e-10);assert.equal(a.allowed,f.allowed);if(f.route==="same_route")assert(Math.abs(a.effect)<1e-10);maxError=Math.max(maxError,error);}
let cases=0;for(const revision of [0,1])for(const allowed of [[],["A"],["B"]])for(const proposedRevision of [0,1])for(const object of ["A","B","C"])for(const delegated of [[],["A"],["B"]]){assert.equal(E.mayCommit({revision,allowed},{revision:proposedRevision,object,delegated}),revision===proposedRevision&&allowed.includes(object)&&delegated.includes(object));cases++;}
assert.equal(E.mayCommit({revision:0,allowed:["A"]},null),false);cases++;
const result={status:"PASS",date:"2026-09-05",python_reference_cases:fixtures.length,max_absolute_logit_error:maxError,authority_cases:cases,new_model_runs:0,new_lean_statements:0,scope:"Fresh JS evaluation against earlier frozen Python fixtures; not a fresh Python experiment"};
fs.writeFileSync(path.join(r,"reviews/review-app-10/ENGINE-RECEIPT.json"),JSON.stringify(result,null,2)+"\n",{flag:"wx"});console.log(JSON.stringify(result));
