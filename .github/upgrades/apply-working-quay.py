"""One-time, hash-guarded integration of the locally reviewed Working Quay.
Only game source and the matching public design note may be written.
No credentials, user save data, workflow files or sibling games are generated.
"""
import hashlib, json, pathlib, subprocess
root=pathlib.Path('svgn-planet')
edits=json.loads(pathlib.Path('.github/upgrades/working-quay.json').read_text())
prepared={}
for name,item in edits.items():
    assert name.startswith('svgn-planet/') and '..' not in pathlib.Path(name).parts
    path=pathlib.Path(name);raw=path.read_bytes();digest=hashlib.sha256(raw).hexdigest()
    if digest==item['after']:continue
    assert digest==item['before'],f'Unreviewed source: {name}'
    lines=raw.decode().splitlines(keepends=True)
    for patch in reversed(item['patches']):lines[patch['start']:patch['end']]=patch['lines']
    changed=''.join(lines).encode()
    assert hashlib.sha256(changed).hexdigest()==item['after'],f'Transfer mismatch: {name}'
    prepared[path]=changed
for path,raw in prepared.items():path.write_bytes(raw)
release=json.loads((root/'release.json').read_text())
if release['version']=='0.12.0':
    note='''# Working Quay / Lantern Ward v0.12.1

## Experience and bounded hypothesis

Learn to operate a working neighborhood on a bicycle. At the north quay the rider can observe loading, request a pass, continue around the north shoulder, or use the existing roof/canal approaches. One hypothesis: a local, visible and dependable loading routine makes route knowledge useful without making the bell a remote cheat or imposing a compulsory wait. Primary observation: compare distance, simulation time and blocked movement for an unsignaled street crossing, a signaled crossing and the marked north loop under a naturally recurring loading phase.

## Reconciliation

Reviewed master 78dad9840163bbacb7308118cde44a1bb4f525f6, game tree 88c36d08f1236e550be9ceb20927824604c3b092. The existing v0.12.0 already has three real approaches, the blue-door return, a moving hoist, reversible water, separate saves and native first-person/diorama XR. None is recreated. The weak relationship addressed here was the globally effective bell and a porter whose yielding changed position instantly. Work belongs to existing LEVEL-01, not a new neighborhood or replacement roadmap.

Read the five requested shared library documents. Library tree: 65285b05cf03de732c7c227f372131ce3603fcfc. The game-specific brief is the Neighborhood Missions section of GAME-RECOMMENDATIONS.md. Separate genre handbooks mentioned by AGENTS.md are not present in this public tree. The supplied place-mastery source's connection, opportunity and operation distinction informs this iteration. Reference principles are adapted to peaceful courier circulation, not copied combat or franchise content.

## Five linked descriptions

Physical: the same existing north quay now has a visible crate cart with a matching collision footprint and an approaching porter. Painted crossbars identify the street decision. A marked north shoulder uses already walkable ground; no floor, wall, roof, stair or canal extent changes. Existing roof observation has a real sightline to loading.

Conditional: loading lasts 5 seconds before a continuous 2.5 m/s withdrawal into the bay; the clear stop recurs. A local request holds the clear opportunity for 8 seconds. The long loop does not depend on the phase. Roof and canal avoid this crossing but retain their original walking/docking/water-state demands.

Behavioral: Ivo loads, withdraws, waits and returns. L3/L bell or X at either approach requests the same pass within 9 metres and a real line of sight. A cart about to return into the courier withdraws again. There is no remote teleport, hostility, hidden deadline, damage or forced dismount.

Information: the cart itself, approach crossbars, a labeled bay, a marked north loop and changing word-and-color signals explain the condition locally. The upper route previews it. The interaction cue offers a viable alternative instead of merely saying blocked. Text states distinguish loading, pulling north and clear.

Embodiment: existing .3-metre courier collision radius, acceleration, braking, jump, reach and direct mappings are preserved. A bicycle stays mounted through either street choice. New scenery is in the same scene group as gameplay and is rendered in desktop, first-person and per-eye diorama views. Cutaways and scale never affect collision. Static markings are batched; only the bounded cart, porter and two signals change.

## Mistakes and recovery

Riding into loading stops against visible geometry but does not lose the parcel. Waiting, signaling or reversing into the north loop remain possible. A returning cart yields instead of crushing the courier. If an old layout-1 save resumes inside the new loading stop, initialize the cart in its bay; never relocate the player or rewrite progress. Both signal posts support X, so hands and tracked controllers need no new bell menu. Every request remains repeatable. There is no new reward to farm.

## Save and scope contract

Keep svgn.lantern-ward.v1, lantern-ward-01, layout 1 and the original 600-credit idempotent ledger. Routines and comparison counters are transient and excluded from serialization. No original-neighborhood key is written. All 102 legacy-layout.json hashes must remain unchanged. No user-authored content, private content, dependency, license or sibling game is changed.

## Evidence and failures

Local Node acceptance: all 208 retained tests and 12 new tests passed. Unit fixtures for occupied lanes and saved overlap are explicitly model fixtures; route helpers use actual tick/input rather than actor assignment. The first run exposed a stopped-actor/courtesy-radius deadlock (six original route tests failed). Allowing motion away resolved five; reversing an occupied returning cart resolved the last. The retained route assertions were not weakened. Local browser navigation was denied by the environment (ERR_BLOCKED_BY_ADMINISTRATOR), not recorded as a game pass. CI must exercise the actual renderer, original nine browser suites and new input-only comparison plus controller/hand XR interactions before merge. Publication is a separate live run, not inferred from CI.

At this integration checkpoint browser and public results remain pending. Store the exact accepted source, route metrics, errors and revealing failures in production/evidence/working-quay-0.12.1/ and release/PR evidence. Synthetic inputs do not certify physical Xbox, Quest, hand tracking, comfort, performance or human comprehension.

## Human gate and next opportunity

Without coaching, ask a first-time rider what the cart is doing, how to request a pass, where a wrong turn can recover, and why they chose their approach. On return, observe whether they anticipate loading or deliberately avoid it. Test both viewing heights and all opening settings on a real Quest. Review sign visibility, bicycle braking, camera intersections and whether the loop feels useful rather than compulsory. Do not add another map or infer enjoyment from fast completion. Next opportunity: give the existing elevated observation route more useful narrative information without mandatory repeat interactions.

## Rollback

Revert only the Working Quay runtime/code changes with a new scoped commit; never reset shared master. Layout and serialization are unchanged, so old and new chapter saves remain readable. Keep all historical evidence. Re-run the retained tests and separately verify the public result.
'''
    (root/'lantern/WORKING-QUAY.md').write_text(note)
    release.update(version='0.12.1',edition='Lantern Ward: Working Quay',date='2026-09-15',acceptance='Integrated candidate; 220 local model tests passed. Browser, publication and human/device acceptance must be recorded separately.',foundationEvidence=release['evidence'],evidence='production/evidence/working-quay-0.12.1/candidate.json')
    release['changes']=['Local visible loading crossing and continuous porter/cart routine','Signal while riding, wait for loading, or use the marked existing north loop','Occupied-lane recovery, saved-actor-safe cart initialization and unchanged reward ledger']
    release['validation']={'unitTestsPassedLocally':220,'browserTestsPassed':False,'publicResultVerified':False,'physicalQuest3Tested':False,'physicalXboxTested':False,'humanLevelApproval':False}
    for key in ['testedCommit','acceptanceRun','publicationRun','pagesDeploymentRun']:release.pop(key,None)
    (root/'release.json').write_text(json.dumps(release,indent=2)+'\n')
    evidence=root/'production/evidence/working-quay-0.12.1';evidence.mkdir(parents=True,exist_ok=True)
    (evidence/'candidate.json').write_text(json.dumps({'version':'0.12.1','baseCommit':'78dad9840163bbacb7308118cde44a1bb4f525f6','roadmapTask':'LEVEL-01','localModelTestsPassed':220,'browserAcceptance':'pending','publicAcceptance':'pending','physicalDeviceTested':False,'humanComprehensionTested':False,'review':'../../../lantern/WORKING-QUAY.md','runtimeFileSHA256':{name:item['after'] for name,item in edits.items()}},indent=2)+'\n')
    data=json.loads((root/'production/roadmap.json').read_text());data.update(version='0.12.1',edition=release['edition'],reviewed='2026-09-15',releaseEvidence='evidence/working-quay-0.12.1/candidate.json')
    item=next(i for i in data['items'] if i['id']=='LEVEL-01')
    item['next']='Working Quay candidate: measure wait/signal/north-loop bicycle routes with real input, retain roof/canal/hoist/save and XR regressions, then verify public bytes. Human first-visit and replay comprehension remains open.'
    item['lastReviewed']='2026-09-15';item['evidence']+=['../lantern/WORKING-QUAY.md','evidence/working-quay-0.12.1/candidate.json']
    (root/'production/roadmap.json').write_text(json.dumps(data,indent=2)+'\n')
    subprocess.run(['python','svgn-planet/production/render-roadmap.py'],check=True)
    p=root/'DEVELOPMENT-HANDOFF.md';p.write_text('# Working Quay v0.12.1 candidate\n\nRead lantern/WORKING-QUAY.md and release.json first. LEVEL-01 now includes a local loading crossing, continuous cart routine and useful north-loop recovery on existing geography. All 220 local model tests pass; CI browser and separate public checks remain required. Save keys, layout 1, rewards, controls and the 102-file legacy layout remain unchanged. Physical devices and human comprehension remain open. Do not treat historical v0.12.0 acceptance below as new-release acceptance.\n\n'+p.read_text())
    library=pathlib.Path('level-design-library');applied=library/'applied';applied.mkdir(exist_ok=True)
    (applied/'NEIGHBORHOOD-MISSIONS-WORKING-QUAY.md').write_text('# Neighborhood Missions: Working Quay application\n\nMapped to LEVEL-01 in svgn-planet/production/roadmap.json. Source baseline 78dad9840163bbacb7308118cde44a1bb4f525f6. The earlier Lantern Ward streets, roof, canal, water, hoist and native XR already exist; this work deepens a routine instead of rebuilding those features or expanding the map.\n\nOne local loading crossing creates a short cooperative bicycle approach and a longer timing-independent north loop. The old global bell is replaced by an in-sight request, continuous movement and occupied-lane recovery. The test compares actual distance, simulated travel time and blocked movement, while retaining save/reward and original route checks.\n\nRead ../../svgn-planet/lantern/WORKING-QUAY.md for the five descriptions, failed tests, recovery and review. Evidence: ../../svgn-planet/production/evidence/working-quay-0.12.1/. This is an integrated candidate with 220 local model tests, not yet browser/live/human/device approved. Do not transfer measured timings to another engine or label this a universal quality score.\n')
    p=library/'GAME-RECOMMENDATIONS.md';text=p.read_text();anchor='## Neighborhood Missions\n';assert text.count(anchor)==1
    text=text.replace(anchor,anchor+'\nApplied iteration: [Working Quay](applied/NEIGHBORHOOD-MISSIONS-WORKING-QUAY.md) develops the existing Lantern Ward loading routine under LEVEL-01. Check its exact-source evidence before treating it as accepted; this does not replace the recommendations below.\n',1);p.write_text(text)
else:assert release['version']=='0.12.1'
legacy=json.loads((root/'legacy-layout.json').read_text())
for row in legacy['files']:assert hashlib.sha256((root/row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
print('Reviewed runtime patch and all',len(legacy['files']),'legacy hashes verified.')
