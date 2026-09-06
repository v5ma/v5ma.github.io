"""Build a synthetic full-study reading and captioned episode from public source data.
Run after tools/build.cjs. Requires the pinned requirements-media.txt, espeak-ng,
and ffmpeg. Model inference happens here, never in the reader or a paid API.
No voice cloning, archive execution, external artwork, music or private text.
"""
from pathlib import Path
import argparse, hashlib, json, math, re, subprocess, tempfile, textwrap
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'products/media'
MODEL = 'hexgrad/Kokoro-82M'
REVISION = '30618d04b530efb8e3ac3bace784f9d4a8dcaa01'
VOICE = 'af_heart'
RATE = 24000

def digest(data):
    return hashlib.sha256(data).hexdigest()

def command(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL)

def timestamp(seconds):
    value = round(seconds * 1000)
    hours, value = divmod(value, 3600000)
    minutes, value = divmod(value, 60000)
    secs, ms = divmod(value, 1000)
    return f'{hours:02}:{minutes:02}:{secs:02}.{ms:03}'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--engine', choices=['kokoro','espeak-preview'], default='kokoro')
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    config = json.loads((ROOT/'data/products.json').read_text())
    episode = config['episodes'][0]
    article = json.loads((ROOT/'data/listening/exodus-to-temple-competing-chronologies.json').read_text())
    if args.engine == 'kokoro':
        import torch
        from huggingface_hub import hf_hub_download
        from kokoro import KModel, KPipeline
        torch.set_num_threads(2)
        get = lambda name: hf_hub_download(MODEL, name, revision=REVISION)
        model = KModel(repo_id=MODEL, config=get('config.json'), model=get('kokoro-v1_0.pth')).to('cpu').eval()
        pipeline = KPipeline(lang_code='a', repo_id=MODEL, model=model, device='cpu')
        voice = torch.load(get('voices/'+VOICE+'.pt'), map_location='cpu', weights_only=True)
        model_meta={'engine':'Kokoro 0.9.4','model':MODEL,'revision':REVISION,'voice':VOICE,'modelLicense':'Apache-2.0','inference':'CPU, no paid API or voice cloning'}
    else:
        model_meta={'engine':'eSpeak local timing preview','voice':'en-us','inference':'Offline rough preview only; not the release narrator'}
    overrides={'BCE':'B C E','11Q13':'eleven Q thirteen','TOR':'Teacher of Righteousness'}
    def speak(text, work):
        spoken = text
        for before, after in overrides.items():
            spoken=re.sub(r'\b'+re.escape(before)+r'\b',after,spoken)
        if args.engine=='kokoro':
            chunks=[result.audio.numpy() for result in pipeline(spoken,voice=voice,speed=1.0) if result.audio is not None]
            if not chunks:
                raise ValueError('No speech for '+text[:80])
            samples=np.concatenate(chunks)
        else:
            txt=work/'speech.txt';wav=work/'speech.wav';txt.write_text(spoken)
            command(['espeak','-v','en-us','-s','165','-f',str(txt),'-w',str(wav)])
            command(['ffmpeg','-v','error','-y','-i',str(wav),'-ar',str(RATE),str(work/'resampled.wav')])
            samples,_=sf.read(work/'resampled.wav',dtype='float32')
        if not np.isfinite(samples).all() or len(samples)<RATE/10 or np.max(np.abs(samples))<.001:
            raise ValueError('Invalid or silent synthesis')
        return np.concatenate([samples,np.zeros(round(.24*RATE),dtype=np.float32)]),spoken
    font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    bold_path='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    # Font files stay on the producer; only rasterized card artwork is output.
    def card(scene,index,total,filename):
        img=Image.new('RGB',(1280,720),'#0b1423');d=ImageDraw.Draw(img)
        d.rectangle((0,0,16,720),fill='#d8b977');d.line((72,104,1208,104),fill='#41566e',width=2)
        f=lambda size,bold=False:ImageFont.truetype(bold_path if bold else font_path,size)
        d.text((72,45),'THEOLOGY  /  MICAH BLUMBERG\'S RESEARCH',font=f(20,True),fill='#d8b977')
        d.text((72,128),f'COUNTING THE DEPARTURE     |     SCENE {index+1:02} OF {total:02}',font=f(17),fill='#a5b7cc')
        y=177
        def wrapped(text,font,width):
            lines=[];line=''
            for word in text.split():
                candidate=(line+' '+word).strip()
                if d.textlength(candidate,font=font)>width and line:lines.append(line);line=word
                else:line=candidate
            if line:lines.append(line)
            return lines
        for line in wrapped(scene['title'],f(44,True),1090):
            d.text((72,y),line,font=f(44,True),fill='#f0f2ee');y+=57
        y+=26
        for line in wrapped(scene['narration'],f(26),1090):
            d.text((72,y),line,font=f(26),fill='#d1dbe7');y+=39
        if y>625:raise ValueError('Narration card overflows: '+scene['id'])
        d.line((72,645,1208,645),fill='#41566e',width=2)
        d.text((72,666),'Synthetic editorial draft  |  Full study, source atlas and competing calculations in the wiki',font=f(17),fill='#a5b7cc')
        img.save(filename)
    def record(kind,identifier,title,rows,source_hash,make_video=False):
        with tempfile.TemporaryDirectory(prefix='theology-media-') as temp:
            work=Path(temp);samples=[];cues=[];time=0;spoken=[];slides=[]
            for i,row in enumerate(rows):
                audio,spoken_text=speak(row['text'],work);duration=len(audio)/RATE
                cues.append({'id':row['id'],'start':round(time,6),'end':round(time+duration,6),'text':row['text'],'spokenText':spoken_text,'sourceSegment':row.get('sourceSegment')})
                time+=duration;samples.append(audio);spoken.append(spoken_text)
                if make_video:
                    image=work/f'scene-{i:03}.png';card(episode['scenes'][i],i,len(rows),image);slides.append((image,duration))
                print(f'{identifier}: {i+1}/{len(rows)} segments',flush=True)
            wave=np.concatenate(samples);sf.write(work/'complete.wav',wave,RATE,subtype='PCM_16')
            stem=OUTPUT/identifier;mp3=stem.with_suffix('.mp3')
            command(['ffmpeg','-v','error','-y','-i',str(work/'complete.wav'),'-c:a','libmp3lame','-b:a','96k','-metadata','title='+title,'-metadata','artist=Synthetic editorial narration; research by Micah Blumberg',str(mp3)])
            vtt=stem.with_suffix('.vtt');vtt.write_text('WEBVTT\n\n'+'\n\n'.join(c['id']+'\n'+timestamp(c['start'])+' --> '+timestamp(c['end'])+'\n'+c['text'] for c in cues)+'\n')
            cuefile=stem.with_suffix('.cues.json');cuefile.write_text(json.dumps({'schema':'theology-media-cues/v1','basis':'Measured generated segment lengths, including an explicit 0.24-second pause. Segment boundaries, not claimed word alignment.','sampleRate':RATE,'cues':cues},indent=2)+'\n')
            textfile=stem.with_suffix('.txt');textfile.write_text(title+'\n\nSynthetic narration; not Micah\'s recorded voice.\n\n'+'\n\n'.join(spoken)+'\n')
            files=[('audio',mp3),('captions',vtt),('cues',cuefile),('spoken-transcript',textfile)]
            if make_video:
                concat=work/'slides.txt';concat.write_text(''.join("file '"+str(image)+"'\nduration "+str(duration)+'\n' for image,duration in slides)+"file '"+str(slides[-1][0])+"'\n")
                movie=stem.with_suffix('.mp4');command(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(concat),'-i',str(work/'complete.wav'),'-t',str(time),'-vf','fps=24,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','23','-c:a','aac','-b:a','96k','-movflags','+faststart',str(movie)])
                poster=stem.with_suffix('.png');poster.write_bytes(slides[0][0].read_bytes());files.extend([('video',movie),('poster',poster)])
            return {'id':identifier,'kind':kind,'title':title,'status':'Synthetic production draft; author and pronunciation review pending','voice':model_meta['engine']+' / '+model_meta['voice'],'sourceSha256':source_hash,'spokenSha256':digest('\n\n'.join(spoken).encode()),'durationSeconds':round(time,6),'segments':len(cues),'scope':'Complete main article including headings; separately labeled source/visual notes are excluded from this recording.' if kind=='article' else 'Short editorial episode; full argument linked separately.','files':[{'role':role,'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':digest(p.read_bytes())} for role,p in files]}
    # Episode first, then the full study. Both must succeed before a release manifest exists.
    assets=[record('episode',episode['id'],episode['title'],[{'id':s['id'],'text':s['narration']} for s in episode['scenes']],digest((ROOT/episode['production']).read_bytes()),True)]
    rows=[{'id':s['id'],'text':s['text'],'sourceSegment':s['id']} for s in article['segments'] if not s['notes']]
    assets.append(record('article',article['slug'],article['title'],rows,article['sourceSha256']))
    manifest={'schema':'theology-recorded-media/v1','version':config['version'],'production':model_meta,'pronunciationOverrides':overrides,'rights':'Original editorial script and typographic cards. No licensed music, external artifact photography, model weights or font files are redistributed. Source citations do not confer scan reuse rights.','review':'Generated recordings are technical production drafts, not approved final audiobooks. Headless playback checks do not certify voice quality or historical conclusions.','assets':assets}
    (OUTPUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (OUTPUT/'MODEL-CREDITS.txt').write_text('Synthetic speech production\n\nModel: '+MODEL+'\nModel revision: '+REVISION+'\nModel weights: Apache-2.0, as declared by the upstream model card.\nInference library: https://github.com/hexgrad/kokoro\nModel card: https://huggingface.co/hexgrad/Kokoro-82M\nVoice: '+VOICE+'; no imitation of Micah Blumberg.\n\n'+manifest['rights']+'\n'+manifest['review']+'\n')
    print(json.dumps({'engine':model_meta,'assets':[{k:a[k] for k in ['id','durationSeconds','segments']} for a in assets]},indent=2))

if __name__=='__main__':
    main()
