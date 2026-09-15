"""One-time source integration only. Native tests check out its ordinary commit.
Never run this over later source edits or replace a whole repository tree.
"""
from pathlib import Path
import hashlib,json,os,subprocess
GAME=Path(__file__).resolve().parents[1];ROOT=GAME.parent
MARKER=GAME/'GROUNDED-INTEGRATED.json'
if MARKER.exists():
 print('Already integrated; maintain ordinary committed source.');raise SystemExit(0)
if os.environ.get('GITHUB_REF_NAME')!='guild/grounded-actions-20260914':
 raise SystemExit('This one-time recipe is restricted to its feature branch.')
spec=json.loads((GAME/'scripts/grounded-edits.json').read_text())
prepared={}
for name,record in spec.items():
 path=ROOT/name
 if not path.resolve().is_relative_to(GAME.resolve()) or not path.is_file():raise SystemExit('Unexpected integration path: '+name)
 before=path.read_text()
 if hashlib.sha256(before.encode()).hexdigest()!=record['before']:raise SystemExit('Changed baseline, refusing to overwrite: '+name)
 after=before
 for start,end,text in reversed(record['edits']):after=after[:start]+text+after[end:]
 if hashlib.sha256(after.encode()).hexdigest()!=record['after']:raise SystemExit('Output hash mismatch: '+name)
 prepared[path]=after
for path,text in prepared.items():path.write_text(text)
intro='''# Grounded Actions v0.13.0 continuation - September 14, 2026

Read GROUNDED-ACTIONS.md and current release.json before the historical checkpoint below. The owner's latest feedback prioritizes direct frequent actions, realistic proportions/stance contacts and Xbox plus Quest controller/hand UI. Console LB now taps to the previous tool and holds for the full wheel. The original characters have revised proportions and transient two-bone stance IK. Optional seated WebXR theatre uses the same game, saves and camera with tracked controller rays and hand-pinch UI; it is NOT room-scale first-person gameplay or stereo world rendering.

This slice advances NEXT01 feedback, NEXT02 input hardening and C01/C02/F03. It does not close owner playtesting, physical Quest/Xbox, performance/comfort, all animation, or the later NEXT03 second-basin task. The release PR's exact-source CI artifacts and the independent publication receipt establish deployment status; do not infer publication merely from this source note. Preserve the same v2 save namespace, quiet one-stream audio and sibling projects. The earlier v0.12 checkpoint remains historical evidence, not the latest runtime identifier. Never rerun historical prepare/integrate scripts over current source.

'''
for name in ['AGENTS.md','NEXT-SESSION.md','AAA-ROADMAP.md','UPGRADE-CHECKLIST.md','README.md','PUBLICATION.md']:
 path=GAME/name
 if path.exists():path.write_text(intro+path.read_text())
path=GAME/'CONTINUATION-STATE.json'
if path.exists():
 value=json.loads(path.read_text());value['previous_release_checkpoint']=value.get('release')
 value['recorded_on']='2026-09-14';value['purpose']='Grounded Actions continuation, with earlier verified release evidence preserved as history.';value['runtime_changes_in_this_handoff']=True
 value['release']={'version':'0.13.0','name':'Grounded Actions','build':'guild-grounded-20260914','verification_record':'Exact-source release PR artifacts and independent publication receipt; see PUBLICATION.md','game_url':'https://v5ma.github.io/leonardos-guild/','card_label':"Leonardo's Guild"}
 value['start_here']='GROUNDED-ACTIONS.md'
 value.setdefault('owner_requirements',{}).update({'frequent_actions_on_direct_buttons':True,'quest3_controller_and_hand_ui':True})
 value['not_implemented']=[s.replace('Finished professional animation and full foot IK','Professional retargeted animation, terrain-normal sole tilt and toe/heel articulation') for s in value.get('not_implemented',[])]
 value['xr_scope']={'mode':'optional seated theatre','controller_tracking':True,'hand_pointer_ui':True,'room_scale_first_person':False,'physical_quest3_verified':False}
 value['current_slice']={'roadmap':['NEXT01-feedback','NEXT02','C01','C02','F03'],'document':'GROUNDED-ACTIONS.md','save_migration':False,'owner_hardware_signoff':False}
 path.write_text(json.dumps(value,indent=2)+'\n')
path=GAME/'CHANGELOG.md'
path.write_text('''# Grounded Actions v0.13.0

Console LB tap-to-last-tool with retained hold wheel; adjusted original humanoid proportions; analytic leg IK and transient world-space stance contacts; optional seated WebXR theatre with tracked controllers and hand-pinch UI. Existing world, missions, saves, quiet audio and Classic/touch/keyboard remain. See GROUNDED-ACTIONS.md for exact controls, limits and evidence requirements. Hardware certification is not implied.

'''+path.read_text())
MARKER.write_text(json.dumps({'version':'0.13.0','build':'guild-grounded-20260914','baseline_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'patched_files':{n:r['after'] for n,r in spec.items()},'rule':'Ordinary committed modules are tested after integration; this recipe is never a test-time rewriter.'},indent=2)+'\n')
print('Integrated',len(prepared),'hash-checked runtime/test/release files and preserved current handoff history.')
