from pathlib import Path

def prepend(path,text,expected):
 p=Path(path);s=p.read_text()
 if s.startswith(text):return
 assert s.startswith(expected),path
 p.write_text(text+s)

prepend('vesperfall/DEVELOPMENT-HANDOFF.md', '''Returning Bell implementation / version 0.14.0 / September 15, 2026.

Read RETURNING-BELL.md and the latest publication receipt first. The approved reset is now integrated as the default authored opening, not merely an optional demonstration. Its court/gallery/ambulatory/tower/service-return routes, reversible collision-backed screens, inside-only permanent expedition gate and signal/return outcome use the existing gameplay systems. The new layout identity is returning-bell-1. Keep hollow-dominions-1 and the retained legacy fixture for old saves; never relabel or silently relocate saved geography.

First-person VR shares the full chapter. AR Architect's Table is separate, paused and discovery-limited architectural inspection with controller/hand menu input. Existing stationary Sanctuary remains available. No hand-only archery, room scanning, real surface anchors, furniture occlusion or playable third-person diorama is claimed. Preserve quick Xbox arrows, all established controller roles and safe save/AR restoration.

The canonical 76-task roadmap and six-sheet workbook are synchronized to 0.14.0. All physical and unfamiliar-player gates remain open. After the chapter's single ordinary sector reward, the explicit blessing choice continues into retained Endless content; the next authored chapter is not built. The next priority is observed first/repeat play through the whole place, followed by targeted layout, sound, accessibility and physical-device refinement. Do not resume unrelated room-count expansion. Check actual software/publication artifacts before calling a particular revision live. The design directive and historical handoff below remain preserved as context.

''','Level-design replacement directive')
prepend('vesperfall/README.md', '''The Returning Bell / version 0.14.0.

The default new-player expedition is now the first authored cathedral chapter. Begin The Returning Bell, restore the tower signal by arrow or nearby interaction, then answer it back at the basin refuge. Ground and gallery approaches reconnect; the gallery winch changes cover and firing lanes; the service-side latch opens a real saved return connection. Every incidental defender does not have to die. Read RETURNING-BELL.md for the implementation and remaining limits.

Xbox down D-pad selects Blink; left D-pad cycles usable damage arrows. A/E and the existing Quest bow-hand interaction button operate the mechanisms. First-person VR uses the same chapter. The AR Architect's Table button opens paused, discovery-limited inspection with layers and recentering; controller rays and hand pinches operate its menu. Existing unscored stationary AR Sanctuary remains available. Hand-only combat, room scanning and physical surface anchors are not implemented.

Old saved expeditions reopen their original geometry and progression. The new chapter has its own immutable layout identity. Completion provides one ordinary sector outcome; choosing a blessing explicitly continues into retained Endless mode, not an unbuilt second authored chapter. First Bell, Oath, practice and trials remain accessible. The canonical roadmap.json, roadmap.html and AAA-PRODUCTION.xlsx record the same 0.14.0 production state. This is a playable development slice; human enjoyment, final art/audio and physical Quest/Xbox acceptance remain open. Publication is established by its exact live verification receipt, not this description alone.

The release notes below preserve earlier work and do not override the current Returning Bell contract.

''','# Current release and continuation')
prepend('vesperfall/AAA-ROADMAP.md', '''Returning Bell roadmap / version 0.14.0.

The first authored replacement opening is integrated. V52/V57 and the broader V49/V50/V41/V76 work remain Partial rather than being credited as a finished campaign. The 76 existing task IDs and six-sheet workbook match the canonical roadmap.json. The next milestone is unfamiliar and repeat-player evidence for planning, alternate approaches, mechanism understanding, return recognition and learned agency. Physical Quest/Xbox, seated/standing reach, visual/audio review and sustained performance remain open. Tune this whole chapter before expanding room count or adding another major system. RETURNING-BELL.md records implementation, saved-layout compatibility, native acceptance commands and AR boundaries.

The older milestone notes below remain historical context; their water/audio-first ordering is superseded by the September 15 level-design mandate and current canonical next-release priorities.

''','# Surestep roadmap update')
prepend('vesperfall/LEVEL-DESIGN-RESET.md', '''Implementation note for version 0.14.0.

The Returning Bell and a discovery-limited AR inspection table are now integrated in source. Read RETURNING-BELL.md for the exact implemented scope and a publication receipt for live status. The original brief below is retained as the design basis. Its future patrol systems, completed campaign, physical-device approval and unfamiliar-player findings must not be inferred from the first playable chapter. The canonical roadmap and workbook are now synchronized to the implementation milestone.

''','Vesperfall level-design reset')

def replace(path,old,new):
 p=Path(path);s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(path,old)
 p.write_text(s.replace(old,new))
replace('vesperfall/RETURNING-BELL.md','block a court-to-tower firing line','block a forward-court firing line')
replace('vesperfall/hunt.js',"(room.family||'Cloister')", "(s.chapter?room.label:(room.family||'Cloister'))")
replace('vesperfall/tests/launch.py',"  page.locator('#practice').click();page.wait_for_function('Vesperfall.component.running&&!Vesperfall.component.paused')", "  check(page.locator('#expedition-mode').input_value()=='returning-bell' and page.evaluate('Vesperfall.state.world.returningBell'),'A fresh homepage launch defaults to the authored Returning Bell chapter')\n  page.locator('#start').click();page.wait_for_function('Vesperfall.component.running&&!Vesperfall.component.paused')")
# Remove only the temporary transports and write-enabled staging workflows.
for name in ['.github/vesper-returning-apply.py','.github/vesper-meta-apply.py','.github/vesper-meta-refine.py','.github/vesper-docs-apply.py','.github/workflows/vesperfall-returning-metadata.yml','.github/workflows/vesperfall-returning-docs.yml']:
 Path(name).unlink(missing_ok=True)
