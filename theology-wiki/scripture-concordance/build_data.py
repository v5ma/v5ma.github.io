"""Canonical, individually reviewed passage selection. Offline deterministic export."""
from pathlib import Path
import json
P=Path(__file__).resolve().parent
rows=[]
def group(book,code,ch,agent,theme,lines,part='Biblical base',edition='World English Bible',url=None):
    for line in lines.strip().splitlines():
        bits=line.split('|'); verse=int(bits[0]); gloss=bits[1]; a=bits[2] if len(bits)>2 and bits[2] else agent; t=bits[3] if len(bits)>3 and bits[3] else theme
        rows.append(dict(id=f'{code}-{ch:02}-{verse:02}',reference=f'{book} {ch}:{verse}',book=book,chapter=ch,verse=verse,corpus=part,edition=edition,source_id=f'{code}-{ch:02}',source_url=url or f'https://ebible.org/engwebp/{code.upper()}{ch:02}.htm',textual_subject=a,theme=t,textual_summary=gloss,comparison_links=[]))
group('Exodus','exo',5,'Pharaoh','Authority','2|Pharaoh refuses the command to release Israel.')
group('Daniel','dan',3,'King and officials','Allegiance','''1|The king sets up a golden image.||Images
4|A herald addresses peoples and languages.
5|Music signals the command to worship the image.
6|Refusal is punished by the fiery furnace.||Enforcement
12|Named officials are accused of refusing worship.
15|The king challenges the possibility of divine rescue.||Authority
17|The accused affirm God's ability to deliver them.|Three accused officials|Perseverance
18|They refuse worship even without promised rescue.|Three accused officials|Perseverance''')
group('Daniel','dan',4,'King of Babylon','Authority','''30|The king credits his own power for Babylon.
31|A heavenly voice announces the kingdom's removal.|Heavenly voice|Judgment
32|Royal humiliation lasts until higher sovereignty is acknowledged.||Judgment''')
group('Daniel','dan',7,'Beasts and horn','Kingdom and person','''3|Four different beasts emerge from the sea.
7|The fourth beast crushes and has ten horns.
8|Another horn has eyes and boastful speech.||Authority
11|The speaking beast is destroyed in the vision.||Judgment
17|The interpretation calls the four beasts four kings.
21|The horn wars against the holy ones.||War
22|Judgment and kingdom follow for the holy ones.|Ancient of Days and holy ones|Judgment
23|The interpretation calls the fourth beast a kingdom.
24|Horns are interpreted as kings and another ruler.
25|The ruler challenges divine order and wears down saints.||Enforcement
26|The court removes the ruler's dominion.|Heavenly court|Judgment
27|The kingdom is given to the holy people.|Holy people|Restoration''')
group('Daniel','dan',8,'Fierce king','Authority','''23|A ruler marked by severity and intrigue arises.
24|Destructive power is described as not his own.||War
25|Deceit and self-exaltation end in destruction.||Deception''')
group('Daniel','dan',11,'Ruler and forces','Authority','''31|Forces profane the sanctuary and install an abomination.||Enforcement
36|The king exalts himself above gods.''')
group('Ezekiel','ezk',28,'Prince of Tyre','Authority','''2|A human ruler claims divine status.
9|Mortal vulnerability challenges the claim to be God.''',edition='King James Version',url='https://www.biblegateway.com/passage/?search=Ezekiel+28&version=KJV')
group('Isaiah','isa',14,'King of Babylon','Kingdom and person','4|The taunt explicitly addresses Babylon\'s king.')
assert len(rows)==32
group('Matthew','mat',7,'Jesus teaching disciples','Discernment','''15|False prophets are described through sheep and wolves.
16|Conduct is identified as the test of prophets.
21|Addressing Jesus as Lord is distinguished from obedience.
22|Claims of prophecy and mighty works are insufficient.
23|Workers of lawlessness are rejected.''')
group('Matthew','mat',11,'John and Elijah','Typology','14|John is identified with the expected Elijah.')
group('Matthew','mat',20,'Jesus teaching disciples','Service','''25|Rulers' domination supplies the contrast.
26|Greatness among disciples is defined through service.''')
group('Matthew','mat',24,'Jesus teaching disciples','Discernment','''4|The audience is warned against being misled.
5|Many claim messianic identity and mislead.
6|Wars do not by themselves mean the end.||War
7|Conflict and famines occur in different places.||Subsistence
11|False prophets mislead many.
12|Increasing lawlessness accompanies the cooling of love.||Service
13|Endurance is required.|Disciples|Perseverance
15|The warning explicitly invokes Daniel's abomination.||Intertext
23|A local claim to the Christ is not sufficient.
24|False messiahs and prophets display misleading signs.
36|The day and hour are not known.||Chronology''')
group('Luke','luk',1,'John in relation to Elijah','Typology','17|John comes in Elijah\'s spirit and power.')
group('John','jhn',1,'John the Baptizer','Typology','21|John denies being Elijah when questioned.')
group('2 Thessalonians','2th',2,'Lawless adversary','Authority','''3|Rebellion and the man of sin precede the day.
4|The adversary exalts himself and claims divine standing.
6|A restraining factor delays revelation.||Chronology
7|Lawlessness is already at work under restraint.||Typology
8|The revealed adversary is ended by the Lord.|Lord and adversary|Judgment
9|The adversary's coming includes deceptive signs.||Deception
10|Deception concerns rejection of the love of truth.||Deception
11|The passage describes a consequent delusion.||Judgment
12|Judgment concerns disbelief and delight in wrongdoing.||Judgment''')
group('1 John','1jn',2,'Antichrists and confession','Typology','''18|Expected antichrist and already-present antichrists coexist.
22|Antichrist is defined through denial of Father and Son.||Confession''')
group('1 John','1jn',4,'Spirits and confession','Discernment','''1|Spirits and false prophets must be tested.
3|Antichrist's spirit is already present; confession matters.||Confession''')
group('2 John','2jn',1,'Deceivers','Confession','7|Deception and antichrist concern Jesus coming in flesh.')
group('1 Thessalonians','1th',5,'Those declaring security','Chronology','3|A claim of peace precedes unexpected destruction.')
assert len(rows)==68
group('Revelation','rev',6,'Horsemen','War','''2|A crowned rider goes out conquering.
4|Another rider removes peace from the earth.
5|A rider carries scales.||Subsistence
6|A voice announces grain prices and commodity limits.||Subsistence
8|Death and Hades receive destructive authority.||Judgment''')
group('Revelation','rev',12,'Dragon','War','''3|A dragon has seven heads and ten horns.||Images
9|The dragon is identified as devil and Satan.||Agent identity
17|The dragon wars against the woman's other offspring.''')
group('Revelation','rev',13,'First beast','Authority','''1|A beast rises with heads, horns and blasphemous names.||Images
2|The dragon gives it power, throne and authority.
3|A healed wound is followed by wonder and following.||Reception
4|Worship and claims of military invincibility follow.||Allegiance
5|Boastful speech and a limited term are given.
6|Blasphemies target God and heaven's inhabitants.
7|War against saints accompanies authority across peoples.||War
8|Earth-dwellers' worship is described with an exception.||Allegiance
9|The hearer is called to attend.|Hearer|Discernment
10|Captivity and sword introduce a call for endurance.|Saints|Perseverance
11|Another beast appears lamb-like but speaks dragon-like.|Second beast|Images
12|It directs worship toward the first beast.|Second beast|Allegiance
13|It performs signs, including fire before observers.|Second beast|Signs
14|Signs accompany the demand to make an image.|Second beast|Images
15|The speaking image is associated with lethal enforcement.|Second beast and image|Enforcement
16|It imposes a mark across social categories.|Second beast|Enforcement
17|Buying and selling depend on the specified mark.|Second beast's economic requirement|Material access
18|The hearer is invited to calculate the number.|Hearer|Interpretive number''')
group('Revelation','rev',14,'Angel warning hearers','Judgment','''9|Worship, image and mark are joined in a warning.||Allegiance
10|The warning describes divine wrath.
11|No rest is described for those receiving the mark.
12|Faithfulness identifies the endurance of the saints.|Saints|Perseverance''')
group('Revelation','rev',16,'Apocalyptic agents','War','''12|The Euphrates dries for kings from the east.|Sixth angel and kings|Geography
13|Spirits emerge from dragon, beast and false prophet.|Three named agents|Agent identity
14|Performing signs, the spirits gather rulers for war.|Spirits and rulers|Signs
15|A blessing calls for watchfulness.|Speaker and hearer|Perseverance
16|The gathering place is named Harmagedon.|Gathered rulers|Geography''')
group('Revelation','rev',17,'Woman, beast and kings','Kingdom and person','''1|The woman is introduced beside many waters.|Woman|Images
3|The woman sits on a beast with blasphemous names.|Woman and beast|Images
6|The woman is described through the blood of witnesses.|Woman|Enforcement
8|The beast's appearing prompts astonishment.|Beast and observers|Reception
9|The heads receive a geographical interpretation.|Seven heads|Geography
10|The heads also receive an interpretation as kings.|Kings|Kingdom and person
11|The beast is related to the kings and destruction.|Beast|Kingdom and person
12|Ten horns are interpreted as rulers with brief authority.|Ten kings|Kingdom and person
13|The rulers transfer power and authority to the beast.|Kings and beast|Delegation
14|The Lamb defeats the opposing rulers.|Lamb and kings|Judgment
15|The waters are interpreted as peoples and languages.|Peoples|Geography
16|The horns and beast turn against the woman.|Beast and rulers|War
17|Their joint purpose is described within divine sovereignty.|God and rulers|Delegation
18|The woman is interpreted as a city ruling kings.|City|Kingdom and person''')
group('Revelation','rev',18,'Babylon and trading partners','Commerce','''3|Rulers and merchants participate in the city's wealth.
7|The city boasts that mourning cannot reach her.|City|Authority
11|Merchants mourn because nobody buys their goods.
17|Maritime workers witness the loss of riches.
19|Those enriched through shipping lament the destruction.
23|Merchants and deception figure in the city's indictment.||Deception
24|The city's indictment includes the blood of victims.||Enforcement''')
group('Revelation','rev',19,'Beast and allied forces','War','''19|Beast and rulers gather against the mounted figure.
20|Beast and false prophet receive their final judgment.|Beast and false prophet|Judgment''')
group('Revelation','rev',20,'Devil, beast and false prophet','Judgment','10|The named adversaries receive a shared final punishment.')
group('Revelation','rev',21,'God with humanity','Restoration','4|Death, mourning and pain are ended.')
assert len(rows)==128
group('Didache','did',16,'Community and world-deceiver','Discernment','''3|False prophets appear; affection gives way to hostility.
4|The world-deceiver appears with divine pretension and signs.|World-deceiver|Deception
5|The text describes a trial and endurance.|Faithful community|Perseverance
6|Truth's signs include heaven, trumpet and resurrection.|Signs and resurrected dead|Signs
7|The resurrection statement is qualified.|Resurrected dead|Judgment
8|The Lord appears on heaven's clouds.|Lord|Restoration''',part='Wider corpus',edition='Kirsopp Lake translation; chapter 16 section numbers',url='https://www.earlychristianwritings.com/text/didache-lake.html')
group('Ascension of Isaiah','ais',4,'Beliar and king','Authority','''2|Beliar descends as a lawless king linked to matricide.
3|The ruler persecutes the apostles' community.||Enforcement
4|Worldly powers follow the ruler.||Allegiance
5|The ruler performs impossible celestial signs.||Signs
6|He speaks and acts in imitation of the Beloved.||Deception
7|People believe his claim.||Reception
8|People sacrifice to him and serve him.||Allegiance
11|His image appears in every city.||Images
12|His rule is given a precise duration.||Chronology
14|The Lord defeats Beliar after a stated interval.|Lord and Beliar|Judgment''',part='Wider corpus',edition='R. H. Charles translation; chapter 4 section numbers',url='https://www.earlychristianwritings.com/text/ascension.html')
group('4 Ezra / 2 Esdras','2es',12,'Eagle and interpreting voice','Intertext','''11|The eagle is interpreted as Daniel's fourth kingdom.
13|A sequence of rulers is described.|Rulers|Kingdom and person''',part='Wider corpus',edition='World English Bible Classic, 2 Esdras; 4 Ezra core',url='https://ebible.org/eng-web/2ES12.htm')
group('1 Enoch','eno',62,'Earthly rulers and Elect One','Judgment','3|Rulers recognize righteous judgment on the glorious throne.',part='Wider corpus',edition='R. H. Charles translation',url='https://sacred-texts.com/bib/boe/boe065.htm')
group('1 Enoch','eno',63,'Earthly rulers','Judgment','10|Unrighteous gain cannot prevent descent to Sheol.',part='Wider corpus',edition='R. H. Charles translation',url='https://sacred-texts.com/bib/boe/boe066.htm')
assert len(rows)==148
links={'butler':['rev-13-03','rev-13-04','rev-13-12','rev-17-08'],'images':['rev-13-04','rev-13-11','rev-13-12','rev-13-14','rev-13-15','2th-02-04','dan-03-01'],'authority':['dan-07-08','dan-11-36','2th-02-04','rev-13-05'],'food-access':['rev-06-05','rev-06-06','rev-13-16','rev-13-17','rev-18-11'],'war-statements':['rev-06-04','rev-13-04','rev-13-07','rev-16-14'],'reagan-survival':['rev-13-03','rev-17-08'],'napoleon-reception':['rev-13-01','rev-13-18'],'hitler-oath':['dan-03-04','dan-03-05','dan-03-12','rev-13-04'],'clinton-reception':['rev-13-18'],'obama-reception':['1jn-02-18'],'reagan-reception':['1jn-02-18'],'egypt-kingship':['exo-05-02','ezk-28-02','ezk-28-09'],'policy-records':['mat-24-06','1th-05-03','rev-16-14']}
for key,refs in links.items():
    for ref in refs: next(r for r in rows if r['id']==ref)['comparison_links'].append(key)
for i,r in enumerate(rows):
    r['sequence']=i+1
    r['assignment_status']='Documentary comparison linked' if r['comparison_links'] else 'Textual study; no contemporary assignment'
    r['source_access']='Selected verse/section and its containing translated passage consulted on 2026-09-17; no original-language manuscript collation.'
    r['relation_note']='A linked dossier asks a comparison question. It does not establish prophetic identity, universal audience response, or an implemented act from a statement alone.'
    if r['corpus']=='Biblical base': r['canon_note']='Within the shared 66-book biblical base used for this edition.'
    elif r['book']=='1 Enoch': r['canon_note']='Outside the 66-book base; Enoch is included in the Ethiopian Orthodox canon. See the canon source in README.'
    elif r['book']=='4 Ezra / 2 Esdras': r['canon_note']='Outside the 66-book base; names and canonical placement vary. This locator uses chapter 12 of 2 Esdras in the linked edition.'
    else:r['canon_note']='Outside the 66-book base. This is a wider early-Christian textual comparison, not a claim that one council removed the work.'
(P/'passages.json').write_text(json.dumps({'schema_version':1,'edition_date':'2026-09-17','title':'148 selected end-times and authority passages','selection_policy':'128 individual biblical verses and 20 individually numbered sections from a wider corpus. This is an editorial concordance, not a claimed exhaustive or objectively ranked list. No politician is scored, ranked, or assigned a match total.','political_identifications':'The existing Trump interpretation is attributed to Micah Blumberg. Documentary comparisons below neither endorse nor refute political or supernatural identities.','scope':'No complete verse-by-verse review of Revelation or all apocalyptic literature is claimed. Linked records remain at their stated evidence level; unassigned passages are retained.','passages':rows},indent=2,ensure_ascii=True)+'\n')
print('148 passage rows exported.')
