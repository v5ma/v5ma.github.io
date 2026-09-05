"use strict";
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const E=require("./engine.js"),D=require("./data.js");
const fixtures=JSON.parse(fs.readFileSync(path.join(__dirname,"parity-fixtures.json"),"utf8"));
let maxError=0;
for(const f of fixtures){
  const r=E.inspect(D.models[f.seed],f.world,f.unit,f.donor,f.route);
  const error=Math.max(Math.abs(r.before-f.before),Math.abs(r.after-f.after));
  assert(error<1e-10);assert.equal(r.allowed,f.allowed);
  if(f.route==="same_route")assert(Math.abs(r.effect)<1e-10);
  maxError=Math.max(maxError,error);
}
assert(E.mayCommit({revision:0,allowed:["A"]},{revision:0,object:"A",delegated:["A"]}));
assert(!E.mayCommit({revision:1,allowed:["A"]},{revision:0,object:"A",delegated:["A"]}));
assert(!E.mayCommit({revision:1,allowed:["B"]},{revision:1,object:"A",delegated:["A"]}));
const result={execution:"PASS",python_parity_cases:fixtures.length,max_absolute_logit_error:maxError,authority_cases:3,browser_visual_and_interaction_test:"NOT_PERFORMED",scope:"Numerical engine parity, not browser or security deployment proof."};
const destination=path.join(__dirname,"ENGINE-TEST-RECEIPT.json");
assert(!fs.existsSync(destination));
fs.writeFileSync(destination,JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result,null,2));
