#!/usr/bin/env python3
"""Render Leo's Guild's ORIGINAL Resonance score and sound library.

No downloaded recordings, copyrighted soundtrack excerpts, model inference or
external runtime services are used. All notes, arrangements and waveforms below
are authored for this game. numpy + scipy generate PCM; ffmpeg packages Vorbis.
The manifest retains decoded-PCM hashes, packaged hashes, duration and levels.
Run from any directory: python scripts/render-resonance-audio.py
"""
from pathlib import Path
import hashlib, json, math, subprocess, wave
import numpy as np
from scipy.signal import lfilter

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'resonance'; OUT.mkdir(parents=True,exist_ok=True)
SR=32000
RNG=np.random.default_rng(20260911)
manifest={'version':1,'origin':'Original compositions and procedural sound design authored for Leo\'s Guild. No third-party audio.','sampleRate':SR,'files':[]}

def hz(note): return 440*2**((note-69)/12)
def fade(a,attack=.01,release=.06):
    a=a.copy(); n=min(len(a),max(1,int(attack*SR))); a[:n]*=np.linspace(0,1,n)
    n=min(len(a),max(1,int(release*SR))); a[-n:]*=np.linspace(1,0,n); return a

def voice(kind,note,duration,seed=0):
    n=int((duration+(.65 if kind in ('lute','dulcimer','bell') else .18))*SR)
    t=np.arange(n)/SR; f=hz(note); rnd=np.random.default_rng(seed+int(note)*191+len(kind)*47)
    if kind in ('lute','dulcimer'):
        # Dispersive, decaying string partials with a soft plectrum transient.
        a=np.zeros(n); bright=1.0 if kind=='lute' else .78
        for k in range(1,13 if kind=='lute' else 17):
            if f*k>=SR*.45: break
            detune=1+(.000045 if kind=='lute' else .00018)*k*k
            decay=(1.25 if kind=='lute' else 2.0)/(1+k*.2)
            a+=np.sin(2*np.pi*f*k*detune*t+rnd.uniform(-.04,.04))*np.exp(-t/decay)/(k**bright)
        a+=lfilter([.1],[1,-.9],rnd.standard_normal(n))*.07*np.exp(-t*90)
        a=fade(a,.004,.2)*.28
    elif kind=='flute':
        vib=0.012*np.sin(2*np.pi*4.7*t)*np.minimum(1,t*2)
        phase=2*np.pi*f*t+vib
        a=(np.sin(phase)+.2*np.sin(phase*2)+.08*np.sin(phase*3))*.38
        breath=lfilter([.13],[1,-.87],rnd.standard_normal(n))*.035
        a=(a+breath)*(1+.022*np.sin(t*2*np.pi*1.4)); a=fade(a,.08,.18)
    elif kind in ('strings','bass'):
        a=np.zeros(n)
        for k in range(1,9):
            if f*k>=SR*.45:break
            # Three subtly detuned string voices, no square/saw oscillator loop.
            for d in [-.0009,0,.0008]:
                a+=np.sin(2*np.pi*f*k*(1+d)*t+.016*k*np.sin(2*np.pi*4.3*t))/(k**1.5*3)
        a=fade(a,.22 if kind=='strings' else .10,.26)*(.23 if kind=='strings' else .30)
    elif kind=='bell':
        a=np.zeros(n)
        for r,g,decay in [(1,1,1.9),(2.01,.5,1.1),(2.76,.24,.7),(4.04,.13,.45),(5.42,.06,.3)]:
            if f*r<SR*.45:a+=g*np.sin(2*np.pi*f*r*t)*np.exp(-t/decay)
        a=fade(a,.006,.2)*.34
    elif kind=='drum':
        f0=75 if note<50 else 130
        phase=2*np.pi*(f0*t+(65/24)*(1-np.exp(-24*t)))
        body=np.sin(phase)*np.exp(-t*10)
        skin=lfilter([.3],[1,-.7],rnd.standard_normal(n))*np.exp(-t*27)
        a=fade((body*.65+skin*.22),.003,.03)
    elif kind=='shaker':
        noise=rnd.standard_normal(n); a=lfilter([.45,-.45],[1,-.3],noise)*np.exp(-t*24)*.1; a=fade(a,.004,.02)
    else: raise ValueError(kind)
    return a.astype(np.float32)

cache={}
def instrument(kind,note,duration):
    key=(kind,note,round(duration,4))
    if key not in cache:cache[key]=voice(kind,note,duration,seed=1123)
    return cache[key]

def add(track,sample,at,gain=1,pan=0):
    i=int(at*SR)
    if i>=len(track):return
    n=min(len(sample),len(track)-i); sample=sample[:n]*gain
    # Constant-power panning; useful side instruments stay off hard extremes.
    left=math.cos((pan+1)*math.pi/4);right=math.sin((pan+1)*math.pi/4)
    track[i:i+n,0]+=sample*left;track[i:i+n,1]+=sample*right

def chamber(track,wet=.2):
    dry=track.copy(); ret=track.copy()
    for delay,gain in [(.043,.22),(.081,.18),(.137,.16),(.211,.13),(.307,.11),(.433,.08),(.619,.055)]:
        k=int(delay*SR)
        if k<len(track):ret[k:]+=dry[:-k,::-1]*gain*wet
    return ret

def write(name,a,music=False,loop=False,metadata=None):
    a=np.nan_to_num(a).astype(np.float32)
    if a.ndim==1:a=np.stack([a,a],axis=1)
    if loop:
        # Eight-millisecond equal-power edge ramps remove clicks without
        # changing the exact musical bar count or ambient-loop duration.
        n=min(int(.008*SR),len(a)//8)
        ramp=np.sin(np.linspace(0,np.pi/2,n))[:,None]
        a[:n]*=ramp; a[-n:]*=ramp[::-1]
    peak=float(np.max(np.abs(a))); rms=float(np.sqrt(np.mean(a*a)))
    # Original arrangements retain dynamics; all output stays below -1.5 dBFS.
    target=.12 if music else .20; gain=min(target/max(rms,.000001),.84/max(peak,.000001))
    a*=gain
    pcm=(np.clip(a,-.99,.99)*32767).astype('<i2'); wav=OUT/(name+'.wav')
    with wave.open(str(wav),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes(pcm.tobytes())
    path=wav
    if music or loop:
        path=OUT/(name+'.ogg')
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-map_metadata','-1','-c:a','libvorbis','-q:a','4' if music else '3',str(path)],check=True)
        wav.unlink()
    record={'file':path.name,'bytes':path.stat().st_size,'duration':round(len(pcm)/SR,3),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'pcmSha256':hashlib.sha256(pcm.tobytes()).hexdigest(),'peak':round(float(np.max(np.abs(pcm.astype(np.float32)/32768))),5),'rms':round(float(np.sqrt(np.mean((pcm.astype(np.float32)/32768)**2))),5),'loop':loop,'kind':'music' if music else 'ambience' if loop else 'effect'}
    if metadata:record.update(metadata)
    manifest['files'].append(record);print(path.name,record['duration'],record['bytes'],flush=True)

# Explicit, original eight-bar melodies. Each 64-bar cue has intro, statement,
# reply, development, sparse bridge, recapitulation and a resolving turnaround.
MELODIES={
 'vinci':[[0,2,4,7],[9,7,4,2],[4,5,7,9],[7,4,2,0],[5,7,9,12],[11,9,7,4],[2,4,5,2],[4,2,0,None]],
 'market':[[0,4,7,4,2,4],[5,9,7,5,4,2],[4,7,12,11,9,7],[2,5,9,7,4,2],[0,4,7,9,7,4],[5,7,9,12,11,9],[7,4,2,4,5,2],[4,2,0,None,7,None]],
 'lamplight':[[0,None,7,4],[2,None,5,None],[4,7,None,9],[7,None,4,None],[5,None,9,7],[4,None,2,None],[2,5,None,4],[2,None,0,None]],
 'underways':[[0,None,7,None],[3,None,2,None],[5,None,10,7],[3,None,2,None],[8,None,7,None],[5,None,3,None],[2,None,5,None],[2,None,0,None]],
 'pursuit':[[0,7,3,7],[2,7,5,7],[3,10,7,5],[2,7,2,0],[8,12,10,7],[5,10,8,7],[2,5,7,5],[3,2,0,None]],
}

def score(name,bpm,root,minor=False):
    global cache
    beat=60/bpm; beats=4; bars=64; length=bars*beats*beat
    a=np.zeros((int((length+2)*SR),2),np.float32)
    prog=[0,5,9,7,0,5,2,7] if not minor else [0,8,3,7,0,5,8,7]
    for bar in range(bars):
        section=bar//8; measure=bar%8; pos=bar*beats*beat; chord=prog[measure]; base=root+chord
        third=3 if minor and chord in (0,5,7) else 4
        chordnotes=[base,base+third,base+7]
        density=[.45,.72,.83,.92,.38,.72,.88,.56][section]
        add(a,instrument('bass',base-24,beat*3.4),pos,.65*density,0)
        # Plucked accompaniment alternates voicing and accents, not random notes.
        order=[0,2,1,2,0,1,2,1] if section%2==0 else [0,1,2,1,2,1,0,2]
        for j,n in enumerate(order):
            if section in (0,4) and j%2:continue
            kind='dulcimer' if name=='market' else 'lute'
            add(a,instrument(kind,chordnotes[n]-12,beat*.65),pos+j*beat/2,.48*density*(.9 if j%2 else 1),-.34)
        if section not in (0,4) or name in ('lamplight','underways'):
            for j,n in enumerate(chordnotes):add(a,instrument('strings',n-12,beat*3.6),pos+.025*j,.38*density,.25+j*.08)
        melody=MELODIES[name][measure]; unit=beats*beat/len(melody)
        if section not in (0,4):
            for j,n in enumerate(melody):
                if n is None:continue
                transpose=12 if section==3 and measure>=4 else 0
                # In the reprise the first phrase becomes an answer in the low register.
                kind='lute' if section in (2,5) else 'flute'
                pitch=root+n+transpose-(12 if kind=='lute' else 0)
                add(a,instrument(kind,pitch,unit*.83),pos+j*unit+.014,.65*density,.17)
        elif section==4 and measure%2==0:
            add(a,instrument('bell',root+[0,7,5,2][measure//2]+12,beat*2),pos,.20,-.18)
        if name not in ('lamplight','underways') and section not in (0,4):
            for j in (0,2):add(a,instrument('drum',38 if j==0 else 51,.22),pos+j*beat,.20*density,0)
            for j in range(8):add(a,instrument('shaker',60,.10),pos+j*beat/2,.18*density*(-.0+1),.42)
        if name=='pursuit':
            for j in range(8):add(a,instrument('strings',root-12+(7 if j%4 in (2,3) else 0),beat*.32),pos+j*beat/2,.24*density,-.3)
        if name=='underways' and measure in (2,6):add(a,instrument('bell',root+19,beat*2.2),pos+beat,.17,.38)
    a=chamber(a,.42 if name in ('underways','lamplight') else .26)
    # Fold only the composed release tail, preserving exactly 64 bars per loop.
    n=int(length*SR); tail=a[n:];a=a[:n];a[:len(tail)]+=tail
    write(name,a,music=True,loop=True,metadata={'bars':64,'bpm':bpm,'title':{'vinci':'Morning in Vinci','market':"The Artisans' Round",'lamplight':'Workshops by Lamplight','underways':'The Water Beneath','pursuit':'Across the Copper Roofs'}[name]})
    cache={}

for spec in [('vinci',96,62,False),('market',112,67,False),('lamplight',76,60,False),('underways',72,57,True),('pursuit',124,62,True)]:score(*spec)

# Foley: reproducible varied material transients, not a persistent engine tone.
def noise(seconds,cut=.7,seed=1):
    r=np.random.default_rng(seed);n=int(seconds*SR);return lfilter([1-cut],[1,-cut],r.standard_normal(n)).astype(np.float32)
def thump(seconds,freq,decay=13):
    t=np.arange(int(seconds*SR))/SR;return np.sin(2*np.pi*freq*t)*np.exp(-t*decay)
def effect(name,a):write(name,fade(np.asarray(a,dtype=np.float32),.004,.025))
for material in ('stone','wood','gravel'):
    for i in range(3):
        n=noise(.27,{'stone':.68,'wood':.91,'gravel':.45}[material],36+i)
        t=np.arange(len(n))/SR
        body=thump(.27,{'stone':130,'wood':90,'gravel':75}[material]+i*8,20)
        a=n*np.exp(-t*(24 if material!='gravel' else 16))*.8+body*.25
        if material=='wood':a+=np.sin(2*np.pi*320*t)*np.exp(-t*45)*.06
        effect('step-'+material+'-'+str(i),a)
for name,seconds,cut,decay,pitch in [('swing',.28,.8,9,0),('impact',.28,.78,18,130),('block',.38,.5,20,410),('hurt',.42,.96,12,65),('land',.36,.9,16,82),('paper',.48,.25,8,0),('reload',.75,.6,10,0),('loaded',.28,.55,18,230),('sling',.33,.6,12,0),('cover',.38,.91,15,85),('jump',.23,.9,14,0),('collision',.65,.75,12,73),('brake',.5,.97,9,185),('enter',.6,.91,13,105),('exit',.42,.8,18,90),('switch',.22,.8,22,260),('empty',.18,.7,28,120),('lever',.8,.77,8,300),('coin',.5,.4,18,1800)]:
    n=noise(seconds,cut,len(name)*67);t=np.arange(len(n))/SR
    a=n*np.exp(-t*decay)
    if pitch:a+=np.sin(2*np.pi*pitch*t)*np.exp(-t*decay)*(.25 if pitch<900 else .15)
    if name=='reload':a=noise(seconds,.8,26)*(np.exp(-((t-.08)/.08)**2)*.8+np.exp(-((t-.38)/.07)**2)*.6+np.exp(-((t-.65)/.04)**2)*.4)
    effect(name,a)
# Creaks are brief filtered friction with changing wood resonances.
t=np.arange(int(1.05*SR))/SR;creak=noise(1.05,.96,4)*.4+np.sin(2*np.pi*(125*t+18*t*t))*np.sin(np.pi*t/1.05)**2*.09
effect('door',creak);effect('windup',voice('lute',43,.5)*.6+np.pad(noise(.3,.9,77)*.15,(0,len(voice('lute',43,.5))-int(.3*SR))))
# Gentle UI and narrative motifs share the musical palette.
for name,notes,kind,gap in [('ui-move',[74],'lute',.08),('ui-select',[67,74],'lute',.08),('ui-back',[67,62],'lute',.08),('success',[62,66,69,74],'bell',.12),('discovery',[57,64,69,76],'bell',.15),('special',[50,57,62,69],'strings',.12),('magic',[74,81,86],'bell',.12),('bell',[50,62],'bell',.06),('horn',[50,57],'flute',.04)]:
    length=3 if name not in ('ui-move','ui-select','ui-back') else .65
    a=np.zeros((int(length*SR),2),np.float32)
    for i,n in enumerate(notes):add(a,voice(kind,n,.28 if length<1 else .9),i*gap,.55,0)
    write(name,chamber(a,.25))
# Birdcalls; no speech-like synthetic crowd babble.
t=np.arange(int(.8*SR))/SR;phase=2*np.pi*(1800*t+250*np.sin(2*np.pi*3*t)/(2*np.pi*3));a=np.sin(phase)*(.8*np.exp(-((t-.15)/.08)**2)+.55*np.exp(-((t-.45)/.07)**2));effect('bird',a*.3)
# Local ambient beds. Vehicle layers are gain/rate-modulated by real movement.
for name,cut,seconds in [('wind',.995,12),('water',.93,12),('room',.998,10),('wheel',.91,4),('chain',.82,4)]:
    a=noise(seconds,cut,2026+len(name));t=np.arange(len(a))/SR
    if name=='water':a*=.6+.15*np.sin(t*1.7)+.1*np.sin(t*4.1)
    if name=='wheel':a=a*(.6+.2*np.cos(t*np.pi*6))+np.sin(t*np.pi*2*51)*.013
    if name=='chain':a*=.2+.8*(.5+.5*np.sin(t*np.pi*2*9))**8
    stereo=np.column_stack([a,np.roll(a,int(.017*SR))])
    write('ambient-'+name,stereo,loop=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'LICENSE.txt').write_text("Leo's Guild - Resonance\nOriginal procedural compositions, arrangements and sound design created for Micah Blumberg / SVGN, 2026.\nNo third-party recordings or commercial-game music are included.\nThe repository owner may use, modify and redistribute these generated assets with this game.\nReproducible source: scripts/render-resonance-audio.py.\n")
print('TOTAL',len(manifest['files']),sum(f['bytes'] for f in manifest['files']),flush=True)
