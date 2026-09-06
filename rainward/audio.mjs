export function createAudio(settings,getMode){
let audio=null,noiseSource=null;
function audioStart(){if(!audio){try{audio=new AudioContext();const buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()-.5)*.26;noiseSource=audio.createBufferSource();noiseSource.buffer=buffer;noiseSource.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;const gain=audio.createGain();gain.gain.value=.14;noiseSource.connect(filter);filter.connect(gain);gain.connect(audio.destination);noiseSource.start();}catch{}}
 if(audio&&!settings.mute&&['play','pack'].includes(getMode())&&!document.hidden)audio.resume().catch(()=>{});else audio?.suspend().catch(()=>{});
}
function sound(event){if(!audio||settings.mute||audio.state!=='running')return;const pitches={pickup:740,crafted:530,shot:95,damage:67,complete:600,reloaded:270};if(!pitches[event.type])return;const oscillator=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;oscillator.type='triangle';oscillator.frequency.setValueAtTime(pitches[event.type],t);oscillator.frequency.exponentialRampToValueAtTime(pitches[event.type]*.6,t+.14);gain.gain.setValueAtTime(.07,t);gain.gain.exponentialRampToValueAtTime(.0001,t+.18);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(t+.2);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
return {start:audioStart,event:sound};
}
