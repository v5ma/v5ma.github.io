// Opt-in, locally synthesized sound. No remote audio or copyrighted recordings.
export class RangerAudio{
  constructor(){this.enabled=false;this.context=null;}
  async toggle(){
    if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);
      this.motor=this.context.createOscillator();this.motor.type='sawtooth';this.motor.frequency.value=34;
      const filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=150;this.gain=this.context.createGain();this.gain.gain.value=.07;this.motor.connect(filter);filter.connect(this.gain);this.gain.connect(this.master);this.motor.start();}
    await this.context.resume();this.enabled=!this.enabled;this.master.gain.setTargetAtTime(this.enabled?.32:0,this.context.currentTime,.1);return this.enabled;
  }
  update(speed,active){if(!this.context)return;const now=this.context.currentTime;this.motor.frequency.setTargetAtTime(30+Math.abs(speed)*5,now,.08);this.gain.gain.setTargetAtTime(active?.055+Math.min(Math.abs(speed),20)*.004:0,now,.08);}
  tone(frequency=520,duration=.15){if(!this.context||!this.enabled)return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(.2,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g);g.connect(this.master);o.start();o.stop(c.currentTime+duration);}
  horn(){this.tone(196,.4);this.tone(247,.4);}
}
