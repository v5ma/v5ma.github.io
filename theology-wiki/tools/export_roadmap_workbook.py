from pathlib import Path
import json
from datetime import datetime
from artifact_tool import Workbook, SpreadsheetFile
ROOT=Path(__file__).resolve().parents[1]
r=json.loads((ROOT/'data/roadmap.json').read_text());coverage=json.loads((ROOT/'data/source-coverage.json').read_text())['rows'];f=json.loads((ROOT/'data/foundations.json').read_text());ev=json.loads((ROOT/'data/melchizedek-evidence.json').read_text())['rows']
wb=Workbook.create()
S={name:wb.worksheets.add(name) for name in ['Overview','Checklist','Dependencies','Chapter Map','Source Coverage','Textual Evidence','Intellectual Debts','Release Gates','Read Me']}
navy='#19364B';teal='#22736F';muted='#EAF1F4';ink='#203543';white='#FFFFFF'
def col(n):
 s=''
 while n:n,d=divmod(n-1,26);s=chr(65+d)+s
 return s
def build_sheet(name,title,note,headers,rows,widths):
 s=S[name];end=col(len(headers));last=len(rows)+6
 s.get_range(f'A1:{end}{last}').format.font={'name':'Aptos','size':10,'color':ink}
 s.get_range(f'A1:{end}1').merge();s.get_range('A1').values=[[title]];s.get_range(f'A1:{end}1').format={'fill':navy,'font':{'bold':True,'size':18,'color':white},'row_height':36}
 s.get_range(f'A2:{end}3').merge();s.get_range('A2').values=[[note]];s.get_range(f'A2:{end}3').format={'wrap_text':True,'fill':muted,'row_height':22,'vertical_alignment':'center'}
 s.get_range(f'A5:{end}5').merge();s.get_range('A5').values=[['Snapshot '+r['updated']+' | '+r['version']+' | Shared plan: theology-wiki/editorial/roadmap.json']];s.get_range(f'A5:{end}5').format={'font':{'size':9,'color':'#516674'},'row_height':20}
 s.get_range(f'A6:{end}6').values=[headers];s.get_range(f'A6:{end}6').format={'fill':teal,'font':{'bold':True,'color':white},'wrap_text':True,'row_height':32}
 if rows:s.get_range(f'A7:{end}{last}').values=rows;s.get_range(f'A7:{end}{last}').format={'wrap_text':True,'vertical_alignment':'top','row_height':64}
 for i,w in enumerate(widths,1):s.get_range(f'{col(i)}1:{col(i)}{last}').format.column_width=w
 s.freeze_panes.freeze_rows(6);s.freeze_panes.freeze_columns(2)
 s.tables.add(f'A6:{end}{last}',True,name.replace(' ','')+'Table')
 return s,last
byid={t['id']:t for t in r['tasks']};phases={p['id']:p['title'] for p in r['phases']};base='https://v5ma.github.io/theology-wiki/san-reader.html?page='
rows=[]
for t in r['tasks']:
 rows.append([t['id'],t['title'],phases[t['phase']],t['priority'],t['status'],t['owner'],'\n'.join(t['dependsOn']),None,t['acceptance'],'\n'.join(t['evidence']),None,'','\n'.join(t['chapters']),base+t['pages'][0],None,None])
s,last=build_sheet('Checklist','Theology | Long-term deliverables','Status, priority, role, target date and personal notes can be edited here. These edits do not write to GitHub. Verified output applies only to the acceptance criterion in that row, not to the truth of an argument.', ['Task ID','Deliverable','Phase','Priority','Status','Responsible role','Prerequisite IDs','Dependency check','Acceptance criterion','Evidence paths / URLs','Target date','Personal notes','Chapter route IDs','Related reader URL','Verified flag','Ready to start'],rows,[25,40,30,12,20,29,26,25,55,50,15,42,29,55,14,16])
s.get_range(f'B7:B{last}').format.font={'bold':True};s.get_range(f'D7:F{last}').format.font={'color':'#2458A0'};s.get_range(f'K7:L{last}').format.font={'color':'#2458A0'}
s.get_range(f'E7:E{last}').data_validation={'rule':{'type':'list','values':r['statuses']}};s.get_range(f'D7:D{last}').data_validation={'rule':{'type':'list','values':['P0','P1','P2']}};s.get_range(f'K7:K{last}').set_number_format('yyyy-mm-dd');s.get_range(f'E7:E{last}').conditional_formats.add_custom('=E7="Verified output"',{'fill':'#DCEFE6','font':{'color':'#23573B'}});s.get_range(f'E7:E{last}').conditional_formats.add_custom('=E7="Blocked"',{'fill':'#FBE4DC'});s.get_range(f'I7:J{last}').format.row_height=94
D=[]
for t in r['tasks']:
 for d in t['dependsOn']:D.append([t['id'],d,byid[d]['title'],None,None,base+'research-roadmap&task='+d])
d,dl=build_sheet('Dependencies','Theology | Dependency edges','Each row is a work-order dependency. It is not a logical entailment between theological claims. Status and satisfaction recalculate from Checklist.', ['Task ID','Prerequisite ID','Prerequisite deliverable','Prerequisite status','Satisfied','Reader URL'],D,[28,28,48,24,15,70])
for i in range(7,dl+1):
 d.get_range(f'D{i}').formulas=[[f'=IFERROR(INDEX(Checklist!$E$7:$E${last},MATCH(B{i},Checklist!$A$7:$A${last},0)),"Unknown ID")']]
 d.get_range(f'E{i}').formulas=[[f'=IF(D{i}="Verified output",1,0)']]
for i in range(7,last+1):
 s.get_range(f'H{i}').formulas=[[f'=IF(COUNTIFS(Dependencies!$A$7:$A${dl},A{i},Dependencies!$D$7:$D${dl},"<>Verified output")=0,"Prerequisites met","Prerequisites open")']]
 s.get_range(f'O{i}').formulas=[[f'=IF(E{i}="Verified output",1,0)']]
 s.get_range(f'P{i}').formulas=[[f'=IF(AND(E{i}="Not started",H{i}="Prerequisites met"),"Ready","")']]
chapter_rows=[]
for c in r['chapters']:chapter_rows.append([c['id'],c['partTitle'],c['title'],c['manuscriptStatus'],'\n'.join(c['pages']),'\n'.join(c['sourceSlugs']),None,'\n'.join(c['taskIds']),'Not reviewed',c['purpose'],base+'book-contents#chapter-'+c['id']])
cs,cl=build_sheet('Chapter Map','Theology | Proposed book sequence','Seventeen routes in five movements are not completed manuscript chapters. Source counts measure recorded references; author approval must be recorded separately.', ['Chapter ID','Book movement','Chapter route','Manuscript state','Article slugs','Referenced source slugs','Source count','Related task IDs','Author review','Purpose and transition','Reader URL'],chapter_rows,[26,38,42,35,44,50,14,35,19,58,60])
for i in range(7,cl+1):cs.get_range(f'G{i}').formulas=[[f'=IF(F{i}="",0,LEN(F{i})-LEN(SUBSTITUTE(F{i},CHAR(10),""))+1)']]
cs.get_range(f'I7:I{cl}').data_validation={'rule':{'type':'list','values':['Not reviewed','Changes requested','Approved wording']}};cs.get_range(f'I7:I{cl}').format.font={'color':'#2458A0'}
rows=[[x['title'],x['sourceFile'],x['exportStartDate'],x['turnCount'],'\n'.join(x['articles']),None,'\n'.join(f'Turn {n}' for n in x['selectedTurns']),None,'\n'.join(x['chapters']),x['coverage'],x['readingStatus'],x['sha256'],x['bytes'],x['sourceURL']] for x in coverage]
ss,sl=build_sheet('Source Coverage','Theology | Every preserved conversation',r['coveragePolicy']+' Export-start date is not a date assigned to every later turn.', ['Conversation','Original filename','Export-start date','Top-level turns','Article slugs','Article-link count','Selected turn numbers','Anchor count','Chapter IDs','Recorded coverage','Reading status','SHA-256','Original bytes','Reader URL'],rows,[40,50,19,17,43,18,23,15,32,42,20,68,16,65])
for i in range(7,sl+1):
 ss.get_range(f'F{i}').formulas=[[f'=IF(E{i}="",0,LEN(E{i})-LEN(SUBSTITUTE(E{i},CHAR(10),""))+1)']]
 ss.get_range(f'H{i}').formulas=[[f'=IF(G{i}="",0,LEN(G{i}&"")-LEN(SUBSTITUTE(G{i}&"",CHAR(10),""))+1)']]
ss.get_range(f'M7:M{sl}').set_number_format('#,##0');ss.get_range(f'L7:L{sl}').format.font={'name':'Consolas','size':9};ss.get_range(f'A7:N{sl}').format.row_height=56
rows=[[x['title'],x['passage'],x['role'],x['comparison'],x['limit'],x['source']['title'],x['source']['scope'],x['source']['url']] for x in ev]
build_sheet('Textual Evidence','Theology | First Melchizedek comparison','These passage locators and access notes support a first comparison, not proof of individual identity or a completed institutional-transmission study.', ['Witness / text','Passage locator','Role in this reading','Comparison','What is not established','Source / translator','Access scope','Source URL'],rows,[30,48,46,54,56,55,62,72])
rows=[]
for debt in f['debts']:
 rows.append([debt['name'],debt['type'],debt['claim'],debt['limit'],'\n'.join(p['sourceSlug']+': turn '+str(p['turn']) for p in debt['passages']),'\n'.join(x['url'] for x in debt['references'])])
rows.append(['Soren Giversen and Birger A. Pearson','Translation used in this edition','Online Melchizedek translation used in the new comparison.','Not attributed as an earlier personal influence. Printed-edition collation is open.','','https://www.gnosis.org/naghamm/melchiz.html'])
rows.append(['Logan Williams','Current editorial scholarship','2023 active-agent interpretation of 11Q13 II 6 and comparison with Mark.','A consulted argument, not an author endorsement, independent manuscript collation, or proof of direct borrowing.','','https://journals.sagepub.com/doi/10.1177/0142064X231191176'])
build_sheet('Intellectual Debts','Theology | Credit and source lineage','An author acknowledgment, an edition-used translation, an AI-introduced lead and an independent scholarly argument are not interchangeable.', ['Name','Type of relationship','Documented contribution','Attribution boundary','Original passages','Source URLs'],rows,[38,36,55,62,40,70])
gates=[['G1','Argument preservation','Scope, mechanism, qualifications and rejected readings are preserved for each argument.','Not assessed','dossier-coverage'],['G2','Source grounding','Worked passages are linked to consulted editions, with differences and alternative accounts.','Not assessed','melchizedek; thomas-passages; temple-case'],['G3','Historical layers','Event, composition, manuscript and interpretation dates remain distinguishable.','Not assessed','tor-version; trauma'],['G4','Attribution and rights','Intellectual debts, quotations, source access and image rights are verified.','Not assessed','bibliography-rights'],['G5','Authorial review','Micah approves the actual chapter wording and the treatment of his arguments.','Not assessed','author-fidelity'],['G6','Narrative continuity','Each chapter develops a question and hands off to the next without forced logical dependence.','Not assessed','chapter-arc; copyedit'],['G7','Publication readiness','Stable build, accessible reader, checked print artifacts, working links and archived approved edition.','Not assessed','publication-qa; release-edition']]
g,gl=build_sheet('Release Gates','Theology | Readiness is evidence, not word count','These are whole-manuscript gates. A completed tool, article draft or word-count target does not pass them automatically.', ['Gate ID','Gate','Acceptance evidence required','Assessment','Related tasks'],gates,[14,30,90,24,58]);g.get_range(f'D7:D{gl}').data_validation={'rule':{'type':'list','values':['Not assessed','In review','Changes required','Passed with evidence']}}
readme=[['Canonical shared plan','theology-wiki/editorial/roadmap.json'],['Published reader','https://v5ma.github.io/theology-wiki/san-reader.html?page=research-roadmap'],['Workbook meaning','A portable planning snapshot. Editable cells are blue. Changes do not update the website or personal board.'],['Verified output','The bounded acceptance criterion has evidence. This is not a truth score, publication approval, or completed book percentage.'],['Dates','Target dates are intentionally blank. Dependencies define order; no background work or completion date is promised.'],['Source coverage','Recorded article links and selected anchors are counted. No developed-article link is not equivalent to unread, irrelevant, rejected or unimportant.'],['Source dates','Export-start dates can predate later conversation turns; do not use them to date every statement.'],['Task IDs','Preserve IDs when recording edits. Unknown IDs need deliberate review before changing the canonical plan.'],['Source integrity','The SHA-256 and byte counts are imported from the preserved corpus metadata.'],['Approval','Only author review can approve wording. Editing a workbook status does not confer public approval.'],['Update procedure','Edit the canonical JSON through a reviewed repository change, run the build and tests, regenerate this workbook, and retain version/hash evidence.'],['Next writing pass','Use the ready-to-start filter, finish a bounded comparison, retain author qualifications, update evidence and the shared task, then regenerate coverage.'],['Existing personal board','The personal browser board remains separate and keeps its own local backup/restore.'],['Baseline commit',r['baselineCommit']],['Snapshot version',r['version']]]
build_sheet('Read Me','Theology | How to use and maintain this plan','Read the limits before interpreting the dashboard. Source-backed planning and author approval are deliberately separate.', ['Field','Meaning / source'],readme,[34,112])
# The dashboard derives its counts from the editable checklist and coverage formulas.
s=S['Overview'];s.get_range('A1:L35').format.font={'name':'Aptos','size':11,'color':ink};s.get_range('A1:L35').format.column_width=12;s.get_range('A1:L1').merge();s.get_range('A1').values=[['THEOLOGY | Research-to-book roadmap']];s.get_range('A1:L1').format={'fill':navy,'font':{'bold':True,'size':22,'color':white},'row_height':42};s.get_range('A2:L3').merge();s.get_range('A2').values=[['A durable checklist, source map and dependency plan. Progress means verified deliverables, not a percentage of theological truth or manuscript completion.']];s.get_range('A2:L3').format={'wrap_text':True,'fill':muted,'row_height':24};s.get_range('A5:D5').merge();s.get_range('A5').values=[['Shared snapshot: '+r['version']]];s.get_range('E5:H5').merge();s.get_range('E5').values=[['As of '+r['updated']]]
for rng,title,formula in [('A7:C7','DELIVERABLES',f'=COUNTA(Checklist!A7:A{last})'),('D7:F7','VERIFIED OUTPUTS',f'=SUM(Checklist!O7:O{last})'),('G7:I7','READY TO START',f'=COUNTIF(Checklist!P7:P{last},"Ready")'),('J7:L7','SOURCE RECORDS',f'=COUNTA(\'Source Coverage\'!A7:A{sl})')]:
 s.get_range(rng).merge();first,end=rng.split(':');s.get_range(first).values=[[title]];s.get_range(rng).format={'fill':teal,'font':{'bold':True,'size':10,'color':white},'row_height':24};a=first[:-1]+'8';b=end[:-1]+'9';s.get_range(a+':'+b).merge();s.get_range(a).formulas=[[formula]];s.get_range(a+':'+b).format={'fill':muted,'font':{'bold':True,'size':28,'color':navy},'row_height':25}
s.get_range('A11:L12').merge();s.get_range('A11').values=[['Begin with Checklist. Change a local status to see Dependencies and Ready to start recalculate. Chapter Map and Source Coverage show the recorded basis of the book; Release Gates remain unassessed until evidence and author review are recorded.']];s.get_range('A11:L12').format={'wrap_text':True,'row_height':26}
s.get_range('A14:D14').merge();s.get_range('A14').values=[['Work phase']];s.get_range('E14').values=[['Tasks']];s.get_range('F14').values=[['Verified']];s.get_range('A14:F14').format={'fill':teal,'font':{'bold':True,'color':white},'row_height':26}
for i,p in enumerate(r['phases'],15):
 s.get_range(f'A{i}:D{i}').merge();s.get_range(f'A{i}').values=[[p['title']]];s.get_range(f'A{i}:D{i}').format={'wrap_text':True,'row_height':35};s.get_range(f'E{i}').formulas=[[f'=COUNTIF(Checklist!$C$7:$C${last},A{i})']];s.get_range(f'F{i}').formulas=[[f'=SUMIF(Checklist!$C$7:$C${last},A{i},Checklist!$O$7:$O${last})']]
chart=s.charts.add('bar',s.get_range('D14:F21'))
# Explicit chart series avoids merged-label ambiguity.
s.charts.delete_all();chart=s.charts.add('bar',{'title':'Deliverables by phase','has_legend':True});chart.bar_options.direction='bar';chart.bar_options.grouping='clustered'
for name,c in [('Tasks','E'),('Verified outputs','F')]:
 series=chart.series.add(name);series.category_formula="'Overview'!$A$15:$A$21";series.formula=f"'Overview'!${c}$15:${c}$21"
chart.legend.position='bottom';chart.set_position('G14','M27')
s.get_range('A24:E24').merge();s.get_range('A24').values=[['Sources linked to developed articles']];s.get_range('F24').formulas=[[f'=COUNTIF(\'Source Coverage\'!F7:F{sl},">0")']]
s.get_range('A25:E25').merge();s.get_range('A25').values=[['Sources with selected turn anchors']];s.get_range('F25').formulas=[[f'=COUNTIF(\'Source Coverage\'!H7:H{sl},">0")']]
s.get_range('A26:E26').merge();s.get_range('A26').values=[['Proposed chapter routes']];s.get_range('F26').formulas=[[f'=COUNTA(\'Chapter Map\'!A7:A{cl})']]
s.get_range('A28:L30').merge();s.get_range('A28').values=[['NEXT SUBSTANTIVE WORK: verify the critical 11Q13 and printed Nag Hammadi editions, extend the Thomas comparison, locate precise Tabor citations, and test the proposed historical carriers. The first Melchizedek comparison is a delivered pass, not closure of that larger investigation.']];s.get_range('A28:L30').format={'fill':muted,'wrap_text':True,'row_height':23}
s.get_range('A32:L33').merge();s.get_range('A32').values=[['SHARED VS PERSONAL: the published roadmap is repository-backed. Excel and browser-board edits are local planning copies. Only a reviewed repository change updates public statuses; only author review approves the manuscript.']];s.get_range('A32:L33').format={'wrap_text':True,'row_height':24};s.freeze_panes.freeze_rows(5)
print('Workbook assembled:',len(S),'sheets',len(rows),'evidence rows')

# Regenerate only in an environment with artifact_tool installed.
for area in ["A2:L3","A11:L12","A28:L30","A32:L33"]:S["Overview"].get_range(area).format.vertical_alignment="center"
for area in ["A8:C9","D8:F9","G8:I9","J8:L9"]:
    S["Overview"].get_range(area).format.horizontal_alignment="center"
    S["Overview"].get_range(area).format.vertical_alignment="center"
(ROOT/"planning").mkdir(exist_ok=True)
SpreadsheetFile.export_xlsx(wb).save(str(ROOT/"planning/Theology-Research-Plan.xlsx"))
print("Workbook saved. Inspect formulas/layout and update planning/workbook-manifest.json input hashes before publication.")
